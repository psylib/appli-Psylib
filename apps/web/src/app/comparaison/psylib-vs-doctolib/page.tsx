import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowRight, Shield, Brain, Video, Sparkles, CreditCard, FileText } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PsyLib vs Doctolib — Alternative pour psychologue libéral 2026',
  description:
    'Comparatif PsyLib vs Doctolib pour psychologues libéraux : prix, IA clinique, notes de séance, comptabilité, visio. Doctolib est une vitrine, PsyLib votre cabinet complet — à partir de 0€.',
  openGraph: {
    title: 'PsyLib vs Doctolib — Quelle alternative pour psychologue libéral ?',
    description: 'Comparaison complète PsyLib vs Doctolib. Gestion clinique, IA, comptabilité et visio intégrée vs prise de RDV et visibilité.',
    url: 'https://psylib.eu/comparaison/psylib-vs-doctolib',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/comparaison/psylib-vs-doctolib' },
  robots: { index: true, follow: true },
};

type FeatureStatus = 'yes' | 'no' | 'partial';

interface CompRow {
  feature: string;
  psylib: FeatureStatus;
  doctolib: FeatureStatus;
}

const comparisonData: CompRow[] = [
  { feature: 'Plan gratuit fonctionnel', psylib: 'yes', doctolib: 'no' },
  { feature: 'Prise de RDV en ligne', psylib: 'yes', doctolib: 'yes' },
  { feature: 'Annuaire patients / visibilité', psylib: 'no', doctolib: 'yes' },
  { feature: 'Hébergement de santé HDS (France)', psylib: 'yes', doctolib: 'yes' },
  { feature: 'Chiffrement applicatif AES-256-GCM', psylib: 'yes', doctolib: 'no' },
  { feature: 'Notes cliniques structurées (SOAP/DAP)', psylib: 'yes', doctolib: 'no' },
  { feature: 'Templates TCC / psychodynamique', psylib: 'yes', doctolib: 'no' },
  { feature: 'Outcome tracking (PHQ-9, GAD-7)', psylib: 'yes', doctolib: 'no' },
  { feature: 'Résumé de séance par IA', psylib: 'yes', doctolib: 'no' },
  { feature: 'Transcription audio (AI Scribe)', psylib: 'yes', doctolib: 'no' },
  { feature: 'Exercices thérapeutiques IA', psylib: 'yes', doctolib: 'no' },
  { feature: 'Visio-consultation intégrée', psylib: 'yes', doctolib: 'partial' },
  { feature: 'Portail patient (mood, journal)', psylib: 'yes', doctolib: 'no' },
  { feature: 'Comptabilité intégrée (FEC)', psylib: 'yes', doctolib: 'no' },
  { feature: 'Facturation PDF conforme', psylib: 'yes', doctolib: 'partial' },
  { feature: 'Réseau professionnel entre psys', psylib: 'yes', doctolib: 'no' },
  { feature: 'Application mobile', psylib: 'yes', doctolib: 'yes' },
  { feature: 'Tarif à partir de', psylib: 'yes', doctolib: 'no' },
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
    desc: 'Résumés de séance structurés, transcription audio (Scribe), exercices personnalisés. Doctolib ne propose aucune fonctionnalité IA pour la pratique.',
  },
  {
    icon: FileText,
    title: 'Notes & dossiers cliniques',
    desc: 'Templates TCC, psychodynamique, ACT et outcome tracking PHQ-9/GAD-7. Doctolib gère le RDV, pas le contenu de vos séances.',
  },
  {
    icon: Video,
    title: 'Visio + portail patient',
    desc: 'Téléconsultation HDS native et espace patient (humeur, journal, exercices). Vos patients vous suivent entre les séances.',
  },
  {
    icon: CreditCard,
    title: 'Comptabilité & facturation',
    desc: 'Comptabilité intégrée avec export FEC et facturation PDF conforme. Doctolib n\'est pas un outil de gestion de cabinet.',
  },
  {
    icon: Shield,
    title: '3 à 4× moins cher',
    desc: 'Plan Free gratuit puis 25-40€/mois. Doctolib facture autour de 129€/mois et met les praticiens en concurrence dans son annuaire.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'PsyLib vs Doctolib — Comparaison logiciels psychologues',
  description: 'Comparatif détaillé PsyLib vs Doctolib pour psychologues libéraux.',
  url: 'https://psylib.eu/comparaison/psylib-vs-doctolib',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Comparaison', item: 'https://psylib.eu/comparaison' },
      { '@type': 'ListItem', position: 3, name: 'PsyLib vs Doctolib', item: 'https://psylib.eu/comparaison/psylib-vs-doctolib' },
    ],
  },
};

