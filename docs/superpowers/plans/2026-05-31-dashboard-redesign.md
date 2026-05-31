# Dashboard Mobile Redesign — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Rebuilder le dashboard mobile avec une palette sauge chaleureuse, une WeekStrip sélecteur de jour, et une DayTimeline horaire — en remplaçant les NavPills inline par une bottom tab bar standard.

**Architecture:** 2 nouveaux composants (`DashboardHeader`, `DayTimeline`) + 1 nouveau hook (`useAppointmentsByDate`) + mise à jour de `WeekStrip` pour accepter un jour sélectionné. Le dashboard `(tabs)/index.tsx` est entièrement réécrit pour assembler ces pièces. La bottom tab bar est activée dans `_layout.tsx`. Aucun autre écran n'est touché.

**Tech Stack:** React Native (Expo), TypeScript strict, React Query (`@tanstack/react-query`), `expo-linear-gradient`, `expo-router`, DM Sans font, composants existants (`useAppointments`, `useDashboardStats`, `useTodayAppointments`, `useUnreadCount`).

---

## File Map

| Fichier | Action | Rôle |
|---|---|---|
| `apps/mobile/constants/colors.ts` | Modifier | Ajouter tokens sauge/warm |
| `apps/mobile/app/(tabs)/_layout.tsx` | Modifier | Activer bottom tab bar sauge |
| `apps/mobile/components/WeekStrip.tsx` | Modifier | Ajouter `selectedDate` + `onDayChange` |
| `apps/mobile/hooks/useAppointmentsByDate.ts` | Créer | Wrapper `useAppointments` filtré par jour |
| `apps/mobile/components/DashboardHeader.tsx` | Créer | Header gradient sauge avec stats |
| `apps/mobile/components/DayTimeline.tsx` | Créer | Vue horaire des RDV + créneaux libres |
| `apps/mobile/app/(tabs)/index.tsx` | Rebuild | Assemblage final du nouveau dashboard |

---

## Task 1 — Tokens de couleur sauge

**Files:**
- Modify: `apps/mobile/constants/colors.ts`

- [ ] **Ajouter les tokens sauge** à la fin de l'objet `Colors`, avant le `} as const` :

```typescript
  // Warm — Sauge / Forêt (dashboard redesign)
  sageBase: '#4A7C59',
  sageDark: '#3D6B4A',
  sageLight: '#6B9E78',
  sageSurface: '#EEF5EE',
  sageCard: '#E4F0E4',
  sageMuted: 'rgba(74,124,89,0.12)',
  cream: '#FAFAF8',
  stone: '#F5F4F1',
  warmText: '#1C1917',
  warmMuted: '#78716C',
  warmBorder: '#DDE8DD',
```

Le fichier existant se termine par `} as const;` — insérer ces lignes juste avant.

- [ ] **Vérifier TypeScript** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected : 0 erreurs sur `constants/colors.ts`.

- [ ] **Commit** :

```bash
git add apps/mobile/constants/colors.ts
git commit -m "feat(mobile): add sauge/warm color tokens for dashboard redesign"
```

---

## Task 2 — Bottom Tab Bar

**Files:**
- Modify: `apps/mobile/app/(tabs)/_layout.tsx`

- [ ] **Lire le fichier actuel** pour voir la structure exacte (déjà lu — tab bar cachée via `tabBarStyle: { display: 'none' }`).

- [ ] **Remplacer le contenu** de `apps/mobile/app/(tabs)/_layout.tsx` entièrement par :

