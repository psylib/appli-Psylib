import { Suspense } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/auth/auth';
import { RefParamHandler } from '@/components/referral/ref-param-handler';
import {
  Shield,
  Brain,
  BarChart3,
  Lock,
  CheckCircle2,
} from 'lucide-react';

export const metadata = {
  title: 'Connexion — PsyLib',
  description: 'Connectez-vous à votre espace professionnel PsyLib',
};

const VALUE_PROPS = [
  {
    icon: Brain,
    title: 'Assistant IA intégré',
    desc: 'Résumés de séances et exercices personnalisés',
  },
  {
    icon: BarChart3,
    title: 'Suivi clinique complet',
    desc: 'Évaluations, mood tracking et analytics',
  },
  {
    icon: Shield,
    title: 'Conforme HDS & RGPD',
    desc: 'Données de santé hébergées en France',
  },
] as const;

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string; error?: string }>;
}) {
  const params = await searchParams;
  const callbackUrl = params?.callbackUrl ?? '/dashboard';
  const error = params?.error;

  return (
    <main className="flex min-h-screen">
      <Suspense fallback={null}>
        <RefParamHandler />
      </Suspense>

      {/* ── Left Brand Panel ─────────────────────────────────── */}
      <div className="hidden lg:flex lg:w-1/2 xl:w-[55%] relative overflow-hidden bg-gradient-to-br from-[#3D52A0] via-[#4A5FB0] to-[#2D3E80] text-white">
        {/* Decorative circles */}
        <div className="absolute -top-24 -left-24 w-96 h-96 bg-white/5 rounded-full" />
        <div className="absolute -bottom-32 -right-32 w-[500px] h-[500px] bg-white/5 rounded-full" />
        <div className="absolute top-1/3 right-12 w-48 h-48 bg-white/[0.03] rounded-full" />

        <div className="relative z-10 flex flex-col justify-between p-12 xl:p-16 w-full">
          {/* Logo */}
          <div>
            <h1 className="text-3xl font-bold tracking-tight">PsyLib</h1>
            <p className="text-white/60 text-sm mt-1">Votre cabinet, simplifié</p>
          </div>

          {/* Value props */}
          <div className="space-y-8 max-w-md">
            <h2 className="text-2xl xl:text-3xl font-bold leading-tight">
              La plateforme tout-en-un
              <br />
              pour psychologues libéraux
            </h2>
            <div className="space-y-6">
              {VALUE_PROPS.map((prop) => {
                const Icon = prop.icon;
                return (
                  <div key={prop.title} className="flex items-start gap-4">
                    <div className="p-2.5 rounded-xl bg-white/10 flex-shrink-0">
                      <Icon size={22} className="text-white/90" />
                    </div>
                    <div>
                      <p className="font-semibold text-sm">{prop.title}</p>
                      <p className="text-white/60 text-sm mt-0.5">{prop.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          {/* HDS Badge */}
          <div className="flex items-center gap-3 text-white/50 text-xs">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <Lock size={12} />
              <span>Hébergement HDS certifié</span>
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-white/10 bg-white/5">
              <CheckCircle2 size={12} />
              <span>RGPD conforme</span>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right Form Panel ─────────────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center bg-background px-6 py-12 sm:px-12">
        <div className="w-full max-w-sm space-y-8">
          {/* Mobile logo */}
          <div className="text-center lg:hidden">
            <h1 className="text-3xl font-bold text-foreground">
              <span className="text-primary">PsyLib</span>
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Votre cabinet, simplifié
            </p>
          </div>

          {/* Desktop heading */}
          <div className="hidden lg:block">
            <h2 className="text-2xl font-bold text-foreground">
              Content de vous revoir
            </h2>
            <p className="mt-1 text-sm text-muted-foreground">
              Connectez-vous à votre espace professionnel
            </p>
          </div>

          {/* Error alert */}
          {error && (
            <div
              role="alert"
              className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
            >
              Une erreur est survenue lors de la connexion. Veuillez réessayer.
            </div>
          )}

          {/* Login card */}
          <div className="rounded-xl bg-white border border-border shadow-sm p-6 space-y-5">
            <form
              action={async () => {
                'use server';
                await signIn('keycloak', { redirectTo: callbackUrl });
              }}
            >
              <button
                type="submit"
                className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors min-h-[44px] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              >
                <Lock size={16} />
                Se connecter avec Keycloak
              </button>
            </form>

            <div className="flex items-center gap-3 text-xs text-muted-foreground">
              <div className="flex-1 h-px bg-border" />
              <span>Connexion sécurisée MFA</span>
              <div className="flex-1 h-px bg-border" />
            </div>

            <div className="flex items-center gap-2 rounded-lg bg-accent/5 border border-accent/20 p-3">
              <Shield size={16} className="text-accent flex-shrink-0" />
              <p className="text-xs text-muted-foreground">
                Authentification à deux facteurs activée pour protéger vos données patients
              </p>
            </div>
          </div>

          {/* Register link */}
          <p className="text-center text-sm text-muted-foreground">
            Pas encore de compte ?{' '}
            <Link
              href="/register"
              className="text-primary font-medium hover:underline"
            >
              S&apos;inscrire gratuitement
            </Link>
          </p>

          {/* Mobile HDS badges */}
          <div className="flex items-center justify-center gap-3 lg:hidden">
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border bg-surface">
              <Lock size={11} />
              HDS certifié
            </span>
            <span className="inline-flex items-center gap-1.5 text-xs text-muted-foreground px-3 py-1.5 rounded-full border border-border bg-surface">
              <CheckCircle2 size={11} />
              RGPD
            </span>
          </div>
        </div>
      </div>
    </main>
  );
}
