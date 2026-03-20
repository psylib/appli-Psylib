/**
 * Patient Login — Email + Code (not Keycloak)
 */
import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { usePatientAuth } from '@/hooks/usePatientAuth';

export default function PatientLoginScreen() {
  const { login, isLoading, error } = usePatientAuth();
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');

  const handleLogin = async () => {
    if (!email.trim() || !code.trim()) {
      Alert.alert('Erreur', 'Veuillez remplir tous les champs');
      return;
    }
    await login(email.trim(), code.trim());
  };

  return (
    <SafeAreaView style={styles.safeArea}>
      <View style={styles.container}>
        <Text style={styles.logo}>🧠</Text>
        <Text style={styles.title}>Espace Patient</Text>
        <Text style={styles.subtitle}>
          Connectez-vous avec l'email et le code fournis par votre psychologue.
        </Text>

        <View style={styles.form}>
          <TextInput
            style={styles.input}
            value={email}
            onChangeText={setEmail}
            placeholder="Votre email"
            placeholderTextColor={Colors.mutedLight}
            keyboardType="email-address"
            autoCapitalize="none"
            autoComplete="email"
          />
          <TextInput
            style={styles.input}
            value={code}
            onChangeText={setCode}
            placeholder="Code d'acces"
            placeholderTextColor={Colors.mutedLight}
            autoCapitalize="none"
            secureTextEntry
          />
          {error && <Text style={styles.error}>{error}</Text>}
          <Button onPress={handleLogin} loading={isLoading} variant="primary" size="lg" fullWidth>
            Se connecter
          </Button>
        </View>

        <Text style={styles.footer}>Donnees chiffrees et securisees</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  container: { flex: 1, padding: 24, justifyContent: 'center', alignItems: 'center', gap: 16 },
  logo: { fontSize: 48 },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20, maxWidth: 280 },
  form: { width: '100%', gap: 12, marginTop: 16 },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 12, padding: 16,
    borderWidth: 1, borderColor: Colors.border, fontSize: 15, color: Colors.text,
    minHeight: 52,
  },
  error: { fontSize: 13, color: Colors.error, textAlign: 'center' },
  footer: { fontSize: 12, color: Colors.mutedLight, marginTop: 24 },
});
