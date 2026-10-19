"""Core value types shared by every layer.

All timestamps are integer milliseconds since the Unix epoch (UTC).
`recv_ts` is the local time an event became *knowable* to us; every causal
check in the system is enforced on `recv_ts`, never on `exchange_ts`.
"""

from __future__ import annotations

from dataclasses import dataclass, field
from enum import Enum


class Side(str, Enum):
    BUY = "buy"
    SELL = "sell"

    @property
    def sign(self) -> int:
        return 1 if self is Side.BUY else -1


@dataclass(frozen=True)
class BookLevel:
    price: float
    size: float


@dataclass(frozen=True)
class BookEvent:
    symbol: str
    exchange_ts: int
    recv_ts: int
    bids: tuple[BookLevel, ...]  # best (highest) first
    asks: tuple[BookLevel, ...]  # best (lowest) first

    @property
    def best_bid(self) -> float:
        return self.bids[0].price

    @property
    def best_ask(self) -> float:
        return self.asks[0].price

    @property
    def mid(self) -> float:
        return (self.best_bid + self.best_ask) / 2.0


@dataclass(frozen=True)
class TradeEvent:
    symbol: str
    exchange_ts: int
    recv_ts: int
    price: float
    size: float
    aggressor: Side


Event = BookEvent | TradeEvent


@dataclass(frozen=True)
class PortfolioView:
    """Code-computed portfolio state handed to the state engine."""

    inventory: float = 0.0          # signed base-asset quantity for this symbol
    exposure_pct: float = 0.0       # |position notional| / equity
    unrealized_pnl_bps: float = 0.0
    drawdown_pct: float = 0.0       # from equity high-water mark, >= 0
    daily_pnl_pct: float = 0.0      # vs. UTC start-of-day equity


@dataclass(frozen=True)
class OrderRequest:
    symbol: str
    side: Side
    qty: float                      # always > 0; direction is in `side`
    reduce_only: bool
    ref_price: float                # mid at decision time, used for sanity checks
    stop_price: float | None = None
    take_profit_price: float | None = None
    tag: str = ""

    @property
    def signed_qty(self) -> float:
        return self.side.sign * self.qty


@dataclass(frozen=True)
class Fill:
    symbol: str
    side: Side
    qty: float
    avg_price: float
    fee: float
    ts: int
    tag: str = ""


@dataclass
class Position:
    qty: float = 0.0
    avg_price: float = 0.0
    stop_price: float | None = None
    take_profit_price: float | None = None
    opened_ts: int | None = None
    meta: dict = field(default_factory=dict)
