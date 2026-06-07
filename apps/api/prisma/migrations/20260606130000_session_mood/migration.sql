-- Ajoute la colonne mood (humeur patient relevée en séance, 1-5) à la table sessions.
-- Idempotent pour éviter les erreurs en prod si déjà appliqué manuellement.
ALTER TABLE "sessions" ADD COLUMN IF NOT EXISTS "mood" INTEGER;
