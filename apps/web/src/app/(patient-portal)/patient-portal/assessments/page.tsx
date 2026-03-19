import type { Metadata } from 'next';
import { PatientAssessmentsContent } from '@/components/outcomes/patient-assessments';

export const metadata: Metadata = { title: 'Mes évaluations' };

export default function PatientAssessmentsPage() {
  return <PatientAssessmentsContent />;
}
