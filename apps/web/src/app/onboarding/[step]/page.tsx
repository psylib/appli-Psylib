import { auth } from '@/lib/auth/auth';
import { redirect } from 'next/navigation';
import { OnboardingWizard } from '@/components/onboarding/onboarding-wizard';

const STEPS = ['profile', 'practice', 'preferences', 'first_patient', 'success'] as const;
type Step = typeof STEPS[number];

export function generateStaticParams() {
  return STEPS.map((step) => ({ step }));
}

export async function generateMetadata({ params }: { params: { step: string } }) {
  const titles: Record<string, string> = {
    profile: 'Votre profil',
    practice: 'Votre cabinet',
    preferences: 'Préférences',
    first_patient: 'Premier patient',
    success: 'Bienvenue !',
  };
  return { title: titles[params.step] ?? 'Onboarding' };
}

export default async function OnboardingStepPage({ params }: { params: { step: string } }) {
  const session = await auth();
  if (!session?.user) redirect('/login');

  const step = params.step as Step;
  if (!STEPS.includes(step)) redirect('/onboarding/profile');

  const currentStepIndex = STEPS.indexOf(step);
  const totalSteps = STEPS.length - 1; // 'success' n'est pas compté

  return (
    <OnboardingWizard
      currentStep={step}
      currentStepIndex={currentStepIndex}
      totalSteps={totalSteps}
    />
  );
}
