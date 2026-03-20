/**
 * Invoice Detail + PDF sharing
 */
import React from 'react';
import { View, Text, ScrollView, StyleSheet, ActivityIndicator, Alert } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams } from 'expo-router';
import * as Sharing from 'expo-sharing';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { useInvoice, useInvoicePdf } from '@/hooks/useInvoices';

export default function InvoiceDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const { data: invoice, isLoading } = useInvoice(id ?? '');
  const { refetch: fetchPdf, isFetching: pdfLoading } = useInvoicePdf(id ?? '');

  const handleSharePdf = async () => {
    try {
      const result = await fetchPdf();
      const url = result.data?.url;
      if (url && (await Sharing.isAvailableAsync())) {
        await Sharing.shareAsync(url, { mimeType: 'application/pdf', dialogTitle: 'Partager la facture' });
      }
    } catch {
      Alert.alert('Erreur', 'Impossible de generer le PDF');
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  if (!invoice) {
    return (
      <SafeAreaView style={styles.loading}>
        <Text style={styles.notFound}>Facture introuvable</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>
        <Card elevated style={styles.headerCard}>
          <Text style={styles.invoiceNumber}>{invoice.invoiceNumber}</Text>
          <Badge
            label={invoice.status === 'paid' ? 'Payee' : invoice.status === 'sent' ? 'Envoyee' : 'Brouillon'}
            variant={invoice.status === 'paid' ? 'success' : invoice.status === 'sent' ? 'primary' : 'default'}
          />
        </Card>

        <Card style={styles.infoCard}>
          <InfoRow label="Patient" value={invoice.patient?.name ?? '-'} />
          <View style={styles.divider} />
          <InfoRow label="Montant TTC" value={`${invoice.amountTtc} €`} />
          <View style={styles.divider} />
          <InfoRow label="Date d'emission" value={new Date(invoice.issuedAt).toLocaleDateString('fr-FR')} />
        </Card>

        <Button onPress={handleSharePdf} loading={pdfLoading} variant="primary" size="lg" fullWidth accessibilityLabel="Partager le PDF">
          Partager le PDF
        </Button>
      </ScrollView>
    </SafeAreaView>
  );
}

function InfoRow({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.infoRow}>
      <Text style={styles.infoLabel}>{label}</Text>
      <Text style={styles.infoValue}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  notFound: { fontSize: 16, color: Colors.muted },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  headerCard: { alignItems: 'center', gap: 12, padding: 24 },
  invoiceNumber: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  infoCard: { gap: 0, padding: 0 },
  infoRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: 16, paddingVertical: 14,
  },
  infoLabel: { fontSize: 14, color: Colors.muted },
  infoValue: { fontSize: 14, fontFamily: 'DMSans_500Medium', color: Colors.text },
  divider: { height: 1, backgroundColor: Colors.border },
});
