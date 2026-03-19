'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import { CheckCircle2, ArrowRight, ArrowLeft, User, Building2, Settings, UserPlus, Gift } from 'lucide-react';
import { cn } from '@/lib/utils';
import { referralApi } from '@/lib/api/referral';

type Step = 'profile' | 'practice' | 'preferences' | 'first_patient' | 'success';

const STEPS_CONFIG = [
  { id: 'profile', label: 'Profil', icon: User },
  { id: 'practice', label: 'Cabinet', icon: Building2 },
  { id: 'preferences', label: 'Pr\u00e9f\u00e9rences', icon: Settings },
  { id: 'first_patient', label: 'Patient', icon: UserPlus },
] as const;

// --- Zod schemas ---

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caract\u00e8res'),
  specialization: z.string(),
  adeliNumber: z.string(),
  bio: z.string(),
});
type ProfileData = z.infer<typeof profileSchema>;

const practiceSchema = z.object({
  address: z.string(),
  phone: z.string(),
});
type PracticeData = z.infer<typeof practiceSchema>;

const preferencesSchema = z.object({
  sessionDuration: z.coerce.number().int().min(15, 'Minimum 15 minutes').max(120, 'Maximum 120 minutes'),
  sessionRate: z.coerce.number().min(0, 'Le tarif ne peut pas \u00eatre n\u00e9gatif'),
});
type PreferencesData = z.infer<typeof preferencesSchema>;

const firstPatientSchema = z.object({
  name: z.string(),
  email: z.string().email('Email invalide').or(z.literal('')),
});
type FirstPatientData = z.infer<typeof firstPatientSchema>;

// --- Component ---

interface OnboardingWizardProps {
  currentStep: Step;
  currentStepIndex: number;
  totalSteps: number;
}

