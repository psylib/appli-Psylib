/**
 * Accounting Dashboard — KPIs, top categories, month summary
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { useAccountingDashboard } from '@/hooks/useAccounting';

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function AccountingDashboardScreen() {
  const router = useRouter();
  const { data, isLoading, refetch, isRefetching } = useAccountingDashboard();

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const d = data;

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={() => void refetch()} />}
      >
        <Text style={styles.title}>Comptabilite</Text>
        <Text style={styles.subtitle}>Annee {new Date().getFullYear()}</Text>

        {/* KPI Cards */}
        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Chiffre d'affaires</Text>
            <Text style={[styles.kpiValue, { color: Colors.success }]}>
              {formatEur(d?.currentYear.revenue ?? 0)}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Depenses</Text>
            <Text style={[styles.kpiValue, { color: Colors.error }]}>
              {formatEur(d?.currentYear.expenses ?? 0)}
            </Text>
          </Card>
        </View>

        <View style={styles.kpiRow}>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Resultat net</Text>
            <Text style={[styles.kpiValue, { color: Colors.primary }]}>
              {formatEur(d?.currentYear.netIncome ?? 0)}
            </Text>
          </Card>
          <Card style={styles.kpiCard}>
            <Text style={styles.kpiLabel}>Factures en attente</Text>
            <Text style={[styles.kpiValue, { color: Colors.warning }]}>
              {d?.pendingInvoices ?? 0}
            </Text>
            <Text style={styles.kpiSub}>{formatEur(d?.pendingInvoicesAmount ?? 0)}</Text>
          </Card>
        </View>

        {/* Current month */}
        <Card elevated style={styles.monthCard}>
          <Text style={styles.sectionTitle}>Ce mois</Text>
          <View style={styles.monthRow}>
            <View style={styles.monthItem}>
              <Text style={styles.monthLabel}>CA</Text>
              <Text style={[styles.monthValue, { color: Colors.success }]}>
                {formatEur(d?.currentMonth.revenue ?? 0)}
              </Text>
            </View>
            <View style={styles.monthDivider} />
            <View style={styles.monthItem}>
              <Text style={styles.monthLabel}>Depenses</Text>
              <Text style={[styles.monthValue, { color: Colors.error }]}>
                {formatEur(d?.currentMonth.expenses ?? 0)}
              </Text>
            </View>
            <View style={styles.monthDivider} />
            <View style={styles.monthItem}>
              <Text style={styles.monthLabel}>Net</Text>
              <Text style={[styles.monthValue, { color: Colors.primary }]}>
                {formatEur(d?.currentMonth.netIncome ?? 0)}
              </Text>
            </View>
          </View>
        </Card>

        {/* Top expense categories */}
        {(d?.topExpenseCategories?.length ?? 0) > 0 && (
          <Card elevated style={styles.categoriesCard}>
            <Text style={styles.sectionTitle}>Top depenses</Text>
            {d!.topExpenseCategories.slice(0, 5).map((cat) => (
              <View key={cat.category} style={styles.catRow}>
                <View style={styles.catInfo}>
                  <Text style={styles.catName}>{cat.category}</Text>
                  <Text style={styles.catPercent}>{cat.percentage.toFixed(0)}%</Text>
                </View>
                <View style={styles.catBarBg}>
                  <View style={[styles.catBarFill, { width: `${Math.min(cat.percentage, 100)}%` }]} />
                </View>
                <Text style={styles.catAmount}>{formatEur(cat.amount)}</Text>
              </View>
            ))}
          </Card>
        )}

        {/* Navigation buttons */}
        <View style={styles.navRow}>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push('/accounting/expenses' as any)}
          >
            <Text style={styles.navBtnIcon}>💰</Text>
            <Text style={styles.navBtnLabel}>Depenses</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.navBtn}
            onPress={() => router.push('/accounting/reports' as any)}
          >
            <Text style={styles.navBtnIcon}>📊</Text>
            <Text style={styles.navBtnLabel}>Rapports</Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  title: { fontSize: 28, fontFamily: 'DMSans_700Bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.muted, marginTop: -8 },

  // KPIs
  kpiRow: { flexDirection: 'row', gap: 12 },
  kpiCard: { flex: 1, padding: 16, gap: 4 },
  kpiLabel: { fontSize: 12, fontFamily: 'DMSans_500Medium', color: Colors.muted },
  kpiValue: { fontSize: 22, fontFamily: 'DMSans_700Bold' },
  kpiSub: { fontSize: 11, color: Colors.muted },

  // Current month
  monthCard: { padding: 20 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text, marginBottom: 12 },
  monthRow: { flexDirection: 'row', alignItems: 'center' },
  monthItem: { flex: 1, alignItems: 'center', gap: 4 },
  monthLabel: { fontSize: 12, color: Colors.muted },
  monthValue: { fontSize: 16, fontFamily: 'DMSans_700Bold' },
  monthDivider: { width: 1, height: 32, backgroundColor: Colors.border },

  // Categories
  categoriesCard: { padding: 20, gap: 12 },
  catRow: { gap: 4 },
  catInfo: { flexDirection: 'row', justifyContent: 'space-between' },
  catName: { fontSize: 13, fontFamily: 'DMSans_500Medium', color: Colors.text, textTransform: 'capitalize' },
  catPercent: { fontSize: 12, color: Colors.muted },
  catBarBg: { height: 6, backgroundColor: Colors.surface, borderRadius: 3 },
  catBarFill: { height: 6, backgroundColor: Colors.primary, borderRadius: 3 },
  catAmount: { fontSize: 12, color: Colors.muted, textAlign: 'right' },

  // Nav buttons
  navRow: { flexDirection: 'row', gap: 12 },
  navBtn: {
    flex: 1, backgroundColor: Colors.surfaceElevated, borderRadius: 14,
    borderWidth: 1, borderColor: Colors.border, padding: 20,
    alignItems: 'center', gap: 8,
  },
  navBtnIcon: { fontSize: 28 },
  navBtnLabel: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.text },
});
