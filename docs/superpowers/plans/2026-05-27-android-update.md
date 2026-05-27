# Android PsyLib — Mise à jour mai 2026 — Plan d'implémentation

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Synchroniser l'app Android PsyLib avec le web : feature flag comptabilité Pro+, visio native LiveKit, Smart Slot Picker aligné sur les disponibilités, settings cabinet enrichis, puis build EAS production.

**Architecture:** 100% frontend mobile (`apps/mobile/`) — aucun changement backend. On ajoute un hook `usePlanFeatures` qui charge le plan Stripe depuis `GET /billing/subscription` après login. LiveKit React Native remplace l'ouverture du browser. Le Smart Slot Picker crée des `Appointment` via `POST /appointments` au lieu de `Session` directement.

**Tech Stack:** React Native + Expo Router, React Query, Zustand, `@livekit/react-native`, `@react-native-community/datetimepicker`, EAS Build.

---

## Structure des fichiers

| Fichier | Action |
|---|---|
| `hooks/usePlanFeatures.ts` | Nouveau — feature flags par plan |
| `hooks/usePracticeSettings.ts` | Nouveau — GET/PUT /onboarding/profile |
| `hooks/useVideoRooms.ts` | Modifié — ajouter `useInstantVideo` |
| `hooks/useAppointments.ts` | Modifié — ajouter `useAvailableTimeslots` |
| `hooks/useAuth.ts` | Modifié — charger plan Stripe après login |
| `app/video-room.tsx` | Nouveau — écran visio native LiveKit |
| `components/InstantVideoSheet.tsx` | Nouveau — bottom sheet visio instantanée |
| `app/(tabs)/sessions/new.tsx` | Refonte — flow 2 étapes avec créneaux |
| `app/video.tsx` | Modifié — LiveKit natif + visio instantanée |
| `app/(tabs)/more.tsx` | Modifié — badge Pro sur comptabilité |
| `app/accounting/index.tsx` | Modifié — FeatureLock si Free/Solo |
| `app/settings/index.tsx` | Modifié — entrée "Cabinet" |
| `app/settings/practice.tsx` | Nouveau — message confirmation + Google Cal |
| `app.config.ts` | Modifié — permissions RECORD_AUDIO + plugin LiveKit |
| `package.json` | Modifié — @livekit/react-native |

---

## Task 1 — Charger le plan Stripe après login + `usePlanFeatures`

**Objectif :** Le champ `plan` dans le store auth est toujours `null` car `syncStoreFromToken` ne parse pas de claim plan depuis le JWT Keycloak. On le charge depuis l'API après authentification.

**Files:**
- Modify: `apps/mobile/hooks/useAuth.ts`
- Create: `apps/mobile/hooks/usePlanFeatures.ts`

- [ ] **Step 1.1 — Ajouter `loadPlanFromApi` dans `useAuth.ts`**

Après chaque `syncStoreFromToken(token)` qui réussit, appeler l'API billing. Ajouter cette fonction en haut de `useAuth.ts`, après les imports :

```typescript
async function loadPlanFromApi(token: string): Promise<void> {
  try {
    const API_BASE = (Constants.expoConfig?.extra?.apiBaseUrl as string | undefined) ?? 'https://api.psylib.eu';
    const res = await fetch(`${API_BASE}/api/v1/billing/subscription`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok) return;
    const data = await res.json() as { plan?: string };
    if (data.plan) {
      useAuthStore.getState().setPsychologist({
        ...useAuthStore.getState(),
        psychologistId: useAuthStore.getState().psychologistId ?? '',
        name: useAuthStore.getState().name ?? '',
        email: useAuthStore.getState().email ?? '',
        plan: data.plan,
      });
    }
  } catch {
    // silently fail — feature flags degrade to "free"
  }
}
```

Ajouter `import Constants from 'expo-constants';` si pas encore présent.

- [ ] **Step 1.2 — Appeler `loadPlanFromApi` dans les 3 endroits où `syncStoreFromToken` est appelé**

