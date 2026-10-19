import os
import tempfile
import unittest

import helpers  # noqa: F401

from agent.risk import DAY_MS, KillSwitch, RiskContext, RiskLayer, RiskLimits
from agent.types import OrderRequest, Side


def ctx(now=1_000, equity=100_000.0, mid=100.0, pos=0.0, gross=0.0, data_ts=None):
    return RiskContext(now=now, equity=equity, mid=mid, data_ts=now if data_ts is None else data_ts,
                       position_qty=pos, gross_exposure=gross)


def buy(qty=10.0, stop=99.0, ref=100.0, reduce_only=False, side=Side.BUY):
    return OrderRequest("BTC-PERP", side, qty, reduce_only=reduce_only, ref_price=ref, stop_price=stop)


class RiskTests(unittest.TestCase):
    def setUp(self):
        self.r = RiskLayer(RiskLimits())

    def test_valid_order_approved(self):
        self.assertTrue(self.r.check(buy(), ctx()).approved)

    def test_mandate_drawdown_cannot_be_configured_above_15pct(self):
        with self.assertRaises(ValueError):
            RiskLimits(max_drawdown_pct=0.20)

    def test_drawdown_trips_and_latches_kill_switch(self):
        self.r.on_equity(100_000, 0)
        self.r.on_equity(85_500, 1)
        self.assertFalse(self.r.kill_switch.tripped)
        self.r.on_equity(85_000, 2)  # exactly 15%
        self.assertTrue(self.r.kill_switch.tripped)
        self.r.on_equity(120_000, 3)  # recovery does not un-trip
        self.assertTrue(self.r.kill_switch.tripped)
        v = self.r.check(buy(), ctx(equity=120_000))
        self.assertFalse(v.approved)
        self.assertIn("kill switch", v.reasons[0])

    def test_exits_always_allowed_after_kill(self):
        self.r.kill_switch.trip("test")
        sell = buy(qty=5, stop=None, side=Side.SELL, reduce_only=True)
        self.assertTrue(self.r.check(sell, ctx(pos=10)).approved)

    def test_reduce_only_cannot_flip_or_grow(self):
        sell = buy(qty=15, stop=None, side=Side.SELL, reduce_only=True)
        self.assertFalse(self.r.check(sell, ctx(pos=10)).approved)
        grow = buy(qty=1, stop=None, side=Side.BUY, reduce_only=True)
        self.assertFalse(self.r.check(grow, ctx(pos=10)).approved)

    def test_daily_loss_halts_until_next_utc_day(self):
        self.r.on_equity(100_000, 10)
        self.r.on_equity(96_900, 20)
        self.assertFalse(self.r.check(buy(), ctx(now=30, equity=96_900)).approved)
        self.r.on_equity(96_900, DAY_MS + 5)
        self.assertTrue(self.r.check(buy(), ctx(now=DAY_MS + 6, equity=96_900)).approved)

    def test_position_and_order_limits(self):
        self.assertFalse(self.r.check(buy(qty=150, stop=99.9), ctx()).approved)    # order notional 15k
        self.assertFalse(self.r.check(buy(qty=60, stop=99.9), ctx(pos=200)).approved)  # pos 26k > 20k cap

    def test_gross_exposure(self):
        v = self.r.check(buy(qty=50, stop=99.9), ctx(gross=46_000))
        self.assertFalse(v.approved)
        self.assertIn("gross exposure limit", v.reasons)

    def test_stop_is_mandatory_and_bounds_risk(self):
        self.assertFalse(self.r.check(buy(stop=None), ctx()).approved)
        self.assertFalse(self.r.check(buy(stop=101.0), ctx()).approved)   # wrong side
        self.assertFalse(self.r.check(buy(qty=50, stop=70.0), ctx()).approved)  # 1500 at risk > 1000

    def test_stale_data_and_price_sanity(self):
        self.assertFalse(self.r.check(buy(), ctx(now=10_000, data_ts=0)).approved)
        self.assertFalse(self.r.check(buy(ref=101.0), ctx()).approved)

    def test_rate_limit(self):
        r = RiskLayer(RiskLimits(max_orders_per_minute=2))
        self.assertTrue(r.check(buy(qty=1), ctx(now=1)).approved)
        self.assertTrue(r.check(buy(qty=1), ctx(now=2)).approved)
        self.assertFalse(r.check(buy(qty=1), ctx(now=3)).approved)
        self.assertTrue(r.check(buy(qty=1), ctx(now=60_002)).approved)

    def test_halt_file_trips_switch_and_reset_needs_operator(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "HALT")
            ks = KillSwitch(halt_file=path)
            self.assertFalse(ks.tripped)
            open(path, "w").close()
            self.assertTrue(ks.tripped)
            with self.assertRaises(PermissionError):
                ks.operator_reset("I have reviewed the incident and accept the risk")  # file still there
            os.remove(path)
            with self.assertRaises(PermissionError):
                ks.operator_reset("yes")
            ks.operator_reset("I have reviewed the incident and accept the risk")
            self.assertFalse(ks.tripped)


class RestartTests(unittest.TestCase):
    def test_trip_persists_across_restart(self):
        with tempfile.TemporaryDirectory() as d:
            path = os.path.join(d, "HALT")
            KillSwitch(halt_file=path).trip("max drawdown")
            self.assertTrue(KillSwitch(halt_file=path).tripped)  # fresh process


if __name__ == "__main__":
    unittest.main()
