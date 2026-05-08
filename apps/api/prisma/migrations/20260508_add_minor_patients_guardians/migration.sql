-- CreateEnum: guardian_relationship
DO $$ BEGIN
  CREATE TYPE "guardian_relationship" AS ENUM ('mother', 'father', 'legal_guardian', 'other');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: guardian_invitation_status
DO $$ BEGIN
  CREATE TYPE "guardian_invitation_status" AS ENUM ('pending', 'accepted', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: guardian_consent_request_status
DO $$ BEGIN
  CREATE TYPE "guardian_consent_request_status" AS ENUM ('pending', 'approved', 'refused');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateEnum: consent_given_by
DO $$ BEGIN
  CREATE TYPE "consent_given_by" AS ENUM ('patient', 'guardian');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- AlterTable: patients - add is_minor column
ALTER TABLE "patients" ADD COLUMN IF NOT EXISTS "is_minor" BOOLEAN NOT NULL DEFAULT false;

-- AlterTable: gdpr_consents - add consent_given_by and guardian_id columns
ALTER TABLE "gdpr_consents" ADD COLUMN IF NOT EXISTS "consent_given_by" "consent_given_by" NOT NULL DEFAULT 'patient';
ALTER TABLE "gdpr_consents" ADD COLUMN IF NOT EXISTS "guardian_id" TEXT;
ALTER TABLE "gdpr_consents" ADD COLUMN IF NOT EXISTS "refused_at" TIMESTAMP(3);

-- CreateTable: legal_guardians
CREATE TABLE IF NOT EXISTS "legal_guardians" (
    "id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "user_id" TEXT,
    "psychologist_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT,
    "relationship" "guardian_relationship" NOT NULL,
    "is_primary" BOOLEAN NOT NULL DEFAULT false,
    "permissions" JSONB NOT NULL DEFAULT '{"portal":true,"invoices":true,"video":false,"documents":true,"messaging":false}',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "legal_guardians_pkey" PRIMARY KEY ("id")
);

-- CreateTable: guardian_invitations
CREATE TABLE IF NOT EXISTS "guardian_invitations" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "guardian_invitation_status" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateTable: guardian_consent_requests
CREATE TABLE IF NOT EXISTS "guardian_consent_requests" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "guardian_id" TEXT NOT NULL,
    "patient_id" TEXT NOT NULL,
    "consent_type" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "guardian_consent_request_status" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "responded_at" TIMESTAMP(3),
    "ip_address" TEXT,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "guardian_consent_requests_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "legal_guardians_patient_id_email_key" ON "legal_guardians"("patient_id", "email");
CREATE INDEX IF NOT EXISTS "idx_legal_guardians_patient" ON "legal_guardians"("patient_id");
CREATE INDEX IF NOT EXISTS "idx_legal_guardians_user" ON "legal_guardians"("user_id");
CREATE INDEX IF NOT EXISTS "idx_legal_guardians_psy" ON "legal_guardians"("psychologist_id");

CREATE UNIQUE INDEX IF NOT EXISTS "guardian_invitations_token_key" ON "guardian_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_guardian_invitations_token" ON "guardian_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_guardian_invitations_guardian" ON "guardian_invitations"("guardian_id");

CREATE UNIQUE INDEX IF NOT EXISTS "guardian_consent_requests_token_key" ON "guardian_consent_requests"("token");
CREATE INDEX IF NOT EXISTS "idx_guardian_consent_requests_token" ON "guardian_consent_requests"("token");
CREATE INDEX IF NOT EXISTS "idx_guardian_consent_req_guardian_patient" ON "guardian_consent_requests"("guardian_id", "patient_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "legal_guardians" ADD CONSTRAINT "legal_guardians_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "legal_guardians" ADD CONSTRAINT "legal_guardians_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "legal_guardians" ADD CONSTRAINT "legal_guardians_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "guardian_invitations" ADD CONSTRAINT "guardian_invitations_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "guardian_invitations" ADD CONSTRAINT "guardian_invitations_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "legal_guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "guardian_consent_requests" ADD CONSTRAINT "guardian_consent_requests_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "guardian_consent_requests" ADD CONSTRAINT "guardian_consent_requests_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "legal_guardians"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "guardian_consent_requests" ADD CONSTRAINT "guardian_consent_requests_patient_id_fkey" FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "gdpr_consents" ADD CONSTRAINT "gdpr_consents_guardian_id_fkey" FOREIGN KEY ("guardian_id") REFERENCES "legal_guardians"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
