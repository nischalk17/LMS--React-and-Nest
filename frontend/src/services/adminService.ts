import api from './api';

export type Role = 'student' | 'instructor' | 'admin';

export interface AdminUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: Role;
  createdAt: string;
}

export interface AdminCourse {
  id: string;
  title: string;
  isPublished: boolean;
  createdAt: string;
  instructor: { firstName: string; lastName: string };
}

export interface Page<T> {
  items: T[];
  total: number;
  page: number;
  limit: number;
}

export interface AdminStats {
  users: { students: number; instructors: number; admins: number };
  courses: { published: number; drafts: number };
  enrollments: number;
  questions: number;
}

export const adminService = {
  async stats(): Promise<AdminStats> {
    return (await api.get<AdminStats>('/admin/stats')).data;
  },

  async users(page: number, search: string): Promise<Page<AdminUser>> {
    return (
      await api.get<Page<AdminUser>>('/admin/users', {
        params: { page, limit: 8, search: search || undefined },
      })
    ).data;
  },

  async setRole(id: string, role: Role): Promise<AdminUser> {
    return (await api.patch<AdminUser>(`/admin/users/${id}/role`, { role }))
      .data;
  },

  async deleteUser(id: string): Promise<void> {
    await api.delete(`/admin/users/${id}`);
  },

  async courses(page: number, search: string): Promise<Page<AdminCourse>> {
    return (
      await api.get<Page<AdminCourse>>('/admin/courses', {
        params: { page, limit: 8, search: search || undefined },
      })
    ).data;
  },

  async setPublished(id: string, isPublished: boolean): Promise<void> {
    await api.patch(`/admin/courses/${id}/published`, { isPublished });
  },

  async deleteCourse(id: string): Promise<void> {
    await api.delete(`/admin/courses/${id}`);
  },
};
