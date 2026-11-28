"""Simulated students, used ONLY to test the pipeline and for demo seed data.

Never used for the published metrics: those come from the public ASSISTments
data. Students have a latent ability, skills have a difficulty, and ability
grows a little with practice (so a history signal exists to learn from).
"""

from __future__ import annotations

import numpy as np
import pandas as pd


def simulate(
    n_students: int = 300,
    n_skills: int = 8,
    steps: int = 60,
    seed: int = 0,
) -> pd.DataFrame:
    rng = np.random.default_rng(seed)
    ability = rng.normal(0.0, 1.0, n_students)
    difficulty = rng.normal(0.0, 0.7, n_skills)
    learning = rng.uniform(0.02, 0.12, n_students)

    rows = []
    order = 0
    for u in range(n_students):
        practice = np.zeros(n_skills)
        for _ in range(steps):
            s = int(rng.integers(0, n_skills))
            logit = ability[u] - difficulty[s] + learning[u] * practice[s] + 0.4
            p = 1.0 / (1.0 + np.exp(-logit))
            correct = int(rng.random() < p)
            practice[s] += 1
            order += 1
            rows.append((order, u, s, correct))
    return pd.DataFrame(rows, columns=["order_id", "user_id", "skill_id", "correct"])
