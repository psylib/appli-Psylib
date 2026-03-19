/**
 * Login Screen — Connexion Keycloak OIDC
 * Authorization Code Flow + PKCE via expo-auth-session
 */

import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Image,
  ScrollView,
  ActivityIndicator,
  Platform,
  TextInput,
  Alert,
} from 'react-native';
import { Redirect } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/Button';
import { Colors } from '@/constants/colors';

export default function LoginScreen() {
  const { isAuthenticated, isLoading, login, error } = useAuth();
  const [leadEmail, setLeadEmail] = useState('');
  const [leadLoading, setLeadLoading] = useState(false);
  const [leadSent, setLeadSent] = useState(false);

  const submitLead = async () => {
    const email = leadEmail.trim().toLowerCase();
    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      Alert.alert('Email invalide', 'Veuillez entrer un email valide.');
      return;
    }
    setLeadLoading(true);
    try {
      await fetch('https://psylib.eu/api/leads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
      setLeadSent(true);
    } catch {
      Alert.alert('Erreur', 'Une erreur est survenue. Réessayez plus tard.');
    } finally {
      setLeadLoading(false);
    }
  };

  // Redirect si déjà authentifié
  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <ScrollView
        contentContainerStyle={styles.scroll}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        {/* Logo / Branding */}
        <View style={styles.header}>
          <View style={styles.logoContainer} accessibilityLabel="PsyLib">
            <View style={styles.logoMark}>
              <Text style={styles.logoChar}>Ψ</Text>
            </View>
            <Text style={styles.logoText}>PsyLib</Text>
          </View>
          <Text style={styles.tagline}>
            La plateforme dédiée aux psychologues libéraux
          </Text>
        </View>

        {/* Carte de connexion */}
        <View style={styles.card}>
          <Text style={styles.cardTitle}>Connexion sécurisée</Text>
          <Text style={styles.cardSubtitle}>
            Authentification via Keycloak — vos données restent sur des serveurs certifiés HDS France.
          </Text>

          {error != null && error.length > 0 && (
            <View style={styles.errorBanner} accessibilityRole="alert">
              <Text style={styles.errorText}>{error}</Text>
            </View>
          )}

          <Button
            onPress={() => void login()}
            variant="primary"
            size="lg"
            fullWidth
            disabled={isLoading}
            loading={isLoading}
            accessibilityLabel="Se connecter avec Keycloak"
          >
            {isLoading ? 'Connexion...' : 'Se connecter'}
          </Button>

          <Text style={styles.securityNote}>
            MFA requis pour les comptes psychologue
          </Text>
        </View>

        {/* Features */}
        <View style={styles.features}>
          {FEATURES.map((feature) => (
            <View key={feature.title} style={styles.featureItem}>
              <Text style={styles.featureEmoji} accessibilityElementsHidden>
                {feature.emoji}
              </Text>
              <View style={styles.featureContent}>
                <Text style={styles.featureTitle}>{feature.title}</Text>
                <Text style={styles.featureDesc}>{feature.description}</Text>
              </View>
            </View>
          ))}
        </View>

        {/* Bloc lead capture */}
        <View style={styles.leadCard}>
          <Text style={styles.leadTitle}>Pas encore inscrit ?</Text>
          <Text style={styles.leadSubtitle}>
            Laissez votre email pour être notifié à l'ouverture de la bêta.
          </Text>
          {leadSent ? (
            <View style={styles.leadSuccess} accessibilityRole="alert">
              <Text style={styles.leadSuccessText}>
                Merci ! Vous serez notifié dès l'ouverture.
              </Text>
            </View>
          ) : (
            <View style={styles.leadRow}>
              <TextInput
                style={styles.leadInput}
                placeholder="votre@email.fr"
                placeholderTextColor={Colors.mutedLight}
                keyboardType="email-address"
                autoCapitalize="none"
                autoCorrect={false}
                value={leadEmail}
                onChangeText={setLeadEmail}
                editable={!leadLoading}
                accessibilityLabel="Votre adresse email"
              />
              <Button
                onPress={() => void submitLead()}
                variant="primary"
                size="sm"
                disabled={leadLoading}
                loading={leadLoading}
                accessibilityLabel="S'inscrire à la bêta"
              >
                OK
              </Button>
            </View>
          )}
        </View>

        {/* Footer légal */}
        <View style={styles.footer}>
          <Text style={styles.footerText}>
            Données hébergées en France · Certifié HDS · Conforme RGPD
          </Text>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const FEATURES = [
  {
    emoji: '📊',
    title: 'Dashboard KPIs',
    description: 'Suivez vos patients et séances en temps réel',
  },
  {
    emoji: '📋',
    title: 'Notes chiffrées',
    description: 'Vos notes de séance chiffrées AES-256-GCM',
  },
  {
    emoji: '🔒',
    title: 'Sécurité HDS',
    description: 'Infrastructure certifiée Hébergeur de Données de Santé',
  },
] as const;

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  scroll: {
    flexGrow: 1,
    padding: 24,
    gap: 32,
  },
  header: {
    alignItems: 'center',
    paddingTop: 24,
    gap: 12,
  },
  logoContainer: {
    alignItems: 'center',
    gap: 8,
  },
  logoMark: {
    width: 72,
    height: 72,
    borderRadius: 20,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.primary,
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 16,
    elevation: 8,
  },
  logoChar: {
    fontSize: 36,
    fontWeight: '700',
    color: Colors.white,
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  tagline: {
    fontSize: 15,
    color: Colors.muted,
    textAlign: 'center',
    lineHeight: 22,
  },
  card: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 20,
    padding: 24,
    gap: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: Colors.text,
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 12,
    elevation: 3,
  },
  cardTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: Colors.text,
  },
  cardSubtitle: {
    fontSize: 14,
    color: Colors.muted,
    lineHeight: 20,
  },
  errorBanner: {
    backgroundColor: '#FEE2E2',
    borderRadius: 10,
    padding: 12,
  },
  errorText: {
    fontSize: 13,
    color: Colors.error,
    fontWeight: '500',
  },
  securityNote: {
    fontSize: 12,
    color: Colors.mutedLight,
    textAlign: 'center',
  },
  features: {
    gap: 16,
  },
  featureItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 14,
  },
  featureEmoji: {
    fontSize: 24,
    width: 36,
    textAlign: 'center',
  },
  featureContent: {
    flex: 1,
    gap: 2,
  },
  featureTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: Colors.text,
  },
  featureDesc: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  leadCard: {
    backgroundColor: Colors.surfaceElevated,
    borderRadius: 16,
    padding: 20,
    gap: 12,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  leadTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: Colors.text,
  },
  leadSubtitle: {
    fontSize: 13,
    color: Colors.muted,
    lineHeight: 18,
  },
  leadRow: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  leadInput: {
    flex: 1,
    height: 44,
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 14,
    color: Colors.text,
    backgroundColor: Colors.bg,
  },
  leadSuccess: {
    backgroundColor: '#D1FAE5',
    borderRadius: 10,
    padding: 12,
  },
  leadSuccessText: {
    fontSize: 13,
    color: Colors.accent,
    fontWeight: '500',
    textAlign: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: 8,
  },
  footerText: {
    fontSize: 11,
    color: Colors.mutedLight,
    textAlign: 'center',
  },
});
