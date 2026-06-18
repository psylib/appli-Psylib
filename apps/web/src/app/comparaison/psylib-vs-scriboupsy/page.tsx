import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowRight, Shield, Brain, Video, Sparkles, Calendar } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PsyLib vs Scriboupsy — Comparaison logiciels psychologues 2026',
  description:
    'Comparatif détaillé PsyLib vs Scriboupsy : fonctionnalités, tarifs, IA, visio, agenda. Quel logiciel choisir pour votre cabinet de psychologue ?',
  openGraph: {
    title: 'PsyLib vs Scriboupsy — Quel logiciel pour psychologue libéral ?',
    description: 'Comparaison complète PsyLib vs Scriboupsy. Logiciel tout-en-un vs outil centré rédaction clinique.',
    url: 'https://psylib.eu/comparaison/psylib-vs-scriboupsy',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/comparaison/psylib-vs-scriboupsy' },
  robots: { index: true, follow: true },
};

type FeatureStatus = 'yes' | 'no' | 'partial';

interface CompRow {
  feature: string;
  psylib: FeatureStatus;
  scriboupsy: FeatureStatus;
}

const comparisonData: CompRow[] = [
  { feature: 'Plan gratuit fonctionnel', psylib: 'yes', scriboupsy: 'partial' },
  { feature: 'Dossiers patients sécurisés', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Conformité HDS certifiée', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Chiffrement AES-256-GCM', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Notes cliniques structurées (SOAP/DAP)', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Templates / trames personnalisables', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Outcome tracking (PHQ-9, GAD-7)', psylib: 'yes', scriboupsy: 'partial' },
  { feature: 'Résumé de séance par IA', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Exercices thérapeutiques IA', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Visio-consultation intégrée', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Portail patient (mood, journal)', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Prise de RDV en ligne', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Agenda / calendrier', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Comptabilité intégrée (FEC, 2035)', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Facturation PDF conforme', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Attestations en un clic', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Graphes / visualisation progression', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Réseau professionnel entre psys', psylib: 'yes', scriboupsy: 'no' },
  { feature: 'Paiement en ligne patient', psylib: 'yes', scriboupsy: 'yes' },
  { feature: 'Application mobile native', psylib: 'yes', scriboupsy: 'no' },
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
    icon: Calendar,
    title: 'Agenda et RDV en ligne',
    desc: 'Agenda complet avec prise de rendez-vous en ligne, rappels automatiques et sync Google Calendar. Absent chez Scriboupsy.',
  },
  {
    icon: Sparkles,
    title: 'IA clinique intégrée',
    desc: 'Résumés de séance automatiques, exercices thérapeutiques personnalisés. Scriboupsy ne propose aucune fonctionnalité IA.',
  },
  {
    icon: Video,
    title: 'Visio-consultation intégrée',
    desc: 'Téléconsultation sécurisée HDS directement dans PsyLib. Individuelle, couple ou famille.',
  },
  {
    icon: Brain,
    title: 'Portail patient complet',
    desc: 'Suivi d\'humeur quotidien, journal de bord, exercices. Un espace thérapeutique dédié pour vos patients.',
  },
  {
    icon: Shield,
    title: 'Hébergement HDS certifié',
    desc: 'Infrastructure certifiée HDS en France avec chiffrement applicatif AES-256. Conformité légale garantie.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PsyLib vs Scriboupsy — Comparaison logiciels psychologues',
  description: 'Comparatif détaillé PsyLib vs Scriboupsy pour psychologues libéraux.',
  url: 'https://psylib.eu/comparaison/psylib-vs-scriboupsy',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Comparaison', item: 'https://psylib.eu/comparaison' },
      { '@type': 'ListItem', position: 3, name: 'PsyLib vs Scriboupsy', item: 'https://psylib.eu/comparaison/psylib-vs-scriboupsy' },
    ],
  },
};

