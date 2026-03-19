'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { User, Phone, MapPin, FileText, Stethoscope, Hash, CheckCircle2, AlertCircle } from 'lucide-react';
import { psychologistApi } from '@/lib/api/psychologist';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';

// ---------------------------------------------------------------------------
// Validation schema
// ---------------------------------------------------------------------------

const profileSchema = z.object({
  name: z
    .string()
    .min(2, 'Le nom doit contenir au moins 2 caractères')
    .max(100, 'Le nom ne peut pas dépasser 100 caractères'),
  specialization: z.string().max(150, 'La spécialisation ne peut pas dépasser 150 caractères').optional(),
  bio: z.string().max(1000, 'La bio ne peut pas dépasser 1000 caractères').optional(),
  phone: z
    .string()
    .max(20, 'Le téléphone ne peut pas dépasser 20 caractères')
    .optional(),
  address: z.string().max(250, 'L\'adresse ne peut pas dépasser 250 caractères').optional(),
  adeliNumber: z
    .string()
    .max(20, 'Le numéro ADELI ne peut pas dépasser 20 caractères')
    .optional(),
});

type ProfileFormValues = z.infer<typeof profileSchema>;

// ---------------------------------------------------------------------------
// Feedback state
// ---------------------------------------------------------------------------

type FeedbackState =
  | { type: 'idle' }
  | { type: 'success'; message: string }
  | { type: 'error'; message: string };

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function ProfileForm() {
  const { data: session } = useSession();
  const [feedback, setFeedback] = useState<FeedbackState>({ type: 'idle' });
  const [isLoadingProfile, setIsLoadingProfile] = useState(true);

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting, isDirty },
  } = useForm<ProfileFormValues>({
    resolver: zodResolver(profileSchema),
    defaultValues: {
      name: '',
      specialization: '',
      bio: '',
      phone: '',
      address: '',
      adeliNumber: '',
    },
  });

  // Load existing profile on mount
  useEffect(() => {
    if (!session?.accessToken) return;

    setIsLoadingProfile(true);
    psychologistApi
      .getProfile(session.accessToken)
      .then((profile) => {
        reset({
          name: profile.name ?? '',
          specialization: profile.specialization ?? '',
          bio: profile.bio ?? '',
          phone: profile.phone ?? '',
          address: profile.address ?? '',
          adeliNumber: profile.adeliNumber ?? '',
        });
      })
      .catch(() => {
        setFeedback({ type: 'error', message: 'Impossible de charger le profil. Veuillez réessayer.' });
      })
      .finally(() => {
        setIsLoadingProfile(false);
      });
  }, [session?.accessToken, reset]);

  const onSubmit = async (values: ProfileFormValues) => {
    if (!session?.accessToken) return;

    setFeedback({ type: 'idle' });

    try {
      await psychologistApi.updateProfile(
        {
          name: values.name,
          specialization: values.specialization ?? undefined,
          bio: values.bio ?? undefined,
          phone: values.phone ?? undefined,
          address: values.address ?? undefined,
          adeliNumber: values.adeliNumber ?? undefined,
        },
        session.accessToken,
      );
      setFeedback({ type: 'success', message: 'Profil mis à jour avec succès.' });
      // Re-sync the form default values so isDirty resets
      reset(values);
    } catch (err) {
      const message =
        err instanceof Error ? err.message : 'Une erreur est survenue. Veuillez réessayer.';
      setFeedback({ type: 'error', message });
    }
  };

  // Dismiss feedback when the user starts editing again
  const handleFormChange = () => {
    if (feedback.type !== 'idle') {
      setFeedback({ type: 'idle' });
    }
  };

  if (isLoadingProfile) {
    return (
      <div className="max-w-2xl mx-auto space-y-4" aria-busy="true" aria-label="Chargement du profil">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-14 rounded-lg bg-slate-200 animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      onChange={handleFormChange}
      noValidate
      className="max-w-2xl mx-auto space-y-6"
      aria-label="Formulaire de profil"
    >
      {/* Identity card */}
      <section className="bg-white rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <User size={14} aria-hidden />
          Identité professionnelle
        </h2>

        <Input
          label="Nom complet"
          placeholder="Dr. Marie Dupont"
          required
          error={errors.name?.message}
          {...register('name')}
        />

        <div className="space-y-1.5">
          <label htmlFor="specialization" className="block text-sm font-medium text-foreground">
            Spécialisation
          </label>
          <div className="relative">
            <Stethoscope
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <input
              id="specialization"
              placeholder="Thérapie cognitivo-comportementale, EMDR…"
              className="flex h-11 w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('specialization')}
            />
          </div>
          {errors.specialization && (
            <p className="text-xs text-destructive" role="alert">
              {errors.specialization.message}
            </p>
          )}
        </div>

        <Textarea
          label="Bio / Présentation"
          id="bio"
          placeholder="Décrivez votre approche thérapeutique, vos spécialités, votre parcours…"
          hint="Visible sur votre profil public. Maximum 1000 caractères."
          error={errors.bio?.message}
          className="min-h-[140px]"
          {...register('bio')}
        />
      </section>

      {/* Contact card */}
      <section className="bg-white rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <Phone size={14} aria-hidden />
          Coordonnées du cabinet
        </h2>

        <div className="space-y-1.5">
          <label htmlFor="phone" className="block text-sm font-medium text-foreground">
            Téléphone
          </label>
          <div className="relative">
            <Phone
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <input
              id="phone"
              type="tel"
              placeholder="+33 6 12 34 56 78"
              className="flex h-11 w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('phone')}
            />
          </div>
          {errors.phone && (
            <p className="text-xs text-destructive" role="alert">
              {errors.phone.message}
            </p>
          )}
        </div>

        <div className="space-y-1.5">
          <label htmlFor="address" className="block text-sm font-medium text-foreground">
            Adresse du cabinet
          </label>
          <div className="relative">
            <MapPin
              size={16}
              className="absolute left-3 top-3.5 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <textarea
              id="address"
              rows={2}
              placeholder="12 rue de la Paix, 75001 Paris"
              className="flex min-h-[72px] w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground resize-y focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('address')}
            />
          </div>
          {errors.address && (
            <p className="text-xs text-destructive" role="alert">
              {errors.address.message}
            </p>
          )}
        </div>
      </section>

      {/* Legal card */}
      <section className="bg-white rounded-xl border border-border p-6 space-y-5">
        <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
          <FileText size={14} aria-hidden />
          Informations légales
        </h2>

        <div className="space-y-1.5">
          <label htmlFor="adeliNumber" className="block text-sm font-medium text-foreground">
            Numéro ADELI
            <span className="ml-1.5 text-xs font-normal text-muted-foreground">(obligatoire pour exercer)</span>
          </label>
          <div className="relative">
            <Hash
              size={16}
              className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none"
              aria-hidden
            />
            <input
              id="adeliNumber"
              placeholder="75XXXXXXX"
              className="flex h-11 w-full rounded-lg border border-input bg-white pl-9 pr-3 py-2 text-sm text-foreground placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              {...register('adeliNumber')}
            />
          </div>
          {errors.adeliNumber && (
            <p className="text-xs text-destructive" role="alert">
              {errors.adeliNumber.message}
            </p>
          )}
          <p className="text-xs text-muted-foreground">
            Votre numéro ADELI à 9 chiffres délivré par l&apos;ARS. Il est affiché sur vos ordonnances et factures.
          </p>
        </div>
      </section>

      {/* Feedback banner */}
      {feedback.type !== 'idle' && (
        <div
          role="alert"
          aria-live="polite"
          className={
            feedback.type === 'success'
              ? 'flex items-center gap-3 rounded-xl border border-accent/30 bg-accent/10 px-4 py-3 text-sm text-accent'
              : 'flex items-center gap-3 rounded-xl border border-destructive/30 bg-destructive/10 px-4 py-3 text-sm text-destructive'
          }
        >
          {feedback.type === 'success' ? (
            <CheckCircle2 size={16} aria-hidden className="flex-shrink-0" />
          ) : (
            <AlertCircle size={16} aria-hidden className="flex-shrink-0" />
          )}
          {feedback.message}
        </div>
      )}

      {/* Submit */}
      <div className="flex items-center justify-end gap-3 pb-8">
        {isDirty && !isSubmitting && feedback.type === 'idle' && (
          <p className="text-xs text-muted-foreground">Modifications non enregistrées</p>
        )}
        <Button
          type="submit"
          loading={isSubmitting}
          disabled={isSubmitting || !isDirty}
        >
          Enregistrer
        </Button>
      </div>
    </form>
  );
}
