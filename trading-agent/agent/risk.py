"""Hard, deterministic risk layer. Nothing the model outputs is an input here.

`RiskLayer.check` runs immediately before every order (see execution.py; the
gateway is the only path to the broker). Limits:
  - kill switch: latched; when tripped only reduce-only orders pass
  - max drawdown from equity high-water mark (default 15%) -> trips kill switch
  - max daily loss vs UTC start-of-day equity -> reduce-only until next UTC day
  - max position notional (absolute and % of equity), max gross exposure
  - max risk per trade (qty * |entry - stop|), and a stop is mandatory to add risk
  - max order notional, order rate limit, stale data, price sanity
Loosening any limit requires editing config/risk.json and restarting; there
is no runtime API that raises a limit.
"""

from __future__ import annotations

import os
from collections import deque
from dataclasses import dataclass, field

from .types import OrderRequest

DAY_MS = 86_400_000


@dataclass(frozen=True)
class RiskLimits:
    max_drawdown_pct: float = 0.15
    max_daily_loss_pct: float = 0.03
    max_position_notional: float = 25_000.0
    max_position_pct_equity: float = 0.20
    max_gross_exposure_pct: float = 0.50
    max_risk_per_trade_pct: float = 0.01
    max_order_notional: float = 10_000.0
    max_orders_per_minute: int = 10
    max_data_age_ms: int = 5_000
    max_price_deviation_bps: float = 50.0

    def __post_init__(self):
        if not 0 < self.max_drawdown_pct <= 0.15:
            raise ValueError("max_drawdown_pct must be in (0, 0.15]; the mandate caps it at 15%")
        for name in ("max_daily_loss_pct", "max_position_pct_equity", "max_gross_exposure_pct",
                     "max_risk_per_trade_pct"):
            if not 0 < getattr(self, name) <= 1:
                raise ValueError(f"{name} must be in (0, 1]")


class KillSwitch:
    """Latching kill switch. Also trips if the operator creates `halt_file`."""

    def __init__(self, halt_file: str | None = None):
        self.halt_file = halt_file
        self._reason: str | None = None

    @property
    def tripped(self) -> bool:
        if self._reason is None and self.halt_file and os.path.exists(self.halt_file):
            self._reason = f"halt file present: {self.halt_file}"
        return self._reason is not None

    @property
    def reason(self) -> str | None:
        return self._reason if self.tripped else None

    def trip(self, reason: str) -> None:
        if self._reason is None:
            self._reason = reason
            # Persist the trip so a process restart comes back halted.
            if self.halt_file and not os.path.exists(self.halt_file):
                with open(self.halt_file, "w") as fh:
                    fh.write(reason + "\n")

    def operator_reset(self, confirmation: str) -> None:
        """Only a human calls this, out of band. The trading loop never does."""
        if confirmation != "I have reviewed the incident and accept the risk":
            raise PermissionError("kill switch reset requires the exact operator confirmation")
        if self.halt_file and os.path.exists(self.halt_file):
            raise PermissionError("remove the halt file before resetting")
        self._reason = None


@dataclass(frozen=True)
class RiskContext:
    now: int
    equity: float
    mid: float
    data_ts: int                       # recv_ts of the book the order is priced off
    position_qty: float                # current signed qty in this symbol
    gross_exposure: float              # sum of |notional| across symbols, before the order


@dataclass(frozen=True)
class RiskVerdict:
    approved: bool
    reasons: tuple[str, ...] = ()


