import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Agenda psychologue en ligne : pourquoi passer au numérique en 2026',
  description:
    "Agenda papier ou logiciel en ligne ? Rappels automatiques, conformité HDS, gain de temps : tout ce qu'un psychologue doit savoir avant de choisir son outil.",
  keywords: [
    'agenda psychologue en ligne',
    'agenda psy libéral',
    'prise de rendez-vous psychologue en ligne',
    'rappels automatiques rendez-vous psychologue',
    'agenda cabinet psychologue',
    'logiciel agenda psy',
    'no-show psychologue',
    'agenda conforme HDS psychologue',
    'calendrier psychologue numérique',
  ],
  alternates: {
    canonical: 'https://psylib.eu/blog/agenda-psychologue-en-ligne',
  },
  openGraph: {
    title: 'Agenda psychologue en ligne : pourquoi passer au numérique en 2026',
    description:
      "Agenda papier ou logiciel en ligne ? Rappels automatiques, conformité HDS, gain de temps : guide complet pour les psychologues libéraux.",
    url: 'https://psylib.eu/blog/agenda-psychologue-en-ligne',
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
      headline: 'Agenda psychologue en ligne : pourquoi passer au numérique en 2026',
      description:
        "Guide complet sur l'agenda psychologue en ligne : avantages, conformité HDS, rappels automatiques et économies réalisées.",
      datePublished: '2026-03-15',
      dateModified: '2026-03-15',
      author: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      publisher: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://psylib.eu/blog/agenda-psychologue-en-ligne',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Un agenda psychologue en ligne doit-il être certifié HDS ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les données de rendez-vous associées à l'identité d'un patient constituent des données de santé au sens de l'article L.1111-8 du Code de la santé publique. Leur hébergement doit impérativement être réalisé chez un prestataire certifié HDS. Utiliser un agenda grand public (Google Calendar, iCloud) expose le praticien à des sanctions CNIL.",
          },
        },
        {
          '@type': 'Question',
          name: "Les rappels automatiques réduisent-ils vraiment les no-shows ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les études montrent une réduction des rendez-vous non honorés de 30 à 50 % avec des rappels automatiques envoyés 24 à 48 heures avant la séance. Pour un cabinet pratiquant 65 euros la séance avec deux no-shows hebdomadaires, cela représente une économie potentielle de plus de 3 000 euros par an.",
          },
        },
        {
          '@type': 'Question',
          name: "Peut-on utiliser Google Calendar ou un agenda grand public comme psychologue ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Non. Google Calendar, iCloud et les agendas grand public ne sont pas certifiés HDS. Ils ne garantissent pas la conformité RGPD pour les données de santé et leurs serveurs peuvent se trouver hors de l'UE. Un psychologue libéral doit utiliser un outil certifié HDS pour la gestion de son planning patient.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://psylib.eu/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Agenda psychologue en ligne',
          item: 'https://psylib.eu/blog/agenda-psychologue-en-ligne',
        },
      ],
    },
  ],
};

