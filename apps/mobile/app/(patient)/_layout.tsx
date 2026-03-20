/**
 * Patient Portal Layout — 4 tabs: Accueil | Humeur | Exercices | Journal
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs, Redirect } from 'expo-router';
import { Text } from 'react-native';
import { Colors } from '@/constants/colors';
import { PatientAuthContext, usePatientAuthProvider, usePatientAuth } from '@/hooks/usePatientAuth';

function TabIcon({ icon, focused }: { icon: string; focused: boolean }) {
  return (
    <Text style={{ fontSize: 22, opacity: focused ? 1 : 0.5 }}>{icon}</Text>
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
          tabBarIcon: ({ focused }) => <TabIcon icon="🏠" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="mood"
        options={{
          title: 'Humeur',
          tabBarIcon: ({ focused }) => <TabIcon icon="😊" focused={focused} />,
        }}
      />
      <Tabs.Screen
        name="exercises"
        options={{
          title: 'Exercices',
          tabBarIcon: ({ focused }) => <TabIcon icon="🧘" focused={focused} />,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="journal"
        options={{
          title: 'Journal',
          tabBarIcon: ({ focused }) => <TabIcon icon="📔" focused={focused} />,
          headerShown: false,
        }}
      />
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
    backgroundColor: Colors.tabBackground, borderTopWidth: 1,
    borderTopColor: Colors.border, height: 64, paddingBottom: 8, paddingTop: 6,
  },
  tabLabel: { fontSize: 10, fontFamily: 'DMSans_500Medium', fontWeight: '600' },
});
