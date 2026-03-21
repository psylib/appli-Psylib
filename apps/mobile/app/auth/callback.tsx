/**
 * Auth Callback Route — handles Keycloak OIDC redirect
 *
 * After login, Keycloak redirects to psylib://auth/callback?code=xxx
 * expo-router intercepts this deep link and renders this screen.
 * WebBrowser.maybeCompleteAuthSession() captures the auth code
 * and passes it back to the useAuthRequest hook on the login screen.
 */

import { useEffect } from 'react';
import { View, Text, ActivityIndicator, StyleSheet } from 'react-native';
import * as WebBrowser from 'expo-web-browser';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';

// Complete the auth session — this sends the auth code back to promptAsync()
WebBrowser.maybeCompleteAuthSession();

export default function AuthCallbackScreen() {
  const router = useRouter();

  useEffect(() => {
    // If maybeCompleteAuthSession didn't handle it (e.g. direct navigation),
    // redirect to login after a short delay
    const timeout = setTimeout(() => {
      router.replace('/login');
    }, 3000);

    return () => clearTimeout(timeout);
  }, [router]);

  return (
    <View style={styles.container}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.text}>Connexion en cours...</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.bg,
    gap: 16,
  },
  text: {
    fontSize: 16,
    color: Colors.muted,
  },
});
