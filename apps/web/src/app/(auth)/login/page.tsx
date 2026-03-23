import { Suspense } from 'react';
import Link from 'next/link';
import { signIn } from '@/lib/auth/auth';
import { RefParamHandler } from '@/components/referral/ref-param-handler';

export const metadata = {
  title: 'Connexion',
};

export default function LoginPage({
  searchParams,
}: {
  searchParams?: { callbackUrl?: string; error?: string };
}) {
  const callbackUrl = searchParams?.callbackUrl ?? '/dashboard';
  const error = searchParams?.error;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <Suspense fallback={null}>
        <RefParamHandler />
      </Suspense>
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-primary">PsyLib</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Connectez-vous à votre espace professionnel
          </p>
        </div>

        {error && (
          <div
            role="alert"
            className="rounded-lg bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive"
          >
            Une erreur est survenue lors de la connexion. Veuillez réessayer.
          </div>
        )}

        <div className="rounded-xl bg-white border border-border shadow-sm p-8 space-y-4">
          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: callbackUrl });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Se connecter
            </button>
          </form>

          <div className="flex items-center justify-between text-xs">
            <Link href="/forgot-password" className="text-primary hover:underline">
              Mot de passe oublié ?
            </Link>
            <span className="text-muted-foreground">
              MFA requise pour les psychologues
            </span>
          </div>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Pas de compte ?{' '}
          <Link href="/register" className="text-primary font-medium hover:underline">
            S&apos;inscrire
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Plateforme sécurisée conforme HDS — Données de santé protégées
        </p>
      </div>
    </main>
  );
}
