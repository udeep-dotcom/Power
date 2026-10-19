"""Nightly review: read the journal, score calibration, attribute misses, and
write a *proposal*. Nothing here changes live behaviour.

Promotion path for any change (enforced by process, see docs/03):
  proposal -> operator approves -> new schema version runs in SHADOW
  -> after >= min_shadow_days and Brier no worse than live -> operator promotes.

Statistical guardrails:
  - No calibration refit or threshold proposal below `min_samples` resolved
    decisions. One night of 15-minute candles is ~96 decisions per symbol;
    that is noise, not evidence.
  - Gate-loosening flags use a Bonferroni-corrected Wilson bound.
"""

from __future__ import annotations

import math
from collections import defaultdict
from dataclasses import dataclass, field

from .calibration import Calibrator
from .schema import DIRECTIONS


@dataclass(frozen=True)
class ReviewConfig:
    horizon_ms: int = 4 * 60 * 60_000
    markout_ms: int = 15 * 60_000
    cost_bps: float = 12.0
    min_samples: int = 300
    min_gate_samples: int = 50
    alpha: float = 0.05


def brier_multiclass(probs: dict[str, float], realized: str) -> float:
    return sum((p - (1.0 if k == realized else 0.0)) ** 2 for k, p in probs.items())


def brier_binary(p: float, y: int) -> float:
    return (p - y) ** 2


def wilson(k: int, n: int, z: float) -> tuple[float, float]:
    if n == 0:
        return 0.0, 1.0
    ph = k / n
    denom = 1 + z * z / n
    centre = (ph + z * z / (2 * n)) / denom
    half = z * math.sqrt(ph * (1 - ph) / n + z * z / (4 * n * n)) / denom
    return centre - half, centre + half


def _z_one_sided(alpha: float) -> float:
    # inverse normal CDF via bisection; avoids a scipy dependency
    lo, hi = 0.0, 10.0
    for _ in range(80):
        mid = (lo + hi) / 2
        if 0.5 * math.erfc(mid / math.sqrt(2)) > alpha:
            lo = mid
        else:
            hi = mid
    return (lo + hi) / 2


def _realized_class(fwd_bps: float, cost_bps: float) -> str:
    if fwd_bps > cost_bps:
        return "long"
    if fwd_bps < -cost_bps:
        return "short"
    return "neutral"


@dataclass
class ReviewResult:
    metrics: dict = field(default_factory=dict)
    per_schema: dict = field(default_factory=dict)
    reliability: list = field(default_factory=list)
    gates: dict = field(default_factory=dict)
    trades: list = field(default_factory=list)
    proposal: dict = field(default_factory=dict)
    calibrator: Calibrator | None = None


