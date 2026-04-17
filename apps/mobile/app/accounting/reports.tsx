/**
 * Accounting Reports — Tax prep, social charges, export
 */
import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Share,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import Constants from 'expo-constants';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useTaxPrep, useSocialCharges } from '@/hooks/useAccounting';
import { useAuth } from '@/hooks/useAuth';

const API_BASE =
  (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ??
  'https://api.psylib.eu';

function formatEur(n: number): string {
  return n.toLocaleString('fr-FR', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 });
}

export default function ReportsScreen() {
  const currentYear = new Date().getFullYear();
  const [year] = useState(currentYear);
  const { getValidToken } = useAuth();

  const { data: taxPrep, isLoading: taxLoading } = useTaxPrep(year);
  const { data: socialCharges, isLoading: chargesLoading } = useSocialCharges(year);
  const [exporting, setExporting] = useState<string | null>(null);

  const handleExport = async (type: 'csv' | 'fec') => {
    setExporting(type);
    try {
      const token = await getValidToken();
      if (!token) throw new Error('Non authentifie');

      const url =
        type === 'csv'
          ? `${API_BASE}/api/v1/accounting/export/csv?dateFrom=${year}-01-01&dateTo=${year}-12-31`
          : `${API_BASE}/api/v1/accounting/export/fec?year=${year}`;

      // Share the download URL — on mobile, we open it in browser
      await Share.share({
        message: `Export ${type.toUpperCase()} comptabilite ${year}`,
        url,
      });
    } catch {
      Alert.alert('Erreur', `Impossible d'exporter en ${type.toUpperCase()}`);
    } finally {
      setExporting(null);
    }
  };

  const isLoading = taxLoading || chargesLoading;

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Text style={styles.title}>Rapports {year}</Text>

        {/* Tax prep */}
        {taxPrep && (
          <Card elevated style={styles.card}>
            <Text style={styles.sectionTitle}>Preparation fiscale</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>Revenu total</Text>
              <Text style={styles.rowValue}>{formatEur(taxPrep.totalRevenue)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Charges deductibles</Text>
              <Text style={[styles.rowValue, { color: Colors.error }]}>
                -{formatEur(taxPrep.totalDeductibleExpenses)}
              </Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, styles.bold]}>Revenu imposable</Text>
              <Text style={[styles.rowValue, styles.bold]}>{formatEur(taxPrep.taxableIncome)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>Charges sociales estimees</Text>
              <Text style={[styles.rowValue, { color: Colors.warning }]}>
                {formatEur(taxPrep.estimatedSocialCharges)}
              </Text>
            </View>

            {/* Quarterly payments */}
            {taxPrep.quarterlyPayments.length > 0 && (
              <>
                <Text style={styles.subTitle}>Paiements trimestriels</Text>
                {taxPrep.quarterlyPayments.map((q) => (
                  <View key={q.quarter} style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>{q.quarter}</Text>
                    <Text style={styles.quarterDate}>{q.dueDate}</Text>
                    <Text style={styles.quarterAmount}>{formatEur(q.amount)}</Text>
                  </View>
                ))}
              </>
            )}
          </Card>
        )}

        {/* Social charges */}
        {socialCharges && (
          <Card elevated style={styles.card}>
            <Text style={styles.sectionTitle}>Charges sociales</Text>

            <View style={styles.row}>
              <Text style={styles.rowLabel}>CA de reference</Text>
              <Text style={styles.rowValue}>{formatEur(socialCharges.totalRevenue)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                URSSAF ({(socialCharges.urssafRate * 100).toFixed(1)}%)
              </Text>
              <Text style={styles.rowValue}>{formatEur(socialCharges.urssafAmount)}</Text>
            </View>
            <View style={styles.row}>
              <Text style={styles.rowLabel}>
                CFP ({(socialCharges.cfpRate * 100).toFixed(2)}%)
              </Text>
              <Text style={styles.rowValue}>{formatEur(socialCharges.cfpAmount)}</Text>
            </View>
            <View style={styles.divider} />
            <View style={styles.row}>
              <Text style={[styles.rowLabel, styles.bold]}>Total charges</Text>
              <Text style={[styles.rowValue, styles.bold, { color: Colors.error }]}>
                {formatEur(socialCharges.totalCharges)}
              </Text>
            </View>

            {/* Quarterly breakdown */}
            {socialCharges.quarterlyBreakdown.length > 0 && (
              <>
                <Text style={styles.subTitle}>Par trimestre</Text>
                {socialCharges.quarterlyBreakdown.map((q) => (
                  <View key={q.quarter} style={styles.quarterRow}>
                    <Text style={styles.quarterLabel}>{q.quarter}</Text>
                    <Text style={styles.quarterDate}>CA: {formatEur(q.revenue)}</Text>
                    <Text style={styles.quarterAmount}>{formatEur(q.charges)}</Text>
                  </View>
                ))}
              </>
            )}
          </Card>
        )}

        {/* Export buttons */}
        <Card elevated style={styles.card}>
          <Text style={styles.sectionTitle}>Exports</Text>
          <Text style={styles.exportDesc}>
            Telechargez vos ecritures comptables pour votre comptable ou les impots.
          </Text>
          <View style={styles.exportRow}>
            <Button
              variant="outline"
              onPress={() => void handleExport('csv')}
              loading={exporting === 'csv'}
              style={{ flex: 1 }}
              accessibilityLabel="Exporter en CSV"
            >
              Export CSV
            </Button>
            <Button
              variant="outline"
              onPress={() => void handleExport('fec')}
              loading={exporting === 'fec'}
              style={{ flex: 1 }}
              accessibilityLabel="Exporter en FEC"
            >
              Export FEC
            </Button>
          </View>
        </Card>
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 16, paddingBottom: 100 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  title: { fontSize: 24, fontFamily: 'DMSans_700Bold', color: Colors.text },

  card: { padding: 20, gap: 10 },
  sectionTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text, marginBottom: 4 },
  subTitle: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.text, marginTop: 8 },

  row: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  rowLabel: { fontSize: 14, color: Colors.text },
  rowValue: { fontSize: 14, fontFamily: 'DMSans_600SemiBold', color: Colors.text },
  bold: { fontFamily: 'DMSans_700Bold', fontSize: 15 },
  divider: { height: 1, backgroundColor: Colors.border, marginVertical: 4 },

  quarterRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: 6, paddingLeft: 8,
  },
  quarterLabel: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.primary, width: 32 },
  quarterDate: { fontSize: 12, color: Colors.muted, flex: 1 },
  quarterAmount: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.text },

  exportDesc: { fontSize: 13, color: Colors.muted, lineHeight: 18 },
  exportRow: { flexDirection: 'row', gap: 12, marginTop: 4 },
});
