/**
 * Tabs Layout — 5 tabs: Accueil | Patients | Agenda | Messages | Plus
 */
import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { useUnreadCount } from '@/hooks/useNotifications';

function TabIcon({ icon, focused, badge }: { icon: string; focused: boolean; badge?: number }) {
  return (
    <View style={styles.tabIconContainer}>
      <Text
        style={[styles.tabIcon, focused && styles.tabIconFocused]}
        accessibilityElementsHidden
      >
        {icon}
      </Text>
      {badge != null && badge > 0 && (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>{badge > 99 ? '99+' : badge}</Text>
        </View>
      )}
    </View>
  );
}

function FAB() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/(tabs)/sessions/new')}
      accessibilityLabel="Nouvelle seance"
      accessibilityRole="button"
      activeOpacity={0.8}
    >
      <Text style={styles.fabIcon} accessibilityElementsHidden>+</Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const unreadCount = useUnreadCount();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.tabActive,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          headerStyle: { backgroundColor: Colors.bg },
          headerTintColor: Colors.text,
          headerTitleStyle: styles.headerTitle,
          headerShadowVisible: false,
        }}
      >
        <Tabs.Screen
          name="index"
          options={{
            title: 'Accueil',
            tabBarLabel: 'Accueil',
            tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarLabel: 'Patients',
            tabBarIcon: ({ focused }) => <TabIcon icon="👥" focused={focused} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Agenda',
            tabBarLabel: 'Agenda',
            tabBarIcon: ({ focused }) => <TabIcon icon="📅" focused={focused} />,
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Seances',
            tabBarLabel: 'Seances',
            tabBarIcon: ({ focused }) => <TabIcon icon="💬" focused={focused} />,
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Plus',
            tabBarLabel: 'Plus',
            tabBarIcon: ({ focused }) => (
              <TabIcon icon="⋯" focused={focused} badge={unreadCount} />
            ),
          }}
        />
      </Tabs>
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 80,
    paddingBottom: 12,
    paddingTop: 8,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '600',
  },
  tabIconContainer: { position: 'relative' },
  tabIcon: { fontSize: 28, opacity: 0.5 },
  tabIconFocused: { opacity: 1 },
  badge: {
    position: 'absolute',
    top: -4,
    right: -10,
    backgroundColor: Colors.error,
    borderRadius: 9,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 17, color: Colors.text },
  fab: {
    position: 'absolute',
    bottom: 96,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
  fabIcon: {
    fontSize: 28,
    color: Colors.white,
    fontWeight: '300',
    lineHeight: 32,
  },
});
