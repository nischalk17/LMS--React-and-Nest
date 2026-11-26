import api from './api';

interface Person {
  id: string;
  firstName: string;
  lastName: string;
}

export interface Question {
  id: string;
  courseId: string;
  body: string;
  createdAt: string;
  author: Person;
  answer: string | null;
  answeredAt: string | null;
  answeredBy: Person | null;
}

export const questionService = {
  async list(courseId: string): Promise<Question[]> {
    const res = await api.get<Question[]>(`/courses/${courseId}/questions`);
    return res.data;
  },

  async ask(courseId: string, body: string): Promise<Question> {
    const res = await api.post<Question>(`/courses/${courseId}/questions`, {
      body,
    });
    return res.data;
  },

  async answer(questionId: string, answer: string): Promise<Question> {
    const res = await api.patch<Question>(`/questions/${questionId}/answer`, {
      answer,
    });
    return res.data;
  },
};
