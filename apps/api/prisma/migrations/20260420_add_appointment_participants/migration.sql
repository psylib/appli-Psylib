-- CreateTable: appointment_participants
CREATE TABLE IF NOT EXISTS "appointment_participants" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "appointment_id" UUID NOT NULL,
    "patient_id" UUID NOT NULL,
    "video_join_token" TEXT,
    "video_link_sent_at" TIMESTAMPTZ,
    "joined_at" TIMESTAMPTZ,
    "created_at" TIMESTAMPTZ NOT NULL DEFAULT now(),
    CONSTRAINT "appointment_participants_pkey" PRIMARY KEY ("id")
);

-- Add participantIds to sessions
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'sessions' AND column_name = 'participant_ids') THEN
    ALTER TABLE "sessions" ADD COLUMN "participant_ids" TEXT[] NOT NULL DEFAULT '{}';
  END IF;
END $$;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "appointment_participants_video_join_token_key" ON "appointment_participants"("video_join_token");
CREATE UNIQUE INDEX IF NOT EXISTS "appointment_participants_appointment_id_patient_id_key" ON "appointment_participants"("appointment_id", "patient_id");

-- Indexes
CREATE INDEX IF NOT EXISTS "appointment_participants_patient_id_idx" ON "appointment_participants"("patient_id");
CREATE INDEX IF NOT EXISTS "appointment_participants_video_join_token_idx" ON "appointment_participants"("video_join_token");

-- Foreign keys
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointment_participants_appointment_id_fkey') THEN
    ALTER TABLE "appointment_participants" ADD CONSTRAINT "appointment_participants_appointment_id_fkey"
        FOREIGN KEY ("appointment_id") REFERENCES "appointments"("id") ON DELETE CASCADE;
  END IF;
END $$;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'appointment_participants_patient_id_fkey') THEN
    ALTER TABLE "appointment_participants" ADD CONSTRAINT "appointment_participants_patient_id_fkey"
        FOREIGN KEY ("patient_id") REFERENCES "patients"("id") ON DELETE CASCADE;
  END IF;
END $$;
