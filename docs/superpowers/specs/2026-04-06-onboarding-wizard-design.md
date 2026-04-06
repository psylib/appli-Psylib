# Onboarding Wizard — Design Spec

**Date:** 2026-04-06
**Status:** Approved
**Scope:** Refactor onboarding wizard from centered card to split-screen layout with Framer Motion animations

---

## Context

The onboarding wizard exists and is functional (5 steps, Zod validation, API integration, progress tracking). This spec covers a visual upgrade: split-screen layout (consistent with the login page) and polished animations via Framer Motion.

**Existing files touched:**
- `apps/web/src/components/onboarding/onboarding-wizard.tsx` — full rewrite
- `apps/web/src/app/onboarding/layout.tsx` — simplify to bare wrapper (remove header + `max-w-lg` constraint; the split-screen shell moves into the wizard component)
- `apps/web/src/app/onboarding/[step]/page.tsx` — no changes needed

**New dependencies:** `framer-motion`, `canvas-confetti`, `@types/canvas-confetti` (installed in `apps/web`)

**Backend:** No changes — all endpoints already exist (`PUT /onboarding/profile`, `POST /onboarding/steps/:step/complete`, `POST /onboarding/complete`).

**Known backend gap:** The backend considers onboarding complete only when all 5 steps including `billing` are in `stepsCompleted` (see `onboarding.service.ts:143`). The frontend wizard only covers 4 steps and never calls `/steps/billing/complete`. This means `onboardingProgress.completedAt` is never set. This is accepted as-is for now — the `markOnboarded()` method (called via `POST /onboarding/complete`) sets `isOnboarded = true` on the psychologist record, which is what the layout redirect checks. The `completedAt` field is unused.

---

## Layout

### Desktop (≥768px)
Split-screen: fixed left panel (280px) + scrollable right panel.

- **Left panel:** Dark gradient (`#3D52A0` → `#1E1B4B`), contains:
  - PsyLib logo + tagline "Votre cabinet, simplifié"
  - Vertical step navigator (4 steps with dot indicators: done=teal, active=white, pending=transparent)
  - Estimated time remaining at bottom:
    - Step 0 (profile): "≈ 3 min"
    - Step 1 (practice): "≈ 2 min"
    - Step 2 (preferences): "≈ 1 min"
    - Step 3 (first_patient): "Dernière étape !"

- **Right panel:** White background, contains:
  - Step emoji icon (👤 🏥 ⚙️ 👥)
  - Title + description
  - Form fields (animated stagger entry)
  - Navigation buttons (Back / Skip / Continue)

### Mobile (<768px)
Left panel collapses to a horizontal compact bar at the top:
- Progress dots (4 circles) + step label + "X/4"
- Form below, full width
- Navigation buttons at bottom

### Success page (step 5)
Full-width centered layout (no split-screen):
- Confetti animation (canvas-confetti)
- Success icon with bounce animation
- 3 quick action cards (Dashboard, Add patient, Configure calendar)
- Referral code input (existing functionality preserved)

---

## Steps Content

### Step 1: Profil praticien (👤)
| Field | Type | Validation | Required |
|---|---|---|---|
| Nom complet | Input text | min 2 chars | Yes |
| Spécialisation | Input text | — | No |
| Numéro ADELI | Input text | — | No |
| Bio courte | Textarea | — | No |

API: `PUT /onboarding/profile` with `{ name, specialization, adeliNumber, bio }`

> Note: Step 1 does NOT need a separate `/steps/profile/complete` call — the backend's `updateProfile()` method auto-marks the `profile` step as complete.

### Step 2: Votre cabinet (🏥)
| Field | Type | Validation | Required |
|---|---|---|---|
| Adresse du cabinet | Input text | — | No |
| Téléphone professionnel | Input tel | — | No |

Includes tip box: "Vous pourrez ajouter plusieurs lieux de consultation plus tard."

API: `PUT /onboarding/profile` with `{ address, phone }` → then `POST /onboarding/steps/practice/complete`

### Step 3: Préférences de séance (⚙️)
| Field | Type | Default | Validation |
|---|---|---|---|
| Durée par défaut | Chip selector (30/45/50/60/90 min) | 50 | 15–120 |
| Tarif par séance | Input number + "€/séance" | 80 | ≥ 0 |

Chip selector replaces the current number input for duration — faster interaction.

Hint text: "La durée la plus courante chez les psychologues est 50 min"

API: `PUT /onboarding/profile` with `{ defaultSessionDuration, defaultSessionRate }` → then `POST /onboarding/steps/preferences/complete`

### Step 4: Premier patient (👥)
| Field | Type | Validation | Required |
|---|---|---|---|
| Prénom et nom | Input text | — | No |
| Email | Input email | valid email or empty | No |

