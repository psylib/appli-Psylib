import { apiClient } from './client';

export interface Course {
  id: string;
  title: string;
  description: string;
  price: number;
  isPublished: boolean;
  enrollmentCount: number;
  revenue: number;
  createdAt: string;
}

export interface CourseModule {
  id: string;
  courseId: string;
  title: string;
  type: 'video' | 'text';
  order: number;
  videoUrl?: string;
  content?: string;
}

export interface CourseDetail extends Course {
  modules: CourseModule[];
}

export interface CreateCourseData {
  title: string;
  description: string;
  price: number;
}

export interface CreateModuleData {
  title: string;
  type: 'video' | 'text';
  videoUrl?: string;
  content?: string;
}

export const coursesApi = {
  list: (token: string) =>
    apiClient.get<Course[]>('/courses', token),

  create: (data: CreateCourseData, token: string) =>
    apiClient.post<Course>('/courses', data, token),

  get: (id: string, token: string) =>
    apiClient.get<CourseDetail>(`/courses/${id}`, token),

  update: (id: string, data: Partial<CreateCourseData>, token: string) =>
    apiClient.put<Course>(`/courses/${id}`, data, token),

  publish: (id: string, token: string) =>
    apiClient.patch<Course>(`/courses/${id}/publish`, {}, token),

  delete: (id: string, token: string) =>
    apiClient.delete<void>(`/courses/${id}`, token),

  addModule: (courseId: string, data: CreateModuleData, token: string) =>
    apiClient.post<CourseModule>(`/courses/${courseId}/modules`, data, token),

  updateModule: (courseId: string, moduleId: string, data: Partial<CreateModuleData>, token: string) =>
    apiClient.put<CourseModule>(`/courses/${courseId}/modules/${moduleId}`, data, token),

  deleteModule: (courseId: string, moduleId: string, token: string) =>
    apiClient.delete<void>(`/courses/${courseId}/modules/${moduleId}`, token),

  reorderModules: (courseId: string, order: { id: string; order: number }[], token: string) =>
    apiClient.patch<void>(`/courses/${courseId}/modules/reorder`, { order }, token),
};
