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
};
