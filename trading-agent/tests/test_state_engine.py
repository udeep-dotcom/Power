import math
import unittest

from helpers import book, trade

from agent.state_engine import (MAX_SNAPSHOT_TOKENS, CausalityError, StateEngine,
                                StateEngineConfig, estimate_tokens)
from agent.types import PortfolioView, Side

MIN = 60_000


def feed(engine, until_ms, step=5_000, drift=0.0):
    t, mid = 0, 100.0
    while t <= until_ms:
        engine.ingest(book(ts=t, mid=mid))
        engine.ingest(trade(ts=t + 1, side=Side.BUY if (t // step) % 3 else Side.SELL))
        mid *= math.exp(drift + 0.001 * math.sin(t / 7_000))
        t += step


class StateEngineTests(unittest.TestCase):
    def test_out_of_order_event_raises(self):
        e = StateEngine("BTC-PERP")
        e.ingest(book(ts=1_000))
        with self.assertRaises(CausalityError):
            e.ingest(book(ts=999))

    def test_future_events_never_change_a_past_snapshot(self):
        a, b = StateEngine("BTC-PERP"), StateEngine("BTC-PERP")
        feed(a, 70 * MIN)
        feed(b, 80 * MIN)  # same history plus 10 more minutes
        t = 70 * MIN + 1
        self.assertEqual(a.snapshot(t), b.snapshot(t))

    def test_snapshot_records_no_input_after_as_of(self):
        e = StateEngine("BTC-PERP")
        feed(e, 70 * MIN)
        s = e.snapshot(65 * MIN)
        self.assertLessEqual(s.max_input_ts, s.as_of)

    def test_snapshot_fits_token_budget_with_extreme_values(self):
        e = StateEngine("BTC-PERP")
        feed(e, 70 * MIN, drift=0.0003)
        pv = PortfolioView(inventory=-123456.789012, exposure_pct=0.1987654321,
                           unrealized_pnl_bps=-1234.56789, drawdown_pct=0.1499999,
                           daily_pnl_pct=-0.0299999)
        text = e.snapshot(70 * MIN, pv).to_state()
        self.assertLessEqual(estimate_tokens(text), MAX_SNAPSHOT_TOKENS)

    def test_spread_and_imbalance(self):
        e = StateEngine("BTC-PERP", StateEngineConfig(depth_levels=2))
        e.ingest(book(ts=0, mid=100.0, spread=0.10, bid_sizes=(3, 1), ask_sizes=(1, 1)))
        s = e.snapshot(0)
        self.assertAlmostEqual(s.spread_bps, 10.0, places=6)
        self.assertAlmostEqual(s.book_imbalance, (4 - 2) / 6)
        self.assertGreater(s.microprice_dev_bps, 0)  # heavier bid pushes microprice up

    def test_realized_vol_matches_constant_bar_returns(self):
        cfg = StateEngineConfig(bar_ms=MIN, rv_window_ms=60 * MIN)
        e = StateEngine("BTC-PERP", cfg)
        mid = 100.0
        for i in range(62):
            # alternate +/-1% bar returns: sample std of log returns is known exactly
            e.ingest(book(ts=i * MIN, mid=mid, spread=0.0001))
            mid *= 1.01 if i % 2 == 0 else 1 / 1.01
        s = e.snapshot(61 * MIN)
        r = math.log(1.01)
        rets = [r if i % 2 == 0 else -r for i in range(60)]
        mean = sum(rets) / 60
        std = math.sqrt(sum((x - mean) ** 2 for x in rets) / 59)
        expected = std * math.sqrt(365 * 24 * 60)
        self.assertAlmostEqual(s.rv_ann / expected, 1.0, places=2)

    def test_vol_is_none_without_history(self):
        e = StateEngine("BTC-PERP")
        e.ingest(book(ts=0))
        self.assertIsNone(e.snapshot(0).rv_ann)

    def test_crossed_book_rejected(self):
        e = StateEngine("BTC-PERP")
        with self.assertRaises(ValueError):
            e.ingest(book(ts=0, spread=-0.05))

    def test_flow_imbalance_window(self):
        e = StateEngine("BTC-PERP", StateEngineConfig(flow_window_ms=MIN))
        e.ingest(book(ts=0))
        e.ingest(trade(ts=1, size=5, side=Side.SELL))       # falls out of the window
        e.ingest(trade(ts=MIN + 10, size=1, side=Side.BUY))
        self.assertEqual(e.snapshot(MIN + 20).flow_imbalance, 1.0)


if __name__ == "__main__":
    unittest.main()
