"""Jev adapter: snapshot + schema in, validated typed decision out.

Jev judges; it never sizes, never sets thresholds, never touches orders.
Any transport error, timeout, or malformed answer raises `JevError`, and the
loop treats that as HOLD (fail closed).

UNVERIFIED: the endpoint, request body and response shape below come from
third-party guides to the TypeSafe API (Sept/Oct 2026), not from the official
reference, which was unreachable when this was written. Confirm against
https://docs.typesafe.ai before enabling `HttpJevClient`.
"""

from __future__ import annotations

import json
import math
import os
import time
import urllib.error
import urllib.request
from dataclasses import dataclass
from typing import Callable, Protocol

from .schema import DIRECTIONS, REGIMES, RISK_STATES, SETUP_SCALE

DEFAULT_ENDPOINT = "https://api.typesafe.ai/v1/systemone"  # UNVERIFIED
DEFAULT_MODEL = "jev-latest"                               # UNVERIFIED
PROB_TOLERANCE = 0.02


class JevError(RuntimeError):
    pass


@dataclass(frozen=True)
class JevDecision:
    regime_p: dict[str, float]
    direction_p: dict[str, float]
    toxic_flow_p: float
    setup_quality_p: dict[int, float]
    risk_state_p: dict[str, float]
    latency_ms: float = 0.0
    model: str = ""

    @property
    def regime(self) -> str:
        return _argmax(self.regime_p)

    @property
    def direction(self) -> str:
        return _argmax(self.direction_p)

    @property
    def direction_confidence(self) -> float:
        return self.direction_p[self.direction]

    @property
    def setup_quality(self) -> int:
        return _argmax(self.setup_quality_p)

    @property
    def risk_state(self) -> str:
        return _argmax(self.risk_state_p)

    @property
    def confidence(self) -> float:
        """Confidence used for escalation: the direction call, which is the one that trades.

        Not min(direction, regime): a 4-way regime choice rarely has a top
        probability above 0.6, so that definition escalates almost every candle.
        """
        return self.direction_confidence

    def to_dict(self) -> dict:
        return {
            "regime_p": self.regime_p,
            "direction_p": self.direction_p,
            "toxic_flow_p": self.toxic_flow_p,
            "setup_quality_p": {str(k): v for k, v in self.setup_quality_p.items()},
            "risk_state_p": self.risk_state_p,
            "latency_ms": self.latency_ms,
            "model": self.model,
        }


def _argmax(d: dict):
    # Ties resolve to the first option in schema order, which is deterministic.
    return max(d, key=lambda k: d[k])


def _check_dist(name: str, dist: dict, options) -> dict:
    if set(dist) != set(options):
        raise JevError(f"{name}: labels {sorted(map(str, dist))} != {sorted(map(str, options))}")
    for k, v in dist.items():
        if not isinstance(v, (int, float)) or not math.isfinite(v) or v < 0 or v > 1:
            raise JevError(f"{name}: bad probability {v!r} for {k!r}")
    total = sum(dist.values())
    if abs(total - 1.0) > PROB_TOLERANCE:
        raise JevError(f"{name}: probabilities sum to {total:.3f}")
    return {k: v / total for k, v in dist.items()}


def make_decision(
    regime_p: dict,
    direction_p: dict,
    toxic_flow_p: float,
    setup_quality_p: dict,
    risk_state_p: dict,
    latency_ms: float = 0.0,
    model: str = "",
) -> JevDecision:
    """Validate raw distributions and build a decision. All clients go through here."""
    if not isinstance(toxic_flow_p, (int, float)) or not 0.0 <= toxic_flow_p <= 1.0:
        raise JevError(f"toxic_flow: bad probability {toxic_flow_p!r}")
    sq = {int(k): v for k, v in setup_quality_p.items()}
    return JevDecision(
        regime_p=_check_dist("regime", regime_p, REGIMES),
        direction_p=_check_dist("direction", direction_p, DIRECTIONS),
        toxic_flow_p=float(toxic_flow_p),
        setup_quality_p=_check_dist("setup_quality", sq, SETUP_SCALE),
        risk_state_p=_check_dist("risk_state", risk_state_p, RISK_STATES),
        latency_ms=latency_ms,
        model=model,
    )


class JevClient(Protocol):
    def decide(self, schema: dict, state: str) -> JevDecision: ...


