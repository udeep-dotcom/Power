# WHAT COULD I BE WRONG ABOUT?

Ordered by how much damage each one would do. These are issues with the brief itself, not only with this code.

## 1. There may be no edge at all, and nothing here proves otherwise

- **Nothing in this repo shows the system makes money.**
- The synthetic run's +23% comes from drift regimes I built into the generator. The stub follows trends, so it profits by construction.
- The same run's review scored the stub at **Brier skill −0.85**. It said "95% sure" and was right 54% of the time.
- The honest prior for a retail directional crypto strategy, net of fees, slippage and funding, is that **it loses**.
- **The evidence that would change that is phase 6c:** ≥ 30 days of shadow decisions on live data, with Brier skill > 0 and a confidence interval excluding zero.

## 2. The brief mixes two strategies with incompatible horizons

- "Asymmetric setups where valuation is disconnected from fundamentals" is a **weeks-to-months** thesis.
- "Order book → Jev decision every candle in 81 ms" is a **seconds-to-hours** microstructure loop.
- Fundamental mispricing doesn't show up in a 5-level book imbalance. And a retail stack with ~100 ms+ network latency to Jev and the exchange is not competitive at microstructure against market makers co-located at the venue.
- **What I did:** research picks the universe and a bias. The loop only times entries on 15-minute candles with a 4-hour horizon. Feeding the thesis into the prompt also risks *anchoring* Jev on the research bias. The instructions say "context, not a vote", but that is a mitigation, not a guarantee.
- **Better alternative:** keep the fundamental book separate, at low turnover with weekly rebalancing. Use the fast loop only for execution quality (when to fill), not for whether to hold.

## 3. Calibrated ≠ profitable, so Kelly on Jev's probability is a category error unless fixed

- Jev's direction probability measures how sure it is of a *label*. Kelly needs **P(this trade wins after costs)** together with the trade's payoff ratio.
- **What I did:**
  - Until ≥ 300 closed trades exist, the raw probability is shrunk halfway to 0.5.
  - After that, an isotonic map is fit from Jev confidence to realized win rate.
  - Even quarter-Kelly gave ~12% of equity at risk per trade on plausible inputs, so it is clipped at 1% risk per trade. **Quarter-Kelly on an unvalidated probability is still reckless; the 1% clip is the real sizing rule for now.**

## 4. "Rewrite the schema every night and ship before the open" is overfitting on a schedule

- One night is ~96 correlated decisions per symbol.
- Daily rewrites tuned on that sample, with no out-of-sample test, chase noise. Each one also resets the evidence clock.
- **What I did:** a nightly *proposal*, a shadow version, promotion only on ≥ 300 resolved decisions with same-candle Brier no worse than live, and operator sign-off. Option sets are frozen. Crypto also has no "open".

## 5. Escalating to the slow model during a crisis is backwards

- In a crisis, the right first move is deterministic: flatten or reduce. Waiting on an LLM is not.
- **What I did:** crisis triggers an immediate reduce-only flatten, *then* escalation. The brain can only tighten (block, scale down, flatten, trip the kill switch); it can never loosen.
- "Confidence < 0.60 → escalate" as written fired on 100% of candles in the first run, so it is now conditional on the answer mattering.

## 6. One of the brief's gates delegates a risk judgment to the model

- `risk_state` is a Jev output. **I kept it only as an extra veto.** It can block an entry but cannot permit one, and `risk.py` never reads it.
- Every hard limit — the 15% drawdown, daily loss, position, exposure, risk-per-trade, the mandatory stop, rate limit, stale data, and the kill switch — is in code, checked in `ExecutionGateway` before every order.
- **Residual risk:**
  - Python can't stop future code from calling `broker.submit` directly. The gateway is the only path *by convention plus tests*.
  - A real live adapter must enforce this at the process boundary, e.g. the execution service holds the keys and runs its own risk check.

## 7. Facts I could not verify

- **AgentKit (agentkit.xyz)** did not resolve. I built the six-phase discipline as gated docs instead of pretending to use the tool.
- **Jev exists**, per multiple third-party guides: TypeSafe AI, Choice / Score / Noul primitives, early access in Sept 2026. But its **endpoint, request body and response shape** in `jev_client.py` come from third-party pages that contradicted each other. The "~81 ms" figure is vendor-reported; I measured nothing. **Do not enable `--jev http` until the shape is confirmed against docs.typesafe.ai.**
- **Market data:** every number in the research is secondary, found via search, and several conflict. Five candidates, not 5–10, and **none is a verified finalist**. Prices for HYPE, ENA and ASTER are MISSING.

## 8. Is each edge organic, priced in, and does value accrue?

| Candidate | Organic or incentive-driven | Priced in? | Value accrues? | Survives costs? |
|---|---|---|---|---|
| BTC | n/a (control) | n/a | n/a | Most likely of the five (tightest spreads) |
| HYPE | Organic fees, but pro-cyclical | Probably: consensus "real yield" name | Yes, mechanically | Plausible on a major venue |
| UNI | Organic fees, small | Yes: no re-rate after activation | Yes, but issuance offsets | Unclear |
| ENA | Depends on funding yield, i.e. leverage demand | Partly; the trigger is far off | Not yet: below the $7.5B trigger | Unclear |
| ASTER short | Supply-driven | Likely: unlock shorts are crowded | n/a for a short | **Doubtful**: negative funding carry plus squeeze risk |

## 9. Things the code still gets wrong or ignores

- **No funding-rate accrual in the paper broker.** For perps held 4 hours or more, that is a real cost, and it is large on crowded shorts like the ASTER thesis.
- **Market orders only.** The fill model walks the visible book, but there is no queue modeling, no partial fills, and no latency between decision and fill beyond the fixed extra slippage.
- **The synthetic feed has no fat tails beyond the injected crash,** and no correlation between symbols. A real crash is correlated: every alt gaps at once, and the gross-exposure limit is the only defense.
- **Stops are checked on book updates, not guaranteed.** A gap fills at the next available price, as the drawdown end-to-end test demonstrates. The 15% kill switch is a backstop, not a guarantee of losing at most 15%.
- **Restart safety.** A trip writes the HALT file, so a restarted process comes back halted. But the high-water mark and daily start equity are still in memory: after a restart, drawdown is measured from the restart equity, which **silently resets the 15% budget**. Persist risk state before phase 6d.

## Bottom line

This is a system built to **survive and to measure**, not to look profitable. Its most valuable output for the next 30+ days is a Brier skill score, not PnL. If skill is ≤ 0, the correct move is to keep the money and stop.