```typescript
import React from 'react';
import { StyleSheet, View } from 'react-native';
import { Tabs } from 'expo-router';
import { Colors } from '@/constants/colors';
import { IconHome, IconPatient, IconCalendar } from '@/components/icons/AppIcons';
import Ionicons from '@expo/vector-icons/Ionicons';

export default function TabsLayout() {
  return (
    <Tabs
      screenOptions={{
        headerStyle: { backgroundColor: Colors.cream },
        headerTintColor: Colors.warmText,
        headerTitleStyle: styles.headerTitle,
        headerShadowVisible: false,
        tabBarActiveTintColor: Colors.sageBase,
        tabBarInactiveTintColor: '#A8A29E',
        tabBarStyle: styles.tabBar,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Accueil',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconHome size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="patients"
        options={{
          title: 'Patients',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconPatient size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="calendar"
        options={{
          title: 'Agenda',
          headerShown: false,
          tabBarIcon: ({ color, size }) => (
            <IconCalendar size={size ?? 22} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="sessions"
        options={{
          href: null,
          headerShown: false,
        }}
      />
      <Tabs.Screen
        name="more"
        options={{
          title: 'Plus',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="ellipsis-horizontal" size={size ?? 22} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  headerTitle: {
    fontFamily: 'DMSans_700Bold',
    fontSize: 17,
    color: Colors.warmText,
  },
  tabBar: {
    backgroundColor: '#FFFFFF',
    borderTopColor: Colors.warmBorder,
    borderTopWidth: 1,
    height: 56,
    paddingBottom: 6,
  },
  tabLabel: {
    fontFamily: 'DMSans_500Medium',
    fontSize: 11,
  },
});
```

- [ ] **Vérifier TypeScript** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected : 0 erreurs. Si `Ionicons` pose problème, remplacer par `<IconCalendar>` temporairement.

- [ ] **Commit** :

```bash
git add apps/mobile/app/(tabs)/_layout.tsx
git commit -m "feat(mobile): enable bottom tab bar with sauge styling"
```

---

## Task 3 — WeekStrip sélecteur de jour

**Files:**
- Modify: `apps/mobile/components/WeekStrip.tsx`

