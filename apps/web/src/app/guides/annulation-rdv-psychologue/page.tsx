import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Politique d\'annulation chez le psychologue libéral : règles et bonnes pratiques 2026 | PsyLib',
  description:
    'Comment mettre en place une politique d\'annulation de rendez-vous dans un cabinet de psychologue ? Délais, facturation des séances non honorées et communication avec les patients.',
  keywords: ['annulation rdv psychologue', 'politique annulation psychologue', 'séance non honorée psychologue', 'facturer séance annulée psy'],
  alternates: { canonical: 'https://psylib.eu/guides/annulation-rdv-psychologue' },
  openGraph: {
    title: 'Politique d\'annulation chez le psychologue libéral : règles et bonnes pratiques 2026',
    description: 'Délais, facturation des séances non honorées et communication avec les patients.',
    url: 'https://psylib.eu/guides/annulation-rdv-psychologue',
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
      headline: 'Politique d\'annulation chez le psychologue libéral : règles et bonnes pratiques 2026',
      datePublished: '2026-03-18',
      dateModified: '2026-03-18',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: { '@type': 'WebPage', '@id': 'https://psylib.eu/guides/annulation-rdv-psychologue' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Un psychologue peut-il facturer une séance non honorée ou annulée ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Oui, sous conditions. Un psychologue libéral peut facturer une séance annulée tardivement ou non honorée (no-show), à condition que cette politique soit communiquée au patient avant la première consultation et qu\'il l\'ait acceptée. La plupart des praticiens appliquent un délai de 24 à 48 heures : au-delà, la séance est facturée en tout ou partie.' },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la politique d\'annulation recommandée pour un psychologue ?',
          acceptedAnswer: { '@type': 'Answer', text: 'La politique la plus répandue est : annulation sans frais si le patient prévient 24 à 48 heures à l\'avance, séance facturée à 50 % ou 100 % en cas d\'annulation tardive ou de no-show. Cette politique doit être mentionnée dans un document d\'information remis au premier rendez-vous et accessible sur le profil PsyLib du praticien.' },
        },
        {
          '@type': 'Question',
          name: 'Comment gérer les rappels de rendez-vous pour réduire les no-shows ?',
          acceptedAnswer: { '@type': 'Answer', text: 'Les rappels automatiques par SMS ou email réduisent les no-shows de 30 à 50 % selon les études. PsyLib envoie automatiquement des rappels de rendez-vous par email 24 ou 48 heures avant la séance. Le patient peut confirmer ou annuler directement depuis le lien de rappel, ce qui met automatiquement à jour l\'agenda du praticien.' },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        { '@type': 'ListItem', position: 3, name: 'Annulation RDV psychologue', item: 'https://psylib.eu/guides/annulation-rdv-psychologue' },
      ],
    },
  ],
};

export default function PageAnnulationRdv() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Annulation RDV psychologue</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide pratique — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Politique d&apos;annulation chez le psychologue libéral : règles et bonnes pratiques
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Comment cadrer les annulations, facturer les séances non honorées et réduire les no-shows.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Les annulations de dernière minute et les no-shows représentent une perte financière
            significative pour les psychologues libéraux. Une heure non facturée est une heure
            de travail perdue, difficile à récupérer. Pourtant, mettre en place une politique
            d&apos;annulation claire relève autant de la gestion du cadre thérapeutique que de
            la bonne gestion d&apos;un cabinet. Ce guide vous donne les bases pour cadrer ce
            sujet avec vos patients.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Cadre légal et déontologique</h2>
          <p className="mb-4 leading-relaxed">
            Il n&apos;existe pas de réglementation nationale spécifique sur les frais d&apos;annulation
            pour les psychologues libéraux. La liberté contractuelle permet à chaque praticien
            de définir sa politique, à condition qu&apos;elle soit portée à la connaissance du
            patient avant le début du suivi. Pour être légalement opposable, elle doit être
            communiquée par écrit (fiche d&apos;information remise au premier RDV, mention sur
            le profil PsyLib, contrat thérapeutique).
          </p>
          <p className="mb-4 leading-relaxed">
            Sur le plan déontologique, la facturation d&apos;une séance non réalisée doit être
            maniée avec prudence. Certains auteurs (notamment d&apos;orientation psychanalytique)
            la voient comme un outil du cadre thérapeutique. D&apos;autres la considèrent comme
            une contrainte purement commerciale. La cohérence et la communication transparente
            sont les maîtres mots.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">Politique recommandée et communication</h2>
          <p className="mb-4 leading-relaxed">
            La politique la plus équilibrée et la plus répandue en France est :
          </p>
          <div className="rounded-xl border border-[#3D52A0]/30 bg-[#F1F0F9] p-5">
            <p className="font-semibold text-[#1E1B4B]">Exemple de politique d&apos;annulation</p>
            <p className="mt-2 text-gray-700">
              &quot;Toute annulation doit être notifiée au moins 48h avant la séance. En cas
              d&apos;annulation tardive (moins de 48h) ou d&apos;absence sans prévenir, la séance
              sera facturée à [X€]. Cette politique ne s&apos;applique pas en cas d&apos;urgence
              médicale dûment justifiée.&quot;
            </p>
          </div>
          <p className="mt-4 leading-relaxed">
            PsyLib envoie des rappels de rendez-vous automatiques avec lien de confirmation/annulation.
            Si le patient annule via ce lien, l&apos;agenda est mis à jour automatiquement et
            le créneau libéré pour un autre patient.
          </p>
        </section>

        <section className="mb-10 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Rappels automatiques avec PsyLib</h2>
          <p className="mb-6 text-white/80">Emails de rappel, confirmation en ligne, agenda mis à jour automatiquement. 14 jours gratuits.</p>
          <Link href="/login" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Essayer PsyLib gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: "Peut-on facturer une séance annulée pour raisons médicales ?", a: "Par principe, une annulation pour raison médicale justifiée (hospitalisation, accident) ne devrait pas être facturée. Cependant, si le patient présente fréquemment des annulations avec des justificatifs, il peut être utile d'en explorer la signification clinique dans le cadre de la thérapie, plutôt que de se limiter à la gestion administrative." },
              { q: "Comment gérer un patient qui annule régulièrement à la dernière minute ?", a: "Les annulations répétées ont souvent une signification clinique (ambivalence thérapeutique, résistance, anxiété de performance). Il est recommandé d'aborder ce comportement directement en séance, dans un esprit d'exploration et non de réprimande, avant de systématiser la facturation. La politique d'annulation peut être rappelée dans ce contexte comme une limite du cadre." },
              { q: "PsyLib envoie-t-il des rappels automatiques de rendez-vous ?", a: "Oui. PsyLib envoie des rappels par email aux patients 24 ou 48 heures avant leur rendez-vous. Ces emails incluent un lien pour confirmer, annuler ou demander un report. En cas d'annulation via ce lien, l'agenda du praticien est automatiquement mis à jour et une notification lui est envoyée, lui permettant de proposer ce créneau à un autre patient." },
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
