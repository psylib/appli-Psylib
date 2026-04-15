'use client';

import type { LucideIcon } from 'lucide-react';
import {
  Home,
  Shield,
  Monitor,
  Phone,
  GraduationCap,
  Users,
  Briefcase,
  Car,
  Paperclip,
  TestTube,
  Landmark,
  Calculator,
  Sparkles,
  Folder,
} from 'lucide-react';
import { cn } from '@/lib/utils';

interface CategoryConfig {
  label: string;
  icon: LucideIcon;
  color: string;
}

const CATEGORY_CONFIG: Record<string, CategoryConfig> = {
  rent:             { label: 'Loyer et charges',   icon: Home,          color: 'bg-blue-100 text-blue-700' },
  insurance:        { label: 'Assurances',          icon: Shield,        color: 'bg-purple-100 text-purple-700' },
  equipment:        { label: 'Matériel',            icon: Monitor,       color: 'bg-orange-100 text-orange-700' },
  it_software:      { label: 'Informatique',        icon: Monitor,       color: 'bg-indigo-100 text-indigo-700' },
  phone_internet:   { label: 'Tél./Internet',       icon: Phone,         color: 'bg-cyan-100 text-cyan-700' },
  training:         { label: 'Formation',           icon: GraduationCap, color: 'bg-emerald-100 text-emerald-700' },
  supervision:      { label: 'Supervision',         icon: Users,         color: 'bg-pink-100 text-pink-700' },
  professional_fees:{ label: 'Cotisations',         icon: Briefcase,     color: 'bg-amber-100 text-amber-700' },
  transport:        { label: 'Déplacements',        icon: Car,           color: 'bg-green-100 text-green-700' },
  office_supplies:  { label: 'Fournitures',         icon: Paperclip,     color: 'bg-slate-100 text-slate-700' },
  tests_tools:      { label: 'Tests et outils',     icon: TestTube,      color: 'bg-red-100 text-red-700' },
  bank_fees:        { label: 'Frais bancaires',     icon: Landmark,      color: 'bg-gray-100 text-gray-700' },
  accounting:       { label: 'Comptabilité',        icon: Calculator,    color: 'bg-violet-100 text-violet-700' },
  cleaning:         { label: 'Entretien',           icon: Sparkles,      color: 'bg-teal-100 text-teal-700' },
  other:            { label: 'Autres',              icon: Folder,        color: 'bg-neutral-100 text-neutral-700' },
};

export const CATEGORY_OPTIONS = Object.entries(CATEGORY_CONFIG).map(([value, cfg]) => ({
  value,
  label: cfg.label,
}));

export function ExpenseCategoryBadge({ category }: { category: string }) {
  const config = CATEGORY_CONFIG[category] ?? CATEGORY_CONFIG['other']!;
  const Icon = config.icon;
  return (
    <span
      className={cn(
        'inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium',
        config.color,
      )}
    >
      <Icon size={12} aria-hidden />
      {config.label}
    </span>
  );
}
