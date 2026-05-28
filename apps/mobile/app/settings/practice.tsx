import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TextInput, TouchableOpacity,
  StyleSheet, Alert, Linking, ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Stack } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { usePracticeProfile, useUpdatePracticeProfile, useCalendarStatus } from '@/hooks/usePracticeSettings';

export default function PracticeSettingsScreen() {
  const { data: profile, isLoading } = usePracticeProfile();
  const { data: calendarStatus } = useCalendarStatus();
  const updateProfile = useUpdatePracticeProfile();

  const [confirmationMsg, setConfirmationMsg] = useState('');

  useEffect(() => {
    if (profile?.bookingConfirmationMessage) {
      setConfirmationMsg(profile.bookingConfirmationMessage);
    }
  }, [profile]);

  const handleSaveMessage = async () => {
    try {
      await updateProfile.mutateAsync({ bookingConfirmationMessage: confirmationMsg || null });
      Alert.alert('Sauvegarde', 'Message de confirmation mis a jour.');
    } catch {
      Alert.alert('Erreur', 'Impossible de sauvegarder le message.');
    }
  };

  const handleConnectCalendar = () => {
    void Linking.openURL('https://api.psylib.eu/api/v1/calendar-sync/google/auth');
  };

  if (isLoading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator color={Colors.primary} />
      </View>
    );
  }

  return (
    <>
      <Stack.Screen
        options={{
          title: 'Parametres cabinet',
          headerStyle: { backgroundColor: Colors.bg },
          headerTitleStyle: { fontWeight: '700', color: Colors.text },
          headerShadowVisible: false,
        }}
      />
      <SafeAreaView style={styles.safeArea} edges={['bottom']}>
        <ScrollView style={styles.scroll} contentContainerStyle={styles.content}>

          {/* Message de confirmation */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Message de confirmation</Text>
            <Text style={styles.cardDesc}>
              Affiché aux patients apres la reservation d'un rendez-vous en ligne.
            </Text>
            <TextInput
              style={styles.textarea}
              value={confirmationMsg}
              onChangeText={setConfirmationMsg}
              multiline
              numberOfLines={5}
              placeholder="Ex : Merci de votre reservation ! Pensez a consulter..."
              placeholderTextColor={Colors.muted}
              accessibilityLabel="Message de confirmation de rendez-vous"
            />
            <Button
              onPress={() => void handleSaveMessage()}
              variant="primary"
              loading={updateProfile.isPending}
              accessibilityLabel="Sauvegarder le message de confirmation"
            >
              Sauvegarder
            </Button>
          </Card>

          {/* Google Calendar */}
          <Card style={styles.card}>
            <Text style={styles.cardTitle}>Google Calendar</Text>
            <Text style={styles.cardDesc}>
              Synchronisez vos rendez-vous PsyLib avec votre agenda Google.
            </Text>
            {calendarStatus?.connected ? (
              <View style={styles.calendarConnected}>
                <Text style={styles.calendarConnectedText}>
                  ✅ Connecte : {calendarStatus.email ?? 'Google Calendar'}
                </Text>
              </View>
            ) : (
              <Button onPress={handleConnectCalendar} variant="outline" accessibilityLabel="Connecter Google Calendar">
                Connecter Google Calendar
              </Button>
            )}
          </Card>

        </ScrollView>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { padding: 20, gap: 20, paddingBottom: 40 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  card: { gap: 12 },
  cardTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.text },
  cardDesc: { fontSize: 13, color: Colors.muted, lineHeight: 18 },
  textarea: {
    borderWidth: 1, borderColor: Colors.border, borderRadius: 10,
    padding: 12, fontSize: 14, color: Colors.text,
    minHeight: 100, textAlignVertical: 'top',
    fontFamily: 'DMSans_400Regular',
  },
  calendarConnected: {
    padding: 12, borderRadius: 10, backgroundColor: `${Colors.accent}10`,
    borderWidth: 1, borderColor: Colors.accent,
  },
  calendarConnectedText: { color: Colors.accent, fontSize: 14, fontFamily: 'DMSans_500Medium' },
});
