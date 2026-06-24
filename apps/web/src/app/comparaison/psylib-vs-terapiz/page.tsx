import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowRight, Shield, Video, Sparkles, CreditCard, FileText, Mic } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PsyLib vs Terapiz — Comparaison logiciels psychologues 2026',
  description:
    'Comparatif PsyLib vs Terapiz pour psychologues libéraux : à prix égal, PsyLib ajoute l\'IA clinique, la transcription audio, la visio HDS native et la comptabilité FEC. Plan gratuit inclus.',
  openGraph: {
    title: 'PsyLib vs Terapiz — Quel logiciel pour psychologue libéral ?',
    description: 'Comparaison complète PsyLib vs Terapiz. Même tarif, mais IA, Scribe audio, visio intégrée et comptabilité en plus.',
    url: 'https://psylib.eu/comparaison/psylib-vs-terapiz',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/comparaison/psylib-vs-terapiz' },
  robots: { index: true, follow: true },
};

type FeatureStatus = 'yes' | 'no' | 'partial';

interface CompRow {
  feature: string;
  psylib: FeatureStatus;
  terapiz: FeatureStatus;
}

const comparisonData: CompRow[] = [
  { feature: 'Plan gratuit fonctionnel', psylib: 'yes', terapiz: 'no' },
  { feature: 'Dossiers patients sécurisés', psylib: 'yes', terapiz: 'yes' },
  { feature: 'Hébergement de santé HDS (France)', psylib: 'yes', terapiz: 'yes' },
  { feature: 'Chiffrement applicatif AES-256-GCM', psylib: 'yes', terapiz: 'partial' },
  { feature: 'Prise de RDV en ligne', psylib: 'yes', terapiz: 'yes' },
  { feature: 'Notes cliniques structurées (SOAP/DAP)', psylib: 'yes', terapiz: 'partial' },
  { feature: 'Templates TCC / psychodynamique', psylib: 'yes', terapiz: 'no' },
  { feature: 'Outcome tracking (PHQ-9, GAD-7)', psylib: 'yes', terapiz: 'no' },
  { feature: 'Résumé de séance par IA', psylib: 'yes', terapiz: 'no' },
  { feature: 'Transcription audio (AI Scribe)', psylib: 'yes', terapiz: 'no' },
  { feature: 'Exercices thérapeutiques IA', psylib: 'yes', terapiz: 'no' },
  { feature: 'Visio-consultation intégrée HDS', psylib: 'yes', terapiz: 'partial' },
  { feature: 'Portail patient (mood, journal)', psylib: 'yes', terapiz: 'no' },
  { feature: 'Comptabilité intégrée (FEC)', psylib: 'yes', terapiz: 'no' },
  { feature: 'Facturation PDF conforme', psylib: 'yes', terapiz: 'yes' },
  { feature: 'Réseau professionnel entre psys', psylib: 'yes', terapiz: 'no' },
  { feature: 'Multi-praticiens (cabinet)', psylib: 'yes', terapiz: 'partial' },
  { feature: 'Application mobile', psylib: 'yes', terapiz: 'partial' },
];

function StatusIcon({ status }: { status: FeatureStatus }) {
  switch (status) {
    case 'yes':
      return <CheckCircle2 size={18} className="text-emerald-500" />;
    case 'no':
      return <XCircle size={18} className="text-red-400" />;
    case 'partial':
      return <Minus size={18} className="text-amber-500" />;
  }
}

