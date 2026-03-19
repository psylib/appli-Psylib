/**
 * Dashboard Screen — KPIs et aperçu
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useQuery } from '@tanstack/react-query';
import { KpiCard } from '@/components/KpiCard';
import { SessionListItem } from '@/components/SessionListItem';
import { Colors } from '@/constants/colors';
import { useAuth } from '@/hooks/useAuth';
import { apiClient } from '@/lib/api';
import type { DashboardStats, Session, PaginatedResponse } from '@psyscale/shared-types';

export default function DashboardScreen() {
  const { getValidToken, logout } = useAuth();
  const router = useRouter();

  const {
    data: stats,
    isLoading: statsLoading,
    refetch: refetchStats,
  } = useQuery<DashboardStats>({
    queryKey: ['dashboard'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<DashboardStats>('/dashboard', token ?? undefined);
    },
    staleTime: 1000 * 60 * 2,
  });

  const {
    data: recentSessions,
    isLoading: sessionsLoading,
    refetch: refetchSessions,
  } = useQuery<PaginatedResponse<Session>>({
    queryKey: ['sessions', 'recent'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<PaginatedResponse<Session>>(
        '/sessions?page=1&limit=5',
        token ?? undefined,
      );
    },
    staleTime: 1000 * 60 * 2,
  });

  const isRefreshing = statsLoading || sessionsLoading;

  const handleRefresh = () => {
    void Promise.all([refetchStats(), refetchSessions()]);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.primary}
            accessibilityLabel="Actualiser le tableau de bord"
          />
        }
      >
        {/* Header */}
        <View style={styles.header}>
          <View>
            <Text style={styles.greeting}>Bonjour</Text>
            <Text style={styles.subtitle}>Voici votre tableau de bord</Text>
          </View>
          <TouchableOpacity
            onPress={() => void logout()}
            accessibilityLabel="Se déconnecter"
            accessibilityRole="button"
            style={styles.logoutButton}
          >
            <Text style={styles.logoutText}>Déconnexion</Text>
          </TouchableOpacity>
        </View>

        {/* KPIs */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Vue d'ensemble</Text>
          {statsLoading ? (
            <View style={styles.loadingRow} accessibilityLabel="Chargement des statistiques">
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : (
            <>
              <View style={styles.kpiRow}>
                <KpiCard
                  title="Patients actifs"
                  value={stats?.activePatients ?? 0}
                  subtitle={`${stats?.totalPatients ?? 0} au total`}
                  accentColor={Colors.primary}
                />
                <KpiCard
                  title="Séances ce mois"
                  value={stats?.sessionsThisMonth ?? 0}
                  accentColor={Colors.accent}
                />
              </View>
              <View style={styles.kpiRow}>
                <KpiCard
                  title="Revenus ce mois"
                  value={`${stats?.revenueThisMonth ?? 0}€`}
                  accentColor={Colors.warm}
                />
                <KpiCard
                  title="RDV à venir"
                  value={stats?.upcomingAppointments ?? 0}
                  subtitle={`${stats?.pendingInvoices ?? 0} factures en attente`}
                  accentColor={Colors.primaryLight}
                />
              </View>
            </>
          )}
        </View>

        {/* Séances récentes */}
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>Séances récentes</Text>
            <TouchableOpacity
              onPress={() => router.push('/(tabs)/sessions')}
              accessibilityLabel="Voir toutes les séances"
              accessibilityRole="link"
            >
              <Text style={styles.seeAll}>Tout voir</Text>
            </TouchableOpacity>
          </View>

          {sessionsLoading ? (
            <View style={styles.loadingRow} accessibilityLabel="Chargement des séances">
              <ActivityIndicator color={Colors.primary} />
            </View>
          ) : recentSessions == null || recentSessions.data.length === 0 ? (
            <View style={styles.emptyState}>
              <Text style={styles.emptyEmoji} accessibilityElementsHidden>
                📋
              </Text>
              <Text style={styles.emptyTitle}>Aucune séance</Text>
              <Text style={styles.emptySubtitle}>
                Créez votre première séance avec le bouton +
              </Text>
            </View>
          ) : (
            <View style={styles.sessionsList}>
              {recentSessions.data.map((session) => (
                <SessionListItem
                  key={session.id}
                  session={session}
                  onPress={(id) => router.push(`/(tabs)/sessions/${id}`)}
                />
              ))}
            </View>
          )}
        </View>

        {/* Quick actions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Actions rapides</Text>
          <View style={styles.actionsRow}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/patients')}
              accessibilityLabel="Voir tous les patients"
              accessibilityRole="button"
            >
              <Text style={styles.actionEmoji} accessibilityElementsHidden>
                👥
              </Text>
              <Text style={styles.actionLabel}>Patients</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/sessions/new')}
              accessibilityLabel="Créer une nouvelle séance"
              accessibilityRole="button"
            >
              <Text style={styles.actionEmoji} accessibilityElementsHidden>
                ➕
              </Text>
              <Text style={styles.actionLabel}>Nouvelle séance</Text>
            </TouchableOpacity>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={() => router.push('/(tabs)/calendar')}
              accessibilityLabel="Voir le calendrier"
              accessibilityRole="button"
            >
              <Text style={styles.actionEmoji} accessibilityElementsHidden>
                📅
              </Text>
              <Text style={styles.actionLabel}>Calendrier</Text>
            </TouchableOpacity>
          </View>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 24,
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
  },
  greeting: {
    fontSize: 26,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  subtitle: {
    fontSize: 14,
    color: Colors.muted,
    marginTop: 2,
  },
  logoutButton: {
    paddingHorizontal: 12,
    paddingVertical: 8,
    minHeight: 44,
    justifyContent: 'center',
  },
  logoutText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
  },
  section: {
    gap: 12,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  seeAll: {
    fontSize: 14,
    color: Colors.primary,
    fontWeight: '500',
  },
  kpiRow: {
    flexDirection: 'row',
    gap: 12,
  },
  loadingRow: {
    paddingVertical: 32,
    alignItems: 'center',
  },
  sessionsList: {
    borderRadius: 14,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 40,
    gap: 8,
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  emptyEmoji: {
    fontSize: 32,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: Colors.text,
  },
  emptySubtitle: {
    fontSize: 13,
    color: Colors.muted,
    textAlign: 'center',
  },
  actionsRow: {
    flexDirection: 'row',
    gap: 12,
  },
  actionButton: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 14,
    paddingVertical: 18,
    gap: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 80,
  },
  actionEmoji: {
    fontSize: 24,
  },
  actionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.text,
    textAlign: 'center',
  },
});
