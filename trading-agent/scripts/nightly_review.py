"""Nightly review: journal -> metrics, calibration, gate attribution, proposal.

  python3 scripts/nightly_review.py --journal state/paper/journal.jsonl

Writes reports/review-<date>.md and reports/proposal-<date>.json. It never
edits config/, never writes the live calibrator, never deploys anything.
"""

from __future__ import annotations

import argparse
import datetime as dt
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.app import ROOT  # noqa: E402
from agent.journal import read_journal  # noqa: E402
from agent.review import ReviewConfig, render_markdown, run_review  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--journal", default=os.path.join(ROOT, "state", "paper", "journal.jsonl"))
    ap.add_argument("--out", default=os.path.join(ROOT, "reports"))
    ap.add_argument("--min-samples", type=int, default=300)
    ap.add_argument("--date", default=dt.datetime.now(dt.timezone.utc).strftime("%Y-%m-%d"))
    args = ap.parse_args()

    res = run_review(read_journal(args.journal), ReviewConfig(min_samples=args.min_samples), args.date)
    os.makedirs(args.out, exist_ok=True)
    md = os.path.join(args.out, f"review-{args.date}.md")
    pj = os.path.join(args.out, f"proposal-{args.date}.json")
    with open(md, "w") as fh:
        fh.write(render_markdown(res))
    with open(pj, "w") as fh:
        json.dump(res.proposal, fh, indent=2, default=str)
    if res.calibrator is not None:
        with open(os.path.join(args.out, f"calibration-proposed-{args.date}.json"), "w") as fh:
            fh.write(res.calibrator.to_json())
    print(render_markdown(res))
    print(f"wrote {md}\nwrote {pj}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
