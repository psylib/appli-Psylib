/**
 * Analytics Screen — Revenue chart, patient growth, mood trends
 */
import React from 'react';
import {
  View,
  Text,
  ScrollView,
  StyleSheet,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { SimpleBarChart } from '@/components/chart/SimpleBarChart';
import { useAnalyticsOverview, useRevenueData, usePatientGrowth } from '@/hooks/useAnalytics';

export default function AnalyticsScreen() {
  const { data: overview, isLoading, refetch } = useAnalyticsOverview();
  const { data: revenue } = useRevenueData();
  const { data: patients } = usePatientGrowth();

  const [refreshing, setRefreshing] = React.useState(false);
  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.loading}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safeArea} edges={['bottom']}>
      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
      >
        {/* Overview cards */}
        <View style={styles.overviewGrid}>
          <Card elevated style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{overview?.totalRevenue ?? 0} €</Text>
            <Text style={styles.overviewLabel}>Revenus total</Text>
          </Card>
          <Card elevated style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{overview?.totalPatients ?? 0}</Text>
            <Text style={styles.overviewLabel}>Patients</Text>
          </Card>
          <Card elevated style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{overview?.totalSessions ?? 0}</Text>
            <Text style={styles.overviewLabel}>Seances</Text>
          </Card>
          <Card elevated style={styles.overviewCard}>
            <Text style={styles.overviewValue}>{overview?.avgSessionsPerWeek?.toFixed(1) ?? 0}</Text>
            <Text style={styles.overviewLabel}>Seances/sem</Text>
          </Card>
        </View>

        {/* Revenue chart */}
        {revenue && revenue.length > 0 && (
          <Card elevated style={styles.chartCard}>
            <Text style={styles.chartTitle}>Revenus (6 derniers mois)</Text>
            <SimpleBarChart
              data={revenue.map((r) => ({ label: r.month, value: r.amount }))}
              color={Colors.warm}
              height={180}
            />
          </Card>
        )}

        {/* Patient growth */}
        {patients && patients.length > 0 && (
          <Card elevated style={styles.chartCard}>
            <Text style={styles.chartTitle}>Croissance patients</Text>
            <SimpleBarChart
              data={patients.map((p) => ({ label: p.month, value: p.count }))}
              color={Colors.accent}
              height={160}
            />
          </Card>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 100 },
  overviewGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 12 },
  overviewCard: { width: '47%', alignItems: 'center', padding: 16, gap: 4 },
  overviewValue: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
  overviewLabel: { fontSize: 12, color: Colors.muted },
  chartCard: { gap: 16, padding: 20 },
  chartTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text },
});
