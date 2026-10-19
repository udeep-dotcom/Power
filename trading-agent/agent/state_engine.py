"""Deterministic state engine: live order book + trades -> one compact snapshot.

Every number Jev sees is computed here, in code. The snapshot is the *only*
input to the model.

Causality rules (enforced, not assumed):
  1. Events must be ingested in non-decreasing `recv_ts` order, else
     `CausalityError`.
  2. `snapshot(as_of)` uses only events with `recv_ts <= as_of`. Ingesting
     later events never changes an earlier snapshot.
  3. The snapshot records `max_input_ts`; `max_input_ts <= as_of` is asserted.
"""

from __future__ import annotations

import json
import math
from collections import deque
from dataclasses import asdict, dataclass

from .types import BookEvent, Event, PortfolioView, Side, TradeEvent

MS_PER_YEAR = 365 * 24 * 3600 * 1000
# Conservative token estimate: ~3 chars/token for compact JSON with digits.
CHARS_PER_TOKEN = 3
MAX_SNAPSHOT_TOKENS = 400


class CausalityError(RuntimeError):
    pass


@dataclass(frozen=True)
class StateEngineConfig:
    depth_levels: int = 5
    bar_ms: int = 60_000                 # resampling bar for realized vol
    rv_window_ms: int = 60 * 60_000      # 1h of 1m bars
    flow_window_ms: int = 5 * 60_000
    short_ret_ms: int = 15 * 60_000
    long_ret_ms: int = 60 * 60_000

    @property
    def retention_ms(self) -> int:
        return 2 * max(self.rv_window_ms, self.flow_window_ms, self.long_ret_ms)


@dataclass(frozen=True)
class Snapshot:
    symbol: str
    as_of: int
    max_input_ts: int
    data_age_ms: int
    mid: float
    spread_bps: float
    book_imbalance: float        # top-N depth, (bid - ask) / (bid + ask), in [-1, 1]
    microprice_dev_bps: float    # microprice vs mid
    flow_imbalance: float        # signed aggressor volume share, in [-1, 1]
    trade_count: int
    rv_ann: float | None         # annualized realized vol of bar log returns
    ret_short_bps: float | None
    ret_long_bps: float | None
    inventory: float
    exposure_pct: float
    unrealized_pnl_bps: float
    drawdown_pct: float
    daily_pnl_pct: float

    def to_state(self) -> str:
        """Compact JSON handed to Jev. Field names are human-readable on purpose."""
        d = asdict(self)
        for k, v in d.items():
            if isinstance(v, float):
                d[k] = _round(v)
        text = json.dumps(d, separators=(",", ":"))
        est = estimate_tokens(text)
        if est > MAX_SNAPSHOT_TOKENS:
            raise ValueError(f"snapshot too large: ~{est} tokens > {MAX_SNAPSHOT_TOKENS}")
        return text


def estimate_tokens(text: str) -> int:
    return math.ceil(len(text) / CHARS_PER_TOKEN)


def _round(x: float) -> float:
    if x == 0 or not math.isfinite(x):
        return x
    # 6 significant digits keeps prices exact enough and the payload small.
    return float(f"{x:.6g}")


