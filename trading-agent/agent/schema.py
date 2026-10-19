"""Compile a research finalist into a typed Jev decision schema.

A schema is a fixed set of five questions asked about one snapshot in one
call. The questions only *judge*; every threshold that acts on the answers
lives in `policy.py` and `risk.py`.

The wire format below follows the TypeSafe docs as reported by third-party
guides (Choice / Score / Noul primitives). It is UNVERIFIED against the
official API reference; `jev_client.HttpJevClient` is the single place that
would need to change.
"""

from __future__ import annotations

import hashlib
import json
from dataclasses import dataclass, field

REGIMES = ("trending", "mean_reverting", "high_vol", "crisis")
DIRECTIONS = ("long", "short", "neutral")
RISK_STATES = ("safe", "near_limit", "reduce")
SETUP_SCALE = (0, 1, 2, 3)
QUESTION_NAMES = ("regime", "direction", "toxic_flow", "setup_quality", "risk_state")


@dataclass(frozen=True)
class Finalist:
    id: str
    symbol: str
    thesis: str
    bias: str                       # "long", "short" or "none": the research prior
    catalysts: tuple[str, ...] = ()
    bear_case: tuple[str, ...] = ()
    invalidation: tuple[str, ...] = ()
    status: str = "candidate"       # candidate | verified | retired
    notes: dict = field(default_factory=dict)

    @staticmethod
    def from_dict(d: dict) -> "Finalist":
        return Finalist(
            id=d["id"],
            symbol=d["symbol"],
            thesis=d["thesis"],
            bias=d.get("bias", "none"),
            catalysts=tuple(d.get("catalysts", ())),
            bear_case=tuple(d.get("bear_case", ())),
            invalidation=tuple(d.get("invalidation", ())),
            status=d.get("status", "candidate"),
            notes=d.get("notes", {}),
        )


def compile_schema(f: Finalist, version: int) -> dict:
    if f.bias not in ("long", "short", "none"):
        raise ValueError(f"bad bias {f.bias!r}")
    context = (
        f"Instrument {f.symbol}. Research thesis (may be wrong): {f.thesis} "
        f"Thesis is invalidated by: {'; '.join(f.invalidation) or 'n/a'}. "
        "Judge only from the snapshot; the thesis is context, not a vote."
    )
    questions = {
        "regime": {
            "type": "choice",
            "instructions": "Classify the current market regime for this instrument from the snapshot.",
            "options": list(REGIMES),
            "criteria": {
                "trending": "returns persistent in one direction, flow agrees with returns",
                "mean_reverting": "returns oscillate, flow and book lean against recent moves",
                "high_vol": "realized volatility or spread clearly elevated without crash dynamics",
                "crisis": "disorderly: wide spread, one-sided flow, sharp drop, liquidity vanishing",
            },
        },
        "direction": {
            "type": "choice",
            "instructions": (
                "Which position, if any, has positive expectancy over the next few bars "
                "after paying the spread? Prefer neutral when evidence is mixed. " + context
            ),
            "options": list(DIRECTIONS),
        },
        "toxic_flow": {
            "type": "noul",
            "instructions": (
                "Proposition: recent aggressive order flow is informed, so a new taker order "
                "in the direction of the flow would be adversely selected."
            ),
        },
        "setup_quality": {
            "type": "score",
            "instructions": (
                "Rate how clean the setup is for the chosen direction: 0 = none, "
                "1 = weak, 2 = tradeable, 3 = textbook. " + context
            ),
            "scale": list(SETUP_SCALE),
        },
        "risk_state": {
            "type": "choice",
            "instructions": (
                "Given inventory, exposure, drawdown and daily PnL in the snapshot, is it safe "
                "to add risk? This is an advisory veto only; hard limits are enforced in code."
            ),
            "options": list(RISK_STATES),
        },
    }
    body = {
        "schema_id": f.id,
        "version": version,
        "symbol": f.symbol,
        "bias": f.bias,
        "questions": questions,
    }
    body["hash"] = schema_hash(body)
    return body


def schema_hash(schema: dict) -> str:
    body = {k: v for k, v in schema.items() if k != "hash"}
    return hashlib.sha256(json.dumps(body, sort_keys=True).encode()).hexdigest()[:16]


def validate_schema(schema: dict) -> None:
    missing = set(QUESTION_NAMES) - set(schema.get("questions", {}))
    if missing:
        raise ValueError(f"schema {schema.get('schema_id')} missing questions {sorted(missing)}")
    q = schema["questions"]
    if tuple(q["regime"]["options"]) != REGIMES:
        raise ValueError("regime options changed; policy depends on them")
    if tuple(q["direction"]["options"]) != DIRECTIONS:
        raise ValueError("direction options changed; policy depends on them")
    if tuple(q["risk_state"]["options"]) != RISK_STATES:
        raise ValueError("risk_state options changed; policy depends on them")
    if tuple(q["setup_quality"]["scale"]) != SETUP_SCALE:
        raise ValueError("setup_quality scale changed; policy depends on it")
    if q["toxic_flow"]["type"] != "noul":
        raise ValueError("toxic_flow must be a noul")
    if schema.get("hash") != schema_hash(schema):
        raise ValueError(f"schema {schema.get('schema_id')} hash mismatch: edited without recompiling")
