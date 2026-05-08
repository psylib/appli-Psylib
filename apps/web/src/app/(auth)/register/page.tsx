'use client';

import { useState } from 'react';
import Link from 'next/link';

const API_BASE = process.env['NEXT_PUBLIC_API_URL'] ?? 'http://localhost:4000';

export default function RegisterPage() {
  const [email, setEmail] = useState('');
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [adeliOrRpps, setAdeliOrRpps] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !firstName.trim() || !lastName.trim() || !adeliOrRpps.trim()) return;
    if (!/^\d{9,11}$/.test(adeliOrRpps.trim())) {
      setError('Le numéro ADELI (9 chiffres) ou RPPS (11 chiffres) est invalide.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      const res = await fetch(`${API_BASE}/api/v1/auth/register`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, firstName, lastName, adeliOrRpps }),
      });

      if (res.ok) {
        setSuccess(true);
      } else {
        const data = (await res.json().catch(() => ({}))) as {
          message?: string;
        };
        setError(
          data.message ?? 'Une erreur est survenue. Veuillez réessayer.',
        );
      }
    } catch {
      setError('Impossible de contacter le serveur. Veuillez réessayer.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background p-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-foreground">
            Créer un compte <span className="text-primary">PsyLib</span>
          </h1>
          <p className="mt-2 text-muted-foreground">
            Rejoignez la plateforme de gestion pour psy libéraux
          </p>
        </div>

        <div className="rounded-xl bg-white border border-border shadow-sm p-8 space-y-6">
          {success ? (
            <div className="text-center space-y-3">
              <div className="rounded-full bg-accent/10 w-12 h-12 flex items-center justify-center mx-auto">
                <span className="text-accent text-lg" aria-hidden>
                  &#9993;
                </span>
              </div>
              <h2 className="text-base font-semibold text-foreground">
                Vérifiez vos emails
              </h2>
              <p className="text-sm text-muted-foreground">
                Un email a été envoyé à <strong>{email}</strong> avec un lien
                pour définir votre mot de passe. Cliquez sur le lien puis
                connectez-vous.
              </p>
              <Link
                href="/login"
                className="inline-block mt-4 text-primary font-medium hover:underline text-sm"
              >
                Aller à la connexion
              </Link>
            </div>
          ) : (
            <>
              <ul className="space-y-2 text-sm text-foreground">
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5" aria-hidden>
                    &#10003;
                  </span>
                  Gestion patients et séances
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5" aria-hidden>
                    &#10003;
                  </span>
                  Assistant IA pour résumés de séance
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-accent mt-0.5" aria-hidden>
                    &#10003;
                  </span>
                  Hébergement HDS conforme — données protégées
                </li>
              </ul>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label
                      htmlFor="firstName"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      Prénom
                    </label>
                    <input
                      id="firstName"
                      type="text"
                      required
                      autoFocus
                      placeholder="Marie"
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-touch"
                    />
                  </div>
                  <div>
                    <label
                      htmlFor="lastName"
                      className="block text-sm font-medium text-foreground mb-1.5"
                    >
                      Nom
                    </label>
                    <input
                      id="lastName"
                      type="text"
                      required
                      placeholder="Dupont"
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-touch"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="adeliOrRpps"
                    className="block text-sm font-medium text-foreground mb-1.5"
                  >
                    N° ADELI ou RPPS
                  </label>
                  <input
                    id="adeliOrRpps"
                    type="text"
                    required
                    inputMode="numeric"
                    placeholder="Ex : 149300121"
                    value={adeliOrRpps}
                    onChange={(e) => setAdeliOrRpps(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-touch"
                  />
                  <p className="mt-1 text-xs text-muted-foreground">
                    Obligatoire pour vérifier votre statut de professionnel
                  </p>
                </div>

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
                    placeholder="vous@exemple.fr"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full rounded-lg border border-border bg-white px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-1 min-h-touch"
                  />
                </div>

                {error && (
                  <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2">
                    {error}
                  </p>
                )}

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 rounded-lg bg-primary text-white font-medium py-3 px-6 hover:bg-primary/90 transition-colors min-h-touch focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50"
                >
                  {loading ? 'Création en cours...' : 'Créer mon compte'}
                </button>
              </form>

              <p className="text-center text-xs text-muted-foreground">
                Un email vous sera envoyé pour définir votre mot de passe
              </p>
            </>
          )}
        </div>

        <p className="text-center text-sm text-muted-foreground">
          Déjà un compte ?{' '}
          <Link
            href="/login"
            className="text-primary font-medium hover:underline"
          >
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
