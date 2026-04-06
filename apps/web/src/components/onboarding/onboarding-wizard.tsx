'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { apiClient } from '@/lib/api/client';
import {
  CheckCircle2, ArrowRight, ArrowLeft, User, Building2, Settings,
  UserPlus, Gift, LayoutDashboard, Calendar,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { referralApi } from '@/lib/api/referral';

// ============================================================
// Types & Config
// ============================================================

type Step = 'profile' | 'practice' | 'preferences' | 'first_patient' | 'success';

const STEPS_CONFIG = [
  { id: 'profile' as const, label: 'Profil praticien', icon: User, emoji: '👤', time: '≈ 3 min' },
  { id: 'practice' as const, label: 'Votre cabinet', icon: Building2, emoji: '🏥', time: '≈ 2 min' },
  { id: 'preferences' as const, label: 'Préférences', icon: Settings, emoji: '⚙️', time: '≈ 1 min' },
  { id: 'first_patient' as const, label: 'Premier patient', icon: UserPlus, emoji: '👥', time: 'Dernière étape !' },
] as const;

const DURATION_OPTIONS = [30, 45, 50, 60, 90] as const;

// ============================================================
// Zod Schemas
// ============================================================

const profileSchema = z.object({
  name: z.string().min(2, 'Le nom doit contenir au moins 2 caractères'),
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
  sessionRate: z.coerce.number().min(0, 'Le tarif ne peut pas être négatif'),
});
type PreferencesData = z.infer<typeof preferencesSchema>;

const firstPatientSchema = z.object({
  name: z.string(),
  email: z.string().email('Email invalide').or(z.literal('')),
});
type FirstPatientData = z.infer<typeof firstPatientSchema>;

// ============================================================
// Animation Variants
// ============================================================

const stepVariants = {
  enter: (direction: number) => ({ x: direction * 60, opacity: 0 }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({ x: direction * -60, opacity: 0 }),
};

const fieldVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: (i: number) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.05, duration: 0.2, ease: 'easeOut' as const },
  }),
};

// ============================================================
// Helper: persist direction across page navigations
// ============================================================

function setNavDirection(dir: number) {
  if (typeof window !== 'undefined') {
    sessionStorage.setItem('onboarding_dir', String(dir));
  }
}

function getNavDirection(): number {
  if (typeof window === 'undefined') return 1;
  return Number(sessionStorage.getItem('onboarding_dir') ?? '1');
}

// ============================================================
// Sub-Components
// ============================================================

