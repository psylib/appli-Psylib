/**
 * Tabs Layout — Navigation pills inline (no bottom tab bar)
 * Tab bar hidden — navigation handled by NavPills component in each screen header.
 */
import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        tabBarStyle: { display: 'none' },
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
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          headerShown: false,
        }}
      />
      {/* Sessions: accessible via push navigation */}
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      {/* More: content moved to ProfileSheet */}
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
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: Colors.text,
  },
});
