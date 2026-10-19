# Overnight review loop

Crypto has no "open". The review runs at **00:15 UTC**, right after the UTC day boundary resets the daily-loss limit.

## What runs

```
python3 scripts/nightly_review.py --journal state/paper/journal.jsonl
```

It reads only the journal and writes three things to `reports/`:
- `review-<date>.md`;
- `proposal-<date>.json`;
- `calibration-proposed-<date>.json`, if a refit is justified.

**It never writes to `config/` or to the live `state/calibration.json`.**

## What it measures

| Metric | Definition |
|---|---|
| Direction Brier (3-class) | Σ(p_k − o_k)². The realized class is long / short / neutral, from the forward return over the 4h horizon vs ±cost |
| Brier skill | 1 − BS / BS_climatology, where climatology = the sample base rates. ≤ 0 means no skill |
| Reliability table | Top-class confidence bins vs hit rate |
| Fills | Round-trip PnL after fees, win rate, payoff ratio |
| Toxic-flow Brier | Jev's `toxic_flow` probability vs realized adverse markout (1 candle after entry, beyond half the cost) |
| Misses | Each gated-out directional call is attributed to every gate that blocked it, with a counterfactual hit rate and a Bonferroni-corrected Wilson lower bound |

## What it may propose

All proposals carry `status: pending_operator_approval` and `auto_deploy: false`.

| Proposal | Condition |
|---|---|
| none | Fewer than `min_samples` (300) resolved decisions. One night of 15-minute candles is ~96 decisions per symbol, which is noise |
| `calibration_update` | ≥ 300 closed trades; isotonic refit of p_raw → P(win) |
| `halt_new_entries` | Aggregate Brier skill ≤ 0 over ≥ 300 decisions |
| `demote_to_shadow` | One schema's Brier skill ≤ 0 over ≥ 300 of its decisions |
| `review_gate` | A gate's blocked calls hit significantly above 50%. A candidate for loosening, which must go through shadow first |

## Schema rewrites: how "rewrite the Jev schema nightly" is made safe

The brief says to rewrite the schema every night and ship it before the next open. Doing that literally is **overfitting on a schedule**: a new model each day, fitted on a few hundred correlated samples, deployed with no out-of-sample test.

What happens instead:

1. The proposal includes a `schema_rewrite_brief`: per-schema Brier, the reliability table, and the five worst calls with their snapshots.
2. Opus reads the brief and proposes a **new version** in `config/finalists.json`. A version is never edited in place: `compile_schemas.py` refuses to overwrite a changed schema at the same version, and `validate_schema` rejects hand edits via the hash.
3. The new version is loaded as a **shadow schema** (`TradingLoop.shadow_schemas`). It is scored on every candle and journaled, but it **cannot trade**.
4. The operator promotes it only after ≥ 300 resolved shadow decisions, with Brier ≤ the live version's on the same candles.
5. **Option sets are frozen.** The regime, direction and risk_state options and the setup scale are part of the policy contract; `validate_schema` rejects changes to them. Only instruction text and criteria evolve.

## Escalation handling (the same Opus session)

- **Escalations** land in `state/escalations.jsonl`. Each carries the snapshot, the decision and the reasons.
- **The deterministic response comes first:** a crisis flattens via reduce-only orders before any slow reasoning.
- **Opus can only write tighten-only directives** to `state/directives.jsonl`: `block_symbol`, `scale_down` (factor < 1), `flatten`, `trip_kill_switch`. Anything else is rejected and journaled.
- **Unblocking or loosening** means editing config, restarting, and operator sign-off.

## Scheduling

Example crontab on the host (UTC):

```
15 0 * * *  cd /path/to/trading-agent && python3 scripts/nightly_review.py >> reports/cron.log 2>&1
```
