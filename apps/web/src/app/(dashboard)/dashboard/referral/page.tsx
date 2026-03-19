import type { Metadata } from 'next';
import { ReferralPage } from '@/components/referral/referral-page';

export const metadata: Metadata = {
  title: 'Parrainage — PsyLib',
};

export default function Page() {
  return <ReferralPage />;
}
