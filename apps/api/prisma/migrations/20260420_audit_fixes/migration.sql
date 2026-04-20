-- ============================================================================
-- Audit Fixes Migration (2026-04-20)
-- Fixes enum drift, adds missing FK indexes, adds AppointmentPaymentMode enum,
-- adds FecSequence FK, removes redundant indexes
-- ============================================================================

-- ─── 1. Fix ExpenseCategory enum drift ──────��───────────────────────────────
-- Add values that exist in schema but not in DB
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'supervision';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'professional_fees';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'transport';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'tests_tools';
ALTER TYPE "ExpenseCategory" ADD VALUE IF NOT EXISTS 'cleaning';

-- ─── 2. Fix ExpensePaymentMethod enum drift ─────────────────────────────────
ALTER TYPE "ExpensePaymentMethod" ADD VALUE IF NOT EXISTS 'bank_transfer';
ALTER TYPE "ExpensePaymentMethod" ADD VALUE IF NOT EXISTS 'stripe';
-- 'other' already exists in DB, 'paypal' already exists in DB

-- ��── 3. Create AppointmentPaymentMode enum ��────────────────���────────────────
DO $$ BEGIN
  CREATE TYPE "AppointmentPaymentMode" AS ENUM ('none', 'prepayment', 'post_session');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- Convert appointments.payment_mode from String to enum
-- Must drop default first, convert, then re-add default
ALTER TABLE "appointments" ALTER COLUMN "payment_mode" DROP DEFAULT;
ALTER TABLE "appointments"
  ALTER COLUMN "payment_mode" TYPE "AppointmentPaymentMode"
  USING "payment_mode"::"AppointmentPaymentMode";
ALTER TABLE "appointments" ALTER COLUMN "payment_mode" SET DEFAULT 'none';

-- ─── 4. Add missing FK indexes ──────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS "idx_availability_psy" ON "availability"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_exercises_patient" ON "exercises"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_journal_entries_patient" ON "journal_entries"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_gdpr_consents_patient" ON "gdpr_consents"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_note_templates_psy" ON "note_templates"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_marketing_contents_psy" ON "marketing_contents"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_course_modules_course" ON "course_modules"("course_id");
CREATE INDEX IF NOT EXISTS "idx_courses_psy" ON "courses"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_course_enrollments_user" ON "course_enrollments"("user_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_psy" ON "invoices"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_patient" ON "invoices"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_invoices_payment" ON "invoices"("payment_id");
CREATE INDEX IF NOT EXISTS "idx_payments_patient" ON "payments"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_network_groups_owner" ON "network_groups"("owner_id");
CREATE INDEX IF NOT EXISTS "idx_case_studies_presenter" ON "case_studies"("presenter_id");
CREATE INDEX IF NOT EXISTS "idx_patient_invitations_psy" ON "patient_invitations"("psychologist_id");
CREATE INDEX IF NOT EXISTS "idx_patient_invitations_patient" ON "patient_invitations"("patient_id");

-- ─── 5. Add FecSequence FK ──────────────────────────────────────────────────
DO $$ BEGIN
  ALTER TABLE "fec_sequences" ADD CONSTRAINT "fec_sequences_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- ─── 6. Remove redundant indexes ───────────────────────────────────────────
-- VideoRoom.appointmentId already has UNIQUE constraint (implicit index)
DROP INDEX IF EXISTS "video_rooms_appointment_id_idx";
-- ReferralInvite.code already has UNIQUE constraint (implicit index)
DROP INDEX IF EXISTS "referral_invites_code_idx";