def run_review(records: list[dict], cfg: ReviewConfig, date: str,
               calibrator: Calibrator | None = None) -> ReviewResult:
    calibrator = calibrator or Calibrator(min_samples=cfg.min_samples)
    decisions = [r for r in records if r["kind"] == "decision"]
    mids: dict[str, list[tuple[int, float]]] = defaultdict(list)
    for r in decisions:
        mids[r["symbol"]].append((r["ts"], r["mid"]))

    def fwd_mid(sym: str, ts: int, h: int) -> float | None:
        for t, m in mids[sym]:
            if t >= ts + h:
                return m
        return None

    res = ReviewResult()

    # --- direction calibration over all scored decisions ---------------
    scored = []
    for r in decisions:
        d = r.get("decision")
        if not d:
            continue
        fm = fwd_mid(r["symbol"], r["ts"], cfg.horizon_ms)
        if fm is None:
            continue
        fwd_bps = (fm / r["mid"] - 1) * 1e4
        scored.append((r, d, _realized_class(fwd_bps, cfg.cost_bps), fwd_bps))

    n = len(scored)
    jev_errors = sum(1 for r in decisions if not r.get("decision"))
    res.metrics.update(decisions=len(decisions), resolved=n, jev_errors=jev_errors,
                       sufficient_data=n >= cfg.min_samples)
    if n:
        base = {k: sum(1 for s in scored if s[2] == k) / n for k in DIRECTIONS}
        bs = sum(brier_multiclass(s[1]["direction_p"], s[2]) for s in scored) / n
        bs_ref = sum(brier_multiclass(base, s[2]) for s in scored) / n
        res.metrics.update(direction_brier=bs, climatology_brier=bs_ref,
                           brier_skill=(1 - bs / bs_ref) if bs_ref else 0.0, base_rates=base)
        by_schema = defaultdict(list)
        for s in scored:
            by_schema[s[0]["schema_id"]].append(s)
        for sid, rows in by_schema.items():
            b = sum(brier_multiclass(x[1]["direction_p"], x[2]) for x in rows) / len(rows)
            ref = sum(brier_multiclass(base, x[2]) for x in rows) / len(rows)
            res.per_schema[sid] = {"n": len(rows), "brier": b,
                                   "brier_skill": (1 - b / ref) if ref else 0.0}
        edges = [0.0, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0001]
        for lo, hi in zip(edges, edges[1:]):
            rows = [s for s in scored if lo <= max(s[1]["direction_p"].values()) < hi]
            if rows:
                top = [max(s[1]["direction_p"], key=s[1]["direction_p"].get) for s in rows]
                hits = sum(1 for t, s in zip(top, rows) if t == s[2])
                res.reliability.append({
                    "bin": f"[{lo:.1f},{min(hi, 1.0):.1f})", "n": len(rows),
                    "mean_conf": sum(max(s[1]["direction_p"].values()) for s in rows) / len(rows),
                    "hit_rate": hits / len(rows)})

    # --- shadow schemas: scored on the same candles as live --------------
    live_by_key = {(s[0]["symbol"], s[0]["ts"]): s for s in scored}
    shadow_rows = defaultdict(list)
    for r in records:
        if r["kind"] != "shadow_decision":
            continue
        live = live_by_key.get((r["symbol"], r["ts"]))
        if live is None:
            continue
        shadow_rows[(r["schema_id"], r["schema_hash"])].append(
            (brier_multiclass(r["decision"]["direction_p"], live[2]),
             brier_multiclass(live[1]["direction_p"], live[2])))
    res.metrics["shadow"] = {
        f"{sid}@{h}": {"n": len(v), "shadow_brier": sum(x for x, _ in v) / len(v),
                       "live_brier_same_candles": sum(y for _, y in v) / len(v),
                       "promotable": len(v) >= cfg.min_samples
                       and sum(x for x, _ in v) <= sum(y for _, y in v)}
        for (sid, h), v in shadow_rows.items()
    }

    # --- misses: gated-out directional calls, attributed per gate -------
    gate_rows: dict[str, list[int]] = defaultdict(list)
    for r, d, realized, _ in scored:
        intent = r["intent"]
        top = max(d["direction_p"], key=d["direction_p"].get)
        if intent["action"] != "hold" or top == "neutral":
            continue
        for gate in intent.get("gates_failed", ()):
            gate_rows[gate].append(1 if realized == top else 0)
    z = _z_one_sided(cfg.alpha / max(1, len(gate_rows)))  # Bonferroni across gates tested
    for g, ys in gate_rows.items():
        k, m = sum(ys), len(ys)
        lo, hi = wilson(k, m, z)
        res.gates[g] = {"blocked": m, "would_have_hit": k, "hit_rate": k / m,
                        "wilson_lo": lo, "flag_too_tight": m >= cfg.min_gate_samples and lo > 0.5}

    # --- fills: round trips, PnL, markouts, toxic-flow calibration ------
    entries = {}
    for r in decisions:
        if r.get("intent", {}).get("action") == "enter" and r.get("decision"):
            entries[(r["symbol"], r["ts"])] = r
    fills = [r for r in records if r["kind"] == "fill"]
    pos: dict[str, float] = defaultdict(float)
    open_trade: dict[str, dict] = {}
    toxic_pairs, calib_pairs = [], []
    for f in fills:
        fl = f["fill"]
        sym, sign = fl["symbol"], 1 if fl["side"] == "buy" else -1
        if pos[sym] == 0:
            entry = entries.get((sym, f["ts"]))
            open_trade[sym] = {"symbol": sym, "open_ts": f["ts"], "cash": 0.0, "fees": 0.0,
                               "side": "long" if sign > 0 else "short",
                               "conf": entry["decision"]["direction_p"][entry["intent"]["side"]] if entry else None,
                               "schema_id": entry["schema_id"] if entry else None}
            fm = fwd_mid(sym, f["ts"], cfg.markout_ms)
            if fm is not None and entry:
                mk = sign * (fm / fl["avg_price"] - 1) * 1e4
                toxic_pairs.append((entry["decision"]["toxic_flow_p"], 1 if mk < -cfg.cost_bps / 2 else 0))
        t = open_trade[sym]
        t["cash"] -= sign * fl["qty"] * fl["avg_price"]
        t["fees"] += fl["fee"]
        pos[sym] += sign * fl["qty"]
        if abs(pos[sym]) < 1e-9:
            pos[sym] = 0.0
            t.update(close_ts=f["ts"], exit=fl.get("tag") or f["order"].get("tag"),
                     pnl=t["cash"] - t["fees"])
            res.trades.append(t)
            if t["conf"] is not None:
                calib_pairs.append((t["conf"], 1 if t["pnl"] > 0 else 0))
            del open_trade[sym]

    wins = [t["pnl"] for t in res.trades if t["pnl"] > 0]
    losses = [-t["pnl"] for t in res.trades if t["pnl"] <= 0]
    res.metrics.update(
        trades=len(res.trades), open_trades=len(open_trade),
        net_pnl=sum(t["pnl"] for t in res.trades),
        fees=sum(t["fees"] for t in res.trades),
        win_rate=len(wins) / len(res.trades) if res.trades else None,
        payoff_ratio=(sum(wins) / len(wins)) / (sum(losses) / len(losses)) if wins and losses else None,
        toxic_flow_brier=(sum(brier_binary(p, y) for p, y in toxic_pairs) / len(toxic_pairs))
        if toxic_pairs else None,
        rejections=sum(1 for r in records if r["kind"] == "order_rejected"),
        escalation_triggers=sum(1 for r in decisions if r.get("intent", {}).get("escalate")),
    )

    # --- proposal ---------------------------------------------------------
    changes = []
    notes = []
    if not res.metrics["sufficient_data"]:
        notes.append(f"only {n} resolved decisions (< {cfg.min_samples}); no changes proposed")
    else:
        new_cal = calibrator.fit(calib_pairs)
        if new_cal.fitted:
            res.calibrator = new_cal
            changes.append({"type": "calibration_update", "n_trades": len(calib_pairs),
                            "knots_x": new_cal.knots_x, "knots_y": new_cal.knots_y})
        else:
            notes.append(f"{len(calib_pairs)} closed trades < {cfg.min_samples}; calibrator unchanged")
        if res.metrics["brier_skill"] <= 0:
            changes.append({"type": "halt_new_entries", "scope": "all",
                            "reason": f"aggregate brier skill {res.metrics['brier_skill']:.3f} <= 0 "
                                      f"over {n} decisions: no evidence of directional skill"})
        for sid, s in res.per_schema.items():
            if s["n"] >= cfg.min_samples and s["brier_skill"] <= 0:
                changes.append({"type": "demote_to_shadow", "schema_id": sid,
                                "reason": f"brier skill {s['brier_skill']:.3f} <= 0 vs climatology"})
        for g, s in res.gates.items():
            if s["flag_too_tight"]:
                changes.append({"type": "review_gate", "gate": g, "evidence": s,
                                "note": "candidate for loosening; must pass shadow first"})
    worst = sorted(scored, key=lambda s: -brier_multiclass(s[1]["direction_p"], s[2]))[:5]
    res.proposal = {
        "date": date,
        "status": "pending_operator_approval",
        "auto_deploy": False,
        "changes": changes,
        "notes": notes,
        "schema_rewrite_brief": {
            "instruction": ("Propose a new schema VERSION (never edit in place). It will run in "
                            "shadow until it beats the live version on Brier over >= min_samples."),
            "per_schema": res.per_schema,
            "reliability": res.reliability,
            "worst_calls": [{"ts": s[0]["ts"], "symbol": s[0]["symbol"], "realized": s[2],
                             "fwd_bps": round(s[3], 1), "direction_p": s[1]["direction_p"],
                             "snapshot": s[0]["snapshot"]} for s in worst],
        },
    }
    return res


