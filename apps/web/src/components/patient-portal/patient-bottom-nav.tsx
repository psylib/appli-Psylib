'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const NAV_ITEMS = [
  { label: 'Accueil', href: '/patient-portal' },
  { label: 'Humeur', href: '/patient-portal/mood' },
  { label: 'Exercices', href: '/patient-portal/exercises' },
  { label: 'Journal', href: '/patient-portal/journal' },
  { label: 'Documents', href: '/patient-portal/documents' },
];

export function PatientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex md:hidden pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center py-3 text-xs transition-colors min-h-touch ${
              isActive
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
