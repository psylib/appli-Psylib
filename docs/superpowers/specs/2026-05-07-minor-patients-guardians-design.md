# Minor Patients & Legal Guardians — Design Spec

**Date:** 2026-05-07
**Status:** Approved
**Scope:** Complete — guardians, portal, consent, billing, plan gating

---

## 1. Problem Statement

PsyLib has no support for minor patients. Psychologists working with children and adolescents need to:
- Distinguish minors from adult patients
- Record legal guardian contact information
- Control which guardians can access which data
- Obtain parental consent for sensitive features (AI, video)
- Route invoices and communications to guardians instead of the minor
- Handle separated parents with joint custody (different access levels per guardian)

## 2. Design Decisions

| Decision | Choice | Rationale |
|----------|--------|-----------|
| Max guardians per patient | 2 | Covers 99% of cases (2 parents or 1 parent + 1 designated guardian) |
| Guardian permissions | Configurable per guardian | Handles separated parents — parent 1 can see everything, parent 2 only invoices |
| Portal approach | Extend existing patient portal with `guardian` role | Less code duplication, consistent UX |
| Consent model | Digital in-app via signed email links | Full audit trail, RGPD-compliant, no paper needed |
| Minor detection | Explicit `isMinor` boolean flag | Not computed from birthDate because age changes over time |
| Plan gating | Tiered — Free stores info, Solo gets 1 guardian + portal, Pro/Clinic get 2 + configurable permissions | Drives upgrades while keeping basic info available to all |
| Auth mechanism | Extend existing patient custom JWT system (NOT Keycloak) | Patient portal already uses its own JWT strategy (`PatientJwtStrategy` + `PATIENT_JWT_SECRET`). Guardians follow the same pattern for consistency. |

## 3. Data Model

### 3.1 New Table: `legal_guardians`

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `patient_id` | uuid FK → patients | onDelete: Cascade |
| `user_id` | uuid FK → users (nullable) | NULL until guardian creates account |
| `psychologist_id` | uuid FK → psychologists | Tenant isolation |
| `name` | text | Full name, required |
| `email` | text | Required (used for invitations) |
| `phone` | text (nullable) | |
| `relationship` | enum | `mother` \| `father` \| `legal_guardian` \| `other` |
| `is_primary` | boolean | Primary guardian (max 1 per patient) |
| `permissions` | jsonb | `{ portal, invoices, video, documents, messaging }` |
| `created_at` | timestamp | |
| `updated_at` | timestamp | @updatedAt — tracks permission changes, userId linking |

**Constraints:**
- Max 2 guardians per patient (enforced in service layer)
- Max 1 `is_primary = true` per patient (enforced in service layer)
- `email` must not match `patient.email` (validation)
- `@@unique([patientId, email])` — prevents duplicate guardian email per patient
- Index on `(patient_id)`, `(user_id)`, `(psychologist_id)`

### 3.2 New Table: `guardian_invitations`

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK → psychologists | onDelete: Cascade |
| `guardian_id` | uuid FK → legal_guardians | onDelete: Cascade |
| `email` | text | |
| `token` | text unique | Secure random token (crypto.randomUUID) |
| `status` | enum | `pending` \| `accepted` \| `expired` |
| `expires_at` | timestamp | Default: 7 days from creation |
| `created_at` | timestamp | |

**Resend:** Calling the invite endpoint again when status = `expired` creates a new invitation record (old one stays for audit). Rate limit: max 3 invitations per guardian per 24h.

### 3.3 New Table: `guardian_consent_requests`

