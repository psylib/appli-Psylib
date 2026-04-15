import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Psychologue en ligne : tout savoir sur la thérapie par visio en France | PsyLib',
  description:
    "Avantages et inconvénients de la thérapie en ligne, cadre éthique, outils conformes HDS, tarifs — guide complet pour les psychologues libéraux pratiquant la visio en France.",
  keywords: [
    'psychologue en ligne',
    'consultation psychologue visio',
    'thérapie en ligne France',
    'psy en ligne remboursement',
    'consultation psy visio légale',
    'psychologue téléconsultation France',
    'avantages inconvénients thérapie en ligne',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/psychologue-en-ligne-visio' },
  openGraph: {
    title: 'Psychologue en ligne : tout savoir sur la thérapie par visio en France',
    description:
      "Guide complet sur la pratique de la psychologie en ligne : avantages, limites, cadre éthique, outils conformes HDS et intégration avec PsyLib.",
    url: 'https://psylib.eu/guides/psychologue-en-ligne-visio',
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
      headline: 'Psychologue en ligne : tout savoir sur la thérapie par visio en France',
      datePublished: '2026-03-16',
      dateModified: '2026-03-16',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "La thérapie en ligne est-elle aussi efficace que la thérapie en présentiel ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les études scientifiques publiées depuis 2010 montrent une efficacité comparable de la thérapie cognitive en ligne et en présentiel pour les troubles anxieux et la dépression légère à modérée. Pour les troubles complexes (PTSD sévère, troubles de la personnalité, troubles dissociatifs), le cadre présentiel reste généralement préférable. L'alliance thérapeutique peut se construire de manière équivalente en visio dans la majorité des cas.",
          },
        },
        {
          '@type': 'Question',
          name: "Peut-on exercer uniquement en ligne comme psychologue libéral ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui, c'est légalement possible. Certains psychologues exercent à 100 % en visio, sans cabinet physique. Cette pratique est plus répandue dans les zones rurales ou pour les praticiens ayant un profil de spécialité (neuropsychologie, coaching, etc.). Elle nécessite un logiciel certifié HDS et une attention particulière aux contraintes d'accès des patients.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment trouver un psychologue qui pratique en ligne en France ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Via les annuaires professionnels : Doctolib (filtre visio disponible), annuaire ADELI, Psymatch, et l'annuaire PsyLib. Il est important de vérifier que le praticien est bien titulaire du titre de psychologue (numéro ADELI) et que l'outil visio utilisé est conforme HDS.",
          },
        },
        {
          '@type': 'Question',
          name: "Les séances de psychologue en ligne sont-elles remboursées ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui, dans les mêmes conditions que les séances en présentiel. Le dispositif Mon Soutien Psy s'applique également aux séances en visio sur prescription médicale. Certaines mutuelles remboursent les séances en ligne avec les mêmes modalités que le présentiel.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Psychologue en ligne visio',
          item: 'https://psylib.eu/guides/psychologue-en-ligne-visio',
        },
      ],
    },
  ],
};

