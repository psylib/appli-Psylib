import { apiClient } from './client';
import type { AssistantSummary } from '@psyscale/shared-types';

// ---------- Types ----------

export interface InviteAssistantData {
  name: string;
  email: string;
}

export interface AssistantInviteValidation {
  valid: boolean;
  psychologistName?: string;
  email?: string;
}

// ---------- Assistants (psy-side, authentifié) ----------

export const assistantsApi = {
  invite: (data: InviteAssistantData, token: string) =>
    apiClient.post<{ id: string }>('/assistants', data, token),

  list: (token: string) =>
    apiClient.get<AssistantSummary[]>('/assistants', token),

  revoke: (id: string, token: string) =>
    apiClient.delete<void>(`/assistants/${id}`, token),

  // ---------- Acceptation invitation (public, sans auth) ----------

  validateInvite: (inviteToken: string) =>
    apiClient.get<AssistantInviteValidation>(`/assistants/invitations/${inviteToken}`),

  acceptInvite: (inviteToken: string, password: string) =>
    apiClient.post<{ success: true }>(
      `/assistants/invitations/${inviteToken}/accept`,
      { password },
    ),
};

// Exports nommés (mirroir des signatures demandées)
export const inviteAssistant = (data: InviteAssistantData, token: string) =>
  assistantsApi.invite(data, token);
export const listAssistants = (token: string) => assistantsApi.list(token);
export const revokeAssistant = (id: string, token: string) =>
  assistantsApi.revoke(id, token);
export const validateAssistantInvite = (inviteToken: string) =>
  assistantsApi.validateInvite(inviteToken);
export const acceptAssistantInvite = (inviteToken: string, password: string) =>
  assistantsApi.acceptInvite(inviteToken, password);
