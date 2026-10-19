# Build plan: six gated phases

## About AgentKit

The brief says to build through AgentKit at agentkit.xyz.
- On 2026-10-19 that domain **did not resolve** (DNS `ENOTFOUND`).
- Web search found nothing from it; it did find similarly shaped Claude Code workflow kits.
- So I could not install it, and I won't pretend I drove its phases.

This plan uses the same six-phase shape the brief describes: spec, architecture, plan, test-first build, review, ship.
- Each phase has an explicit gate checklist the operator signs.
- It is harness-agnostic. If AgentKit turns out to be real, point it at this file and `config/finalists.json`; the gates map one-to-one.

**Rule for every phase:** a phase is done when its gate checklist is ticked by the operator, not when the code compiles.

---

## Phase 1: Spec

**Deliverable:** this repo's `README.md` plus the hard requirements below.

**Hard requirements (non-negotiable, all enforced in code):**
- **Max drawdown is 15% from the high-water mark.** It trips a latched kill switch. `RiskLimits` refuses any config above 15%.
- **The kill switch is checked before every order.** Only reduce-only orders pass once it's tripped.
- **Max daily loss** (default 3%) means reduce-only until the next UTC day.
- **Position, gross exposure, order notional, risk-per-trade, rate limits, stale-data and price-sanity checks** all apply.
- **Jev only judges.** No Jev output is an input to `risk.py`.
- **Entry gate:** setup_quality ≥ 2, direction confidence > 0.80, risk_state == safe.
- **Sizing:** fractional Kelly on the *calibrated* probability, hard-capped at 0.25×.
- **Escalation:** crisis, or confidence < 0.60 when it matters. It goes to the slow brain, which can only tighten.

**Gate 1:**
- [ ] Operator agrees paper-only until phase 6.
- [ ] Operator agrees the candidates are unverified.

## Phase 2: Architecture

```
            ┌────────────── BRAIN (slow, offline) ───────────────┐
            │ research → finalists.json → compile_schemas.py     │
            │ escalations.jsonl ──► Opus review ──► directives.jsonl (tighten-only)
            │ journal.jsonl ──► nightly_review.py ──► proposal-*.json (operator gate)
            └────────────────────────────────────────────────────┘
feed ──► StateEngine ──► Snapshot (<400 tok) ──► Jev (5 questions, 1 call)
            │                                          │ JevDecision (validated)
            ▼                                          ▼
       PortfolioView ◄── PaperBroker          policy.decide (gates, Kelly, clips)
                              ▲                        │ Intent
                              │                        ▼
                              └── ExecutionGateway: risk.check ──► broker.submit
                                   (only path)        ▲
                         risk.on_equity every tick ───┘ (drawdown → kill switch)
```

| Concern | File |
|---|---|
| Value types | `agent/types.py` |
| State engine (causal snapshot) | `agent/state_engine.py` |
| Jev schema compiler and validator | `agent/schema.py` |
| Jev adapter (HTTP, scripted stub) | `agent/jev_client.py` |
| Calibration (shrink prior, isotonic fit) | `agent/calibration.py` |
| Policy (gates, sizing) | `agent/policy.py` |
| Risk layer and kill switch | `agent/risk.py` |
| Execution gateway | `agent/execution.py` |
| Paper broker | `agent/broker.py` |
| Live loop | `agent/loop.py` |
| Escalations and directives | `agent/directives.py` |
| Journal | `agent/journal.py` |
| Nightly review | `agent/review.py` |
| Feeds (replay, synthetic) | `agent/feeds.py` |
| Wiring | `agent/app.py` |
| Config | `config/risk.json`, `config/policy.json`, `config/finalists.json`, `config/schemas/*.json` |

**Phase 2 backlog (not built, called out):**
- A live exchange feed adapter (WebSocket, with sequence-gap detection and resync).
- An event calendar, so size drops into FOMC/CPI windows.
- A funding-cost accrual in the broker.
- Partial fills and limit orders.

**Gate 2:**
- [ ] Operator confirms that no arrow goes from Jev or the brain into `risk.py`.

## Phase 3: Plan

1. Types, then a state engine with causality tests.
2. Risk layer with tests for every limit.
3. Schema, Jev adapter, and a malformed-response test.
4. Policy and sizing math tests.
5. Gateway, broker, and loop integration tests: fail-closed, kill-switch flatten, check-before-submit ordering, tighten-only directives.
6. Review with a Brier test, an insufficient-data guard, and a no-skill halt.
7. Scripts.

**Gate 3:**
- [ ] Every hard requirement in phase 1 maps to at least one named test.

## Phase 4: Test-first build (done in this commit)

- Run `python3 -m unittest discover -s tests -t tests`. 54 tests, stdlib only.
- A mutation check was run by hand. Six mutations were applied one at a time:
  - disabling the kill-switch check;
  - setting the drawdown trip to 100%;
  - dropping the mandatory stop;
  - removing the 0.80 gate;
  - letting future trades into the snapshot;
  - removing kill-switch flattening.

  Each one made the suite fail.

**Gate 4:**
- [ ] Suite green.
- [ ] Mutation check re-run after any change to `risk.py`, `policy.py`, `state_engine.py` or `loop.py`.

## Phase 5: Review

**Self-review findings fixed during the build:**
1. **Escalation storm.** "Confidence" was first min(direction, regime). Because a 4-way regime choice rarely tops 0.6, every candle escalated. Fixed: direction confidence only, escalation only when the answer can change something, plus a cooldown.
2. **Float-boundary rejections.** Orders clipped exactly to the cap were rejected by `>`. Fixed with a relative tolerance.
3. **Misleading drawdown report.** The run script compared a final high-water mark to an earlier low. Fixed: `RiskLayer.max_drawdown_seen`.

**Gate 5:**
- [ ] An independent reviewer (human, or a fresh session with no build context) reads `risk.py`, `policy.py` and `loop.py` against phase 1 and signs.

## Phase 6: Ship (staged; each stage is its own gate)

| Stage | What | Exit criterion to advance |
|---|---|---|
| 6a | Replay on recorded real order-book data, stub Jev | Pipeline runs a week of data with no crash, and journal invariants hold |
| 6b | Replay with **real Jev** (`--jev http`), after confirming the API shape against official docs | Jev error rate < 1%, p99 latency within budget, ≥ 300 resolved decisions per schema |
| 6c | Shadow on live data: decisions journaled, **no orders** | Brier skill > 0 vs climatology, with a confidence interval excluding 0, over ≥ 30 days; net-of-cost paper PnL > 0 after funding |
| 6d | Live, smallest size: one symbol (BTC), 1/10th of risk limits, real exchange adapter | Live slippage within 1.5× of the paper model; no unexplained rejections; 30 days |
| 6e | Scale | Operator decision, one notch at a time |

**There is deliberately no live broker in this commit.** Writing one before 6c passes would be building the part that loses money before proving the part that might make it.

**Gate 6:**
- [ ] Operator signs each stage.
- [ ] Any limit change goes through `config/risk.json` plus a restart, never at runtime.
