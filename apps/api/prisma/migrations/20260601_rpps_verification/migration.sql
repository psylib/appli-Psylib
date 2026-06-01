-- AlterTable: horodatage de vérification du numéro ADELI/RPPS contre l'annuaire officiel
ALTER TABLE "psychologists" ADD COLUMN IF NOT EXISTS "rpps_verified_at" TIMESTAMP(3);
