"""Execution gateway: the only code path that reaches the broker.

Every order goes risk.check -> broker.submit, in that order, with a fresh
RiskContext built from broker state at submit time. Rejections and fills
are both journaled.
"""

from __future__ import annotations

from dataclasses import dataclass

from .broker import InsufficientLiquidity, PaperBroker
from .journal import Journal
from .risk import RiskContext, RiskLayer, RiskVerdict
from .types import Fill, OrderRequest


@dataclass
class ExecutionGateway:
    risk: RiskLayer
    broker: PaperBroker
    journal: Journal

    def submit(self, order: OrderRequest, now: int) -> tuple[RiskVerdict, Fill | None]:
        book = self.broker.books[order.symbol]
        ctx = RiskContext(
            now=now,
            equity=self.broker.equity(),
            mid=book.mid,
            data_ts=book.recv_ts,
            position_qty=self.broker.position(order.symbol).qty,
            gross_exposure=self.broker.gross_exposure(),
        )
        verdict = self.risk.check(order, ctx)
        if not verdict.approved:
            self.journal.write("order_rejected", now, order=order, reasons=verdict.reasons)
            return verdict, None
        try:
            fill = self.broker.submit(order, now)
        except InsufficientLiquidity as e:
            self.journal.write("order_failed", now, order=order, reasons=(str(e),))
            return RiskVerdict(False, (str(e),)), None
        self.journal.write("fill", now, order=order, fill=fill, equity=self.broker.equity())
        return verdict, fill