Dans `useAuth.ts`, chercher chaque `syncStoreFromToken(...)` et ajouter `void loadPlanFromApi(token)` juste après. Il y a 3 occurrences : chargement initial, refresh, callback OIDC. Exemple :

```typescript
// Avant :
syncStoreFromToken(stored.accessToken);

// Après :
syncStoreFromToken(stored.accessToken);
void loadPlanFromApi(stored.accessToken);
```

Faire de même pour `refreshed.accessToken` (refresh) et `tokens.accessToken` (callback OIDC).

- [ ] **Step 1.3 — Créer `hooks/usePlanFeatures.ts`**

```typescript
import { useAuthStore } from '@/store/auth.store';

const PRO_PLANS = ['pro', 'clinic'];
const PAID_PLANS = ['solo', 'pro', 'clinic'];

export function usePlanFeatures() {
  const plan = (useAuthStore((s) => s.plan) ?? 'free').toLowerCase();

  return {
    plan,
    canAccessAccounting: PRO_PLANS.includes(plan),
    canAccessAI: PAID_PLANS.includes(plan),
    canAccessInstantVideo: PAID_PLANS.includes(plan),
    isPro: PRO_PLANS.includes(plan),
    isPaid: PAID_PLANS.includes(plan),
  };
}
```

- [ ] **Step 1.4 — Commit**

```bash
git add apps/mobile/hooks/useAuth.ts apps/mobile/hooks/usePlanFeatures.ts
git commit -m "feat(mobile): load Stripe plan from billing API after login + usePlanFeatures hook"
```

---

## Task 2 — Feature flag comptabilité (Pro+ only)

**Objectif :** Bloquer l'accès à la comptabilité pour les plans Free et Solo, comme sur le web.

**Files:**
- Modify: `apps/mobile/app/(tabs)/more.tsx`
- Modify: `apps/mobile/app/accounting/index.tsx`

- [ ] **Step 2.1 — Modifier `more.tsx` : badge "Pro" sur Comptabilite**

Importer `usePlanFeatures` et conditionner l'affichage de l'item comptabilité :

```typescript
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

// Dans MoreScreen() :
const { canAccessAccounting } = usePlanFeatures();

// Remplacer l'item Comptabilite dans menuItems :
{
  icon: '📒',
  label: 'Comptabilite',
  route: '/accounting',
  color: Colors.success,
  locked: !canAccessAccounting,
},
```

Modifier l'interface `MenuItem` pour ajouter `locked?: boolean` et rendre le composant de l'item conditionnel :

```typescript
interface MenuItem {
  icon: string;
  label: string;
  route: string;
  badge?: number;
  color?: string;
  locked?: boolean;
}
```

Dans le rendu de chaque item, si `locked`, afficher un badge "Pro" à la place du badge numérique et désactiver la navigation :

```typescript
onPress={() => {
  if (item.locked) {
    Alert.alert('Plan Pro requis', 'La comptabilite est disponible a partir du plan Pro.');
    return;
  }
  router.push(item.route as any);
}}
```

Dans l'`iconContainer`, si `item.locked`, afficher un badge texte "PRO" :

```tsx
{item.locked && (
  <View style={styles.lockBadge}>
    <Text style={styles.lockBadgeText}>PRO</Text>
  </View>
)}
```

Styles à ajouter :
```typescript
lockBadge: {
  position: 'absolute', top: -4, right: -4,
  backgroundColor: Colors.warm, borderRadius: 9, paddingHorizontal: 5, height: 18,
  alignItems: 'center', justifyContent: 'center',
},
lockBadgeText: { color: '#FFF', fontSize: 9, fontWeight: '700' },
```

- [ ] **Step 2.2 — Modifier `accounting/index.tsx` : FeatureLock en haut de fichier**

Ajouter au début du composant `AccountingDashboardScreen`, avant le loading check :

