"""Tests for the feature definitions and the training pipeline."""

import json
import math
import subprocess
import sys
from pathlib import Path

import pandas as pd
import pytest
from features import FEATURES, build_features, next_step_features
from synthetic import simulate

HERE = Path(__file__).parent


def test_next_step_features_match_hand_calculation():
    # skill history 1,0,1,1 -> n=4, correct=3; last three = 0,1,1
    # overall history has 7 answers, 5 correct
    got = next_step_features([1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 1])
    expected = [
        math.log1p(4),
        (3 + 1) / (4 + 2),  # smoothed skill accuracy = 0.6667
        1.0,  # last answer on the skill was correct
        (2 + 1) / (3 + 2),  # smoothed accuracy over the last 3 = 0.6
        (5 + 1) / (7 + 2),  # smoothed overall accuracy = 0.6667
        math.log1p(7),
        1.0,
    ]
    assert got == pytest.approx(expected)


def test_no_history_falls_back_to_the_prior():
    got = dict(zip(FEATURES, next_step_features([], []), strict=True))
    assert got["skill_rate"] == pytest.approx(0.5)
    assert got["overall_rate"] == pytest.approx(0.5)
    assert got["has_history"] == 0.0 and got["last_correct"] == 0.0


def _frame(answers):
    """answers: list of (skill, correct) for one student, in time order."""
    return pd.DataFrame(
        {
            "order_id": range(1, len(answers) + 1),
            "user_id": 1,
            "skill_id": [s for s, _ in answers],
            "correct": [c for _, c in answers],
        }
    )


def test_vectorised_builder_equals_the_reference_definition():
    answers = [(0, 1), (1, 0), (0, 0), (0, 1), (1, 1), (0, 1), (0, 1), (1, 0), (0, 0)]
    out = build_features(_frame(answers))
    for t in range(len(answers)):
        skill = answers[t][0]
        skill_hist = [c for s, c in answers[:t] if s == skill]
        overall = [c for _, c in answers[:t]]
        want = next_step_features(skill_hist, overall)
        got = out.loc[t, FEATURES].to_numpy(dtype=float)
        assert got == pytest.approx(want), f"mismatch at step {t}"


def test_features_never_use_the_future():
    answers = [(0, 1), (0, 0), (1, 1), (0, 1), (1, 0)]
    base = build_features(_frame(answers))
    flipped = build_features(_frame(answers[:3] + [(0, 0), (1, 1)]))  # change steps 3 and 4
    # steps 0..3 are unaffected by what happens at or after step 3 (features use the past only)
    assert base.loc[:3, FEATURES].to_numpy() == pytest.approx(flipped.loc[:3, FEATURES].to_numpy())


def test_golden_file_matches_current_implementation():
    golden = json.loads((HERE / "golden.json").read_text())
    for case in golden["cases"]:
        assert next_step_features(case["skillHistory"], case["overallHistory"]) == pytest.approx(
            case["features"]
        )


def test_training_pipeline_runs_on_synthetic_data_and_beats_chance(tmp_path):
    subprocess.run(
        [sys.executable, "train.py", "--synthetic", "--out", str(tmp_path)],
        cwd=HERE,
        check=True,
        capture_output=True,
    )
    report = json.loads((tmp_path / "results.json").read_text())
    assert report["is_synthetic"] is True
    assert report["models"]["logistic_regression"]["auc"] > 0.6
    assert report["models"]["majority_class"]["auc"] == 0.5
    # student-level split: no student on both sides
    assert report["train_students"] + report["test_students"] == report["students"]
    assert (tmp_path / "roc.png").exists() and (tmp_path / "calibration.png").exists()


def test_synthetic_model_can_never_be_exported(tmp_path):
    result = subprocess.run(
        [sys.executable, "train.py", "--synthetic", "--export-ts", str(tmp_path / "m.ts")],
        cwd=HERE,
        capture_output=True,
        text=True,
    )
    assert result.returncode != 0
    assert not (tmp_path / "m.ts").exists()


def test_simulator_is_reproducible():
    assert simulate(seed=1, n_students=5).equals(simulate(seed=1, n_students=5))
