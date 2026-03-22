/**
 * ProfileSheet — Bottom sheet with links to Settings, Analytics, Invoices, Legal, Logout
 */
import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Pressable,
  Linking,
  Platform,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useAuthStore } from '@/store/auth.store';

type IoniconsName = keyof typeof Ionicons.glyphMap;

interface ProfileSheetProps {
  visible: boolean;
  onClose: () => void;
}

interface SheetItem {
  icon: IoniconsName;
  label: string;
  onPress: () => void;
  color?: string;
  destructive?: boolean;
}

export function ProfileSheet({ visible, onClose }: ProfileSheetProps) {
  const router = useRouter();
  const { name, logout } = useAuthStore();

  const initials = (name ?? 'U')
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const navigate = (route: string) => {
    onClose();
    setTimeout(() => router.push(route as any), 150);
  };

  const menuItems: SheetItem[] = [
    { icon: 'bar-chart-outline', label: 'Analytics', onPress: () => navigate('/analytics'), color: Colors.warm },
    { icon: 'receipt-outline', label: 'Factures', onPress: () => navigate('/invoices'), color: Colors.primary },
    { icon: 'chatbubbles-outline', label: 'Messages', onPress: () => navigate('/messages'), color: Colors.accent },
    { icon: 'sparkles-outline', label: 'Assistant IA', onPress: () => navigate('/ai-summary'), color: Colors.accent },
    { icon: 'settings-outline', label: 'Parametres', onPress: () => navigate('/settings') },
  ];

  const legalItems = [
    { label: 'Politique de confidentialite (RGPD)', url: 'https://psylib.eu/privacy' },
    { label: "Conditions generales d'utilisation", url: 'https://psylib.eu/terms' },
    { label: 'Mentions legales', url: 'https://psylib.eu/legal' },
  ];

  const handleLogout = () => {
    onClose();
    logout();
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Pressable style={styles.sheet} onPress={(e) => e.stopPropagation()}>
          {/* Handle bar */}
          <View style={styles.handleContainer}>
            <View style={styles.handle} />
          </View>

          {/* Profile header */}
          <View style={styles.profileRow}>
            <View style={styles.avatar}>
              <Text style={styles.avatarText}>{initials}</Text>
            </View>
            <View style={styles.profileInfo}>
              <Text style={styles.profileName}>{name ?? 'Utilisateur'}</Text>
              <Text style={styles.profileRole}>Psychologue</Text>
            </View>
          </View>

          {/* Menu items */}
          <View style={styles.menuSection}>
            {menuItems.map((item) => (
              <TouchableOpacity
                key={item.label}
                style={styles.menuItem}
                onPress={item.onPress}
                accessibilityLabel={item.label}
                accessibilityRole="button"
                activeOpacity={0.7}
              >
                <View style={[styles.menuIcon, item.color ? { backgroundColor: `${item.color}15` } : { backgroundColor: Colors.surface }]}>
                  <Ionicons name={item.icon} size={20} color={item.color ?? Colors.muted} />
                </View>
                <Text style={styles.menuLabel}>{item.label}</Text>
                <Ionicons name="chevron-forward" size={16} color={Colors.mutedLight} />
              </TouchableOpacity>
            ))}
          </View>

          {/* Legal */}
          <View style={styles.legalSection}>
            {legalItems.map((item) => (
              <TouchableOpacity
                key={item.url}
                onPress={() => void Linking.openURL(item.url)}
                accessibilityLabel={item.label}
                accessibilityRole="link"
              >
                <Text style={styles.legalLink}>{item.label}</Text>
              </TouchableOpacity>
            ))}
          </View>

          {/* Logout */}
          <TouchableOpacity
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityLabel="Se deconnecter"
            accessibilityRole="button"
          >
            <Ionicons name="log-out-outline" size={20} color={Colors.error} />
            <Text style={styles.logoutText}>Se deconnecter</Text>
          </TouchableOpacity>

          <Text style={styles.version}>PsyLib v1.0.0</Text>
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
    paddingBottom: Platform.OS === 'ios' ? 40 : 24,
    maxHeight: '85%',
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
  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingHorizontal: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: `${Colors.primary}1A`,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarText: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.primary,
  },
  profileInfo: {
    flex: 1,
    gap: 2,
  },
  profileName: {
    fontSize: 17,
    fontWeight: '700',
    color: Colors.text,
  },
  profileRole: {
    fontSize: 13,
    color: Colors.muted,
  },
  menuSection: {
    paddingHorizontal: 20,
    paddingTop: 16,
    gap: 4,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    paddingVertical: 12,
    minHeight: 48,
  },
  menuIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
  },
  menuLabel: {
    flex: 1,
    fontSize: 15,
    fontWeight: '500',
    color: Colors.text,
  },
  legalSection: {
    marginHorizontal: 20,
    marginTop: 16,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    padding: 16,
    gap: 12,
  },
  legalLink: {
    fontSize: 14,
    color: Colors.primary,
    fontFamily: 'DMSans_500Medium',
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    marginHorizontal: 20,
    marginTop: 16,
    paddingVertical: 14,
    justifyContent: 'center',
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.error}30`,
    backgroundColor: `${Colors.error}08`,
    minHeight: 48,
  },
  logoutText: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.error,
  },
  version: {
    fontSize: 12,
    color: Colors.mutedLight,
    textAlign: 'center',
    marginTop: 16,
  },
});
