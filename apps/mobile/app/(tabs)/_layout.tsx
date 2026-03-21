/**
 * Tabs Layout — 5 tabs: Accueil | Patients | Agenda | Seances | Plus
 */
import React from 'react';
import { View, TouchableOpacity, StyleSheet, Platform, Text } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';
import { useUnreadCount } from '@/hooks/useNotifications';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  focusedName,
  focused,
  badge,
}: {
  name: IoniconsName;
  focusedName: IoniconsName;
  focused: boolean;
  badge?: number;
}) {
  return (
    <View style={styles.tabIconContainer}>
      <Ionicons
        name={focused ? focusedName : name}
        size={26}
        color={focused ? Colors.primary : Colors.tabInactive}
      />
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
      <Ionicons name="add" size={30} color={Colors.white} />
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
  const unreadCount = useUnreadCount();

  return (
    <View style={styles.container}>
      <Tabs
        screenOptions={{
          tabBarActiveTintColor: Colors.primary,
          tabBarInactiveTintColor: Colors.tabInactive,
          tabBarStyle: styles.tabBar,
          tabBarLabelStyle: styles.tabLabel,
          tabBarItemStyle: styles.tabItem,
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
            tabBarIcon: ({ focused }) => (
              <TabIcon name="home-outline" focusedName="home" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarLabel: 'Patients',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="people-outline" focusedName="people" focused={focused} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Agenda',
            tabBarLabel: 'Agenda',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="calendar-outline" focusedName="calendar" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Seances',
            tabBarLabel: 'Seances',
            tabBarIcon: ({ focused }) => (
              <TabIcon name="document-text-outline" focusedName="document-text" focused={focused} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="more"
          options={{
            title: 'Plus',
            tabBarLabel: 'Plus',
            tabBarIcon: ({ focused }) => (
              <TabIcon
                name="ellipsis-horizontal-outline"
                focusedName="ellipsis-horizontal"
                focused={focused}
                badge={unreadCount}
              />
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
    backgroundColor: Colors.white,
    borderTopWidth: 0,
    height: Platform.OS === 'ios' ? 92 : 72,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 12,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontFamily: 'DMSans_500Medium',
    fontWeight: '600',
    marginTop: 2,
  },
  tabIconContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -8,
    backgroundColor: Colors.error,
    borderRadius: 10,
    minWidth: 18,
    height: 18,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 4,
    borderWidth: 2,
    borderColor: Colors.white,
  },
  badgeText: { color: '#FFF', fontSize: 10, fontWeight: '700' },
  headerTitle: { fontFamily: 'DMSans_700Bold', fontSize: 17, color: Colors.text },
  fab: {
    position: 'absolute',
    bottom: Platform.OS === 'ios' ? 104 : 84,
    right: 20,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.35,
    shadowRadius: 12,
    elevation: 8,
    zIndex: 100,
  },
});
