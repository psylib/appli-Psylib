/**
 * Notifications List — tap to navigate, swipe to read
 */
import React from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useNotificationsList, useMarkNotificationRead, useMarkAllRead } from '@/hooks/useNotifications';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return "a l'instant";
  if (mins < 60) return `il y a ${mins} min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

export default function NotificationsScreen() {
  const router = useRouter();
  const { data: notifications, isLoading, refetch, isRefetching } = useNotificationsList();
  const markRead = useMarkNotificationRead();
  const markAllRead = useMarkAllRead();

  const handlePress = (notif: { id: string; type: string; data?: Record<string, unknown> }) => {
    if (!notif.data) return;
    markRead.mutate(notif.id);

    // Navigate based on notification type
    if (notif.type === 'session_reminder' && notif.data.sessionId) {
      router.push(`/(tabs)/sessions/${notif.data.sessionId}`);
    } else if (notif.type === 'mood_alert' && notif.data.patientId) {
      router.push(`/(tabs)/patients/${notif.data.patientId}`);
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {notifications && notifications.some((n) => !n.readAt) && (
        <TouchableOpacity
          style={styles.markAllButton}
          onPress={() => markAllRead.mutate()}
        >
          <Text style={styles.markAllText}>Tout marquer comme lu</Text>
        </TouchableOpacity>
      )}

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={notifications ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[styles.notifItem, !item.readAt && styles.notifUnread]}
              onPress={() => handlePress(item)}
            >
              <View style={styles.notifDot}>
                {!item.readAt && <View style={styles.dot} />}
              </View>
              <View style={styles.notifContent}>
                <Text style={styles.notifTitle}>{item.title}</Text>
                <Text style={styles.notifBody} numberOfLines={2}>{item.body}</Text>
                <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🔔</Text>
              <Text style={styles.emptyTitle}>Aucune notification</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  markAllButton: { padding: 16, alignItems: 'flex-end' },
  markAllText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.primary },
  list: { paddingBottom: 100 },
  notifItem: {
    flexDirection: 'row', padding: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  notifUnread: { backgroundColor: `${Colors.primary}08` },
  notifDot: { width: 10, paddingTop: 6 },
  dot: { width: 8, height: 8, borderRadius: 4, backgroundColor: Colors.primary },
  notifContent: { flex: 1, gap: 4 },
  notifTitle: { fontSize: 15, fontFamily: 'DMSans_500Medium', color: Colors.text },
  notifBody: { fontSize: 13, color: Colors.muted, lineHeight: 18 },
  notifTime: { fontSize: 12, color: Colors.mutedLight },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.muted },
});
