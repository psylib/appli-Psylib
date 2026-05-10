-- Audit #7 fixes — 2026-05-10
-- All operations are idempotent (IF NOT EXISTS)

-- 1. Add createdAt to exercises
ALTER TABLE "exercises" ADD COLUMN IF NOT EXISTS "created_at" TIMESTAMP(3) NOT NULL DEFAULT now();

-- 2. Add index on conversations.patient_id for patient portal lookups
CREATE INDEX IF NOT EXISTS "conversations_patient_id_idx" ON "conversations"("patient_id");

-- 3. Add index on users.role for admin queries
CREATE INDEX IF NOT EXISTS "users_role_idx" ON "users"("role");

-- 4. Add composite index on appointments for dashboard status queries
CREATE INDEX IF NOT EXISTS "idx_appointments_psy_status_date" ON "appointments"("psychologist_id", "status", "scheduled_at");

-- 5. Add composite index on sessions for revenue queries
CREATE INDEX IF NOT EXISTS "idx_sessions_psy_payment_date" ON "sessions"("psychologist_id", "payment_status", "date");

-- 6. Make Assessment->AssessmentTemplate onDelete explicit (Restrict is already default, no DB change needed)
-- This is a schema-only annotation change, no SQL needed.
