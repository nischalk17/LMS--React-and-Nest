import { readFileSync } from 'fs';
import { join } from 'path';
import {
  computeMastery,
  confidenceFor,
  nextStepFeatures,
  predict,
  smooth,
} from './mastery.features';
import type { MasteryModel } from './mastery.model';

const golden = JSON.parse(
  readFileSync(
    join(__dirname, '../../../ml/knowledge-tracing/golden.json'),
    'utf8',
  ),
) as {
  features: string[];
  cases: {
    skillHistory: number[];
    overallHistory: number[];
    features: number[];
  }[];
};

const model = (over: Partial<MasteryModel> = {}): MasteryModel => ({
  version: 1,
  features: golden.features,
  mean: [0, 0, 0, 0, 0, 0, 0],
  scale: [1, 1, 1, 1, 1, 1, 1],
  coef: [0, 0, 0, 0, 0, 0, 0],
  intercept: 0,
  prior: 0.5,
  priorWeight: 2,
  recentWindow: 3,
  trainedOn: { dataset: 'test', rows: 1, students: 1 },
  heldOut: { auc: 0.7, accuracy: 0.7 },
  ...over,
});

describe('features match the Python implementation (golden file)', () => {
  it.each(golden.cases.map((c, i) => [i, c] as const))('case %i', (_i, c) => {
    const got = nextStepFeatures(c.skillHistory, c.overallHistory);
    expect(got).toHaveLength(c.features.length);
    got.forEach((value, idx) => expect(value).toBeCloseTo(c.features[idx], 10));
  });
});

describe('smooth', () => {
  it('returns the prior with no data and moves toward the data as it grows', () => {
    expect(smooth(0, 0)).toBe(0.5);
    expect(smooth(2, 2)).toBeCloseTo(3 / 4);
    expect(smooth(90, 100)).toBeGreaterThan(smooth(9, 10));
  });
});

describe('predict', () => {
  it('is 0.5 for a zero model and applies standardisation and weights', () => {
    expect(predict(model(), [1, 1, 1, 1, 1, 1, 1])).toBeCloseTo(0.5);
    const m = model({
      coef: [0, 2, 0, 0, 0, 0, 0],
      mean: [0, 0.5, 0, 0, 0, 0, 0],
      scale: [1, 0.5, 1, 1, 1, 1, 1],
    });
    // z = 2 * ((1.0 - 0.5) / 0.5) = 2  ->  sigmoid(2)
    expect(predict(m, [0, 1, 0, 0, 0, 0, 0])).toBeCloseTo(
      1 / (1 + Math.exp(-2)),
    );
  });

  it('rejects a feature vector of the wrong size', () => {
    expect(() => predict(model(), [1, 2])).toThrow(/feature count/);
  });
});

describe('computeMastery', () => {
  const rows = [
    { skill: 'Generics', correct: true },
    { skill: 'Interfaces', correct: false },
    { skill: 'Generics', correct: true },
    { skill: 'Interfaces', correct: false },
    { skill: 'Generics', correct: false },
  ];

  it('falls back to a smoothed accuracy estimate without a model', () => {
    const out = computeMastery(rows, null);
    expect(out.map((s) => s.skill)).toEqual(['Interfaces', 'Generics']); // weakest first
    const generics = out.find((s) => s.skill === 'Generics')!;
    expect(generics).toMatchObject({
      attempts: 3,
      correct: 2,
      method: 'estimate',
    });
    expect(generics.mastery).toBeCloseTo((2 + 1) / (3 + 2), 3);
    expect(generics.confidence).toBe('medium');
  });

  it('uses the model when one is provided', () => {
    const out = computeMastery(rows, model({ intercept: 2 }));
    expect(out.every((s) => s.method === 'model')).toBe(true);
    expect(out[0].mastery).toBeCloseTo(1 / (1 + Math.exp(-2)), 3);
  });

  it('returns nothing for a student with no answers', () => {
    expect(computeMastery([], null)).toEqual([]);
  });
});

describe('confidenceFor', () => {
  it('flags tiny samples as low confidence', () => {
    expect([0, 2, 3, 7, 8, 20].map(confidenceFor)).toEqual([
      'low',
      'low',
      'medium',
      'medium',
      'high',
      'high',
    ]);
  });
});
