import { apiClient } from './client';

export type GroupType = 'supervision' | 'intervision';
export type SessionStatus = 'planned' | 'completed' | 'cancelled';

export interface SupervisionGroup {
  id: string;
  type: GroupType;
  name: string;
  description?: string;
  isPrivate: boolean;
  maxMembers: number;
  createdAt: string;
  owner: { id: string; name: string };
  _count: { members: number; sessions: number };
}

export interface SupervisionSession {
  id: string;
  groupId: string;
  scheduledAt: string;
  duration: number;
  location?: string;
  status: SessionStatus;
  notes?: string;
  createdAt: string;
  _count: { caseStudies: number };
}

export interface CaseStudy {
  id: string;
  sessionId: string;
  initials?: string;
  ageRange?: string;
  problematic: string;
  content: string;
  createdAt: string;
  presenter: { id: string; name: string };
}

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  supervision: 'Supervision',
  intervision: 'Intervision',
};

export const GROUP_TYPE_COLORS: Record<GroupType, string> = {
  supervision: 'bg-purple-50 text-purple-700 border-purple-200',
  intervision: 'bg-teal-50 text-teal-700 border-teal-200',
};

export const SESSION_STATUS_LABELS: Record<SessionStatus, string> = {
  planned: 'Planifiée',
  completed: 'Terminée',
  cancelled: 'Annulée',
};

export const SESSION_STATUS_COLORS: Record<SessionStatus, string> = {
  planned: 'bg-blue-50 text-blue-700 border-blue-200',
  completed: 'bg-green-50 text-green-700 border-green-200',
  cancelled: 'bg-red-50 text-red-700 border-red-200',
};

export const supervisionApi = {
  getGroups: (token: string) =>
    apiClient.get<SupervisionGroup[]>('/api/v1/supervision/groups', token),

  createGroup: (token: string, data: { type: GroupType; name: string; description?: string; isPrivate?: boolean; maxMembers?: number }) =>
    apiClient.post<SupervisionGroup>('/api/v1/supervision/groups', data, token),

  updateGroup: (token: string, id: string, data: Partial<{ name: string; description: string; isPrivate: boolean; maxMembers: number }>) =>
    apiClient.put<SupervisionGroup>(`/api/v1/supervision/groups/${id}`, data, token),

  deleteGroup: (token: string, id: string) =>
    apiClient.delete<void>(`/api/v1/supervision/groups/${id}`, token),

  joinGroup: (token: string, id: string) =>
    apiClient.post<unknown>(`/api/v1/supervision/groups/${id}/join`, {}, token),

  leaveGroup: (token: string, id: string) =>
    apiClient.delete<unknown>(`/api/v1/supervision/groups/${id}/leave`, token),

  getSessions: (token: string, groupId: string) =>
    apiClient.get<SupervisionSession[]>(`/api/v1/supervision/groups/${groupId}/sessions`, token),

  createSession: (token: string, groupId: string, data: { scheduledAt: string; duration?: number; location?: string }) =>
    apiClient.post<SupervisionSession>(`/api/v1/supervision/groups/${groupId}/sessions`, data, token),

  updateSession: (token: string, id: string, data: Partial<{ scheduledAt: string; duration: number; location: string; status: SessionStatus; notes: string }>) =>
    apiClient.put<SupervisionSession>(`/api/v1/supervision/sessions/${id}`, data, token),

  getCaseStudies: (token: string, sessionId: string) =>
    apiClient.get<CaseStudy[]>(`/api/v1/supervision/sessions/${sessionId}/cases`, token),

  createCaseStudy: (token: string, data: { sessionId: string; initials?: string; ageRange?: string; problematic: string; content: string }) =>
    apiClient.post<CaseStudy>('/api/v1/supervision/sessions/cases', data, token),
};