| Field | Type | Notes |
|-------|------|-------|
| `id` | uuid PK | |
| `psychologist_id` | uuid FK → psychologists | onDelete: Cascade |
| `guardian_id` | uuid FK → legal_guardians | onDelete: Cascade |
| `patient_id` | uuid FK → patients | onDelete: Cascade |
| `consent_type` | enum | `data_processing` \| `ai_processing` \| `video_consultation` |
| `token` | text unique | HMAC-signed token encoding guardianId + patientId + consentType |
| `status` | enum | `pending` \| `approved` \| `refused` |
| `expires_at` | timestamp | 30 days from creation |
| `responded_at` | timestamp (nullable) | When guardian approved/refused |
| `ip_address` | text (nullable) | Recorded on response |
| `created_at` | timestamp | |

**State machine:** `pending` → `approved` or `refused`. A refused consent can be re-requested by the psy (creates a new record). The latest record per (guardian, patient, consent_type) is authoritative.

### 3.4 Modified Table: `patients`

| Field | Type | Notes |
|-------|------|-------|
| `is_minor` | boolean, default false | Explicit flag |

New relation: `guardians LegalGuardian[]`

### 3.5 Modified Table: `gdpr_consents`

| Field | Type | Notes |
|-------|------|-------|
| `consent_given_by` | enum, default `patient` | `patient` \| `guardian` |
| `guardian_id` | uuid FK → legal_guardians (nullable) | Set when `consent_given_by = guardian` |
| `refused_at` | timestamp (nullable) | Set when consent is refused (consented_at stays null) |

### 3.6 Modified Enum: `UserRole`

Add `guardian` to:
- **Prisma:** `enum UserRole { psychologist patient admin guardian }`
- **shared-types:** `export enum UserRole { PSYCHOLOGIST = 'psychologist', PATIENT = 'patient', ADMIN = 'admin', GUARDIAN = 'guardian' }`

**Files impacted by new role:**
- `apps/web/src/middleware.ts` — add guardian routing (same as patient → `/patient-portal`)
- `apps/web/src/app/(patient-portal)/layout.tsx` — accept both `PATIENT` and `GUARDIAN` roles
- `apps/web/src/lib/auth/auth.config.ts` — add `guardian-credentials` provider (same pattern as `patient-credentials`)
- `packages/shared-types/src/index.ts` — add `GUARDIAN` enum value

### 3.7 Permissions JSONB Structure

```json
{
  "portal": true,
  "invoices": true,
  "video": false,
  "documents": true,
  "messaging": false
}
```

Each boolean controls access to a specific section of the patient portal for that guardian.

### 3.8 Migration

Single migration: `20260507_add_minor_patients_guardians`

- Add `guardian` to `UserRole` enum
- Create `GuardianRelationship` enum (`mother`, `father`, `legal_guardian`, `other`)
- Create `GuardianInvitationStatus` enum (`pending`, `accepted`, `expired`)
- Create `GuardianConsentRequestStatus` enum (`pending`, `approved`, `refused`)
- Create `ConsentGivenBy` enum (`patient`, `guardian`)
- Create `legal_guardians` table with `@@unique([patientId, email])`
- Create `guardian_invitations` table
- Create `guardian_consent_requests` table
- Add `is_minor` column to `patients` (default false)
- Add `consent_given_by`, `guardian_id`, `refused_at` columns to `gdpr_consents`
- Add indexes: `legal_guardians(patient_id)`, `legal_guardians(user_id)`, `legal_guardians(psychologist_id)`, `guardian_invitations(token)`, `guardian_consent_requests(token)`

## 4. Authentication & Access Control

### 4.1 Auth Architecture: Extend Patient JWT System

The patient portal uses a **custom JWT auth system** (NOT Keycloak):
- `PatientJwtStrategy` with `PATIENT_JWT_SECRET` (HS256)
- `PatientJwtGuard` (Passport guard)
- `CredentialsProvider('patient-credentials')` in next-auth
- Custom endpoints: `/patient-portal/auth/login`, `/patient-portal/auth/accept-invitation`

**Guardians follow the same pattern:**

