/**
 * NoteEditor — Éditeur de notes de séance mobile
 *
 * Fonctionnalités :
 * - Autosave toutes les 30 secondes (setInterval)
 * - MoodSelector 5 niveaux (TouchableOpacity avec emoji)
 * - Indicateur de statut sauvegarde
 * - Même comportement que apps/web/src/components/sessions/session-note-editor.tsx
 */

import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from 'react-native';
import { Colors } from '@/constants/colors';
import { useAutosaveNotes } from '@/hooks/useSessions';

// ---------------------------------------------------------------------------
// Types & constantes
// ---------------------------------------------------------------------------

type SaveStatus = 'idle' | 'saving' | 'saved' | 'error';

interface MoodOption {
  value: number;
  label: string;
  emoji: string;
  color: string;
  bgColor: string;
}

const MOOD_OPTIONS: MoodOption[] = [
  { value: 1, label: 'Très difficile', emoji: '😰', color: Colors.mood1, bgColor: '#FEE2E2' },
  { value: 2, label: 'Difficile', emoji: '😟', color: Colors.mood2, bgColor: '#FFEDD5' },
  { value: 3, label: 'Neutre', emoji: '😐', color: Colors.mood3, bgColor: '#FEF3C7' },
  { value: 4, label: 'Bien', emoji: '🙂', color: Colors.mood4, bgColor: '#ECFCCB' },
  { value: 5, label: 'Très bien', emoji: '😊', color: Colors.mood5, bgColor: '#D1FAE5' },
] as const;

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

interface NoteEditorProps {
  sessionId: string;
  initialNotes?: string | null;
  initialMood?: number | null;
  onNotesChange?: (notes: string) => void;
  readOnly?: boolean;
}

// ---------------------------------------------------------------------------
// Composant
// ---------------------------------------------------------------------------

