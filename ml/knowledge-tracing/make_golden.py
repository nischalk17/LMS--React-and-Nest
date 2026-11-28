"""Writes golden.json: feature vectors for fixed histories.

The TypeScript implementation (backend/src/mastery) is tested against this file,
so both languages are pinned to the same numbers. Re-run only if the feature
definitions change deliberately.
"""

import json
from pathlib import Path

from features import FEATURES, next_step_features

CASES = [
    ([], []),
    ([1], [1]),
    ([0, 0], [0, 0]),
    ([1, 0, 1, 1], [1, 1, 0, 1, 0, 1, 1]),
    ([1, 1, 1, 1, 1, 0], [0, 1, 1, 1, 1, 1, 0, 1, 0]),
]

out = {
    "features": FEATURES,
    "cases": [
        {"skillHistory": s, "overallHistory": o, "features": next_step_features(s, o)}
        for s, o in CASES
    ],
}
Path(__file__).with_name("golden.json").write_text(json.dumps(out, indent=2) + "\n")
print(f"wrote golden.json with {len(CASES)} cases")
