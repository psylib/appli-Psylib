/**
 * New Journal Entry — encrypted on backend
 */
import React, { useState } from 'react';
import { View, Text, ScrollView, StyleSheet, TextInput, Switch, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useCreateJournalEntry } from '@/hooks/usePatientJournal';

export default function NewJournalEntryScreen() {
  const router = useRouter();
  const createEntry = useCreateJournalEntry();
  const [content, setContent] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);

  const handleSubmit = async () => {
    if (!content.trim()) {
      Alert.alert('Erreur', 'Ecrivez quelque chose');
      return;
    }
    try {
      await createEntry.mutateAsync({
        content: content.trim(),
        isPrivate,
      });
      router.back();
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder');
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: 'Nouvelle entree' }} />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
          <TextInput
            style={styles.input}
            value={content}
            onChangeText={setContent}
            placeholder="Ecrivez vos pensees, reflexions, ressentis..."
            placeholderTextColor={Colors.mutedLight}
            multiline
            textAlignVertical="top"
            autoFocus
          />

          <View style={styles.privateRow}>
            <View style={styles.privateInfo}>
              <Text style={styles.privateLabel}>🔒 Entree privee</Text>
              <Text style={styles.privateDesc}>Non visible par votre psychologue</Text>
            </View>
            <Switch
              value={isPrivate}
              onValueChange={setIsPrivate}
              trackColor={{ false: Colors.border, true: Colors.accent }}
            />
          </View>

          <Text style={styles.encryptionNote}>
            🔐 Vos donnees sont chiffrees et securisees
          </Text>

          <Button
            onPress={handleSubmit}
            loading={createEntry.isPending}
            variant="primary"
            size="lg"
            fullWidth
          >
            Sauvegarder
          </Button>
        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  input: {
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border, fontSize: 16, color: Colors.text,
    minHeight: 200, lineHeight: 24, fontFamily: 'DMSans_400Regular',
  },
  privateRow: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated, borderRadius: 14, padding: 16,
    borderWidth: 1, borderColor: Colors.border,
  },
  privateInfo: { flex: 1, gap: 2 },
  privateLabel: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  privateDesc: { fontSize: 12, color: Colors.muted },
  encryptionNote: { fontSize: 12, color: Colors.accent, textAlign: 'center' },
});
