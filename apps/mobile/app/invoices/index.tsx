/**
 * Invoices List — filter by status (draft/sent/paid)
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Badge } from '@/components/ui/Badge';
import { useInvoices } from '@/hooks/useInvoices';

type FilterKey = '' | 'draft' | 'sent' | 'paid';
const FILTERS: { key: FilterKey; label: string }[] = [
  { key: '', label: 'Toutes' },
  { key: 'draft', label: 'Brouillon' },
  { key: 'sent', label: 'Envoyee' },
  { key: 'paid', label: 'Payee' },
];

const STATUS_VARIANT: Record<string, 'default' | 'warning' | 'primary' | 'success'> = {
  draft: 'default',
  sent: 'primary',
  paid: 'success',
};

export default function InvoicesScreen() {
  const router = useRouter();
  const [filter, setFilter] = useState<FilterKey>('');
  const { data: invoices, isLoading, refetch, isRefetching } = useInvoices(filter || undefined);

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      {/* Filters */}
      <View style={styles.filterRow}>
        {FILTERS.map((f) => (
          <TouchableOpacity
            key={f.key}
            style={[styles.chip, filter === f.key && styles.chipActive]}
            onPress={() => setFilter(f.key)}
          >
            <Text style={[styles.chipText, filter === f.key && styles.chipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {isLoading ? (
        <View style={styles.loading}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      ) : (
        <FlatList
          data={invoices ?? []}
          keyExtractor={(item) => item.id}
          refreshControl={
            <RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} tintColor={Colors.primary} />
          }
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.invoiceItem}
              onPress={() => router.push(`/invoices/${item.id}`)}
            >
              <View style={styles.invoiceInfo}>
                <Text style={styles.invoiceNumber}>{item.invoiceNumber}</Text>
                <Text style={styles.invoicePatient}>{item.patient?.name ?? '-'}</Text>
                <Text style={styles.invoiceDate}>
                  {new Date(item.issuedAt).toLocaleDateString('fr-FR')}
                </Text>
              </View>
              <View style={styles.invoiceRight}>
                <Text style={styles.invoiceAmount}>{item.amountTtc} €</Text>
                <Badge label={item.status} variant={STATUS_VARIANT[item.status] ?? 'default'} />
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.empty}>
              <Text style={styles.emptyIcon}>🧾</Text>
              <Text style={styles.emptyTitle}>Aucune facture</Text>
            </View>
          }
          contentContainerStyle={styles.list}
        />
      )}

      {/* FAB new invoice */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/invoices/new')}
        accessibilityLabel="Nouvelle facture"
      >
        <Text style={styles.fabIcon}>+</Text>
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  filterRow: {
    flexDirection: 'row', paddingHorizontal: 16, paddingVertical: 12, gap: 8,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  chip: {
    paddingHorizontal: 14, paddingVertical: 8, borderRadius: 20,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  chipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  chipText: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text },
  chipTextActive: { color: Colors.white },
  list: { paddingBottom: 100 },
  invoiceItem: {
    flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  invoiceInfo: { flex: 1, gap: 2 },
  invoiceNumber: { fontSize: 15, fontFamily: 'DMSans_700Bold', color: Colors.text },
  invoicePatient: { fontSize: 13, color: Colors.muted },
  invoiceDate: { fontSize: 12, color: Colors.mutedLight },
  invoiceRight: { alignItems: 'flex-end', gap: 6 },
  invoiceAmount: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text },
  empty: { alignItems: 'center', paddingVertical: 80, gap: 8 },
  emptyIcon: { fontSize: 48 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_500Medium', color: Colors.muted },
  fab: {
    position: 'absolute', bottom: 24, right: 20, width: 56, height: 56,
    borderRadius: 28, backgroundColor: Colors.primary,
    alignItems: 'center', justifyContent: 'center',
    shadowColor: Colors.primary, shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3, shadowRadius: 8, elevation: 6,
  },
  fabIcon: { fontSize: 28, color: '#FFF', fontWeight: '300', lineHeight: 32 },
});
