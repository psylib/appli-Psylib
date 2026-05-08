-- Rename enum value starter → solo
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'starter' TO 'solo';

-- Add unique constraint on Patient(psychologistId, email)
-- PostgreSQL allows multiple NULLs in unique constraints, so patients without email are fine
CREATE UNIQUE INDEX IF NOT EXISTS "idx_patients_psy_email" ON "patients" ("psychologist_id", "email");