1. **Extend `PatientJwtStrategy`** to accept both `patient` and `guardian` roles:
   - Rename to `PortalJwtStrategy` (or keep name, update validation)
   - Accept `role: 'patient' | 'guardian'` in JWT payload
   - For guardians, JWT payload includes: `{ sub, guardianId, role: 'guardian', email }`
   - For patients, JWT payload stays: `{ sub, patientId, role: 'patient', email }`

2. **New `GuardianJwtGuard`** — extracts guardian context from JWT
3. **New `@CurrentGuardian()` decorator** — returns `{ sub, guardianId, email }`
4. **New next-auth provider:** `CredentialsProvider('guardian-credentials')` — same pattern as `patient-credentials`, calls `/guardian-portal/auth/login`

### 4.2 Guard Chain (NestJS)

**For guardian-specific endpoints:**
```
Request
  → PortalJwtGuard (validates JWT, accepts role = "guardian")
  → GuardianAccessGuard (NEW)
      1. Loads LegalGuardian by JWT guardianId
      2. Verifies patientId in route params is linked to this guardian
      3. Loads psychologist subscription → enforces plan restrictions
         (e.g., Solo plan + isPrimary=false → deny access)
      4. Checks specific permission for the requested resource
         (portal/invoices/video/documents/messaging)
      5. Verifies patient.isMinor === true
      6. Verifies LegalGuardian.psychologistId matches the patient's psychologistId
  → Controller
```

### 4.3 Isolation Rules

- Guardian sees ONLY patients linked via `LegalGuardian.patientId`
- Guardian cannot access other patients of the same psychologist
- `LegalGuardian.psychologistId` must match `Patient.psychologistId` on every request (cross-tenant protection)
- Permissions JSONB checked server-side on every request (no client cache)
- Journal entries with `isPrivate = true` are invisible to guardians (same as for psychologists)
- If psychologist downgrades plan (e.g., Pro → Solo), 2nd guardian (isPrimary=false) loses portal access immediately
- Audit log records `actorType: "guardian"` with `guardianId` in metadata on every data access

### 4.4 Guardian Registration Flow

1. Psychologist adds guardian on minor patient's record
2. Psychologist clicks "Invite to portal"
3. API creates: `GuardianInvitation` (token, 7-day expiry) + sends email via Resend
4. Guardian clicks link → activation page (`/guardian-invite/:token`)
5. API creates: `users` record (role = `guardian`, password bcrypt hashed), links `LegalGuardian.userId`
6. Guardian logs in via `/patient/login` (same login page, accepts guardian role)
7. Next-auth detects `guardian` role → redirects to `/patient-portal` with minor selector

**No Keycloak user created for guardians.** Guardians use the same custom JWT auth as patients. MFA is not required for guardians (same as patients).

### 4.5 Audit Logging for Guardian Access

Every guardian data access is logged in `audit_logs`:
- `actorType: "guardian"`
- `actorId: guardianUserId`
- `metadata: { guardianId, patientId, permission }`
- Actions: `READ`, `DECRYPT` (when accessing encrypted journal/mood entries)

**Modified files for audit:**
- `apps/api/src/patient-portal/patient-portal.service.ts` — add guardian-aware audit calls on mood, exercises, journal, documents reads
- `apps/api/src/common/audit.service.ts` — accept `guardianId` in metadata

## 5. API Endpoints

### 5.1 GuardiansController — CRUD (Psy-facing)

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| `POST` | `/patients/:patientId/guardians` | Add guardian (max 2) | KeycloakGuard + psychologist + subscription |
| `GET` | `/patients/:patientId/guardians` | List guardians | KeycloakGuard + psychologist |
| `PUT` | `/patients/:patientId/guardians/:guardianId` | Update guardian | KeycloakGuard + psychologist |
| `DELETE` | `/patients/:patientId/guardians/:guardianId` | Remove guardian (revokes portal access) | KeycloakGuard + psychologist |

**POST validation:** `patient.isMinor === true`, guardian count < 2, email ≠ patient.email, unique (patientId, email).