const differentiators = [
  {
    icon: Sparkles,
    title: 'IA clinique illimitée',
    desc: 'Résumés de séance structurés et exercices thérapeutiques personnalisés, inclus en illimité dès le plan Pro. Terapiz ne propose aucune IA.',
  },
  {
    icon: Mic,
    title: 'Transcription audio (Scribe)',
    desc: 'Enregistrez la séance, PsyLib en produit une note structurée. Un gain de temps que Terapiz n\'offre pas.',
  },
  {
    icon: Video,
    title: 'Visio HDS native',
    desc: 'Téléconsultation intégrée hébergée en France — individuelle, couple ou famille. Pas de redirection vers Google Meet.',
  },
  {
    icon: CreditCard,
    title: 'Comptabilité avec FEC',
    desc: 'Suivi des recettes, dépenses et export FEC conforme directement dans l\'outil. Absent chez Terapiz.',
  },
  {
    icon: FileText,
    title: 'Portail patient & outcome tracking',
    desc: 'Espace patient (humeur, journal, exercices) et échelles PHQ-9/GAD-7 pour mesurer les progrès cliniques.',
  },
  {
    icon: Shield,
    title: 'Plan gratuit + chiffrement applicatif',
    desc: 'Un plan Free vraiment utilisable, et un chiffrement AES-256-GCM sur chaque note clinique côté serveur.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PsyLib vs Terapiz — Comparaison logiciels psychologues',
  description: 'Comparatif détaillé PsyLib vs Terapiz pour psychologues libéraux.',
  url: 'https://psylib.eu/comparaison/psylib-vs-terapiz',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Comparaison', item: 'https://psylib.eu/comparaison' },
      { '@type': 'ListItem', position: 3, name: 'PsyLib vs Terapiz', item: 'https://psylib.eu/comparaison/psylib-vs-terapiz' },
    ],
  },
};