Le composant actuel affiche la semaine courante et appelle `onDayPress` au tap. Il faut ajouter un `selectedDate` contrôlé et le style "actif" sur le jour sélectionné (pas seulement aujourd'hui).

- [ ] **Remplacer le contenu** de `apps/mobile/components/WeekStrip.tsx` par :

```typescript
import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Colors } from '@/constants/colors';

const DAYS_SHORT = ['L', 'M', 'M', 'J', 'V', 'S', 'D'];

interface WeekStripProps {
  appointmentDates?: Set<string>;
  selectedDate?: Date;
  onDayChange?: (date: Date) => void;
  /** Legacy prop — kept for backward compat on other screens */
  onDayPress?: (date: Date) => void;
}

function getWeekDays(): Date[] {
  const now = new Date();
  const day = now.getDay();
  const diff = day === 0 ? -6 : 1 - day;
  const startOfWeek = new Date(now);
  startOfWeek.setDate(now.getDate() + diff);
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(startOfWeek);
    d.setDate(startOfWeek.getDate() + i);
    return d;
  });
}

export function WeekStrip({ appointmentDates, selectedDate, onDayChange, onDayPress }: WeekStripProps) {
  const weekDays = useMemo(() => getWeekDays(), []);
  const todayKey = new Date().toDateString();
  const selectedKey = selectedDate?.toDateString();

  return (
    <View style={styles.row}>
      {weekDays.map((day, index) => {
        const dayKey = day.toDateString();
        const isToday = dayKey === todayKey;
        const isSelected = selectedKey ? dayKey === selectedKey : isToday;
        const hasApt = appointmentDates?.has(dayKey) ?? false;

        return (
          <TouchableOpacity
            key={dayKey}
            style={[styles.day, isSelected && styles.daySelected]}
            onPress={() => {
              onDayChange?.(day);
              onDayPress?.(day);
            }}
            accessibilityLabel={`${DAYS_SHORT[index]} ${day.getDate()}`}
            accessibilityState={{ selected: isSelected }}
            activeOpacity={0.7}
          >
            <Text style={[styles.dayLabel, isSelected && styles.dayLabelSelected]}>
              {DAYS_SHORT[index]}
            </Text>
            <Text style={[styles.dayNumber, isSelected && styles.dayNumberSelected]}>
              {day.getDate()}
            </Text>
            {hasApt && (
              <View style={[styles.dot, isSelected && styles.dotSelected]} />
            )}
          </TouchableOpacity>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: 3,
  },
  day: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 9,
    borderRadius: 11,
    gap: 3,
  },
  daySelected: {
    backgroundColor: Colors.sageBase,
  },
  dayLabel: {
    fontSize: 9,
    fontWeight: '700',
    color: Colors.warmMuted,
    textTransform: 'uppercase',
    letterSpacing: 0.3,
  },
  dayLabelSelected: {
    color: 'rgba(255,255,255,0.65)',
  },
  dayNumber: {
    fontSize: 14,
    fontWeight: '700',
    color: Colors.warmText,
  },
  dayNumberSelected: {
    color: '#FFFFFF',
  },
  dot: {
    width: 4,
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.sageBase,
  },
  dotSelected: {
    backgroundColor: 'rgba(255,255,255,0.6)',
  },
});
```

- [ ] **Vérifier que les autres usages de WeekStrip compilent** (props `onDayPress` est gardé) :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | grep -i weekstrip
```

Expected : aucune ligne de sortie (pas d'erreur WeekStrip).

- [ ] **Commit** :

```bash
git add apps/mobile/components/WeekStrip.tsx
git commit -m "feat(mobile): WeekStrip — add selectedDate + onDayChange, keep onDayPress compat"
```

---

## Task 4 — Hook useAppointmentsByDate

**Files:**
- Create: `apps/mobile/hooks/useAppointmentsByDate.ts`

Ce hook est un wrapper mince autour du `useAppointments(from, to)` existant. Il construit les bornes ISO du jour cible.

- [ ] **Créer** `apps/mobile/hooks/useAppointmentsByDate.ts` :

```typescript
import { useAppointments } from './useAppointments';

export interface DayAppointment {
  id: string;
  scheduledAt: string;
  duration: number;
  status: 'scheduled' | 'confirmed' | 'cancelled' | 'completed' | 'no_show';
  patient: { id: string; name: string };
  type?: string;
  modality?: 'in_person' | 'online';
}

export function useAppointmentsByDate(date: Date) {
  const from = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
  const to = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

  const query = useAppointments(from, to);

  const appointments: DayAppointment[] = (query.data ?? [])
    .filter((a) => a.status !== 'cancelled')
    .sort((a, b) => new Date(a.scheduledAt).getTime() - new Date(b.scheduledAt).getTime());

  return { ...query, appointments };
}
```

- [ ] **Vérifier TypeScript** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected : 0 erreurs.

- [ ] **Commit** :

```bash
git add apps/mobile/hooks/useAppointmentsByDate.ts
git commit -m "feat(mobile): add useAppointmentsByDate hook"
```

---

## Task 5 — Composant DashboardHeader

**Files:**
- Create: `apps/mobile/components/DashboardHeader.tsx`

Header gradient sauge avec salutation, date, badge notif, et 3 stats inline.

- [ ] **Créer** `apps/mobile/components/DashboardHeader.tsx` :

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors } from '@/constants/colors';
import { IconBell, IconAdd } from '@/components/icons/AppIcons';

const DAYS_FR = ['Dim.', 'Lun.', 'Mar.', 'Mer.', 'Jeu.', 'Ven.', 'Sam.'];
const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];

function formatDateFR(d: Date): string {
  return `${DAYS_FR[d.getDay()]} ${d.getDate()} ${MONTHS_FR[d.getMonth()]}`;
}

interface DashboardHeaderProps {
  firstName: string;
  todayCount: number;
  activePatients: number;
  sessionsThisMonth: number;
  unreadCount: number;
  onBellPress: () => void;
  onAddPress: () => void;
}

export function DashboardHeader({
  firstName,
  todayCount,
  activePatients,
  sessionsThisMonth,
  unreadCount,
  onBellPress,
  onAddPress,
}: DashboardHeaderProps) {
  return (
    <LinearGradient
      colors={[Colors.sageBase, Colors.sageDark]}
      start={{ x: 0, y: 0 }}
      end={{ x: 1, y: 1 }}
      style={styles.container}
    >
      <View style={styles.topRow}>
        <View>
          <Text style={styles.greeting}>Bonjour {firstName} 👋</Text>
          <Text style={styles.date}>{formatDateFR(new Date())}</Text>
        </View>
        <View style={styles.actions}>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onBellPress}
            accessibilityLabel={`Notifications, ${unreadCount} non lues`}
            accessibilityRole="button"
          >
            <IconBell size={18} color="rgba(255,255,255,0.85)" />
            {unreadCount > 0 && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>
                  {unreadCount > 9 ? '9+' : unreadCount}
                </Text>
              </View>
            )}
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.actionBtn}
            onPress={onAddPress}
            accessibilityLabel="Nouveau rendez-vous"
            accessibilityRole="button"
          >
            <IconAdd size={18} color="rgba(255,255,255,0.85)" />
          </TouchableOpacity>
        </View>
      </View>

      <View style={styles.statsRow}>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{todayCount}</Text>
          <Text style={styles.statLabel}>RDV auj.</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{activePatients}</Text>
          <Text style={styles.statLabel}>Patients</Text>
        </View>
        <View style={styles.stat}>
          <Text style={styles.statVal}>{sessionsThisMonth}</Text>
          <Text style={styles.statLabel}>Séances/mois</Text>
        </View>
      </View>
    </LinearGradient>
  );
}

const styles = StyleSheet.create({
  container: {
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 16,
    gap: 14,
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  greeting: {
    fontSize: 20,
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.4,
  },
  date: {
    fontSize: 12,
    fontFamily: 'DMSans_400Regular',
    color: 'rgba(255,255,255,0.55)',
    marginTop: 2,
  },
  actions: {
    flexDirection: 'row',
    gap: 8,
  },
  actionBtn: {
    width: 36,
    height: 36,
    borderRadius: 11,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: '#F97316',
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
    borderWidth: 1.5,
    borderColor: Colors.sageBase,
  },
  badgeText: {
    color: '#FFF',
    fontSize: 9,
    fontWeight: '700',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 8,
  },
  stat: {
    flex: 1,
    backgroundColor: 'rgba(255,255,255,0.13)',
    borderRadius: 10,
    paddingVertical: 9,
    paddingHorizontal: 10,
    alignItems: 'flex-start',
  },
  statVal: {
    fontSize: 22,
    fontFamily: 'DMSans_700Bold',
    color: '#FFFFFF',
    letterSpacing: -0.5,
    lineHeight: 26,
  },
  statLabel: {
    fontSize: 9,
    fontFamily: 'DMSans_500Medium',
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: 0.4,
    marginTop: 2,
  },
});
```

- [ ] **Vérifier TypeScript** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected : 0 erreurs.

- [ ] **Commit** :

```bash
git add apps/mobile/components/DashboardHeader.tsx
git commit -m "feat(mobile): add DashboardHeader component with sauge gradient + stats"
```

---

## Task 6 — Composant DayTimeline

**Files:**
- Create: `apps/mobile/components/DayTimeline.tsx`

Vue horaire des RDV du jour. Affiche les RDV triés + des créneaux libres entre eux. État vide si aucun RDV.

- [ ] **Créer** `apps/mobile/components/DayTimeline.tsx` :

```typescript
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { Colors } from '@/constants/colors';
import type { DayAppointment } from '@/hooks/useAppointmentsByDate';

function formatHHMM(iso: string): string {
  const d = new Date(iso);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function addMinutes(iso: string, minutes: number): string {
  return new Date(new Date(iso).getTime() + minutes * 60_000).toISOString();
}

function getInitials(name: string): string {
  return name
    .split(' ')
    .map((p) => p[0] ?? '')
    .slice(0, 2)
    .join('')
    .toUpperCase();
}

const AVATAR_COLORS = [Colors.sageBase, Colors.sageDark, Colors.sageLight, '#3B82F6', '#7C3AED'];

function avatarColor(id: string): string {
  let hash = 0;
  for (let i = 0; i < id.length; i++) hash = (hash * 31 + id.charCodeAt(i)) & 0xffff;
  return AVATAR_COLORS[hash % AVATAR_COLORS.length] ?? Colors.sageBase;
}

interface DayTimelineProps {
  appointments: DayAppointment[];
  isLoading: boolean;
  onAppointmentPress: (patientId: string) => void;
  onSchedulePress: () => void;
}

export function DayTimeline({ appointments, isLoading, onAppointmentPress, onSchedulePress }: DayTimelineProps) {
  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator color={Colors.sageBase} />
      </View>
    );
  }

  if (appointments.length === 0) {
    return (
      <View style={styles.empty}>
        <Text style={styles.emptyIcon}>🌿</Text>
        <Text style={styles.emptyTitle}>Journée libre</Text>
        <Text style={styles.emptySubtitle}>Aucun rendez-vous ce jour</Text>
        <TouchableOpacity
          style={styles.scheduleBtn}
          onPress={onSchedulePress}
          accessibilityLabel="Planifier un rendez-vous"
        >
          <Text style={styles.scheduleBtnText}>+ Planifier un RDV</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const rows: Array<{ type: 'appt'; appt: DayAppointment } | { type: 'free'; time: string }> = [];

  appointments.forEach((appt, i) => {
    rows.push({ type: 'appt', appt });
    if (i < appointments.length - 1) {
      const endOfCurrent = addMinutes(appt.scheduledAt, appt.duration);
      const startOfNext = appointments[i + 1]!.scheduledAt;
      if (new Date(startOfNext).getTime() - new Date(endOfCurrent).getTime() > 15 * 60_000) {
        rows.push({ type: 'free', time: endOfCurrent });
      }
    }
  });

  return (
    <View style={styles.list}>
      {rows.map((row, i) => {
        if (row.type === 'free') {
          return (
            <View key={`free-${i}`} style={styles.slot}>
              <Text style={styles.slotTime}>{formatHHMM(row.time)}</Text>
              <View style={styles.slotLine} />
              <View style={styles.freeCard}>
                <Text style={styles.freeText}>créneau libre</Text>
              </View>
            </View>
          );
        }

        const { appt } = row;
        const isOnline = appt.type === 'online' || appt.modality === 'online';
        const borderColor = isOnline ? '#3B82F6' : Colors.sageBase;
        const badgeStyle = isOnline ? styles.badgeOnline : styles.badgeConfirmed;
        const badgeTextStyle = isOnline ? styles.badgeTextOnline : styles.badgeTextConfirmed;
        const badgeLabel = isOnline ? 'Visio' : appt.status === 'confirmed' ? 'Confirmé' : 'Planifié';

        return (
          <View key={appt.id} style={styles.slot}>
            <Text style={styles.slotTime}>{formatHHMM(appt.scheduledAt)}</Text>
            <View style={styles.slotLine} />
            <TouchableOpacity
              style={[styles.apptCard, { borderLeftColor: borderColor }]}
              onPress={() => onAppointmentPress(appt.patient.id)}
              activeOpacity={0.75}
              accessibilityLabel={`${appt.patient.name} à ${formatHHMM(appt.scheduledAt)}`}
            >
              <View style={[styles.avatar, { backgroundColor: avatarColor(appt.patient.id) }]}>
                <Text style={styles.avatarText}>{getInitials(appt.patient.name)}</Text>
              </View>
              <View style={styles.apptInfo}>
                <Text style={styles.apptName} numberOfLines={1}>{appt.patient.name}</Text>
                <Text style={styles.apptSub}>{appt.duration} min · {isOnline ? 'visio' : 'cabinet'}</Text>
              </View>
              <View style={[styles.badge, badgeStyle]}>
                <Text style={[styles.badgeText, badgeTextStyle]}>{badgeLabel}</Text>
              </View>
            </TouchableOpacity>
          </View>
        );
      })}
    </View>
  );
}

const styles = StyleSheet.create({
  list: { gap: 6 },
  centered: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingVertical: 40 },
  empty: { alignItems: 'center', paddingVertical: 40, gap: 8 },
  emptyIcon: { fontSize: 36 },
  emptyTitle: { fontSize: 16, fontFamily: 'DMSans_700Bold', color: Colors.warmText },
  emptySubtitle: { fontSize: 13, color: Colors.warmMuted },
  scheduleBtn: {
    marginTop: 8,
    backgroundColor: Colors.sageCard,
    borderRadius: 10,
    paddingHorizontal: 16,
    paddingVertical: 10,
  },
  scheduleBtnText: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.sageBase },
  slot: { flexDirection: 'row', alignItems: 'stretch', gap: 8, minHeight: 48 },
  slotTime: {
    width: 36,
    paddingTop: 12,
    fontSize: 10,
    fontFamily: 'DMMono_400Regular',
    color: Colors.warmMuted,
    textAlign: 'right',
    flexShrink: 0,
  },
  slotLine: { width: 1, backgroundColor: Colors.warmBorder, flexShrink: 0, marginVertical: 4 },
  freeCard: {
    flex: 1,
    borderRadius: 10,
    borderWidth: 1.5,
    borderStyle: 'dashed',
    borderColor: Colors.warmBorder,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 36,
    marginVertical: 2,
  },
  freeText: { fontSize: 11, color: '#C4BAB4', fontFamily: 'DMSans_400Regular' },
  apptCard: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    backgroundColor: '#FFFFFF',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.warmBorder,
    borderLeftWidth: 3,
    paddingHorizontal: 10,
    paddingVertical: 9,
    marginVertical: 2,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.04,
    shadowRadius: 3,
    elevation: 1,
  },
  avatar: {
    width: 30,
    height: 30,
    borderRadius: 9,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  avatarText: { fontSize: 10, fontWeight: '700', color: '#FFF' },
  apptInfo: { flex: 1 },
  apptName: { fontSize: 13, fontFamily: 'DMSans_600SemiBold', color: Colors.warmText },
  apptSub: { fontSize: 10, color: Colors.warmMuted, marginTop: 1 },
  badge: { borderRadius: 6, paddingHorizontal: 7, paddingVertical: 3, flexShrink: 0 },
  badgeText: { fontSize: 9, fontWeight: '700' },
  badgeConfirmed: { backgroundColor: Colors.sageCard },
  badgeTextConfirmed: { color: Colors.sageBase },
  badgeOnline: { backgroundColor: '#EFF6FF' },
  badgeTextOnline: { color: '#3B82F6' },
});
```

- [ ] **Vérifier TypeScript** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -20
```

Expected : 0 erreurs.

- [ ] **Commit** :

```bash
git add apps/mobile/components/DayTimeline.tsx
git commit -m "feat(mobile): add DayTimeline component — hourly appointments view"
```

---

## Task 7 — Rebuild Dashboard (index.tsx)

**Files:**
- Rebuild: `apps/mobile/app/(tabs)/index.tsx`

Assemblage final de tous les composants. Remplace complètement l'ancienne implémentation.

- [ ] **Remplacer le contenu entier** de `apps/mobile/app/(tabs)/index.tsx` par :

```typescript
import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  StyleSheet,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Colors } from '@/constants/colors';
import { DashboardHeader } from '@/components/DashboardHeader';
import { WeekStrip } from '@/components/WeekStrip';
import { DayTimeline } from '@/components/DayTimeline';
import { ProfileSheet } from '@/components/ProfileSheet';
import { NotificationDrawer } from '@/components/NotificationDrawer';
import { useAuthStore } from '@/store/auth.store';
import { useDashboardStats, useTodayAppointments } from '@/hooks/useDashboard';
import { useUnreadCount } from '@/hooks/useNotifications';
import { useAppointmentsByDate } from '@/hooks/useAppointmentsByDate';

