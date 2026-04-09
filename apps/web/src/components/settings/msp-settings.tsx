'use client';

import { useState, useEffect } from 'react';
import { useSession } from 'next-auth/react';
import { useToast } from '@/components/ui/toast';
import { psychologistApi } from '@/lib/api/psychologist';
import { consultationTypesApi, type ConsultationType } from '@/lib/api/consultation-types';
import { Loader2, Shield, Info } from 'lucide-react';

export function MspSettings({ token: tokenProp }: { token?: string }) {
  const { data: session, status } = useSession();
  const { success, error: toastError } = useToast();
  const [enabled, setEnabled] = useState(false);
  const [loading, setLoading] = useState(true);
  const [toggling, setToggling] = useState(false);

  const token = tokenProp || session?.accessToken || '';

  useEffect(() => {
    if (status === 'loading') return;
    if (!token) { setLoading(false); return; }
    psychologistApi
      .getProfile(token)
      .then((profile) => {
        setEnabled(profile.acceptsMonSoutienPsy);
      })
      .catch(() => {
        toastError('Impossible de charger les parametres MSP.');
      })
      .finally(() => {
        setLoading(false);
      });
  }, [token, status, toastError]);

  const handleToggle = async () => {
    if (!token) return;
    const newValue = !enabled;
    setToggling(true);

    try {
      // Update profile
      await psychologistApi.updateProfile(
        { acceptsMonSoutienPsy: newValue },
        token,
      );
      setEnabled(newValue);

      // If enabling, create default MSP consultation types if none exist
      if (newValue) {
        const existingTypes = await consultationTypesApi.getAll(token);
        const hasMspTypes = existingTypes.some(
          (t: ConsultationType) => t.category === 'mon_soutien_psy' && t.isActive,
        );
        if (!hasMspTypes) {
          await consultationTypesApi.create(
            {
              name: 'Bilan initial Mon Soutien Psy',
              duration: 60,
              rate: 50,
              category: 'mon_soutien_psy',
              color: '#0D9488',
              isPublic: true,
            },
            token,
          );
          await consultationTypesApi.create(
            {
              name: 'Seance de suivi Mon Soutien Psy',
              duration: 45,
              rate: 50,
              category: 'mon_soutien_psy',
              color: '#0D9488',
              isPublic: true,
            },
            token,
          );
          success('Mon Soutien Psy active. 2 motifs de consultation crees automatiquement.');
        } else {
          success('Mon Soutien Psy active.');
        }
      } else {
        success('Mon Soutien Psy desactive.');
      }
    } catch {
      toastError('Erreur lors de la mise a jour.');
    } finally {
      setToggling(false);
    }
  };

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-white p-6">
        <div className="flex justify-center py-4">
          <Loader2 className="w-5 h-5 animate-spin text-primary" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-white p-6 space-y-4">
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <h2 className="text-base font-medium text-foreground flex items-center gap-2">
            <Shield className="w-4 h-4 text-accent" />
            Mon Soutien Psy
          </h2>
          <p className="text-sm text-muted-foreground mt-0.5">
            Acceptez les patients eligibles au dispositif Mon Soutien Psy de l&apos;Assurance Maladie.
          </p>
        </div>

        {/* Toggle */}
        <div className="flex items-center gap-3 flex-shrink-0">
          {toggling && <Loader2 className="w-4 h-4 animate-spin text-primary" />}
          <button
            type="button"
            onClick={() => void handleToggle()}
            disabled={toggling}
            className={`relative w-12 h-6 rounded-full transition-colors flex-shrink-0 ${
              enabled ? 'bg-accent' : 'bg-gray-200'
            } disabled:opacity-50`}
          >
            <span
              className={`absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-white shadow transition-transform ${
                enabled ? 'translate-x-6' : 'translate-x-0'
              }`}
            />
          </button>
        </div>
      </div>

      {/* Status badge */}
      <div>
        {enabled ? (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-accent/10 text-accent">
            <span className="w-1.5 h-1.5 rounded-full bg-accent" />
            Actif
          </span>
        ) : (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium bg-gray-100 text-muted-foreground">
            <span className="w-1.5 h-1.5 rounded-full bg-gray-400" />
            Inactif
          </span>
        )}
      </div>

      {/* Info box */}
      <div className="flex gap-3 p-3 rounded-lg bg-accent/5 border border-accent/10">
        <Info className="w-4 h-4 text-accent flex-shrink-0 mt-0.5" />
        <div className="text-xs text-muted-foreground space-y-1">
          <p>
            <strong className="text-foreground">Mon Soutien Psy</strong> permet aux patients
            orientes par un medecin d&apos;acceder a 12 seances par an, remboursees par l&apos;Assurance Maladie
            a hauteur de 50 EUR par seance.
          </p>
          <p>
            En activant cette option, deux motifs de consultation Mon Soutien Psy
            seront automatiquement crees (bilan initial 60min et suivi 45min a 50 EUR).
          </p>
        </div>
      </div>
    </div>
  );
}
