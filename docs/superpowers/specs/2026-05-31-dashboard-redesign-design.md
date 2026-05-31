# Dashboard Mobile Redesign — Spec

**Date:** 2026-05-31  
**Scope:** `apps/mobile` — écran dashboard uniquement  
**Approche:** Rebuild (Approche 2)

---

## 1. Contexte & Objectif

Le dashboard actuel utilise une palette bleu/lavande (`#3D52A0`), des NavPills horizontales en haut (non-standard Android), une HeroCard gradient foncé, et des KPI cards blanches. L'objectif est de le remplacer par une interface plus chaleureuse, centrée sur l'agenda journalier, avec une palette sauge naturelle.

**Résultat attendu :** L'utilisateur ouvre l'app et voit immédiatement ses RDV du jour, organisés dans une timeline horaire, avec un sélecteur de semaine pour naviguer d'un jour à l'autre.

---

## 2. Direction Design

| Décision | Valeur |
|---|---|
| Direction | Warm & Human |
| Palette primaire | Sauge / Forêt `#4A7C59` |
| Palette dark | `#3D6B4A` |
| Background | Crème `#FAFAF8` |
| Surface | `#EEF5EE` |
| Card sauge | `#E4F0E4` |
| Texte | `#1C1917` |
| Muted | `#78716C` |
| Border | `#DDE8DD` |
| Typographie | Existante (DM Sans) |
| Références | Calm, Whoop, Notion, Linear |

---

## 3. Structure du Dashboard

### 3.1 Header Sauge (remplace header blanc + HeroTodayCard)

Gradient `#4A7C59 → #3D6B4A`, padding `18px 16px`.

**Ligne 1 :** Salutation prénom + date du jour (gauche) | bouton notif + bouton "+" (droite)  
**Ligne 2 :** 3 stats inline en cards translucides :
- RDV aujourd'hui (count depuis `useTodayAppointments`)
- Patients actifs (depuis `useDashboardStats`)
- Séances ce mois (depuis `useDashboardStats`)

Nouveau composant : `components/DashboardHeader.tsx`

### 3.2 WeekStrip (amélioration du composant existant)

Sélecteur de jour horizontal, 7 jours visibles, scrollable.

- Jour actif : fond sauge, texte blanc
- Jour avec RDV : pip sauge en dessous du numéro
- Tap sur un jour → met à jour `selectedDate` (état local)
- Réutilise `components/WeekStrip.tsx` — adapter les props pour exposer `selectedDate` + `onDayChange`

### 3.3 Section label

`"Vendredi 31 mai"` (gauche) + badge `"3 RDV"` sauge (droite).

Mise à jour réactive selon le jour sélectionné dans le WeekStrip.

### 3.4 DayTimeline (nouveau composant)

`components/DayTimeline.tsx` — liste verticale des créneaux horaires du jour sélectionné.

**Chaque créneau RDV :**
- Heure à gauche (format HH:MM)
- Ligne verticale de séparation
- Card patient : avatar initiales coloré, nom complet, durée + type (cabinet/visio)
- Badge statut : sauge = confirmé, bleu = visio, orange = en attente
- Bord gauche coloré : `#4A7C59` cabinet, `#3B82F6` visio
- Tap → `router.push('/(tabs)/patients/:id')`

**Créneau libre :**
- Même structure horaire mais card en tirets `border: dashed var(--border)`
- Texte centré : `"créneau libre"`
- Ne s'affiche que si entre 2 RDV (pas après le dernier)

**Données :** `useAppointmentsByDate(selectedDate)` — nouveau hook qui filtre les appointments par date depuis l'API existante `GET /appointments?from=&to=`.

**État vide (journée sans RDV) :**
- Icône feuille + "Journée libre" centré
- Bouton "Planifier un RDV" → SmartSlotPickerDialog

### 3.5 FAB "+" flottant

Position : `bottom: 52px, right: 14px` (au-dessus de la tab bar).  
Taille : `44×44px`, `border-radius: 15px`, fond sauge, ombre `rgba(74,124,89,0.45)`.  
Action : ouvre `SmartSlotPickerDialog` (composant existant).  
Remplace les 2 boutons "Quick Actions" actuels.

### 3.6 Bottom Tab Bar (remplace NavPills)

