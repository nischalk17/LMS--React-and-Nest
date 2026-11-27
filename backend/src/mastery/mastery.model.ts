/** Shape of the exported logistic-regression model (see ml/knowledge-tracing/train.py). */
export interface MasteryModel {
  version: number;
  features: string[];
  mean: number[];
  scale: number[];
  coef: number[];
  intercept: number;
  prior: number;
  priorWeight: number;
  recentWindow: number;
  trainedOn: { dataset: string; rows: number; students: number };
  heldOut: { auc: number; accuracy: number };
}
