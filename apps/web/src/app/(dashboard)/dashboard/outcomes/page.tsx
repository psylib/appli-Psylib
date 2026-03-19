import type { Metadata } from 'next';
import { OutcomesOverviewContent } from '@/components/outcomes/outcomes-overview';

export const metadata: Metadata = { title: 'Outcome Tracking' };

export default function OutcomesPage() {
  return <OutcomesOverviewContent />;
}
