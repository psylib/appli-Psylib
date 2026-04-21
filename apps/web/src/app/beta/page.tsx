'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Shield,
  Lock,
  Users,
  ArrowRight,
  CheckCircle2,
  Loader2,
  Sparkles,
  Clock,
  Star,
  MessageCircle,
} from 'lucide-react';

const TOTAL_SPOTS = 15;
const SPOTS_TAKEN = 2; // Update manually as founders join

function CountdownSpots() {
  const remaining = TOTAL_SPOTS - SPOTS_TAKEN;
  const pct = (SPOTS_TAKEN / TOTAL_SPOTS) * 100;

  return (
    <div className="bg-white rounded-2xl border border-cream-200 p-6 shadow-sm">
      <div className="flex items-center justify-between mb-3">
        <span className="text-sm font-medium text-charcoal-500">Places Fondateurs</span>
        <span className="font-dm-mono text-sm font-medium text-terracotta">
          {remaining} restante{remaining > 1 ? 's' : ''}
        </span>
      </div>
      <div className="w-full h-3 bg-cream-100 rounded-full overflow-hidden mb-2">
        <div
          className="h-full bg-gradient-to-r from-terracotta to-terracotta-600 rounded-full transition-all duration-1000"
          style={{ width: `${pct}%` }}
        />
      </div>
      <p className="text-xs text-charcoal-400">
        {SPOTS_TAKEN} psychologue{SPOTS_TAKEN > 1 ? 's' : ''} déjà inscrit{SPOTS_TAKEN > 1 ? 's' : ''}
      </p>
    </div>
  );
}

function FounderBenefits() {
  const benefits = [
    {
      icon: Lock,
      title: '25€/mois à vie',
      description: 'Prix gelé pour toujours sur le plan Solo, même quand les tarifs augmentent.',
    },
    {
      icon: Star,
      title: 'Accès prioritaire',
      description: 'Chaque nouvelle fonctionnalité en avant-première, avant tout le monde.',
    },
    {
      icon: MessageCircle,
      title: 'Ligne directe fondateur',
      description: 'Accès direct pour façonner le produit selon vos besoins réels.',
    },
    {
      icon: Sparkles,
      title: 'Badge Fondateur',
      description: 'Reconnaissance permanente sur votre profil PsyLib.',
    },
  ];

  return (
    <div className="grid sm:grid-cols-2 gap-4">
      {benefits.map(({ icon: Icon, title, description }) => (
        <div key={title} className="flex gap-3 p-4 rounded-xl bg-sage-50/50 border border-sage-100">
          <Icon size={20} className="text-sage flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="font-medium text-charcoal text-sm">{title}</h3>
            <p className="text-xs text-charcoal-400 mt-0.5 leading-relaxed">{description}</p>
          </div>
        </div>
      ))}
    </div>
  );
}

