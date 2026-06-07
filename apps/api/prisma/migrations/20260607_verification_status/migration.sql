-- Identity verification gating for psychologist public profiles.
-- Adds a verification_status enum + column on psychologists.
--
-- Sécurité : vérifier qu'un numéro ADELI/RPPS existe à l'annuaire ne prouve pas
-- que la personne qui s'inscrit en est le titulaire (les numéros sont publics).
-- On masque donc le profil public tant que le compte n'est pas `verified`
-- (auto si annuaire + nom correspondent, sinon validation manuelle admin).

-- 1. Enum type (idempotent)
DO $$ BEGIN
  CREATE TYPE "VerificationStatus" AS ENUM ('pending', 'verified', 'rejected');
EXCEPTION WHEN duplicate_object THEN null;
END $$;

-- 2. Colonnes (idempotent)
ALTER TABLE "psychologists"
  ADD COLUMN IF NOT EXISTS "verification_status" "VerificationStatus" NOT NULL DEFAULT 'pending';
ALTER TABLE "psychologists"
  ADD COLUMN IF NOT EXISTS "verification_note" TEXT;

-- 3. Backfill : tous les comptes existants au moment de la migration sont
--    considérés vérifiés (déjà en prod, légitimes — ne pas casser leur profil
--    public). Borné par created_at pour rester idempotent : un éventuel re-run
--    ne re-validera aucun compte créé après cette migration.
UPDATE "psychologists"
  SET "verification_status" = 'verified'
  WHERE "created_at" <= '2026-06-07 23:59:59'
    AND "verification_status" = 'pending';

-- 4. Index partiel pour les requêtes publiques (profils visibles uniquement)
CREATE INDEX IF NOT EXISTS "idx_psychologists_verification_status"
  ON "psychologists" ("verification_status");