export default function PsyLibVsDoctolibPage() {
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
            PsyLib vs Doctolib
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            Doctolib excelle pour la prise de rendez-vous et la visibilité en ligne. Mais ce n&apos;est pas
            un outil de gestion de cabinet. PsyLib gère votre pratique clinique complète — pour bien moins cher.
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
              <div className="text-3xl font-bold text-charcoal mb-1">0€ <span className="text-base font-normal text-charcoal-400">→ 25-40€/mois</span></div>
              <p className="text-sm text-charcoal-400">Plan Free gratuit, Solo 25€/mois, Pro 40€/mois avec IA et visio illimitées</p>
            </div>
            <div className="rounded-2xl border border-cream-200 bg-white p-6 shadow-sm">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 rounded-full bg-charcoal-100 flex items-center justify-center">
                  <span className="font-bold text-charcoal-400 text-sm">D</span>
                </div>
                <div>
                  <h3 className="font-semibold text-charcoal">Doctolib</h3>
                  <p className="text-xs text-charcoal-300">doctolib.fr</p>
                </div>
              </div>
              <div className="text-3xl font-bold text-charcoal mb-1">~129€<span className="text-base font-normal text-charcoal-400">/mois</span></div>
              <p className="text-sm text-charcoal-400">Abonnement praticien, sans plan gratuit. Prix non affiché publiquement.</p>
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
                      <div className="font-medium text-charcoal-400">Doctolib</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-5 text-charcoal font-medium">{row.feature}</td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.psylib} /></td>
                      <td className="py-3.5 px-6 text-center"><StatusIcon status={row.doctolib} /></td>
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
              Ce que PsyLib offre que Doctolib ne fait pas
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
              Doctolib : une vitrine, pas un cabinet
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Doctolib est le leader de la prise de rendez-vous médicale en France. Sa force est réelle :
                visibilité dans un annuaire fréquenté par des millions de patients, prise de RDV en ligne fluide,
                rappels automatiques. Pour <strong>se faire connaître et remplir son agenda</strong>, c&apos;est efficace.
              </p>
              <p>
                <strong>Mais Doctolib s&apos;arrête à la porte de votre cabinet.</strong> Une fois le patient en séance,
                l&apos;outil ne vous aide plus : pas de notes cliniques structurées, pas d&apos;aide IA à la rédaction,
                pas de suivi d&apos;humeur ni d&apos;exercices, pas de comptabilité. Et son annuaire vous place en
                concurrence directe avec les autres praticiens de votre ville.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib : tout votre cabinet dans un seul outil
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                PsyLib est conçu pour la <strong>pratique clinique du psychologue libéral</strong> : dossiers patients
                chiffrés, notes de séance structurées (templates TCC, psychodynamique, ACT), outcome tracking
                PHQ-9/GAD-7, résumés de séance et transcription audio par IA, exercices thérapeutiques.
              </p>
              <p>
                S&apos;ajoutent la <strong>visio-consultation intégrée</strong> (hébergée en France), un
                <strong> portail patient</strong> complet, la <strong>comptabilité avec export FEC</strong> et la
                facturation PDF conforme. Le tout hébergé en France chez un hébergeur certifié HDS, avec chiffrement
                AES-256-GCM applicatif sur chaque donnée sensible.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Le meilleur des deux : Doctolib + PsyLib
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Vous n&apos;avez pas forcément à choisir. Beaucoup de psychologues utilisent <strong>Doctolib comme
                vitrine</strong> pour être trouvés par de nouveaux patients, et <strong>PsyLib comme atelier</strong> pour
                gérer leur pratique au quotidien.
              </p>
              <p>
                La différence de coût parle d&apos;elle-même : là où Doctolib facture autour de 129€/mois,
                PsyLib démarre gratuitement et plafonne à 40€/mois pour l&apos;offre complète avec IA et visio illimitées.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              Quand choisir Doctolib seul ?
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Si votre priorité absolue est <strong>l&apos;acquisition de nouveaux patients</strong> via un annuaire
                grand public, et que vous n&apos;avez pas besoin d&apos;outils cliniques, Doctolib peut suffire.
              </p>
              <p>
                Mais si vous voulez <strong>structurer vos séances, gagner du temps administratif et suivre vos
                patients dans la durée</strong> — sans payer 129€/mois — PsyLib est fait pour votre pratique.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Un cabinet complet pour le prix d&apos;un café par semaine
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