export default function ArticleAgendaPsychologue() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Agenda psychologue en ligne</span>
        </nav>

        {/* En-tête */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Gestion administrative — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Agenda psychologue en ligne : pourquoi passer au numérique en 2026 ?
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Gain de temps, réduction des no-shows, conformité HDS — ce que l'agenda numérique
            apporte concrètement à un cabinet libéral.
          </p>
        </header>

        {/* Introduction */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Chaque semaine, un psychologue libéral consacre en moyenne deux à trois heures à
            la gestion téléphonique de son agenda. Confirmations, annulations, rappels manuels...
            Ces tâches s'accumulent entre les séances. S'y ajoutent les rendez-vous oubliés
            qui représentent 15 à 20 % du planning d'un cabinet non équipé de rappels
            automatiques.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les limites de l'agenda papier
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Temps téléphonique et interruptions de séance
          </h3>
          <p className="mb-4 leading-relaxed">
            L'agenda papier exige une présence téléphonique permanente. Un patient qui cherche
            à prendre rendez-vous en dehors des heures de bureau reçoit un répondeur. S'il ne
            rappelle pas, il consulte un autre praticien. Sur une semaine avec vingt nouveaux
            contacts, cela peut représenter jusqu'à deux heures de travail non rémunéré en
            rappels et confirmations.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le coût financier des rendez-vous non honorés
          </h3>
          <p className="mb-4 leading-relaxed">
            A 65 euros la séance, deux no-shows par semaine représentent 130 euros de manque
            à gagner, soit plus de 6 000 euros par an. Les rappels automatiques réduisent ce
            taux de 30 à 50 %. L'agenda numérique s'autofinance rapidement — souvent en moins
            d'un mois.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le risque de conformité légale
          </h3>
          <p className="mb-4 leading-relaxed">
            Un agenda papier stocké dans le cabinet n'est pas soumis aux mêmes obligations
            qu'un agenda numérique. Mais dès lors que le praticien utilise un outil en ligne
            pour gérer ses rendez-vous, les données de santé associées doivent être hébergées
            sur une infrastructure certifiée HDS. Utiliser Google Calendar ou un agenda grand
            public constitue une infraction aux obligations légales.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les avantages d'un agenda psychologue en ligne
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Prise de rendez-vous 24h/24
          </h3>
          <p className="mb-4 leading-relaxed">
            Avec un agenda en ligne, le patient choisit son créneau depuis une interface
            dédiée, à n'importe quelle heure. Le psychologue paramètre ses disponibilités une
            fois, et l'agenda se remplit de manière autonome. Les plages horaires sont
            automatiquement bloquées après réservation, sans risque de double réservation.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Rappels automatiques : l'arme anti no-shows
          </h3>
          <p className="mb-4 leading-relaxed">
            L'envoi automatique d'un rappel par e-mail 24 à 48 heures avant le rendez-vous
            est la fonctionnalité la plus rentable d'un agenda en ligne. Elle ne demande
            aucune action du praticien une fois configurée, et son impact sur la réduction
            des absences est documenté par de nombreuses études dans le secteur de la santé.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Synchronisation multi-supports
          </h3>
          <p className="mb-4 leading-relaxed">
            Un agenda en ligne synchronisé permet de consulter son planning depuis n'importe
            quel appareil — ordinateur de bureau, tablette ou smartphone — en temps réel.
            Les annulations et modifications de dernière minute sont visibles instantanément
            depuis le cabinet comme en déplacement.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Intégration avec le dossier patient
          </h3>
          <p className="mb-4 leading-relaxed">
            Un agenda intégré à la plateforme de gestion du cabinet permet de passer
            directement d'un rendez-vous au dossier patient, puis à la note de séance,
            sans changer d'outil. Cette continuité réduit les frictions administratives
            et le risque d'erreur de saisie.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            La conformité HDS : une obligation légale non négociable
          </h2>
          <p className="mb-4 leading-relaxed">
            Toute donnée de santé — y compris les métadonnées d'un rendez-vous associé à
            l'identité d'un patient — doit être hébergée chez un prestataire certifié HDS
            (Hébergement de Données de Santé). Cette obligation découle de l'article L.1111-8
            du Code de la santé publique.
          </p>
          <p className="mb-4 leading-relaxed">
            Utiliser un Google Calendar, un agenda iCloud ou tout autre outil grand public
            expose le psychologue à des sanctions CNIL pouvant atteindre 20 millions d'euros
            ou 4 % du chiffre d'affaires annuel. La certification HDS doit être le premier
            critère de sélection d'un outil de gestion de cabinet.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment choisir son agenda psychologue en ligne ?
          </h2>
          <p className="mb-4 leading-relaxed">
            Les critères essentiels à vérifier avant de choisir son agenda en ligne :
          </p>
          <ul className="mb-4 space-y-3">
            {[
              "Hébergement certifié HDS en France ou dans l'UE",
              "Interface de réservation en ligne simple pour le patient",
              "Rappels automatiques par e-mail configurables",
              "Gestion des annulations avec délai de prévenance paramétrable",
              "Intégration avec le dossier patient et la facturation",
              "Synchronisation multi-appareils",
              "Support en français réactif",
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 h-2 w-2 rounded-full bg-[#3D52A0] flex-shrink-0" />
                <span className="text-gray-700">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 5 : PsyLib */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            L'agenda PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib propose un agenda en ligne conçu pour les psychologues libéraux, hébergé
            en France sur infrastructure certifiée HDS. Prise de rendez-vous en ligne
            intégrée, rappels automatiques par e-mail, synchronisation en temps réel.
          </p>
          <p className="mb-4 leading-relaxed">
            L'agenda fait partie d'un écosystème complet : dossier patient, notes de séance
            avec templates par orientation clinique, facturation PDF et outcome tracking
            (PHQ-9, GAD-7, CORE-OM). Un seul outil pour l'ensemble du cabinet.
          </p>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Testez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Agenda, dossiers patients, facturation PDF. Accès complet. Sans carte bancaire.
          </p>
          <a
            href="https://psylib.eu/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Essayer PsyLib gratuitement 14 jours
          </a>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Un agenda psychologue en ligne doit-il être certifié HDS ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. Les données de rendez-vous associées à l'identité d'un patient constituent
                des données de santé. Leur hébergement doit être réalisé chez un prestataire
                certifié HDS. Utiliser un agenda grand public expose le praticien à des sanctions
                CNIL pouvant atteindre 20 millions d'euros.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Les rappels automatiques réduisent-ils vraiment les no-shows ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. Les études montrent une réduction des rendez-vous non honorés de 30 à 50 %
                avec des rappels automatiques envoyés 24 à 48 heures avant la séance. Pour un
                cabinet pratiquant 65 euros la séance avec deux no-shows hebdomadaires, cela
                représente une économie potentielle de plus de 3 000 euros par an.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Peut-on utiliser Google Calendar comme psychologue ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Non. Google Calendar n'est pas certifié HDS et ne garantit pas la conformité
                RGPD pour les données de santé. Un psychologue libéral doit utiliser un outil
                certifié HDS pour la gestion de son planning patient.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Peut-on tester PsyLib sans engagement ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. PsyLib propose un plan Free gratuit pour toujours, sans carte
                bancaire. 10 patients et 20 sessions par mois inclus.
                Données exportables à tout moment.
              </p>
            </details>
          </div>
        </section>

        {/* Conclusion */}
        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Article rédigé par l'équipe PsyLib — Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">
              Retour à l'accueil
            </Link>
            {' '}|{' '}
            <Link href="/blog" className="text-[#3D52A0] hover:underline">
              Tous les articles
            </Link>
          </p>
        </footer>
      </article>
    </>
  );
}
