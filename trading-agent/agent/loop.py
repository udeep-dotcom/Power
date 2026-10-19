"""The live loop. Order of operations on every event is fixed:

  ingest -> mark-to-market -> risk.on_equity (may trip the kill switch)
  -> kill-switch flatten -> stop / take-profit exits (code, not model)
  -> on candle close: directives -> snapshot -> Jev -> policy -> gateway -> journal

Jev is called once per symbol per candle with all five questions in one
request. Shadow schemas are scored and journaled but can never trade.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from .calibration import Calibrator
from .directives import DirectiveInbox, EscalationQueue
from .execution import ExecutionGateway
from .jev_client import JevClient, JevError
from .journal import Journal
from .policy import Intent, PolicyConfig, decide
from .risk import RiskLayer
from .state_engine import StateEngine
from .types import BookEvent, Event, OrderRequest, PortfolioView, Side


@dataclass
class LoopConfig:
    candle_ms: int = 15 * 60_000
    escalation_cooldown_ms: int = 60 * 60_000   # per symbol; crisis bypasses it


@dataclass
class TradingLoop:
    schemas: dict[str, dict]                    # symbol -> live schema
    engines: dict[str, StateEngine]
    jev: JevClient
    policy_cfg: PolicyConfig
    calibrator: Calibrator
    risk: RiskLayer
    gateway: ExecutionGateway
    journal: Journal
    escalations: EscalationQueue
    inbox: DirectiveInbox
    cfg: LoopConfig = field(default_factory=LoopConfig)
    shadow_schemas: dict[str, dict] = field(default_factory=dict)
    blocked: set[str] = field(default_factory=set)
    size_mult: dict[str, float] = field(default_factory=dict)
    _bucket: dict[str, int] = field(default_factory=dict)
    _last_escalation: dict[str, int] = field(default_factory=dict)
    _flattened_on_kill: bool = False

    @property
    def broker(self):
        return self.gateway.broker

    # ---- event handling -------------------------------------------------

    def on_event(self, ev: Event) -> None:
        engine = self.engines.get(ev.symbol)
        if engine is None:
            return
        engine.ingest(ev)
        if isinstance(ev, BookEvent):
            self.broker.on_book(ev)
        if ev.symbol not in self.broker.books:
            return
        now = ev.recv_ts
        if len(self.broker.books) < len(self.engines):
            return  # wait until every symbol has a price so equity is well defined

        self.risk.on_equity(self.broker.equity(), now)
        if self.risk.kill_switch.tripped and not self._flattened_on_kill:
            self.journal.write("kill_switch", now, reason=self.risk.kill_switch.reason)
            self._flatten_all(now, "kill switch")
            self._flattened_on_kill = True

        if isinstance(ev, BookEvent):
            self._manage_exits(ev.symbol, now)

        bucket = now // self.cfg.candle_ms
        prev = self._bucket.get(ev.symbol)
        self._bucket[ev.symbol] = bucket
        if prev is not None and bucket > prev:
            self._decide(ev.symbol, now)

    # ---- deterministic exits -------------------------------------------

    def _manage_exits(self, symbol: str, now: int) -> None:
        pos = self.broker.position(symbol)
        if not pos.qty:
            return
        mid = self.broker.mid(symbol)
        long = pos.qty > 0
        hit = None
        if pos.stop_price is not None and (mid <= pos.stop_price if long else mid >= pos.stop_price):
            hit = "stop"
        elif pos.take_profit_price is not None and (
            mid >= pos.take_profit_price if long else mid <= pos.take_profit_price
        ):
            hit = "take_profit"
        if hit:
            self._reduce(symbol, abs(pos.qty), now, hit)

    def _reduce(self, symbol: str, qty: float, now: int, tag: str) -> None:
        pos = self.broker.position(symbol)
        qty = min(qty, abs(pos.qty))
        if qty <= 0:
            return
        side = Side.SELL if pos.qty > 0 else Side.BUY
        order = OrderRequest(symbol, side, qty, reduce_only=True,
                             ref_price=self.broker.mid(symbol), tag=tag)
        self.gateway.submit(order, now)

    def _flatten_all(self, now: int, tag: str) -> None:
        for sym, pos in list(self.broker.positions.items()):
            if pos.qty:
                self._reduce(sym, abs(pos.qty), now, tag)

    # ---- directives from the brain (tighten-only) ----------------------

    def _apply_directives(self, now: int) -> None:
        for d in self.inbox.poll():
            kind, sym = d["type"], d.get("symbol")
            if kind == "block_symbol":
                self.blocked.add(sym)
            elif kind == "scale_down":
                self.size_mult[sym] = min(self.size_mult.get(sym, 1.0), float(d["factor"]))
            elif kind == "flatten":
                self.blocked.add(sym)
                self._reduce(sym, math.inf, now, "directive_flatten")
            elif kind == "trip_kill_switch":
                self.risk.kill_switch.trip(f"brain directive: {d['reason']}")
            self.journal.write("directive_applied", now, directive=d)
        for raw, why in self.inbox.rejected:
            self.journal.write("directive_rejected", now, directive=raw, reason=why)
        self.inbox.rejected.clear()

    # ---- the per-candle decision ---------------------------------------

    def _portfolio_view(self, symbol: str) -> PortfolioView:
        equity = self.broker.equity()
        pos = self.broker.position(symbol)
        mid = self.broker.mid(symbol)
        upnl = (mid / pos.avg_price - 1.0) * (1 if pos.qty > 0 else -1) * 1e4 if pos.qty else 0.0
        return PortfolioView(
            inventory=pos.qty,
            exposure_pct=abs(pos.qty) * mid / equity,
            unrealized_pnl_bps=upnl,
            drawdown_pct=self.risk.drawdown(equity),
            daily_pnl_pct=self.risk.daily_pnl_pct(equity),
        )

    def _decide(self, symbol: str, now: int) -> None:
        self._apply_directives(now)
        if self.risk.kill_switch.tripped:
            return
        if symbol in self.blocked:
            self.journal.write("skip", now, symbol=symbol, reason="blocked by directive")
            return
        schema = self.schemas.get(symbol)
        if schema is None:
            return

        snap = self.engines[symbol].snapshot(now, self._portfolio_view(symbol))
        state = snap.to_state()

        sh = self.shadow_schemas.get(symbol)
        if sh is not None:
            try:
                sd = self.jev.decide(sh, state)
                self.journal.write("shadow_decision", now, symbol=symbol, mid=snap.mid,
                                   schema_id=sh["schema_id"], schema_hash=sh["hash"], decision=sd)
            except JevError as e:
                self.journal.write("shadow_error", now, symbol=symbol, error=str(e))

        try:
            d = self.jev.decide(schema, state)
        except JevError as e:
            self.journal.write("decision", now, symbol=symbol, mid=snap.mid, snapshot=snap,
                               schema_id=schema["schema_id"], schema_hash=schema["hash"],
                               decision=None, intent=Intent("hold", reasons=(f"jev error: {e}",)))
            return

        equity = self.broker.equity()
        pos_qty = self.broker.position(symbol).qty
        headroom = self.risk.max_new_notional(equity, pos_qty, snap.mid, self.broker.gross_exposure())
        intent = decide(d, snap, equity, self.policy_cfg, self.calibrator,
                        max_notional=headroom * self.size_mult.get(symbol, 1.0))

        self.journal.write("decision", now, symbol=symbol, mid=snap.mid, snapshot=snap,
                           schema_id=schema["schema_id"], schema_hash=schema["hash"],
                           decision=d, intent=intent)

        last = self._last_escalation.get(symbol)
        cooled = last is None or now - last >= self.cfg.escalation_cooldown_ms
        if intent.escalate and (cooled or d.regime == "crisis"):
            self._last_escalation[symbol] = now
            self.escalations.push({
                "ts": now, "symbol": symbol, "schema_id": schema["schema_id"],
                "reasons": intent.reasons, "snapshot": snap.to_state(), "decision": d.to_dict(),
            })

        if intent.action in ("exit", "reduce"):
            self._reduce(symbol, intent.qty, now, intent.action)
        elif intent.action == "enter" and intent.qty > 0:
            side = Side.BUY if intent.side == "long" else Side.SELL
            order = OrderRequest(symbol, side, intent.qty, reduce_only=False, ref_price=snap.mid,
                                 stop_price=intent.stop_price,
                                 take_profit_price=intent.take_profit_price,
                                 tag=f"enter:{schema['schema_id']}:v{schema['version']}")
            self.gateway.submit(order, now)
