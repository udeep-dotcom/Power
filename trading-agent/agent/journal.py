"""Append-only JSONL journal. The nightly review reads only this."""

from __future__ import annotations

import dataclasses
import json
from enum import Enum
from typing import IO


def _default(o):
    if dataclasses.is_dataclass(o):
        return dataclasses.asdict(o)
    if isinstance(o, Enum):
        return o.value
    if hasattr(o, "to_dict"):
        return o.to_dict()
    raise TypeError(f"not serializable: {type(o)}")


class Journal:
    def __init__(self, path: str | None = None):
        self.path = path
        self._fh: IO | None = open(path, "a") if path else None
        self.records: list[dict] = []   # in-memory copy for tests and the end-of-run summary

    def write(self, kind: str, ts: int, **fields) -> dict:
        rec = json.loads(json.dumps({"kind": kind, "ts": ts, **fields}, default=_default))
        self.records.append(rec)
        if self._fh:
            self._fh.write(json.dumps(rec, separators=(",", ":")) + "\n")
            self._fh.flush()
        return rec

    def close(self) -> None:
        if self._fh:
            self._fh.close()
            self._fh = None


def read_journal(path: str) -> list[dict]:
    with open(path) as fh:
        return [json.loads(line) for line in fh if line.strip()]
