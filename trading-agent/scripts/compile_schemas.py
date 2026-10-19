"""Compile config/finalists.json into versioned Jev schemas.

Usage: python3 scripts/compile_schemas.py [--version N] [--out config/schemas]

Writes one JSON file per finalist. Existing files are never overwritten with
different content at the same version: bump --version instead.
"""

from __future__ import annotations

import argparse
import json
import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.app import ROOT, load_json  # noqa: E402
from agent.schema import Finalist, compile_schema, validate_schema  # noqa: E402


def main() -> int:
    ap = argparse.ArgumentParser()
    ap.add_argument("--version", type=int, default=1)
    ap.add_argument("--finalists", default=os.path.join(ROOT, "config", "finalists.json"))
    ap.add_argument("--out", default=os.path.join(ROOT, "config", "schemas"))
    args = ap.parse_args()
    os.makedirs(args.out, exist_ok=True)
    for raw in load_json(args.finalists)["finalists"]:
        schema = compile_schema(Finalist.from_dict(raw), args.version)
        validate_schema(schema)
        path = os.path.join(args.out, f"{schema['schema_id']}.json")
        if os.path.exists(path):
            old = load_json(path)
            if old["version"] == schema["version"] and old["hash"] != schema["hash"]:
                print(f"refusing to overwrite {path}: content changed at v{schema['version']}; bump --version")
                return 1
        with open(path, "w") as fh:
            json.dump(schema, fh, indent=2)
            fh.write("\n")
        print(f"{path}  v{schema['version']}  hash={schema['hash']}")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
