/**
 * Profile Settings — Read-only initially
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { useAuthStore } from '@/store/auth.store';

function InfoRow({ label, value }: { label: string; value: string | null }) {
  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={styles.value}>{value ?? '-'}</Text>
    </View>
  );
}

export default function ProfileScreen() {
  const { name, email, plan, role } = useAuthStore();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card elevated style={styles.card}>
          <View style={styles.avatar}>
            <Text style={styles.avatarText}>
              {name ? name.charAt(0).toUpperCase() : '?'}
            </Text>
          </View>
          <Text style={styles.name}>{name ?? 'Psychologue'}</Text>
        </Card>

        <Card style={styles.infoCard}>
          <InfoRow label="Email" value={email} />
          <View style={styles.divider} />
          <InfoRow label="Role" value={role} />
          <View style={styles.divider} />
          <InfoRow label="Abonnement" value={plan} />
        </Card>

        <Text style={styles.note}>
          Pour modifier votre profil, rendez-vous sur psylib.eu depuis un ordinateur.
        </Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  card: { alignItems: 'center', gap: 12, padding: 24 },
  avatar: {
    width: 72, height: 72, borderRadius: 36,
    backgroundColor: `${Colors.primary}1A`, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 28, fontFamily: 'DMSans_700Bold', color: Colors.primary },
  name: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  infoCard: { gap: 0, padding: 0 },
  row: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  label: { fontSize: 14, color: Colors.muted },
  value: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text, textTransform: 'capitalize' },
  divider: { height: 1, backgroundColor: Colors.border },
  note: { fontSize: 13, color: Colors.muted, textAlign: 'center', lineHeight: 18 },
});
