/**
 * Root layout — Expo Router + PersistQueryClientProvider + AuthContext + NativeWind
 */
import '../global.css';

import React, { useEffect, useCallback } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { PersistQueryClientProvider } from '@tanstack/react-query-persist-client';
import * as SplashScreen from 'expo-splash-screen';
import { AuthContext, useAuthProvider } from '@/hooks/useAuth';
import { useAppFonts } from '@/lib/fonts';
import { queryClient, queryPersister } from '@/lib/query-client';
import { Colors } from '@/constants/colors';
import { BiometricLock } from '@/components/BiometricLock';
import { initSslPinning } from '@/lib/ssl-pinning';

SplashScreen.preventAutoHideAsync();

function SessionProvider({ children }: { children: React.ReactNode }) {
  const auth = useAuthProvider();
  return <AuthContext.Provider value={auth}>{children}</AuthContext.Provider>;
}

export default function RootLayout() {
  const { fontsLoaded, fontError } = useAppFonts();

  // Initialize SSL certificate pinning as early as possible
  useEffect(() => {
    void initSslPinning();
  }, []);

  const onLayoutRootView = useCallback(async () => {
    if (fontsLoaded || fontError) {
      await SplashScreen.hideAsync();
    }
  }, [fontsLoaded, fontError]);

  useEffect(() => {
    void onLayoutRootView();
  }, [onLayoutRootView]);

  if (!fontsLoaded && !fontError) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <SafeAreaProvider>
        <PersistQueryClientProvider
          client={queryClient}
          persistOptions={{ persister: queryPersister, maxAge: 1000 * 60 * 60 * 24 }}
        >
          <SessionProvider>
            <BiometricLock>
            <StatusBar style="dark" backgroundColor={Colors.bg} />
            <Stack
              screenOptions={{
                headerStyle: { backgroundColor: Colors.bg },
                headerTintColor: Colors.text,
                headerTitleStyle: { fontFamily: 'DMSans_700Bold', fontSize: 17 },
                contentStyle: { backgroundColor: Colors.bg },
                animation: 'slide_from_right',
              }}
            >
              <Stack.Screen name="index" options={{ headerShown: false }} />
              <Stack.Screen
                name="login"
                options={{ title: 'Connexion', headerShown: false, animation: 'fade' }}
              />
              <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
              <Stack.Screen name="(patient)" options={{ headerShown: false }} />
              <Stack.Screen
                name="messages/index"
                options={{ title: 'Messages', headerBackTitle: 'Retour' }}
              />
              <Stack.Screen name="messages/[id]" options={{ title: 'Conversation' }} />
              <Stack.Screen name="notifications" options={{ title: 'Notifications' }} />
              <Stack.Screen name="analytics" options={{ title: 'Analytics' }} />
              <Stack.Screen
                name="invoices/index"
                options={{ title: 'Factures', headerBackTitle: 'Retour' }}
              />
              <Stack.Screen name="invoices/[id]" options={{ title: 'Facture' }} />
              <Stack.Screen name="invoices/new" options={{ title: 'Nouvelle facture' }} />
              <Stack.Screen name="ai-summary" options={{ title: 'Resume IA' }} />
              <Stack.Screen name="ai-exercise" options={{ title: 'Exercice IA' }} />
              <Stack.Screen
                name="settings/index"
                options={{ title: 'Parametres', headerBackTitle: 'Retour' }}
              />
              <Stack.Screen name="settings/profile" options={{ title: 'Mon profil' }} />
              <Stack.Screen name="+not-found" />
            </Stack>
            </BiometricLock>
          </SessionProvider>
        </PersistQueryClientProvider>
      </SafeAreaProvider>
    </GestureHandlerRootView>
  );
}