export default function PagePsychoEnLigne() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Psychologue en ligne</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Psychologue en ligne : tout savoir sur la thérapie par visio en France
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Avantages, limites, cadre éthique, outils conformes HDS et tarifs — le guide complet
            pour les praticiens qui pratiquent ou envisagent la consultation en ligne.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La pratique de la psychologie en ligne a connu une croissance spectaculaire depuis
            2020. En France, on estime que plus de 40 % des psychologues libéraux proposent
            désormais au moins une partie de leurs consultations en visio. Cette évolution
            répond à une demande forte des patients — en particulier dans les zones sous-dotées —
            et à des contraintes pratiques (mobilité réduite, emploi du temps contraint,
            patients en télétravail). Pour les praticiens, la maîtrise des spécificités de
            la pratique en ligne est devenue une compétence incontournable.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Avantages de la thérapie en ligne pour le praticien
          </h2>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Élargissement de la zone de chalandise (patients en dehors de la ville)</li>
            <li>Réduction ou suppression des coûts de location du cabinet</li>
            <li>Meilleure gestion des créneaux (moins de temps mort entre les patients)</li>
            <li>Continuité des soins en cas d&apos;empêchement temporaire (déplacement, maladie légère)</li>
            <li>Accessibilité accrue pour les patients à mobilité réduite ou en zones rurales</li>
            <li>Meilleur équilibre vie pro/perso pour les praticiens qui préfèrent travailler depuis chez eux</li>
          </ul>

          <h2 className="mb-4 mt-8 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les limites et contre-indications cliniques
          </h2>
          <p className="mb-4 leading-relaxed">
            La thérapie en ligne n&apos;est pas une solution universelle. Certaines situations
            nécessitent impérativement un cadre présentiel :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Crises suicidaires actives ou états de détresse aiguë</li>
            <li>Troubles dissociatifs sévères nécessitant un ancrage physique</li>
            <li>Troubles psychotiques en phase aiguë</li>
            <li>Premiers entretiens avec des patients en grande souffrance</li>
            <li>Thérapies EMDR et ICV (certains protocoles nécessitent une présence physique)</li>
            <li>Patients sans accès stable à internet ou sans espace privé chez eux</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            La décision d&apos;effectuer une séance en présentiel ou en ligne doit être prise
            au cas par cas, en concertation avec le patient, avec une évaluation régulière de
            l&apos;adéquation du format à l&apos;état clinique.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Efficacité de la thérapie en ligne : ce que dit la recherche
          </h2>
          <p className="mb-4 leading-relaxed">
            La littérature scientifique sur la thérapie cognitive en ligne s&apos;est
            considérablement développée depuis 2010. Les méta-analyses disponibles montrent
            une efficacité comparable des thérapies TCC en ligne et en présentiel pour les
            troubles anxieux et la dépression légère à modérée. L&apos;alliance thérapeutique
            — facteur central des résultats thérapeutiques — se construit de manière équivalente
            en visio dans la majorité des cas.
          </p>
          <p className="mb-4 leading-relaxed">
            Des nuances existent cependant : certains patients rapportent une sensation de
            distance émotionnelle avec la thérapie en ligne, et les signaux non verbaux
            (posture, respiration, expressions corporelles) sont moins accessibles pour le
            thérapeute via une caméra. Ces limites méritent d&apos;être anticipées et
            discutées avec le patient.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Cadre éthique et bonnes pratiques
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le consentement éclairé
          </h3>
          <p className="mb-4 leading-relaxed">
            Avant la première séance en ligne, le praticien doit obtenir un consentement explicite
            du patient pour la pratique en visio. Ce consentement doit mentionner : les
            limites de la téléconsultation, les mesures de sécurité prises (outil conforme HDS),
            les conditions de recours au présentiel, et la politique de confidentialité du
            praticien (pas d&apos;enregistrement des séances sans accord mutuel).
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La vérification des conditions côté patient
          </h3>
          <p className="mb-4 leading-relaxed">
            En début de chaque séance à distance, il est recommandé de vérifier que le patient
            est seul, dans un espace privé, avec une connexion stable. Ces quelques secondes
            de vérification ritualisent le début de la séance et permettent de détecter
            d&apos;éventuels problèmes de cadre avant d&apos;entrer dans le travail clinique.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La gestion des crises à distance
          </h3>
          <p className="mb-4 leading-relaxed">
            Le praticien qui pratique en ligne doit anticiper la gestion des situations de
            crise : disposer du numéro de téléphone du patient et d&apos;un contact d&apos;urgence,
            connaître le SAMU / numéro de crise local du patient (variable selon la région
            ou le pays si suivi international), et avoir défini avec le patient un protocole
            de crise clair.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Pratiquer la psychologie en ligne avec PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib est conçu pour les psychologues qui pratiquent en présentiel, en ligne, ou
            dans un format hybride. L&apos;agenda intégré permet de distinguer les séances
            présentiel et visio. Les notes de séance, la facturation et le dossier patient
            fonctionnent de manière identique quel que soit le format.
          </p>
          <p className="mb-4 leading-relaxed">
            La messagerie sécurisée de PsyLib permet d&apos;envoyer le lien de connexion
            visio au patient via l&apos;espace patient, d&apos;échanger des documents entre
            les séances et de maintenir un lien thérapeutique inter-séances, le tout dans
            un environnement certifié HDS — sans passer par WhatsApp, Gmail ou d&apos;autres
            outils non conformes.
          </p>
          <p className="mb-4 leading-relaxed">
            Pour en savoir plus sur les aspects légaux et les outils visio conformes, consultez
            également notre guide sur la{' '}
            <Link href="/guides/teleconsultation-psychologue" className="text-[#3D52A0] hover:underline">
              téléconsultation pour les psychologues libéraux
            </Link>.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Agenda présentiel + visio, messagerie HDS, dossiers patients, facturation conforme.
            Sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "La thérapie en ligne est-elle aussi efficace que le présentiel ?",
                a: "Les méta-analyses montrent une efficacité comparable pour la TCC en ligne vs présentiel pour les troubles anxieux et la dépression légère. Pour les troubles complexes, le présentiel est généralement préférable.",
              },
              {
                q: "Peut-on exercer uniquement en ligne comme psychologue libéral ?",
                a: "Oui, c'est légalement possible. Certains praticiens exercent à 100 % en visio. Cela nécessite un logiciel certifié HDS et une attention aux contraintes d'accès des patients.",
              },
              {
                q: "Les séances en ligne sont-elles remboursées ?",
                a: "Oui, dans les mêmes conditions que le présentiel. Mon Soutien Psy s'applique aussi aux séances visio sur prescription. Certaines mutuelles remboursent les séances en ligne.",
              },
              {
                q: "Quelles situations contre-indiquent la thérapie en ligne ?",
                a: "Crises suicidaires actives, troubles dissociatifs sévères, troubles psychotiques en phase aiguë, premiers entretiens en grande détresse, patients sans espace privé stable.",
              },
              {
                q: "Comment PsyLib gère-t-il les séances en ligne ?",
                a: "PsyLib permet de distinguer séances présentiel et visio dans l'agenda. La messagerie sécurisée permet d'envoyer les liens de connexion. Tout est hébergé sur infrastructure certifiée HDS.",
              },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour à l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
