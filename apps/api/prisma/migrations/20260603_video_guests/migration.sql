-- Salle d'attente / invités ad-hoc en visio (lien généré en direct par le psy)

ALTER TABLE "video_rooms" ADD COLUMN IF NOT EXISTS "guest_invite_token" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "video_rooms_guest_invite_token_key" ON "video_rooms"("guest_invite_token");

CREATE TABLE IF NOT EXISTS "video_guests" (
  "id" TEXT NOT NULL,
  "video_room_id" TEXT NOT NULL,
  "display_name" TEXT NOT NULL,
  "session_token" TEXT NOT NULL,
  "status" TEXT NOT NULL DEFAULT 'pending',
  "consent_at" TIMESTAMP(3),
  "admitted_at" TIMESTAMP(3),
  "ip_address" TEXT,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "video_guests_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX IF NOT EXISTS "video_guests_session_token_key" ON "video_guests"("session_token");
CREATE INDEX IF NOT EXISTS "video_guests_video_room_id_status_idx" ON "video_guests"("video_room_id", "status");

DO $$ BEGIN
  ALTER TABLE "video_guests"
    ADD CONSTRAINT "video_guests_video_room_id_fkey"
    FOREIGN KEY ("video_room_id") REFERENCES "video_rooms"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION WHEN duplicate_object THEN null; END $$;
