import type { Metadata } from 'next';
import Link from 'next/link';
import { CheckCircle2, XCircle, Minus, ArrowRight, Shield, Brain, Users, FileText, BarChart3 } from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'PsyLib vs alternatives — Comparaison logiciels psychologues',
  description:
    'Comparatif détaillé PsyLib vs Doctolib, Excel, Google Sheets, Hellocare pour psychologues libéraux. Fonctionnalités, conformité HDS, tarifs.',
  openGraph: {
    title: 'PsyLib vs alternatives — Quel logiciel pour psychologue libéral ?',
    description: 'Comparaison complète des solutions de gestion de cabinet pour psychologues. HDS, notes cliniques, outcome tracking.',
    url: 'https://psylib.eu/comparaison',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/comparaison' },
  robots: { index: true, follow: true },
};

type FeatureStatus = 'yes' | 'no' | 'partial' | 'na';

interface CompRow {
  feature: string;
  psylib: FeatureStatus;
  excel: FeatureStatus;
  doctolib: FeatureStatus;
  generique: FeatureStatus;
}

const comparisonData: CompRow[] = [
  { feature: 'Dossiers patients sécurisés', psylib: 'yes', excel: 'no', doctolib: 'partial', generique: 'partial' },
  { feature: 'Conformité HDS certifiée', psylib: 'yes', excel: 'no', doctolib: 'yes', generique: 'no' },
  { feature: 'Chiffrement AES-256-GCM', psylib: 'yes', excel: 'no', doctolib: 'na', generique: 'no' },
  { feature: 'Notes cliniques structurées (SOAP/DAP)', psylib: 'yes', excel: 'no', doctolib: 'no', generique: 'partial' },
  { feature: 'Templates notes TCC/psychodynamique', psylib: 'yes', excel: 'no', doctolib: 'no', generique: 'no' },
  { feature: 'Outcome tracking (PHQ-9, GAD-7)', psylib: 'yes', excel: 'partial', doctolib: 'no', generique: 'no' },
  { feature: 'Résumé de séance par IA', psylib: 'yes', excel: 'no', doctolib: 'no', generique: 'no' },
  { feature: 'Prise de RDV en ligne', psylib: 'yes', excel: 'no', doctolib: 'yes', generique: 'yes' },
  { feature: 'Facturation PDF conforme', psylib: 'yes', excel: 'partial', doctolib: 'no', generique: 'partial' },
  { feature: 'Espace patient (mood, exercices)', psylib: 'yes', excel: 'no', doctolib: 'no', generique: 'no' },
  { feature: 'Réseau professionnel entre psys', psylib: 'yes', excel: 'no', doctolib: 'no', generique: 'no' },
  { feature: 'Supervision / Intervision', psylib: 'yes', excel: 'no', doctolib: 'no', generique: 'no' },
  { feature: 'Analytics cabinet (revenus, patients)', psylib: 'yes', excel: 'partial', doctolib: 'partial', generique: 'partial' },
  { feature: 'Export RGPD complet', psylib: 'yes', excel: 'partial', doctolib: 'partial', generique: 'no' },
  { feature: 'Application mobile', psylib: 'yes', excel: 'partial', doctolib: 'yes', generique: 'yes' },
  { feature: 'Prix à partir de', psylib: 'yes', excel: 'yes', doctolib: 'partial', generique: 'partial' },
];

function StatusIcon({ status }: { status: FeatureStatus }) {
  switch (status) {
    case 'yes':
      return <CheckCircle2 size={18} className="text-emerald-500" />;
    case 'no':
      return <XCircle size={18} className="text-red-400" />;
    case 'partial':
      return <Minus size={18} className="text-amber-500" />;
    case 'na':
      return <span className="text-xs text-charcoal-300">N/A</span>;
  }
}

const advantages = [
  {
    icon: Shield,
    title: 'Conforme HDS de bout en bout',
    desc: 'Infrastructure certifiée HDS en France. Chiffrement AES-256-GCM sur chaque donnée clinique. Audit trail complet.',
  },
  {
    icon: Brain,
    title: 'Conçu pour la clinique',
    desc: 'Templates de notes TCC, psychodynamique, ACT. Outcome tracking PHQ-9/GAD-7/CORE-OM intégré. Pas un outil générique adapté.',
  },
  {
    icon: Users,
    title: 'Réseau professionnel',
    desc: 'Adressage, supervision, intervision entre confrères. Le seul outil qui connecte les psychologues entre eux.',
  },
  {
    icon: FileText,
    title: 'IA clinique responsable',
    desc: 'Résumés de séance structurés, exercices thérapeutiques personnalisés. Données jamais envoyées sans consentement.',
  },
  {
    icon: BarChart3,
    title: 'Tout-en-un sans compromis',
    desc: 'Dossiers, notes, RDV, facturation, analytics, espace patient — dans un seul outil. Fini les 5 logiciels différents.',
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'WebPage',
  name: 'Comparaison PsyLib vs alternatives',
  description: 'Comparatif détaillé des logiciels de gestion de cabinet pour psychologues libéraux.',
  url: 'https://psylib.eu/comparaison',
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'Comparaison', item: 'https://psylib.eu/comparaison' },
    ],
  },
};