def parse_response(payload: dict, latency_ms: float, model: str) -> JevDecision:
    """Map the (assumed) response shape onto a validated decision.

    Assumed shape: {"answers": {name: {"probabilities": {...}}, "toxic_flow": {"probability": p}}}
    """
    try:
        a = payload["answers"]
        return make_decision(
            regime_p=a["regime"]["probabilities"],
            direction_p=a["direction"]["probabilities"],
            toxic_flow_p=a["toxic_flow"]["probability"],
            setup_quality_p=a["setup_quality"]["probabilities"],
            risk_state_p=a["risk_state"]["probabilities"],
            latency_ms=latency_ms,
            model=model,
        )
    except (KeyError, TypeError, ValueError) as e:
        raise JevError(f"malformed Jev response: {e!r}") from e


class HttpJevClient:
    def __init__(
        self,
        api_key: str | None = None,
        endpoint: str = DEFAULT_ENDPOINT,
        model: str = DEFAULT_MODEL,
        timeout_s: float = 0.5,
        opener: Callable = urllib.request.urlopen,
    ):
        self.api_key = api_key or os.environ.get("TYPESAFE_API_KEY")
        if not self.api_key:
            raise JevError("TYPESAFE_API_KEY is not set")
        self.endpoint = endpoint
        self.model = model
        self.timeout_s = timeout_s
        self._open = opener

    def decide(self, schema: dict, state: str) -> JevDecision:
        body = json.dumps({"model": self.model, "state": state, "questions": schema["questions"]})
        req = urllib.request.Request(
            self.endpoint,
            data=body.encode(),
            method="POST",
            headers={"Authorization": f"Bearer {self.api_key}", "Content-Type": "application/json"},
        )
        t0 = time.perf_counter()
        try:
            with self._open(req, timeout=self.timeout_s) as resp:
                payload = json.loads(resp.read())
        except (urllib.error.URLError, TimeoutError, OSError, json.JSONDecodeError) as e:
            raise JevError(f"Jev transport error: {e!r}") from e
        return parse_response(payload, (time.perf_counter() - t0) * 1000, self.model)


class ScriptedJevClient:
    """Deterministic stand-in for tests and paper runs.

    `fn(schema, state_dict) -> JevDecision`. The default heuristic is a plumbing
    exerciser, NOT a strategy: it exists so the full pipeline can run offline.
    """

    def __init__(self, fn: Callable[[dict, dict], JevDecision] | None = None):
        self.fn = fn or heuristic_decision
        self.calls = 0

    def decide(self, schema: dict, state: str) -> JevDecision:
        self.calls += 1
        return self.fn(schema, json.loads(state))


def heuristic_decision(schema: dict, s: dict) -> JevDecision:
    ret = (s.get("ret_long_bps") or 0.0) / 100.0
    flow = s.get("flow_imbalance", 0.0)
    rv = s.get("rv_ann") or 0.0
    lean = math.tanh(3.0 * ret + 2.0 * flow)
    neutral = max(0.05, 1.0 - abs(lean))
    long_p, short_p = max(0.0, lean), max(0.0, -lean)
    z = long_p + short_p + neutral
    crisis = 0.9 if (s.get("ret_short_bps") or 0.0) < -500 else 0.02
    rest = (1 - crisis) / 3
    high_vol = rv > 1.5
    regime = {
        "trending": rest * (1.6 if abs(lean) > 0.5 else 0.7),
        "mean_reverting": rest * (0.7 if abs(lean) > 0.5 else 1.6),
        "high_vol": rest * (1.5 if high_vol else 0.7),
        "crisis": crisis,
    }
    rz = sum(regime.values())
    q = min(3, int(abs(lean) * 4))
    sq = {i: (0.7 if i == q else 0.1) for i in SETUP_SCALE}
    dd = s.get("drawdown_pct", 0.0)
    risk = {"safe": 0.8, "near_limit": 0.15, "reduce": 0.05} if dd < 0.08 else {
        "safe": 0.1, "near_limit": 0.3, "reduce": 0.6}
    return make_decision(
        regime_p={k: v / rz for k, v in regime.items()},
        direction_p={"long": long_p / z, "short": short_p / z, "neutral": neutral / z},
        toxic_flow_p=min(0.95, abs(flow) * 0.6),
        setup_quality_p=sq,
        risk_state_p=risk,
        model="heuristic-stub",
    )
