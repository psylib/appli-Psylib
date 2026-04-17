/**
 * Settings — Profile, subscription with plan details, logout
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Switch,
  StyleSheet,
  Alert,
  Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { useAuth } from '@/hooks/useAuth';
import { useAuthStore } from '@/store/auth.store';
import { useBiometrics } from '@/hooks/useBiometrics';

interface SettingsItem {
  icon: string;
  label: string;
  onPress: () => void;
  danger?: boolean;
}

// Plan configuration with colors and limits
const PLAN_CONFIG: Record<string, { label: string; color: string; bg: string; limits: string }> = {
  free: {
    label: 'Free',
    color: Colors.muted,
    bg: `${Colors.muted}15`,
    limits: 'Patients et seances illimites · Pas d\'IA · Pas de visio',
  },
  solo: {
    label: 'Solo',
    color: Colors.primary,
    bg: `${Colors.primary}15`,
    limits: '10 resumes IA/mois · Visio illimitee · Comptabilite',
  },
  pro: {
    label: 'Pro',
    color: Colors.accent,
    bg: `${Colors.accent}15`,
    limits: 'IA illimitee · AI Scribe audio · Portail patient · Comptabilite',
  },
  clinic: {
    label: 'Clinic',
    color: Colors.warm,
    bg: `${Colors.warm}15`,
    limits: 'Multi-praticiens · Analytics avancees · API · Tout illimite',
  },
};

export default function SettingsScreen() {
  const router = useRouter();
  const { logout, getValidToken } = useAuth();
  const { name, email, plan } = useAuthStore();
  const biometrics = useBiometrics();

  const planKey = (plan ?? 'free').toLowerCase();
  const planConfig = PLAN_CONFIG[planKey] ?? PLAN_CONFIG['free']!;

  const handleLogout = () => {
    Alert.alert('Deconnexion', 'Voulez-vous vraiment vous deconnecter ?', [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Deconnecter',
        style: 'destructive',
        onPress: () => void logout(),
      },
    ]);
  };

  const handleManageSubscription = async () => {
    try {
      const token = await getValidToken();
      if (!token) return;
      // Open Stripe portal in browser
      await Linking.openURL('https://app.psylib.eu/dashboard/settings/billing');
    } catch {
      Alert.alert('Erreur', 'Impossible d\'ouvrir la gestion d\'abonnement');
    }
  };

  const items: SettingsItem[] = [
    { icon: '👤', label: 'Mon profil', onPress: () => router.push('/settings/profile') },
    { icon: '💳', label: 'Gerer mon abonnement', onPress: handleManageSubscription },
    { icon: '🔔', label: 'Notifications', onPress: () => {} },
    { icon: '🔒', label: 'Securite', onPress: () => {} },
    { icon: '📄', label: 'Mentions legales', onPress: () => void Linking.openURL('https://psylib.eu/legal') },
    { icon: '🚪', label: 'Deconnexion', onPress: handleLogout, danger: true },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        {/* Profile card */}
        <Card elevated style={styles.profileCard}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <View style={styles.profileInfo}>
            <Text style={styles.profileName}>{name ?? 'Psychologue'}</Text>
            <Text style={styles.profileEmail}>{email ?? ''}</Text>
            <View style={[styles.planBadge, { backgroundColor: planConfig.bg }]}>
              <Text style={[styles.planText, { color: planConfig.color }]}>{planConfig.label}</Text>
            </View>
          </View>
        </Card>

        {/* Plan details */}
        <Card style={styles.planCard}>
          <View style={styles.planHeader}>
            <Text style={styles.planTitle}>Plan {planConfig.label}</Text>
            {planKey === 'free' && (
              <TouchableOpacity
                style={styles.upgradeBtn}
                onPress={handleManageSubscription}
              >
                <Text style={styles.upgradeBtnText}>Upgrader</Text>
              </TouchableOpacity>
            )}
          </View>
          <Text style={styles.planLimits}>{planConfig.limits}</Text>
        </Card>

        {/* Settings list */}
        <View style={styles.list}>
          {items.map((item) => (
            <TouchableOpacity
              key={item.label}
              style={styles.listItem}
              onPress={item.onPress}
              accessibilityLabel={item.label}
            >
              <Text style={styles.listIcon}>{item.icon}</Text>
              <Text style={[styles.listLabel, item.danger && styles.listLabelDanger]}>
                {item.label}
              </Text>
              <Text style={styles.chevron}>›</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Biometrics */}
        {biometrics.available && (
          <View style={styles.list}>
            <View style={styles.listItem}>
              <Text style={styles.listIcon}>🔐</Text>
              <View style={{ flex: 1 }}>
                <Text style={styles.listLabel}>Verrouillage {biometrics.label}</Text>
                <Text style={styles.biometricDesc}>
                  Verrouillez PsyLib apres 5 min en arriere-plan
                </Text>
              </View>
              <Switch
                value={biometrics.enabled}
                onValueChange={() => void biometrics.toggle()}
                trackColor={{ false: Colors.border, true: Colors.accent }}
              />
            </View>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },

  // Profile
  profileCard: { flexDirection: 'row', alignItems: 'center', gap: 16, padding: 20 },
  avatar: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: `${Colors.primary}1A`, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.primary },
  profileInfo: { flex: 1, gap: 4 },
  profileName: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  profileEmail: { fontSize: 13, color: Colors.muted },
  planBadge: {
    alignSelf: 'flex-start',
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4,
  },
  planText: { fontSize: 12, fontFamily: 'DMSans_600SemiBold', textTransform: 'capitalize' },

  // Plan details
  planCard: { padding: 16, gap: 8 },
  planHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  planTitle: { fontSize: 15, fontFamily: 'DMSans_600SemiBold', color: Colors.text },
  planLimits: { fontSize: 13, color: Colors.muted, lineHeight: 18 },
  upgradeBtn: {
    backgroundColor: Colors.primary, paddingHorizontal: 14, paddingVertical: 6, borderRadius: 16,
  },
  upgradeBtnText: { color: '#FFF', fontSize: 12, fontFamily: 'DMSans_600SemiBold' },

  // List
  list: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, overflow: 'hidden',
  },
  listItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border, minHeight: 52,
  },
  listIcon: { fontSize: 20, width: 28 },
  listLabel: { flex: 1, fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.text },
  listLabelDanger: { color: Colors.error },
  chevron: { fontSize: 18, color: Colors.mutedLight },
  biometricDesc: { fontSize: 12, color: Colors.muted, marginTop: 2 },
});