const MONTHS_FR = ['janvier', 'février', 'mars', 'avril', 'mai', 'juin',
  'juillet', 'août', 'septembre', 'octobre', 'novembre', 'décembre'];
const DAYS_LONG = ['Dimanche', 'Lundi', 'Mardi', 'Mercredi', 'Jeudi', 'Vendredi', 'Samedi'];

function formatSectionLabel(date: Date): string {
  return `${DAYS_LONG[date.getDay()]} ${date.getDate()} ${MONTHS_FR[date.getMonth()]}`;
}

export default function DashboardScreen() {
  const router = useRouter();
  const { name } = useAuthStore();
  const unreadCount = useUnreadCount();

  const [selectedDate, setSelectedDate] = useState<Date>(new Date());
  const [profileVisible, setProfileVisible] = useState(false);
  const [notifVisible, setNotifVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);

  const { data: stats, refetch: refetchStats } = useDashboardStats();
  const { data: todayAppts, refetch: refetchToday } = useTodayAppointments();
  const { appointments, isLoading: apptLoading, refetch: refetchAppts } = useAppointmentsByDate(selectedDate);

  const firstName = name ? name.split(' ')[0] ?? 'Psy' : 'Psy';

  const weekAppointmentDates = useMemo(() => {
    if (!todayAppts) return new Set<string>();
    return new Set(todayAppts.map((a) => new Date(a.scheduledAt).toDateString()));
  }, [todayAppts]);

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchStats(), refetchToday(), refetchAppts()]);
    setRefreshing(false);
  };

  return (
    <SafeAreaView style={styles.safeArea} edges={['top']}>
      <DashboardHeader
        firstName={firstName}
        todayCount={todayAppts?.length ?? 0}
        activePatients={stats?.activePatients ?? 0}
        sessionsThisMonth={stats?.sessionsThisMonth ?? 0}
        unreadCount={unreadCount}
        onBellPress={() => setNotifVisible(true)}
        onAddPress={() => router.push('/(tabs)/sessions/new')}
      />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.content}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={Colors.sageBase}
          />
        }
      >
        {/* Week strip */}
        <View style={styles.weekContainer}>
          <WeekStrip
            appointmentDates={weekAppointmentDates}
            selectedDate={selectedDate}
            onDayChange={setSelectedDate}
          />
        </View>

        {/* Section label */}
        <View style={styles.sectionRow}>
          <Text style={styles.sectionTitle}>{formatSectionLabel(selectedDate)}</Text>
          <View style={styles.countBadge}>
            <Text style={styles.countText}>{appointments.length} RDV</Text>
          </View>
        </View>

        {/* Day timeline */}
        <DayTimeline
          appointments={appointments}
          isLoading={apptLoading}
          onAppointmentPress={(patientId) => router.push(`/(tabs)/patients/${patientId}`)}
          onSchedulePress={() => router.push('/(tabs)/sessions/new')}
        />
      </ScrollView>

      {/* FAB */}
      <TouchableOpacity
        style={styles.fab}
        onPress={() => router.push('/(tabs)/sessions/new')}
        accessibilityLabel="Nouveau rendez-vous"
        accessibilityRole="button"
        activeOpacity={0.85}
      >
        <View style={styles.fabIcon} />
      </TouchableOpacity>

      <ProfileSheet visible={profileVisible} onClose={() => setProfileVisible(false)} />
      <NotificationDrawer
        visible={notifVisible}
        onClose={() => setNotifVisible(false)}
        notifications={[]}
        onMarkAllRead={() => {}}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: { flex: 1, backgroundColor: Colors.sageBase },
  scroll: { flex: 1, backgroundColor: Colors.cream },
  content: { padding: 14, gap: 12, paddingBottom: 80 },
  weekContainer: {
    backgroundColor: Colors.cream,
    borderRadius: 14,
    paddingVertical: 6,
  },
  sectionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontSize: 14,
    fontFamily: 'DMSans_700Bold',
    color: Colors.warmText,
  },
  countBadge: {
    backgroundColor: Colors.sageCard,
    borderRadius: 8,
    paddingHorizontal: 9,
    paddingVertical: 3,
  },
  countText: {
    fontSize: 11,
    fontFamily: 'DMSans_600SemiBold',
    color: Colors.sageBase,
  },
  fab: {
    position: 'absolute',
    bottom: 68,
    right: 16,
    width: 48,
    height: 48,
    borderRadius: 16,
    backgroundColor: Colors.sageBase,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: Colors.sageBase,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.4,
    shadowRadius: 10,
    elevation: 6,
  },
  fabIcon: {
    width: 18,
    height: 2,
    backgroundColor: '#FFF',
    borderRadius: 1,
  },
});
```

> Note : Le FAB "+" est rendu via le `fabIcon` (barre horizontale). Pour l'icône "+" complète (croix), on peut superposer une barre verticale via `::after` — mais en React Native on utilise directement `<IconAdd>`. Remplacer le `<View style={styles.fabIcon} />` par :
> ```typescript
> import { IconAdd } from '@/components/icons/AppIcons';
> // dans le JSX :
> <IconAdd size={22} color="#FFF" />
> ```

- [ ] **Appliquer la correction FAB** dans le fichier — remplacer le `<View style={styles.fabIcon} />` par `<IconAdd size={22} color="#FFF" />` et ajouter l'import `IconAdd`.

- [ ] **Vérifier TypeScript** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1 | head -30
```

