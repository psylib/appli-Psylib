import { PatientDetailContent } from '@/components/patients/patient-detail';

export const metadata = { title: 'Fiche patient' };

export default async function PatientDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <PatientDetailContent patientId={id} />;
}
