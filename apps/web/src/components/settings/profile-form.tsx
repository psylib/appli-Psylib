'use client';

import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useSession } from 'next-auth/react';
import { User, Phone, MapPin, FileText, Stethoscope, Hash, CheckCircle2, AlertCircle, Copy, Check, ExternalLink, Share2 } from 'lucide-react';
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
  const [profileSlug, setProfileSlug] = useState<string | null>(null);
  const [linkCopied, setLinkCopied] = useState(false);

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
        setProfileSlug(profile.slug);
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

  const profileUrl = profileSlug
    ? `https://psylib.eu/psy/${profileSlug}`
    : null;

  const handleCopyLink = async () => {
    if (!profileUrl) return;
    await navigator.clipboard.writeText(profileUrl);
    setLinkCopied(true);
    setTimeout(() => setLinkCopied(false), 2500);
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
    <div className="max-w-2xl mx-auto space-y-6">
      {/* ----------------------------------------------------------------- */}
      {/* Sharing instructions                                              */}
      {/* ----------------------------------------------------------------- */}
      {profileUrl && (
        <section className="bg-white rounded-xl border border-border p-6 space-y-5">
          <h2 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide flex items-center gap-2">
            <Share2 size={14} aria-hidden />
            Partager mon profil
          </h2>

          {/* Copyable link */}
          <div className="space-y-2">
            <label className="block text-sm font-medium text-foreground">
              Lien de votre page de prise de rendez-vous
            </label>
            <div className="flex items-center gap-2">
              <div className="flex-1 flex items-center gap-2 px-3 py-2.5 rounded-lg border border-border bg-[#F8F7FF] text-sm text-foreground font-mono select-all overflow-x-auto">
                {profileUrl}
              </div>
              <button
                type="button"
                onClick={() => void handleCopyLink()}
                className={`flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border text-sm font-medium transition-colors ${
                  linkCopied
                    ? 'border-accent/40 bg-accent/10 text-accent'
                    : 'border-border hover:border-primary/30 hover:bg-surface text-foreground'
                }`}
              >
                {linkCopied ? (
                  <>
                    <Check size={14} aria-hidden />
                    Copie !
                  </>
                ) : (
                  <>
                    <Copy size={14} aria-hidden />
                    Copier
                  </>
                )}
              </button>
              <a
                href={profileUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 inline-flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border hover:border-primary/30 hover:bg-surface text-sm font-medium text-foreground transition-colors"
                title="Voir mon profil public"
              >
                <ExternalLink size={14} aria-hidden />
              </a>
            </div>
            <p className="text-xs text-muted-foreground">
              Vos patients peuvent prendre rendez-vous directement depuis ce lien, sans compte.
            </p>
          </div>

          {/* Instructions */}
          <div className="space-y-4 pt-2">
            <h3 className="text-sm font-semibold text-foreground">
              Comment partager votre lien ?
            </h3>

            <div className="space-y-3">
              {/* Doctolib */}
              <div className="flex gap-3 p-3 rounded-lg bg-[#F8F7FF]">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#0596DE]/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#0596DE]">D</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Doctolib</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ajoutez votre lien PsyLib dans le champ <strong>"Site web"</strong> de votre profil Doctolib.
                    Vous pouvez aussi l&apos;ajouter dans votre <strong>description / présentation</strong> avec un texte du type :
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic bg-white rounded px-2 py-1.5 border border-border">
                    &laquo; Prenez rendez-vous directement sur mon agenda : {profileUrl} &raquo;
                  </p>
                </div>
              </div>

              {/* Google Business */}
              <div className="flex gap-3 p-3 rounded-lg bg-[#F8F7FF]">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#4285F4]/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#4285F4]">G</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Google My Business</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Dans votre fiche Google, ajoutez votre lien PsyLib comme <strong>"Lien de prise de rendez-vous"</strong> ou
                    dans la section <strong>"Site web"</strong> de votre établissement.
                  </p>
                </div>
              </div>

              {/* Email signature */}
              <div className="flex gap-3 p-3 rounded-lg bg-[#F8F7FF]">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-primary">@</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Signature email</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Ajoutez le lien dans votre signature email professionnelle :
                  </p>
                  <p className="text-xs text-muted-foreground mt-1 italic bg-white rounded px-2 py-1.5 border border-border">
                    Prendre rendez-vous : {profileUrl}
                  </p>
                </div>
              </div>

              {/* Social media */}
              <div className="flex gap-3 p-3 rounded-lg bg-[#F8F7FF]">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-[#7C3AED]/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-[#7C3AED]">#</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Reseaux sociaux</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Collez votre lien dans la <strong>bio</strong> de vos profils Instagram, LinkedIn ou Facebook.
                    Vous pouvez aussi le partager dans vos publications.
                  </p>
                </div>
              </div>

              {/* Carte de visite */}
              <div className="flex gap-3 p-3 rounded-lg bg-[#F8F7FF]">
                <div className="flex-shrink-0 w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <span className="text-sm font-bold text-accent">QR</span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">Carte de visite / Salle d&apos;attente</p>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Imprimez votre lien sur vos cartes de visite ou affichez-le en salle d&apos;attente.
                    Un patient peut scanner le QR code ou taper l&apos;adresse pour prendre son prochain rendez-vous.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

    <form
      onSubmit={(e) => void handleSubmit(onSubmit)(e)}
      onChange={handleFormChange}
      noValidate
      className="space-y-6"
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
    </div>
  );
}
