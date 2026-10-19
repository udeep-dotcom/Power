"""Policy: turn a Jev judgment into an intent. Every threshold lives here.

Gate (all must pass to enter):
  setup_quality >= 2, direction confidence > 0.80, Jev risk_state == safe,
  direction != neutral, toxic_flow probability <= max_toxic_p.
Escalate to the slow brain when regime == crisis (which also triggers a
deterministic reduction *before* anyone thinks), or when direction
confidence < 0.60 *and* the answer matters: a position is open, or the call
is non-neutral. A low-confidence "neutral" while flat changes nothing, so it
is not worth a slow call.

Sizing is fractional Kelly on a stop-defined bet:
  p  = calibrated win probability (not raw Jev confidence)
  b  = net payoff ratio = (tp_dist - cost) / (stop_dist + cost)
  f* = p - (1 - p) / b ; risk_fraction = min(kelly_fraction, 0.25) * f*
  qty = min(risk_fraction, max_risk_fraction) * equity / stop_dist, then
        clipped to the position notional cap.
The risk layer re-checks risk-per-trade and notional independently; the
clips here only stop us from sending orders it would reject.
"""

from __future__ import annotations

import math
from dataclasses import dataclass, field

from .calibration import Calibrator
from .jev_client import JevDecision
from .state_engine import MS_PER_YEAR, Snapshot

KELLY_HARD_CAP = 0.25


@dataclass(frozen=True)
class PolicyConfig:
    min_setup_quality: int = 2
    min_direction_conf: float = 0.80       # strictly greater than
    max_toxic_p: float = 0.50
    escalate_below_conf: float = 0.60
    kelly_fraction: float = 0.25
    max_risk_fraction: float = 0.01        # clip: equity lost if the stop is hit
    horizon_ms: int = 4 * 60 * 60_000      # expected holding period for stop/TP scaling
    stop_sigma: float = 1.0                # stop distance in horizon-sigmas
    tp_sigma: float = 2.0
    min_stop_spreads: float = 4.0          # floor stop distance at N spreads
    round_trip_cost_bps: float = 12.0      # fees + expected slippage, both legs
    crisis_reduce_fraction: float = 1.0    # 1.0 = flatten on crisis

    def __post_init__(self):
        if not 0 < self.kelly_fraction <= KELLY_HARD_CAP:
            raise ValueError(f"kelly_fraction must be in (0, {KELLY_HARD_CAP}]")
        if self.min_direction_conf <= self.escalate_below_conf:
            raise ValueError("entry confidence must exceed escalation confidence")


@dataclass(frozen=True)
class Intent:
    action: str                       # enter | exit | reduce | hold
    side: str | None = None           # long | short
    qty: float = 0.0
    risk_fraction: float = 0.0
    stop_price: float | None = None
    take_profit_price: float | None = None
    p_win: float | None = None
    payoff_ratio: float | None = None
    escalate: bool = False
    reasons: tuple[str, ...] = field(default_factory=tuple)
    gates_failed: tuple[str, ...] = field(default_factory=tuple)  # machine-readable, for review

    def to_dict(self) -> dict:
        return {k: v for k, v in self.__dict__.items()}


def decide(
    d: JevDecision,
    snap: Snapshot,
    equity: float,
    cfg: PolicyConfig,
    calibrator: Calibrator,
    max_notional: float = math.inf,
) -> Intent:
    if d.regime == "crisis":
        return Intent(
            action="reduce" if snap.inventory else "hold",
            qty=abs(snap.inventory) * cfg.crisis_reduce_fraction,
            escalate=True,
            reasons=("regime=crisis",),
        )

    low_conf = d.confidence < cfg.escalate_below_conf
    escalate = low_conf and (bool(snap.inventory) or d.direction != "neutral")
    blocked: list[tuple[str, str]] = []  # (gate, human-readable reason)
    if low_conf:
        blocked.append(("low_confidence", f"confidence {d.confidence:.2f} < {cfg.escalate_below_conf}"))
    if d.direction == "neutral":
        blocked.append(("neutral", "direction=neutral"))
    if d.setup_quality < cfg.min_setup_quality:
        blocked.append(("setup_quality", f"setup_quality {d.setup_quality} < {cfg.min_setup_quality}"))
    if not d.direction_confidence > cfg.min_direction_conf:
        blocked.append(("direction_conf",
                        f"direction_conf {d.direction_confidence:.2f} <= {cfg.min_direction_conf}"))
    if d.risk_state != "safe":
        blocked.append(("risk_state", f"risk_state={d.risk_state}"))
    if d.toxic_flow_p > cfg.max_toxic_p:
        blocked.append(("toxic_flow", f"toxic_flow_p {d.toxic_flow_p:.2f} > {cfg.max_toxic_p}"))

    # An opposing high-conviction call exits the position even if entry is gated.
    if snap.inventory and d.direction in ("long", "short"):
        pos_side = "long" if snap.inventory > 0 else "short"
        if d.direction != pos_side and d.direction_confidence > cfg.min_direction_conf:
            return Intent(action="exit", qty=abs(snap.inventory), escalate=escalate,
                          reasons=(f"opposing signal vs {pos_side} position",))
        if d.direction == pos_side:
            blocked.append(("positioned", "already positioned; no pyramiding"))

    if blocked:
        return Intent(action="hold", escalate=escalate, reasons=tuple(r for _, r in blocked),
                      gates_failed=tuple(g for g, _ in blocked))

    if snap.rv_ann is None or snap.rv_ann <= 0:
        return Intent(action="hold", reasons=("insufficient volatility history",),
                      gates_failed=("vol_history",))

    sigma_h = snap.rv_ann * math.sqrt(cfg.horizon_ms / MS_PER_YEAR)
    spread_px = snap.spread_bps / 1e4 * snap.mid
    stop_dist = max(cfg.stop_sigma * sigma_h * snap.mid, cfg.min_stop_spreads * spread_px)
    tp_dist = stop_dist * cfg.tp_sigma / cfg.stop_sigma
    cost_px = cfg.round_trip_cost_bps / 1e4 * snap.mid
    b = (tp_dist - cost_px) / (stop_dist + cost_px)
    p = calibrator.predict(d.direction_confidence)
    if b <= 0:
        return Intent(action="hold", p_win=p, payoff_ratio=b, reasons=("costs exceed target",),
                      gates_failed=("edge",))
    kelly = p - (1 - p) / b
    if kelly <= 0:
        return Intent(action="hold", p_win=p, payoff_ratio=b,
                      reasons=(f"no edge after costs: p={p:.3f} b={b:.2f}",),
                      gates_failed=("edge",))

    reasons = ["all gates passed"]
    risk_fraction = min(cfg.kelly_fraction, KELLY_HARD_CAP) * kelly
    if risk_fraction > cfg.max_risk_fraction:
        reasons.append(f"kelly {risk_fraction:.4f} clipped to {cfg.max_risk_fraction}")
        risk_fraction = cfg.max_risk_fraction
    qty = risk_fraction * equity / stop_dist
    if qty * snap.mid > max_notional:
        reasons.append("clipped to position notional cap")
        qty = max_notional / snap.mid
        risk_fraction = qty * stop_dist / equity
    sign = 1 if d.direction == "long" else -1
    return Intent(
        action="enter",
        side=d.direction,
        qty=qty,
        risk_fraction=risk_fraction,
        stop_price=snap.mid - sign * stop_dist,
        take_profit_price=snap.mid + sign * tp_dist,
        p_win=p,
        payoff_ratio=b,
        reasons=tuple(reasons),
    )