### 5.2 GuardianInvitationsController

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| `POST` | `/patients/:patientId/guardians/:guardianId/invite` | Send portal invitation email | KeycloakGuard + psychologist |
| `GET` | `/guardian-invitations/:token` | Validate token (public activation page) | Public |
| `POST` | `/guardian-invitations/:token/accept` | Accept invitation, create user account | Public |

**Resend:** If previous invitation expired, POST invite creates a new invitation. Max 3 per guardian per 24h.

### 5.3 GuardianConsentsController

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| `POST` | `/patients/:patientId/guardian-consents` | Request consent from guardian (psy triggers) | KeycloakGuard + psychologist |
| `GET` | `/guardian-consents/:token` | Consent page (public, HMAC-signed token) | Public |
| `POST` | `/guardian-consents/:token/approve` | Guardian approves consent | Public |
| `POST` | `/guardian-consents/:token/refuse` | Guardian refuses consent | Public |

**Token:** HMAC-SHA256 signed with `PATIENT_JWT_SECRET`, encoding `guardianId + patientId + consentType + requestId`. Expires 30 days. Stored in `guardian_consent_requests` table.

**On approve:** Creates `GdprConsent` record with `consentGivenBy = 'guardian'`, `guardianId`, IP address. Updates `guardian_consent_requests.status = 'approved'`.

**On refuse:** Sets `guardian_consent_requests.status = 'refused'`, `responded_at = now`. Notifies psy via in-app notification + email. Feature stays blocked for this minor.

### 5.4 Guardian Auth Endpoints

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| `POST` | `/guardian-portal/auth/login` | Guardian email/password login | Public |
| `POST` | `/guardian-portal/auth/refresh` | Refresh access token | Public |

Same JWT generation pattern as patient auth. Token payload: `{ sub, guardianId, role: 'guardian', email }`. Access token: 1h, refresh: 7d.

### 5.5 Guardian Portal Endpoints

| Method | Route | Description | Guard |
|--------|-------|-------------|-------|
| `GET` | `/guardian-portal/minors` | List minors linked to guardian | PortalJwtGuard(guardian) |
| `GET` | `/guardian-portal/minors/:patientId/dashboard` | Minor's dashboard | PortalJwtGuard + GuardianAccessGuard(portal) |
| `GET` | `/guardian-portal/minors/:patientId/mood` | Minor's mood data | PortalJwtGuard + GuardianAccessGuard(portal) |
| `GET` | `/guardian-portal/minors/:patientId/exercises` | Minor's exercises | PortalJwtGuard + GuardianAccessGuard(portal) |
| `GET` | `/guardian-portal/minors/:patientId/journal` | Minor's journal (isPrivate=false only) | PortalJwtGuard + GuardianAccessGuard(portal) |
| `GET` | `/guardian-portal/minors/:patientId/documents` | Shared documents | PortalJwtGuard + GuardianAccessGuard(documents) |
| `GET` | `/guardian-portal/minors/:patientId/invoices` | Minor's invoices | PortalJwtGuard + GuardianAccessGuard(invoices) |

**Design choice:** Separate `/guardian-portal/` endpoints instead of extending `/patient-portal/` endpoints with optional `:patientId`. This avoids breaking existing patient endpoints and keeps the guard logic clean.

### 5.6 Modified Existing Endpoints

- `POST /patients` — accepts `isMinor` field
- `PUT /patients/:id` — accepts `isMinor` modification
- `GET /patients/:id` — includes `isMinor` + `guardians[]` in response
- `DELETE /patients/:id/purge` — cascades to LegalGuardian, GuardianInvitation, GuardianConsentRequest
- `POST /invoices` — option `sendToGuardian: true` to send to primary guardian email
- `POST /appointments` — if minor + guardian has video permission, sends video link to guardian too

## 6. Frontend

### 6.1 Psychologist Side