class StateEngine:
    def __init__(self, symbol: str, config: StateEngineConfig | None = None):
        self.symbol = symbol
        self.cfg = config or StateEngineConfig()
        self._last_recv_ts: int | None = None
        self._books: deque[BookEvent] = deque()
        self._trades: deque[TradeEvent] = deque()

    @property
    def last_recv_ts(self) -> int | None:
        return self._last_recv_ts

    def ingest(self, event: Event) -> None:
        if event.symbol != self.symbol:
            raise ValueError(f"event for {event.symbol} sent to engine for {self.symbol}")
        if self._last_recv_ts is not None and event.recv_ts < self._last_recv_ts:
            raise CausalityError(
                f"out-of-order event: recv_ts {event.recv_ts} < last {self._last_recv_ts}"
            )
        if isinstance(event, BookEvent):
            if not event.bids or not event.asks:
                raise ValueError("book event with an empty side")
            if event.best_bid >= event.best_ask:
                raise ValueError(f"crossed book: bid {event.best_bid} >= ask {event.best_ask}")
            self._books.append(event)
        else:
            self._trades.append(event)
        self._last_recv_ts = event.recv_ts
        self._trim(event.recv_ts - self.cfg.retention_ms)

    def _trim(self, cutoff: int) -> None:
        # Keep at least one book older than the cutoff so returns stay defined.
        while len(self._books) > 1 and self._books[1].recv_ts <= cutoff:
            self._books.popleft()
        while self._trades and self._trades[0].recv_ts <= cutoff:
            self._trades.popleft()

    def snapshot(self, as_of: int, portfolio: PortfolioView | None = None) -> Snapshot:
        portfolio = portfolio or PortfolioView()
        if self._last_recv_ts is not None and as_of < self._last_recv_ts - self.cfg.retention_ms // 2:
            raise CausalityError("as_of is older than the engine's retained history")

        books = [b for b in self._books if b.recv_ts <= as_of]
        if not books:
            raise LookupError(f"no book for {self.symbol} at or before {as_of}")
        book = books[-1]
        trades = [t for t in self._trades if t.recv_ts <= as_of]
        max_input_ts = max([book.recv_ts] + [t.recv_ts for t in trades[-1:]])
        assert max_input_ts <= as_of, "causality violated: input from the future"

        mid = book.mid
        spread_bps = (book.best_ask - book.best_bid) / mid * 1e4
        n = self.cfg.depth_levels
        bid_depth = sum(l.size for l in book.bids[:n])
        ask_depth = sum(l.size for l in book.asks[:n])
        imbalance = (bid_depth - ask_depth) / (bid_depth + ask_depth) if bid_depth + ask_depth else 0.0
        b0, a0 = book.bids[0], book.asks[0]
        micro = (b0.price * a0.size + a0.price * b0.size) / (a0.size + b0.size)
        micro_dev_bps = (micro - mid) / mid * 1e4

        flow_cut = as_of - self.cfg.flow_window_ms
        window = [t for t in trades if t.recv_ts > flow_cut]
        buy = sum(t.size for t in window if t.aggressor is Side.BUY)
        sell = sum(t.size for t in window if t.aggressor is Side.SELL)
        flow = (buy - sell) / (buy + sell) if buy + sell else 0.0

        return Snapshot(
            symbol=self.symbol,
            as_of=as_of,
            max_input_ts=max_input_ts,
            data_age_ms=as_of - book.recv_ts,
            mid=mid,
            spread_bps=spread_bps,
            book_imbalance=imbalance,
            microprice_dev_bps=micro_dev_bps,
            flow_imbalance=flow,
            trade_count=len(window),
            rv_ann=self._realized_vol(books, as_of),
            ret_short_bps=self._ret_bps(books, as_of, self.cfg.short_ret_ms),
            ret_long_bps=self._ret_bps(books, as_of, self.cfg.long_ret_ms),
            inventory=portfolio.inventory,
            exposure_pct=portfolio.exposure_pct,
            unrealized_pnl_bps=portfolio.unrealized_pnl_bps,
            drawdown_pct=portfolio.drawdown_pct,
            daily_pnl_pct=portfolio.daily_pnl_pct,
        )

    @staticmethod
    def _mid_at(books: list[BookEvent], ts: int) -> float | None:
        """Last known mid at or before `ts` (books are recv_ts-ordered)."""
        found = None
        for b in books:
            if b.recv_ts > ts:
                break
            found = b.mid
        return found

    def _ret_bps(self, books: list[BookEvent], as_of: int, lookback_ms: int) -> float | None:
        past = self._mid_at(books, as_of - lookback_ms)
        if past is None:
            return None
        return (books[-1].mid / past - 1.0) * 1e4

    def _realized_vol(self, books: list[BookEvent], as_of: int) -> float | None:
        """Annualized vol of log returns between consecutive bar-close mids.

        Bars are aligned to `as_of` (closes at as_of, as_of - bar, ...), so the
        estimate only uses information available at `as_of`.
        """
        bar = self.cfg.bar_ms
        n_bars = self.cfg.rv_window_ms // bar
        closes = [self._mid_at(books, as_of - i * bar) for i in range(n_bars, -1, -1)]
        closes = [c for c in closes if c is not None]
        if len(closes) < max(10, n_bars // 2):
            return None
        rets = [math.log(b / a) for a, b in zip(closes, closes[1:])]
        mean = sum(rets) / len(rets)
        var = sum((r - mean) ** 2 for r in rets) / (len(rets) - 1)
        return math.sqrt(var) * math.sqrt(MS_PER_YEAR / bar)