export default function PsyLibVsScriboupsyPage() {
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
            PsyLib vs Scriboupsy
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            Scriboupsy excelle dans la rédaction clinique. PsyLib offre un outil tout-en-un :
            notes, agenda, visio, IA, comptabilité et portail patient.
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
              <p className="text-sm text-charcoal-400">Plan Free gratuit (15 patients), puis Solo à 25€/mois</p>
            </div>
            <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-charcoal-100 flex items-center justify-center">
                  <span className="font-bold text-charcoal-400 text-sm">S</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Scriboupsy</h3>
                  <p className="text-xs text-charcoal-300">scriboupsy.fr</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-charcoal mb-1">0€ <span className="text-base font-normal text-charcoal-400">→ 27€/mois</span></div>
              <p className="text-sm text-charcoal-400">Plan gratuit limité (5 patients), puis Pro à 27€/mois</p>
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
                    <th className="text-center py-4 px-6 min-w-[120px]">
                      <div className="font-semibold text-sage">PsyLib</div>
                    </th>
                    <th className="text-center py-4 px-6 min-w-[120px]">
                      <div className="font-medium text-charcoal-400">Scriboupsy</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-5 text-charcoal font-medium">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.psylib} /></td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.scriboupsy} /></td>
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
              Scriboupsy : excellent pour les écrits cliniques
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Scriboupsy est utilisé par plus de 1 200 psychologues en France. Son point fort est indéniable :
                c&apos;est un <strong>excellent éditeur d&apos;écrits psychologiques</strong>. Trames personnalisables,
                anamnèses structurées, bilans, comptes-rendus — la rédaction clinique est au coeur de l&apos;outil.
              </p>
              <p>
                Les graphes automatisés pour visualiser la progression patient et la génération d&apos;attestations
                en un clic sont aussi des fonctionnalités appréciées.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Mais Scriboupsy n&apos;est pas un outil de gestion de cabinet
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                <strong>Ce que Scriboupsy ne fait pas :</strong> pas d&apos;agenda, pas de prise de rendez-vous en ligne,
                pas de visio-consultation, pas de comptabilité (FEC, 2035), pas de portail patient, pas d&apos;IA,
                pas de réseau professionnel, pas d&apos;app mobile.
              </p>
              <p>
                Concrètement, avec Scriboupsy vous avez besoin d&apos;un agenda séparé (Google Calendar, Doctolib),
                d&apos;un outil de visio séparé (Zoom, Google Meet), d&apos;un logiciel de comptabilité séparé,
                et d&apos;un autre outil pour la prise de RDV en ligne. Ça fait beaucoup d&apos;outils à jongler.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib : tout-en-un, y compris les écrits
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                PsyLib intègre <strong>tout dans un seul outil</strong> : notes cliniques avec templates (SOAP, DAP, TCC, psychodynamique),
                agenda avec prise de RDV en ligne, visio-consultation HDS, comptabilité complète (FEC, 2035, charges sociales),
                facturation, portail patient, et IA clinique.
              </p>
              <p>
                L&apos;IA peut <strong>résumer automatiquement vos séances</strong> et <strong>générer des exercices
                thérapeutiques personnalisés</strong> pour vos patients — une aide concrète au quotidien que Scriboupsy
                ne propose pas.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Conformité HDS : un point critique
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                PsyLib est hébergé sur <strong>infrastructure certifiée HDS V2</strong> (AZNetwork, France — 6 activités + ISO 27001) avec chiffrement
                applicatif AES-256-GCM sur chaque note clinique. C&apos;est une obligation légale pour le stockage
                de données de santé en France.
              </p>
              <p>
                Scriboupsy ne mentionne pas publiquement de certification HDS. Si vous stockez des données
                cliniques de patients, la conformité HDS n&apos;est pas optionnelle — c&apos;est la loi (article L.1111-8
                du Code de la santé publique).
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Quand choisir Scriboupsy ?
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Scriboupsy reste un bon choix si votre besoin principal est la <strong>rédaction de bilans
                et comptes-rendus</strong> avec des trames très personnalisables. Les graphes automatisés
                de cotation sont aussi un plus spécifique.
              </p>
              <p>
                Si vous cherchez un <strong>outil complet</strong> qui gère votre cabinet de A à Z — agenda,
                RDV en ligne, visio, notes, IA, comptabilité, portail patient — dans un seul abonnement
                conforme HDS, PsyLib est la solution.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Tout votre cabinet dans un seul outil
            </h2>
            <p className="text-sage-100 text-lg">
              Notes, agenda, visio, IA, comptabilité, portail patient. Commencez gratuitement.
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
