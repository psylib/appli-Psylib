/**
 * Tabs Layout — Bottom tab navigator
 * 4 onglets : Dashboard | Patients | Séances | Calendrier
 * + FAB "+" en bas à droite pour nouvelle séance
 */

import React from 'react';
import { View, TouchableOpacity, Text, StyleSheet } from 'react-native';
import { Tabs, useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';

function TabBarIcon({ emoji, focused }: { emoji: string; focused: boolean }) {
  return (
    <Text
      style={[styles.tabIcon, focused && styles.tabIconFocused]}
      accessibilityElementsHidden
    >
      {emoji}
    </Text>
  );
}

function FAB() {
  const router = useRouter();
  return (
    <TouchableOpacity
      style={styles.fab}
      onPress={() => router.push('/(tabs)/sessions/new')}
      accessibilityLabel="Nouvelle séance"
      accessibilityRole="button"
      accessibilityHint="Ouvre le formulaire de création d'une nouvelle séance"
      activeOpacity={0.8}
    >
      <Text style={styles.fabIcon} accessibilityElementsHidden>
        +
      </Text>
    </TouchableOpacity>
  );
}

export default function TabsLayout() {
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
            title: 'Dashboard',
            tabBarLabel: 'Dashboard',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon emoji="📊" focused={focused} />
            ),
          }}
        />
        <Tabs.Screen
          name="patients"
          options={{
            title: 'Patients',
            tabBarLabel: 'Patients',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon emoji="👥" focused={focused} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="sessions"
          options={{
            title: 'Séances',
            tabBarLabel: 'Séances',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon emoji="📋" focused={focused} />
            ),
            headerShown: false,
          }}
        />
        <Tabs.Screen
          name="calendar"
          options={{
            title: 'Calendrier',
            tabBarLabel: 'Calendrier',
            tabBarIcon: ({ focused }) => (
              <TabBarIcon emoji="📅" focused={focused} />
            ),
          }}
        />
      </Tabs>

      {/* FAB nouvelle séance */}
      <FAB />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  tabBar: {
    backgroundColor: Colors.tabBackground,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: 60,
    paddingBottom: 6,
    paddingTop: 6,
  },
  tabLabel: {
    fontSize: 10,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 20,
    opacity: 0.5,
  },
  tabIconFocused: {
    opacity: 1,
  },
  headerTitle: {
    fontWeight: '700',
    fontSize: 17,
    color: Colors.text,
  },
  fab: {
    position: 'absolute',
    bottom: 80,
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
    includeFontPadding: false,
  },
});