export default function PsyLibVsTerapizPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-5xl mx-auto px-6 text-center mb-16">
          <p className="text-sage font-medium text-sm mb-3">Comparatif 2026</p>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal leading-tight mb-6">
            PsyLib vs Terapiz
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            Terapiz est un bon logiciel de gestion pour thérapeutes. À tarif équivalent, PsyLib ajoute
            l&apos;IA clinique, la transcription audio, la visio HDS native et la comptabilité — et propose un plan gratuit.
          </p>
        </section>

        {/* Pricing comparison */}
        <section className="max-w-4xl mx-auto px-6 mb-12">
          <div className="grid md:grid-cols-2 gap-6">
            <div className="rounded-2xl border-2 border-sage bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-sage/10 flex items-center justify-center">
                  <span className="font-bold text-sage text-sm">P</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">PsyLib</h3>
                  <p className="text-xs text-charcoal-300">psylib.eu</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-charcoal mb-1">0€ <span className="text-base font-normal text-charcoal-400">→ 40€/mois</span></div>
              <p className="text-sm text-charcoal-400">Plan Free gratuit, Solo 25€/mois, Pro 40€/mois avec IA et visio illimitées</p>
            </div>
            <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-charcoal-100 flex items-center justify-center">
                  <span className="font-bold text-charcoal-400 text-sm">T</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Terapiz</h3>
                  <p className="text-xs text-charcoal-300">terapiz.com</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-charcoal mb-1">~40€<span className="text-base font-normal text-charcoal-400">/mois</span></div>
              <p className="text-sm text-charcoal-400">Essai 14 jours, puis abonnement unique. Pas de plan gratuit permanent.</p>
            </div>
          </div>
          <p className="text-center text-sm text-charcoal-400 mt-4">
            À tarif équivalent au plan Pro de PsyLib, Terapiz n&apos;inclut ni IA, ni Scribe audio, ni comptabilité.
          </p>
        </section>

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="rounded-2xl border border-cream-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/50">
                    <th className="text-left py-4 px-5 font-medium text-charcoal-400 min-w-[260px]">Fonctionnalité</th>
                    <th className="text-center py-4 px-6 min-w-[120px]">
                      <div className="font-semibold text-sage">PsyLib</div>
                    </th>
                    <th className="text-center py-4 px-6 min-w-[120px]">
                      <div className="font-medium text-charcoal-400">Terapiz</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-5 text-charcoal font-medium">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.psylib} /></td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.terapiz} /></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div className="flex items-center justify-center gap-6 mt-6 text-sm text-charcoal-400">
            <span className="flex items-center gap-1.5"><CheckCircle2 size={14} className="text-emerald-500" /> Inclus</span>
            <span className="flex items-center gap-1.5"><Minus size={14} className="text-amber-500" /> Partiel</span>
            <span className="flex items-center gap-1.5"><XCircle size={14} className="text-red-400" /> Absent</span>
          </div>
        </section>

        {/* Differentiators */}
        <section className="bg-cream/50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-charcoal text-center mb-12">
              À prix égal, PsyLib en fait plus
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {differentiators.map((d) => (
                <div key={d.title} className="bg-white rounded-xl p-6 shadow-sm border border-cream-200">
                  <div className="w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center mb-4">
                    <d.icon size={20} className="text-sage" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{d.title}</h3>
                  <p className="text-sm text-charcoal-400 leading-relaxed">{d.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed analysis */}
        <section className="max-w-3xl mx-auto px-6 py-16 space-y-12">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Terapiz : solide sur la gestion, sans dimension clinique
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Terapiz est un logiciel de gestion apprécié des thérapeutes : agenda, dossiers patients,
                facturation, prise de rendez-vous. L&apos;interface est claire, l&apos;hébergement est en France
                et le support en français. Pour gérer l&apos;administratif d&apos;un cabinet, il fait le travail.
              </p>
              <p>
                <strong>Ce qu&apos;il ne fait pas :</strong> aucune fonctionnalité d&apos;IA pour vos notes,
                pas de transcription audio de séance, pas de comptabilité avec export FEC, pas de portail patient,
                et une visio qui repose souvent sur un outil tiers plutôt qu&apos;une solution HDS native.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Le même budget, une autre génération d&apos;outil
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                C&apos;est le point clé : Terapiz se situe autour de <strong>40€/mois</strong>, exactement le tarif du
                <strong> plan Pro de PsyLib</strong>. Pour le même budget, PsyLib ajoute l&apos;IA clinique illimitée,
                la transcription audio (Scribe), la visio-consultation HDS intégrée, le portail patient et la
                comptabilité avec FEC.
              </p>
              <p>
                Et là où Terapiz propose un essai de 14 jours puis un abonnement payant, PsyLib offre un
                <strong> plan Free permanent</strong> (10 patients, sessions illimitées, comptabilité incluse) pour
                tester sans limite de temps et sans carte bancaire.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Conçu spécifiquement pour les psychologues
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Terapiz s&apos;adresse à l&apos;ensemble des thérapeutes. PsyLib est pensé <strong>pour la pratique
                du psychologue libéral français</strong> : templates de notes TCC et psychodynamique, échelles
                d&apos;outcome tracking (PHQ-9, GAD-7), gestion des patients mineurs et tuteurs, réseau professionnel
                d&apos;adressage entre confrères.
              </p>
              <p>
                Chaque donnée clinique est chiffrée AES-256-GCM côté serveur, en plus de l&apos;hébergement en France
                chez un hébergeur certifié HDS.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Quand choisir Terapiz ?
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Si vous cherchez uniquement un agenda et une facturation simples, sans besoin d&apos;IA, de visio
                intégrée ni de comptabilité, Terapiz reste une option fiable et éprouvée.
              </p>
              <p>
                Mais si vous voulez <strong>gagner du temps sur vos notes grâce à l&apos;IA</strong>, faire vos
                téléconsultations sans outil tiers et suivre votre comptabilité au même endroit — pour le même prix —
                PsyLib est l&apos;évolution naturelle.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Le même prix, beaucoup plus d&apos;outil
            </h2>
            <p className="text-sage-100 text-lg">
              Testez PsyLib gratuitement, sans limite de temps. 10 patients inclus, sans carte bancaire.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-terracotta text-white font-medium hover:bg-terracotta-600 transition-colors shadow-sm"
            >
              Essayer PsyLib gratuitement
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
