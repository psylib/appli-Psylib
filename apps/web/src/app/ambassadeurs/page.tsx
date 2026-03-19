'use client';

import { useState } from 'react';
import { Star, BadgeCheck, Megaphone, Users, CheckCircle2, ArrowRight } from 'lucide-react';
import Link from 'next/link';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'https://api.psylib.eu/api/v1';

export default function AmbassadeursPage() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    adeli: '',
    type: 'superviseur',
    message: '',
  });
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_URL}/leads`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          email: form.email,
          source: `ambassador_${form.type}`,
        }),
      });
      if (!res.ok) throw new Error('Erreur lors de l\'envoi');
      setSubmitted(true);
    } catch {
      setError('Une erreur est survenue. Veuillez réessayer ou envoyer un email à contact@psylib.eu');
    } finally {
      setLoading(false);
    }
  };

  return (
    <main>
      {/* Nav simple */}
      <nav className="border-b border-border bg-white sticky top-0 z-10">
        <div className="mx-auto max-w-5xl px-6 py-4 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-white text-sm font-bold">PS</span>
            </div>
            <span className="text-lg font-bold text-primary">PsyLib</span>
          </Link>
          <Link
            href="/login"
            className="rounded-lg bg-primary text-white px-4 py-2 text-sm font-medium hover:bg-primary/90 transition-colors"
          >
            Se connecter
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <section className="bg-gradient-to-b from-primary/5 to-background py-20 px-6">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <div className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/5 px-4 py-1.5 text-sm font-medium text-primary">
            <Star size={14} />
            Programme Ambassadeurs
          </div>
          <h1 className="text-4xl font-bold text-foreground leading-tight">
            Devenez Ambassadeur PsyLib
          </h1>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Superviseurs, formateurs et universitaires — rejoignez notre réseau de partenaires
            et aidez vos supervisés à mieux gérer leur cabinet. <strong>Accès Pro gratuit</strong> pendant 12 mois.
          </p>
          <a
            href="#postuler"
            className="inline-flex items-center gap-2 rounded-xl bg-primary text-white px-6 py-3 text-base font-semibold hover:bg-primary/90 transition-colors"
          >
            Postuler maintenant
            <ArrowRight size={18} />
          </a>
        </div>
      </section>

      {/* Avantages */}
      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-4xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Les avantages ambassadeur
          </h2>
          <div className="grid md:grid-cols-3 gap-6">
            {[
              {
                icon: BadgeCheck,
                title: 'Accès Pro 12 mois offert',
                desc: 'Toutes les fonctionnalités PsyLib (agenda, notes, facturation, IA, réseau) sans frais pendant 1 an.',
                color: 'text-primary',
                bg: 'bg-primary/10',
              },
              {
                icon: Star,
                title: 'Badge "Ambassadeur"',
                desc: "Badge visible sur votre profil public PsyLib — distingue votre expertise auprès de vos supervisés.",
                color: 'text-accent',
                bg: 'bg-accent/10',
              },
              {
                icon: Megaphone,
                title: 'Co-marketing',
                desc: 'Mise en avant dans nos communications (newsletter, réseaux sociaux) et accès prioritaire aux nouvelles fonctionnalités.',
                color: 'text-warm',
                bg: 'bg-warm/10',
              },
            ].map((a) => (
              <div key={a.title} className="rounded-xl border border-border p-6 space-y-3">
                <div className={`h-10 w-10 rounded-lg ${a.bg} flex items-center justify-center`}>
                  <a.icon size={20} className={a.color} />
                </div>
                <h3 className="font-semibold text-foreground">{a.title}</h3>
                <p className="text-sm text-muted-foreground">{a.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Comment ça marche */}
      <section className="py-16 px-6 bg-surface">
        <div className="mx-auto max-w-3xl">
          <h2 className="text-2xl font-bold text-foreground text-center mb-10">
            Comment ça marche ?
          </h2>
          <ol className="space-y-6">
            {[
              {
                n: '01',
                title: 'Vous postulez',
                desc: 'Remplissez le formulaire ci-dessous. Nous acceptons superviseurs, formateurs et enseignants universitaires en psychologie.',
              },
              {
                n: '02',
                title: 'Entretien de 20 min',
                desc: "Un membre de l'équipe PsyLib vous contacte pour un échange rapide sur vos besoins et votre pratique.",
              },
              {
                n: '03',
                title: 'Onboarding personnalisé',
                desc: 'Vous recevez votre compte Pro, un kit ambassadeur et un accès à notre espace partenaires.',
              },
              {
                n: '04',
                title: 'Vous parrainez vos supervisés',
                desc: 'Chaque supervisé qui rejoint PsyLib via votre lien obtient un mois gratuit — et vous prolongez votre accès Pro.',
              },
            ].map((step) => (
              <li key={step.n} className="flex gap-5">
                <div className="text-3xl font-black text-primary/20 w-10 flex-shrink-0">{step.n}</div>
                <div className="pt-1">
                  <h3 className="font-semibold text-foreground mb-1">{step.title}</h3>
                  <p className="text-sm text-muted-foreground">{step.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Qui peut postuler */}
      <section className="py-16 px-6 bg-white">
        <div className="mx-auto max-w-3xl text-center space-y-6">
          <h2 className="text-2xl font-bold text-foreground">Qui peut postuler ?</h2>
          <div className="grid sm:grid-cols-3 gap-4">
            {[
              { icon: Users, label: 'Superviseurs cliniques', desc: 'Vous accompagnez des psys en supervision individuelle ou de groupe' },
              { icon: BadgeCheck, label: 'Formateurs DPC/FMC', desc: 'Vous animez des formations pour psychologues libéraux' },
              { icon: Star, label: 'Universitaires', desc: 'Vous enseignez en master ou doctorat de psychologie clinique' },
            ].map((p) => (
              <div key={p.label} className="rounded-xl border border-border p-5 space-y-2">
                <p.icon size={22} className="text-primary mx-auto" />
                <p className="font-semibold text-sm text-foreground">{p.label}</p>
                <p className="text-xs text-muted-foreground">{p.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Formulaire */}
      <section id="postuler" className="py-16 px-6 bg-surface">
        <div className="mx-auto max-w-lg">
          <h2 className="text-2xl font-bold text-foreground text-center mb-8">Postuler au programme</h2>

          {submitted ? (
            <div className="rounded-xl border border-accent/30 bg-accent/5 p-8 text-center space-y-3">
              <CheckCircle2 size={40} className="text-accent mx-auto" />
              <p className="font-semibold text-foreground">Candidature reçue !</p>
              <p className="text-sm text-muted-foreground">
                Nous vous contacterons sous 48h pour planifier votre entretien.
              </p>
            </div>
          ) : (
            <form onSubmit={(e) => void handleSubmit(e)} className="rounded-xl border border-border bg-white p-6 shadow-sm space-y-4">
              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="name">
                  Nom complet <span className="text-destructive">*</span>
                </label>
                <input
                  id="name"
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="Dr Marie Dupont"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="email">
                  Email professionnel <span className="text-destructive">*</span>
                </label>
                <input
                  id="email"
                  type="email"
                  required
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  placeholder="marie.dupont@psycabinet.fr"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="adeli">
                  Numéro ADELI <span className="text-destructive">*</span>
                </label>
                <input
                  id="adeli"
                  type="text"
                  required
                  value={form.adeli}
                  onChange={(e) => setForm({ ...form, adeli: e.target.value })}
                  placeholder="75 93 1234 5"
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-primary/40"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="type">
                  Type de pratique <span className="text-destructive">*</span>
                </label>
                <select
                  id="type"
                  value={form.type}
                  onChange={(e) => setForm({ ...form, type: e.target.value })}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 bg-white"
                >
                  <option value="superviseur">Superviseur clinique</option>
                  <option value="formateur">Formateur DPC / FMC</option>
                  <option value="universitaire">Universitaire (master/doctorat)</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-foreground mb-1" htmlFor="message">
                  Message (optionnel)
                </label>
                <textarea
                  id="message"
                  value={form.message}
                  onChange={(e) => setForm({ ...form, message: e.target.value })}
                  placeholder="Décrivez brièvement votre pratique et pourquoi vous souhaitez rejoindre le programme..."
                  rows={4}
                  className="w-full rounded-lg border border-border px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-primary/40 resize-none"
                />
              </div>

              {error && (
                <div className="rounded-lg bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full rounded-xl bg-primary text-white py-3 font-semibold hover:bg-primary/90 disabled:opacity-60 transition-colors"
              >
                {loading ? 'Envoi en cours...' : 'Envoyer ma candidature'}
              </button>

              <p className="text-xs text-muted-foreground text-center">
                En soumettant ce formulaire, vous acceptez d&apos;être contacté par l&apos;équipe PsyLib.
              </p>
            </form>
          )}
        </div>
      </section>

      {/* Footer minimal */}
      <footer className="border-t border-border py-8 px-6 text-center text-sm text-muted-foreground">
        <p>
          <Link href="/" className="hover:text-foreground transition-colors">PsyLib</Link>
          {' — '}Plateforme SaaS conforme HDS pour psychologues libéraux
        </p>
      </footer>
    </main>
  );
}
