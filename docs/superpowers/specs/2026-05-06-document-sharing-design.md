# Document Sharing — Design Spec

**Date:** 2026-05-06
**Status:** Approved
**Feature:** Psychologist → Patient document sharing

## Overview

Allow psychologists to share documents (therapeutic exercises, administrative docs, session reports, free-form files) with their patients. Patients access shared documents via their portal and receive email notifications.

## Constraints

- **Direction:** Psy → Patient only (MVP). Bidirectional deferred.
- **Storage:** Local VPS disk (`/uploads/documents/`). Cloud migration (OVH Object Storage / S3) deferred.
- **Plan-gating:** Free = disabled. Solo = 50 Mo/month. Pro/Clinic = unlimited.
- **File limits:** Max 10 Mo per file. Allowed types: PDF, JPEG, PNG, DOCX, ODT.
- **Security:** HDS-compliant — no direct download links in emails, patient must authenticate to download. Audit logs on share and download.

## Data Model

### New table: `shared_documents`

| Field | Type | Notes |
|---|---|---|
| `id` | text PK | `gen_random_uuid()::text` |
| `psychologist_id` | text FK → psychologists | Tenant isolation |
| `patient_id` | text FK → patients | Recipient |
| `file_name` | text | Original file name |
| `file_path` | text | Server path (never exposed to client) |
| `file_size` | integer | Size in bytes |
| `mime_type` | text | `application/pdf`, `image/jpeg`, etc. |
| `category` | enum `DocumentCategory` | `exercise` \| `administrative` \| `session_report` \| `other` |
| `message` | text nullable | Optional accompanying message — **encrypted AES-256-GCM** |
| `downloaded_at` | timestamp nullable | First download by patient (intentionally single record; individual download events tracked via `audit_logs`) |
| `deleted_at` | timestamp nullable | Soft delete timestamp |
| `created_at` | timestamp | Share date |

**Enum:** `DocumentCategory` = `exercise`, `administrative`, `session_report`, `other`

**File storage path:** `/uploads/documents/{psychologistId}/{patientId}/{uuid}_{filename}`

**Indexes:**
- `idx_shared_documents_psy` on `(psychologist_id)`
- `idx_shared_documents_patient` on `(patient_id, created_at DESC)`

## API Endpoints

### Psychologist endpoints (KeycloakGuard)

| Method | Route | Description |
|---|---|---|
| `POST` | `/documents/share` | Upload + share a document to a patient |
| `GET` | `/documents` | List shared documents (filterable by `patientId`) |
| `GET` | `/documents/:id` | Single document detail |
| `DELETE` | `/documents/:id` | Soft-delete a shared document + remove physical file |

All `:id` params use `ParseUUIDPipe` (IDs are `gen_random_uuid()::text`, valid UUID format).

### Patient portal endpoints (PatientJwtGuard)

| Method | Route | Description |
|---|---|---|
| `GET` | `/patient-portal/documents` | List received documents |
| `GET` | `/patient-portal/documents/:id/download` | Download file (stream) |

### POST /documents/share — Flow

1. Validate plan (Solo+) via `@RequireFeature('documents')` decorator + `SubscriptionGuard`
2. Validate monthly quota inside `DocumentsService.checkDocumentQuota()` — Solo: 50 Mo cumulative (sum of `file_size` for non-deleted documents created this month)
3. Validate file (size <= 10 Mo, allowed MIME type)
4. Verify patient belongs to the psychologist (`psychologist_id` match)
5. Store file on disk at `/uploads/documents/{psyId}/{patientId}/{uuid}_{filename}`
6. Encrypt `message` field with `EncryptionService` (AES-256-GCM) if present
7. Create `shared_documents` entry in DB
8. Log in `audit_logs` (action `CREATE`, entity_type `document`) — uses existing `CREATE` action, no new AuditAction needed
9. Send email notification to patient via Resend — **skip gracefully if `patient.email` is null** (no crash, log warning)
10. Send in-app notification via WebSocket (if patient connected)

### DELETE /documents/:id — Flow

1. Verify document belongs to the psychologist (`psychologist_id` match)
2. Delete physical file from disk (`fs.unlink`)
3. Set `deleted_at = now()` (soft delete — row retained for audit trail)
4. Log in `audit_logs` (action `DELETE`, entity_type `document`) — uses existing `DELETE` action

**Error handling:** If `fs.unlink` fails (file already missing), log a warning and proceed to soft-delete anyway. Never leave the DB record active when the file is gone.

**RGPD purge cascade:** The existing `/patients/:id/purge` endpoint must also delete all `shared_documents` for that patient — both DB rows (hard delete) and physical files from disk.

### GET .../download — Flow

1. Verify document belongs to the authenticated patient
2. Stream file with `Content-Disposition: attachment; filename="{original_name}"`
3. Update `downloaded_at` if first download
4. Log in `audit_logs` (action `READ`, entity_type `document`) — uses existing `READ` action
5. Set `Content-Type` header from stored `document.mime_type`

## Frontend — Psychologist Dashboard

### Access points

