'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, Users, CalendarCheck, Sparkles, Plus } from 'lucide-react';
import { cn } from '@/lib/utils';

const BOTTOM_NAV_ITEMS = [
  { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
  { label: 'Patients', href: '/dashboard/patients', icon: Users, exact: false },
  { label: 'Séances', href: '/dashboard/sessions', icon: CalendarCheck, exact: false },
  { label: 'IA', href: '/dashboard/ai-assistant', icon: Sparkles, exact: false },
] as const;

export function MobileNav() {
  const pathname = usePathname();

  const isActive = (href: string, exact: boolean) =>
    exact ? pathname === href : pathname.startsWith(href);

  return (
    <>
      {/* FAB — Nouvelle séance */}
      <Link
        href="/dashboard/sessions/new"
        className={cn(
          'fixed bottom-20 right-4 z-50 md:hidden',
          'h-14 w-14 rounded-full bg-primary text-white shadow-lg',
          'flex items-center justify-center',
          'hover:bg-primary/90 active:scale-95 transition-all',
          'focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2',
        )}
        aria-label="Nouvelle séance"
      >
        <Plus size={24} aria-hidden />
      </Link>

      {/* Bottom navigation bar */}
      <nav
        className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-white border-t border-border"
        aria-label="Navigation principale"
      >
        <div className="flex items-stretch h-16">
          {BOTTOM_NAV_ITEMS.map((item) => {
            const active = isActive(item.href, item.exact);
            return (
              <Link
                key={item.href}
                href={item.href}
                className={cn(
                  'flex-1 flex flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors',
                  active ? 'text-primary' : 'text-muted-foreground',
                )}
                aria-current={active ? 'page' : undefined}
              >
                <item.icon
                  size={22}
                  className={active ? 'text-primary' : 'text-muted-foreground'}
                  aria-hidden
                />
                {item.label}
              </Link>
            );
          })}
        </div>
      </nav>
    </>
  );
}
