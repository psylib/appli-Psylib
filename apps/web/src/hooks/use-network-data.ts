'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  networkApi,
  type NetworkProfile,
  type DirectoryEntry,
  type Referral,
  type NetworkGroup,
} from '@/lib/api/network';

interface DirectoryFilters {
  search: string;
  city: string;
  department: string;
  approach: string;
  specialty: string;
}

export function useNetworkData(token: string) {
  // ── Profile ──
  const [profile, setProfile] = useState<NetworkProfile | null>(null);

  // ── Directory ──
  const [directory, setDirectory] = useState<DirectoryEntry[]>([]);
  const [directoryLoading, setDirectoryLoading] = useState(false);
  const [directoryError, setDirectoryError] = useState<string | null>(null);

  // ── Referrals ──
  const [sentReferrals, setSentReferrals] = useState<Referral[]>([]);
  const [receivedReferrals, setReceivedReferrals] = useState<Referral[]>([]);
  const [referralsLoading, setReferralsLoading] = useState(false);
  const [referralsError, setReferralsError] = useState<string | null>(null);
  const [loadingReferralId, setLoadingReferralId] = useState<string | null>(null);

  // ── Groups ──
  const [myGroups, setMyGroups] = useState<NetworkGroup[]>([]);
  const [publicGroups, setPublicGroups] = useState<NetworkGroup[]>([]);
  const [groupsLoading, setGroupsLoading] = useState(false);
  const [groupsError, setGroupsError] = useState<string | null>(null);

  // ─── Fetchers ──────────────────────────────────────────────────────────────

  const fetchProfile = useCallback(async () => {
    if (!token) return;
    try {
      const data = await networkApi.getProfile(token);
      setProfile(data);
    } catch {
      // Profile may not exist yet
    }
  }, [token]);

  const fetchDirectory = useCallback(async (filters: DirectoryFilters) => {
    if (!token) return;
    setDirectoryLoading(true);
    setDirectoryError(null);
    try {
      const data = await networkApi.getDirectory(token, {
        search: filters.search || undefined,
        city: filters.city || undefined,
        department: filters.department || undefined,
        approach: filters.approach || undefined,
        specialty: filters.specialty || undefined,
      });
      setDirectory(data);
    } catch {
      setDirectoryError("Impossible de charger l'annuaire. Vérifiez votre connexion.");
    } finally {
      setDirectoryLoading(false);
    }
  }, [token]);

  const fetchReferrals = useCallback(async () => {
    if (!token) return;
    setReferralsLoading(true);
    setReferralsError(null);
    try {
      const data = await networkApi.getReferrals(token);
      setSentReferrals(data.sent);
      setReceivedReferrals(data.received);
    } catch {
      setReferralsError('Impossible de charger les adressages.');
    } finally {
      setReferralsLoading(false);
    }
  }, [token]);

  const fetchGroups = useCallback(async () => {
    if (!token) return;
    setGroupsLoading(true);
    setGroupsError(null);
    try {
      const data = await networkApi.getGroups(token);
      setMyGroups(data.myGroups);
      setPublicGroups(data.publicGroups);
    } catch {
      setGroupsError('Impossible de charger les groupes.');
    } finally {
      setGroupsLoading(false);
    }
  }, [token]);

  // ─── Handlers ──────────────────────────────────────────────────────────────

  const handleReferralStatusUpdate = async (id: string, status: 'accepted' | 'declined') => {
    setLoadingReferralId(id);
    try {
      const updated = await networkApi.updateReferralStatus(token, id, status);
      setReceivedReferrals((prev) => prev.map((r) => (r.id === updated.id ? updated : r)));
    } catch {
      // Silent fail
    } finally {
      setLoadingReferralId(null);
    }
  };

  const handleJoinGroup = async (groupId: string) => {
    try {
      await networkApi.joinGroup(token, groupId);
      await fetchGroups();
    } catch {
      // Silent fail
    }
  };

  const handleLeaveGroup = async (groupId: string) => {
    try {
      await networkApi.leaveGroup(token, groupId);
      await fetchGroups();
    } catch {
      // Silent fail
    }
  };

  // ─── Initial profile load ─────────────────────────────────────────────────

  useEffect(() => {
    if (token) void fetchProfile();
  }, [fetchProfile, token]);

  return {
    // Profile
    profile,
    setProfile,
    // Directory
    directory,
    directoryLoading,
    directoryError,
    fetchDirectory,
    // Referrals
    sentReferrals,
    receivedReferrals,
    referralsLoading,
    referralsError,
    loadingReferralId,
    fetchReferrals,
    handleReferralStatusUpdate,
    // Groups
    myGroups,
    setMyGroups,
    publicGroups,
    groupsLoading,
    groupsError,
    fetchGroups,
    handleJoinGroup,
    handleLeaveGroup,
  };
}
