import math
import unittest

from helpers import decision

from agent.calibration import Calibrator
from agent.policy import KELLY_HARD_CAP, PolicyConfig, decide
from agent.state_engine import MS_PER_YEAR, Snapshot


def snap(inventory=0.0, rv=0.6, mid=100.0, spread_bps=2.0):
    return Snapshot("BTC-PERP", 0, 0, 0, mid, spread_bps, 0.0, 0.0, 0.0, 10, rv, 0.0, 0.0,
                    inventory, 0.0, 0.0, 0.0, 0.0)


CAL = Calibrator()
NO_CLIP = PolicyConfig(max_risk_fraction=1.0)


class GateTests(unittest.TestCase):
    def test_all_gates_pass_enters(self):
        i = decide(decision(), snap(), 100_000, PolicyConfig(), CAL)
        self.assertEqual(i.action, "enter")
        self.assertEqual(i.side, "long")
        self.assertLess(i.stop_price, 100.0)
        self.assertGreater(i.take_profit_price, 100.0)

    def test_each_gate_blocks(self):
        cases = {
            "setup_quality": decision(quality=1),
            "direction_conf": decision(conf=0.80),        # must be strictly greater
            "risk_state": decision(risk_state="near_limit"),
            "toxic_flow": decision(toxic=0.6),
            "neutral": decision(direction="neutral", conf=0.9),
        }
        for gate, d in cases.items():
            with self.subTest(gate=gate):
                i = decide(d, snap(), 100_000, PolicyConfig(), CAL)
                self.assertEqual(i.action, "hold")
                self.assertIn(gate, i.gates_failed)

    def test_crisis_reduces_and_escalates(self):
        i = decide(decision(regime="crisis"), snap(inventory=5), 100_000, PolicyConfig(), CAL)
        self.assertEqual((i.action, i.qty, i.escalate), ("reduce", 5, True))

    def test_low_confidence_escalates_only_when_it_matters(self):
        flat_neutral = decide(decision(direction="neutral", conf=0.5), snap(), 1e5, PolicyConfig(), CAL)
        self.assertFalse(flat_neutral.escalate)
        held = decide(decision(direction="neutral", conf=0.5), snap(inventory=1), 1e5, PolicyConfig(), CAL)
        self.assertTrue(held.escalate)
        directional = decide(decision(conf=0.55), snap(), 1e5, PolicyConfig(), CAL)
        self.assertTrue(directional.escalate)

    def test_opposing_signal_exits(self):
        i = decide(decision(direction="short", conf=0.9), snap(inventory=3), 1e5, PolicyConfig(), CAL)
        self.assertEqual((i.action, i.qty), ("exit", 3))

    def test_no_pyramiding(self):
        i = decide(decision(), snap(inventory=3), 1e5, PolicyConfig(), CAL)
        self.assertEqual(i.action, "hold")
        self.assertIn("positioned", i.gates_failed)


class SizingTests(unittest.TestCase):
    def test_kelly_math_uses_calibrated_p_and_cost_adjusted_payoff(self):
        cfg = NO_CLIP
        s = snap()
        i = decide(decision(conf=0.9), s, 100_000, cfg, CAL)
        sigma_h = 0.6 * math.sqrt(cfg.horizon_ms / MS_PER_YEAR)
        stop = sigma_h * 100.0
        tp = 2 * stop
        cost = 12 / 1e4 * 100.0
        b = (tp - cost) / (stop + cost)
        p = 0.5 + 0.5 * (0.9 - 0.5)  # uncalibrated -> shrunk to 0.70
        f = 0.25 * (p - (1 - p) / b)
        self.assertAlmostEqual(i.p_win, p)
        self.assertAlmostEqual(i.payoff_ratio, b)
        self.assertAlmostEqual(i.risk_fraction, f)
        self.assertAlmostEqual(i.qty, f * 100_000 / stop)

    def test_kelly_fraction_cannot_exceed_quarter(self):
        with self.assertRaises(ValueError):
            PolicyConfig(kelly_fraction=0.5)
        self.assertEqual(KELLY_HARD_CAP, 0.25)

    def test_risk_fraction_clipped(self):
        i = decide(decision(conf=0.99), snap(), 100_000, PolicyConfig(max_risk_fraction=0.005), CAL)
        self.assertAlmostEqual(i.risk_fraction, 0.005)

    def test_notional_cap(self):
        i = decide(decision(), snap(), 100_000, PolicyConfig(), CAL, max_notional=1_000)
        self.assertAlmostEqual(i.qty * 100.0, 1_000)

    def test_costs_can_kill_the_trade(self):
        cfg = PolicyConfig(round_trip_cost_bps=500)
        i = decide(decision(), snap(rv=0.2), 100_000, cfg, CAL)
        self.assertEqual(i.action, "hold")
        self.assertIn("edge", i.gates_failed)

    def test_no_vol_history_holds(self):
        i = decide(decision(), snap(rv=None), 100_000, PolicyConfig(), CAL)
        self.assertEqual(i.action, "hold")


if __name__ == "__main__":
    unittest.main()
