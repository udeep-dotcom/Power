"""Escalations up to the slow brain, and the tighten-only directives it may send back.

The brain (an Opus session reading escalations.jsonl) can make the system
*safer* at runtime and nothing else. Any directive that would add risk is
rejected here; loosening goes through config + restart + operator approval.
"""

from __future__ import annotations

import json
import os
from dataclasses import dataclass, field

ALLOWED = ("block_symbol", "flatten", "scale_down", "trip_kill_switch")


class DirectiveRejected(ValueError):
    pass


def validate_directive(d: dict) -> dict:
    kind = d.get("type")
    if kind not in ALLOWED:
        raise DirectiveRejected(f"directive type {kind!r} not allowed; allowed: {ALLOWED}")
    if kind in ("block_symbol", "flatten", "scale_down") and not d.get("symbol"):
        raise DirectiveRejected(f"{kind} needs a symbol")
    if kind == "scale_down":
        f = d.get("factor")
        if not isinstance(f, (int, float)) or not 0 <= f < 1:
            raise DirectiveRejected("scale_down factor must be in [0, 1)")
    if not d.get("reason"):
        raise DirectiveRejected("every directive needs a reason")
    return d


@dataclass
class DirectiveInbox:
    """Tails a JSONL file of directives written by the brain."""

    path: str | None
    _offset: int = 0
    rejected: list[tuple[dict, str]] = field(default_factory=list)

    def poll(self) -> list[dict]:
        if not self.path or not os.path.exists(self.path):
            return []
        out = []
        with open(self.path) as fh:
            fh.seek(self._offset)
            for line in fh:
                if not line.strip():
                    continue
                try:
                    out.append(validate_directive(json.loads(line)))
                except (DirectiveRejected, json.JSONDecodeError) as e:
                    self.rejected.append(({"raw": line.strip()}, str(e)))
            self._offset = fh.tell()
        return out


@dataclass
class EscalationQueue:
    path: str | None
    records: list[dict] = field(default_factory=list)

    def push(self, rec: dict) -> None:
        self.records.append(rec)
        if self.path:
            with open(self.path, "a") as fh:
                fh.write(json.dumps(rec, separators=(",", ":"), default=str) + "\n")