export default function ComparaisonPage() {
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
          <p className="text-sage font-medium text-sm mb-3">Comparatif</p>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal leading-tight mb-6">
            PsyLib vs les alternatives
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            Excel, Doctolib, logiciels génériques... Pourquoi les psychologues libéraux méritent un outil conçu pour eux.
          </p>
        </section>

        {/* Comparison table */}
        <section className="max-w-5xl mx-auto px-6 mb-20">
          <div className="rounded-2xl border border-cream-200 overflow-hidden bg-white shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-cream/50">
                    <th className="text-left py-4 px-5 font-medium text-charcoal-400 min-w-[220px]">Fonctionnalité</th>
                    <th className="text-center py-4 px-4 min-w-[100px]">
                      <div className="font-semibold text-sage">PsyLib</div>
                      <div className="text-xs text-charcoal-300 mt-0.5">29,99€/mois</div>
                    </th>
                    <th className="text-center py-4 px-4 min-w-[100px]">
                      <div className="font-medium text-charcoal-400">Excel / Sheets</div>
                      <div className="text-xs text-charcoal-300 mt-0.5">Gratuit</div>
                    </th>
                    <th className="text-center py-4 px-4 min-w-[100px]">
                      <div className="font-medium text-charcoal-400">Doctolib</div>
                      <div className="text-xs text-charcoal-300 mt-0.5">~129€/mois</div>
                    </th>
                    <th className="text-center py-4 px-4 min-w-[100px]">
                      <div className="font-medium text-charcoal-400">Logiciel générique</div>
                      <div className="text-xs text-charcoal-300 mt-0.5">~50-100€/mois</div>
                    </th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-cream-100">
                  {comparisonData.map((row) => (
                    <tr key={row.feature} className="hover:bg-cream/30 transition-colors">
                      <td className="py-3.5 px-5 text-charcoal font-medium">{row.feature}</td>
                      <td className="py-3.5 px-4 text-center"><StatusIcon status={row.psylib} /></td>
                      <td className="py-3.5 px-4 text-center"><StatusIcon status={row.excel} /></td>
                      <td className="py-3.5 px-4 text-center"><StatusIcon status={row.doctolib} /></td>
                      <td className="py-3.5 px-4 text-center"><StatusIcon status={row.generique} /></td>
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

        {/* Why PsyLib */}
        <section className="bg-cream/50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-charcoal text-center mb-12">
              Ce qui rend PsyLib unique
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {advantages.map((adv) => (
                <div key={adv.title} className="bg-white rounded-xl p-6 shadow-sm border border-cream-200">
                  <div className="w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center mb-4">
                    <adv.icon size={20} className="text-sage" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{adv.title}</h3>
                  <p className="text-sm text-charcoal-400 leading-relaxed">{adv.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Detailed sections */}
        <section className="max-w-3xl mx-auto px-6 py-16 space-y-16">
          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib vs Excel / Google Sheets
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Beaucoup de psychologues commencent avec un tableur. C'est gratuit, flexible... mais pas adapté.
                Excel ne chiffre pas vos données patients, ne génère pas de factures conformes, et n'est pas certifié HDS.
              </p>
              <p>
                <strong>Risque légal :</strong> stocker des données de santé sur Google Drive ou OneDrive non-HDS
                expose à des sanctions CNIL pouvant aller jusqu'à 20 millions d'euros.
              </p>
              <p>
                PsyLib remplace votre tableur par un outil professionnel : dossiers structurés, notes cliniques
                avec templates, facturation automatique, et conformité HDS garantie.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib vs Doctolib
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Doctolib est excellent pour la prise de rendez-vous et la visibilité en ligne.
                Mais Doctolib n'est pas un outil de gestion de cabinet.
              </p>
              <p>
                <strong>Ce que Doctolib ne fait pas :</strong> notes cliniques structurées, outcome tracking
                (PHQ-9, GAD-7), résumés de séance IA, réseau professionnel entre psys, espace patient avec
                exercices thérapeutiques, supervision.
              </p>
              <p>
                <strong>PsyLib + Doctolib = le combo idéal.</strong> Doctolib est votre vitrine,
                PsyLib est votre atelier. Les deux sont complémentaires.
              </p>
            </div>
          </div>

          <div>
            <h2 className="font-playfair text-2xl font-bold text-charcoal mb-4">
              PsyLib vs logiciels génériques
            </h2>
            <div className="prose prose-charcoal text-charcoal-400">
              <p>
                Les CRM et logiciels médicaux génériques (Jane App, SimplePractice, etc.) sont conçus pour
                le marché américain ou pour tous les professionnels de santé sans distinction.
              </p>
              <p>
                <strong>Problèmes fréquents :</strong> pas de conformité HDS France, pas de templates cliniques
                adaptés à la psychologie, pas de numéro ADELI, facturation non conforme au droit français.
              </p>
              <p>
                PsyLib est pensé par et pour les psychologues libéraux français. Chaque fonctionnalité est
                conçue pour la pratique clinique en France, avec la conformité réglementaire intégrée.
              </p>
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Prêt à passer à un outil conçu pour vous ?
            </h2>
            <p className="text-sage-100 text-lg">
              14 jours gratuits. Sans carte bancaire. Sans engagement.
            </p>
            <Link
              href="/login"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-terracotta text-white font-medium hover:bg-terracotta-600 transition-colors shadow-sm"
            >
              Démarrer l'essai gratuit
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
