"""Run the full loop in paper mode.

  python3 scripts/run_paper.py --synthetic --hours 72            # offline plumbing run
  python3 scripts/run_paper.py --replay capture.jsonl --jev http # real Jev on recorded data

`--jev stub` uses a deterministic heuristic that is NOT a strategy; it only
exercises the pipeline. There is no live-exchange mode in this package.
"""

from __future__ import annotations

import argparse
import os
import sys
import time

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.app import ROOT, build_loop, load_schemas  # noqa: E402
from agent.feeds import ReplayFeed, SyntheticFeed  # noqa: E402
from agent.jev_client import HttpJevClient, ScriptedJevClient  # noqa: E402

DEFAULT_PRICES = {"BTC-PERP": 82_000.0, "HYPE-PERP": 40.0, "UNI-PERP": 3.5,
                  "ENA-PERP": 0.30, "ASTER-PERP": 1.0}  # synthetic starting points only


def main() -> int:
    ap = argparse.ArgumentParser()
    src = ap.add_mutually_exclusive_group(required=True)
    src.add_argument("--synthetic", action="store_true")
    src.add_argument("--replay")
    ap.add_argument("--hours", type=float, default=48)
    ap.add_argument("--jev", choices=("stub", "http"), default="stub")
    ap.add_argument("--state", default=os.path.join(ROOT, "state", "paper"))
    ap.add_argument("--crash-at-hours", type=float)
    ap.add_argument("--seed", type=int, default=7)
    args = ap.parse_args()

    jev = ScriptedJevClient() if args.jev == "stub" else HttpJevClient()
    schemas = load_schemas(os.path.join(ROOT, "config", "schemas"))
    loop = build_loop(jev, args.state, schemas=schemas)
    if args.synthetic:
        start = int(time.time() // 86_400 * 86_400 * 1000)
        feed = SyntheticFeed({s: DEFAULT_PRICES.get(s, 100.0) for s in schemas}, start,
                             int(args.hours * 3_600_000), seed=args.seed,
                             crash_at_ms=int(args.crash_at_hours * 3_600_000) if args.crash_at_hours else None)
    else:
        feed = ReplayFeed(args.replay)

    for ev in feed:
        loop.on_event(ev)
    loop.journal.close()

    recs = loop.journal.records
    count = lambda k: sum(1 for r in recs if r["kind"] == k)  # noqa: E731
    b = loop.broker
    print(f"decisions={count('decision')} fills={count('fill')} rejected={count('order_rejected')} "
          f"escalations={len(loop.escalations.records)}")
    print(f"equity={b.equity():,.2f} (start {b.starting_cash:,.2f}) fees={b.fees_paid:,.2f} "
          f"max_drawdown={loop.risk.max_drawdown_seen:.2%}")
    print(f"kill_switch={'TRIPPED: ' + loop.risk.kill_switch.reason if loop.risk.kill_switch.tripped else 'armed'}")
    print(f"journal: {loop.journal.path}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