function StepTransition({
  stepKey, direction, children,
}: {
  stepKey: string; direction: number; children: React.ReactNode;
}) {
  return (
    <AnimatePresence mode="wait" custom={direction}>
      <motion.div
        key={stepKey}
        custom={direction}
        variants={stepVariants}
        initial="enter"
        animate="center"
        exit="exit"
        transition={{ duration: 0.2, ease: 'easeInOut' }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}

function AnimatedField({ index, children }: { index: number; children: React.ReactNode }) {
  return (
    <motion.div custom={index} variants={fieldVariants} initial="hidden" animate="visible">
      {children}
    </motion.div>
  );
}

function DurationChips({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Durée de séance">
      {DURATION_OPTIONS.map((d) => (
        <button
          key={d}
          type="button"
          aria-pressed={value === d}
          onClick={() => onChange(d)}
          className={cn(
            'rounded-full border px-4 py-2 text-sm font-medium transition-colors',
            value === d
              ? 'border-primary bg-primary/5 text-primary'
              : 'border-border bg-white text-muted-foreground hover:border-primary/40',
          )}
        >
          {d} min
        </button>
      ))}
    </div>
  );
}

// ============================================================
// Sidebar
// ============================================================

function OnboardingSidebar({ currentStepIndex }: { currentStepIndex: number }) {
  return (
    <>
      {/* Desktop sidebar */}
      <div className="hidden md:flex w-[280px] flex-shrink-0 flex-col bg-gradient-to-br from-primary to-[#1E1B4B] p-7">
        <div>
          <div className="text-xl font-bold text-white">PsyLib</div>
          <div className="text-xs text-white/50 mt-1">Votre cabinet, simplifié</div>
        </div>

        <nav className="mt-8 flex-1">
          {STEPS_CONFIG.map((step, i) => {
            const isDone = i < currentStepIndex;
            const isActive = i === currentStepIndex;
            return (
              <div key={step.id}>
                <div className="flex items-center gap-3">
                  <motion.div
                    className={cn(
                      'h-7 w-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0',
                      isDone && 'bg-accent text-white',
                      isActive && 'bg-white text-primary',
                      !isDone && !isActive && 'bg-transparent text-white/30 ring-1 ring-white/20',
                    )}
                    animate={isActive ? { scale: [0.8, 1] } : {}}
                    transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                  >
                    {isDone ? <CheckCircle2 size={14} /> : i + 1}
                  </motion.div>
                  <span
                    className={cn(
                      'text-sm',
                      isDone && 'text-white/70',
                      isActive && 'text-white font-semibold',
                      !isDone && !isActive && 'text-white/30',
                    )}
                  >
                    {step.label}
                  </span>
                </div>
                {/* Connector line */}
                {i < STEPS_CONFIG.length - 1 && (
                  <div className="ml-[13px] my-1">
                    <motion.div
                      className={cn(
                        'w-px h-4',
                        i < currentStepIndex ? 'bg-accent' : 'bg-white/10',
                      )}
                      initial={{ scaleY: 0 }}
                      animate={{ scaleY: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
                      style={{ originY: 0 }}
                    />
                  </div>
                )}
              </div>
            );
          })}
        </nav>

        <motion.div
          key={currentStepIndex}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          className="text-xs text-white/30 mt-auto"
        >
          {STEPS_CONFIG[currentStepIndex]?.time ?? ''}
        </motion.div>
      </div>

      {/* Mobile top bar */}
      <div className="md:hidden flex items-center gap-3 px-4 py-3 border-b border-border bg-white">
        <span className="text-sm font-bold text-primary">PsyLib</span>
        <span className="text-xs text-muted-foreground truncate">{STEPS_CONFIG[currentStepIndex]?.label}</span>
        <div className="flex-1" />
        <div className="flex items-center gap-2">
          {STEPS_CONFIG.map((step, i) => (
            <div
              key={step.id}
              className={cn(
                'h-2.5 w-2.5 rounded-full',
                i < currentStepIndex && 'bg-accent',
                i === currentStepIndex && 'bg-primary',
                i > currentStepIndex && 'bg-border',
              )}
            />
          ))}
        </div>
        <span className="text-xs text-muted-foreground ml-1">{currentStepIndex + 1}/{STEPS_CONFIG.length}</span>
      </div>
    </>
  );
}

// ============================================================
// Step Forms
// ============================================================

function ProfileStep({ form }: { form: ReturnType<typeof useForm<ProfileData>> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl mb-2">👤</div>
        <h1 className="text-xl font-bold text-foreground">Votre profil praticien</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Ces informations apparaîtront dans vos documents et votre page publique
        </p>
      </div>
      <AnimatedField index={0}>
        <Input label="Nom complet" placeholder="Dr Marie Dupont" required
          error={form.formState.errors.name?.message} {...form.register('name')} />
      </AnimatedField>
      <AnimatedField index={1}>
        <Input label="Spécialisation" placeholder="Psychologue clinicien, TCC..."
          error={form.formState.errors.specialization?.message} {...form.register('specialization')} />
      </AnimatedField>
      <AnimatedField index={2}>
        <Input label="Numéro ADELI" placeholder="75 93 1234 5"
          hint="11 chiffres — obligatoire pour les ordonnances"
          error={form.formState.errors.adeliNumber?.message} {...form.register('adeliNumber')} />
      </AnimatedField>
      <AnimatedField index={3}>
        <Textarea label="Bio courte" placeholder="Présentez votre approche thérapeutique..."
          className="min-h-[80px]"
          error={form.formState.errors.bio?.message} {...form.register('bio')} />
      </AnimatedField>
    </div>
  );
}

function PracticeStep({ form }: { form: ReturnType<typeof useForm<PracticeData>> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl mb-2">🏥</div>
        <h1 className="text-xl font-bold text-foreground">Votre cabinet</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Où exercez-vous ? Ces infos sont utilisées pour la facturation et votre page de prise de RDV.
        </p>
      </div>
      <AnimatedField index={0}>
        <Input label="Adresse du cabinet" placeholder="12 rue de la Paix, 75001 Paris"
          error={form.formState.errors.address?.message} {...form.register('address')} />
      </AnimatedField>
      <AnimatedField index={1}>
        <Input label="Téléphone professionnel" placeholder="+33 1 23 45 67 89" type="tel"
          error={form.formState.errors.phone?.message} {...form.register('phone')} />
      </AnimatedField>
      <AnimatedField index={2}>
        <div className="rounded-lg bg-emerald-50 border border-emerald-200 p-3">
          <div className="text-xs font-semibold text-emerald-800 mb-1">💡 Astuce</div>
          <div className="text-xs text-emerald-700">
            Vous pourrez ajouter plusieurs lieux de consultation plus tard dans les réglages.
          </div>
        </div>
      </AnimatedField>
    </div>
  );
}

function PreferencesStep({ form }: { form: ReturnType<typeof useForm<PreferencesData>> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl mb-2">⚙️</div>
        <h1 className="text-xl font-bold text-foreground">Préférences de séance</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Valeurs par défaut — modifiables à tout moment dans les réglages
        </p>
      </div>
      <AnimatedField index={0}>
        <div>
          <span className="text-sm font-medium text-foreground block mb-2">Durée par défaut</span>
          <Controller
            control={form.control}
            name="sessionDuration"
            render={({ field }) => (
              <DurationChips value={field.value} onChange={field.onChange} />
            )}
          />
          <p className="text-xs text-muted-foreground mt-2">
            La durée la plus courante chez les psychologues est 50 min
          </p>
          {form.formState.errors.sessionDuration && (
            <p className="text-xs text-destructive mt-1">{form.formState.errors.sessionDuration.message}</p>
          )}
        </div>
      </AnimatedField>
      <AnimatedField index={1}>
        <div>
          <span className="text-sm font-medium text-foreground block mb-2">Tarif par séance</span>
          <div className="flex items-center gap-2">
            <Input type="number" min={0} className="w-28 text-center font-semibold"
              error={form.formState.errors.sessionRate?.message}
              {...form.register('sessionRate', { valueAsNumber: true })} />
            <span className="text-sm text-muted-foreground">€ / séance</span>
          </div>
          <p className="text-xs text-muted-foreground mt-2">
            Tarif moyen en France : 50–80 € (source : ARS 2025)
          </p>
        </div>
      </AnimatedField>
    </div>
  );
}

function FirstPatientStep({ form }: { form: ReturnType<typeof useForm<FirstPatientData>> }) {
  return (
    <div className="space-y-5">
      <div>
        <div className="text-3xl mb-2">👥</div>
        <h1 className="text-xl font-bold text-foreground">Votre premier patient</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Optionnel — vous pourrez en ajouter depuis le dashboard
        </p>
      </div>
      <AnimatedField index={0}>
        <Input label="Prénom et nom" placeholder="Jean Martin"
          error={form.formState.errors.name?.message} {...form.register('name')} />
      </AnimatedField>
      <AnimatedField index={1}>
        <Input label="Email (optionnel)" type="email" placeholder="jean.martin@email.fr"
          hint="Pour lui envoyer une invitation à l'espace patient"
          error={form.formState.errors.email?.message} {...form.register('email')} />
      </AnimatedField>
    </div>
  );
}

// ============================================================
// Success Step
// ============================================================

function SuccessStep() {
  const router = useRouter();
  const { data: session } = useSession();
  const [referralCode, setReferralCode] = useState(() =>
    typeof window !== 'undefined' ? (localStorage.getItem('psylib_ref') ?? '') : '',
  );
  const [referralValidated, setReferralValidated] = useState(false);
  const [referralError, setReferralError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const confettiFired = useRef(false);

  useEffect(() => {
    if (confettiFired.current) return;
    confettiFired.current = true;
    const end = Date.now() + 2000;
    const fire = () => {
      confetti({
        particleCount: 3,
        angle: 60 + Math.random() * 60,
        spread: 55,
        origin: { x: Math.random(), y: Math.random() * 0.4 },
        colors: ['#3D52A0', '#0D9488', '#7C3AED'],
      });
      if (Date.now() < end) requestAnimationFrame(fire);
    };
    fire();
  }, []);

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

  const quickActions = [
    { label: 'Voir le dashboard', href: '/dashboard', icon: LayoutDashboard },
    { label: 'Ajouter un patient', href: '/dashboard/patients/new', icon: UserPlus },
    { label: "Configurer l'agenda", href: '/dashboard/calendar', icon: Calendar },
  ];

  return (
    <div className="flex items-center justify-center min-h-screen p-4">
      <div className="max-w-md w-full text-center space-y-6">
        <motion.div className="mx-auto rounded-full bg-accent/10 p-5 w-fit"
          initial={{ scale: 0 }} animate={{ scale: 1 }}
          transition={{ type: 'spring', stiffness: 260, damping: 20 }}>
          <CheckCircle2 size={48} className="text-accent" />
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }} className="space-y-2">
          <h1 className="text-2xl font-bold text-foreground">Bienvenue sur PsyLib !</h1>
          <p className="text-muted-foreground">
            Votre espace est prêt. Voici 3 actions rapides pour bien démarrer.
          </p>
        </motion.div>

        <div className="grid gap-3 text-left">
          {quickActions.map((action, i) => (
            <motion.button key={action.href}
              onClick={() => router.push(action.href)}
              className="w-full flex items-center justify-between p-4 rounded-xl border border-border bg-white hover:bg-surface transition-colors text-sm font-medium text-foreground"
              initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3 + i * 0.1 }}
              whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              <div className="flex items-center gap-3">
                <action.icon size={18} className="text-primary" />
                <span>{action.label}</span>
              </div>
              <ArrowRight size={16} className="text-muted-foreground" />
            </motion.button>
          ))}
        </div>

        {/* Referral code */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.6 }}>
          {!referralValidated ? (
            <div className="rounded-xl border border-border bg-white p-4 text-left space-y-3">
              <div className="flex items-center gap-2">
                <Gift size={16} className="text-primary" />
                <p className="text-sm font-medium text-foreground">Code d&apos;un collègue ? (optionnel)</p>
              </div>
              <div className="flex gap-2">
                <input type="text" value={referralCode}
                  onChange={(e) => setReferralCode(e.target.value.toUpperCase())}
                  placeholder="Ex\u00a0: MARIE-X7K2"
                  className="flex-1 rounded-lg border border-border px-3 py-2 text-sm font-mono uppercase focus:outline-none focus:ring-2 focus:ring-primary/40"
                  maxLength={20} />
                <Button onClick={() => void handleReferralValidate()}
                  disabled={loading || !referralCode.trim()} size="sm">
                  Valider
                </Button>
              </div>
              {referralError && <p className="text-xs text-destructive">{referralError}</p>}
            </div>
          ) : (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-4 flex items-center gap-3">
              <CheckCircle2 size={18} className="text-accent flex-shrink-0" />
              <p className="text-sm text-accent font-medium">
                Code validé ! Vous et votre parrain recevrez 1 mois gratuit après souscription.
              </p>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}

// ============================================================
// Main Component (exported)
// ============================================================

interface OnboardingWizardProps {
  currentStep: Step;
  currentStepIndex: number;
  totalSteps: number;
}

export function OnboardingWizard({ currentStep, currentStepIndex, totalSteps: _totalSteps }: OnboardingWizardProps) {
  const router = useRouter();
  const { data: session } = useSession();
  const [loading, setLoading] = useState(false);
  const [apiError, setApiError] = useState<string | null>(null);
  const [direction, setDirection] = useState(getNavDirection);

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

  const navigateTo = (path: string, dir: number) => {
    setDirection(dir);
    setNavDirection(dir);
    router.push(path);
  };

  const submitProfile = async (data: ProfileData) => {
    setApiError(null);
    setLoading(true);
    try {
      await apiClient.put('/onboarding/profile', data, session?.accessToken);
      navigateTo('/onboarding/practice', 1);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const submitPractice = async (data: PracticeData) => {
    setApiError(null);
    setLoading(true);
    try {
      const token = session?.accessToken;
      await apiClient.put('/onboarding/profile', data, token);
      await apiClient.post('/onboarding/steps/practice/complete', {}, token);
      navigateTo('/onboarding/preferences', 1);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const submitPreferences = async (data: PreferencesData) => {
    setApiError(null);
    setLoading(true);
    try {
      const token = session?.accessToken;
      await apiClient.put('/onboarding/profile', {
        defaultSessionDuration: data.sessionDuration,
        defaultSessionRate: data.sessionRate,
      }, token);
      await apiClient.post('/onboarding/steps/preferences/complete', {}, token);
      navigateTo('/onboarding/first_patient', 1);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const submitFirstPatient = async (data: FirstPatientData) => {
    setApiError(null);
    setLoading(true);
    try {
      const token = session?.accessToken;
      if (data.name) {
        await apiClient.post('/patients', { name: data.name, email: data.email || undefined }, token);
        await apiClient.post('/onboarding/steps/first_patient/complete', {}, token);
      }
      await apiClient.post('/onboarding/complete', {}, token);
      navigateTo('/onboarding/success', 1);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : 'Une erreur est survenue');
    } finally {
      setLoading(false);
    }
  };

  const goNext = () => {
    if (currentStep === 'profile') {
      void profileForm.handleSubmit(submitProfile)();
    } else if (currentStep === 'practice') {
      void practiceForm.handleSubmit(submitPractice)();
    } else if (currentStep === 'preferences') {
      void preferencesForm.handleSubmit(submitPreferences)();
    } else if (currentStep === 'first_patient') {
      void firstPatientForm.handleSubmit(submitFirstPatient)();
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
      navigateTo('/onboarding/success', 1);
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
    navigateTo(prev[currentStep], -1);
  };

  // Success page — full-width, no split-screen
  if (currentStep === 'success') return <SuccessStep />;

  // Form steps — split-screen
  return (
    <div className="flex flex-col md:flex-row min-h-screen">
      <OnboardingSidebar currentStepIndex={currentStepIndex} />

      <div className="flex-1 flex flex-col overflow-y-auto bg-white">
        {/* Desktop form area */}
        <div className="hidden md:flex flex-1 items-center justify-center p-12">
          <div className="w-full max-w-md">
            <StepTransition stepKey={currentStep} direction={direction}>
              <div className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-5">
                {currentStep === 'profile' && <ProfileStep form={profileForm} />}
                {currentStep === 'practice' && <PracticeStep form={practiceForm} />}
                {currentStep === 'preferences' && <PreferencesStep form={preferencesForm} />}
                {currentStep === 'first_patient' && <FirstPatientStep form={firstPatientForm} />}
                {apiError && (
                  <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive" role="alert">
                    {apiError}
                  </div>
                )}
              </div>
            </StepTransition>
            <div className="flex items-center justify-between mt-6">
              <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                <Button variant="outline" onClick={goBack} disabled={currentStep === 'profile'}
                  className={cn(currentStep === 'profile' && 'invisible')}>
                  <ArrowLeft size={16} /> Retour
                </Button>
              </motion.div>
              <div className="flex items-center gap-3">
                {currentStep === 'first_patient' && (
                  <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                    <Button variant="ghost" onClick={() => void skipPatient()} loading={loading}>Passer cette étape</Button>
                  </motion.div>
                )}
                <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                  <Button onClick={goNext} loading={loading}>
                    {currentStep === 'first_patient' ? 'Terminer 🎉' : 'Continuer'}
                    <ArrowRight size={16} />
                  </Button>
                </motion.div>
              </div>
            </div>
          </div>
        </div>

        {/* Mobile form area */}
        <div className="md:hidden flex-1 p-4 pb-20">
          <StepTransition stepKey={currentStep} direction={direction}>
            <div className="rounded-xl border border-border bg-white p-5 shadow-sm space-y-5">
              {currentStep === 'profile' && <ProfileStep form={profileForm} />}
              {currentStep === 'practice' && <PracticeStep form={practiceForm} />}
              {currentStep === 'preferences' && <PreferencesStep form={preferencesForm} />}
              {currentStep === 'first_patient' && <FirstPatientStep form={firstPatientForm} />}
              {apiError && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive" role="alert">
                  {apiError}
                </div>
              )}
            </div>
          </StepTransition>
        </div>

        {/* Mobile sticky bottom nav */}
        <div className="md:hidden sticky bottom-0 bg-white border-t border-border px-4 pt-3 pb-[max(12px,env(safe-area-inset-bottom))] flex items-center justify-between">
          <Button variant="outline" size="sm" onClick={goBack}
            disabled={currentStep === 'profile'}
            className={cn(currentStep === 'profile' && 'invisible')}>
            <ArrowLeft size={14} />
          </Button>
          <div className="flex items-center gap-2">
            {currentStep === 'first_patient' && (
              <Button variant="ghost" size="sm" onClick={() => void skipPatient()} loading={loading}>Passer cette étape</Button>
            )}
            <Button size="sm" onClick={goNext} loading={loading}>
              {currentStep === 'first_patient' ? 'Terminer 🎉' : 'Continuer'}
              <ArrowRight size={14} />
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
