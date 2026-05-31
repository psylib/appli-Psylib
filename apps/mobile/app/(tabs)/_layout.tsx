import React from 'react';
import { StyleSheet } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { IconHome, IconPatient, IconCalendar } from '@/components/icons/AppIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.warmText,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        tabBarActiveTintColor: Colors.sageBase,
        tabBarInactiveTintColor: '#A8A29E',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconHome size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconPatient size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconCalendar size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: Colors.warmText,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: Colors.warmBorder,
    borderTopWidth: 1,
    height: 56,
    paddingBottom: 6,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
});
