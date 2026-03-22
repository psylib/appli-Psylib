/**
 * Tabs Layout — 3 tabs: Accueil | Patients | Agenda
 * Sessions hidden from tab bar (accessible via push navigation)
 * More screen removed (content redistributed to ProfileSheet + header)
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Colors } from '@/constants/colors';

type IoniconsName = keyof typeof Ionicons.glyphMap;

function TabIcon({
  name,
  focusedName,
  focused,
}: {
  name: IoniconsName;
  focusedName: IoniconsName;
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      {/* Active indicator pill */}
      {focused && <View style={styles.activeIndicator} />}
      <Ionicons
        name={focused ? focusedName : name}
        size={24}
        color={focused ? Colors.primary : Colors.tabInactive}
      />
    </View>
  );
}

export default function TabsLayout() {
  return (
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
          headerShown: false,
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
      {/* Sessions: hidden from tab bar, accessible via push navigation */}
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      {/* More: hidden from tab bar, content moved to ProfileSheet */}
      <Tabs.Screen
        name="more"
        options={{
          href: null,
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    backgroundColor: Colors.white,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    height: Platform.OS === 'ios' ? 83 : 60,
    paddingBottom: Platform.OS === 'ios' ? 28 : 8,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabItem: {
    paddingVertical: 4,
  },
  tabLabel: {
    fontSize: 12,
    fontFamily: 'DMSans_600SemiBold',
    fontWeight: '600',
    marginTop: 4,
  },
  tabIconContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    width: 32,
    height: 32,
  },
  activeIndicator: {
    position: 'absolute',
    top: -6,
    width: 24,
    height: 3,
    borderRadius: 2,
    backgroundColor: Colors.tabIndicator,
  },
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: Colors.text,
  },
});
