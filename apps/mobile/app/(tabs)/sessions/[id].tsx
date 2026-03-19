/**
 * Session Detail Screen — Détail séance + éditeur de notes
 */

import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useLocalSearchParams } from 'expo-router';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { NoteEditor } from '@/components/NoteEditor';
import { Colors } from '@/constants/colors';
import { useSession } from '@/hooks/useSessions';
import { SessionType, SessionPaymentStatus } from '@psyscale/shared-types';

const SESSION_TYPE_LABELS: Record<SessionType, string> = {
  [SessionType.INDIVIDUAL]: 'Individuelle',
  [SessionType.GROUP]: 'Groupe',
  [SessionType.ONLINE]: 'En ligne',
};

const PAYMENT_VARIANTS: Record<SessionPaymentStatus, 'success' | 'warning' | 'default'> = {
  [SessionPaymentStatus.PAID]: 'success',
  [SessionPaymentStatus.PENDING]: 'warning',
  [SessionPaymentStatus.FREE]: 'default',
};

const PAYMENT_LABELS: Record<SessionPaymentStatus, string> = {
  [SessionPaymentStatus.PAID]: 'Payée',
  [SessionPaymentStatus.PENDING]: 'En attente',
  [SessionPaymentStatus.FREE]: 'Gratuite',
};

export default function SessionDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const {
    data: session,
    isLoading,
    refetch,
    isRefetching,
  } = useSession(id ?? '');

  if (isLoading) {
    return (
      <>
        <Stack.Screen options={{ title: 'Séance' }} />
        <View style={styles.loading} accessibilityLabel="Chargement de la séance">
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      </>
    );
  }

  if (session == null) {
    return (
      <>
        <Stack.Screen options={{ title: 'Introuvable' }} />
        <View style={styles.loading}>
          <Text style={styles.notFound}>Séance introuvable</Text>
        </View>
      </>
    );
  }

  const sessionDate = new Date(session.date);
  const dateStr = sessionDate.toLocaleDateString('fr-FR', {
    weekday: 'long',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
  const timeStr = sessionDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <>
      <Stack.Screen
        options={{
          title: `Séance du ${sessionDate.toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}`,
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text, fontSize: 15 },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={isRefetching}
              onRefresh={() => void refetch()}
              tintColor={Colors.primary}
              accessibilityLabel="Actualiser la séance"
            />
          }
        >
          {/* Informations séance */}
          <Card elevated style={styles.infoCard}>
            <View style={styles.infoHeader}>
              <View style={styles.dateBlock}>
                <Text style={styles.dateDay}>
                  {sessionDate.getDate().toString().padStart(2, '0')}
                </Text>
                <Text style={styles.dateMonth}>
                  {sessionDate
                    .toLocaleDateString('fr-FR', { month: 'short' })
                    .replace('.', '')}
                </Text>
              </View>
              <View style={styles.infoMain}>
                <Text
                  style={styles.dateText}
                  accessibilityLabel={`Date: ${dateStr} à ${timeStr}`}
                >
                  {dateStr}
                </Text>
                <Text style={styles.timeText}>{timeStr}</Text>
              </View>
            </View>

            <View style={styles.divider} />

            <View style={styles.metaRow}>
              <MetaItem
                label="Type"
                value={SESSION_TYPE_LABELS[session.type]}
              />
              <MetaItem
                label="Durée"
                value={`${session.duration} min`}
              />
              {session.rate != null && (
                <MetaItem
                  label="Tarif"
                  value={`${session.rate}€`}
                />
              )}
            </View>

            <View style={styles.badgeRow}>
              <Badge
                label={PAYMENT_LABELS[session.paymentStatus]}
                variant={PAYMENT_VARIANTS[session.paymentStatus]}
              />
              {session.tags.length > 0 &&
                session.tags.map((tag) => (
                  <Badge key={tag} label={tag} variant="accent" />
                ))}
            </View>
          </Card>

          {/* Résumé IA (si disponible) */}
          {session.summaryAi != null && session.summaryAi.length > 0 && (
            <Card style={styles.aiSummaryCard}>
              <View style={styles.aiSummaryHeader}>
                <Text style={styles.aiSummaryIcon} accessibilityElementsHidden>
                  ✨
                </Text>
                <Text style={styles.aiSummaryTitle}>Résumé IA</Text>
                <Text style={styles.aiDisclaimer}>
                  Outil d'aide — le praticien reste responsable
                </Text>
              </View>
              <Text style={styles.aiSummaryText}>{session.summaryAi}</Text>
            </Card>
          )}

          {/* Éditeur de notes */}
          <View style={styles.noteSection}>
            <Text style={styles.sectionTitle}>Notes cliniques</Text>
            <NoteEditor
              sessionId={session.id}
              initialNotes={session.notes}
            />
          </View>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

function MetaItem({ label, value }: { label: string; value: string }) {
  return (
    <View style={metaStyles.item} accessibilityLabel={`${label}: ${value}`}>
      <Text style={metaStyles.label}>{label}</Text>
      <Text style={metaStyles.value}>{value}</Text>
    </View>
  );
}

const metaStyles = StyleSheet.create({
  item: {
    alignItems: 'center',
    gap: 2,
    flex: 1,
  },
  label: {
    fontSize: 11,
    color: Colors.muted,
    fontWeight: '500',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  value: {
    fontSize: 15,
    fontWeight: '700',
    color: Colors.text,
  },
});

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  loading: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: Colors.bg,
  },
  notFound: {
    fontSize: 16,
    color: Colors.muted,
  },
  scroll: {
    flex: 1,
  },
  content: {
    padding: 20,
    gap: 20,
    paddingBottom: 100,
  },
  infoCard: {
    gap: 14,
  },
  infoHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
  },
  dateBlock: {
    width: 52,
    alignItems: 'center',
    backgroundColor: `${Colors.primary}0D`,
    borderRadius: 12,
    paddingVertical: 10,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 22,
    fontWeight: '800',
    color: Colors.primary,
    lineHeight: 26,
  },
  dateMonth: {
    fontSize: 12,
    fontWeight: '600',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  infoMain: {
    flex: 1,
    gap: 2,
  },
  dateText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
    textTransform: 'capitalize',
  },
  timeText: {
    fontSize: 13,
    color: Colors.muted,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.border,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
  },
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  aiSummaryCard: {
    backgroundColor: `${Colors.accent}0D`,
    borderColor: `${Colors.accent}4D`,
    gap: 10,
  },
  aiSummaryHeader: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    flexWrap: 'wrap',
  },
  aiSummaryIcon: {
    fontSize: 16,
  },
  aiSummaryTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.accent,
  },
  aiDisclaimer: {
    fontSize: 11,
    color: Colors.muted,
    fontStyle: 'italic',
    flex: 1,
  },
  aiSummaryText: {
    fontSize: 14,
    color: Colors.text,
    lineHeight: 22,
  },
  noteSection: {
    gap: 12,
  },
  sectionTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
});
