import io
import json
import unittest
import urllib.error

from helpers import decision

from agent.calibration import Calibrator
from agent.directives import DirectiveRejected, validate_directive
from agent.jev_client import HttpJevClient, JevError, make_decision, parse_response
from agent.schema import Finalist, compile_schema, validate_schema

FIN = Finalist(id="t", symbol="BTC-PERP", thesis="x", bias="long", invalidation=("y",))


def good_payload():
    d = decision()
    return {"answers": {
        "regime": {"probabilities": d.regime_p},
        "direction": {"probabilities": d.direction_p},
        "toxic_flow": {"probability": d.toxic_flow_p},
        "setup_quality": {"probabilities": {str(k): v for k, v in d.setup_quality_p.items()}},
        "risk_state": {"probabilities": d.risk_state_p},
    }}


class _Resp(io.BytesIO):
    def __enter__(self):
        return self

    def __exit__(self, *a):
        return False


class JevTests(unittest.TestCase):
    def test_parse_valid(self):
        d = parse_response(good_payload(), 81.0, "jev-latest")
        self.assertEqual((d.direction, d.setup_quality, d.risk_state), ("long", 3, "safe"))

    def test_malformed_responses_raise(self):
        bad = good_payload()
        bad["answers"]["direction"]["probabilities"]["sideways"] = 0.0
        with self.assertRaises(JevError):
            parse_response(bad, 0, "")
        bad = good_payload()
        del bad["answers"]["risk_state"]
        with self.assertRaises(JevError):
            parse_response(bad, 0, "")
        with self.assertRaises(JevError):
            make_decision({"trending": 2.0, "mean_reverting": 0, "high_vol": 0, "crisis": 0},
                          {"long": 1, "short": 0, "neutral": 0}, 0.1,
                          {0: 1, 1: 0, 2: 0, 3: 0}, {"safe": 1, "near_limit": 0, "reduce": 0})

    def test_http_client_sends_all_questions_in_one_call(self):
        calls = []
        schema = compile_schema(FIN, 1)

        def opener(req, timeout):
            calls.append(json.loads(req.data))
            self.assertTrue(req.headers["Authorization"].startswith("Bearer "))
            return _Resp(json.dumps(good_payload()).encode())

        c = HttpJevClient(api_key="k", opener=opener)
        c.decide(schema, "{}")
        self.assertEqual(len(calls), 1)
        self.assertEqual(set(calls[0]["questions"]),
                         {"regime", "direction", "toxic_flow", "setup_quality", "risk_state"})

    def test_http_errors_become_jev_error(self):
        def opener(req, timeout):
            raise urllib.error.URLError("timeout")
        with self.assertRaises(JevError):
            HttpJevClient(api_key="k", opener=opener).decide(compile_schema(FIN, 1), "{}")


class SchemaTests(unittest.TestCase):
    def test_compiled_schema_validates_and_hash_detects_edits(self):
        s = compile_schema(FIN, 1)
        validate_schema(s)
        s["questions"]["direction"]["instructions"] += " edited"
        with self.assertRaises(ValueError):
            validate_schema(s)

    def test_policy_contract_options_are_frozen(self):
        s = compile_schema(FIN, 1)
        s["questions"]["regime"]["options"].append("euphoria")
        with self.assertRaises(ValueError):
            validate_schema(s)


class CalibrationTests(unittest.TestCase):
    def test_unfitted_shrinks_toward_half(self):
        self.assertAlmostEqual(Calibrator().predict(0.9), 0.7)

    def test_isotonic_fit_is_monotone(self):
        pairs = [(0.55, 0), (0.6, 1), (0.65, 0), (0.7, 0), (0.8, 1), (0.85, 0), (0.9, 1), (0.95, 1)] * 50
        c = Calibrator(min_samples=100).fit(pairs)
        self.assertTrue(c.fitted)
        ys = [c.predict(x / 100) for x in range(50, 100)]
        self.assertEqual(ys, sorted(ys))

    def test_too_few_samples_stays_unfitted(self):
        c = Calibrator(min_samples=300).fit([(0.9, 1)] * 299)
        self.assertFalse(c.fitted)


class DirectiveTests(unittest.TestCase):
    def test_only_tightening_directives_allowed(self):
        validate_directive({"type": "block_symbol", "symbol": "X", "reason": "r"})
        validate_directive({"type": "scale_down", "symbol": "X", "factor": 0.5, "reason": "r"})
        for bad in ({"type": "unblock_symbol", "symbol": "X", "reason": "r"},
                    {"type": "raise_limit", "reason": "r"},
                    {"type": "scale_down", "symbol": "X", "factor": 1.5, "reason": "r"},
                    {"type": "block_symbol", "symbol": "X"}):
            with self.subTest(bad=bad), self.assertRaises(DirectiveRejected):
                validate_directive(bad)


if __name__ == "__main__":
    unittest.main()
