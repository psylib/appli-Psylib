-- Migration: audit_fk_ondelete
-- Purpose: Add onDelete: SetNull to 16 FK relations to allow RGPD purge (user/patient deletion)
-- Strategy: billing/audit tables keep the record but unlink the deleted entity (legal requirement)

-- =============================================================================
-- Step 1: Make actorId nullable in audit_logs (was NOT NULL)
-- =============================================================================

ALTER TABLE "audit_logs" ALTER COLUMN "actor_id" DROP NOT NULL;

-- Drop old FK constraint and recreate with ON DELETE SET NULL
ALTER TABLE "audit_logs" DROP CONSTRAINT IF EXISTS "audit_logs_actor_id_fkey";
ALTER TABLE "audit_logs" ADD CONSTRAINT "audit_logs_actor_id_fkey"
  FOREIGN KEY ("actor_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 2: Make senderId nullable in messages (was NOT NULL)
-- =============================================================================

ALTER TABLE "messages" ALTER COLUMN "sender_id" DROP NOT NULL;

-- Drop old FK constraint and recreate with ON DELETE SET NULL
ALTER TABLE "messages" DROP CONSTRAINT IF EXISTS "messages_sender_id_fkey";
ALTER TABLE "messages" ADD CONSTRAINT "messages_sender_id_fkey"
  FOREIGN KEY ("sender_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 3: Make userId nullable in course_enrollments (was NOT NULL)
-- =============================================================================

ALTER TABLE "course_enrollments" ALTER COLUMN "user_id" DROP NOT NULL;

-- Drop old FK constraint and recreate with ON DELETE SET NULL
ALTER TABLE "course_enrollments" DROP CONSTRAINT IF EXISTS "course_enrollments_user_id_fkey";
ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 4: Patient FK in payments — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "payments" DROP CONSTRAINT IF EXISTS "payments_patient_id_fkey";
ALTER TABLE "payments" ADD CONSTRAINT "payments_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 5: Add appointment_id column to payments (was in schema but never migrated)
-- =============================================================================

ALTER TABLE "payments" ADD COLUMN IF NOT EXISTS "appointment_id" TEXT;
CREATE INDEX IF NOT EXISTS "idx_payments_appointment" ON "payments"("appointment_id");
ALTER TABLE "payments" ADD CONSTRAINT "payments_appointment_id_fkey"
  FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 6: Patient FK in invoices — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_patient_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_patient_id_fkey"
  FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 7: Session FK in invoices — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_session_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 8: Payment FK in invoices — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "invoices" DROP CONSTRAINT IF EXISTS "invoices_payment_id_fkey";
ALTER TABLE "invoices" ADD CONSTRAINT "invoices_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 9: Invoice FK in accounting_entries — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_invoice_id_fkey";
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_invoice_id_fkey"
  FOREIGN KEY ("invoice_id") REFERENCES "invoices"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 10: Payment FK in accounting_entries — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_payment_id_fkey";
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_payment_id_fkey"
  FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 11: Expense FK in accounting_entries — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "accounting_entries" DROP CONSTRAINT IF EXISTS "accounting_entries_expense_id_fkey";
ALTER TABLE "accounting_entries" ADD CONSTRAINT "accounting_entries_expense_id_fkey"
  FOREIGN KEY ("expense_id") REFERENCES "expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 12: referred FK in referral_invites — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "referral_invites" DROP CONSTRAINT IF EXISTS "referral_invites_referred_id_fkey";
ALTER TABLE "referral_invites" ADD CONSTRAINT "referral_invites_referred_id_fkey"
  FOREIGN KEY ("referred_id") REFERENCES "psychologists"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 13: RecurringExpense FK in expenses — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "expenses" DROP CONSTRAINT IF EXISTS "expenses_recurring_expense_id_fkey";
ALTER TABLE "expenses" ADD CONSTRAINT "expenses_recurring_expense_id_fkey"
  FOREIGN KEY ("recurring_expense_id") REFERENCES "recurring_expenses"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 14: User FK in patients — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "patients" DROP CONSTRAINT IF EXISTS "patients_user_id_fkey";
ALTER TABLE "patients" ADD CONSTRAINT "patients_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 15: Session FK in appointments — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_session_id_fkey";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_session_id_fkey"
  FOREIGN KEY ("session_id") REFERENCES "sessions"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- =============================================================================
-- Step 16: ConsultationType FK in appointments — add ON DELETE SET NULL (already nullable)
-- =============================================================================

ALTER TABLE "appointments" DROP CONSTRAINT IF EXISTS "appointments_consultation_type_id_fkey";
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_consultation_type_id_fkey"
  FOREIGN KEY ("consultation_type_id") REFERENCES "consultation_types"("id") ON DELETE SET NULL ON UPDATE CASCADE;
