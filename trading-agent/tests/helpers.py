import os
import sys

sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from agent.jev_client import make_decision  # noqa: E402
from agent.types import BookEvent, BookLevel, Side, TradeEvent  # noqa: E402


def book(symbol="BTC-PERP", ts=0, mid=100.0, spread=0.02, bid_sizes=(1,) * 5, ask_sizes=(1,) * 5):
    bids = tuple(BookLevel(mid - spread / 2 - i * 0.01, s) for i, s in enumerate(bid_sizes))
    asks = tuple(BookLevel(mid + spread / 2 + i * 0.01, s) for i, s in enumerate(ask_sizes))
    return BookEvent(symbol, ts, ts, bids, asks)


def trade(symbol="BTC-PERP", ts=0, price=100.0, size=1.0, side=Side.BUY):
    return TradeEvent(symbol, ts, ts, price, size, side)


def decision(direction="long", conf=0.9, regime="trending", regime_conf=0.7, quality=3,
             risk_state="safe", toxic=0.1):
    others = [d for d in ("long", "short", "neutral") if d != direction]
    dp = {direction: conf, others[0]: (1 - conf) / 2, others[1]: (1 - conf) / 2}
    regimes = ["trending", "mean_reverting", "high_vol", "crisis"]
    rp = {r: (regime_conf if r == regime else (1 - regime_conf) / 3) for r in regimes}
    sq = {i: (0.7 if i == quality else 0.1) for i in range(4)}
    rs = {r: (0.8 if r == risk_state else 0.1) for r in ("safe", "near_limit", "reduce")}
    return make_decision(rp, dp, toxic, sq, rs)
