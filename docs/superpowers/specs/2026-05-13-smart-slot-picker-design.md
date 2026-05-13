# Smart Slot Picker — Design Spec

**Date:** 2026-05-13
**Statut:** Draft

## Problème

Le bouton "Nouvelle séance" du dashboard ouvre un formulaire basique (`/dashboard/sessions/new`) qui crée une `Session` (enregistrement passé) avec un champ date/heure manuel. Le psy n'a aucune visibilité sur ses créneaux libres et doit basculer entre le calendrier et le formulaire.

## Solution

Remplacer le flow "Nouvelle séance" par un **dialog modal en 2 étapes** avec un sélecteur de créneaux intelligent qui exploite la méthode `getAvailableTimeslots()` déjà implémentée dans `AvailabilityService`.

Le dialog crée un **Appointment** (RDV futur visible sur le calendrier) au lieu d'une Session. L'ancien formulaire `/dashboard/sessions/new` qui crée des Sessions n'est plus le flow par défaut — il reste accessible comme fallback pour enregistrer une séance passée non planifiée.

## Backend — Nouvel endpoint nécessaire

La méthode `getAvailableTimeslots()` existe déjà dans `AvailabilityService` mais n'est exposée qu'en public via `PublicBookingService` (`GET /public/psy/:slug/slots`). Il faut un endpoint **authentifié** pour le psy.

### Nouveau endpoint

```
GET /availability/timeslots?from=2026-05-13&to=2026-06-12&duration=50
```

- **Controller :** `AvailabilityController` (ajouter une méthode)
- **Auth :** JWT required (`@UseGuards(JwtAuthGuard)`)
- **Params :** `from` (date ISO), `to` (date ISO), `duration` (minutes, défaut 50)
- **Validation :** max 30 jours de plage, `from` >= aujourd'hui, `duration` entre 15 et 480
- **Response :** `string[]` — tableau de timestamps ISO UTC (identique au format retourné par `getAvailableTimeslots()`)
- **Implémentation :** résoudre le `psychologist` via `getPsychologist(user.sub)` (le JWT `sub` est le Keycloak user ID, pas le Prisma psychologist ID), puis appeler `this.availabilityService.getAvailableTimeslots(psy.id, from, to, duration)`

## Frontend — Design

### Conteneur

- **Dialog modal** (shadcn `Dialog`) centré, largeur max 640px (desktop), full-width mobile
- 2 étapes avec barre de progression visuelle
- Breakpoint stack 1 colonne : quand la largeur du dialog < 480px (responsive interne)

### Points d'entrée — tous ouvrent le même dialog

| Emplacement | Composant actuel | Changement |
|---|---|---|
| Dashboard quick action "Nouvelle séance" | `<Link href="/sessions/new">` | → `onClick` ouvre `SmartSlotPickerDialog` |
| Mobile FAB "+" | `mobile-nav.tsx` lien `/sessions/new` | → `onClick` ouvre le dialog |
| Fiche patient "Nouvelle séance" | `patient-detail.tsx` bouton | → `onClick` ouvre le dialog, patient pré-sélectionné |
| Liste sessions "Nouvelle séance" | `sessions-page.tsx` bouton | → `onClick` ouvre le dialog |

Le dialog accepte une prop optionnelle `defaultPatientId?: string` pour pré-sélectionner le patient quand ouvert depuis la fiche patient.

La page `/dashboard/sessions/new` est conservée telle quelle comme accès direct pour enregistrer une séance passée. Elle n'est plus liée depuis les boutons "Nouvelle séance".

### State management du dialog

Le dialog est contrôlé par un état global Zustand (`ui.store.ts`) :
```ts
smartSlotPickerOpen: boolean
smartSlotPickerDefaultPatientId: string | null
openSmartSlotPicker: (patientId?: string) => void
closeSmartSlotPicker: () => void
```

Cela permet d'ouvrir le dialog depuis n'importe quel composant sans prop drilling.

### Étape 1 — Patient, durée et créneau

**Layout :** Formulaire vertical, puis grille 2 colonnes (mini-calendrier | pills créneaux). Sur mobile : stack vertical.