export function OnboardingWizard({ currentStep, currentStepIndex }: OnboardingWizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [referralCode, setReferralCode] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('psylib_ref') ?? '') : '',
  );
  const [referralValidated, setReferralValidated] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);

  const profileForm = useForm<ProfileData>({
    resolver: zodResolver(profileSchema),
    defaultValues: { name: '', specialization: '', adeliNumber: '', bio: '' },
  });

  const practiceForm = useForm<PracticeData>({
    resolver: zodResolver(practiceSchema),
    defaultValues: { address: '', phone: '' },
  });

  const preferencesForm = useForm<PreferencesData>({
    resolver: zodResolver(preferencesSchema),
    defaultValues: { sessionDuration: 50, sessionRate: 80 },
  });

  const firstPatientForm = useForm<FirstPatientData>({
    resolver: zodResolver(firstPatientSchema),
    defaultValues: { name: '', email: '' },
  });

  const submitStep = async (data: Record<string, unknown>) => {
    setApiError(null);
    setLoading(true);

    try {
      const token = session?.accessToken;

      if (currentStep === 'profile') {
        await apiClient.put('/onboarding/profile', data, token);
        router.push('/onboarding/practice');
      } else if (currentStep === 'practice') {
        await apiClient.put('/onboarding/profile', data, token);
        await apiClient.post('/onboarding/steps/practice/complete', {}, token);
        router.push('/onboarding/preferences');
      } else if (currentStep === 'preferences') {
        const prefs = data as unknown as PreferencesData;
        await apiClient.put('/onboarding/profile', {
          defaultSessionDuration: prefs.sessionDuration,
          defaultSessionRate: prefs.sessionRate,
        }, token);
        await apiClient.post('/onboarding/steps/preferences/complete', {}, token);
        router.push('/onboarding/first_patient');
      } else if (currentStep === 'first_patient') {
        const patient = data as unknown as FirstPatientData;
        if (patient.name) {
          await apiClient.post('/patients', { name: patient.name, email: patient.email || undefined }, token);
          await apiClient.post('/onboarding/steps/first_patient/complete', {}, token);
        }
        await apiClient.post('/onboarding/complete', {}, token);
        router.push('/onboarding/success');
      }
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (currentStep === 'profile') {
      void profileForm.handleSubmit((d) => submitStep(d as unknown as Record<string, unknown>))();
    } else if (currentStep === 'practice') {
      void practiceForm.handleSubmit((d) => submitStep(d as unknown as Record<string, unknown>))();
    } else if (currentStep === 'preferences') {
      void preferencesForm.handleSubmit((d) => submitStep(d as unknown as Record<string, unknown>))();
    } else if (currentStep === 'first_patient') {
      void firstPatientForm.handleSubmit((d) => submitStep(d as unknown as Record<string, unknown>))();
    } else if (currentStep === 'success') {
      router.push('/dashboard');
    }
  };

  const skipPatient = async () => {
    setApiError(null);
    setLoading(true);
    try {
      const token = session?.accessToken;
      await apiClient.post('/onboarding/complete', {}, token);
      router.push('/onboarding/success');
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const goBack = () => {
    const prev: Record<Step, string> = {
      profile: '/onboarding/profile',
      practice: '/onboarding/profile',
      preferences: '/onboarding/practice',
      first_patient: '/onboarding/preferences',
      success: '/onboarding/first_patient',
    };
    router.push(prev[currentStep]);
  };

  const handleReferralValidate = async () => {
    if (!referralCode.trim() || !session?.accessToken) return;
    setReferralError(null);
    setLoading(true);
    try {
      await referralApi.validateCode(referralCode.trim().toUpperCase(), session.accessToken);
      setReferralValidated(true);
      localStorage.removeItem('psylib_ref');
    } catch (e) {
      setReferralError(e instanceof Error ? e.message : 'Code invalide');
    } finally {
      setLoading(false);
    }
  };

  if (currentStep === 'success') {
    return (
      <div className="text-center space-y-6 py-8">
        <div className="flex justify-center">
          <div className="rounded-full bg-accent/10 p-5">
            <CheckCircle2 size={48} className="text-accent" />
          </div>
        </div>
        <div className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Bienvenue sur PsyLib !</h1>
          <p className="text-muted-foreground">
            Votre espace est pr\u00eat. Commencez par explorer le dashboard.
          </p>
        </div>

        {/* Code de parrainage */}
        {!referralValidated ? (
          <div className="rounded-xl border border-border bg-white p-4 text-left space-y-3">
            <div className="flex items-center gap-2">
              <Gift size={16} className="text-primary" />
              <p className="text-sm font-medium text-foreground">Code d&apos;un coll\u00e8gue ? (optionnel)</p>
            </div>
            <div className="flex gap-2">
              <input
                type="text"
                value={referralCode}
                onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                placeholder="Ex\u00a0: MARIE-X7K2"
                className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                maxLength={20}
              />
              <button
                onClick={() => void handleReferralValidate()}
                disabled={loading || !referralCode.trim()}
                className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 disabled:opacity-50 transition-colors"
              >
                Valider
              </button>
            </div>
            {referralError && (
              <p className="text-xs text-destructive">{referralError}</p>
            )}
          </div>
        ) : (
          <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
            <CheckCircle2 size={18} className="text-accent flex-shrink-0" />
            <p className="text-sm text-accent font-medium">
              Code valid\u00e9 ! Vous et votre parrain recevrez 1 mois gratuit apr\u00e8s souscription.
            </p>
          </div>
        )}

        <div className="grid gap-3">
          {[
            { label: '+ Ajouter un patient', href: '/dashboard/patients/new', icon: UserPlus },
            { label: 'Voir le dashboard', href: '/dashboard', icon: ArrowRight },
          ].map((action) => (
            <button
              key={action.href}
              onClick={() => router.push(action.href)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-white hover:bg-surface transition-colors text-sm font-medium text-foreground"
            >
              <span>{action.label}</span>
              <action.icon size={16} className="text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Progress bar */}
      <div>
        <div className="flex items-center justify-between mb-3">
          {STEPS_CONFIG.map((step, i) => (
            <div key={step.id} className="flex items-center flex-1">
              <div
                className={cn(
                  'h-8 w-8 rounded-full flex items-center justify-center text-xs font-semibold transition-colors',
                  i < currentStepIndex
                    ? 'bg-accent text-white'
                    : i === currentStepIndex
                      ? 'bg-primary text-white'
                      : 'bg-surface text-muted-foreground',
                )}
              >
                {i < currentStepIndex ? <CheckCircle2 size={16} /> : i + 1}
              </div>
              {i < STEPS_CONFIG.length - 1 && (
                <div
                  className={cn(
                    'h-0.5 flex-1 mx-2 rounded-full transition-colors',
                    i < currentStepIndex ? 'bg-accent' : 'bg-border',
                  )}
                />
              )}
            </div>
          ))}
        </div>
        <p className="text-xs text-muted-foreground text-center">
          \u00c9tape {currentStepIndex + 1} sur {STEPS_CONFIG.length}
        </p>
      </div>

      {/* Form card */}
      <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-5">
        {currentStep === 'profile' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-foreground">Votre profil praticien</h1>
              <p className="text-sm text-muted-foreground mt-1">Ces informations appara\u00eetront dans vos documents</p>
            </div>
            <Input
              label="Nom complet"
              placeholder="Dr Marie Dupont"
              required
              error={profileForm.formState.errors.name?.message}
              {...profileForm.register('name')}
            />
            <Input
              label="Sp\u00e9cialisation"
              placeholder="Psychologue clinicien, TCC..."
              error={profileForm.formState.errors.specialization?.message}
              {...profileForm.register('specialization')}
            />
            <Input
              label="Num\u00e9ro ADELI"
              placeholder="75 93 1234 5"
              hint="Obligatoire pour les ordonnances (11 chiffres)"
              error={profileForm.formState.errors.adeliNumber?.message}
              {...profileForm.register('adeliNumber')}
            />
            <Textarea
              label="Bio courte"
              placeholder="Pr\u00e9sentez votre approche th\u00e9rapeutique..."
              className="min-h-[80px]"
              error={profileForm.formState.errors.bio?.message}
              {...profileForm.register('bio')}
            />
          </>
        )}

        {currentStep === 'practice' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-foreground">Votre cabinet</h1>
              <p className="text-sm text-muted-foreground mt-1">Informations de votre lieu de consultation</p>
            </div>
            <Input
              label="Adresse du cabinet"
              placeholder="12 rue de la Paix, 75001 Paris"
              error={practiceForm.formState.errors.address?.message}
              {...practiceForm.register('address')}
            />
            <Input
              label="T\u00e9l\u00e9phone professionnel"
              placeholder="+33 1 23 45 67 89"
              type="tel"
              error={practiceForm.formState.errors.phone?.message}
              {...practiceForm.register('phone')}
            />
          </>
        )}

        {currentStep === 'preferences' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-foreground">Pr\u00e9f\u00e9rences de s\u00e9ance</h1>
              <p className="text-sm text-muted-foreground mt-1">Vous pourrez les modifier dans les r\u00e9glages</p>
            </div>
            <Input
              label="Dur\u00e9e par d\u00e9faut (minutes)"
              type="number"
              min={15}
              max={120}
              error={preferencesForm.formState.errors.sessionDuration?.message}
              {...preferencesForm.register('sessionDuration', { valueAsNumber: true })}
            />
            <Input
              label="Tarif par s\u00e9ance (\u20ac)"
              type="number"
              min={0}
              error={preferencesForm.formState.errors.sessionRate?.message}
              {...preferencesForm.register('sessionRate', { valueAsNumber: true })}
            />
          </>
        )}

        {currentStep === 'first_patient' && (
          <>
            <div>
              <h1 className="text-xl font-bold text-foreground">Votre premier patient</h1>
              <p className="text-sm text-muted-foreground mt-1">Optionnel \u2014 vous pouvez le faire plus tard</p>
            </div>
            <Input
              label="Pr\u00e9nom et nom"
              placeholder="Jean Martin"
              error={firstPatientForm.formState.errors.name?.message}
              {...firstPatientForm.register('name')}
            />
            <Input
              label="Email (optionnel)"
              type="email"
              placeholder="jean.martin@email.fr"
              error={firstPatientForm.formState.errors.email?.message}
              {...firstPatientForm.register('email')}
            />
          </>
        )}

        {apiError && (
          <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive" role="alert">
            {apiError}
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="flex items-center justify-between">
        <Button
          variant="outline"
          onClick={goBack}
          disabled={currentStep === 'profile'}
          className={cn(currentStep === 'profile' && 'invisible')}
        >
          <ArrowLeft size={16} />
          Retour
        </Button>

        <div className="flex items-center gap-3">
          {currentStep === 'first_patient' && (
            <Button variant="ghost" onClick={skipPatient} loading={loading}>
              Passer
            </Button>
          )}
          <Button onClick={goNext} loading={loading}>
            {currentStep === 'first_patient' ? 'Terminer' : 'Continuer'}
            <ArrowRight size={16} />
          </Button>
        </div>
      </div>
    </div>
  );
}
