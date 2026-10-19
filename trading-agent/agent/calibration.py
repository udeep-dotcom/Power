"""Map Jev's raw direction confidence to an empirical win probability.

Kelly needs P(trade wins), not P(the model's label is right). Until enough
resolved trades exist, raw confidence is shrunk hard toward 0.5 so a
confident-but-uncalibrated model cannot size up.
"""

from __future__ import annotations

import json
from dataclasses import dataclass, field


@dataclass
class Calibrator:
    min_samples: int = 300
    prior_shrink: float = 0.5          # p_used = 0.5 + shrink * (p_raw - 0.5) before fitting
    knots_x: list[float] = field(default_factory=list)
    knots_y: list[float] = field(default_factory=list)
    n_fit: int = 0

    @property
    def fitted(self) -> bool:
        return self.n_fit >= self.min_samples and len(self.knots_x) >= 2

    def predict(self, p_raw: float) -> float:
        p_raw = min(1.0, max(0.0, p_raw))
        if not self.fitted:
            return 0.5 + self.prior_shrink * (p_raw - 0.5)
        xs, ys = self.knots_x, self.knots_y
        if p_raw <= xs[0]:
            return ys[0]
        if p_raw >= xs[-1]:
            return ys[-1]
        for i in range(1, len(xs)):
            if p_raw <= xs[i]:
                w = (p_raw - xs[i - 1]) / (xs[i] - xs[i - 1])
                return ys[i - 1] + w * (ys[i] - ys[i - 1])
        return ys[-1]

    def fit(self, pairs: list[tuple[float, int]]) -> "Calibrator":
        """Isotonic regression (pool-adjacent-violators) on (p_raw, won) pairs."""
        out = Calibrator(min_samples=self.min_samples, prior_shrink=self.prior_shrink)
        out.n_fit = len(pairs)
        if len(pairs) < self.min_samples:
            return out
        grouped: dict[float, list[float]] = {}
        for x, y in pairs:  # pool identical x first so knots_x is strictly increasing
            g = grouped.setdefault(x, [0.0, 0.0, 0.0])
            g[0] += x
            g[1] += float(y)
            g[2] += 1.0
        blocks: list[list[float]] = []  # [sum_x, sum_y, count]
        for x in sorted(grouped):
            blocks.append(grouped[x])
            while len(blocks) > 1 and blocks[-2][1] / blocks[-2][2] > blocks[-1][1] / blocks[-1][2]:
                b = blocks.pop()
                blocks[-1] = [blocks[-1][0] + b[0], blocks[-1][1] + b[1], blocks[-1][2] + b[2]]
        out.knots_x = [b[0] / b[2] for b in blocks]
        out.knots_y = [b[1] / b[2] for b in blocks]
        if len(out.knots_x) < 2:
            out.knots_x, out.knots_y = [0.0, 1.0], [out.knots_y[0]] * 2
        return out

    def to_json(self) -> str:
        return json.dumps(self.__dict__, indent=2)

    @staticmethod
    def from_json(text: str) -> "Calibrator":
        return Calibrator(**json.loads(text))
