-- AddIndexes: audit technical fixes — missing FK indexes and relations

-- SupervisionMember.psyId
CREATE INDEX IF NOT EXISTS "idx_supervision_members_psy" ON "supervision_members"("psy_id");

-- GdprConsent.guardianId
CREATE INDEX IF NOT EXISTS "idx_gdpr_consents_guardian" ON "gdpr_consents"("guardian_id");

-- Assessment.templateId
CREATE INDEX IF NOT EXISTS "idx_assessments_template" ON "assessments"("template_id");

-- CourseEnrollment.paymentId
CREATE INDEX IF NOT EXISTS "idx_course_enrollments_payment" ON "course_enrollments"("payment_id");

-- AlterTable: add FK constraint CourseEnrollment.paymentId -> payments.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'course_enrollments_payment_id_fkey'
    AND table_name = 'course_enrollments'
  ) THEN
    ALTER TABLE "course_enrollments" ADD CONSTRAINT "course_enrollments_payment_id_fkey"
      FOREIGN KEY ("payment_id") REFERENCES "payments"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;

-- AlterTable: add FK constraint Session.templateId -> note_templates.id
DO $$ BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.table_constraints
    WHERE constraint_name = 'sessions_template_id_fkey'
    AND table_name = 'sessions'
  ) THEN
    ALTER TABLE "sessions" ADD CONSTRAINT "sessions_template_id_fkey"
      FOREIGN KEY ("template_id") REFERENCES "note_templates"("id") ON DELETE SET NULL ON UPDATE CASCADE;
  END IF;
END $$;