function BetaForm() {
  const [form, setForm] = useState({ name: '', email: '', adeli: '', message: '' });
  const [status, setStatus] = useState<'idle' | 'loading' | 'success' | 'error'>('idle');
  const [errorMsg, setErrorMsg] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (status === 'loading') return;

    setStatus('loading');
    setErrorMsg('');

    try {
      const res = await fetch('/api/beta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
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
          Candidature envoyée
        </h3>
        <p className="text-charcoal-400 text-sm leading-relaxed max-w-md mx-auto">
          Merci {form.name} ! Vérifiez votre boîte email — je reviens vers vous
          dans les 48h pour organiser un appel de bienvenue.
        </p>
        <p className="text-xs text-charcoal-300">
          Vérifiez aussi vos spams, on ne sait jamais.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-cream-200 p-6 md:p-8 shadow-sm space-y-5">
      <div>
        <h3 className="font-playfair text-lg font-bold text-charcoal mb-1">
          Rejoindre les Fondateurs
        </h3>
        <p className="text-sm text-charcoal-400">
          Remplissez ce formulaire pour candidater. On revient vers vous sous 48h.
        </p>
      </div>

      <div className="space-y-4">
        <div>
          <label htmlFor="beta-name" className="block text-sm font-medium text-charcoal mb-1.5">
            Prénom et nom <span className="text-terracotta">*</span>
          </label>
          <input
            id="beta-name"
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
          <label htmlFor="beta-email" className="block text-sm font-medium text-charcoal mb-1.5">
            Email professionnel <span className="text-terracotta">*</span>
          </label>
          <input
            id="beta-email"
            type="email"
            required
            value={form.email}
            onChange={(e) => setForm({ ...form, email: e.target.value })}
            placeholder="marie.dupont@cabinet-psy.fr"
            className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
          />
        </div>

        <div>
          <label htmlFor="beta-adeli" className="block text-sm font-medium text-charcoal mb-1.5">
            N° ADELI <span className="text-charcoal-300 font-normal">(optionnel)</span>
          </label>
          <input
            id="beta-adeli"
            type="text"
            inputMode="numeric"
            maxLength={11}
            value={form.adeli}
            onChange={(e) => setForm({ ...form, adeli: e.target.value.replace(/[^\d\s]/g, '') })}
            placeholder="123456789"
            className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage"
          />
          <p className="text-xs text-charcoal-300 mt-1">9 chiffres — permet de vérifier votre statut de psychologue</p>
        </div>

        <div>
          <label htmlFor="beta-message" className="block text-sm font-medium text-charcoal mb-1.5">
            Pourquoi PsyLib vous intéresse ? <span className="text-charcoal-300 font-normal">(optionnel)</span>
          </label>
          <textarea
            id="beta-message"
            rows={3}
            maxLength={500}
            value={form.message}
            onChange={(e) => setForm({ ...form, message: e.target.value })}
            placeholder="Votre plus grande galère administrative, ce que vous attendez d'un outil de gestion..."
            className="w-full px-4 py-3 rounded-lg border border-cream-200 text-sm text-charcoal placeholder:text-charcoal-300 focus:outline-none focus:ring-2 focus:ring-sage/30 focus:border-sage resize-none"
          />
        </div>
      </div>

      {status === 'error' && (
        <p className="text-red-500 text-sm">{errorMsg}</p>
      )}

      <button
        type="submit"
        disabled={status === 'loading'}
        className="w-full flex items-center justify-center gap-2 px-6 py-3.5 rounded-full bg-terracotta text-white font-medium hover:bg-terracotta-600 transition-colors shadow-sm disabled:opacity-70"
      >
        {status === 'loading' ? (
          <Loader2 size={18} className="animate-spin" />
        ) : (
          <>
            Candidater — 25€/mois à vie
            <ArrowRight size={16} />
          </>
        )}
      </button>

      <p className="text-xs text-charcoal-400 text-center">
        Aucun paiement maintenant. On vous contacte d&apos;abord pour un appel de 15 min.
        <br />
        <Link href="/privacy" className="underline hover:text-charcoal-500">
          Conforme RGPD
        </Link>{' '}
        — vos données restent en France.
      </p>
    </form>
  );
}

export default function BetaPage() {
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);

  return (
    <>
      {/* Nav minimal */}
      <header className="fixed top-0 left-0 right-0 z-50 bg-warm-white/90 backdrop-blur-md border-b border-cream-200">
        <div className="max-w-7xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="font-playfair text-xl font-bold text-charcoal hover:text-sage transition-colors">
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
        <section className="py-16 md:py-24">
          <div className="max-w-5xl mx-auto px-6">
            <div className="text-center mb-12 space-y-4">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-terracotta/10 border border-terracotta/20 text-terracotta text-sm font-medium">
                <Clock size={14} />
                Places limitées — 15 praticiens uniquement
              </div>

              <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal leading-tight">
                Devenez Fondateur PsyLib
              </h1>

              <p className="text-lg text-charcoal-400 max-w-2xl mx-auto leading-relaxed">
                Accédez en avant-première à la plateforme de gestion de cabinet
                pensée pour les psychologues libéraux —{' '}
                <strong className="text-charcoal">à un tarif gelé pour toujours.</strong>
              </p>

              {/* Price comparison */}
              <div className="flex items-center justify-center gap-4 pt-2">
                <div className="text-center">
                  <div className="text-charcoal-300 line-through text-sm">50€/mois</div>
                  <div className="text-xs text-charcoal-300">tarif Pro standard</div>
                </div>
                <ArrowRight size={16} className="text-charcoal-200" />
                <div className="text-center">
                  <div className="font-dm-mono text-3xl font-bold text-terracotta">25€<span className="text-lg">/mois</span></div>
                  <div className="text-xs text-sage font-medium">à vie — prix gelé</div>
                </div>
              </div>
            </div>

            {/* Grid: Form + Sidebar */}
            <div className="grid lg:grid-cols-5 gap-8 items-start">
              {/* Form — 3 cols */}
              <div className="lg:col-span-3 space-y-6">
                <BetaForm />
              </div>

              {/* Sidebar — 2 cols */}
              <div className="lg:col-span-2 space-y-6">
                {mounted && <CountdownSpots />}
                <FounderBenefits />

                {/* Trust */}
                <div className="bg-cream-50 rounded-2xl border border-cream-200 p-5 space-y-3">
                  <h4 className="font-medium text-charcoal text-sm">Inclus dans l&apos;offre Fondateurs</h4>
                  <ul className="space-y-2">
                    {[
                      'Toutes les fonctionnalités du plan Pro',
                      'Patients et séances illimités',
                      '100 résumés IA / mois',
                      'Outcome Tracking (PHQ-9, GAD-7...)',
                      'Facturation PDF conforme',
                      'Hébergement HDS France',
                      'Support prioritaire',
                    ].map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm text-charcoal-500">
                        <CheckCircle2 size={14} className="text-sage flex-shrink-0 mt-0.5" />
                        {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Trust bar */}
        <section className="bg-white border-t border-cream-200 py-12">
          <div className="max-w-4xl mx-auto px-6">
            <div className="grid sm:grid-cols-3 gap-6 text-center">
              {[
                { icon: Shield, label: 'Hébergement HDS', sub: 'Données en France' },
                { icon: Lock, label: 'Chiffrement AES-256', sub: 'Niveau hospitalier' },
                { icon: Users, label: 'Conçu pour les psys', sub: 'Pas un outil générique' },
              ].map(({ icon: Icon, label, sub }) => (
                <div key={label} className="flex flex-col items-center gap-2">
                  <Icon size={24} className="text-sage" />
                  <div className="font-medium text-charcoal text-sm">{label}</div>
                  <div className="text-xs text-charcoal-400">{sub}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ mini */}
        <section className="bg-cream-50 py-12">
          <div className="max-w-2xl mx-auto px-6 space-y-6">
            <h2 className="font-playfair text-xl font-bold text-charcoal text-center">
              Questions fréquentes
            </h2>
            {[
              {
                q: 'Dois-je payer maintenant ?',
                a: 'Non. On vous contacte d\'abord pour un appel de 15 minutes. Le paiement intervient uniquement si vous confirmez votre place.',
              },
              {
                q: 'Que veut dire "prix gelé à vie" ?',
                a: 'Le tarif de 25€/mois est garanti pour toujours sur votre compte, même quand les tarifs augmentent.',
              },
              {
                q: 'Pourquoi 15 places seulement ?',
                a: 'Pour accompagner chaque Fondateur personnellement et intégrer vos retours dans le produit. La qualité prime sur la quantité.',
              },
              {
                q: 'Mes données sont-elles sécurisées ?',
                a: 'Oui. PsyLib est hébergé sur infrastructure certifiée HDS en France. Chiffrement AES-256-GCM sur toutes les données cliniques. Conforme RGPD.',
              },
            ].map(({ q, a }) => (
              <div key={q} className="bg-white rounded-xl border border-cream-200 p-5">
                <h3 className="font-medium text-charcoal text-sm mb-2">{q}</h3>
                <p className="text-sm text-charcoal-400 leading-relaxed">{a}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Footer minimal */}
        <footer className="bg-white border-t border-cream-200 py-8">
          <div className="max-w-4xl mx-auto px-6 text-center space-y-2">
            <p className="text-sm text-charcoal-400">
              PsyLib — L&apos;atelier numérique du psy libéral
            </p>
            <div className="flex items-center justify-center gap-4 text-xs text-charcoal-300">
              <Link href="/privacy" className="hover:text-charcoal-500 transition-colors">Confidentialité</Link>
              <span>·</span>
              <Link href="/terms" className="hover:text-charcoal-500 transition-colors">CGV</Link>
              <span>·</span>
              <a href="mailto:contact@psylib.eu" className="hover:text-charcoal-500 transition-colors">contact@psylib.eu</a>
            </div>
          </div>
        </footer>
      </main>
    </>
  );
}
