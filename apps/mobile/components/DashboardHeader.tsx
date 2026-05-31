import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { IconBell, IconAdd } from '@/components/icons/AppIcons';

const DAYS_FR = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatDateFR(d: Date): string {
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

interface DashboardHeaderProps {
  firstName: string;
  todayCount: number;
  activePatients: number;
  sessionsThisMonth: number;
  unreadCount: number;
  onBellPress: () => void;
  onAddPress: () => void;
}

export function DashboardHeader({
  firstName,
  todayCount,
  activePatients,
  sessionsThisMonth,
  unreadCount,
  onBellPress,
  onAddPress,
}: DashboardHeaderProps) {
  return (
    <LinearGradient
      colors={[Colors.sageBase, Colors.sageDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Bonjour {firstName} 👋</Text>
          <Text style={styles.date}>{formatDateFR(new Date())}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onBellPress}
            accessibilityLabel={`Notifications, ${unreadCount} non lues`}
            accessibilityRole="button"
          >
            <IconBell size={18} color="rgba(255,255,255,0.85)" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onAddPress}
            accessibilityLabel="Nouveau rendez-vous"
            accessibilityRole="button"
          >
            <IconAdd size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{todayCount}</Text>
          <Text style={styles.statLabel}>RDV auj.</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{activePatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{sessionsThisMonth}</Text>
          <Text style={styles.statLabel}>Séances/mois</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  date: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F97316',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.sageBase,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  statVal: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
