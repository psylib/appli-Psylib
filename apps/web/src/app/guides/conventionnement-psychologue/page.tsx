import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Conventionnement psychologue : Mon Soutien Psy et dispositifs 2026 | PsyLib',
  description:
    'Tout savoir sur le conventionnement des psychologues libéraux en France : dispositif Mon Soutien Psy, tarifs conventionnés, adhésion et gestion administrative avec PsyLib.',
  keywords: ['conventionnement psychologue', 'Mon Soutien Psy', 'Mon Psy psychologue', 'remboursement séance psy conventionné'],
  alternates: { canonical: 'https://psylib.eu/guides/conventionnement-psychologue' },
  openGraph: {
    title: 'Conventionnement psychologue : Mon Soutien Psy et dispositifs 2026',
    description: 'Mon Soutien Psy, tarifs, adhésion et gestion des séances conventionnées pour les psys libéraux.',
    url: 'https://psylib.eu/guides/conventionnement-psychologue',
    type: 'article',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'Article',
      headline: 'Conventionnement psychologue : Mon Soutien Psy et dispositifs 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/conventionnement-psychologue' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Qu\'est-ce que le dispositif Mon Soutien Psy ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Mon Soutien Psy (anciennement Mon Psy) est un dispositif permettant à des patients souffrant de troubles psychiques légers à modérés d\'accéder à 8 séances chez un psychologue libéral remboursées par l\'Assurance Maladie, sur prescription du médecin traitant. Le tarif conventionné est de 50 euros par séance, dont 40 euros remboursés par l\'AM et 10 euros à la charge du patient (ou de sa mutuelle).' },
        },
        {
          '@type': 'Question',
          name: 'Comment adhérer au dispositif Mon Soutien Psy ?',
          acceptedAnswer: { '@type': 'Answer', text: 'L\'adhésion se fait via le site de l\'Assurance Maladie (ameli.fr) en complétant un dossier avec vos justificatifs de diplôme (master 2 psychologie), votre numéro ADELI et votre RIB professionnel. L\'adhésion est volontaire et peut être résiliée à tout moment. Une formation de quelques heures sur le dispositif est proposée lors de l\'inscription.' },
        },
        {
          '@type': 'Question',
          name: 'Est-il rentable pour un psychologue d\'adhérer à Mon Soutien Psy ?',
          acceptedAnswer: { '@type': 'Answer', text: 'C\'est un calcul à effectuer individuellement. Le tarif de 50 euros est inférieur aux honoraires libres moyens (70-120 euros). En revanche, Mon Soutien Psy apporte un flux de patients supplémentaires, notamment des profils qui n\'auraient pas consulté sans remboursement. La décision dépend de votre taux d\'occupation, de votre positionnement tarifaire et de votre patientèle cible.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Conventionnement psychologue', item: 'https://psylib.eu/guides/conventionnement-psychologue' },
      ],
    },
  ],
};

export default function PageConventionnement() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Conventionnement psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide administratif — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Conventionnement psychologue : Mon Soutien Psy et dispositifs 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Adhésion, tarifs, avantages et gestion administrative des séances conventionnées.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Depuis le lancement de Mon Psy en 2022 (devenu Mon Soutien Psy en 2024), le paysage
            du remboursement des soins psychologiques en France a profondément évolué. Bien que
            le dispositif reste limité (8 séances/an à un tarif inférieur aux honoraires habituels),
            il constitue une opportunité de développement pour de nombreux praticiens libéraux.
            Ce guide détaille les modalités pratiques et financières de l&apos;adhésion.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Fonctionnement du dispositif</h2>
          <div className="space-y-3">
            {[
              { step: '1', text: 'Le médecin traitant prescrit jusqu\'à 8 séances de psychologie pour un patient présentant des troubles légers à modérés (score PHQ-9 ou GAD-7 entre 5 et 19).' },
              { step: '2', text: 'Le patient choisit un psychologue adhérent au dispositif dans l\'annuaire Mon Soutien Psy.' },
              { step: '3', text: 'Les séances sont facturées 50 euros. Le praticien télétransmet la feuille de soins à l\'Assurance Maladie qui rembourse 40 euros directement au patient (ou au praticien si tiers-payant).' },
              { step: '4', text: 'Le praticien adresse un compte-rendu au médecin prescripteur à l\'issue du suivi.' },
            ].map((item) => (
              <div key={item.step} className="flex gap-4 rounded-xl border border-gray-200 p-4">
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-[#3D52A0] text-sm font-bold text-white">{item.step}</span>
                <p className="text-gray-700">{item.text}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Gérer les séances MSP avec PsyLib</h2>
          <p className="mb-4 leading-relaxed">
            PsyLib permet de gérer en parallèle des séances au tarif libre et des séances Mon Soutien Psy.
            Pour chaque patient MSP, le tarif est automatiquement paramétré à 50 euros. La note
            d&apos;honoraires inclut les mentions spécifiques au dispositif. Le tableau de bord affiche
            séparément les recettes libres et conventionnées pour une analyse financière précise.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Gérez vos séances MSP et libres dans PsyLib</h2>
          <p className="mb-6 text-white/80">Double tarification, facturation automatique, tableau de bord financier. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Peut-on pratiquer le tiers-payant dans le cadre de Mon Soutien Psy ?", a: "Oui. Dans le cadre de Mon Soutien Psy, le praticien peut pratiquer le tiers-payant partiel (l'AM rembourse 40 euros directement au praticien, le patient ne paie que 10 euros) ou le tiers-payant intégral si la mutuelle du patient couvre les 10 euros restants. Les modalités sont choisies lors de l'adhésion au dispositif." },
              { q: "Y a-t-il une limite au nombre de patients MSP qu'on peut suivre ?", a: "Non, il n'y a pas de quota de patients MSP. Cependant, chaque patient ne peut bénéficier que de 8 séances par an dans ce cadre. Si le suivi doit se poursuivre au-delà, il passe au tarif libre ou fait l'objet d'une nouvelle prescription annuelle." },
              { q: "Comment sont transmises les feuilles de soins pour Mon Soutien Psy ?", a: "La transmission se fait via la carte Vitale du patient et le système de télétransmission SESAM-Vitale. Les psychologues adhérents au dispositif reçoivent un lecteur de carte Vitale et accèdent au logiciel de facturation dédié. PsyLib s'interface avec ce système pour automatiser la facturation MSP." },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}<Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link></p>
        </footer>
      </article>
    </>
  );
}
