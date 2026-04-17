/**
 * Expenses Screen — List + add expense modal
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  FlatList,
  TouchableOpacity,
  TextInput,
  Modal,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { useExpenses, useCreateExpense, useDeleteExpense } from '@/hooks/useAccounting';
import type { CreateExpenseDto, ExpenseRecord } from '@/hooks/useAccounting';

const CATEGORIES = [
  'Tous',
  'loyer',
  'assurance',
  'fournitures',
  'logiciel',
  'formation',
  'transport',
  'telephone',
  'comptabilite',
  'autre',
] as const;

const PAYMENT_METHODS = ['carte', 'virement', 'especes', 'cheque', 'prelevement'] as const;

function formatDate(iso: string): string {
  const d = new Date(iso);
  return d.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' });
}

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 2 });
}

export default function ExpensesScreen() {
  const [selectedCat, setSelectedCat] = useState('Tous');
  const [showModal, setShowModal] = useState(false);

  const filterCat = selectedCat === 'Tous' ? undefined : selectedCat;
  const { data: expenses, isLoading, refetch } = useExpenses(filterCat);
  const createExpense = useCreateExpense();
  const deleteExpense = useDeleteExpense();

  // Form state
  const [form, setForm] = useState<CreateExpenseDto>({
    date: new Date().toISOString().split('T')[0]!,
    label: '',
    amount: 0,
    category: 'autre',
    paymentMethod: 'carte',
    isDeductible: true,
  });

  const handleCreate = async () => {
    if (!form.label.trim() || form.amount <= 0) {
      Alert.alert('Erreur', 'Remplissez le libelle et le montant');
      return;
    }
    try {
      await createExpense.mutateAsync(form);
      setShowModal(false);
      setForm({
        date: new Date().toISOString().split('T')[0]!,
        label: '',
        amount: 0,
        category: 'autre',
        paymentMethod: 'carte',
        isDeductible: true,
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de creer la depense');
    }
  };

  const handleDelete = (expense: ExpenseRecord) => {
    Alert.alert('Supprimer', `Supprimer "${expense.label}" ?`, [
      { text: 'Annuler', style: 'cancel' },
      {
        text: 'Supprimer',
        style: 'destructive',
        onPress: () => void deleteExpense.mutateAsync(expense.id),
      },
    ]);
  };

  const renderExpense = ({ item }: { item: ExpenseRecord }) => (
    <TouchableOpacity
      style={styles.expenseItem}
      onLongPress={() => handleDelete(item)}
      accessibilityLabel={`${item.label} ${formatEur(item.amount)}`}
    >
      <View style={styles.expenseLeft}>
        <Text style={styles.expenseDate}>{formatDate(item.date)}</Text>
        <View style={styles.expenseInfo}>
          <Text style={styles.expenseLabel} numberOfLines={1}>{item.label}</Text>
          <View style={styles.expenseMeta}>
            <View style={[styles.catBadge, { backgroundColor: `${Colors.primary}15` }]}>
              <Text style={styles.catBadgeText}>{item.category}</Text>
            </View>
            {item.isDeductible && (
              <Text style={styles.deductibleTag}>Deductible</Text>
            )}
          </View>
        </View>
      </View>
      <Text style={styles.expenseAmount}>{formatEur(item.amount)}</Text>
    </TouchableOpacity>
  );

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Category filter chips */}
      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        style={styles.filterScroll}
        contentContainerStyle={styles.filterContent}
      >
        {CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat}
            style={[styles.chip, selectedCat === cat && styles.chipActive]}
            onPress={() => setSelectedCat(cat)}
          >
            <Text style={[styles.chipText, selectedCat === cat && styles.chipTextActive]}>
              {cat === 'Tous' ? 'Tous' : cat.charAt(0).toUpperCase() + cat.slice(1)}
            </Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Expenses list */}
      <FlatList
        data={expenses ?? []}
        keyExtractor={(item) => item.id}
        renderItem={renderExpense}
        contentContainerStyle={styles.listContent}
        refreshing={isLoading}
        onRefresh={() => void refetch()}
        ListEmptyComponent={
          <View style={styles.empty}>
            <Text style={styles.emptyIcon}>💰</Text>
            <Text style={styles.emptyText}>Aucune depense</Text>
            <Text style={styles.emptyDesc}>Appuyez sur + pour ajouter votre premiere depense</Text>
          </View>
        }
      />

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => setShowModal(true)}
        accessibilityLabel="Ajouter une depense"
        accessibilityRole="button"
      >
        <Text style={styles.fabText}>+</Text>
      </TouchableOpacity>

      {/* Add expense modal */}
      <Modal visible={showModal} animationType="slide" transparent>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.modalOverlay}
        >
          <View style={styles.modalContent}>
            <View style={styles.modalHandle} />
            <Text style={styles.modalTitle}>Nouvelle depense</Text>

            <ScrollView style={styles.modalScroll} contentContainerStyle={styles.modalScrollContent}>
              {/* Label */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Libelle *</Text>
                <TextInput
                  style={styles.input}
                  value={form.label}
                  onChangeText={(v) => setForm((p) => ({ ...p, label: v }))}
                  placeholder="ex: Loyer cabinet janvier"
                  placeholderTextColor={Colors.mutedLight}
                />
              </View>

              {/* Amount */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Montant TTC *</Text>
                <TextInput
                  style={styles.input}
                  value={form.amount > 0 ? String(form.amount) : ''}
                  onChangeText={(v) => setForm((p) => ({ ...p, amount: parseFloat(v) || 0 }))}
                  placeholder="0.00"
                  placeholderTextColor={Colors.mutedLight}
                  keyboardType="decimal-pad"
                />
              </View>

              {/* Date */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Date</Text>
                <TextInput
                  style={styles.input}
                  value={form.date}
                  onChangeText={(v) => setForm((p) => ({ ...p, date: v }))}
                  placeholder="AAAA-MM-JJ"
                  placeholderTextColor={Colors.mutedLight}
                />
              </View>

              {/* Category */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Categorie</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {CATEGORIES.filter((c) => c !== 'Tous').map((cat) => (
                      <TouchableOpacity
                        key={cat}
                        style={[styles.chip, form.category === cat && styles.chipActive]}
                        onPress={() => setForm((p) => ({ ...p, category: cat }))}
                      >
                        <Text style={[styles.chipText, form.category === cat && styles.chipTextActive]}>
                          {cat.charAt(0).toUpperCase() + cat.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Payment method */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Mode de paiement</Text>
                <ScrollView horizontal showsHorizontalScrollIndicator={false}>
                  <View style={styles.chipRow}>
                    {PAYMENT_METHODS.map((m) => (
                      <TouchableOpacity
                        key={m}
                        style={[styles.chip, form.paymentMethod === m && styles.chipActive]}
                        onPress={() => setForm((p) => ({ ...p, paymentMethod: m }))}
                      >
                        <Text style={[styles.chipText, form.paymentMethod === m && styles.chipTextActive]}>
                          {m.charAt(0).toUpperCase() + m.slice(1)}
                        </Text>
                      </TouchableOpacity>
                    ))}
                  </View>
                </ScrollView>
              </View>

              {/* Supplier */}
              <View style={styles.field}>
                <Text style={styles.fieldLabel}>Fournisseur</Text>
                <TextInput
                  style={styles.input}
                  value={form.supplier ?? ''}
                  onChangeText={(v) => setForm((p) => ({ ...p, supplier: v || undefined }))}
                  placeholder="Optionnel"
                  placeholderTextColor={Colors.mutedLight}
                />
              </View>

              {/* Deductible toggle */}
              <TouchableOpacity
                style={styles.toggleRow}
                onPress={() => setForm((p) => ({ ...p, isDeductible: !p.isDeductible }))}
              >
                <View style={[styles.toggle, form.isDeductible && styles.toggleActive]}>
                  {form.isDeductible && <Text style={styles.toggleCheck}>✓</Text>}
                </View>
                <Text style={styles.toggleLabel}>Depense deductible</Text>
              </TouchableOpacity>
            </ScrollView>

            {/* Actions */}
            <View style={styles.modalActions}>
              <Button variant="outline" onPress={() => setShowModal(false)} style={{ flex: 1 }} accessibilityLabel="Annuler">
                Annuler
              </Button>
              <Button
                variant="primary"
                onPress={handleCreate}
                loading={createExpense.isPending}
                style={{ flex: 1 }}
                accessibilityLabel="Ajouter la depense"
              >
                Ajouter
              </Button>
            </View>
          </View>
        </KeyboardAvoidingView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },

  // Filter
  filterScroll: { maxHeight: 52 },
  filterContent: { paddingHorizontal: 20, paddingVertical: 10, gap: 8, flexDirection: 'row' },
  chip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 20,
    backgroundColor: Colors.surfaceElevated, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  chipTextActive: { color: '#FFF' },
  chipRow: { flexDirection: 'row', gap: 8 },

  // List
  listContent: { padding: 20, gap: 1, paddingBottom: 100 },
  expenseItem: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    backgroundColor: Colors.surfaceElevated, padding: 14,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  expenseLeft: { flexDirection: 'row', alignItems: 'center', gap: 12, flex: 1 },
  expenseDate: { fontSize: 12, color: Colors.muted, width: 48 },
  expenseInfo: { flex: 1, gap: 4 },
  expenseLabel: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  expenseMeta: { flexDirection: 'row', gap: 8, alignItems: 'center' },
  catBadge: { paddingHorizontal: 8, paddingVertical: 2, borderRadius: 8 },
  catBadgeText: { fontSize: 11, color: Colors.primary, textTransform: 'capitalize' },
  deductibleTag: { fontSize: 11, color: Colors.accent },
  expenseAmount: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.error },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyText: { fontSize: 16, fontFamily: 'DMSans_600SemiBold', color: Colors.text },
  emptyDesc: { fontSize: 13, color: Colors.muted, textAlign: 'center' },

  // FAB
  fab: {
    position: 'absolute', bottom: 24, right: 24,
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: Colors.primary, alignItems: 'center', justifyContent: 'center',
    shadowColor: '#000', shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.2, shadowRadius: 8, elevation: 6,
  },
  fabText: { fontSize: 28, color: '#FFF', marginTop: -2 },

  // Modal
  modalOverlay: { flex: 1, justifyContent: 'flex-end', backgroundColor: 'rgba(0,0,0,0.4)' },
  modalContent: {
    backgroundColor: Colors.surfaceElevated, borderTopLeftRadius: 24, borderTopRightRadius: 24,
    maxHeight: '85%', paddingBottom: 34,
  },
  modalHandle: {
    width: 36, height: 4, borderRadius: 2,
    backgroundColor: Colors.border, alignSelf: 'center', marginTop: 12, marginBottom: 16,
  },
  modalTitle: {
    fontSize: 18, fontFamily: 'DMSans_700Bold', color: Colors.text,
    paddingHorizontal: 20, marginBottom: 12,
  },
  modalScroll: { maxHeight: 420 },
  modalScrollContent: { paddingHorizontal: 20, gap: 16, paddingBottom: 16 },
  field: { gap: 6 },
  fieldLabel: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  input: {
    backgroundColor: Colors.bg, borderRadius: 12, padding: 12,
    borderWidth: 1, borderColor: Colors.border, fontSize: 15, color: Colors.text,
  },
  toggleRow: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  toggle: {
    width: 24, height: 24, borderRadius: 6,
    borderWidth: 2, borderColor: Colors.border, alignItems: 'center', justifyContent: 'center',
  },
  toggleActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  toggleCheck: { color: '#FFF', fontSize: 14, fontWeight: '700' },
  toggleLabel: { fontSize: 14, color: Colors.text },
  modalActions: { flexDirection: 'row', gap: 12, paddingHorizontal: 20, paddingTop: 16 },
});
