/**
 * New Invoice — Creation form
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  TouchableOpacity,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Colors } from '@/constants/colors';
import { Input } from '@/components/ui/Input';
import { Button } from '@/components/ui/Button';
import { useCreateInvoice } from '@/hooks/useInvoices';
import { usePatients } from '@/hooks/usePatients';

const schema = z.object({
  patientId: z.string().min(1, 'Patient requis'),
  amountTtc: z.number().min(0.01, 'Montant requis'),
});

type FormData = z.infer<typeof schema>;

export default function NewInvoiceScreen() {
  const router = useRouter();
  const createInvoice = useCreateInvoice();
  const { data: patientsData, isLoading: loadingPatients } = usePatients(1, 100);
  const patients = patientsData?.data ?? [];

  const {
    control,
    handleSubmit,
    watch,
    setValue,
    formState: { errors },
  } = useForm<FormData>({
    resolver: zodResolver(schema),
    defaultValues: { patientId: '', amountTtc: 0 },
  });

  const selectedPatientId = watch('patientId');

  const onSubmit = async (data: FormData) => {
    try {
      const invoice = await createInvoice.mutateAsync(data);
      router.replace(`/invoices/${invoice.id}`);
    } catch {
      Alert.alert('Erreur', 'Impossible de creer la facture');
    }
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
          <View style={styles.field}>
            <Text style={styles.label}>Patient</Text>
            {loadingPatients ? (
              <ActivityIndicator color={Colors.primary} />
            ) : (
              <Controller
                control={control}
                name="patientId"
                render={({ field: { onChange } }) => (
                  <View style={styles.chipRow}>
                    {patients.map((p) => (
                      <TouchableOpacity
                        key={p.id}
                        style={[styles.chip, selectedPatientId === p.id && styles.chipActive]}
                        onPress={() => onChange(p.id)}
                      >
                        <Text style={[styles.chipText, selectedPatientId === p.id && styles.chipTextActive]}>
                          {p.name}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                )}
              />
            )}
            {errors.patientId && <Text style={styles.error}>{errors.patientId.message}</Text>}
          </View>

          <Controller
            control={control}
            name="amountTtc"
            render={({ field: { onChange, value } }) => (
              <Input
                label="Montant TTC (€)"
                value={value ? String(value) : ''}
                onChangeText={(t) => onChange(t ? Number(t) : 0)}
                keyboardType="numeric"
                placeholder="ex: 70"
                error={errors.amountTtc?.message}
              />
            )}
          />

          <Button
            onPress={handleSubmit(onSubmit)}
            loading={createInvoice.isPending}
            variant="primary"
            size="lg"
            fullWidth
          >
            Creer la facture
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  field: { gap: 8 },
  label: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  chipRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  chipTextActive: { color: Colors.white },
  error: { fontSize: 12, color: Colors.error },
});
