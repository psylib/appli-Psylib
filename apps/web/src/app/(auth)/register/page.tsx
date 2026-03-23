import { signIn } from '@/lib/auth/auth';
import Link from 'next/link';

export const metadata = {
  title: 'Inscription',
};

export default function RegisterPage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Créer un compte <span className="text-primary">PsyLib</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Rejoignez la plateforme de gestion pour psychologues
          </p>
        </div>

        <div className="rounded-xl bg-white border border-border shadow-sm p-8 space-y-6">
          <ul className="space-y-3 text-sm text-foreground">
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5" aria-hidden>&#10003;</span>
              Gestion patients et séances
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5" aria-hidden>&#10003;</span>
              Assistant IA pour résumés de séance
            </li>
            <li className="flex items-start gap-2">
              <span className="text-accent mt-0.5" aria-hidden>&#10003;</span>
              Hébergement HDS conforme — données protégées
            </li>
          </ul>

          <form
            action={async () => {
              'use server';
              await signIn('keycloak', { redirectTo: '/onboarding/profile' });
            }}
          >
            <button
              type="submit"
              className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Créer mon compte
            </button>
          </form>

          <p className="text-center text-xs text-muted-foreground">
            MFA (authentification à deux facteurs) requise pour les psychologues
          </p>
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link href="/login" className="text-primary font-medium hover:underline">
            Se connecter
          </Link>
        </p>

        <p className="text-center text-xs text-muted-foreground">
          Plateforme sécurisée conforme HDS — Données de santé protégées
        </p>
      </div>
    </main>
  );
}
