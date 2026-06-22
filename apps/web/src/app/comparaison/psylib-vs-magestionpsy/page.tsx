import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowRight, Shield, Brain, Video, Sparkles, Users } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PsyLib vs MaGestionPsy — Comparaison logiciels psychologues 2026',
  description:
    'Comparatif détaillé PsyLib vs MaGestionPsy : fonctionnalités, tarifs, IA, portail patient. Quel logiciel choisir pour votre cabinet de psychologue ?',
  openGraph: {
    title: 'PsyLib vs MaGestionPsy — Quel logiciel pour psychologue libéral ?',
    description: 'Comparaison complète PsyLib vs MaGestionPsy. IA clinique, portail patient avancé vs gestion de cabinet généraliste.',
    url: 'https://psylib.eu/comparaison/psylib-vs-magestionpsy',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/comparaison/psylib-vs-magestionpsy' },
  robots: { index: true, follow: true },
};

type FeatureStatus = 'yes' | 'no' | 'partial';

interface CompRow {
  feature: string;
  psylib: FeatureStatus;
  magestionpsy: FeatureStatus;
}

const comparisonData: CompRow[] = [
  { feature: 'Plan gratuit fonctionnel', psylib: 'yes', magestionpsy: 'partial' },
  { feature: 'Dossiers patients sécurisés', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Conformité HDS certifiée', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Chiffrement AES-256-GCM', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Notes cliniques structurées (SOAP/DAP)', psylib: 'yes', magestionpsy: 'partial' },
  { feature: 'Templates TCC / psychodynamique', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Outcome tracking (PHQ-9, GAD-7)', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Résumé de séance par IA', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Exercices thérapeutiques IA', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Visio-consultation intégrée', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Portail patient (mood, journal)', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Prise de RDV en ligne', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Liste d\'attente', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Questionnaires patients', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Comptabilité intégrée', psylib: 'yes', magestionpsy: 'partial' },
  { feature: 'Facturation PDF conforme', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Synchronisation Google Agenda', psylib: 'yes', magestionpsy: 'yes' },
  { feature: 'Réseau professionnel entre psys', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Multi-praticiens (cabinet)', psylib: 'yes', magestionpsy: 'no' },
  { feature: 'Application mobile native', psylib: 'yes', magestionpsy: 'no' },
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
    title: 'IA clinique intégrée',
    desc: 'Résumés de séance automatiques, exercices thérapeutiques personnalisés. MaGestionPsy ne propose aucune fonctionnalité IA.',
  },
  {
    icon: Brain,
    title: 'Portail patient avancé',
    desc: 'Suivi d\'humeur quotidien, journal de bord, exercices thérapeutiques. Un vrai espace dédié pour vos patients.',
  },
  {
    icon: Users,
    title: 'Spécialisé psychologues',
    desc: 'PsyLib est conçu exclusivement pour les psychologues libéraux. MaGestionPsy cible tous les thérapeutes sans distinction.',
  },
  {
    icon: Shield,
    title: 'Chiffrement applicatif',
    desc: 'Chaque note clinique est chiffrée AES-256-GCM côté serveur, en plus de l\'hébergement HDS.',
  },
  {
    icon: Video,
    title: 'Visio couple/famille',
    desc: 'Téléconsultation multi-participants (2 à 5 personnes) pour les thérapies de couple et famille. Hébergement HDS.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PsyLib vs MaGestionPsy — Comparaison logiciels psychologues',
  description: 'Comparatif détaillé PsyLib vs MaGestionPsy pour psychologues libéraux.',
  url: 'https://psylib.eu/comparaison/psylib-vs-magestionpsy',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Comparaison', item: 'https://psylib.eu/comparaison' },
      { '@type': 'ListItem', position: 3, name: 'PsyLib vs MaGestionPsy', item: 'https://psylib.eu/comparaison/psylib-vs-magestionpsy' },
    ],
  },
};

export default function PsyLibVsMaGestionPsyPage() {
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
            PsyLib vs MaGestionPsy
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            MaGestionPsy est un outil généraliste pour thérapeutes. PsyLib est conçu spécifiquement
            pour les psychologues, avec IA clinique et portail patient intégré.
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
              <div className="text-3xl font-bold text-charcoal mb-1">0€ <span className="text-base font-normal text-charcoal-400">→ 25€/mois</span></div>
              <p className="text-sm text-charcoal-400">Plan Free gratuit (10 patients), puis Solo à 25€/mois</p>
            </div>
            <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-charcoal-100 flex items-center justify-center">
                  <span className="font-bold text-charcoal-400 text-sm">M</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">MaGestionPsy</h3>
                  <p className="text-xs text-charcoal-300">magestionpsy.com</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-charcoal mb-1">0€ <span className="text-base font-normal text-charcoal-400">→ 29€/mois</span></div>
              <p className="text-sm text-charcoal-400">Plan gratuit limité (20 patients), puis Standard à 29€/mois</p>
            </div>
          </div>
        </section>

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="rounded-2xl border border-cream-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/50">
                    <th className="text-left py-4 px-5 font-medium text-charcoal-400 min-w-[260px]">Fonctionnalité</th>
                    <th className="text-center py-4 px-6 min-w-[140px]">
                      <div className="font-semibold text-sage">PsyLib</div>
                    </th>
                    <th className="text-center py-4 px-6 min-w-[140px]">
                      <div className="font-medium text-charcoal-400">MaGestionPsy</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-5 text-charcoal font-medium">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.psylib} /></td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.magestionpsy} /></td>
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
              Ce que PsyLib offre en plus
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
              MaGestionPsy : un outil généraliste solide
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                MaGestionPsy est un bon logiciel de gestion de cabinet qui couvre les besoins essentiels :
                agenda, prise de rendez-vous en ligne, dossiers patients, facturation, et même une visio-consultation native.
                L&apos;hébergement HDS est assuré.
              </p>
              <p>
                <strong>Son positionnement est généraliste</strong> — il s&apos;adresse aux psychologues, mais aussi aux
                sophrologues, hypnothérapeutes, ergothérapeutes, et autres thérapeutes. Les fonctionnalités ne sont pas
                spécifiquement conçues pour la pratique clinique en psychologie.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib : spécialisé psychologues, avec IA
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                PsyLib est construit exclusivement pour les psychologues libéraux français. Chaque fonctionnalité
                est pensée pour la pratique clinique : <strong>templates de notes</strong> adaptés (TCC, psychodynamique, ACT),
                <strong> outcome tracking</strong> avec les échelles standardisées (PHQ-9, GAD-7, CORE-OM),
                et <strong>résumés de séance par IA</strong>.
              </p>
              <p>
                Le <strong>portail patient</strong> permet à vos patients de suivre leur humeur, tenir un journal de bord,
                et accéder à des exercices thérapeutiques personnalisés — un outil thérapeutique à part entière, pas
                juste un accès calendrier.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Des tarifs comparables, plus de valeur
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Les deux logiciels ont des tarifs proches : <strong>29€/mois</strong> pour MaGestionPsy Standard
                contre <strong>25€/mois</strong> pour PsyLib Solo. PsyLib propose la visio,
                l&apos;IA clinique et le portail patient à partir du plan Pro (40€/mois).
              </p>
              <p>
                Le plan gratuit de MaGestionPsy est limité à 20 patients. Celui de PsyLib n&apos;a <strong>aucune limite
                de patients</strong> — vous pouvez gérer tout votre cabinet gratuitement, puis passer au plan payant
                quand vous voulez la visio ou l&apos;IA.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Quand choisir MaGestionPsy ?
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                MaGestionPsy peut convenir si vous êtes un thérapeute non-psychologue (sophrologue, hypnothérapeute)
                ou si vous cherchez un outil simple de gestion de cabinet sans fonctionnalités cliniques avancées.
                L&apos;accès secrétaire est un plus pour les cabinets avec du personnel administratif.
              </p>
              <p>
                Si vous êtes psychologue et que vous voulez un outil qui <strong>soutient votre pratique clinique</strong> au
                quotidien — notes structurées, aide IA, suivi des résultats thérapeutiques — PsyLib est fait pour vous.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Un logiciel conçu par et pour les psychologues
            </h2>
            <p className="text-sage-100 text-lg">
              Commencez gratuitement. 10 patients inclus. Sans carte bancaire.
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
