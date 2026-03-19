import { PatientDetailContent } from '@/components/patients/patient-detail';

export const metadata = { title: 'Fiche patient' };

export default function PatientDetailPage({ params }: { params: { id: string } }) {
  return <PatientDetailContent patientId={params.id} />;
}
