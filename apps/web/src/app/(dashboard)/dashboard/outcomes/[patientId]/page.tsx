import type { Metadata } from 'next';
import { PatientEvolutionContent } from '@/components/outcomes/patient-evolution';

export const metadata: Metadata = { title: 'Évolution patient' };

interface Props {
  params: Promise<{ patientId: string }>;
}

export default async function PatientEvolutionPage({ params }: Props) {
  const { patientId } = await params;
  return <PatientEvolutionContent patientId={patientId} />;
}
