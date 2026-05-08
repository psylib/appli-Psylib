-- Rename enum value starter → solo
ALTER TYPE "SubscriptionPlan" RENAME VALUE 'starter' TO 'solo';

-- Deduplicate patients with same (psychologist_id, email) before adding constraint
-- Keep the oldest patient record, nullify email on duplicates
UPDATE "patients" p
SET email = NULL
WHERE p.id NOT IN (
  SELECT DISTINCT ON (psychologist_id, email) id
  FROM "patients"
  WHERE email IS NOT NULL
  ORDER BY psychologist_id, email, created_at ASC
)
AND p.email IS NOT NULL
AND EXISTS (
  SELECT 1 FROM "patients" p2
  WHERE p2.psychologist_id = p.psychologist_id
  AND p2.email = p.email
  AND p2.id != p.id
);

-- Add unique constraint on Patient(psychologistId, email)
-- PostgreSQL allows multiple NULLs in unique constraints, so patients without email are fine
CREATE UNIQUE INDEX IF NOT EXISTS "idx_patients_psy_email" ON "patients" ("psychologist_id", "email");