@dataclass
class RiskLayer:
    limits: RiskLimits
    kill_switch: KillSwitch = field(default_factory=KillSwitch)
    high_water: float | None = None
    day_start_equity: float | None = None
    day: int | None = None
    day_halted: bool = False
    max_drawdown_seen: float = 0.0
    _order_times: deque = field(default_factory=deque)

    def on_equity(self, equity: float, now: int) -> None:
        """Mark-to-market hook; call on every tick before any decision."""
        day = now // DAY_MS
        if self.day != day:
            self.day, self.day_start_equity, self.day_halted = day, equity, False
        if self.high_water is None or equity > self.high_water:
            self.high_water = equity
        dd = self.drawdown(equity)
        self.max_drawdown_seen = max(self.max_drawdown_seen, dd)
        if dd >= self.limits.max_drawdown_pct:
            self.kill_switch.trip(f"max drawdown {dd:.2%} >= {self.limits.max_drawdown_pct:.0%}")
        if self.daily_pnl_pct(equity) <= -self.limits.max_daily_loss_pct:
            self.day_halted = True

    def drawdown(self, equity: float) -> float:
        if not self.high_water:
            return 0.0
        return max(0.0, 1.0 - equity / self.high_water)

    def daily_pnl_pct(self, equity: float) -> float:
        if not self.day_start_equity:
            return 0.0
        return equity / self.day_start_equity - 1.0

    @property
    def new_risk_allowed(self) -> bool:
        return not self.kill_switch.tripped and not self.day_halted

    def max_new_notional(self, equity: float, position_qty: float, mid: float, gross: float) -> float:
        """Headroom for an order adding risk; used by policy to avoid sending rejectable orders."""
        cap = min(self.limits.max_position_notional, self.limits.max_position_pct_equity * equity)
        pos_room = max(0.0, cap - abs(position_qty) * mid)
        gross_room = max(0.0, self.limits.max_gross_exposure_pct * equity - gross)
        return min(pos_room, gross_room, self.limits.max_order_notional)

    def check(self, order: OrderRequest, ctx: RiskContext) -> RiskVerdict:
        L = self.limits
        bad: list[str] = []
        if order.qty <= 0:
            return RiskVerdict(False, ("non-positive quantity",))

        new_qty = ctx.position_qty + order.signed_qty
        reduces = abs(new_qty) < abs(ctx.position_qty) + 1e-12 and new_qty * ctx.position_qty >= 0
        if order.reduce_only and not reduces:
            return RiskVerdict(False, ("reduce_only order would increase or flip the position",))

        if order.reduce_only:
            # Exits are always allowed: blocking an exit is never the safe choice.
            self._record(ctx.now)
            return RiskVerdict(True, ("reduce-only",))

        if self.kill_switch.tripped:
            bad.append(f"kill switch: {self.kill_switch.reason}")
        if self.day_halted:
            bad.append("daily loss limit hit; reduce-only until next UTC day")
        if ctx.now - ctx.data_ts > L.max_data_age_ms:
            bad.append(f"stale data: {ctx.now - ctx.data_ts}ms > {L.max_data_age_ms}ms")
        if abs(order.ref_price / ctx.mid - 1.0) * 1e4 > L.max_price_deviation_bps:
            bad.append("reference price too far from mid")

        notional = order.qty * ctx.mid
        if notional > L.max_order_notional * (1 + 1e-9):
            bad.append(f"order notional {notional:.0f} > {L.max_order_notional:.0f}")
        pos_cap = min(L.max_position_notional, L.max_position_pct_equity * ctx.equity)
        if abs(new_qty) * ctx.mid > pos_cap * (1 + 1e-9):
            bad.append(f"position notional {abs(new_qty) * ctx.mid:.0f} > cap {pos_cap:.0f}")
        new_gross = ctx.gross_exposure - abs(ctx.position_qty) * ctx.mid + abs(new_qty) * ctx.mid
        if new_gross > L.max_gross_exposure_pct * ctx.equity * (1 + 1e-9):
            bad.append("gross exposure limit")

        if order.stop_price is None:
            bad.append("orders adding risk must carry a stop")
        else:
            wrong_side = (order.stop_price - ctx.mid) * order.side.sign >= 0
            if wrong_side:
                bad.append("stop is on the wrong side of the market")
            risk_amt = order.qty * abs(ctx.mid - order.stop_price)
            if risk_amt > L.max_risk_per_trade_pct * ctx.equity * (1 + 1e-9):
                bad.append(f"risk at stop {risk_amt:.2f} > {L.max_risk_per_trade_pct:.2%} of equity")

        self._prune(ctx.now)
        if len(self._order_times) >= L.max_orders_per_minute:
            bad.append("order rate limit")

        if bad:
            return RiskVerdict(False, tuple(bad))
        self._record(ctx.now)
        return RiskVerdict(True, ())

    def _prune(self, now: int) -> None:
        while self._order_times and self._order_times[0] <= now - 60_000:
            self._order_times.popleft()

    def _record(self, now: int) -> None:
        self._prune(now)
        self._order_times.append(now)
