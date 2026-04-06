const API = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

async function fetchPortal<T>(path: string, token: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API}/api/v1/patient-portal${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${token}`,
      ...(init?.headers ?? {}),
    },
  });
  if (!res.ok) throw new Error(`API error ${res.status}`);
  return res.json() as Promise<T>;
}

export interface MoodEntry {
  id: string;
  mood: number;
  note?: string;
  createdAt: string;
}

export interface Exercise {
  id: string;
  title: string;
  description: string;
  status: 'assigned' | 'in_progress' | 'completed' | 'skipped';
  dueDate?: string;
  completedAt?: string;
  patientFeedback?: string;
  createdByAi: boolean;
}

export interface JournalEntry {
  id: string;
  content: string;
  mood?: number;
  tags: string[];
  isPrivate: boolean;
  createdAt: string;
}

export interface PatientDashboard {
  avgMood7d: number | null;
  moodHistory: { mood: number; createdAt: string }[];
  pendingExercises: Exercise[];
  nextAppointment: { scheduledAt: string; duration: number; status: string } | null;
  journalCount: number;
  pendingAssessmentsCount: number;
}

export interface PatientProfile {
  id: string;
  name: string;
  email: string;
  status: string;
  createdAt: string;
  psychologist: { name: string; specialization: string };
}

export interface AssessmentQuestion {
  id: string;
  text: string;
  minValue: number;
  maxValue: number;
  labels: string[];
}

export interface AssessmentTemplate {
  type: string;
  name: string;
  description: string | null;
  maxScore: number;
  questions: AssessmentQuestion[];
}

export interface PendingAssessment {
  id: string;
  status: string;
  template: AssessmentTemplate;
  createdAt: string;
}

export interface CompletedAssessment {
  id: string;
  score: number | null;
  severity: string | null;
  status: string;
  completedAt: string | null;
  template: { type: string; name: string; maxScore: number };
}

export interface AssessmentSubmitResult {
  score: number;
  maxScore: number;
  severity: string;
}

export const patientPortalApi = {
  getDashboard: (token: string) => fetchPortal<PatientDashboard>('/dashboard', token),

  createMood: (token: string, mood: number, note?: string) =>
    fetchPortal<MoodEntry>('/mood', token, {
      method: 'POST',
      body: JSON.stringify({ mood, note }),
    }),

  getMoodHistory: (token: string, days = 30) =>
    fetchPortal<MoodEntry[]>(`/mood?days=${days}`, token),

  getExercises: (token: string) => fetchPortal<Exercise[]>('/exercises', token),

  updateExercise: (
    token: string,
    id: string,
    status: Exercise['status'],
    patientFeedback?: string,
  ) =>
    fetchPortal<Exercise>(`/exercises/${id}`, token, {
      method: 'PATCH',
      body: JSON.stringify({ status, patientFeedback }),
    }),

  createJournalEntry: (
    token: string,
    content: string,
    mood?: number,
    tags?: string[],
    isPrivate?: boolean,
  ) =>
    fetchPortal<JournalEntry>('/journal', token, {
      method: 'POST',
      body: JSON.stringify({ content, mood, tags, isPrivate }),
    }),

  getJournalEntries: (token: string) => fetchPortal<JournalEntry[]>('/journal', token),

  deleteJournalEntry: (token: string, id: string) =>
    fetchPortal<{ deleted: boolean }>(`/journal/${id}`, token, { method: 'DELETE' }),

  getProfile: (token: string) => fetchPortal<PatientProfile>('/me', token),

  getAssessments: (token: string) =>
    fetchPortal<Array<PendingAssessment | CompletedAssessment>>('/assessments', token),

  submitAssessment: (token: string, id: string, answers: Record<string, number>) =>
    fetchPortal<AssessmentSubmitResult>(`/assessments/${id}/submit`, token, {
      method: 'POST',
      body: JSON.stringify({
        answers: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      }),
    }),
};
