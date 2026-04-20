'use client';

import { useState, useRef, useEffect } from 'react';
import { X, UserPlus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';

interface Patient {
  id: string;
  name: string;
}

interface ParticipantMultiSelectProps {
  patients: Patient[];
  excludePatientId: string;
  selected: string[];
  onChange: (ids: string[]) => void;
  maxParticipants?: number;
}

export function ParticipantMultiSelect({
  patients,
  excludePatientId,
  selected,
  onChange,
  maxParticipants = 4,
}: ParticipantMultiSelectProps) {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  const availablePatients = patients.filter(
    (p) => p.id !== excludePatientId && !selected.includes(p.id),
  );

  const filteredAvailable = availablePatients.filter((p) =>
    search.trim() === '' ? true : p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const selectedPatients = patients.filter((p) => selected.includes(p.id));

  const handleSelect = (patientId: string) => {
    if (selected.length < maxParticipants) {
      onChange([...selected, patientId]);
    }
    setSearch('');
    setOpen(false);
  };

  const handleRemove = (patientId: string) => {
    onChange(selected.filter((id) => id !== patientId));
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setOpen(false);
      }
    };
    if (open) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <div className="space-y-2" ref={containerRef}>
      {selectedPatients.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {selectedPatients.map((patient) => (
            <Badge key={patient.id} variant="secondary" className="gap-1 pr-1">
              {patient.name}
              <button
                type="button"
                onClick={() => handleRemove(patient.id)}
                className="ml-1 rounded-full p-0.5 hover:bg-muted"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>
      )}

      {selected.length < maxParticipants && (
        <div className="relative">
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1.5"
            onClick={() => setOpen(!open)}
          >
            <UserPlus className="h-3.5 w-3.5" />
            Ajouter un participant ({selected.length}/{maxParticipants})
          </Button>

          {open && (
            <div className="absolute z-50 mt-1 w-64 rounded-lg border border-border bg-white shadow-lg">
              <div className="relative p-2">
                <Search size={14} className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Rechercher un patient..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="w-full pl-7 pr-3 py-1.5 text-sm border border-input rounded-md bg-white focus:outline-none focus:ring-2 focus:ring-ring"
                  autoFocus
                />
              </div>
              <div className="max-h-40 overflow-y-auto border-t border-border">
                {filteredAvailable.length === 0 ? (
                  <p className="text-xs text-muted-foreground p-3 text-center">
                    Aucun patient disponible
                  </p>
                ) : (
                  filteredAvailable.map((patient) => (
                    <button
                      key={patient.id}
                      type="button"
                      onClick={() => handleSelect(patient.id)}
                      className="w-full text-left px-3 py-2 text-sm hover:bg-surface transition-colors border-b border-border last:border-b-0"
                    >
                      {patient.name}
                    </button>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