```typescript
import { usePlanFeatures } from '@/hooks/usePlanFeatures';

// En haut de AccountingDashboardScreen() :
const { canAccessAccounting } = usePlanFeatures();

if (!canAccessAccounting) {
  return (
    <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
      <View style={styles.lockContainer}>
        <Text style={styles.lockIcon}>🔒</Text>
        <Text style={styles.lockTitle}>Comptabilite Pro+</Text>
        <Text style={styles.lockDesc}>
          {'La comptabilite integree est disponible\na partir du plan Pro (40€/mois).'}
        </Text>
        <TouchableOpacity
          style={styles.lockBtn}
          onPress={() => void Linking.openURL('https://app.psylib.eu/dashboard/settings/billing')}
        >
          <Text style={styles.lockBtnText}>Voir les plans</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}
```

Ajouter `Linking` aux imports React Native et ces styles :
```typescript
lockContainer: { flex: 1, alignItems: 'center', justifyContent: 'center', padding: 32, gap: 16 },
lockIcon: { fontSize: 48 },
lockTitle: { fontSize: 22, fontFamily: 'DMSans_700Bold', color: Colors.text },
lockDesc: { fontSize: 15, color: Colors.muted, textAlign: 'center', lineHeight: 22 },
lockBtn: { backgroundColor: Colors.primary, paddingHorizontal: 24, paddingVertical: 12, borderRadius: 12, marginTop: 8 },
lockBtnText: { color: '#FFF', fontSize: 15, fontFamily: 'DMSans_600SemiBold' },
```

- [ ] **Step 2.3 — Commit**

```bash
git add apps/mobile/app/\(tabs\)/more.tsx apps/mobile/app/accounting/index.tsx
git commit -m "feat(mobile): gate accounting behind Pro plan with FeatureLock"
```

---

## Task 3 — Installer LiveKit React Native + permissions

**Objectif :** Préparer les dépendances natives pour la visio LiveKit.

**Files:**
- Modify: `apps/mobile/package.json`
- Modify: `apps/mobile/app.config.ts`

- [ ] **Step 3.1 — Installer les packages LiveKit**

```bash
cd apps/mobile
npx expo install @livekit/react-native livekit-client @livekit/react-native-webrtc
```

> `@livekit/react-native-webrtc` est la dépendance WebRTC requise par le SDK LiveKit RN.

- [ ] **Step 3.2 — Ajouter les permissions manquantes dans `app.config.ts`**

Dans le tableau `android.permissions`, ajouter `'RECORD_AUDIO'` et `'FOREGROUND_SERVICE'` :

```typescript
permissions: [
  'RECEIVE_BOOT_COMPLETED',
  'VIBRATE',
  'USE_BIOMETRIC',
  'USE_FINGERPRINT',
  'CAMERA',
  'RECORD_AUDIO',         // ← nouveau
  'FOREGROUND_SERVICE',   // ← nouveau
  'READ_CALENDAR',
  'WRITE_CALENDAR',
],
```

