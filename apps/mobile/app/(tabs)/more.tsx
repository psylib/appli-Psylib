/**
 * More Screen — Menu grille des features secondaires
 */
import React from 'react';
import { View, Text, ScrollView, TouchableOpacity, StyleSheet } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useUnreadCount } from '@/hooks/useNotifications';

interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  color?: string;
}

export default function MoreScreen() {
  const router = useRouter();
  const unreadCount = useUnreadCount();

  const menuItems: MenuItem[] = [
    { icon: '🔔', label: 'Notifications', route: '/notifications', badge: unreadCount },
    { icon: '💬', label: 'Messages', route: '/messages', color: Colors.accent },
    { icon: '📊', label: 'Analytics', route: '/analytics', color: Colors.warm },
    { icon: '🧾', label: 'Factures', route: '/invoices', color: Colors.primary },
    { icon: '🤖', label: 'Assistant IA', route: '/ai-summary', color: Colors.accent },
    { icon: '⚙️', label: 'Parametres', route: '/settings' },
  ];

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Plus</Text>

        <View style={styles.grid}>
          {menuItems.map((item) => (
            <TouchableOpacity
              key={item.route}
              style={styles.menuItem}
              onPress={() => router.push(item.route as any)}
              accessibilityLabel={item.label}
              accessibilityRole="button"
            >
              <View style={[styles.iconContainer, item.color ? { backgroundColor: `${item.color}15` } : {}]}>
                <Text style={styles.icon}>{item.icon}</Text>
                {item.badge != null && item.badge > 0 && (
                  <View style={styles.badge}>
                    <Text style={styles.badgeText}>{item.badge}</Text>
                  </View>
                )}
              </View>
              <Text style={styles.menuLabel}>{item.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Version */}
        <Text style={styles.version}>PsyLib v1.0.0</Text>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 24, paddingBottom: 100 },
  title: { fontSize: 28, fontFamily: 'DMSans_700Bold', color: Colors.text },
  grid: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 16,
  },
  menuItem: { width: '45%', alignItems: 'center', gap: 10 },
  iconContainer: {
    width: 64, height: 64, borderRadius: 20,
    backgroundColor: Colors.surface, alignItems: 'center', justifyContent: 'center',
    position: 'relative',
  },
  icon: { fontSize: 28 },
  badge: {
    position: 'absolute', top: -4, right: -4,
    backgroundColor: Colors.error, borderRadius: 9, minWidth: 18, height: 18,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  menuLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text, textAlign: 'center' },
  version: { fontSize: 12, color: Colors.mutedLight, textAlign: 'center', marginTop: 20 },
});
