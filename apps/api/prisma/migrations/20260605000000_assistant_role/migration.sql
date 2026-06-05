-- AlterEnum: add 'assistant' to UserRole (idempotent)
-- ADD VALUE cannot run inside a transaction block on PG < 12; guarded for safety.
DO $$ BEGIN
  ALTER TYPE "UserRole" ADD VALUE IF NOT EXISTS 'assistant';
EXCEPTION WHEN others THEN NULL;
END $$;

-- CreateEnum: AssistantInvitationStatus
DO $$ BEGIN
  CREATE TYPE "AssistantInvitationStatus" AS ENUM ('pending', 'accepted', 'expired');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable: assistants
CREATE TABLE IF NOT EXISTS "assistants" (
    "id" TEXT NOT NULL,
    "user_id" TEXT,
    "psychologist_id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "assistants_pkey" PRIMARY KEY ("id")
);

-- CreateTable: assistant_invitations
CREATE TABLE IF NOT EXISTS "assistant_invitations" (
    "id" TEXT NOT NULL,
    "psychologist_id" TEXT NOT NULL,
    "assistant_id" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "status" "AssistantInvitationStatus" NOT NULL DEFAULT 'pending',
    "expires_at" TIMESTAMP(3) NOT NULL,
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "assistant_invitations_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX IF NOT EXISTS "assistants_psychologist_id_email_key" ON "assistants"("psychologist_id", "email");
CREATE INDEX IF NOT EXISTS "idx_assistants_user" ON "assistants"("user_id");
CREATE INDEX IF NOT EXISTS "idx_assistants_psy" ON "assistants"("psychologist_id");

CREATE UNIQUE INDEX IF NOT EXISTS "assistant_invitations_token_key" ON "assistant_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_assistant_invitations_token" ON "assistant_invitations"("token");
CREATE INDEX IF NOT EXISTS "idx_assistant_invitations_assistant" ON "assistant_invitations"("assistant_id");
CREATE INDEX IF NOT EXISTS "idx_assistant_invitations_psy" ON "assistant_invitations"("psychologist_id");

-- AddForeignKey
DO $$ BEGIN
  ALTER TABLE "assistants" ADD CONSTRAINT "assistants_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "users"("id") ON DELETE SET NULL ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "assistants" ADD CONSTRAINT "assistants_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "assistant_invitations" ADD CONSTRAINT "assistant_invitations_psychologist_id_fkey" FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "assistant_invitations" ADD CONSTRAINT "assistant_invitations_assistant_id_fkey" FOREIGN KEY ("assistant_id") REFERENCES "assistants"("id") ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
