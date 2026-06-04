-- Fix FK drift bloquant la suppression de compte psychologue.
-- Le schéma Prisma déclare onDelete: Cascade sur ces relations, mais la DB
-- de prod avait NO ACTION / RESTRICT (drift). Recréation idempotente en CASCADE.

-- video_rooms.psychologist_id : RESTRICT -> CASCADE
ALTER TABLE "video_rooms" DROP CONSTRAINT IF EXISTS "video_rooms_psychologist_id_fkey";
ALTER TABLE "video_rooms" ADD CONSTRAINT "video_rooms_psychologist_id_fkey"
  FOREIGN KEY ("psychologist_id") REFERENCES "psychologists"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;

-- psychologists.user_id : NO ACTION -> CASCADE
ALTER TABLE "psychologists" DROP CONSTRAINT IF EXISTS "psychologists_user_id_fkey";
ALTER TABLE "psychologists" ADD CONSTRAINT "psychologists_user_id_fkey"
  FOREIGN KEY ("user_id") REFERENCES "users"("id")
  ON DELETE CASCADE ON UPDATE CASCADE;
