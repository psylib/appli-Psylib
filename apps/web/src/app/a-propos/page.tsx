import type { Metadata } from 'next';
import Link from 'next/link';
import {
  ArrowRight,
  Shield,
  Heart,
  Lock,
  Compass,
  MessageCircle,
  Download,
  MapPin,
} from 'lucide-react';
import { LandingNav } from '@/components/landing/landing-nav';
import { LandingFooter } from '@/components/landing/landing-footer';

export const metadata: Metadata = {
  title: 'À propos de PsyLib — Qui est derrière votre logiciel de cabinet',
  description:
    "Derrière PsyLib, une personne et une conviction : un outil souverain, conforme HDS et hébergé en France, conçu pour les psychologues libéraux. Indépendant, sans investisseurs, accessible directement par son fondateur.",
  openGraph: {
    title: 'À propos de PsyLib — Un logiciel à visage humain',
    description:
      "L'histoire et les engagements derrière PsyLib : souveraineté des données de santé, prix juste, indépendance et continuité de service.",
    url: 'https://psylib.eu/a-propos',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  alternates: { canonical: 'https://psylib.eu/a-propos' },
  robots: { index: true, follow: true },
};

const valeurs = [
  {
    icon: Lock,
    title: 'Souveraineté des données',
    desc: "Les données de vos patients sont des données de santé. Elles restent en France, chez un hébergeur certifié HDS, chiffrées en AES-256-GCM. Jamais sur un cloud américain, jamais revendues, jamais utilisées pour entraîner une IA.",
  },
  {
    icon: Heart,
    title: 'Un prix juste',
    desc: "Un plan gratuit réellement utilisable, et des offres entre 25€ et 40€/mois — là où d'autres facturent plus de 100€. PsyLib doit rester accessible à un psychologue qui démarre comme à un cabinet installé.",
  },
  {
    icon: Compass,
    title: 'Indépendance',
    desc: "Pas d'investisseurs à rembourser, pas de fonds qui dicte la feuille de route. PsyLib avance au rythme de ses utilisateurs, pas d'une logique de revente à court terme.",
  },
  {
    icon: MessageCircle,
    title: 'Proximité',
    desc: "Quand vous écrivez à PsyLib, vous parlez à la personne qui développe l'outil. Vos retours façonnent directement les prochaines fonctionnalités.",
  },
];

const engagements = [
  {
    icon: Download,
    title: 'Vos données sont les vôtres',
    desc: "À tout moment, vous exportez l'intégralité de vos dossiers (patients, séances, factures, comptabilité). Aucune donnée n'est retenue en otage : la réversibilité est un droit, pas une option payante.",
  },
  {
    icon: Shield,
    title: 'Une infrastructure qui ne tient pas à une seule personne',
    desc: "L'hébergement, les sauvegardes chiffrées et le plan de reprise d'activité sont assurés par AZNetwork, hébergeur certifié HDS, sur deux datacenters français. La continuité de vos données ne repose pas sur un individu.",
  },
  {
    icon: Heart,
    title: 'Un engagement de transparence',
    desc: "En cas de changement majeur (évolution de l'offre, transmission de l'activité), les utilisateurs sont prévenus à l'avance, avec la possibilité d'exporter leurs données sereinement.",
  },
];

const jsonLd = {
  '@context': 'https://schema.org',
  '@type': 'AboutPage',
  name: 'À propos de PsyLib',
  description:
    "L'histoire et les engagements derrière PsyLib, logiciel de gestion pour psychologues libéraux.",
  url: 'https://psylib.eu/a-propos',
  mainEntity: {
    '@type': 'Organization',
    name: 'PsyLib',
    url: 'https://psylib.eu',
    description:
      'Logiciel tout-en-un pour psychologues libéraux : agenda, notes cliniques, IA, visio, comptabilité — hébergé en France, conforme HDS.',
    founder: {
      '@type': 'Person',
      name: 'Tony Ruppel',
    },
    foundingLocation: {
      '@type': 'Place',
      name: 'Nancy, France',
    },
  },
  breadcrumb: {
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
      { '@type': 'ListItem', position: 2, name: 'À propos', item: 'https://psylib.eu/a-propos' },
    ],
  },
};

