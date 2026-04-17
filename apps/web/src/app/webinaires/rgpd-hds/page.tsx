'use client';

import { useState } from 'react';
import Link from 'next/link';
import {
  Shield,
  Clock,
  CheckCircle2,
  Loader2,
  ArrowRight,
  Calendar,
  Users,
  FileText,
  AlertTriangle,
} from 'lucide-react';

const WEBINAR_DATE = '2026-04-16';
const WEBINAR_TIME = '12h30';
const WEBINAR_DURATION = '45 minutes';

function WebinarForm() {
  const [form, setForm] = useState({ name: '', email: '', city: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/webinaires/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...form, webinar: 'rgpd-hds' }),
      });

      if (res.ok) {
        setStatus('success');
      } else {
        const data = await res.json().catch(() => ({}));
        setErrorMsg(data.error || 'Une erreur est survenue.');
        setStatus('error');
      }
    } catch {
      setErrorMsg('Erreur réseau. Veuillez réessayer.');
      setStatus('error');
    }
  };

  if (status === 'success') {
    return (
      <div className="bg-white rounded-2xl border border-sage-200 p-8 text-center space-y-4">
        <div className="w-16 h-16 mx-auto bg-sage-50 rounded-full flex items-center justify-center">
          <CheckCircle2 size={32} className="text-sage" />
        </div>
        <h3 className="font-playfair text-xl font-bold text-charcoal">
          Inscription confirmée
        </h3>
        <p className="text-charcoal-400 text-sm leading-relaxed max-w-md mx-auto">
          Merci {form.name} ! Vous recevrez le lien Zoom par email 48h avant le webinaire,
          ainsi qu'un rappel 1h avant.
        </p>
        <p className="text-xs text-charcoal-300">
          Vérifiez vos spams — et ajoutez noreply@psylib.eu à vos contacts.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={handleSubmit}
      className="bg-white rounded-2xl border border-cream-200 p-6 md:p-8 shadow-sm space-y-5"
    >
      <div>
        <h3 className="font-playfair text-lg font-bold text-charcoal mb-1">
          S'inscrire au webinaire
        </h3>
        <p className="text-sm text-charcoal-400">
          Gratuit. Replay envoyé à tous les inscrits.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label
            htmlFor="web-name"
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            Prénom et nom <span className="text-terracotta">*</span>
          </label>
          <input
            id="web-name"
            type="text"
            required
            minLength={2}
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
            placeholder="Dr. Marie Dupont"
            className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
          />
        </div>

        <div>
          <label
            htmlFor="web-email"
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            Email professionnel <span className="text-terracotta">*</span>
          </label>
          <input
            id="web-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="marie.dupont@cabinet-psy.fr"
            className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
          />
        </div>

        <div>
          <label
            htmlFor="web-city"
            className="block text-sm font-medium text-charcoal mb-1.5"
          >
            Ville <span className="text-charcoal-300 font-normal">(optionnel)</span>
          </label>
          <input
            id="web-city"
            type="text"
            value={form.city}
            onChange={(e) => setForm({ ...form, city: e.target.value })}
            placeholder="Paris"
            className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
          />
        </div>
      </div>

      {status === 'error' && <p className="text-red-500 text-sm">{errorMsg}</p>}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-terracotta text-white font-medium hover:bg-terracotta-600 transition-colors shadow-sm disabled:opacity-70"
      >
        {status === 'loading' ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            Réserver ma place (gratuit)
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-xs text-charcoal-400 text-center">
        Webinaire en direct via Zoom. Lien envoyé 48h avant.{' '}
        <Link href="/privacy" className="underline hover:text-charcoal-500">
          Conforme RGPD
        </Link>
      </p>
    </form>
  );
}

export default function WebinarRgpdHdsPage() {
  const programme = [
    {
      duration: '8 min',
      title: 'Ce que dit vraiment la loi',
      description:
        "Article L.1111-8 du Code de la santé publique, RGPD, Code de déontologie — décrypté sans jargon.",
    },
    {
      duration: '10 min',
      title: "Les 7 obligations HDS concrètes pour un cabinet psy",
      description:
        "Hébergement, chiffrement, authentification forte, audit, consentement, droit d'effacement, notification.",
    },
    {
      duration: '12 min',
      title: "Les 5 pièges les plus fréquents",
      description:
        "Google Drive, Dropbox, Doctolib, Excel, logiciels SaaS US — ce qui est (vraiment) hors la loi.",
    },
    {
      duration: '5 min',
      title: 'Sanctions CNIL récentes sur des professionnels de santé',
      description:
        "Cas concrets 2024-2026, montants des amendes, ce qui déclenche les contrôles.",
    },
    {
      duration: '10 min',
      title: 'Questions / Réponses en direct',
      description:
        "Vos questions spécifiques à votre pratique — poser directement au cours du webinaire.",
    },
  ];

  const benefits = [
    {
      icon: FileText,
      title: 'Slides + enregistrement',
      description: 'Accès complet après le webinaire, à consulter quand vous voulez.',
    },
    {
      icon: Shield,
      title: 'Checklist conformité',
      description: '10 points à vérifier sur votre logiciel actuel.',
    },
    {
      icon: AlertTriangle,
      title: 'Modèle de consentement',
      description: 'Template RGPD prêt à adapter pour vos patients.',
    },
  ];

  return (
    <>
      {/* Nav minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link
            href="/"
            className="font-playfair text-xl font-bold text-charcoal hover:text-sage transition-colors"
          >
            PsyLib
          </Link>
          <Link
            href="/"
            className="text-sm text-charcoal-400 hover:text-charcoal transition-colors"
          >
            Retour au site
          </Link>
        </div>
      </header>

      <main className="bg-warm-white min-h-screen pt-14">
        {/* Hero */}
        <section className="py-16 md:py-20">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-sage/10 border border-sage/20 text-sage text-sm font-medium">
                <Calendar size={14} />
                Webinaire gratuit · Jeudi 16 avril 2026 · 12h30 (Paris)
              </div>

              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal leading-tight">
                RGPD & HDS pour psychologues libéraux
              </h1>

              <p className="text-lg text-charcoal-400 max-w-2xl mx-auto leading-relaxed">
                Ce que dit vraiment la loi sur vos données patients —{' '}
                <strong className="text-charcoal">
                  et pourquoi 80% des logiciels utilisés par les psys sont hors conformité
                </strong>
                .
              </p>

              <div className="flex items-center justify-center gap-6 pt-2 flex-wrap text-sm text-charcoal-500">
                <div className="flex items-center gap-2">
                  <Clock size={16} className="text-sage" />
                  <span>{WEBINAR_DURATION}</span>
                </div>
                <div className="flex items-center gap-2">
                  <Users size={16} className="text-sage" />
                  <span>Places limitées à 100</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText size={16} className="text-sage" />
                  <span>Replay + ressources offertes</span>
                </div>
              </div>
            </div>

            {/* Grid: Form + Programme */}
            <div className="grid lg:grid-cols-5 gap-8 items-start">
              {/* Form — 2 cols */}
              <div className="lg:col-span-2 lg:sticky lg:top-20">
                <WebinarForm />
              </div>

              {/* Programme — 3 cols */}
              <div className="lg:col-span-3 space-y-6">
                <div className="bg-white rounded-2xl border border-cream-200 p-6 md:p-8">
                  <h2 className="font-playfair text-xl font-bold text-charcoal mb-5">
                    Au programme
                  </h2>
                  <ol className="space-y-5">
                    {programme.map((item, idx) => (
                      <li key={item.title} className="flex gap-4">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-sage/10 text-sage text-sm font-semibold flex items-center justify-center">
                          {idx + 1}
                        </div>
                        <div className="flex-1 pt-0.5">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="font-medium text-charcoal text-sm">
                              {item.title}
                            </h3>
                            <span className="text-xs text-charcoal-300 font-dm-mono">
                              · {item.duration}
                            </span>
                          </div>
                          <p className="text-sm text-charcoal-400 leading-relaxed">
                            {item.description}
                          </p>
                        </div>
                      </li>
                    ))}
                  </ol>
                </div>

                {/* Benefits */}
                <div className="bg-cream-50 rounded-2xl border border-cream-200 p-6">
                  <h3 className="font-medium text-charcoal text-sm mb-4">
                    Ressources offertes aux inscrits
                  </h3>
                  <div className="grid sm:grid-cols-3 gap-4">
                    {benefits.map(({ icon: Icon, title, description }) => (
                      <div key={title} className="space-y-2">
                        <Icon size={20} className="text-sage" />
                        <h4 className="font-medium text-charcoal text-sm">{title}</h4>
                        <p className="text-xs text-charcoal-400 leading-relaxed">
                          {description}
                        </p>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Pourquoi ce webinaire */}
        <section className="bg-white border-t border-cream-200 py-16">
          <div className="max-w-3xl mx-auto px-6 space-y-6">
            <h2 className="font-playfair text-2xl font-bold text-charcoal text-center">
              Pourquoi ce webinaire ?
            </h2>
            <div className="space-y-4 text-charcoal-500 leading-relaxed">
              <p>
                Les notes de séance, les dossiers patients, les messages échangés avec vos
                patients sont des <strong>données de santé</strong> au sens de l'article
                L.1111-8 du Code de la santé publique. Leur hébergement en ligne est
                soumis à la certification HDS (Hébergeur de Données de Santé).
              </p>
              <p>
                En pratique, la majorité des psychologues libéraux utilisent aujourd'hui
                des outils <strong>non conformes</strong> — sans le savoir : Google Drive,
                Dropbox, Excel, SaaS hébergés hors France, tableaux partagés.
              </p>
              <p>
                La sanction CNIL potentielle : jusqu'à{' '}
                <strong className="text-terracotta">20 millions d'euros ou 4% du CA</strong>.
                Et ce n'est pas théorique : des professionnels de santé ont déjà été
                sanctionnés en 2024-2026.
              </p>
              <p>
                Ce webinaire de 45 minutes vous donne en clair tout ce que vous devez
                savoir — <strong>sans jargon technique</strong>, avec des exemples concrets
                de votre quotidien.
              </p>
            </div>

            <div className="bg-sage/5 border border-sage/20 rounded-xl p-5 mt-8">
              <p className="text-sm text-charcoal-500 leading-relaxed">
                <strong className="text-charcoal">Animé par Tony, fondateur de PsyLib</strong> —
                le premier logiciel tout-en-un 100% HDS pour psychologues libéraux.
                Ce webinaire est gratuit et sans engagement. Ce n'est pas un pitch produit :
                c'est de l'information pratique.
              </p>
            </div>
          </div>
        </section>

        {/* FAQ */}
        <section className="bg-cream-50 py-16">
          <div className="max-w-2xl mx-auto px-6 space-y-6">
            <h2 className="font-playfair text-xl font-bold text-charcoal text-center">
              Questions fréquentes
            </h2>
            {[
              {
                q: "C'est vraiment gratuit ?",
                a: "Oui, 100% gratuit. Pas de carte bancaire demandée, pas d'engagement. Juste votre email pour recevoir le lien Zoom et les ressources.",
              },
              {
                q: 'Je ne pourrai pas être en direct — vais-je recevoir le replay ?',
                a: "Oui. Tous les inscrits reçoivent automatiquement le replay complet par email 24h après le webinaire, même s'ils n'étaient pas présents.",
              },
              {
                q: "Est-ce que c'est un pitch produit PsyLib ?",
                a: 'Non. Le webinaire est 100% informatif sur la réglementation RGPD/HDS. PsyLib sera évoqué brièvement à la fin, mais le contenu est utile quel que soit votre logiciel actuel.',
              },
              {
                q: 'Puis-je poser mes questions pendant le webinaire ?',
                a: 'Oui. Les 10 dernières minutes sont dédiées à vos questions en direct. Vous pouvez aussi les soumettre à l\'avance via email après inscription.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-cream-200 p-5">
                <h3 className="font-medium text-charcoal text-sm mb-2">{q}</h3>
                <p className="text-sm text-charcoal-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="bg-white border-t border-cream-200 py-8">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-2">
            <p className="text-sm text-charcoal-400">
              PsyLib — L'atelier numérique du psy libéral
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-charcoal-300">
              <Link href="/privacy" className="hover:text-charcoal-500 transition-colors">
                Confidentialité
              </Link>
              <span>·</span>
              <Link href="/cgv" className="hover:text-charcoal-500 transition-colors">
                CGV
              </Link>
              <span>·</span>
              <a
                href="mailto:contact@psylib.eu"
                className="hover:text-charcoal-500 transition-colors"
              >
                contact@psylib.eu
              </a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
