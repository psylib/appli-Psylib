-- H1 (audit 2026-06-05): processed_at devient nullable et perd son default.
-- Sémantique: null = event reçu mais pas encore traité avec succès ; daté = traité.
-- Les lignes existantes conservent leur timestamp (= considérées traitées). Idempotent.
ALTER TABLE "stripe_events" ALTER COLUMN "processed_at" DROP DEFAULT;
ALTER TABLE "stripe_events" ALTER COLUMN "processed_at" DROP NOT NULL;
