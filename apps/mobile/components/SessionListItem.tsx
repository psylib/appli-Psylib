/**
 * SessionListItem — Élément de liste séance
 */

import React from 'react';
import {
  TouchableOpacity,
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { Badge } from './ui/Badge';
import { Colors } from '@/constants/colors';
import { SessionType, SessionPaymentStatus } from '@psyscale/shared-types';
import type { Session } from '@psyscale/shared-types';

interface SessionListItemProps {
  session: Session;
  patientName?: string;
  onPress: (id: string) => void;
}

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

export function SessionListItem({ session, patientName, onPress }: SessionListItemProps) {
  const sessionDate = new Date(session.date);
  const dateLabel = sessionDate.toLocaleDateString('fr-FR', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
  });
  const timeLabel = sessionDate.toLocaleTimeString('fr-FR', {
    hour: '2-digit',
    minute: '2-digit',
  });

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(session.id)}
      accessibilityLabel={`Séance ${patientName ?? ''} le ${dateLabel} à ${timeLabel}, ${SESSION_TYPE_LABELS[session.type]}, ${PAYMENT_LABELS[session.paymentStatus]}`}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <View style={styles.dateBlock} accessibilityElementsHidden>
        <Text style={styles.dateDay}>
          {sessionDate.getDate().toString().padStart(2, '0')}
        </Text>
        <Text style={styles.dateMonth}>
          {sessionDate.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '')}
        </Text>
      </View>
      <View style={styles.content}>
        {patientName != null && patientName.length > 0 && (
          <Text style={styles.patientName} numberOfLines={1}>
            {patientName}
          </Text>
        )}
        <View style={styles.meta}>
          <Text style={styles.time}>{timeLabel}</Text>
          <Text style={styles.separator} accessibilityElementsHidden>·</Text>
          <Text style={styles.duration}>{session.duration} min</Text>
          <Text style={styles.separator} accessibilityElementsHidden>·</Text>
          <Text style={styles.type}>{SESSION_TYPE_LABELS[session.type]}</Text>
        </View>
        {session.tags.length > 0 && (
          <Text style={styles.tags} numberOfLines={1}>
            {session.tags.join(' · ')}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Badge
          label={PAYMENT_LABELS[session.paymentStatus]}
          variant={PAYMENT_VARIANTS[session.paymentStatus]}
        />
        {session.rate != null && (
          <Text style={styles.rate}>{session.rate}€</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    backgroundColor: Colors.surfaceElevated,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    gap: 12,
  },
  dateBlock: {
    width: 44,
    alignItems: 'center',
    backgroundColor: `${Colors.primary}0D`,
    borderRadius: 10,
    paddingVertical: 8,
    flexShrink: 0,
  },
  dateDay: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.primary,
    lineHeight: 22,
  },
  dateMonth: {
    fontSize: 11,
    fontWeight: '500',
    color: Colors.primary,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  content: {
    flex: 1,
    gap: 3,
  },
  patientName: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  meta: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '500',
  },
  separator: {
    fontSize: 13,
    color: Colors.mutedLight,
  },
  duration: {
    fontSize: 13,
    color: Colors.muted,
  },
  type: {
    fontSize: 13,
    color: Colors.muted,
  },
  tags: {
    fontSize: 11,
    color: Colors.accent,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  rate: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
});
