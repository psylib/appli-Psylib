/**
 * Conversations list — FlatList, unread badge, preview
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
import { useConversations } from '@/hooks/useMessaging';

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60_000);
  if (mins < 1) return 'maintenant';
  if (mins < 60) return `${mins}m`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h`;
  const days = Math.floor(hours / 24);
  return `${days}j`;
}

export default function MessagesScreen() {
  const router = useRouter();
  const { data: conversations, isLoading, refetch, isRefetching } = useConversations();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={conversations ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.conversationItem}
              onPress={() => router.push(`/messages/${item.id}`)}
              accessibilityLabel={`Conversation avec ${item.patient?.name ?? 'patient'}`}
            >
              <View style={styles.avatar}>
                <Text style={styles.avatarText}>
                  {item.patient?.name?.charAt(0)?.toUpperCase() ?? '?'}
                </Text>
              </View>
              <View style={styles.conversationInfo}>
                <View style={styles.nameRow}>
                  <Text style={[styles.name, item.unreadCount > 0 && styles.nameBold]}>
                    {item.patient?.name ?? 'Patient'}
                  </Text>
                  {item.lastMessage && (
                    <Text style={styles.time}>{timeAgo(item.lastMessage.createdAt)}</Text>
                  )}
                </View>
                {item.lastMessage && (
                  <Text style={styles.preview} numberOfLines={1}>
                    {item.lastMessage.content}
                  </Text>
                )}
              </View>
              {item.unreadCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{item.unreadCount}</Text>
                </View>
              )}
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>💬</Text>
              <Text style={styles.emptyTitle}>Aucune conversation</Text>
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
  list: { paddingBottom: 100 },
  conversationItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: `${Colors.primary}15`, alignItems: 'center', justifyContent: 'center',
  },
  avatarText: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.primary },
  conversationInfo: { flex: 1, gap: 4 },
  nameRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  name: { fontSize: 15, fontFamily: 'DMSans_400Regular', color: Colors.text },
  nameBold: { fontFamily: 'DMSans_700Bold' },
  time: { fontSize: 12, color: Colors.mutedLight },
  preview: { fontSize: 13, color: Colors.muted },
  badge: {
    backgroundColor: Colors.primary, borderRadius: 10, minWidth: 20, height: 20,
    alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6,
  },
  badgeText: { color: '#FFF', fontSize: 11, fontWeight: '700' },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.muted },
});
