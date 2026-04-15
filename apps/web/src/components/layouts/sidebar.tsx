'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import type { LucideIcon } from 'lucide-react';
import {
  LayoutDashboard,
  Users,
  CalendarCheck,
  Calendar,
  ClipboardList,
  MessageSquare,
  Sparkles,
  BookOpen,
  BarChart2,
  Target,
  FileText,
  Network,
  Receipt,
  Settings,
  CreditCard,
  UserCircle,
  LogOut,
  GraduationCap,
  Gift,
  Video,
  Megaphone,
  Calculator,
} from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';

interface NavItem {
  label: string;
  href: string;
  icon: LucideIcon;
  exact?: boolean;
}

interface NavGroup {
  label?: string;
  items: NavItem[];
}

const NAV_GROUPS: NavGroup[] = [
  {
    // Pas de label — section principale toujours visible
    items: [
      { label: 'Dashboard', href: '/dashboard', icon: LayoutDashboard, exact: true },
      { label: 'Patients', href: '/dashboard/patients', icon: Users },
      { label: 'Séances', href: '/dashboard/sessions', icon: CalendarCheck },
      { label: 'Calendrier', href: '/dashboard/calendar', icon: Calendar },
    ],
  },
  {
    label: 'Communication',
    items: [
      { label: 'Messages', href: '/dashboard/messages', icon: MessageSquare },
      { label: 'Visio', href: '/dashboard/video', icon: Video },
      { label: 'Liste d\'attente', href: '/dashboard/waitlist', icon: ClipboardList },
    ],
  },
  {
    label: 'Clinique',
    items: [
      { label: 'Templates notes', href: '/dashboard/note-templates', icon: FileText },
      { label: 'Outcomes', href: '/dashboard/outcomes', icon: Target },
      { label: 'Réseau Pro', href: '/dashboard/network', icon: Network },
      { label: 'Supervision', href: '/dashboard/supervision', icon: GraduationCap },
    ],
  },
  {
    label: 'IA & Contenu',
    items: [
      { label: 'Assistant IA', href: '/dashboard/ai-assistant', icon: Sparkles },
      { label: 'Marketing IA', href: '/dashboard/marketing', icon: Megaphone },
      { label: 'Formations', href: '/dashboard/courses', icon: BookOpen },
    ],
  },
  {
    label: 'Gestion',
    items: [
      { label: 'Paiements', href: '/dashboard/payments', icon: CreditCard },
      { label: 'Factures', href: '/dashboard/invoices', icon: Receipt },
      { label: 'Comptabilité', href: '/dashboard/accounting', icon: Calculator },
      { label: 'Analytiques', href: '/dashboard/analytics', icon: BarChart2 },
      { label: 'Parrainage', href: '/dashboard/referral', icon: Gift },
    ],
  },
];

interface SidebarProps {
  userEmail: string;
  userName: string;
}

export function Sidebar({ userEmail, userName }: SidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string, exact = false) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside className="hidden md:flex w-64 flex-col bg-white border-r border-border flex-shrink-0">
      {/* Logo */}
      <div className="p-5 border-b border-border">
        <Link href="/dashboard" className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
            <span className="text-white text-sm font-bold">PS</span>
          </div>
          <span className="text-lg font-bold text-primary">PsyLib</span>
        </Link>
      </div>

      {/* Navigation groupée */}
      <nav className="flex-1 px-3 py-2 overflow-y-auto" aria-label="Navigation principale">
        {NAV_GROUPS.map((group, gi) => (
          <div key={gi} className={gi > 0 ? 'mt-4' : ''}>
            {group.label && (
              <p className="px-3 mb-1 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground/60">
                {group.label}
              </p>
            )}
            <div className="space-y-0.5">
              {group.items.map((item) => {
                const active = isActive(item.href, item.exact);
                return (
                  <Link
                    key={item.href}
                    href={item.href}
                    className={cn(
                      'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px]',
                      active
                        ? 'bg-primary/10 text-primary'
                        : 'text-muted-foreground hover:bg-surface hover:text-foreground',
                    )}
                    aria-current={active ? 'page' : undefined}
                  >
                    <item.icon
                      size={17}
                      className={active ? 'text-primary' : 'text-muted-foreground'}
                      aria-hidden
                    />
                    {item.label}
                  </Link>
                );
              })}
            </div>
          </div>
        ))}
      </nav>

      {/* Footer */}
      <div className="p-3 border-t border-border space-y-0.5">
        <Link
          href="/dashboard/settings/profile"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px]',
            isActive('/dashboard/settings/profile')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-surface hover:text-foreground',
          )}
          aria-current={isActive('/dashboard/settings/profile') ? 'page' : undefined}
        >
          <UserCircle size={17} aria-hidden />
          Mon profil
        </Link>
        <Link
          href="/dashboard/settings"
          className={cn(
            'flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors min-h-[40px]',
            isActive('/dashboard/settings') && !isActive('/dashboard/settings/profile') && !isActive('/dashboard/settings/billing')
              ? 'bg-primary/10 text-primary'
              : 'text-muted-foreground hover:bg-surface hover:text-foreground',
          )}
        >
          <Settings size={17} aria-hidden />
          Réglages
        </Link>

        {/* User */}
        <div className="flex items-center gap-3 px-3 py-2">
          <div className="h-7 w-7 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
            <span className="text-xs font-semibold text-primary">
              {getInitials(userName || userEmail)}
            </span>
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-xs font-medium text-foreground truncate">{userName || userEmail}</p>
            {userName && (
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            )}
          </div>
          <button
            onClick={() => void signOut({ callbackUrl: '/login' })}
            className="p-1.5 rounded hover:bg-surface text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Se déconnecter"
          >
            <LogOut size={15} aria-hidden />
          </button>
        </div>
      </div>
    </aside>
  );
}
