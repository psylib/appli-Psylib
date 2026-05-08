'use client';

import { Clock, Euro, ShieldCheck, MapPin, Video, Home } from 'lucide-react';
import type { ConsultationType, ConsultationModality } from '@/lib/api/public-booking';

const MODALITY_CONFIG: Record<ConsultationModality, { icon: typeof MapPin; label: string; className: string }> = {
  in_person: { icon: MapPin, label: 'En cabinet', className: 'bg-blue-50 text-blue-700 border-blue-200' },
  online: { icon: Video, label: 'En ligne', className: 'bg-sky-50 text-sky-700 border-sky-200' },
  home_visit: { icon: Home, label: 'A domicile', className: 'bg-amber-50 text-amber-700 border-amber-200' },
  any: { icon: MapPin, label: 'Cabinet ou en ligne', className: 'bg-violet-50 text-violet-700 border-violet-200' },
};

interface ConsultationTypePickerProps {
  types: ConsultationType[];
  selected: string | null;
  onSelect: (id: string) => void;
}

export function ConsultationTypePicker({ types, selected, onSelect }: ConsultationTypePickerProps) {
  if (types.length === 0) return null;

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
      {types.map((type) => {
        const isSelected = selected === type.id;

        return (
          <button
            key={type.id}
            type="button"
            onClick={() => onSelect(type.id)}
            className={`relative flex items-start gap-3 p-4 rounded-2xl border text-left transition-all ${
              isSelected
                ? 'ring-2 ring-[#3D52A0] border-[#3D52A0] bg-[#3D52A0]/5'
                : 'border-[#E5E7EB] bg-white hover:border-[#3D52A0]/40 hover:shadow-sm'
            }`}
          >
            {/* Color dot */}
            <span
              className="mt-0.5 w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: type.color || '#3D52A0' }}
            />

            <div className="flex-1 min-w-0">
              {/* Name */}
              <p className="text-sm font-semibold text-[#1E1B4B] leading-snug">
                {type.name}
              </p>

              {/* Duration + Rate + Modality */}
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F1F0F9] text-xs font-medium text-[#1E1B4B]">
                  <Clock className="w-3 h-3" />
                  {type.duration} min
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#F1F0F9] text-xs font-medium text-[#1E1B4B]">
                  <Euro className="w-3 h-3" />
                  {type.rate}€
                </span>
                {type.modality && (() => {
                  const config = MODALITY_CONFIG[type.modality];
                  const ModalityIcon = config.icon;
                  return (
                    <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-xs font-medium border ${config.className}`}>
                      <ModalityIcon className="w-3 h-3" />
                      {config.label}
                    </span>
                  );
                })()}
              </div>

              {/* Location */}
              {type.location && (
                <p className="mt-1.5 text-xs text-gray-500 flex items-center gap-1">
                  <MapPin className="w-3 h-3 flex-shrink-0" />
                  {type.location}
                </p>
              )}

              {/* Mon Soutien Psy badge */}
              {type.category === 'mon_soutien_psy' && (
                <span className="inline-flex items-center gap-1 mt-2 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <ShieldCheck className="w-3 h-3" />
                  Mon Soutien Psy
                </span>
              )}
            </div>

            {/* Selected indicator */}
            {isSelected && (
              <span className="absolute top-3 right-3 w-5 h-5 rounded-full bg-[#3D52A0] flex items-center justify-center">
                <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
