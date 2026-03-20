/**
 * AI Summary Screen — SSE streaming from session notes
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { useAiSummary } from '@/hooks/useAiSummary';

export default function AiSummaryScreen() {
  const { sessionId } = useLocalSearchParams<{ sessionId?: string }>();
  const { summary, isStreaming, error, generate, reset } = useAiSummary();

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card style={styles.infoCard}>
          <Text style={styles.infoIcon}>🤖</Text>
          <Text style={styles.infoTitle}>Resume IA de seance</Text>
          <Text style={styles.infoText}>
            L'IA analyse vos notes de seance et genere un resume structure.
            Outil d'aide — le praticien reste responsable.
          </Text>
        </Card>

        {!summary && !isStreaming && !error && (
          <Button
            onPress={() => sessionId && generate(sessionId)}
            variant="primary"
            size="lg"
            fullWidth
            disabled={!sessionId}
            accessibilityLabel="Generer le resume"
          >
            Generer le resume
          </Button>
        )}

        {isStreaming && (
          <View style={styles.streamingIndicator}>
            <ActivityIndicator size="small" color={Colors.accent} />
            <Text style={styles.streamingText}>Generation en cours...</Text>
          </View>
        )}

        {error && (
          <Card style={styles.errorCard}>
            <Text style={styles.errorText}>{error}</Text>
            <Button onPress={reset} variant="outline" size="sm" accessibilityLabel="Reessayer">
              Reessayer
            </Button>
          </Card>
        )}

        {summary.length > 0 && (
          <Card elevated style={styles.summaryCard}>
            <Text style={styles.summaryTitle}>Resume</Text>
            <Text style={styles.summaryText}>{summary}</Text>
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  infoCard: { alignItems: 'center', gap: 8, padding: 24 },
  infoIcon: { fontSize: 40 },
  infoTitle: { fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text },
  infoText: { fontSize: 14, color: Colors.muted, textAlign: 'center', lineHeight: 20 },
  streamingIndicator: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8 },
  streamingText: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.accent },
  errorCard: { backgroundColor: `${Colors.error}08`, padding: 16, gap: 12, alignItems: 'center' },
  errorText: { fontSize: 14, color: Colors.error },
  summaryCard: { gap: 12, padding: 20 },
  summaryTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text },
  summaryText: { fontSize: 15, color: Colors.text, lineHeight: 22 },
});
