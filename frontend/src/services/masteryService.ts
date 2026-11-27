import api from "./api";

export interface SkillMastery {
  skill: string;
  attempts: number;
  correct: number;
  /** Probability (0-1) that the next answer on this skill is correct. */
  mastery: number;
  method: "model" | "estimate";
  confidence: "low" | "medium" | "high";
}

export interface MasteryReport {
  courseId: string;
  method: "model" | "estimate";
  model: { dataset: string; heldOutAuc: number } | null;
  totalAnswers: number;
  skills: SkillMastery[];
}

export const masteryService = {
  async mine(courseId: string): Promise<MasteryReport> {
    return (await api.get<MasteryReport>(`/courses/${courseId}/mastery/me`))
      .data;
  },
};