Expected : 0 erreurs.

- [ ] **Commit** :

```bash
git add apps/mobile/app/(tabs)/index.tsx
git commit -m "feat(mobile): rebuild dashboard — sauge palette, DayTimeline, WeekStrip selector, bottom tab bar"
```

---

## Task 8 — Vérification finale & build

- [ ] **TypeScript complet** :

```bash
cd apps/mobile && npx tsc --noEmit 2>&1
```

Expected : 0 erreurs.

- [ ] **Lancer l'app** sur émulateur/device Android :

```bash
cd apps/mobile && npx expo start --android
```

**Test manuel checklist :**
- [ ] Dashboard s'ouvre : header sauge visible, stats affichées
- [ ] Bottom tab bar visible avec 4 onglets (Accueil, Patients, Agenda, Plus)
- [ ] WeekStrip : tap sur un autre jour → section label et timeline changent
- [ ] DayTimeline : les RDV du jour s'affichent avec avatar, nom, badge
- [ ] Créneau libre visible entre 2 RDV éloignés de >15 min
- [ ] Journée sans RDV : état vide "Journée libre" + bouton "Planifier un RDV"
- [ ] FAB sauge visible en bas à droite
- [ ] Tap sur un RDV → navigue vers la fiche patient
- [ ] Pull-to-refresh fonctionne
- [ ] Badge notif apparaît si notifications non lues
- [ ] Les autres onglets (Patients, Agenda) fonctionnent normalement — pas de régression

