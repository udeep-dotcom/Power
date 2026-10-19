"""Paper broker: market orders walk the visible book, plus fees and extra slippage.

Deliberately pessimistic. If a strategy only works with optimistic fills it
does not work. There is no live broker in this package on purpose; see
docs/02-build-plan.md, phase 6, for the gate that has to be passed first.
"""

from __future__ import annotations

from dataclasses import dataclass, field

from .types import BookEvent, Fill, OrderRequest, Position, Side


class InsufficientLiquidity(RuntimeError):
    pass


@dataclass
class PaperBroker:
    starting_cash: float = 100_000.0
    taker_fee_bps: float = 4.5
    extra_slippage_bps: float = 1.0      # latency / queue effects not visible in the book
    cash: float = field(init=False)
    positions: dict[str, Position] = field(default_factory=dict)
    books: dict[str, BookEvent] = field(default_factory=dict)
    fills: list[Fill] = field(default_factory=list)
    fees_paid: float = 0.0

    def __post_init__(self):
        self.cash = self.starting_cash

    def on_book(self, book: BookEvent) -> None:
        self.books[book.symbol] = book

    def position(self, symbol: str) -> Position:
        return self.positions.setdefault(symbol, Position())

    def mid(self, symbol: str) -> float:
        return self.books[symbol].mid

    def equity(self) -> float:
        return self.cash + sum(p.qty * self.mid(s) for s, p in self.positions.items() if p.qty)

    def gross_exposure(self) -> float:
        return sum(abs(p.qty) * self.mid(s) for s, p in self.positions.items() if p.qty)

    def submit(self, order: OrderRequest, ts: int) -> Fill:
        book = self.books[order.symbol]
        levels = book.asks if order.side is Side.BUY else book.bids
        remaining, cost = order.qty, 0.0
        for lvl in levels:
            take = min(remaining, lvl.size)
            cost += take * lvl.price
            remaining -= take
            if remaining <= 1e-12:
                break
        if remaining > 1e-12:
            raise InsufficientLiquidity(f"{order.symbol}: visible depth < {order.qty}")
        vwap = cost / order.qty
        vwap *= 1 + order.side.sign * self.extra_slippage_bps / 1e4
        fee = order.qty * vwap * self.taker_fee_bps / 1e4
        self.cash -= order.side.sign * order.qty * vwap + fee
        self.fees_paid += fee
        self._apply(order, vwap, ts)
        fill = Fill(order.symbol, order.side, order.qty, vwap, fee, ts, order.tag)
        self.fills.append(fill)
        return fill

    def _apply(self, order: OrderRequest, px: float, ts: int) -> None:
        pos = self.position(order.symbol)
        new_qty = pos.qty + order.signed_qty
        if abs(new_qty) < 1e-12:
            self.positions[order.symbol] = Position()
            return
        if pos.qty == 0 or (pos.qty > 0) != (new_qty > 0):
            # opened, or flipped through zero: fresh position at this price
            self.positions[order.symbol] = Position(
                qty=new_qty, avg_price=px, stop_price=order.stop_price,
                take_profit_price=order.take_profit_price, opened_ts=ts)
        elif abs(new_qty) > abs(pos.qty):
            pos.avg_price = (pos.avg_price * pos.qty + px * order.signed_qty) / new_qty
            pos.qty = new_qty
        else:
            pos.qty = new_qty  # partial reduce keeps entry price, stop and target