Également dans `ios.infoPlist`, vérifier que `NSMicrophoneUsageDescription` est bien présent (il l'est déjà dans le fichier actuel).

- [ ] **Step 3.3 — Commit**

```bash
git add apps/mobile/package.json apps/mobile/app.config.ts
git commit -m "feat(mobile): add @livekit/react-native + RECORD_AUDIO/FOREGROUND_SERVICE permissions"
```

---

## Task 4 — Hook `useInstantVideo` + écran `video-room.tsx`

**Objectif :** Créer le hook pour la visio instantanée et l'écran de visio native LiveKit.

**Files:**
- Modify: `apps/mobile/hooks/useVideoRooms.ts`
- Create: `apps/mobile/app/video-room.tsx`

- [ ] **Step 4.1 — Ajouter `useInstantVideo` dans `useVideoRooms.ts`**

Ajouter après la dernière fonction du fichier :

```typescript
export interface InstantVideoResult {
  roomName: string;
  token: string;
  wsUrl: string;
}

export function useInstantVideo() {
  const { getValidToken } = useAuth();

  return useMutation({
    mutationFn: async (patientId?: string) => {
      const token = await getValidToken();
      return apiClient.post<InstantVideoResult>(
        '/video/instant',
        patientId ? { patientId } : {},
        token ?? undefined,
      );
    },
  });
}
```

- [ ] **Step 4.2 — Créer `app/video-room.tsx`**

```typescript
import React, { useCallback, useEffect } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  StatusBar,
  BackHandler,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  LiveKitRoom,
  VideoTrack,
  useParticipants,
  useLocalParticipant,
  useTracks,
  TrackReferenceOrPlaceholder,
} from '@livekit/react-native';
import { Track } from 'livekit-client';
import { Colors } from '@/constants/colors';

export default function VideoRoomScreen() {
  const router = useRouter();
  const { roomName, token, wsUrl } = useLocalSearchParams<{
    roomName: string;
    token: string;
    wsUrl: string;
  }>();

  const serverUrl = wsUrl ?? 'wss://livekit.psylib.eu';

  return (
    <LiveKitRoom
      serverUrl={serverUrl}
      token={token ?? ''}
      connect={true}
      audio={true}
      video={true}
      onDisconnected={() => router.back()}
    >
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <RoomContent onLeave={() => router.back()} />
    </LiveKitRoom>
  );
}

function RoomContent({ onLeave }: { onLeave: () => void }) {
  const { localParticipant } = useLocalParticipant();
  const tracks = useTracks([Track.Source.Camera, Track.Source.ScreenShare]);

  const isMuted = localParticipant?.isMicrophoneEnabled === false;
  const isCameraOff = localParticipant?.isCameraEnabled === false;

  // Intercepter le bouton retour Android
  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      void localParticipant?.disconnect?.().finally(() => onLeave());
      return true;
    });
    return () => sub.remove();
  }, [localParticipant, onLeave]);

  const handleLeave = useCallback(() => {
    void localParticipant?.disconnect?.().finally(() => onLeave());
  }, [localParticipant, onLeave]);

  const toggleMic = useCallback(() => {
    void localParticipant?.setMicrophoneEnabled(isMuted);
  }, [localParticipant, isMuted]);

  const toggleCamera = useCallback(() => {
    void localParticipant?.setCameraEnabled(isCameraOff);
  }, [localParticipant, isCameraOff]);

  return (
    <View style={styles.container}>
      {/* Grille vidéo */}
      <View style={styles.videoGrid}>
        {tracks.length === 0 ? (
          <View style={styles.noVideo}>
            <Text style={styles.noVideoText}>En attente du patient...</Text>
          </View>
        ) : (
          tracks.map((track: TrackReferenceOrPlaceholder) => (
            <VideoTrack
              key={`${track.participant?.identity ?? 'local'}-${track.source}`}
              trackRef={track}
              style={styles.videoTrack}
            />
          ))
        )}
      </View>

      {/* Barre de contrôles */}
      <SafeAreaView edges={['bottom']} style={styles.controls}>
        <TouchableOpacity
          style={[styles.controlBtn, isMuted && styles.controlBtnActive]}
          onPress={toggleMic}
          accessibilityLabel={isMuted ? 'Activer le microphone' : 'Couper le microphone'}
        >
          <Text style={styles.controlIcon}>{isMuted ? '🔇' : '🎤'}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.leaveBtn}
          onPress={handleLeave}
          accessibilityLabel="Terminer la consultation"
        >
          <Text style={styles.leaveIcon}>📵</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.controlBtn, isCameraOff && styles.controlBtnActive]}
          onPress={toggleCamera}
          accessibilityLabel={isCameraOff ? 'Activer la caméra' : 'Couper la caméra'}
        >
          <Text style={styles.controlIcon}>{isCameraOff ? '📷' : '📹'}</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#1a1a2e' },
  videoGrid: { flex: 1, padding: 8, gap: 8 },
  videoTrack: { flex: 1, borderRadius: 12, overflow: 'hidden', minHeight: 200 },
  noVideo: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  noVideoText: { color: '#FFF', fontSize: 16, opacity: 0.7 },
  controls: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: 24,
    paddingHorizontal: 24,
    paddingVertical: 16,
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  controlBtn: {
    width: 56, height: 56, borderRadius: 28,
    backgroundColor: 'rgba(255,255,255,0.2)',
    alignItems: 'center', justifyContent: 'center',
  },
  controlBtnActive: { backgroundColor: 'rgba(255,80,80,0.4)' },
  controlIcon: { fontSize: 24 },
  leaveBtn: {
    width: 64, height: 64, borderRadius: 32,
    backgroundColor: '#EF4444',
    alignItems: 'center', justifyContent: 'center',
  },
  leaveIcon: { fontSize: 28 },
});
```

- [ ] **Step 4.3 — Commit**

```bash
git add apps/mobile/hooks/useVideoRooms.ts apps/mobile/app/video-room.tsx
git commit -m "feat(mobile): add useInstantVideo hook + native LiveKit video-room screen"
```

---

## Task 5 — `InstantVideoSheet` + mise à jour `video.tsx`

**Objectif :** Remplacer l'ouverture du browser par la navigation native vers `video-room`. Ajouter le bouton visio instantanée.

**Files:**
- Create: `apps/mobile/components/InstantVideoSheet.tsx`
- Modify: `apps/mobile/app/video.tsx`

- [ ] **Step 5.1 — Créer `components/InstantVideoSheet.tsx`**

```typescript
import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Alert,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { Button } from '@/components/ui/Button';
import { usePatients } from '@/hooks/usePatients';
import { useInstantVideo } from '@/hooks/useVideoRooms';

interface InstantVideoSheetProps {
  visible: boolean;
  onClose: () => void;
}

export function InstantVideoSheet({ visible, onClose }: InstantVideoSheetProps) {
  const router = useRouter();
  const [selectedPatientId, setSelectedPatientId] = useState<string | null>(null);
  const { data: patientsData } = usePatients(1, 100);
  const instantVideo = useInstantVideo();

  const handleLaunch = async () => {
    try {
      const result = await instantVideo.mutateAsync(selectedPatientId ?? undefined);
      onClose();
      router.push({
        pathname: '/video-room',
        params: { roomName: result.roomName, token: result.token, wsUrl: result.wsUrl },
      });
    } catch {
      Alert.alert('Erreur', 'Impossible de lancer la visio. Verifie ta connexion.');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose}>
      <TouchableOpacity style={styles.backdrop} activeOpacity={1} onPress={onClose} />
      <View style={styles.sheet}>
        <View style={styles.handle} />
        <Text style={styles.title}>Visio instantanee</Text>
        <Text style={styles.subtitle}>Choisir un patient (optionnel)</Text>

        <ScrollView style={styles.patientList} contentContainerStyle={styles.patientListContent}>
          <TouchableOpacity
            style={[styles.patientItem, selectedPatientId === null && styles.patientItemSelected]}
            onPress={() => setSelectedPatientId(null)}
          >
            <Text style={[styles.patientName, selectedPatientId === null && styles.patientNameSelected]}>
              Sans patient specifique
            </Text>
          </TouchableOpacity>
          {(patientsData?.data ?? []).map((p) => (
            <TouchableOpacity
              key={p.id}
              style={[styles.patientItem, selectedPatientId === p.id && styles.patientItemSelected]}
              onPress={() => setSelectedPatientId(p.id)}
            >
              <Text style={[styles.patientName, selectedPatientId === p.id && styles.patientNameSelected]}>
                {p.name}
              </Text>
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Button
          onPress={() => void handleLaunch()}
          variant="primary"
          size="lg"
          fullWidth
          loading={instantVideo.isPending}
        >
          Lancer la visio
        </Button>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: { flex: 1, backgroundColor: 'rgba(0,0,0,0.4)' },
  sheet: {
    backgroundColor: Colors.bg,
    borderTopLeftRadius: 24, borderTopRightRadius: 24,
    padding: 24, paddingBottom: 40, gap: 16, maxHeight: '70%',
  },
  handle: {
    width: 36, height: 4, borderRadius: 2, backgroundColor: Colors.border,
    alignSelf: 'center', marginBottom: 8,
  },
  title: { fontSize: 20, fontFamily: 'DMSans_700Bold', color: Colors.text },
  subtitle: { fontSize: 14, color: Colors.muted },
  patientList: { maxHeight: 200 },
  patientListContent: { gap: 8 },
  patientItem: {
    padding: 14, borderRadius: 10, backgroundColor: Colors.surface,
    borderWidth: 1.5, borderColor: Colors.border,
  },
  patientItemSelected: { backgroundColor: `${Colors.primary}1A`, borderColor: Colors.primary },
  patientName: { fontSize: 14, color: Colors.text, fontFamily: 'DMSans_500Medium' },
  patientNameSelected: { color: Colors.primary, fontFamily: 'DMSans_600SemiBold' },
});
```

- [ ] **Step 5.2 — Mettre à jour `app/video.tsx`**

Supprimer l'import `Linking`. Ajouter :
```typescript
import { useRouter } from 'expo-router';
import { InstantVideoSheet } from '@/components/InstantVideoSheet';
import { usePlanFeatures } from '@/hooks/usePlanFeatures';
```

Ajouter dans le composant `VideoScreen` :
```typescript
const router = useRouter();
const { canAccessInstantVideo } = usePlanFeatures();
const [showInstantSheet, setShowInstantSheet] = useState(false);
```

Remplacer `handleJoin` :
```typescript
const handleJoin = async (appointmentId: string) => {
  try {
    const result = await getPsyToken.mutateAsync(appointmentId);
    router.push({
      pathname: '/video-room',
      params: { roomName: result.roomName, token: result.token, wsUrl: result.wsUrl },
    });
  } catch {
    Alert.alert('Erreur', 'Impossible de rejoindre la salle');
  }
};
```

Avant la `FlatList`, ajouter le bouton visio instantanée :
```tsx
{canAccessInstantVideo ? (
  <TouchableOpacity
    style={styles.instantBtn}
    onPress={() => setShowInstantSheet(true)}
  >
    <Text style={styles.instantBtnText}>⚡ Visio instantanee</Text>
  </TouchableOpacity>
) : (
  <View style={styles.instantBtnLocked}>
    <Text style={styles.instantBtnLockedText}>⚡ Visio instantanee — Plan Solo+</Text>
  </View>
)}
<InstantVideoSheet visible={showInstantSheet} onClose={() => setShowInstantSheet(false)} />
```

Styles à ajouter :
```typescript
instantBtn: {
  margin: 16, padding: 14, borderRadius: 12,
  backgroundColor: `${Colors.accent}15`, borderWidth: 1.5, borderColor: Colors.accent,
  alignItems: 'center',
},
instantBtnText: { color: Colors.accent, fontFamily: 'DMSans_600SemiBold', fontSize: 15 },
instantBtnLocked: {
  margin: 16, padding: 14, borderRadius: 12,
  backgroundColor: Colors.surface, alignItems: 'center',
},
instantBtnLockedText: { color: Colors.muted, fontSize: 14 },
```

- [ ] **Step 5.3 — Commit**

```bash
git add apps/mobile/components/InstantVideoSheet.tsx apps/mobile/app/video.tsx
git commit -m "feat(mobile): native LiveKit video — InstantVideoSheet + update video.tsx"
```

---

## Task 6 — Smart Slot Picker — `useAvailableTimeslots` + refonte `sessions/new.tsx`

**Objectif :** Remplacer la création directe de Session par un flow 2 étapes qui crée un Appointment basé sur les créneaux disponibles.

**Files:**
- Modify: `apps/mobile/hooks/useAppointments.ts`
- Modify: `apps/mobile/app/(tabs)/sessions/new.tsx`

- [ ] **Step 6.1 — Ajouter `useAvailableTimeslots` dans `useAppointments.ts`**

Ajouter après les imports, l'interface :
```typescript
interface TimeslotResponse {
  slots: string[]; // format "HH:MM"
}
```

Ajouter la fonction :
```typescript
export function useAvailableTimeslots(date: string | null) {
  const { getValidToken } = useAuth();

  return useQuery<string[]>({
    queryKey: [APPOINTMENTS_KEY, 'timeslots', date],
    queryFn: async () => {
      const token = await getValidToken();
      const res = await apiClient.get<TimeslotResponse | string[]>(
        `/availability/timeslots?date=${date}`,
        token ?? undefined,
      );
      // L'endpoint retourne soit un tableau directement, soit { slots: [...] }
      return Array.isArray(res) ? res : (res as TimeslotResponse).slots ?? [];
    },
    enabled: date !== null && date.length > 0,
    staleTime: 1000 * 60 * 5,
  });
}
```

Et mettre à jour `CreateAppointmentDto` pour inclure les champs du Smart Slot Picker :
```typescript
interface CreateAppointmentDto {
  patientId: string;
  scheduledAt: string;
  duration: number;
  type?: string;
  notes?: string;
  rate?: number;
  modality?: 'in_person' | 'online';
}
```

- [ ] **Step 6.2 — Réécrire `app/(tabs)/sessions/new.tsx`**

Remplacer le contenu entier du fichier par :

```typescript
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

  // Étape 1 — Créneau
  const [step, setStep] = useState<1 | 2>(1);
  const [selectedPatientId, setSelectedPatientId] = useState(initialPatientId ?? '');
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [selectedSlot, setSelectedSlot] = useState<string | null>(null);
  const [showDatePicker, setShowDatePicker] = useState(false);

  // Étape 2 — Détails
  const [sessionType, setSessionType] = useState<SessionType>('individual');
  const [duration, setDuration] = useState('50');
  const [rate, setRate] = useState('');
  const [modality, setModality] = useState<Modality>('in_person');
  const [notes, setNotes] = useState('');

  const { data: patientsData } = usePatients(1, 100);
  const dateStr = toDateString(selectedDate);
  const { data: slots = [], isLoading: slotsLoading } = useAvailableTimeslots(dateStr);
  const { mutateAsync: createAppointment, isPending } = useCreateAppointment();

  const goToStep2 = () => {
    if (!selectedPatientId) {
      Alert.alert('Patient requis', 'Veuillez selectionner un patient.');
      return;
    }
    if (!selectedSlot) {
      Alert.alert('Creneau requis', 'Veuillez selectionner un creneau horaire.');
      return;
    }
    setStep(2);
  };

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
                      onChange={(_e, date) => {
                        setShowDatePicker(Platform.OS === 'ios');
                        if (date) { setSelectedDate(date); setSelectedSlot(null); }
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
                        >
                          <Text style={[styles.slotText, selectedSlot === slot && styles.slotTextSelected]}>
                            {slot}
                          </Text>
                        </TouchableOpacity>
                      ))}
                    </View>
                  )}
                </Card>

                <Button onPress={goToStep2} variant="primary" size="lg" fullWidth disabled={!selectedSlot || !selectedPatientId}>
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

                <Button onPress={() => void handleSubmit()} variant="primary" size="lg" fullWidth loading={isPending}>
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
```

- [ ] **Step 6.3 — Commit**

```bash
git add apps/mobile/hooks/useAppointments.ts "apps/mobile/app/(tabs)/sessions/new.tsx"
git commit -m "feat(mobile): smart slot picker — 2-step flow creating Appointment from available timeslots"
```

---

## Task 7 — Settings cabinet (`practice.tsx` + `settings/index.tsx`)

**Objectif :** Permettre au psy de configurer son message de confirmation et voir/gérer sa connexion Google Calendar depuis le mobile.

**Files:**
- Create: `apps/mobile/hooks/usePracticeSettings.ts`
- Create: `apps/mobile/app/settings/practice.tsx`
- Modify: `apps/mobile/app/settings/index.tsx`

- [ ] **Step 7.1 — Créer `hooks/usePracticeSettings.ts`**

```typescript
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api';
import { useAuth } from './useAuth';

interface PracticeProfile {
  bookingConfirmationMessage?: string | null;
}

interface CalendarStatus {
  connected: boolean;
  email?: string | null;
}

const PRACTICE_KEY = 'practice';

export function usePracticeProfile() {
  const { getValidToken } = useAuth();
  return useQuery<PracticeProfile>({
    queryKey: [PRACTICE_KEY, 'profile'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<PracticeProfile>('/onboarding/profile', token ?? undefined);
    },
    staleTime: 1000 * 60 * 5,
  });
}

export function useUpdatePracticeProfile() {
  const { getValidToken } = useAuth();
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (data: Partial<PracticeProfile>) => {
      const token = await getValidToken();
      return apiClient.put<PracticeProfile>('/onboarding/profile', data, token ?? undefined);
    },
    onSuccess: () => void qc.invalidateQueries({ queryKey: [PRACTICE_KEY] }),
  });
}

export function useCalendarStatus() {
  const { getValidToken } = useAuth();
  return useQuery<CalendarStatus>({
    queryKey: [PRACTICE_KEY, 'calendar'],
    queryFn: async () => {
      const token = await getValidToken();
      return apiClient.get<CalendarStatus>('/calendar-sync/status', token ?? undefined);
    },
    staleTime: 1000 * 60 * 2,
  });
}
```

Vérifier que `apiClient` expose une méthode `put` — si elle n'existe pas dans `lib/api.ts`, l'ajouter en suivant le pattern de `post` :
```typescript
put: <T>(path: string, body: unknown, token?: string) =>
  request<T>(path, { method: 'PUT', body: JSON.stringify(body), token }),
```

- [ ] **Step 7.2 — Créer `app/settings/practice.tsx`**

```typescript
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
              <Button onPress={handleConnectCalendar} variant="outline">
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
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
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
```

- [ ] **Step 7.3 — Ajouter l'entrée "Cabinet" dans `app/settings/index.tsx`**

Dans la liste `items`, ajouter avant l'entrée "Gerer mon abonnement" :
```typescript
{ icon: '🏢', label: 'Parametres cabinet', onPress: () => router.push('/settings/practice') },
```

- [ ] **Step 7.4 — Commit**

```bash
git add apps/mobile/hooks/usePracticeSettings.ts apps/mobile/app/settings/practice.tsx apps/mobile/app/settings/index.tsx
git commit -m "feat(mobile): add practice settings screen — confirmation message + Google Calendar"
```

---

## Task 8 — Build EAS production + submit Play Store

**Objectif :** Compiler un nouveau AAB et le soumettre au Play Store (internal testing).

- [ ] **Step 8.1 — Vérifier que tout compile sans erreur TypeScript**

```bash
cd apps/mobile
npx tsc --noEmit
```

Corriger les erreurs éventuelles avant de continuer.

- [ ] **Step 8.2 — Lancer le build EAS Android production**

```bash
eas build --platform android --profile production
```

Le build tourne sur les serveurs EAS (~15-20 min). `autoIncrement: true` dans `eas.json` incrémente automatiquement le `versionCode` (sera 8 si le dernier était 7).

- [ ] **Step 8.3 — Soumettre au Play Store (internal testing)**

Une fois le build terminé (EAS envoie une notif email) :

```bash
eas submit --platform android --latest
```

Le flag `--latest` prend automatiquement le dernier build. Le `google-services.json` contient les credentials service account pour la soumission.

- [ ] **Step 8.4 — Vérifier sur Play Console**

Ouvrir `https://play.google.com/console` → PsyLib → Internal Testing → vérifier que le nouveau build (versionCode 8) est bien reçu et passer en "Release to internal testers".

- [ ] **Step 8.5 — Commit final**

```bash
git add .
git commit -m "chore(mobile): bump build — LiveKit native, slot picker, plan gates, practice settings"
```

---

## Notes importantes

- **EAS Build nécessite une connexion internet** et un compte Expo authentifié (`eas whoami`).
- **LiveKit React Native** requiert un build natif — impossible à tester dans Expo Go. Tester sur l'APK de preview ou le build de production directement.
- **`apiClient.put`** : vérifier son existence dans `lib/api.ts` avant la Task 7 (step 7.1 inclut la vérification).
- **DateTimePicker Android** : sur Android, `showDatePicker` doit se fermer après sélection (`setShowDatePicker(false)` dans `onChange`). Le code du Step 6.2 gère déjà ce cas via `Platform.OS`.
- **iOS** : hors périmètre de ce sprint — les placeholders EAS (appleId, ascAppId, appleTeamId) ne sont pas configurés.
