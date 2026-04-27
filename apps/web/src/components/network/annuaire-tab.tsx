'use client';

import { useState } from 'react';
import {
  Search,
  AlertCircle,
  Users,
  ChevronDown,
  MapPin,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { PsyCard } from '@/components/network/psy-card';
import type { DirectoryEntry } from '@/lib/api/network';

// ─── Skeleton ────────────────────────────────────────────────────────────────

function DirectorySkeleton() {
  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: 6 }).map((_, i) => (
        <Card key={i}>
          <CardContent className="p-4 space-y-3">
            <div className="flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-full" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-5 w-12 rounded-full" />
              <Skeleton className="h-5 w-16 rounded-full" />
            </div>
            <Skeleton className="h-3 w-full" />
            <Skeleton className="h-3 w-4/5" />
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

// ─── Props ───────────────────────────────────────────────────────────────────

interface AnnuaireTabProps {
  directory: DirectoryEntry[];
  loading: boolean;
  error: string | null;
  onSearch: (filters: {
    search: string;
    city: string;
    department: string;
    approach: string;
    specialty: string;
  }) => void;
  onReferral: (psyId: string, psyName: string) => void;
}

export function AnnuaireTab({ directory, loading, error, onSearch, onReferral }: AnnuaireTabProps) {
  const [search, setSearch] = useState('');
  const [filterCity, setFilterCity] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('');
  const [filterApproach, setFilterApproach] = useState('');
  const [filterSpecialty, setFilterSpecialty] = useState('');
  const [showFilters, setShowFilters] = useState(false);

  const filters = { search, city: filterCity, department: filterDepartment, approach: filterApproach, specialty: filterSpecialty };

  const clearFilters = () => {
    setSearch('');
    setFilterCity('');
    setFilterDepartment('');
    setFilterApproach('');
    setFilterSpecialty('');
    onSearch({ search: '', city: '', department: '', approach: '', specialty: '' });
  };

  return (
    <div className="p-6 space-y-5">
      {/* Search + filters */}
      <div className="space-y-3">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && onSearch(filters)}
              placeholder="Rechercher un psy par nom..."
              className="w-full h-11 pl-9 pr-4 rounded-lg border border-input bg-white text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            />
          </div>
          <Button
            variant="outline"
            onClick={() => setShowFilters(!showFilters)}
            className="gap-2 flex-shrink-0"
          >
            <ChevronDown
              size={14}
              aria-hidden
              className={cn('transition-transform', showFilters && 'rotate-180')}
            />
            Filtres
          </Button>
          <Button onClick={() => onSearch(filters)} className="flex-shrink-0">
            Rechercher
          </Button>
        </div>

        {showFilters && (
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 p-4 rounded-lg border border-border bg-surface/50">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground flex items-center gap-1">
                <MapPin size={11} aria-hidden /> Ville
              </label>
              <input
                type="text"
                value={filterCity}
                onChange={(e) => setFilterCity(e.target.value)}
                placeholder="Paris..."
                className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Département</label>
              <input
                type="text"
                value={filterDepartment}
                onChange={(e) => setFilterDepartment(e.target.value)}
                placeholder="75..."
                className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Approche</label>
              <input
                type="text"
                value={filterApproach}
                onChange={(e) => setFilterApproach(e.target.value)}
                placeholder="TCC..."
                className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Spécialité</label>
              <input
                type="text"
                value={filterSpecialty}
                onChange={(e) => setFilterSpecialty(e.target.value)}
                placeholder="Anxiété..."
                className="w-full h-9 px-3 rounded-lg border border-input bg-white text-xs text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
            </div>
          </div>
        )}
      </div>

      {/* Results */}
      {loading && <DirectorySkeleton />}

      {error && !loading && (
        <div className="flex items-center gap-3 text-destructive bg-destructive/5 border border-destructive/20 rounded-xl px-4 py-3">
          <AlertCircle size={18} aria-hidden />
          <div>
            <p className="text-sm font-medium">{error}</p>
            <button
              type="button"
              onClick={() => onSearch(filters)}
              className="text-xs underline mt-0.5 hover:no-underline"
            >
              Réessayer
            </button>
          </div>
        </div>
      )}

      {!loading && !error && directory.length === 0 && (
        <div className="flex flex-col items-center gap-3 py-16 text-center">
          <Users size={40} className="text-muted-foreground/40" aria-hidden />
          <p className="text-sm text-muted-foreground font-medium">Aucun psy trouvé</p>
          <p className="text-xs text-muted-foreground">
            Essayez d&apos;élargir vos critères de recherche ou effacez les filtres.
          </p>
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Effacer les filtres
          </Button>
        </div>
      )}

      {!loading && !error && directory.length > 0 && (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {directory.map((entry) => (
            <PsyCard
              key={entry.id}
              entry={entry}
              onReferral={(psyId, psyName) => onReferral(psyId, psyName)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