1. **Sélecteur patient** — Combobox searchable (réutiliser le pattern de `CreateAppointmentDialog` : `usePatients` avec limit 200). Pré-sélectionné si `defaultPatientId` fourni.
2. **Sélecteur durée** — Pill buttons : 30, 45, 50 (défaut), 60, 90, 120 min. Quand la durée change, les créneaux sont recalculés (re-fetch) et la sélection courante est resetée.
3. **Mini-calendrier** (colonne gauche ~210px) :
   - Mois courant avec navigation ← →
   - Jours avec créneaux libres = fond vert clair (`bg-green-50 rounded-full`)
   - Jours sans dispo = style normal (pas grisés, juste sans indicateur vert)
   - Jours passés = grisés + non-cliquables
   - Clic sur un jour → affiche les pills à droite
   - Par défaut, sélectionne automatiquement le **premier jour avec des créneaux libres**
4. **Pills de créneaux** (colonne droite) :
   - Titre : "Mardi 13 mai" + sous-titre "4 créneaux disponibles"
   - Pills cliquables avec les heures (format HH:mm, timezone Europe/Paris)
   - Pill sélectionnée = `border-2 border-primary bg-primary/5 font-semibold text-primary`
   - Pill non sélectionnée = `bg-surface border border-border`
   - Si aucun créneau ce jour = "Pas de créneaux disponibles ce jour"
