import type { Metadata } from 'next';
import { PatientEvolutionContent } from '@/components/outcomes/patient-evolution';

export const metadata: Metadata = { title: 'Évolution patient' };

interface Props {
  params: { patientId: string };
}

export default function PatientEvolutionPage({ params }: Props) {
  return <PatientEvolutionContent patientId={params.patientId} />;
}
