import type { MasteryModel } from './mastery.model';

/**
 * Pure functions, mirrored from ml/knowledge-tracing/features.py. A shared
 * golden file (ml/knowledge-tracing/golden.json) pins both implementations to
 * the same numbers; see mastery.features.spec.ts.
 */

/** Used for the fallback estimate and as defaults when no model is loaded. */
export const DEFAULT_PRIOR = 0.5;
export const DEFAULT_PRIOR_WEIGHT = 2;
export const DEFAULT_RECENT_WINDOW = 3;

export interface FeatureConfig {
  prior: number;
  priorWeight: number;
  recentWindow: number;
}

const DEFAULTS: FeatureConfig = {
  prior: DEFAULT_PRIOR,
  priorWeight: DEFAULT_PRIOR_WEIGHT,
  recentWindow: DEFAULT_RECENT_WINDOW,
};

export function smooth(
  correct: number,
  total: number,
  cfg: FeatureConfig = DEFAULTS,
): number {
  return (correct + cfg.priorWeight * cfg.prior) / (total + cfg.priorWeight);
}

const sum = (xs: number[]) => xs.reduce((a, b) => a + b, 0);

/**
 * Features for predicting the NEXT answer. Order matches the model's
 * `features` array: log_n_skill, skill_rate, last_correct, recent_rate,
 * overall_rate, log_n_overall, has_history.
 *
 * @param skillHistory this student's answers (1 = correct) on the skill, oldest first
 * @param overall      all of the student's answers in the course, oldest first
 */
export function nextStepFeatures(
  skillHistory: number[],
  overall: number[],
  cfg: FeatureConfig = DEFAULTS,
): number[] {
  const n = skillHistory.length;
  const recent = skillHistory.slice(-cfg.recentWindow);
  return [
    Math.log1p(n),
    smooth(sum(skillHistory), n, cfg),
    n ? skillHistory[n - 1] : 0,
    smooth(sum(recent), recent.length, cfg),
    smooth(sum(overall), overall.length, cfg),
    Math.log1p(overall.length),
    n ? 1 : 0,
  ];
}

const sigmoid = (z: number) => 1 / (1 + Math.exp(-z));

/** Probability that the next answer is correct, from the exported model. */
export function predict(model: MasteryModel, features: number[]): number {
  if (features.length !== model.coef.length) {
    throw new Error('feature count does not match the model');
  }
  let z = model.intercept;
  for (let i = 0; i < features.length; i++) {
    z += model.coef[i] * ((features[i] - model.mean[i]) / model.scale[i]);
  }
  return sigmoid(z);
}

export type Confidence = 'low' | 'medium' | 'high';

/** How much history backs a number; used to avoid over-trusting tiny samples. */
export function confidenceFor(attempts: number): Confidence {
  if (attempts < 3) return 'low';
  if (attempts < 8) return 'medium';
  return 'high';
}

export interface SkillMastery {
  skill: string;
  attempts: number;
  correct: number;
  /** Probability the next answer on this skill is correct (0-1). */
  mastery: number;
  /** "model" = trained logistic regression, "estimate" = smoothed accuracy. */
  method: 'model' | 'estimate';
  confidence: Confidence;
}

export interface ResponseRow {
  skill: string;
  correct: boolean;
}

/**
 * Computes mastery per skill from a student's responses in ONE course,
 * ordered oldest first. Uses the trained model when one is shipped,
 * otherwise a smoothed accuracy estimate.
 */
export function computeMastery(
  rows: ResponseRow[],
  model: MasteryModel | null,
): SkillMastery[] {
  const overall = rows.map((r) => (r.correct ? 1 : 0));
  const bySkill = new Map<string, number[]>();
  for (const r of rows) {
    const list = bySkill.get(r.skill) ?? [];
    list.push(r.correct ? 1 : 0);
    bySkill.set(r.skill, list);
  }

  const cfg: FeatureConfig = model ?? DEFAULTS;
  return [...bySkill.entries()]
    .map(([skill, history]) => {
      const correct = sum(history);
      const mastery = model
        ? predict(model, nextStepFeatures(history, overall, cfg))
        : smooth(correct, history.length, cfg);
      return {
        skill,
        attempts: history.length,
        correct,
        mastery: Math.round(mastery * 1000) / 1000,
        method: model ? ('model' as const) : ('estimate' as const),
        confidence: confidenceFor(history.length),
      };
    })
    .sort((a, b) => a.mastery - b.mastery || a.skill.localeCompare(b.skill));
}
