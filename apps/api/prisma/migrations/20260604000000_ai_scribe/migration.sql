-- AI Scribe: champs sur video_rooms et sessions
ALTER TABLE video_rooms
  ADD COLUMN IF NOT EXISTS scribe_enabled BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS scribe_status  TEXT    NOT NULL DEFAULT 'none';

ALTER TABLE sessions
  ADD COLUMN IF NOT EXISTS scribe_transcript TEXT;