**Patient creation/edit form (`create-patient-dialog.tsx`, `edit-patient-dialog.tsx`):**
- New toggle "Patient mineur" (teal accent, shows guardian section when ON)
- Guardian section: card per guardian showing name, relationship, email, phone, permission badges, invite button
- "Add 2nd guardian" button (dashed border, Pro/Clinic only)

**New dialog: `AddGuardianDialog`:**
- Fields: name (required), email (required), phone, relationship selector (mother/father/legal_guardian/other), isPrimary toggle, permissions checkboxes (portal, invoices, documents, video, messaging)
- Permissions checkboxes: Pro/Clinic get individual toggles, Solo gets all-on defaults (no configuration)

**Patient detail page — new tab "Responsables legaux":**
- Lists guardians with status badges (portal active / invitation pending)
- Shows permission badges per guardian
- Consent status section at bottom: approved/pending/not requested per consent type, with guardian name and date

### 6.2 Guardian Portal

**Login:** Same `/patient/login` page — accepts guardian email/password. Next-auth `guardian-credentials` provider calls `/guardian-portal/auth/login`.

**Route: `/patient-portal` (same as patient portal, role-aware via layout)**

**Patient portal layout changes:**
- Accept both `UserRole.PATIENT` and `UserRole.GUARDIAN`
- If guardian: show "Tuteur" badge in header, show minor selector if 2+ minors
- Use `session.role` to determine which API client to use (`patientPortalApi` vs `guardianPortalApi`)

**Minor selection page** (if guardian linked to 2+ minors):
- Cards per minor showing name, age, permission badges
- Click to enter that minor's portal view

**Portal navigation** (after minor selected):
- Header: minor name + avatar + "Tuteur: {guardianName} ({relationship})"
- Back arrow to return to minor selection
- Navigation items filtered by permissions — unauthorized sections shown greyed with lock icon
- Journal: entries with `isPrivate = true` hidden

### 6.3 Public Pages

**Guardian invitation acceptance: `/guardian-invite/[token]`**
- Shows: guardian name, patient first name, psychologist name
- Password creation form
- Creates user account on submit, auto-login

**Consent page: `/guardian-consent/[token]`**
- Shows: psychologist name, patient first name, consent type with detailed explanation
- "J'approuve" / "Je refuse" buttons
- IP + date recording notice
- Confirmation screen after action

## 7. Email Templates (Resend + React Email)

| Template | Subject | Trigger |
|----------|---------|---------|
| `guardian-invitation` | "[PsyLib] Dr. {psyName} vous invite a suivre le dossier de {patientFirstName}" | Psy clicks "Invite to portal" |
| `guardian-consent-request` | "[PsyLib] Consentement requis pour {patientFirstName} — {consentType}" | Psy requests consent |
| `guardian-consent-confirmed` | "[PsyLib] Consentement enregistre pour {patientFirstName}" | Guardian approves (copy to psy) |
| `guardian-invoice` | "[PsyLib] Facture {invoiceNumber} — Seance de {patientFirstName}" | Invoice generated, guardian.permissions.invoices = true |

All sent from `noreply@send.psylib.eu`.

## 8. Plan Gating

| Feature | Free | Solo | Pro | Clinic |
|---------|------|------|-----|--------|
| Flag patient mineur | Yes | Yes | Yes | Yes |
| Guardian fields (name, email, phone) | Yes | Yes | Yes | Yes |
| Portal invitation | No | Yes | Yes | Yes |
| Digital consent in-app | No | Yes | Yes | Yes |
| Configurable permissions per guardian | No | No | Yes | Yes |
| 2nd guardian | No | No | Yes | Yes |

- **Free:** Guardian info stored but no portal access, no digital consent
- **Solo:** 1 guardian, portal + consent, default permissions (all on, not configurable)
- **Pro/Clinic:** 2 guardians, individually configurable permissions

