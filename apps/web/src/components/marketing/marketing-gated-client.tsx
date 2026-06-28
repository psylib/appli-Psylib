'use client';

import dynamic from 'next/dynamic';

// `next/dynamic` avec `ssr: false` doit vivre dans un Client Component depuis Next 15
// (toléré dans un Server Component en Next 14). On conserve le comportement « pas de SSR »
// du composant marketing (lazy-load + APIs navigateur) via ce wrapper client.
const MarketingGated = dynamic(
  () => import('@/components/marketing/marketing-gated').then((m) => m.MarketingGated),
  { ssr: false },
);

export default function MarketingGatedClient() {
  return <MarketingGated />;
}
