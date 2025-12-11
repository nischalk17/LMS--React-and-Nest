import api from './api';

export interface Module {
  id: string;
  title: string;
  content?: string;
  type: 'text' | 'video' | 'pdf';
  videoUrl?: string;
  pdfUrl?: string;
  order: number;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  thumbnail?: string;
  isPublished: boolean;
  instructor: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  modules?: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface CreateCourseDto {
  title: string;
  description: string;
  thumbnail?: string;
  isPublished?: boolean;
}

export interface CreateModuleDto {
  title: string;
  content?: string;
  type: 'text' | 'video' | 'pdf';
  videoUrl?: string;
  pdfUrl?: string;
  order?: number;
}

export const courseService = {
  async getAll(publishedOnly: boolean = false): Promise<Course[]> {
    const response = await api.get<Course[]>(
      `/courses?published=${publishedOnly}`
    );
    return response.data;
  },

  async getById(id: string): Promise<Course> {
    const response = await api.get<Course>(`/courses/${id}`);
    return response.data;
  },

  async create(data: CreateCourseDto): Promise<Course> {
    const response = await api.post<Course>('/courses', data);
    return response.data;
  },

  async update(id: string, data: Partial<CreateCourseDto>): Promise<Course> {
    const response = await api.patch<Course>(`/courses/${id}`, data);
    return response.data;
  },

  async delete(id: string): Promise<void> {
    await api.delete(`/courses/${id}`);
  },

  async addModule(courseId: string, data: CreateModuleDto): Promise<Module> {
    const response = await api.post<Module>(
      `/courses/${courseId}/modules`,
      data
    );
    return response.data;
  },

  async updateModule(
    moduleId: string,
    data: Partial<CreateModuleDto>
  ): Promise<Module> {
    const response = await api.patch<Module>(
      `/courses/modules/${moduleId}`,
      data
    );
    return response.data;
  },

  async deleteModule(moduleId: string): Promise<void> {
    await api.delete(`/courses/modules/${moduleId}`);
  },
};

