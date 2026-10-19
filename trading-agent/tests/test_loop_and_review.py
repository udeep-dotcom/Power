import json
import os
import tempfile
import unittest

from helpers import book, decision

from agent.app import build_loop
from agent.feeds import SyntheticFeed
from agent.jev_client import JevError, ScriptedJevClient
from agent.journal import read_journal
from agent.review import ReviewConfig, brier_multiclass, run_review
from agent.schema import Finalist, compile_schema

MIN = 60_000
SCHEMAS = {"BTC-PERP": compile_schema(Finalist("btc", "BTC-PERP", "t", "none"), 1)}


def always(d):
    return ScriptedJevClient(lambda schema, state: d)


def raising(schema, state):
    raise JevError("down")


class SpyRisk:
    """Wraps the real risk layer and records every check, so we can prove ordering."""

    def __init__(self, inner, log):
        self.inner, self.log = inner, log

    def check(self, order, ctx):
        v = self.inner.check(order, ctx)
        self.log.append(("check", order.tag, v.approved))
        return v

    def __getattr__(self, k):
        return getattr(self.inner, k)


def run(loop, minutes, mid_fn=lambda t: 100.0, step=10_000):
    for t in range(0, minutes * MIN, step):
        loop.on_event(book(ts=t, mid=mid_fn(t), spread=0.01, bid_sizes=(1e6,) * 5, ask_sizes=(1e6,) * 5))


