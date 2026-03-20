/**
 * Settings — Profile, subscription, logout
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, Switch, StyleSheet, Alert } from 'react-native';
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

export default function SettingsScreen() {
  const router = useRouter();
  const { logout } = useAuth();
  const { name, email, plan } = useAuthStore();
  const biometrics = useBiometrics();

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

  const items: SettingsItem[] = [
    { icon: '👤', label: 'Mon profil', onPress: () => router.push('/settings/profile') },
    { icon: '💳', label: 'Abonnement', onPress: () => {} },
    { icon: '🔔', label: 'Notifications', onPress: () => {} },
    { icon: '🔒', label: 'Securite', onPress: () => {} },
    { icon: '📄', label: 'Mentions legales', onPress: () => {} },
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
            <View style={styles.planBadge}>
              <Text style={styles.planText}>{plan ?? 'free'}</Text>
            </View>
          </View>
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
    alignSelf: 'flex-start', backgroundColor: `${Colors.accent}15`,
    paddingHorizontal: 10, paddingVertical: 3, borderRadius: 12, marginTop: 4,
  },
  planText: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.accent, textTransform: 'capitalize' },
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
