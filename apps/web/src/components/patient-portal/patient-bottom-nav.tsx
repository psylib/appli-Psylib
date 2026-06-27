'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Smile, Dumbbell, BookOpen, FileText, type LucideIcon } from 'lucide-react';

const NAV_ITEMS: { label: string; href: string; icon: LucideIcon }[] = [
  { label: 'Accueil', href: '/patient-portal', icon: Home },
  { label: 'Humeur', href: '/patient-portal/mood', icon: Smile },
  { label: 'Exercices', href: '/patient-portal/exercises', icon: Dumbbell },
  { label: 'Journal', href: '/patient-portal/journal', icon: BookOpen },
  { label: 'Documents', href: '/patient-portal/documents', icon: FileText },
];

export function PatientBottomNav() {
  const pathname = usePathname();

  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-border flex md:hidden pb-safe">
      {NAV_ITEMS.map((item) => {
        const isActive = pathname === item.href;
        const Icon = item.icon;
        return (
          <Link
            key={item.href}
            href={item.href}
            aria-current={isActive ? 'page' : undefined}
            className={`flex-1 flex flex-col items-center justify-center gap-0.5 py-2 text-xs transition-colors min-h-touch ${
              isActive
                ? 'text-primary font-medium'
                : 'text-muted-foreground hover:text-primary'
            }`}
          >
            <Icon size={20} aria-hidden strokeWidth={isActive ? 2.4 : 2} />
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
