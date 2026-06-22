import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowRight, Shield, Brain, Video, Sparkles, CreditCard } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PsyLib vs Docorga — Comparaison logiciels psychologues 2026',
  description:
    'Comparatif détaillé PsyLib vs Docorga : fonctionnalités, tarifs, IA, visio, portail patient. Quel logiciel choisir pour votre cabinet de psychologue ?',
  openGraph: {
    title: 'PsyLib vs Docorga — Quel logiciel pour psychologue libéral ?',
    description: 'Comparaison complète PsyLib vs Docorga. IA clinique, visio intégrée, portail patient vs gestion de cabinet classique.',
    url: 'https://psylib.eu/comparaison/psylib-vs-docorga',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/comparaison/psylib-vs-docorga' },
  robots: { index: true, follow: true },
};

type FeatureStatus = 'yes' | 'no' | 'partial';

interface CompRow {
  feature: string;
  psylib: FeatureStatus;
  docorga: FeatureStatus;
}

const comparisonData: CompRow[] = [
  { feature: 'Plan gratuit fonctionnel', psylib: 'yes', docorga: 'partial' },
  { feature: 'Dossiers patients sécurisés', psylib: 'yes', docorga: 'yes' },
  { feature: 'Conformité HDS certifiée', psylib: 'yes', docorga: 'yes' },
  { feature: 'Chiffrement AES-256-GCM', psylib: 'yes', docorga: 'no' },
  { feature: 'Notes cliniques structurées (SOAP/DAP)', psylib: 'yes', docorga: 'no' },
  { feature: 'Templates TCC / psychodynamique', psylib: 'yes', docorga: 'no' },
  { feature: 'Outcome tracking (PHQ-9, GAD-7)', psylib: 'yes', docorga: 'no' },
  { feature: 'Résumé de séance par IA', psylib: 'yes', docorga: 'no' },
  { feature: 'Exercices thérapeutiques IA', psylib: 'yes', docorga: 'no' },
  { feature: 'Visio-consultation intégrée', psylib: 'yes', docorga: 'no' },
  { feature: 'Portail patient (mood, journal)', psylib: 'yes', docorga: 'no' },
  { feature: 'Prise de RDV en ligne', psylib: 'yes', docorga: 'yes' },
  { feature: 'Liste d\'attente', psylib: 'yes', docorga: 'yes' },
  { feature: 'Rappels SMS automatiques', psylib: 'no', docorga: 'yes' },
  { feature: 'Comptabilité intégrée', psylib: 'yes', docorga: 'yes' },
  { feature: 'Facturation PDF conforme', psylib: 'yes', docorga: 'yes' },
  { feature: 'Réseau professionnel entre psys', psylib: 'yes', docorga: 'no' },
  { feature: 'Multi-praticiens (cabinet)', psylib: 'yes', docorga: 'no' },
  { feature: 'Application mobile', psylib: 'yes', docorga: 'no' },
  { feature: 'Export RGPD complet', psylib: 'yes', docorga: 'partial' },
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
    desc: 'Résumés de séance structurés, exercices thérapeutiques personnalisés. Docorga ne propose aucune fonctionnalité IA.',
  },
  {
    icon: Video,
    title: 'Visio-consultation intégrée',
    desc: 'Téléconsultation sécurisée HDS directement dans PsyLib. Individuelle, couple ou famille. Absente chez Docorga.',
  },
  {
    icon: Brain,
    title: 'Portail patient complet',
    desc: 'Suivi d\'humeur, journal de bord, exercices thérapeutiques. Vos patients ont leur propre espace. Inexistant chez Docorga.',
  },
  {
    icon: Shield,
    title: 'Chiffrement applicatif',
    desc: 'Au-delà du HDS, chaque note clinique est chiffrée AES-256-GCM côté serveur. Double protection des données.',
  },
  {
    icon: CreditCard,
    title: 'Tarifs plus accessibles',
    desc: 'Plan gratuit complet puis 25€/mois. Docorga facture 54,90€/mois pour toutes les fonctionnalités payantes.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PsyLib vs Docorga — Comparaison logiciels psychologues',
  description: 'Comparatif détaillé PsyLib vs Docorga pour psychologues libéraux.',
  url: 'https://psylib.eu/comparaison/psylib-vs-docorga',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Comparaison', item: 'https://psylib.eu/comparaison' },
      { '@type': 'ListItem', position: 3, name: 'PsyLib vs Docorga', item: 'https://psylib.eu/comparaison/psylib-vs-docorga' },
    ],
  },
};

