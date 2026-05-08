-- CreateEnum CalendarProvider
DO $$ BEGIN
  CREATE TYPE "CalendarProvider" AS ENUM ('google');
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

-- CreateTable calendar_connections
CREATE TABLE IF NOT EXISTS "calendar_connections" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "psychologist_id" UUID NOT NULL,
  "provider" "CalendarProvider" NOT NULL DEFAULT 'google',
  "access_token" TEXT NOT NULL,
  "refresh_token" TEXT NOT NULL,
  "token_expires_at" TIMESTAMP(3),
  "email" TEXT,
  "calendar_id" TEXT NOT NULL DEFAULT 'primary',
  "sync_token" TEXT,
  "watch_channel_id" TEXT,
  "watch_resource_id" TEXT,
  "watch_token" TEXT,
  "watch_expiration" TIMESTAMP(3),
  "last_sync_at" TIMESTAMP(3),
  "is_active" BOOLEAN NOT NULL DEFAULT true,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "calendar_connections_pkey" PRIMARY KEY ("id")
);

-- CreateTable external_calendar_events
CREATE TABLE IF NOT EXISTS "external_calendar_events" (
  "id" UUID NOT NULL DEFAULT gen_random_uuid(),
  "psychologist_id" UUID NOT NULL,
  "calendar_connection_id" UUID NOT NULL,
  "external_id" TEXT NOT NULL,
  "title" TEXT,
  "start_at" TIMESTAMP(3) NOT NULL,
  "end_at" TIMESTAMP(3) NOT NULL,
  "is_all_day" BOOLEAN NOT NULL DEFAULT false,
  "status" TEXT NOT NULL DEFAULT 'confirmed',
  "last_updated_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "external_calendar_events_pkey" PRIMARY KEY ("id")
);

-- Add googleEventId to appointments
DO $$ BEGIN
  ALTER TABLE "appointments" ADD COLUMN "google_event_id" TEXT;
EXCEPTION WHEN duplicate_column THEN NULL;
END $$;

-- Unique constraints
CREATE UNIQUE INDEX IF NOT EXISTS "calendar_connections_psychologist_id_key"
  ON "calendar_connections"("psychologist_id");

CREATE UNIQUE INDEX IF NOT EXISTS "external_calendar_events_connection_external_key"
  ON "external_calendar_events"("calendar_connection_id", "external_id");

-- Indexes
CREATE INDEX IF NOT EXISTS "idx_external_events_psy_dates"
  ON "external_calendar_events"("psychologist_id", "start_at", "end_at");

CREATE INDEX IF NOT EXISTS "idx_calendar_connections_psy"
  ON "calendar_connections"("psychologist_id");

-- Foreign keys
DO $$ BEGIN
  ALTER TABLE "calendar_connections"
    ADD CONSTRAINT "calendar_connections_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_calendar_events"
    ADD CONSTRAINT "external_calendar_events_psychologist_id_fkey"
    FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;

DO $$ BEGIN
  ALTER TABLE "external_calendar_events"
    ADD CONSTRAINT "external_calendar_events_calendar_connection_id_fkey"
    FOREIGN KEY ("calendar_connection_id") REFERENCES "calendar_connections"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN NULL;
END $$;
