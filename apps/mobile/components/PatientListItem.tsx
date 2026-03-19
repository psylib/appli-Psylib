/**
 * PatientListItem — Élément de liste patient
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
import { PatientStatus } from '@psyscale/shared-types';
import type { Patient } from '@psyscale/shared-types';

interface PatientListItemProps {
  patient: Patient;
  onPress: (id: string) => void;
}

const STATUS_LABELS: Record<PatientStatus, string> = {
  [PatientStatus.ACTIVE]: 'Actif',
  [PatientStatus.INACTIVE]: 'Inactif',
  [PatientStatus.ARCHIVED]: 'Archivé',
};

const STATUS_VARIANTS: Record<PatientStatus, 'success' | 'warning' | 'default'> = {
  [PatientStatus.ACTIVE]: 'success',
  [PatientStatus.INACTIVE]: 'warning',
  [PatientStatus.ARCHIVED]: 'default',
};

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((part) => part[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

export function PatientListItem({ patient, onPress }: PatientListItemProps) {
  const initials = getInitials(patient.name);

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={() => onPress(patient.id)}
      accessibilityLabel={`Patient ${patient.name}, statut ${STATUS_LABELS[patient.status]}`}
      accessibilityRole="button"
      activeOpacity={0.7}
    >
      <View style={styles.avatar} accessibilityElementsHidden>
        <Text style={styles.avatarText}>{initials}</Text>
      </View>
      <View style={styles.content}>
        <Text style={styles.name} numberOfLines={1}>
          {patient.name}
        </Text>
        {patient.email != null && patient.email.length > 0 && (
          <Text style={styles.email} numberOfLines={1}>
            {patient.email}
          </Text>
        )}
      </View>
      <View style={styles.right}>
        <Badge
          label={STATUS_LABELS[patient.status]}
          variant={STATUS_VARIANTS[patient.status]}
        />
        <Text style={styles.date} accessibilityElementsHidden>
          {new Date(patient.createdAt).toLocaleDateString('fr-FR', {
            day: 'numeric',
            month: 'short',
          })}
        </Text>
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
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.primary,
  },
  content: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  email: {
    fontSize: 13,
    color: Colors.muted,
  },
  right: {
    alignItems: 'flex-end',
    gap: 4,
    flexShrink: 0,
  },
  date: {
    fontSize: 11,
    color: Colors.mutedLight,
  },
});
