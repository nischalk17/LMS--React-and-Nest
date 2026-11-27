# ML: knowledge tracing

Predicts whether a student's **next** answer on a skill will be correct, from their quiz history. The LMS shows that probability as per-skill *mastery*.

## Status

| Piece | State |
|---|---|
| Feature definitions (Python and TypeScript, pinned together by `golden.json`) | Done and tested |
| Training and evaluation pipeline (student-level split, baselines, bootstrap CI, calibration) | Done and tested on simulated data |
| **Training on real data (ASSISTments)** | **Not run yet. No results are published until it is.** |
| Model shipped in the app | None yet, so the app shows a smoothed-accuracy **estimate** and labels it as such |

Nothing in this folder reports a metric from real data yet. `results/` appears here after the real run.

## Models compared

All evaluated on a **student-level** train/test split (no student appears in both).

1. Majority class (floor)
2. Overall-accuracy heuristic (the student's running accuracy, no skill information)
3. Skill-accuracy heuristic (running accuracy on the skill being asked)
4. Logistic regression on seven skill-agnostic features

A sequence model (GRU/DKT) is planned but deliberately not built yet; it needs PyTorch and the logistic baseline should be measured first.

### Why skill-agnostic features

ASSISTments skill ids do not exist in the LMS, so the model never sees a skill id. It sees the student's history on the skill being asked about plus their overall history: `log_n_skill`, `skill_rate`, `last_correct`, `recent_rate`, `overall_rate`, `log_n_overall`, `has_history` (definitions in `knowledge-tracing/features.py`). Accuracies are smoothed toward a prior of 0.5 with weight 2. The same definitions are implemented in `backend/src/mastery/mastery.features.ts` and both are tested against `knowledge-tracing/golden.json`.

## Run it

```bash
cd ml
python -m venv .venv
.venv/Scripts/activate            # Windows (use .venv/bin/activate on macOS/Linux)
pip install -r requirements.txt

# tests (no dataset needed)
ruff check . && ruff format --check . && pytest

# pipeline smoke test on simulated students (output is labeled synthetic and is never exported)
cd knowledge-tracing && python train.py --synthetic --out results_synthetic
```

### Real training (needs the dataset)

1. Download the public **ASSISTments 2009-2010 "skill builder"** dataset from the official ASSISTments data page (https://sites.google.com/site/assistmentsdata/). The file is `skill_builder_data.csv` (columns include `order_id`, `user_id`, `skill_id`, `correct`).
2. Put it at `ml/knowledge-tracing/data/skill_builder_data.csv`. The `data/` folder is gitignored; raw data is never committed.
3. Train, evaluate and export the model for the API:

```bash
cd ml/knowledge-tracing
python train.py --data data/skill_builder_data.csv \
    --export-ts ../../backend/src/mastery/mastery-model.ts
```

This writes `results/results.json`, `results/roc.png` and `results/calibration.png`, and regenerates `backend/src/mastery/mastery-model.ts`. After that the API switches from "estimate" to "model" automatically and the UI says which dataset the model was trained on and its held-out AUC.

Data preparation: rows without a skill are dropped, and one row is kept per interaction (the export repeats a row per skill of multi-skill problems).

## Honest limitations

- ASSISTments is school math; the LMS teaches other subjects. The model learns *how history predicts the next answer*, not subject content, which is why it transfers at all, but it is not validated on LMS data.
- Real LMS users start with no history; mastery for them is an estimate until they answer a few questions (the UI flags early estimates).
- The demo data in the seed (the `Simulated Learner NN` accounts and the demo student's history) is **simulated**, not real students.
