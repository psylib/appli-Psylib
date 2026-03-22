/**
 * NotificationDrawer — Modal sheet from header bell icon
 * Uses custom flat illustrated SVG icons.
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  FlatList,
  Platform,
} from 'react-native';
import {
  IconCalendar,
  IconHeart,
  IconCard,
  IconSparkle,
  IconBell,
  IconBellOff,
} from '@/components/icons/AppIcons';
import { Colors } from '@/constants/colors';

interface Notification {
  id: string;
  title: string;
  body: string;
  type: string;
  readAt: string | null;
  createdAt: string;
}

interface NotificationDrawerProps {
  visible: boolean;
  onClose: () => void;
  notifications: Notification[];
  onMarkAllRead: () => void;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const minutes = Math.floor(diff / 60000);
  if (minutes < 1) return "A l'instant";
  if (minutes < 60) return `Il y a ${minutes}min`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `Il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `Il y a ${days}j`;
}

const TYPE_ICONS: Record<string, React.FC<{ size?: number; color?: string }>> = {
  session_reminder: IconCalendar,
  mood_alert: IconHeart,
  payment: IconCard,
  ai_complete: IconSparkle,
};

export function NotificationDrawer({
  visible,
  onClose,
  notifications,
  onMarkAllRead,
}: NotificationDrawerProps) {
  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Header */}
          <View style={styles.header}>
            <Text style={styles.title}>Notifications</Text>
            {notifications.length > 0 && (
              <TouchableOpacity onPress={onMarkAllRead} accessibilityLabel="Tout marquer comme lu">
                <Text style={styles.markAll}>Tout lire</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* List */}
          <FlatList
            data={notifications.slice(0, 20)}
            keyExtractor={(item) => item.id}
            renderItem={({ item }) => {
              const IconComponent = TYPE_ICONS[item.type] ?? IconBell;
              return (
                <View style={[styles.notifItem, item.readAt == null && styles.notifUnread]}>
                  <View style={styles.notifIcon}>
                    <IconComponent
                      size={20}
                      color={item.readAt == null ? Colors.primary : Colors.muted}
                    />
                  </View>
                  <View style={styles.notifContent}>
                    <Text style={[styles.notifTitle, item.readAt == null && styles.notifTitleUnread]} numberOfLines={1}>
                      {item.title}
                    </Text>
                    <Text style={styles.notifBody} numberOfLines={2}>
                      {item.body}
                    </Text>
                    <Text style={styles.notifTime}>{timeAgo(item.createdAt)}</Text>
                  </View>
                  {item.readAt == null && <View style={styles.unreadDot} />}
                </View>
              );
            }}
            ListEmptyComponent={
              <View style={styles.empty}>
                <IconBellOff size={48} color={Colors.mutedLight} />
                <Text style={styles.emptyText}>Aucune notification</Text>
              </View>
            }
            contentContainerStyle={styles.list}
            showsVerticalScrollIndicator={false}
          />
        </Pressable>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: Colors.white,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '70%',
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 12,
  },
  handle: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: Colors.text,
  },
  markAll: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.primary,
  },
  list: {
    paddingBottom: 20,
  },
  notifItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    paddingHorizontal: 20,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  notifUnread: {
    backgroundColor: `${Colors.primary}06`,
  },
  notifIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  notifContent: {
    flex: 1,
    gap: 2,
  },
  notifTitle: {
    fontSize: 14,
    fontWeight: '500',
    color: Colors.text,
  },
  notifTitleUnread: {
    fontWeight: '700',
  },
  notifBody: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  notifTime: {
    fontSize: 11,
    color: Colors.mutedLight,
    marginTop: 2,
  },
  unreadDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
    marginTop: 4,
    flexShrink: 0,
  },
  empty: {
    alignItems: 'center',
    paddingVertical: 60,
    gap: 12,
  },
  emptyText: {
    fontSize: 15,
    color: Colors.muted,
  },
});
