-- WORM / preuve d'intégrité HDS pour audit_logs : chaînage cryptographique.
--
-- Chaque nouvelle entrée porte un hash SHA-256 de son contenu + le hash de
-- l'entrée précédente (prev_hash). Toute modification de contenu casse le hash ;
-- toute suppression casse le lien prev_hash → altération a posteriori détectable
-- par le vérificateur (AuditService.verifyChain). Voir common/audit-hash.ts.
--
-- Idempotent (IF NOT EXISTS) — conforme à la règle migrations du projet.

-- 1. seq : position monotone dans la chaîne (BIGSERIAL crée la séquence + le
--    default nextval()). Les lignes legacy existantes reçoivent un seq dans un
--    ordre arbitraire mais unique ; elles n'ont pas de hash → hors chaîne.
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "seq" BIGSERIAL;

-- 2. Chaîne cryptographique. Nullable = entrées legacy (avant activation WORM).
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "hash" TEXT;
ALTER TABLE "audit_logs" ADD COLUMN IF NOT EXISTS "prev_hash" TEXT;

-- 3. Unicité du seq (attendue par le schéma Prisma @unique). Nom aligné sur la
--    convention Prisma pour éviter tout drift au prochain migrate diff.
CREATE UNIQUE INDEX IF NOT EXISTS "audit_logs_seq_key" ON "audit_logs"("seq");
