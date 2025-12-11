import api from './api';
import { Course } from './courseService';

export interface Enrollment {
  id: string;
  studentId: string;
  courseId: string;
  course: Course;
  enrolledAt: string;
  progress?: Progress[];
}

export interface Progress {
  id: string;
  enrollmentId: string;
  moduleId: string;
  isCompleted: boolean;
  completionPercentage: number;
  module?: {
    id: string;
    title: string;
    type: string;
  };
}

export interface EnrollmentProgress {
  enrollment: Enrollment;
  overallProgress: number;
  completedModules: number;
  totalModules: number;
}

export const enrollmentService = {
  async enroll(courseId: string): Promise<Enrollment> {
    const response = await api.post<Enrollment>(
      `/enrollments/courses/${courseId}`
    );
    return response.data;
  },

  async getMyEnrollments(): Promise<Enrollment[]> {
    const response = await api.get<Enrollment[]>('/enrollments/my-courses');
    return response.data;
  },

  async getProgress(enrollmentId: string): Promise<EnrollmentProgress> {
    const response = await api.get<EnrollmentProgress>(
      `/enrollments/${enrollmentId}/progress`
    );
    return response.data;
  },

  async updateProgress(
    enrollmentId: string,
    moduleId: string,
    completionPercentage: number
  ): Promise<Progress> {
    const response = await api.patch<Progress>(
      `/progress/${enrollmentId}/modules/${moduleId}`,
      { completionPercentage }
    );
    return response.data;
  },
};

