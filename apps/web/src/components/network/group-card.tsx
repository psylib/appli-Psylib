'use client';

import { Users, BookOpen, GraduationCap, MoreHorizontal, MapPin, Lock } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import type { NetworkGroup, GroupType } from '@/lib/api/network';
import { GROUP_TYPE_LABELS, GROUP_TYPE_COLORS } from '@/lib/api/network';

// ─── Group type icon ──────────────────────────────────────────────────────────

function GroupTypeIcon({ type, size = 18 }: { type: GroupType; size?: number }) {
  switch (type) {
    case 'supervision':
      return <GraduationCap size={size} aria-hidden />;
    case 'intervision':
      return <Users size={size} aria-hidden />;
    case 'formation':
      return <BookOpen size={size} aria-hidden />;
    case 'autre':
    default:
      return <MoreHorizontal size={size} aria-hidden />;
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface GroupCardProps {
  group: NetworkGroup;
  isMember: boolean;
  onJoin?: () => void;
  onLeave?: () => void;
}

// ─── Component ────────────────────────────────────────────────────────────────

export function GroupCard({ group, isMember, onJoin, onLeave }: GroupCardProps) {
  const colors = GROUP_TYPE_COLORS[group.type];
  const label = GROUP_TYPE_LABELS[group.type];
  const memberCount = group._count.members;
  const isFull = memberCount >= group.maxMembers;

  return (
    <Card className="flex flex-col overflow-hidden transition-shadow hover:shadow-md">
      <CardContent className="p-4 flex flex-col gap-3 h-full">
        {/* Header: icon + type badge + private badge */}
        <div className="flex items-start justify-between gap-2">
          <div className="flex items-center gap-2">
            <div
              className={cn(
                'h-9 w-9 rounded-lg flex items-center justify-center flex-shrink-0',
                colors.bg,
                colors.text,
              )}
            >
              <GroupTypeIcon type={group.type} size={18} />
            </div>
            <span
              className={cn(
                'inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold border',
                colors.bg,
                colors.text,
                colors.border,
              )}
            >
              {label}
            </span>
          </div>

          {group.isPrivate && (
            <span className="inline-flex items-center gap-1 text-xs font-medium text-gray-500 bg-gray-100 border border-gray-200 rounded-full px-2 py-0.5 flex-shrink-0">
              <Lock size={10} aria-hidden />
              Privé
            </span>
          )}
        </div>

        {/* Name */}
        <h3 className="font-semibold text-sm text-foreground leading-tight">{group.name}</h3>

        {/* Description */}
        {group.description && (
          <p className="text-xs text-muted-foreground line-clamp-2">{group.description}</p>
        )}

        {/* City */}
        {group.city && (
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <MapPin size={12} aria-hidden />
            <span>{group.city}</span>
          </div>
        )}

        {/* Members count + owner */}
        <div className="flex items-center justify-between text-xs text-muted-foreground mt-auto">
          <span
            className={cn(
              'font-medium',
              isFull ? 'text-destructive' : 'text-muted-foreground',
            )}
          >
            {memberCount} / {group.maxMembers} membres
          </span>
          <span className="truncate ml-2">par {group.owner.name}</span>
        </div>

        {/* Action */}
        <div className="pt-1 border-t border-border">
          {isMember ? (
            onLeave ? (
              <Button
                size="sm"
                variant="outline"
                onClick={onLeave}
                className="w-full text-xs h-8 text-muted-foreground"
              >
                Quitter le groupe
              </Button>
            ) : (
              <div className="text-xs text-center text-muted-foreground py-1 font-medium">
                Vous êtes membre
              </div>
            )
          ) : !group.isPrivate ? (
            <Button
              size="sm"
              onClick={onJoin}
              disabled={isFull || !onJoin}
              className="w-full text-xs h-8"
            >
              {isFull ? 'Groupe complet' : 'Rejoindre'}
            </Button>
          ) : (
            <div className="text-xs text-center text-muted-foreground py-1">
              Groupe sur invitation
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