5. **Résumé sélection** — Bandeau conditionnel (affiché seulement si un créneau est sélectionné) : icône point vert + "Mardi 13 mai à 09:00 — 50 min"
6. **Boutons** : Annuler | Suivant → (désactivé tant que patient + créneau non sélectionnés — cela garantit que `patientId` est toujours fourni à l'API qui le requiert)

**Data flow :**

```ts
// Hook React Query
function useAvailableTimeslots(from: string, to: string, duration: number) {
  return useQuery({
    queryKey: ['available-timeslots', from, to, duration],
    queryFn: () => availabilityApi.getTimeslots(from, to, duration),
    staleTime: 30_000, // 30s — les dispos changent rarement
  })
}
```

- **Au montage** : fetch `from=today` `to=today+30days` `duration=50`
- **Changement durée** : nouveau fetch avec même plage, nouvelle durée. React Query gère le cache par query key.
- **Navigation mois suivant** : fetch `from=firstDayOfMonth` `to=lastDayOfMonth`. Chaque mois est un query key séparé, React Query cache les mois déjà chargés.
- **Timezone** : les timestamps UTC retournés par l'API sont convertis en `Europe/Paris` côté frontend avec `Intl.DateTimeFormat('fr-FR', { timeZone: 'Europe/Paris' })` pour l'affichage et le regroupement par jour.

**API client** (nouveau fichier `apps/web/src/lib/api/availability.ts`) :
```ts
export const availabilityApi = {
  getTimeslots: (from: string, to: string, duration: number): Promise<string[]> =>
    fetchApi(`/availability/timeslots?from=${from}&to=${to}&duration=${duration}`),
}
```

### Étape 2 — Options de la séance

**Layout :** Formulaire vertical.

1. **Récap** — Bandeau avec avatar initiales patient + nom + créneau + durée + bouton "Modifier" (retour étape 1 sans perdre les options remplies)
2. **Consultation en visio** — Toggle switch (comme dans `CreateAppointmentDialog`). Maps to `isOnline: boolean` sur l'appointment. Si activé et type groupe, affiche le sélecteur de participants additionnels.
3. **Tarif** — Input numérique, pré-rempli avec `psychologist.defaultSessionRate`
4. **Mode de paiement** — Radio buttons :
   - Pas de paiement en ligne (défaut) → `paymentMode: 'none'`
   - Prépaiement (lien envoyé au patient) → `paymentMode: 'prepayment'`
   - Après la séance → `paymentMode: 'post_session'`
   - Si prépaiement ou après séance : champ montant visible (pré-rempli avec le tarif)
5. **Motif / Notes préliminaires** — Textarea optionnel, placeholder "Objectifs de la séance, points à aborder...". Stocké dans le champ `reason` (String?) existant sur le modèle `Appointment`.
   - Le `CreateAppointmentDto` doit être mis à jour pour accepter `reason?: string`.
6. **Boutons** : ← Retour | Planifier la séance (bouton accent `#0D9488`)

**On submit :**
- Appelle `POST /appointments` avec : `{ patientId, scheduledAt, duration, isOnline, paymentMode, paymentAmount, reason }`
- Si visio + participants additionnels : `POST /appointments/group` avec le `patientId` de l'étape 1 comme patient principal + `participantIds` pour les participants additionnels
- Invalidate queries : `['appointments']`, `['dashboard']`
- Toast succès : "Séance planifiée le [date] à [heure]"
- Fermeture dialog

### Gestion des états

| État | Comportement |
|---|---|
| **Loading timeslots** | Skeleton shimmer sur la zone pills (3 rectangles gris animés). Mini-calendrier affiche le mois sans indicateurs verts. |
| **Erreur API** | Message inline "Impossible de charger les créneaux" + bouton "Réessayer" |
| **Aucune disponibilité configurée** (0 résultats + psy n'a aucun slot availability) | Message "Configurez vos disponibilités" + lien vers `/dashboard/calendar` |
| **Tous créneaux pris** (0 résultats mais des availability existent) | Message "Aucun créneau disponible dans les 30 prochains jours" + suggestion "Essayez une durée plus courte" |
| **Aucun patient** | Combobox vide + message "Ajoutez un patient d'abord" |
| **Re-fetch après changement durée** | Pills passent en loading, sélection courante resetée |

### Palette / Design tokens

| Élément | Token |
|---|---|
| Sélection active, boutons | `#3D52A0` (primary) |
| Bouton confirmer | `#0D9488` (accent) |
| Fond pills non sélectionnées | `#F1F0F9` (surface) |
| Jour avec dispo (mini-cal) | `bg-green-50` cercle |
| Jour sélectionné (mini-cal) | `bg-primary text-white rounded-full` |
| Bandeau résumé | `bg-[#F8F7FF] border-[#E8E6F0]` |
| Texte principal | `#1E1B4B` (text) |

### Fichiers à créer / modifier

**Nouveaux fichiers :**
- `apps/web/src/components/sessions/smart-slot-picker-dialog.tsx` — Dialog principal + logique 2 étapes
- `apps/web/src/components/sessions/mini-calendar.tsx` — Composant mini-calendrier mensuel
- `apps/web/src/components/sessions/time-slot-pills.tsx` — Composant pills de créneaux
- `apps/web/src/lib/api/availability.ts` — Client API timeslots

**Fichiers modifiés :**
- `apps/web/src/store/ui.store.ts` — Créer le fichier (le dossier store existe mais est vide) avec l'état dialog
- `apps/web/src/app/(dashboard)/page.tsx` — Dashboard : bouton ouvre dialog au lieu de naviguer
- `apps/web/src/components/layouts/mobile-nav.tsx` — FAB ouvre dialog
- `apps/web/src/components/patients/patient-detail.tsx` — Bouton ouvre dialog avec patientId
- `apps/web/src/components/sessions/sessions-page.tsx` — Bouton ouvre dialog
- `apps/web/src/app/(dashboard)/layout.tsx` — Monter `SmartSlotPickerDialog` dans le layout dashboard
- `apps/api/src/availability/availability.controller.ts` — Nouvel endpoint `GET /availability/timeslots`
- `apps/api/src/appointments/dto/create-appointment.dto.ts` — Ajouter `reason` optionnel

### Relation avec `CreateAppointmentDialog`

Le `CreateAppointmentDialog` du calendrier **reste inchangé**. Il sert pour la création rapide depuis la vue calendrier (clic sur un créneau horaire dans la grille). Le `SmartSlotPickerDialog` est le flow optimisé pour créer un RDV quand on n'est PAS dans la vue calendrier. Les deux créent des `Appointment` via la même API.

À terme, le `CreateAppointmentDialog` pourrait intégrer le même sélecteur de créneaux, mais c'est hors scope de cette itération.
