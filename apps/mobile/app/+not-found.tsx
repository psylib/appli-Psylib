import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Link } from 'expo-router';
import { Colors } from '@/constants/colors';

export default function NotFoundScreen() {
  return (
    <View style={styles.container}>
      <Text style={styles.emoji}>🔍</Text>
      <Text style={styles.title}>Page introuvable</Text>
      <Link href="/" style={styles.link}>
        <Text style={styles.linkText}>Retour a l'accueil</Text>
      </Link>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg, gap: 12 },
  emoji: { fontSize: 48 },
  title: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  link: { marginTop: 8 },
  linkText: { fontSize: 15, color: Colors.primary, fontFamily: 'DMSans_500Medium' },
});