export default function PsyLibVsDocorgaPage() {
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
            PsyLib vs Docorga
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            Docorga est un bon outil de gestion de cabinet. PsyLib va plus loin avec l&apos;IA clinique,
            la visio intégrée et un portail patient complet — pour un tarif plus bas.
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
              <p className="text-sm text-charcoal-400">Plan Free gratuit pour toujours, puis Solo à 25€/mois</p>
            </div>
            <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-charcoal-100 flex items-center justify-center">
                  <span className="font-bold text-charcoal-400 text-sm">D</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Docorga</h3>
                  <p className="text-xs text-charcoal-300">docorga.com</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-charcoal mb-1">0€ <span className="text-base font-normal text-charcoal-400">→ 54,90€/mois</span></div>
              <p className="text-sm text-charcoal-400">Plan gratuit limité (agenda invisible), puis 54,90€/mois tout compris</p>
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
                      <div className="font-medium text-charcoal-400">Docorga</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-5 text-charcoal font-medium">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.psylib} /></td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.docorga} /></td>
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
              Docorga : un bon outil, mais limité
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Docorga est utilisé par plus de 1 500 psychologues en France. C&apos;est un outil solide pour la gestion de cabinet :
                agenda, prise de rendez-vous en ligne, liste d&apos;attente, comptabilité. La conformité HDS est assurée et le support
                est réactif.
              </p>
              <p>
                <strong>Mais Docorga s&apos;arrête à la gestion administrative.</strong> Pas d&apos;IA pour vous aider à rédiger
                vos notes de séance. Pas de visio-consultation intégrée. Pas de portail patient avec suivi d&apos;humeur
                et exercices thérapeutiques. Pas de réseau professionnel entre confrères.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib : la gestion de cabinet + la pratique clinique
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                PsyLib couvre tout ce que fait Docorga (dossiers, RDV, comptabilité, facturation) et ajoute une dimension
                clinique : <strong>notes structurées</strong> avec templates TCC/psychodynamique, <strong>outcome tracking</strong> (PHQ-9, GAD-7),
                <strong> résumés IA</strong> de séance, et un <strong>portail patient</strong> complet.
              </p>
              <p>
                La visio-consultation est intégrée nativement — individuelle, couple ou famille — hébergée sur infrastructure
                HDS. Pas besoin d&apos;un outil tiers comme Zoom ou Google Meet.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Un tarif presque deux fois moins cher
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Docorga facture <strong>54,90€/mois</strong> pour accéder aux fonctionnalités payantes (RDV en ligne, rappels SMS, comptabilité).
                Le plan gratuit ne permet pas aux patients de voir votre agenda.
              </p>
              <p>
                PsyLib propose un <strong>plan Free vraiment fonctionnel</strong> (10 patients, sessions illimitées, comptabilité incluse),
                puis un plan Solo à <strong>25€/mois</strong>, et Pro à <strong>40€/mois</strong> avec l&apos;IA illimitée et la visio.
                Plus de fonctionnalités, pour moins cher.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Quand choisir Docorga ?
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Docorga reste un bon choix si vous avez uniquement besoin d&apos;un agenda en ligne avec rappels SMS
                et d&apos;une comptabilité simple. Leur fonctionnalité de liste d&apos;attente est aussi bien développée,
                avec priorisation dynamique.
              </p>
              <p>
                En revanche, si vous cherchez un outil qui <strong>accompagne votre pratique clinique</strong> au quotidien
                — notes structurées, aide IA, portail patient, visio — PsyLib est conçu pour ça.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Passez de la gestion administrative à la gestion clinique
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