class LoopTests(unittest.TestCase):
    def setUp(self):
        self.tmp = tempfile.TemporaryDirectory()
        self.loops = []

    def tearDown(self):
        for lp in self.loops:
            lp.journal.close()
        self.tmp.cleanup()

    def loop(self, jev, **kw):
        lp = build_loop(jev, self.tmp.name, schemas=SCHEMAS, **kw)
        self.loops.append(lp)
        return lp

    def wiggle(self, t):
        return 100.0 * (1 + 0.002 * ((t // 60_000) % 2))

    def test_jev_failure_fails_closed(self):
        lp = self.loop(ScriptedJevClient(raising))
        run(lp, 120, self.wiggle)
        kinds = [r["kind"] for r in lp.journal.records]
        self.assertNotIn("fill", kinds)
        self.assertTrue(any("jev error" in r["intent"]["reasons"][0]
                            for r in lp.journal.records if r["kind"] == "decision"))

    def test_every_order_is_risk_checked_before_the_broker(self):
        lp = self.loop(always(decision(conf=0.95)))
        log = []
        lp.gateway.risk = SpyRisk(lp.gateway.risk, log)
        submit = lp.broker.submit

        def spy_submit(order, ts):
            log.append(("submit", order.tag, None))
            return submit(order, ts)
        lp.broker.submit = spy_submit
        run(lp, 180, self.wiggle)
        submits = [i for i, e in enumerate(log) if e[0] == "submit"]
        self.assertTrue(submits, "expected at least one fill")
        for i in submits:
            self.assertEqual(log[i - 1][0], "check")
            self.assertTrue(log[i - 1][2])

    def test_kill_switch_flattens_and_blocks_new_entries(self):
        lp = self.loop(always(decision(conf=0.95)))
        run(lp, 90, self.wiggle)
        self.assertNotEqual(lp.broker.position("BTC-PERP").qty, 0)
        open(os.path.join(self.tmp.name, "HALT"), "w").close()
        for t in range(90 * MIN, 200 * MIN, 10_000):
            lp.on_event(book(ts=t, mid=self.wiggle(t), spread=0.01,
                             bid_sizes=(1e6,) * 5, ask_sizes=(1e6,) * 5))
        self.assertEqual(lp.broker.position("BTC-PERP").qty, 0)
        after = [r for r in lp.journal.records if r["kind"] == "fill" and r["ts"] >= 90 * MIN]
        self.assertTrue(all(r["order"]["reduce_only"] for r in after))

    def test_crisis_flattens_and_escalates(self):
        lp = self.loop(always(decision(conf=0.95)))
        run(lp, 90, self.wiggle)
        self.assertNotEqual(lp.broker.position("BTC-PERP").qty, 0)
        lp.jev = always(decision(regime="crisis", regime_conf=0.9))
        for t in range(90 * MIN, 120 * MIN, 10_000):
            lp.on_event(book(ts=t, mid=self.wiggle(t), spread=0.01,
                             bid_sizes=(1e6,) * 5, ask_sizes=(1e6,) * 5))
        self.assertEqual(lp.broker.position("BTC-PERP").qty, 0)
        self.assertTrue(lp.escalations.records)
        self.assertTrue(os.path.exists(os.path.join(self.tmp.name, "escalations.jsonl")))

    def test_brain_directives_can_only_tighten(self):
        lp = self.loop(always(decision(conf=0.95)))
        with open(os.path.join(self.tmp.name, "directives.jsonl"), "w") as fh:
            fh.write(json.dumps({"type": "raise_limit", "reason": "yolo"}) + "\n")
            fh.write(json.dumps({"type": "block_symbol", "symbol": "BTC-PERP", "reason": "r"}) + "\n")
        run(lp, 90, self.wiggle)
        kinds = [r["kind"] for r in lp.journal.records]
        self.assertIn("directive_rejected", kinds)
        self.assertIn("directive_applied", kinds)
        self.assertNotIn("fill", kinds)

    def test_drawdown_kill_switch_end_to_end(self):
        lp = self.loop(always(decision(conf=0.95)), starting_cash=100_000)
        # Huge risk config would be needed to lose 15% with 1% risk per trade; instead
        # simulate a gap through the stop: price halves between two ticks.
        run(lp, 90, self.wiggle)
        qty = lp.broker.position("BTC-PERP").qty
        self.assertGreater(qty, 0)
        lp.risk.limits = type(lp.risk.limits)(max_drawdown_pct=0.001)
        lp.on_event(book(ts=90 * MIN + 1, mid=50.0, spread=0.01, bid_sizes=(1e6,) * 5, ask_sizes=(1e6,) * 5))
        self.assertTrue(lp.risk.kill_switch.tripped)
        self.assertEqual(lp.broker.position("BTC-PERP").qty, 0)


class ShadowTests(unittest.TestCase):
    def test_shadow_schema_scored_but_never_trades(self):
        live = decision(direction="neutral", conf=0.9)
        shadow_schema = compile_schema(Finalist("btc", "BTC-PERP", "t2", "none"), 2)

        def jev(schema, state):
            return decision(conf=0.99) if schema["version"] == 2 else live

        with tempfile.TemporaryDirectory() as d:
            lp = build_loop(ScriptedJevClient(jev), d, schemas=SCHEMAS)
            lp.shadow_schemas = {"BTC-PERP": shadow_schema}
            for ev in SyntheticFeed({"BTC-PERP": 100.0}, 0, 12 * 3_600_000):
                lp.on_event(ev)
            lp.journal.close()
            recs = read_journal(os.path.join(d, "journal.jsonl"))
        self.assertNotIn("fill", [r["kind"] for r in recs])  # shadow said long@0.99; nothing traded
        res = run_review(recs, ReviewConfig(min_samples=10), "2026-10-19")
        key = f"btc@{shadow_schema['hash']}"
        self.assertIn(key, res.metrics["shadow"])
        self.assertGreater(res.metrics["shadow"][key]["n"], 10)


class ReviewTests(unittest.TestCase):
    def test_brier_known_values(self):
        self.assertAlmostEqual(brier_multiclass({"long": 1, "short": 0, "neutral": 0}, "long"), 0)
        self.assertAlmostEqual(brier_multiclass({"long": 0, "short": 1, "neutral": 0}, "long"), 2)
        self.assertAlmostEqual(brier_multiclass({"long": .5, "short": .5, "neutral": 0}, "long"), .5)

    def test_insufficient_data_proposes_nothing_and_never_autodeploys(self):
        with tempfile.TemporaryDirectory() as d:
            lp = build_loop(ScriptedJevClient(), d, schemas=SCHEMAS)
            for ev in SyntheticFeed({"BTC-PERP": 100.0}, 0, 6 * 3_600_000):
                lp.on_event(ev)
            lp.journal.close()
            res = run_review(read_journal(os.path.join(d, "journal.jsonl")),
                             ReviewConfig(min_samples=300), "2026-10-19")
        self.assertFalse(res.metrics["sufficient_data"])
        self.assertEqual(res.proposal["changes"], [])
        self.assertFalse(res.proposal["auto_deploy"])
        self.assertEqual(res.proposal["status"], "pending_operator_approval")

    def test_no_skill_model_gets_halt_proposal(self):
        # A model that always says "long, 95% sure" on a driftless walk has no skill.
        with tempfile.TemporaryDirectory() as d:
            lp = build_loop(always(decision(conf=0.95)), d, schemas=SCHEMAS)
            for ev in SyntheticFeed({"BTC-PERP": 100.0}, 0, 5 * 24 * 3_600_000, seed=3):
                lp.on_event(ev)
            lp.journal.close()
            res = run_review(read_journal(os.path.join(d, "journal.jsonl")),
                             ReviewConfig(min_samples=300), "2026-10-19")
        self.assertTrue(res.metrics["sufficient_data"])
        self.assertLess(res.metrics["brier_skill"], 0)
        self.assertIn("halt_new_entries", [c["type"] for c in res.proposal["changes"]])
        self.assertFalse(res.proposal["auto_deploy"])


if __name__ == "__main__":
    unittest.main()
