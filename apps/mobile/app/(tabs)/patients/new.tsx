/**
 * New Patient — Creation form with react-hook-form + Zod
 */
import React from 'react';
import {
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack, useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreatePatient } from '@/hooks/usePatients';

const schema = z.object({
  name: z.string().min(2, 'Nom requis (min 2 caracteres)'),
  email: z.string().email('Email invalide').or(z.literal('')).optional(),
  phone: z.string().optional(),
  notes: z.string().optional(),
});

type FormData = z.infer<typeof schema>;

export default function NewPatientScreen() {
  const router = useRouter();
  const createPatient = useCreatePatient();

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { name: '', email: '', phone: '', notes: '' },
  });

  const onSubmit = async (data: FormData) => {
    try {
      const patient = await createPatient.mutateAsync({
        name: data.name,
        email: data.email || undefined,
        phone: data.phone || undefined,
        notes: data.notes || undefined,
      });
      router.replace(`/(tabs)/patients/${patient.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de creer le patient');
    }
  };

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Nouveau patient',
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontFamily: 'DMSans_700Bold', color: Colors.text },
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView
            style={styles.scroll}
            contentContainerStyle={styles.content}
            keyboardShouldPersistTaps="handled"
          >
            <Controller
              control={control}
              name="name"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Nom complet *"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Prenom Nom"
                  error={errors.name?.message}
                  autoCapitalize="words"
                />
              )}
            />

            <Controller
              control={control}
              name="email"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Email"
                  value={value}
                  onChangeText={onChange}
                  placeholder="patient@email.com"
                  error={errors.email?.message}
                  keyboardType="email-address"
                  autoCapitalize="none"
                />
              )}
            />

            <Controller
              control={control}
              name="phone"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Telephone"
                  value={value}
                  onChangeText={onChange}
                  placeholder="06 12 34 56 78"
                  keyboardType="phone-pad"
                />
              )}
            />

            <Controller
              control={control}
              name="notes"
              render={({ field: { onChange, value } }) => (
                <Input
                  label="Notes (optionnel)"
                  value={value}
                  onChangeText={onChange}
                  placeholder="Contexte, motif de consultation..."
                  multiline
                  numberOfLines={3}
                  style={styles.notesInput}
                />
              )}
            />

            <Button
              onPress={handleSubmit(onSubmit)}
              loading={createPatient.isPending}
              variant="primary"
              size="lg"
              fullWidth
              accessibilityLabel="Creer le patient"
            >
              Creer le patient
            </Button>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 40 },
  notesInput: { minHeight: 100 },
});
