import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type TherapyOrientation = 'TCC' | 'PSYCHODYNAMIQUE' | 'SYSTEMIQUE' | 'ACT' | 'AUTRE';

export interface TemplateSection {
  id: string;
  title: string;
  placeholder: string;
  required: boolean;
}

export interface NoteTemplate {
  id: string;
  orientation: TherapyOrientation;
  name: string;
  description?: string;
  sections: TemplateSection[];
  isSystem: boolean;
  isActive: boolean;
  createdAt: string;
}

export type CreateTemplateData = Omit<NoteTemplate, 'id' | 'isSystem' | 'isActive' | 'createdAt'>;
export type UpdateTemplateData = Partial<CreateTemplateData>;

// ─── Labels & Colors ──────────────────────────────────────────────────────────

export const ORIENTATION_LABELS: Record<TherapyOrientation, string> = {
  TCC: 'TCC',
  PSYCHODYNAMIQUE: 'Psychodynamique',
  SYSTEMIQUE: 'Systémique',
  ACT: 'ACT',
  AUTRE: 'Autre',
};

export const ORIENTATION_COLORS: Record<
  TherapyOrientation,
  { bg: string; text: string; border: string }
> = {
  TCC: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  PSYCHODYNAMIQUE: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  SYSTEMIQUE: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  ACT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  AUTRE: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

// ─── API Client ───────────────────────────────────────────────────────────────

export const noteTemplatesApi = {
  /**
   * Récupère tous les templates (système + perso), optionnellement filtrés par orientation.
   */
  getTemplates: (token: string, orientation?: TherapyOrientation): Promise<NoteTemplate[]> => {
    const qs = orientation ? `?orientation=${orientation}` : '';
    return apiClient.get<NoteTemplate[]>(`/note-templates${qs}`, token);
  },

  /**
   * Crée un template personnel.
   */
  createTemplate: (token: string, data: CreateTemplateData): Promise<NoteTemplate> =>
    apiClient.post<NoteTemplate>('/note-templates', data, token),

  /**
   * Modifie un template personnel existant.
   */
  updateTemplate: (token: string, id: string, data: UpdateTemplateData): Promise<NoteTemplate> =>
    apiClient.put<NoteTemplate>(`/note-templates/${id}`, data, token),

  /**
   * Supprime un template personnel.
   */
  deleteTemplate: (token: string, id: string): Promise<void> =>
    apiClient.delete<void>(`/note-templates/${id}`, token),
};