export function NoteEditor({
  sessionId,
  initialNotes = '',
  initialMood = null,
  onNotesChange,
  readOnly = false,
}: NoteEditorProps) {
  const [notes, setNotes] = useState(initialNotes ?? '');
  const [selectedMood, setSelectedMood] = useState<number | null>(initialMood ?? null);
  const [saveStatus, setSaveStatus] = useState<SaveStatus>('idle');
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [isDirty, setIsDirty] = useState(false);

  // Ref pour accéder aux valeurs courantes sans re-créer le callback
  const notesRef = useRef(notes);
  const moodRef = useRef(selectedMood);
  const autosaveRef = useRef<ReturnType<typeof setInterval> | null>(null);

  notesRef.current = notes;
  moodRef.current = selectedMood;

  const { mutateAsync: autosaveMutation } = useAutosaveNotes(sessionId);

  // ---------------------------------------------------------------------------
  // Sauvegarde
  // ---------------------------------------------------------------------------

  const save = useCallback(
    async (silent = false): Promise<void> => {
      if (!isDirty && silent) return;

      setSaveStatus('saving');
      try {
        await autosaveMutation({
          notes: notesRef.current,
          mood: moodRef.current,
        });
        setSaveStatus('saved');
        setLastSaved(new Date());
        setIsDirty(false);
        // Retour à idle après 2s
        setTimeout(() => setSaveStatus((prev) => (prev === 'saved' ? 'idle' : prev)), 2000);
      } catch {
        setSaveStatus('error');
      }
    },
    // isDirty est la seule dépendance qui change fréquemment
    // autosaveMutation est stable via React Query
    [isDirty, autosaveMutation],
  );

  // ---------------------------------------------------------------------------
  // Autosave 30s — setInterval (pattern exact demandé)
  // ---------------------------------------------------------------------------

  useEffect(() => {
    if (readOnly || !isDirty) return;
    autosaveRef.current = setInterval(() => void save(true), 30000);
    return () => {
      if (autosaveRef.current) clearInterval(autosaveRef.current);
    };
  }, [isDirty, readOnly, save]);

  // ---------------------------------------------------------------------------
  // Handlers
  // ---------------------------------------------------------------------------

  const handleNotesChange = (text: string) => {
    setNotes(text);
    setIsDirty(true);
    onNotesChange?.(text);
  };

  const handleMoodSelect = (value: number) => {
    setSelectedMood((prev) => (prev === value ? null : value));
    setIsDirty(true);
  };

  // ---------------------------------------------------------------------------
  // Render
  // ---------------------------------------------------------------------------

  const wordCount = notes.trim().length > 0
    ? notes.trim().split(/\s+/).filter(Boolean).length
    : 0;

  return (
    <View style={styles.container}>
      {/* ------------------------------------------------------------------ */}
      {/* Sélecteur d'humeur */}
      {/* ------------------------------------------------------------------ */}
      {!readOnly && (
        <View style={styles.moodSection}>
          <Text style={styles.moodLabel}>Humeur du patient (optionnel)</Text>
          <View
            style={styles.moodRow}
            accessibilityLabel="Sélecteur d'humeur du patient"
            accessibilityRole="radiogroup"
          >
            {MOOD_OPTIONS.map((mood) => {
              const isSelected = selectedMood === mood.value;
              return (
                <TouchableOpacity
                  key={mood.value}
                  onPress={() => handleMoodSelect(mood.value)}
                  style={[
                    styles.moodButton,
                    isSelected && { backgroundColor: mood.bgColor, borderColor: mood.color },
                  ]}
                  accessibilityLabel={mood.label}
                  accessibilityRole="radio"
                  accessibilityState={{ checked: isSelected }}
                  activeOpacity={0.7}
                >
                  <Text style={styles.moodEmoji} accessibilityElementsHidden>
                    {mood.emoji}
                  </Text>
                  <Text
                    style={[styles.moodText, isSelected && { color: mood.color }]}
                    numberOfLines={1}
                  >
                    {mood.label.split(' ').pop()}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>
        </View>
      )}

      {/* Mood affiché en lecture seule */}
      {readOnly && selectedMood != null && (
        <View style={styles.readOnlyMood}>
          <Text style={styles.readOnlyMoodLabel}>Humeur :</Text>
          <Text style={styles.readOnlyMoodValue}>
            {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.emoji}{' '}
            {MOOD_OPTIONS.find((m) => m.value === selectedMood)?.label}
          </Text>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Barre de statut sauvegarde */}
      {/* ------------------------------------------------------------------ */}
      {!readOnly && (
        <View style={styles.statusBar}>
          <View style={styles.saveStatus}>
            {saveStatus === 'saving' && (
              <>
                <ActivityIndicator size="small" color={Colors.muted} style={styles.statusIcon} />
                <Text style={styles.statusTextMuted}>Sauvegarde...</Text>
              </>
            )}
            {saveStatus === 'saved' && (
              <Text style={styles.statusTextSuccess} accessibilityLiveRegion="polite">
                ✓ Sauvegardé
              </Text>
            )}
            {saveStatus === 'error' && (
              <>
                <Text style={styles.statusTextError} accessibilityLiveRegion="assertive">
                  ⚠ Erreur
                </Text>
                <TouchableOpacity
                  onPress={() => void save(false)}
                  accessibilityLabel="Réessayer la sauvegarde"
                  style={styles.retryButton}
                >
                  <Text style={styles.retryText}>Réessayer</Text>
                </TouchableOpacity>
              </>
            )}
            {saveStatus === 'idle' && lastSaved != null && (
              <Text style={styles.statusTextMuted}>
                Sauvegardé à{' '}
                {lastSaved.toLocaleTimeString('fr-FR', {
                  hour: '2-digit',
                  minute: '2-digit',
                })}
              </Text>
            )}
          </View>

          <TouchableOpacity
            onPress={() => void save(false)}
            disabled={saveStatus === 'saving' || !isDirty}
            accessibilityLabel="Sauvegarder les notes"
            accessibilityRole="button"
            accessibilityState={{ disabled: saveStatus === 'saving' || !isDirty }}
            style={[
              styles.saveButton,
              (saveStatus === 'saving' || !isDirty) && styles.saveButtonDisabled,
            ]}
            activeOpacity={0.7}
          >
            <Text style={styles.saveButtonText}>Sauvegarder</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Zone de texte */}
      {/* ------------------------------------------------------------------ */}
      <View style={styles.editorContainer}>
        <TextInput
          style={[styles.editor, readOnly && styles.editorReadOnly]}
          value={notes}
          onChangeText={readOnly ? undefined : handleNotesChange}
          multiline
          editable={!readOnly}
          placeholder={
            readOnly
              ? 'Aucune note'
              : 'Rédigez vos notes cliniques ici...\n\nConseil : les notes sont autosauvegardées toutes les 30 secondes.'
          }
          placeholderTextColor={Colors.mutedLight}
          textAlignVertical="top"
          accessibilityLabel="Notes de séance"
          accessibilityHint={readOnly ? undefined : 'Autosauvegarde toutes les 30 secondes'}
          accessibilityMultiline
        />
      </View>

      {/* ------------------------------------------------------------------ */}
      {/* Méta (compteur de mots + hint chiffrement) */}
      {/* ------------------------------------------------------------------ */}
      {!readOnly && (
        <View style={styles.footer}>
          <Text style={styles.wordCount} accessibilityLiveRegion="off">
            {wordCount > 0 ? `${wordCount} mot${wordCount > 1 ? 's' : ''}` : 'Commencez à rédiger...'}
          </Text>
          <Text style={styles.encryptionHint}>
            Chiffré AES-256-GCM (HDS)
          </Text>
        </View>
      )}

      {/* ------------------------------------------------------------------ */}
      {/* Bannière IA — opt-in uniquement (>50 caractères) */}
      {/* ------------------------------------------------------------------ */}
      {!readOnly && notes.length > 50 && (
        <View style={styles.aiBanner}>
          <View style={styles.aiBannerContent}>
            <Text style={styles.aiBannerTitle}>Assistant IA disponible</Text>
            <Text style={styles.aiBannerSubtitle}>
              Générer un résumé structuré à partir de vos notes
            </Text>
          </View>
          <TouchableOpacity
            style={styles.aiButton}
            accessibilityLabel="Générer un résumé IA de la séance"
            accessibilityRole="button"
            activeOpacity={0.75}
          >
            <Text style={styles.aiButtonText}>Résumer</Text>
          </TouchableOpacity>
        </View>
      )}
    </View>
  );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
  container: {
    gap: 12,
  },
  // Mood selector
  moodSection: {
    gap: 8,
  },
  moodLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: Colors.muted,
  },
  moodRow: {
    flexDirection: 'row',
    gap: 6,
  },
  moodButton: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
    gap: 4,
    minHeight: 60,
    justifyContent: 'center',
  },
  moodEmoji: {
    fontSize: 18,
  },
  moodText: {
    fontSize: 10,
    fontWeight: '500',
    color: Colors.muted,
    textAlign: 'center',
  },
  // Read-only mood
  readOnlyMood: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    padding: 12,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  readOnlyMoodLabel: {
    fontSize: 13,
    color: Colors.muted,
    fontWeight: '500',
  },
  readOnlyMoodValue: {
    fontSize: 14,
    color: Colors.text,
    fontWeight: '500',
  },
  // Status bar
  statusBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    minHeight: 36,
  },
  saveStatus: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statusIcon: {
    width: 16,
    height: 16,
  },
  statusTextMuted: {
    fontSize: 12,
    color: Colors.muted,
  },
  statusTextSuccess: {
    fontSize: 12,
    color: Colors.success,
    fontWeight: '500',
  },
  statusTextError: {
    fontSize: 12,
    color: Colors.error,
    fontWeight: '500',
  },
  retryButton: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    minHeight: 28,
    justifyContent: 'center',
  },
  retryText: {
    fontSize: 12,
    color: Colors.primary,
    fontWeight: '500',
  },
  saveButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border,
    minHeight: 36,
    justifyContent: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.4,
  },
  saveButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.text,
  },
  // Editor
  editorContainer: {
    borderRadius: 12,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surfaceElevated,
    overflow: 'hidden',
  },
  editor: {
    minHeight: 240,
    padding: 14,
    fontSize: 15,
    color: Colors.text,
    lineHeight: 24,
  },
  editorReadOnly: {
    backgroundColor: Colors.surface,
    color: Colors.textSecondary,
  },
  // Footer
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 2,
  },
  wordCount: {
    fontSize: 12,
    color: Colors.muted,
  },
  encryptionHint: {
    fontSize: 11,
    color: Colors.mutedLight,
  },
  // AI Banner
  aiBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: `${Colors.accent}0D`,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: `${Colors.accent}4D`,
    gap: 12,
  },
  aiBannerContent: {
    flex: 1,
    gap: 2,
  },
  aiBannerTitle: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.text,
  },
  aiBannerSubtitle: {
    fontSize: 12,
    color: Colors.muted,
  },
  aiButton: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    backgroundColor: Colors.accent,
    borderRadius: 8,
    minHeight: 36,
    justifyContent: 'center',
    flexShrink: 0,
  },
  aiButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: Colors.white,
  },
});
