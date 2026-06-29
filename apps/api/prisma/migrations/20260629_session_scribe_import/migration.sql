-- Import audio Scribe IA pour séances en présentiel (hors visio).
-- Statut de traitement de la transcription/note IA, par séance.
ALTER TABLE "sessions" ADD COLUMN "scribe_status" TEXT NOT NULL DEFAULT 'none';
