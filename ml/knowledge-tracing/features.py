"""Skill-agnostic features for predicting whether a student's NEXT answer is correct.

Why skill-agnostic: the public training data (ASSISTments) has its own skill ids,
which do not exist in the LMS. So the model never sees a skill id. It only sees
the student's history on the skill being asked about, plus their overall history.
At prediction time in the LMS, "mastery" of a skill is the model's predicted
probability that the student's next answer on that skill is correct.

The exact same definitions are re-implemented in TypeScript in
backend/src/mastery/mastery.features.ts. A shared golden file
(golden.json) pins both implementations to identical numbers.
"""

from __future__ import annotations

import numpy as np
import pandas as pd

PRIOR = 0.5  # prior probability of a correct answer
PRIOR_WEIGHT = 2.0  # pseudo-observations backing the prior ("K" in the docs)
RECENT_WINDOW = 3

FEATURES = [
    "log_n_skill",  # log(1 + previous attempts on this skill)
    "skill_rate",  # smoothed accuracy on this skill
    "last_correct",  # was the last attempt on this skill correct (0 if none)
    "recent_rate",  # smoothed accuracy over the last 3 attempts on this skill
    "overall_rate",  # smoothed accuracy across all skills
    "log_n_overall",  # log(1 + previous attempts on any skill)
    "has_history",  # 1 if the student already attempted this skill
]


def smooth(correct: float, total: float) -> float:
    return (correct + PRIOR_WEIGHT * PRIOR) / (total + PRIOR_WEIGHT)


def build_features(df: pd.DataFrame) -> pd.DataFrame:
    """Return one row of features per interaction, using ONLY earlier interactions.

    Expects columns: user_id, skill_id, correct (0/1) and an ordering column
    `order_id` (monotonic in time). Returns df with the FEATURES columns added,
    sorted by (user_id, order_id).
    """
    df = df.sort_values(["user_id", "order_id"], kind="stable").reset_index(drop=True)
    correct = df["correct"].astype(float)

    by_skill = df.groupby(["user_id", "skill_id"], sort=False)
    n_skill = by_skill.cumcount().astype(float)  # attempts before this one
    cum_skill = correct.groupby([df["user_id"], df["skill_id"]], sort=False).cumsum()
    c_skill = cum_skill - correct  # correct answers before this one

    # last attempt on this skill, 0 when there is none
    last = correct.groupby([df["user_id"], df["skill_id"]], sort=False).shift(1).fillna(0.0)

    # correct answers among the previous RECENT_WINDOW attempts on this skill
    lagged = cum_skill.groupby([df["user_id"], df["skill_id"]], sort=False).shift(
        RECENT_WINDOW + 1, fill_value=0.0
    )
    c_recent = (cum_skill - correct) - lagged
    n_recent = np.minimum(n_skill, RECENT_WINDOW)

    by_user = df.groupby("user_id", sort=False)
    n_all = by_user.cumcount().astype(float)
    cum_all = correct.groupby(df["user_id"], sort=False).cumsum()
    c_all = cum_all - correct

    out = df.copy()
    out["log_n_skill"] = np.log1p(n_skill)
    out["skill_rate"] = (c_skill + PRIOR_WEIGHT * PRIOR) / (n_skill + PRIOR_WEIGHT)
    out["last_correct"] = last
    out["recent_rate"] = (c_recent + PRIOR_WEIGHT * PRIOR) / (n_recent + PRIOR_WEIGHT)
    out["overall_rate"] = (c_all + PRIOR_WEIGHT * PRIOR) / (n_all + PRIOR_WEIGHT)
    out["log_n_overall"] = np.log1p(n_all)
    out["has_history"] = (n_skill > 0).astype(float)
    return out


def next_step_features(history: list[int], overall: list[int]) -> list[float]:
    """Features for predicting the NEXT answer, given plain 0/1 histories.

    `history` = this student's answers on the skill (oldest first),
    `overall` = all of their answers on any skill (oldest first).
    Used to build golden test vectors and to mirror the TypeScript code.
    """
    n = len(history)
    recent = history[-RECENT_WINDOW:]
    return [
        float(np.log1p(n)),
        smooth(sum(history), n),
        float(history[-1]) if n else 0.0,
        smooth(sum(recent), len(recent)),
        smooth(sum(overall), len(overall)),
        float(np.log1p(len(overall))),
        1.0 if n else 0.0,
    ]