**Plan enforcement on guardian portal access:** `GuardianAccessGuard` loads the psychologist's subscription. If plan = Solo and guardian.isPrimary = false, access denied. If plan = Free, all guardian portal access denied.

## 9. Edge Cases

| Case | Behavior |
|------|----------|
| **Patient becomes adult** | Psy manually disables `isMinor`. LegalGuardian records preserved (history) but guardian portal access revoked automatically (GuardianAccessGuard checks `isMinor`). Psy can then invite patient to standard patient portal. |
| **Guardian linked to 2 minors (same psy)** | Single user account, 2 LegalGuardian records. Portal shows both minors on `/guardian-portal/minors`. Permissions independent per minor. |
| **Guardian linked to minors with 2 different psys** | Same user account (same email). API filters by `psychologistId` on LegalGuardian. Portal groups minors by practitioner. |
| **Change primary guardian** | Psy updates `isPrimary` via UI. Constraint: max 1 `isPrimary=true` per patient (service layer swaps). Invoice routing switches to new primary. |
| **RGPD purge of minor patient** | Cascade deletes: LegalGuardian, GuardianInvitation, GuardianConsentRequest, GdprConsent. Guardian user NOT deleted (may be linked to other minors). If no more linked minors, guardian user is deactivated. |
| **Minor patient with own email** | Allowed (teenager). Patient can have own portal account AND guardian has separate guardian account. Patient writes mood/journal; guardian reads only. |
| **Same email for patient and guardian** | Forbidden. Backend validation rejects with clear error message. |
| **Consent refused by guardian** | Refusal recorded in `guardian_consent_requests` (status=refused, responded_at=now). GdprConsent NOT created. Psy notified via in-app notification. Feature stays blocked. Psy can re-request (creates new consent request). |
| **Psy downgrades plan** | Pro→Solo: 2nd guardian (isPrimary=false) loses portal access immediately. Solo→Free: all guardian portal access revoked. Guardian data preserved in DB. |
| **isMinor=true but birthDate > 18** | Server-side warning returned in API response (non-blocking). Psy can override — clinical judgment prevails. |
| **Invitation resend after expiry** | Creates new `guardian_invitations` record. Old record preserved for audit. Max 3 per guardian per 24h. |

## 10. Notification Events

Guardian actions trigger the following realtime notifications (Socket.io):

| Event | Recipient | Trigger |
|-------|-----------|---------|
| `guardian:consent_approved` | Psychologist | Guardian approves a consent request |
| `guardian:consent_refused` | Psychologist | Guardian refuses a consent request |
| `guardian:invitation_accepted` | Psychologist | Guardian activates portal account |
| `guardian:document_viewed` | Psychologist | Guardian views a shared document |

## 11. Files to Create/Modify

### New Files