This step is **fully optional**. Two CTAs:
- "Passer cette étape" → skip, mark onboarding complete
- "Terminer 🎉" → create patient if name filled, mark onboarding complete

API: `POST /patients` (if name filled) → `POST /onboarding/steps/first_patient/complete` → `POST /onboarding/complete`

### Step 5: Succès (🎉)
- Confetti burst on mount (canvas-confetti, 2-second burst)
- Icon bounce animation
- 3 quick actions:
  - "Voir le dashboard" → `/dashboard`
  - "Ajouter un patient" → `/dashboard/patients/new`
  - "Configurer l'agenda" → `/dashboard/calendar` (new action, links to existing calendar page)
- Referral code input (preserved from existing code)
- "Voir le dashboard" navigates to `/dashboard`

---

## Animations (Framer Motion)

### Step transitions
```
AnimatePresence mode="wait"
- Exit: slide out left + fade (150ms)
- Enter: slide in from right + fade (200ms)
- Direction-aware: a `direction` state (1 for forward, -1 for backward) is set
  before each navigation. StepTransition uses it to choose x offset:
  initial: { x: direction * 60, opacity: 0 }
  animate: { x: 0, opacity: 1 }
  exit: { x: direction * -60, opacity: 0 }
- StepTransition receives a unique `key` prop (the step id) so AnimatePresence
  detects the change and triggers exit/enter animations.
```

### Field stagger
```
Each form field appears sequentially:
- Delay: 50ms between fields
- Animation: translateY(12px) → 0, opacity 0 → 1
- Duration: 200ms each, ease-out
```

### Progress indicator (left panel)
```
Step dots: scale spring when becoming active (0.8 → 1)
Connector lines: width animates with spring
Time remaining: fade transition
```

### Success page
```
- Icon: scale 0 → 1 with spring (bounce)
- Title: fade + translateY
- Quick actions: stagger 100ms
- Confetti: canvas-confetti burst on mount
```

### Button interactions
```
Hover: scale 1.02
Tap: scale 0.98
Loading: opacity pulse
```

---

## Component Architecture

```
onboarding-wizard.tsx (rewritten)
├── OnboardingLayout         — Split-screen shell (left + right panels)
│   ├── OnboardingSidebar    — Left panel (brand, steps nav, time)
│   └── OnboardingContent    — Right panel with AnimatePresence
│       ├── ProfileStep      — Step 1 form
│       ├── PracticeStep     — Step 2 form
│       ├── PreferencesStep  — Step 3 form (with DurationChips)
│       ├── FirstPatientStep — Step 4 form
│       └── SuccessStep      — Step 5 (confetti + actions)
│
├── DurationChips            — Chip selector component for session duration
│                              (wired via React Hook Form `Controller`, not `register`)
└── StepTransition           — Framer Motion wrapper for direction-aware slides
                               (receives `key={step}` + `direction` prop)
```

All in a single file (`onboarding-wizard.tsx`) to keep it self-contained. Sub-components are defined in the same file, not extracted into separate files (they're only used here).

---

## Dependencies

| Package | Version | Purpose |
|---|---|---|
| `framer-motion` | ^11.x | Step transitions, stagger, spring animations |
| `canvas-confetti` | ^1.9 | Success page confetti burst |
| `@types/canvas-confetti` | ^1.6 | TypeScript definitions for canvas-confetti |

All installed in `apps/web`.

---

## Mobile Responsive

Breakpoint: `768px` (Tailwind `md:`)

| Element | Desktop | Mobile |
|---|---|---|
| Left panel | 280px fixed sidebar | Collapsed to horizontal bar (h-16) |
| Step nav | Vertical list | Horizontal dots only |
| Form | Centered in right panel | Full width with padding |
| Navigation buttons | Bottom of right panel | `sticky bottom-0` within scroll container, with `bg-white` + top border + `pb-safe` for safe area. Form content has `pb-20` to avoid being obscured. |

---

## Edge Cases

- **Already onboarded:** Layout checks `isOnboarded` and redirects to `/dashboard` (existing behavior, no change).
- **API failure:** Error banner displayed below form fields and above navigation buttons, inside the right panel scroll area.
- **Browser back/forward:** URL-based routing (`/onboarding/[step]`) — works natively with Next.js.
- **Refresh mid-onboarding:** State loaded from backend progress endpoint. Form fields not pre-filled (acceptable for MVP — fields are quick to re-enter).
- **Keyboard navigation:** Tab order preserved, Enter submits current step.

---

## Out of Scope

- Pre-filling form fields from backend (would require GET per step)
- Auto-save per field (only save on "Continue")
- ADELI number validation against external API
- Multi-language support
- Avatar/photo upload during onboarding