def render_markdown(res: ReviewResult) -> str:
    m = res.metrics
    lines = [f"# Nightly review {res.proposal['date']}", "",
             f"Status: **{res.proposal['status']}** (auto-deploy: {res.proposal['auto_deploy']})", "",
             "## Metrics", ""]
    for k, v in m.items():
        lines.append(f"- {k}: {round(v, 4) if isinstance(v, float) else v}")
    lines += ["", "## Reliability (direction, top-class)", "", "| bin | n | mean conf | hit rate |",
              "|---|---|---|---|"]
    for b in res.reliability:
        lines.append(f"| {b['bin']} | {b['n']} | {b['mean_conf']:.3f} | {b['hit_rate']:.3f} |")
    lines += ["", "## Gate attribution (blocked directional calls)", "",
              "| gate | blocked | would have hit | hit rate | Wilson lo | flag |", "|---|---|---|---|---|---|"]
    for g, s in sorted(res.gates.items()):
        lines.append(f"| {g} | {s['blocked']} | {s['would_have_hit']} | {s['hit_rate']:.3f} | "
                     f"{s['wilson_lo']:.3f} | {'TOO TIGHT?' if s['flag_too_tight'] else ''} |")
    lines += ["", "## Proposed changes", ""]
    lines += [f"- `{c['type']}`: {c.get('schema_id') or c.get('gate') or c.get('scope') or ''} "
              f"{c.get('reason', '')}"
              for c in res.proposal["changes"]] or ["- none"]
    lines += [f"- note: {x}" for x in res.proposal["notes"]]
    return "\n".join(lines) + "\n"
