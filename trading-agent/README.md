# trading-agent

A 24/7 crypto trading agent skeleton. Its rule: **code owns every threshold, size, limit and side effect; Jev only judges.**

**Status: paper trading only. Unverified candidates. No live broker.** Read [`docs/04-what-could-i-be-wrong-about.md`](docs/04-what-could-i-be-wrong-about.md) before anything else.

## Layout

```
agent/            state engine, Jev adapter, policy, risk, broker, loop, review
config/           risk.json, policy.json, finalists.json, schemas/*.json (compiled)
scripts/          compile_schemas.py, run_paper.py, nightly_review.py
tests/            54 stdlib unittest tests
docs/             01 research · 02 six-phase build plan · 03 overnight loop · 04 what could I be wrong about
state/, reports/  runtime output (git-ignored)
```

No third-party dependencies (Python ≥ 3.10).

## Run

```bash
cd trading-agent
python3 -m unittest discover -s tests -t tests                  # 54 tests
python3 scripts/compile_schemas.py                              # finalists -> config/schemas
python3 scripts/run_paper.py --synthetic --hours 72             # offline plumbing run (stub Jev)
python3 scripts/run_paper.py --synthetic --hours 48 --crash-at-hours 30
python3 scripts/nightly_review.py                               # review + proposal into reports/
touch state/paper/HALT                                          # operator kill switch
```

Using real Jev (`--jev http`) needs `TYPESAFE_API_KEY`. Its request and response shape is **unverified**; see `agent/jev_client.py`.

## The live decision, per symbol per candle

1. `StateEngine.snapshot(as_of)` builds a causal numeric snapshot of under 400 tokens: mid, spread, imbalance, microprice, flow, realized vol, returns, inventory, exposure, drawdown and daily PnL. All of it is computed in code.
2. One Jev call answers 5 questions in parallel:
   - `regime` (choice: trending / mean_reverting / high_vol / crisis)
   - `direction` (choice: long / short / neutral)
   - `toxic_flow` (noul)
   - `setup_quality` (score 0–3)
   - `risk_state` (choice: safe / near_limit / reduce)
3. `policy.decide`:
   - **Crisis:** reduce, then escalate.
   - **Entry gate:** setup ≥ 2, direction confidence > 0.80, risk_state == safe, not neutral, toxic ≤ 0.5.
   - **Sizing:** quarter-Kelly on the calibrated P(win) with a cost-adjusted payoff, clipped to 1% risk per trade and the notional caps.
4. `ExecutionGateway`: `risk.check` runs, then `broker.submit`. This is the only path to the broker.
5. Every step is journaled to `state/*/journal.jsonl`.

## Hard limits (`config/risk.json`, enforced in `agent/risk.py`)

| Limit | Default | Behavior |
|---|---|---|
| Max drawdown from high-water mark | 15% (cannot be configured higher) | Latched kill switch, then flatten. Only reduce-only orders afterwards |
| Max daily loss | 3% | Reduce-only until the next UTC day |
| Max position | min($25k, 20% of equity) | |
| Gross exposure | 50% of equity | |
| Risk per trade | 1% of equity | A stop is mandatory to add risk |
| Max order | $10k | |
| Rate limit | 10 orders per minute | |
| Data freshness | stale after 5 s | |
| Price sanity | 50 bps from mid | |
| HALT file | | Trips the kill switch. Reset needs an explicit operator confirmation |
