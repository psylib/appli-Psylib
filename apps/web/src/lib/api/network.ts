import { apiClient } from './client';

// ─── Types ────────────────────────────────────────────────────────────────────

export type ReferralStatus = 'pending' | 'accepted' | 'declined' | 'completed';
export type GroupType = 'supervision' | 'intervision' | 'formation' | 'autre';

export interface NetworkProfile {
  id: string;
  psychologistId: string;
  isVisible: boolean;
  city?: string;
  department?: string;
  approaches: string[];
  specialties: string[];
  languages: string[];
  acceptsReferrals: boolean;
  bio?: string;
  websiteUrl?: string;
  updatedAt: string;
}

export interface DirectoryEntry {
  id: string;
  isVisible: boolean;
  city?: string;
  department?: string;
  approaches: string[];
  specialties: string[];
  acceptsReferrals: boolean;
  bio?: string;
  psychologist: { id: string; name: string; slug: string; specialization?: string };
}

export interface Referral {
  id: string;
  status: ReferralStatus;
  patientInitials?: string;
  reason?: string;
  createdAt: string;
  respondedAt?: string;
  toPsy?: { id: string; name: string; slug: string };
  fromPsy?: { id: string; name: string; slug: string };
}

export interface NetworkGroup {
  id: string;
  type: GroupType;
  name: string;
  description?: string;
  city?: string;
  isPrivate: boolean;
  maxMembers: number;
  owner: { id: string; name: string; slug: string };
  _count: { members: number };
}

export interface DirectoryQuery {
  city?: string;
  department?: string;
  approach?: string;
  specialty?: string;
  search?: string;
}

export interface CreateReferralData {
  toPsyId: string;
  patientInitials?: string;
  reason?: string;
  message?: string;
}

export interface CreateGroupData {
  type: GroupType;
  name: string;
  description?: string;
  city?: string;
  isPrivate: boolean;
  maxMembers?: number;
}

export type UpdateNetworkProfileData = Partial<Omit<NetworkProfile, 'id' | 'psychologistId' | 'updatedAt'>>;

// ─── Labels & Colors ──────────────────────────────────────────────────────────

export const GROUP_TYPE_LABELS: Record<GroupType, string> = {
  supervision: 'Supervision',
  intervision: 'Intervision',
  formation: 'Formation',
  autre: 'Autre',
};

export const GROUP_TYPE_COLORS: Record<GroupType, { bg: string; text: string; border: string }> = {
  supervision: { bg: 'bg-indigo-50', text: 'text-indigo-700', border: 'border-indigo-200' },
  intervision: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  formation: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  autre: { bg: 'bg-gray-50', text: 'text-gray-700', border: 'border-gray-200' },
};

export const APPROACH_COLORS: Record<string, { bg: string; text: string; border: string }> = {
  TCC: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
  ACT: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  Psychodynamique: { bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
  Systémique: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
};

export const REFERRAL_STATUS_LABELS: Record<ReferralStatus, string> = {
  pending: 'En attente',
  accepted: 'Accepté',
  declined: 'Décliné',
  completed: 'Complété',
};

export const REFERRAL_STATUS_COLORS: Record<
  ReferralStatus,
  { bg: string; text: string; border: string }
> = {
  pending: { bg: 'bg-amber-50', text: 'text-amber-700', border: 'border-amber-200' },
  accepted: { bg: 'bg-green-50', text: 'text-green-700', border: 'border-green-200' },
  declined: { bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200' },
  completed: { bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200' },
};

// ─── API Client ───────────────────────────────────────────────────────────────

export const networkApi = {
  // ─── Profile ──────────────────────────────────────────────────────────────

  /**
   * Récupère mon profil réseau.
   */
  getProfile: (token: string): Promise<NetworkProfile> =>
    apiClient.get<NetworkProfile>('/network/profile', token),

  /**
   * Crée ou met à jour mon profil réseau.
   */
  upsertProfile: (token: string, data: UpdateNetworkProfileData): Promise<NetworkProfile> =>
    apiClient.put<NetworkProfile>('/network/profile', data, token),

  // ─── Annuaire ─────────────────────────────────────────────────────────────

  /**
   * Parcourt l'annuaire des psychologues avec filtres optionnels.
   */
  getDirectory: (token: string, query?: DirectoryQuery): Promise<DirectoryEntry[]> => {
    const qs = new URLSearchParams();
    if (query?.city) qs.set('city', query.city);
    if (query?.department) qs.set('department', query.department);
    if (query?.approach) qs.set('approach', query.approach);
    if (query?.specialty) qs.set('specialty', query.specialty);
    if (query?.search) qs.set('search', query.search);
    const queryString = qs.toString();
    return apiClient.get<DirectoryEntry[]>(
      `/network/directory${queryString ? `?${queryString}` : ''}`,
      token,
    );
  },

  /**
   * Récupère le profil public d'un psy par son slug.
   */
  getPublicProfile: (token: string, slug: string): Promise<DirectoryEntry> =>
    apiClient.get<DirectoryEntry>(`/network/directory/${slug}`, token),

  // ─── Adressages ───────────────────────────────────────────────────────────

  /**
   * Récupère mes adressages (envoyés + reçus).
   */
  getReferrals: (token: string): Promise<{ sent: Referral[]; received: Referral[] }> =>
    apiClient.get<{ sent: Referral[]; received: Referral[] }>('/network/referrals', token),

  /**
   * Crée un nouvel adressage.
   */
  createReferral: (token: string, data: CreateReferralData): Promise<Referral> =>
    apiClient.post<Referral>('/network/referrals', data, token),

  /**
   * Met à jour le statut d'un adressage (accepter / décliner / compléter).
   */
  updateReferralStatus: (
    token: string,
    id: string,
    status: ReferralStatus,
  ): Promise<Referral> =>
    apiClient.put<Referral>(`/network/referrals/${id}/status`, { status }, token),

  // ─── Groupes ──────────────────────────────────────────────────────────────

  /**
   * Récupère mes groupes + groupes publics disponibles.
   */
  getGroups: (token: string): Promise<{ myGroups: NetworkGroup[]; publicGroups: NetworkGroup[] }> =>
    apiClient.get<{ myGroups: NetworkGroup[]; publicGroups: NetworkGroup[] }>('/network/groups', token),

  /**
   * Crée un nouveau groupe.
   */
  createGroup: (token: string, data: CreateGroupData): Promise<NetworkGroup> =>
    apiClient.post<NetworkGroup>('/network/groups', data, token),

  /**
   * Rejoint un groupe public.
   */
  joinGroup: (token: string, groupId: string): Promise<void> =>
    apiClient.post<void>(`/network/groups/${groupId}/join`, {}, token),

  /**
   * Quitte un groupe.
   */
  leaveGroup: (token: string, groupId: string): Promise<void> =>
    apiClient.post<void>(`/network/groups/${groupId}/leave`, {}, token),
};