| File | Purpose |
|------|---------|
| `apps/api/src/guardians/guardians.module.ts` | NestJS module |
| `apps/api/src/guardians/guardians.controller.ts` | CRUD endpoints (psy-facing) |
| `apps/api/src/guardians/guardians.service.ts` | Business logic |
| `apps/api/src/guardians/dto/create-guardian.dto.ts` | Input validation |
| `apps/api/src/guardians/dto/update-guardian.dto.ts` | Input validation |
| `apps/api/src/guardians/guardian-access.guard.ts` | GuardianAccessGuard (permission + plan check) |
| `apps/api/src/guardians/guardian-consents.controller.ts` | Consent request/approve/refuse endpoints |
| `apps/api/src/guardians/guardian-invitations.controller.ts` | Invitation endpoints |
| `apps/api/src/guardian-portal/guardian-portal.module.ts` | Guardian portal module |
| `apps/api/src/guardian-portal/guardian-portal.controller.ts` | Portal data endpoints |
| `apps/api/src/guardian-portal/guardian-portal.service.ts` | Portal business logic (read-only data access) |
| `apps/api/src/guardian-portal/guardian-auth.controller.ts` | Login/refresh endpoints |
| `apps/api/src/guardian-portal/guardian-auth.service.ts` | JWT generation (same pattern as patient) |
| `apps/api/src/guardian-portal/strategies/guardian-jwt.strategy.ts` | Passport JWT strategy |
| `apps/api/src/guardian-portal/guards/guardian-jwt.guard.ts` | Passport guard |
| `apps/api/src/guardian-portal/decorators/current-guardian.decorator.ts` | @CurrentGuardian() |
| `apps/web/src/components/patients/guardian-section.tsx` | Guardian section in patient form |
| `apps/web/src/components/patients/add-guardian-dialog.tsx` | Add/edit guardian dialog |
| `apps/web/src/components/patients/guardian-tab.tsx` | Patient detail "Responsables legaux" tab |
| `apps/web/src/app/(patient-portal)/patient-portal/minor-selector/page.tsx` | Minor selection page |
| `apps/web/src/app/(auth)/guardian-invite/[token]/page.tsx` | Invitation acceptance page |
| `apps/web/src/app/(auth)/guardian-consent/[token]/page.tsx` | Consent approval page |
| `apps/web/src/lib/api/guardian-portal.ts` | API client for guardian portal |
| `apps/api/src/notifications/emails/guardian-invitation.tsx` | Email template |
| `apps/api/src/notifications/emails/guardian-consent-request.tsx` | Email template |
| `apps/api/src/notifications/emails/guardian-consent-confirmed.tsx` | Email template |
| `apps/api/src/notifications/emails/guardian-invoice.tsx` | Email template |
| `apps/api/prisma/migrations/20260507_add_minor_patients_guardians/` | Migration |

### Modified Files

| File | Change |
|------|--------|
| `apps/api/prisma/schema.prisma` | Add LegalGuardian, GuardianInvitation, GuardianConsentRequest models + Patient.isMinor + GdprConsent fields + UserRole.guardian |
| `packages/shared-types/src/index.ts` | Add `GUARDIAN` to UserRole enum, add LegalGuardian/GuardianPermissions types |
| `apps/api/src/patients/dto/create-patient.dto.ts` | Add `isMinor` field |
| `apps/api/src/patients/patients.service.ts` | Include guardians in patient responses |
| `apps/api/src/patients/patients.controller.ts` | Return guardians with patient detail |
| `apps/api/src/app.module.ts` | Import GuardiansModule + GuardianPortalModule |
| `apps/web/src/components/patients/create-patient-dialog.tsx` | Add minor toggle + guardian section |
| `apps/web/src/components/patients/edit-patient-dialog.tsx` | Add minor toggle + guardian section |
| `apps/web/src/components/patients/patient-detail.tsx` | Add "Responsables legaux" tab |
| `apps/web/src/app/(patient-portal)/layout.tsx` | Accept GUARDIAN role, show minor selector/badge |
| `apps/web/src/middleware.ts` | Handle guardian role routing → /patient-portal |
| `apps/web/src/lib/auth/auth.config.ts` | Add `guardian-credentials` provider |
| `apps/api/src/billing/invoice.service.ts` | Send invoice to guardian if configured |
| `apps/api/src/appointments/appointments.service.ts` | Send video link to guardian if configured |
| `apps/api/src/notifications/email.service.ts` | Add guardian email methods |
| `apps/api/src/common/audit.service.ts` | Accept guardianId in metadata, log guardian data access |
| `apps/api/src/patient-portal/patient-portal.service.ts` | Add guardian-aware audit calls on data reads |

## 12. Out of Scope

- **Mobile app:** Guardian portal not included in Expo app for this iteration
- **Guardian-initiated messaging:** Guardian can receive messages but messaging UI is deferred
- **Auto-detection of minority from birthDate:** Manual flag only
- **More than 2 guardians:** Capped at 2, revisitable if needed
