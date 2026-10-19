"""Event sources. `ReplayFeed` reads recorded JSONL; `SyntheticFeed` generates
a regime-switching market for plumbing tests. Synthetic results say nothing
about real-market edge.
"""

from __future__ import annotations

import heapq
import json
import math
import random
from dataclasses import dataclass
from typing import Iterator

from .types import BookEvent, BookLevel, Event, Side, TradeEvent


def event_from_dict(d: dict) -> Event:
    if d["type"] == "book":
        return BookEvent(
            d["symbol"], d["exchange_ts"], d["recv_ts"],
            tuple(BookLevel(p, s) for p, s in d["bids"]),
            tuple(BookLevel(p, s) for p, s in d["asks"]),
        )
    return TradeEvent(d["symbol"], d["exchange_ts"], d["recv_ts"], d["price"], d["size"],
                      Side(d["aggressor"]))


def event_to_dict(e: Event) -> dict:
    if isinstance(e, BookEvent):
        return {"type": "book", "symbol": e.symbol, "exchange_ts": e.exchange_ts,
                "recv_ts": e.recv_ts, "bids": [[l.price, l.size] for l in e.bids],
                "asks": [[l.price, l.size] for l in e.asks]}
    return {"type": "trade", "symbol": e.symbol, "exchange_ts": e.exchange_ts,
            "recv_ts": e.recv_ts, "price": e.price, "size": e.size, "aggressor": e.aggressor.value}


class ReplayFeed:
    """Replays a JSONL capture in recv_ts order (stable for equal timestamps)."""

    def __init__(self, path: str):
        self.path = path

    def __iter__(self) -> Iterator[Event]:
        with open(self.path) as fh:
            events = [event_from_dict(json.loads(l)) for l in fh if l.strip()]
        events.sort(key=lambda e: e.recv_ts)
        return iter(events)


@dataclass
class SyntheticFeed:
    symbols: dict[str, float]          # symbol -> starting price
    start_ts: int
    duration_ms: int
    step_ms: int = 5_000
    seed: int = 7
    ann_vol: float = 0.6
    latency_ms: int = 40
    crash_at_ms: int | None = None     # inject a crash this long after start

    def __iter__(self) -> Iterator[Event]:
        streams = [self._stream(sym, px, i) for i, (sym, px) in enumerate(self.symbols.items())]
        return heapq.merge(*streams, key=lambda e: e.recv_ts)

    def _stream(self, symbol: str, price: float, idx: int) -> Iterator[Event]:
        rng = random.Random(self.seed * 1000 + idx)
        step_sigma = self.ann_vol * math.sqrt(self.step_ms / (365 * 86_400_000))
        drift, regime_left = 0.0, 0
        t = self.start_ts
        while t < self.start_ts + self.duration_ms:
            if regime_left <= 0:
                drift = rng.choice((-1, 0, 0, 1)) * step_sigma * 0.15
                regime_left = rng.randint(200, 1500)
            regime_left -= 1
            shock = rng.gauss(drift, step_sigma)
            if self.crash_at_ms is not None and 0 <= t - self.start_ts - self.crash_at_ms < 60_000:
                shock -= 0.01
            price *= math.exp(shock)
            spread = price * (2 + rng.random() * 3) / 1e4
            bid, ask = price - spread / 2, price + spread / 2
            lvl = price * 1e-4
            base = 50_000 / price
            bids = tuple(BookLevel(bid - i * lvl, base * (1 + rng.random())) for i in range(10))
            asks = tuple(BookLevel(ask + i * lvl, base * (1 + rng.random())) for i in range(10))
            recv = t + self.latency_ms
            yield BookEvent(symbol, t, recv, bids, asks)
            aggressor = Side.BUY if shock + rng.gauss(0, step_sigma) > 0 else Side.SELL
            px = ask if aggressor is Side.BUY else bid
            yield TradeEvent(symbol, t + 1, recv + 1, px, base * rng.random() * 0.2, aggressor)
            t += self.step_ms
