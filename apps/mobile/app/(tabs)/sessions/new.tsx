import React, { useState, useCallback } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter, useLocalSearchParams } from 'expo-router';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Colors } from '@/constants/colors';
import { usePatients } from '@/hooks/usePatients';
import { useCreateAppointment, useAvailableTimeslots } from '@/hooks/useAppointments';

type Modality = 'in_person' | 'online';
type SessionType = 'individual' | 'group' | 'online';

const SESSION_TYPES: { value: SessionType; label: string; emoji: string }[] = [
  { value: 'individual', label: 'Individuelle', emoji: '👤' },
  { value: 'group', label: 'Groupe', emoji: '👥' },
  { value: 'online', label: 'En ligne', emoji: '💻' },
];

function toDateString(d: Date): string {
  return d.toISOString().split('T')[0]!;
}

export default function NewAppointmentScreen() {
  const router = useRouter();
  const { patientId: initialPatientId } = useLocalSearchParams<{ patientId?: string }>();

  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ?? '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [sessionType, setSessionType] = useState<SessionType>('individual');
  const [duration, setDuration] = useState('50');
  const [rate, setRate] = useState('');
  const [modality, setModality] = useState<Modality>('in_person');
  const [notes, setNotes] = useState('');

  const { data: patientsData } = usePatients(1, 100);
  const dateStr = toDateString(selectedDate);
  const { data: slots = [], isLoading: slotsLoading } = useAvailableTimeslots(dateStr);
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment();

  const goToStep2 = useCallback(() => {
    if (!selectedPatientId) {
      Alert.alert('Patient requis', 'Veuillez selectionner un patient.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Creneau requis', 'Veuillez selectionner un creneau horaire.');
      return;
    }
    setStep(2);
  }, [selectedPatientId, selectedSlot]);

  const handleSubmit = async () => {
    const [hours, minutes] = (selectedSlot ?? '09:00').split(':').map(Number);
    const scheduledAt = new Date(selectedDate);
    scheduledAt.setHours(hours!, minutes!, 0, 0);

    try {
      await createAppointment({
        patientId: selectedPatientId,
        scheduledAt: scheduledAt.toISOString(),
        duration: parseInt(duration, 10),
        type: sessionType,
        notes: notes.length > 0 ? notes : undefined,
        rate: rate.length > 0 ? parseFloat(rate) : undefined,
        modality,
      });
      router.replace('/(tabs)/calendar');
    } catch (err) {
      Alert.alert('Erreur', err instanceof Error ? err.message : 'Impossible de creer le rendez-vous');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: step === 1 ? 'Choisir un creneau' : 'Details du RDV',
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => step === 2 ? setStep(1) : router.back()}
              style={styles.headerButton}
            >
              <Text style={styles.headerButtonText}>{step === 2 ? '← Retour' : 'Annuler'}</Text>
            </TouchableOpacity>
          ),
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView style={styles.flex} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
          <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">

            {step === 1 && (
              <>
                {/* Patient */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Patient</Text>
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
                    {(patientsData?.data ?? []).map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.chip, selectedPatientId === p.id && styles.chipSelected]}
                        onPress={() => setSelectedPatientId(p.id)}
                        accessibilityLabel={`Selectionner ${p.name}`}
                      >
                        <Text style={[styles.chipText, selectedPatientId === p.id && styles.chipTextSelected]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </ScrollView>
                </Card>

                {/* Date */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Date</Text>
                  <TouchableOpacity
                    style={styles.dateBtn}
                    onPress={() => setShowDatePicker(true)}
                    accessibilityLabel="Choisir une date"
                  >
                    <Text style={styles.dateBtnText}>
                      {selectedDate.toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long' })}
                    </Text>
                    <Text style={styles.dateBtnIcon}>📅</Text>
                  </TouchableOpacity>
                  {showDatePicker && (
                    <DateTimePicker
                      value={selectedDate}
                      mode="date"
                      minimumDate={new Date()}
                      onChange={(e, date) => {
                        if (Platform.OS === 'android') {
                          setShowDatePicker(false);
                          if (e.type === 'set' && date) { setSelectedDate(date); setSelectedSlot(null); }
                        } else {
                          if (date) { setSelectedDate(date); setSelectedSlot(null); }
                        }
                      }}
                    />
                  )}
                </Card>

                {/* Créneaux */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Creneaux disponibles</Text>
                  {slotsLoading ? (
                    <Text style={styles.slotsEmpty}>Chargement...</Text>
                  ) : slots.length === 0 ? (
                    <Text style={styles.slotsEmpty}>
                      Aucun creneau ce jour.{'\n'}Configurez vos disponibilites dans les parametres.
                    </Text>
                  ) : (
                    <View style={styles.slotGrid}>
                      {slots.map((slot) => (
                        <TouchableOpacity
                          key={slot}
                          style={[styles.slotPill, selectedSlot === slot && styles.slotPillSelected]}
                          onPress={() => setSelectedSlot(slot)}
                          accessibilityLabel={`Creneau ${slot}`}
                        >
                          <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Card>

                <Button
                  onPress={goToStep2}
                  variant="primary"
                  size="lg"
                  fullWidth
                  disabled={!selectedSlot || !selectedPatientId}
                  accessibilityLabel="Passer a l'etape suivante"
                >
                  Suivant →
                </Button>
              </>
            )}

            {step === 2 && (
              <>
                {/* Type */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Type de seance</Text>
                  <View style={styles.typeRow}>
                    {SESSION_TYPES.map((t) => (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.typeButton, sessionType === t.value && styles.typeButtonSelected]}
                        onPress={() => setSessionType(t.value)}
                        accessibilityLabel={t.label}
                      >
                        <Text style={styles.typeEmoji}>{t.emoji}</Text>
                        <Text style={[styles.typeLabel, sessionType === t.value && styles.typeLabelSelected]}>
                          {t.label}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>

                {/* Modalité */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Lieu</Text>
                  <View style={styles.typeRow}>
                    {([['in_person', '🏢', 'Au cabinet'], ['online', '💻', 'En visio']] as const).map(([val, icon, label]) => (
                      <TouchableOpacity
                        key={val}
                        style={[styles.typeButton, modality === val && styles.typeButtonSelected, { flex: 1 }]}
                        onPress={() => setModality(val)}
                        accessibilityLabel={label}
                      >
                        <Text style={styles.typeEmoji}>{icon}</Text>
                        <Text style={[styles.typeLabel, modality === val && styles.typeLabelSelected]}>{label}</Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </Card>

                {/* Durée + tarif */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Details</Text>
                  <View style={styles.row}>
                    <View style={styles.halfWidth}>
                      <Input label="Duree (min)" value={duration} onChangeText={setDuration} keyboardType="numeric" />
                    </View>
                    <View style={styles.halfWidth}>
                      <Input label="Tarif (€)" value={rate} onChangeText={setRate} keyboardType="decimal-pad" placeholder="75" />
                    </View>
                  </View>
                </Card>

                {/* Notes */}
                <Card style={styles.card}>
                  <Text style={styles.cardTitle}>Notes (optionnel)</Text>
                  <Input
                    value={notes}
                    onChangeText={setNotes}
                    multiline
                    numberOfLines={4}
                    placeholder="Objectifs, contexte..."
                    style={styles.notesInput}
                  />
                </Card>

                <Button
                  onPress={() => void handleSubmit()}
                  variant="primary"
                  size="lg"
                  fullWidth
                  loading={isPending}
                  accessibilityLabel="Confirmer le rendez-vous"
                >
                  Confirmer le rendez-vous
                </Button>
              </>
            )}
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  flex: { flex: 1 },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  headerButton: { paddingHorizontal: 12, paddingVertical: 8, minHeight: 44, justifyContent: 'center' },
  headerButtonText: { fontSize: 15, color: Colors.muted },
  card: { gap: 14 },
  cardTitle: { fontSize: 15, fontWeight: '700', color: Colors.text },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 99,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
    minHeight: 36, justifyContent: 'center',
  },
  chipSelected: { backgroundColor: `${Colors.primary}1A`, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontWeight: '500', color: Colors.muted },
  chipTextSelected: { color: Colors.primary },
  dateBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: 14, borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1, borderColor: Colors.border,
  },
  dateBtnText: { fontSize: 15, color: Colors.text, fontFamily: 'DMSans_500Medium', textTransform: 'capitalize' },
  dateBtnIcon: { fontSize: 18 },
  slotGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  slotPill: {
    paddingHorizontal: 16, paddingVertical: 10, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border,
  },
  slotPillSelected: { backgroundColor: `${Colors.primary}1A`, borderColor: Colors.primary },
  slotText: { fontSize: 14, fontWeight: '600', color: Colors.muted },
  slotTextSelected: { color: Colors.primary },
  slotsEmpty: { fontSize: 14, color: Colors.muted, lineHeight: 20 },
  typeRow: { flexDirection: 'row', gap: 10 },
  typeButton: {
    flex: 1, alignItems: 'center', paddingVertical: 14, borderRadius: 12,
    backgroundColor: Colors.surface, borderWidth: 1.5, borderColor: Colors.border, gap: 6,
  },
  typeButtonSelected: { backgroundColor: `${Colors.primary}1A`, borderColor: Colors.primary },
  typeEmoji: { fontSize: 22 },
  typeLabel: { fontSize: 12, fontWeight: '600', color: Colors.muted },
  typeLabelSelected: { color: Colors.primary },
  row: { flexDirection: 'row', gap: 12 },
  halfWidth: { flex: 1 },
  notesInput: { minHeight: 100 },
});
