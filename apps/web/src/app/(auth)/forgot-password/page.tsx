'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    try {
      await fetch(`${API_BASE}/api/v1/auth/forgot-password`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      });
    } catch {
      // Always show success to not reveal if email exists
    } finally {
      setLoading(false);
      setSubmitted(true);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            <span className="text-primary">PsyLib</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Réinitialisation du mot de passe
          </p>
        </div>

        <div className="rounded-xl bg-white border border-border shadow-sm p-8 space-y-4">
          {submitted ? (
            <div className="text-center space-y-3">
              <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-accent text-lg" aria-hidden>&#9993;</span>
              </div>
              <h2 className="text-base font-semibold text-foreground">Vérifiez vos emails</h2>
              <p className="text-sm text-muted-foreground">
                Si un compte est associé à cette adresse, vous recevrez un email
                avec les instructions pour réinitialiser votre mot de passe.
              </p>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Saisissez votre adresse email. Vous recevrez un lien pour créer
                un nouveau mot de passe.
              </p>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label
                    htmlFor="email"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    Adresse email
                  </label>
                  <input
                    id="email"
                    type="email"
                    required
                    autoFocus
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-touch"
                  />
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Envoi en cours...' : 'Envoyer le lien'}
                </button>
              </form>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          <Link href="/login" className="text-primary font-medium hover:underline">
            Retour à la connexion
          </Link>
        </p>
      </div>
    </main>
  );
}
