/**
 * Patient Portal Layout — 3 tabs: Accueil | Bien-etre | Journal
 * Custom flat illustrated SVG icons, accent teal, consistent tab bar height
 */
import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Colors } from '@/constants/colors';
import { PatientAuthContext, usePatientAuthProvider, usePatientAuth } from '@/hooks/usePatientAuth';
import { IconPatientHome, IconPatientHeart, IconPatientBook } from '@/components/icons/PatientIcons';

function TabIcon({
  Icon,
  focused,
}: {
  Icon: React.FC<{ size?: number; color?: string }>;
  focused: boolean;
}) {
  return (
    <View style={styles.tabIconContainer}>
      {focused && <View style={styles.activeIndicator} />}
      <Icon
        size={24}
        color={focused ? Colors.accent : Colors.tabInactive}
      />
    </View>
  );
}

function PatientTabsInner() {
  const { isAuthenticated, isLoading } = usePatientAuth();

  if (isLoading) return null;
  if (!isAuthenticated) return <Redirect href="/(patient)/login" />;

  return (
    <Tabs
      screenOptions={{
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.tabInactive,
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
        tabBarItemStyle: styles.tabItem,
        headerStyle: { backgroundColor: Colors.bg },
        headerTintColor: Colors.text,
        headerTitleStyle: { fontFamily: 'DMSans_700Bold', fontSize: 17 },
        headerShadowVisible: false,
      }}
    >
      <Tabs.Screen
        name="dashboard"
        options={{
          title: 'Accueil',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={IconPatientHome} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Bien-etre',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={IconPatientHeart} focused={focused} />
          ),
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => (
            <TabIcon Icon={IconPatientBook} focused={focused} />
          ),
          headerShown: false,
        }}
      />
      {/* Exercises merged into Bien-etre tab, hidden from nav */}
      <Tabs.Screen name="exercises" options={{ href: null, headerShown: false }} />
      <Tabs.Screen name="login" options={{ href: null }} />
      <Tabs.Screen name="messages" options={{ href: null }} />
    </Tabs>
  );
}

export default function PatientLayout() {
  const auth = usePatientAuthProvider();

  return (
    <PatientAuthContext.Provider value={auth}>
      <PatientTabsInner />
    </PatientAuthContext.Provider>
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
    backgroundColor: Colors.accent,
  },
});
