"""Wire the system together from config files."""

from __future__ import annotations

import glob
import json
import os

from .broker import PaperBroker
from .calibration import Calibrator
from .directives import DirectiveInbox, EscalationQueue
from .execution import ExecutionGateway
from .jev_client import JevClient
from .journal import Journal
from .loop import LoopConfig, TradingLoop
from .policy import PolicyConfig
from .risk import KillSwitch, RiskLayer, RiskLimits
from .schema import validate_schema
from .state_engine import StateEngine

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))


def load_json(path: str) -> dict:
    with open(path) as fh:
        return json.load(fh)


def load_schemas(directory: str) -> dict[str, dict]:
    out: dict[str, dict] = {}
    for path in sorted(glob.glob(os.path.join(directory, "*.json"))):
        s = load_json(path)
        validate_schema(s)
        if s["symbol"] in out:
            raise ValueError(f"two live schemas for {s['symbol']}")
        out[s["symbol"]] = s
    return out


def build_loop(jev: JevClient, state_dir: str, schemas: dict[str, dict] | None = None,
               config_dir: str | None = None, starting_cash: float = 100_000.0,
               candle_ms: int = 15 * 60_000) -> TradingLoop:
    config_dir = config_dir or os.path.join(ROOT, "config")
    os.makedirs(state_dir, exist_ok=True)
    schemas = schemas if schemas is not None else load_schemas(os.path.join(config_dir, "schemas"))
    cal_path = os.path.join(state_dir, "calibration.json")
    calibrator = Calibrator.from_json(open(cal_path).read()) if os.path.exists(cal_path) else Calibrator()
    risk = RiskLayer(RiskLimits(**load_json(os.path.join(config_dir, "risk.json"))),
                     KillSwitch(halt_file=os.path.join(state_dir, "HALT")))
    journal = Journal(os.path.join(state_dir, "journal.jsonl"))
    broker = PaperBroker(starting_cash=starting_cash)
    return TradingLoop(
        schemas=schemas,
        engines={sym: StateEngine(sym) for sym in schemas},
        jev=jev,
        policy_cfg=PolicyConfig(**load_json(os.path.join(config_dir, "policy.json"))),
        calibrator=calibrator,
        risk=risk,
        gateway=ExecutionGateway(risk, broker, journal),
        journal=journal,
        escalations=EscalationQueue(os.path.join(state_dir, "escalations.jsonl")),
        inbox=DirectiveInbox(os.path.join(state_dir, "directives.jsonl")),
        cfg=LoopConfig(candle_ms=candle_ms),
    )