1. **Patient detail page** (`/dashboard/patients/[id]`) — new "Documents" tab showing shared documents list + "Partager un document" button
2. **Quick action** — accessible from sidebar or header

### Share dialog (slide-in modal)

- Patient selector (searchable dropdown) — pre-filled if opened from patient detail
- Drag & drop zone + "Parcourir" button for file
- Category select: Exercice therapeutique / Administratif / Compte-rendu de seance / Autre
- Optional message textarea ("Voici la fiche de relaxation dont nous avons parle")
- "Partager" button
- Success toast: "Document partage avec [prenom]"

### Documents tab in patient detail

- Table columns: File name, Category (colored badge), Share date, Status (Non lu / Telecharge + date)
- Row action: delete (with confirm dialog)
- Empty state component

## Frontend — Patient Portal

### New page: `/patient-portal/documents`

- Added as 5th item in bottom nav (icon: FileText, label: "Documents")
- Document cards sorted by date (newest first)
- Each card: file name, category badge, received date, accompanying message if present
- "Telecharger" button per document
- "Nouveau" badge on undownloaded documents
- Empty state: "Votre psychologue n'a pas encore partage de documents"

### Dashboard widget

- New "Documents recents" block on patient portal home
- Shows count of undownloaded documents + link to documents page

### Email notification (React Email template)

- Subject: "[Prenom du psy] vous a partage un document"
- Body: document name, category, accompanying message, CTA button "Voir mes documents" → `/patient-portal/documents`
- No direct download link (HDS compliance — patient must authenticate)

## Plan Gating

| Plan | Access | Quota |
|---|---|---|
| Free | Disabled | — |
| Solo | Enabled | 50 Mo/month |
| Pro | Enabled | Unlimited |
| Clinic | Enabled | Unlimited |

Quota calculation: sum of `file_size` for non-deleted documents (`deleted_at IS NULL`) created in the current calendar month for the psychologist. Deleted documents do NOT count against the quota.

### Required changes to shared-types and billing

1. Add `'documents'` to the `BillingFeature` union type in `apps/api/src/billing/decorators/require-plan.decorator.ts` (NOT in shared-types — `BillingFeature` lives locally in the API)
2. Add `documentsBytesMonthly: number | null` to `PLAN_LIMITS` in `packages/shared-types/src/index.ts` — `free: 0`, `solo: 52428800` (50 Mo in bytes), `pro: null`, `clinic: null`. Field name includes `Bytes` to distinguish from count-based quotas.
3. Add `checkDocumentQuota(psychologistId: string, fileSizeBytes: number): Promise<void>` to `SubscriptionService`
4. Add `else if (requiredFeature === 'documents')` branch in `SubscriptionGuard` (`apps/api/src/billing/guards/subscription.guard.ts`) calling `checkDocumentQuota`
5. `DocumentsModule` must import `BillingModule` (for `SubscriptionGuard` + `SubscriptionService`)
6. `PatientPortalModule` imports `DocumentsModule` — gains `BillingModule` transitively, no circular dependency

## Security & Compliance

- **Multi-tenant isolation:** All queries filtered by `psychologist_id`
- **Encryption:** `message` field encrypted with AES-256-GCM via `EncryptionService` (same pattern as session notes)
- **Audit logging:** Every share (`CREATE`), download (`READ`), and delete (`DELETE`) logged in `audit_logs` — uses existing `AuditAction` values, no new actions needed
- **File validation:** MIME type whitelist + file size limit enforced server-side
- **Path traversal protection:** Sanitize filenames, verify upload path starts with expected base directory (same pattern as expense receipts)
- **No direct file URLs:** Files served through authenticated API endpoint only, never via static file serving
- **Download auth:** PatientJwtGuard + ownership verification (document.patient_id === authenticated patient) + `deleted_at IS NULL` check
- **RGPD purge:** `/patients/:id/purge` cascades to hard-delete all `shared_documents` rows + physical files for that patient

## NestJS Module Structure

```
apps/api/src/documents/
├── documents.module.ts
├── documents.controller.ts      — Psy endpoints
├── documents.service.ts         — Business logic + file storage
├── dto/
│   ├── share-document.dto.ts    — patientId, category, message
│   └── list-documents.dto.ts    — patientId filter, pagination
└── document-category.enum.ts
```

Patient-side endpoints added to existing `patient-portal.controller.ts`.

**Response DTOs:** `file_path` must be excluded from all response DTOs (`GET /documents`, `GET /documents/:id`, `GET /patient-portal/documents`). Never expose server file paths to the client.

### Module imports

- `DocumentsModule` imports: `PrismaModule`, `BillingModule`, `NotificationsModule`
- `DocumentsModule` exports: `DocumentsService`
- `PatientPortalModule` imports: `DocumentsModule` (for patient-side document endpoints)
- Unread document count returned as new field `unreadDocuments: number` in `GET /patient-portal/dashboard` response (added to existing `PatientPortalService.getDashboard()`)

## Testing

- **Unit:** DocumentsService — quota calculation, file validation, path generation
- **Integration:** Upload + share flow, download flow, plan-gating rejection
- **E2E:** Psy shares document → patient sees it in portal → downloads it
