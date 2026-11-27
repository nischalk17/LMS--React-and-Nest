import { isAxiosError } from 'axios';
import api from './api';

export interface QuizQuestion {
  id?: string;
  text: string;
  options: string[];
  /** Only present for the course's instructor. */
  correctIndex?: number;
}

export interface Quiz {
  id: string;
  courseId: string;
  title: string;
  passingScore: number;
  questions: QuizQuestion[];
}

export interface QuizDraft {
  title: string;
  passingScore: number;
  questions: { text: string; options: string[]; correctIndex: number }[];
}

export interface AttemptResult {
  id: string;
  score: number;
  passed: boolean;
  correct: number;
  total: number;
  passingScore: number;
  results: boolean[];
}

export interface AttemptSummary {
  id: string;
  score: number;
  passed: boolean;
  createdAt: string;
}

export const quizService = {
  /** Returns null when the course has no quiz yet (404). */
  async get(courseId: string): Promise<Quiz | null> {
    try {
      return (await api.get<Quiz>(`/courses/${courseId}/quiz`)).data;
    } catch (err) {
      if (isAxiosError(err) && err.response?.status === 404) return null;
      throw err;
    }
  },

  async save(courseId: string, draft: QuizDraft): Promise<Quiz> {
    return (await api.put<Quiz>(`/courses/${courseId}/quiz`, draft)).data;
  },

  async remove(courseId: string): Promise<void> {
    await api.delete(`/courses/${courseId}/quiz`);
  },

  async submit(courseId: string, answers: number[]): Promise<AttemptResult> {
    return (
      await api.post<AttemptResult>(`/courses/${courseId}/quiz/attempts`, {
        answers,
      })
    ).data;
  },

  async myAttempts(courseId: string): Promise<AttemptSummary[]> {
    return (
      await api.get<AttemptSummary[]>(`/courses/${courseId}/quiz/attempts/mine`)
    ).data;
  },
};