Activation dans `(tabs)/_layout.tsx` : retirer `tabBarStyle: { display: 'none' }`.

**4 onglets :**
| Tab | Route | Icône |
|---|---|---|
| Accueil | `/(tabs)` | Home |
| Patients | `/(tabs)/patients` | Patient |
| Agenda | `/(tabs)/calendar` | Calendar |
| Plus | `/(tabs)/more` | Menu |

Style onglet actif : icône sauge + label sauge.  
Style onglet inactif : icône `#A8A29E` + label `#A8A29E`.  
Background : blanc, border-top `1px solid #DDE8DD`.

---

## 4. Nouveaux Tokens de Couleur

À ajouter dans `constants/colors.ts` (en complément, pas en remplacement) :

```typescript
// Warm — Sauge / Forêt (nouveau design dashboard)
sageBase: '#4A7C59',
sageDark: '#3D6B4A',
sageLight: '#6B9E78',
sageBg: '#F7FAF7',
sageSurface: '#EEF5EE',
sageCard: '#E4F0E4',
sageMuted: 'rgba(74,124,89,0.12)',
cream: '#FAFAF8',
stone: '#F5F4F1',
warmText: '#1C1917',
warmMuted: '#78716C',
warmBorder: '#DDE8DD',
```

Les tokens existants (`primary`, `accent`, etc.) restent inchangés — les autres écrans ne changent pas.

---

## 5. Fichiers Modifiés

| Fichier | Type | Description |
|---|---|---|
| `constants/colors.ts` | Modifié | Ajout tokens sauge/warm |
| `app/(tabs)/index.tsx` | Rebuild | Nouveau dashboard |
| `app/(tabs)/_layout.tsx` | Modifié | Activer bottom tab bar |
| `components/DashboardHeader.tsx` | Nouveau | Header sauge avec stats |
| `components/DayTimeline.tsx` | Nouveau | Vue horaire des RDV |
| `components/WeekStrip.tsx` | Modifié | Exposer `selectedDate` + `onDayChange` |
| `hooks/useAppointmentsByDate.ts` | Nouveau | Filtre appointments par date |

**Composants supprimés de l'usage dans le dashboard :** `HeroTodayCard`, `NavPills` (dans le dashboard), `KpiCard` (remplacés par les stats dans le header).  
Ces composants ne sont pas supprimés — ils peuvent être utilisés ailleurs.

---

## 6. Données & Hooks

| Hook | Source | Usage |
|---|---|---|
| `useDashboardStats()` | Existant | Stats patients + séances |
| `useTodayAppointments()` | Existant | Count RDV auj. dans header |
| `useAppointmentsByDate(date)` | Nouveau | RDV du jour sélectionné |
| `useUnreadCount()` | Existant | Badge notif |

`useAppointmentsByDate` appelle `GET /appointments?from=<startOfDay>&to=<endOfDay>` — endpoint existant.

---

## 7. Comportements Interactifs

- **Changer de jour :** tap sur WeekStrip → `selectedDate` change → DayTimeline se recharge
- **Tap RDV :** → fiche patient `/(tabs)/patients/:patientId`
- **FAB "+" :** → SmartSlotPickerDialog (avec `initialDate = selectedDate`)
- **Pull-to-refresh :** refetch stats + appointments du jour
- **Notification badge :** badge rouge sur bouton notif si `unreadCount > 0`

---

## 8. Ce qui NE Change PAS

- Écran patients (`/(tabs)/patients/`)
- Écran agenda (`/(tabs)/calendar`)
- Écran sessions
- Tous les autres écrans
- La palette des autres écrans (tokens `primary`, `accent` inchangés)
- `HeroTodayCard`, `KpiCard`, `NavPills` — conservés, juste inutilisés dans le dashboard

---

## 9. Checklist Spec Self-Review

- [x] Pas de TBD ni de sections vides
- [x] Architecture cohérente avec le code existant (hooks, router, composants)
- [x] Scope clairement limité au dashboard
- [x] Tokens nouveaux isolés pour ne pas casser les autres écrans
- [x] Données : hooks existants réutilisés, 1 seul nouveau hook
- [x] Composants existants réutilisés (WeekStrip, SmartSlotPickerDialog, PatientListItem non utilisé ici)
- [x] Pas de régression possible sur les autres tabs