- [ ] **Commit final si correctifs** :

```bash
git add -p
git commit -m "fix(mobile): dashboard post-review adjustments"
```

---

## Self-Review

**Spec coverage :**
- ✅ §3.1 Header sauge → Task 5 (DashboardHeader)
- ✅ §3.2 WeekStrip sélecteur → Task 3
- ✅ §3.3 Section label → Task 7 (index.tsx, `formatSectionLabel`)
- ✅ §3.4 DayTimeline → Task 6
- ✅ §3.5 FAB flottant → Task 7 (index.tsx)
- ✅ §3.6 Bottom Tab Bar → Task 2 (_layout.tsx)
- ✅ §4 Tokens couleur → Task 1
- ✅ §6 useAppointmentsByDate → Task 4
- ✅ §7 Comportements interactifs → Task 7 + Task 8 test checklist
- ✅ §8 Pas de régression autres écrans → tokens addifs, `onDayPress` compat gardé

**Types cohérents :**
- `DayAppointment` défini dans `useAppointmentsByDate.ts`, importé dans `DayTimeline.tsx` ✅
- `useAppointmentsByDate(date: Date)` retourne `{ appointments, isLoading, refetch }` — utilisé exactement ainsi dans `index.tsx` ✅
- `WeekStrip` props `selectedDate?: Date` + `onDayChange?: (date: Date) => void` — utilisés dans `index.tsx` ✅
- `DashboardHeader` props nommées = props passées dans `index.tsx` ✅