export default function AProposPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />

      <main className="pt-24 pb-16">
        {/* Hero */}
        <section className="max-w-3xl mx-auto px-6 text-center mb-16">
          <p className="text-sage font-medium text-sm mb-3">À propos</p>
          <h1 className="font-playfair text-3xl md:text-5xl font-bold text-charcoal leading-tight mb-6">
            Derrière PsyLib, une personne.<br className="hidden md:block" /> Pas un fonds d&apos;investissement.
          </h1>
          <p className="text-charcoal-400 text-lg max-w-2xl mx-auto">
            PsyLib n&apos;est pas le projet d&apos;une grande entreprise de la tech. C&apos;est un outil
            indépendant, construit en France, avec une conviction simple : les psychologues méritent un
            logiciel pensé pour leur pratique — et leurs patients méritent que leurs données restent protégées.
          </p>
        </section>

        {/* Histoire — le pourquoi */}
        <section className="max-w-3xl mx-auto px-6 mb-20">
          <div className="rounded-2xl border border-cream-200 bg-white p-8 md:p-10 shadow-sm">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-sage/10 flex items-center justify-center shrink-0">
                <span className="font-playfair font-bold text-sage text-xl">TR</span>
              </div>
              <div>
                <p className="font-semibold text-charcoal">Tony Ruppel</p>
                <p className="text-sm text-charcoal-400 flex items-center gap-1.5">
                  <MapPin size={13} /> Fondateur de PsyLib · Nancy, France
                </p>
              </div>
            </div>

            <div className="prose prose-charcoal text-charcoal-500 space-y-4 leading-relaxed">
              <p>
                PsyLib est né à la maison. <strong>Ma compagne est psychologue</strong>, et je l&apos;ai vue,
                soir après soir, jongler entre un agenda en ligne, un tableur pour sa comptabilité, des notes
                éparpillées et des outils qui n&apos;avaient jamais été pensés pour des
                <strong> données de santé</strong>. Beaucoup de temps passé sur l&apos;administratif — du temps
                qui n&apos;appartient pas à son métier, qui est d&apos;abord d&apos;écouter et d&apos;accompagner.
              </p>
              <p>
                J&apos;ai cherché l&apos;outil qui lui aurait simplifié la vie. Je ne l&apos;ai pas trouvé : soit
                trop cher, soit incomplet, soit hébergé à l&apos;autre bout du monde sur les données les plus
                sensibles qui soient. Alors je l&apos;ai construit pour elle — puis pour ses consœurs et confrères.
              </p>
              <p>
                PsyLib réunit tout dans un seul outil, simple et respectueux : l&apos;agenda, les notes cliniques
                structurées, la facturation, la comptabilité prête pour la 2035, la visio, un espace patient — et
                une assistance par IA qui aide sans jamais décider à la place du praticien.
              </p>
              <p>
                Le fil rouge, depuis le premier jour, c&apos;est la <strong>confiance</strong> : héberger les
                données en France chez un hébergeur certifié HDS, les chiffrer, ne jamais les exploiter à
                d&apos;autres fins. Un cabinet, c&apos;est de l&apos;intime. L&apos;outil qui le gère doit être à
                la hauteur de cette responsabilité.
              </p>
            </div>
          </div>
        </section>

        {/* Valeurs */}
        <section className="bg-cream/50 py-16">
          <div className="max-w-5xl mx-auto px-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-charcoal text-center mb-12">
              Ce en quoi je crois
            </h2>
            <div className="grid md:grid-cols-2 gap-6">
              {valeurs.map((v) => (
                <div
                  key={v.title}
                  className="bg-white rounded-xl p-6 shadow-sm border border-cream-200"
                >
                  <div className="w-10 h-10 rounded-lg bg-sage/10 flex items-center justify-center mb-4">
                    <v.icon size={20} className="text-sage" />
                  </div>
                  <h3 className="font-semibold text-charcoal mb-2">{v.title}</h3>
                  <p className="text-sm text-charcoal-400 leading-relaxed">{v.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Engagement de continuité */}
        <section className="max-w-5xl mx-auto px-6 py-16">
          <div className="text-center mb-12 max-w-2xl mx-auto">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-charcoal mb-4">
              « Et si vous arrêtiez ? » — notre engagement de continuité
            </h2>
            <p className="text-charcoal-400">
              C&apos;est une question légitime quand on confie son cabinet à un outil indépendant. Voici
              comment PsyLib y répond concrètement.
            </p>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {engagements.map((e) => (
              <div
                key={e.title}
                className="bg-white rounded-xl p-6 shadow-sm border border-cream-200"
              >
                <div className="w-10 h-10 rounded-lg bg-terracotta/10 flex items-center justify-center mb-4">
                  <e.icon size={20} className="text-terracotta" />
                </div>
                <h3 className="font-semibold text-charcoal mb-2">{e.title}</h3>
                <p className="text-sm text-charcoal-400 leading-relaxed">{e.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Contact direct */}
        <section className="max-w-3xl mx-auto px-6 mb-8">
          <div className="rounded-2xl bg-cream/60 border border-cream-200 p-8 text-center">
            <h2 className="font-playfair text-xl md:text-2xl font-bold text-charcoal mb-3">
              Une question ? Écrivez-moi directement.
            </h2>
            <p className="text-charcoal-400 mb-5">
              Pas de centre d&apos;appel, pas de ticket anonyme. Vos messages arrivent directement à la
              personne qui construit PsyLib.
            </p>
            <a
              href="mailto:tony@psylib.eu"
              className="inline-flex items-center gap-2 text-sage font-medium hover:text-sage-600 transition-colors"
            >
              <MessageCircle size={18} />
              tony@psylib.eu
            </a>
          </div>
        </section>

        {/* CTA */}
        <section className="bg-sage py-16 mt-8">
          <div className="max-w-2xl mx-auto px-6 text-center space-y-6">
            <h2 className="font-playfair text-2xl md:text-3xl font-bold text-white">
              Essayez l&apos;outil, pas la promesse
            </h2>
            <p className="text-sage-100 text-lg">
              Commencez gratuitement. 10 patients inclus. Sans carte bancaire.
            </p>
            <Link
              href="/register"
              className="inline-flex items-center gap-2 px-8 py-4 rounded-full bg-terracotta text-white font-medium hover:bg-terracotta-600 transition-colors shadow-sm"
            >
              Créer mon compte gratuit
              <ArrowRight size={18} />
            </Link>
          </div>
        </section>
      </main>

      <LandingFooter />
    </>
  );
}
