'use client';

import { MapPin, Send } from 'lucide-react';
import { cn, getInitials } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { DirectoryEntry } from '@/lib/api/network';
import { APPROACH_COLORS } from '@/lib/api/network';

// ─── Avatar color derived from name ───────────────────────────────────────────

const AVATAR_COLORS = [
  'bg-blue-100 text-blue-700',
  'bg-purple-100 text-purple-700',
  'bg-green-100 text-green-700',
  'bg-amber-100 text-amber-700',
  'bg-rose-100 text-rose-700',
  'bg-cyan-100 text-cyan-700',
  'bg-indigo-100 text-indigo-700',
  'bg-teal-100 text-teal-700',
];

function getAvatarColor(name: string): string {
  let hash = 0;
  for (let i = 0; i < name.length; i++) {
    hash = name.charCodeAt(i) + ((hash << 5) - hash);
  }
  return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length] ?? AVATAR_COLORS[0]!;
}

function getApproachColors(approach: string): { bg: string; text: string; border: string } {
  return (
    APPROACH_COLORS[approach] ?? {
      bg: 'bg-gray-50',
      text: 'text-gray-700',
      border: 'border-gray-200',
    }
  );
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface PsyCardProps {
  entry: DirectoryEntry;
  onReferral?: (psyId: string, psyName: string) => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function PsyCard({ entry, onReferral }: PsyCardProps) {
  const { psychologist } = entry;
  const name = psychologist.name;
  const avatarColor = getAvatarColor(name);
  const initials = getInitials(name);

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Header: avatar + name + specialization */}
        <div className="flex items-start gap-3">
          <div
            className={cn(
              'h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 text-sm font-semibold',
              avatarColor,
            )}
            aria-hidden="true"
          >
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground leading-tight truncate">{name}</p>
            {psychologist.specialization && (
              <p className="text-xs text-muted-foreground truncate mt-0.5">
                {psychologist.specialization}
              </p>
            )}
          </div>
        </div>

        {/* Location */}
        {(entry.city ?? entry.department) && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} aria-hidden />
            <span>
              {[entry.city, entry.department].filter(Boolean).join(' — ')}
            </span>
          </div>
        )}

        {/* Approaches */}
        {entry.approaches.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.approaches.map((approach) => {
              const colors = getApproachColors(approach);
              return (
                <span
                  key={approach}
                  className={cn(
                    'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium border',
                    colors.bg,
                    colors.text,
                    colors.border,
                  )}
                >
                  {approach}
                </span>
              );
            })}
          </div>
        )}

        {/* Specialties */}
        {entry.specialties.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            {entry.specialties.map((specialty) => (
              <span
                key={specialty}
                className="inline-flex items-center rounded-full px-2 py-0.5 text-xs bg-gray-100 text-gray-600"
              >
                {specialty}
              </span>
            ))}
          </div>
        )}

        {/* Bio */}
        {entry.bio && (
          <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{entry.bio}</p>
        )}

        {/* Referral status + action */}
        <div className="flex items-center justify-between gap-2 mt-auto pt-1">
          {entry.acceptsReferrals ? (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-green-700 bg-green-50 border border-green-200 rounded-full px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" aria-hidden />
              Accepte les adressages
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5">
              <span className="h-1.5 w-1.5 rounded-full bg-gray-400" aria-hidden />
              Indisponible
            </span>
          )}

          {entry.acceptsReferrals && onReferral && (
            <Button
              size="sm"
              variant="outline"
              onClick={() => onReferral(psychologist.id, name)}
              className="text-xs h-7 px-2.5 gap-1.5"
            >
              <Send size={12} aria-hidden />
              Adresser
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
