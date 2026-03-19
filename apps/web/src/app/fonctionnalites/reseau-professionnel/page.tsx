import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Réseau Professionnel Psychologues : Adressages et Orientations Sécurisés | PsyLib',
  description:
    'Construisez votre réseau de confiance entre psychologues libéraux. Adressages patients sécurisés, groupes d\'intervision, profils professionnels. Conforme HDS.',
  keywords: [
    'réseau professionnel psychologue',
    'adressage patient psychologue',
    'orientation patient spécialiste',
    'réseau psy-to-psy',
    'plateforme psychologues libéraux',
    'réseau santé mentale France',
    'groupes intervision psychologue',
    'référer patient psychologue',
    'collaboration psychologues',
    'annuaire psychologues libéraux',
  ],
  alternates: { canonical: 'https://psylib.eu/fonctionnalites/reseau-professionnel' },
  openGraph: {
    title: 'Réseau Professionnel Psychologues : Adressages Sécurisés | PsyLib',
    description:
      'Connectez-vous avec des confrères de confiance. Adressages patients chiffrés, groupes d\'intervision, profils publics. Le réseau psy-to-psy sécurisé.',
    url: 'https://psylib.eu/fonctionnalites/reseau-professionnel',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PsyLib — Réseau Professionnel',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description:
        'Module de réseau professionnel pour psychologues libéraux : adressages patients sécurisés AES-256, profils professionnels, groupes d\'intervision.',
      url: 'https://psylib.eu/fonctionnalites/reseau-professionnel',
      featureList: [
        'Profil professionnel public',
        'Adressages patients chiffrés AES-256',
        "Groupes d'intervision et supervision",
        'Matching par approche, ville, disponibilité',
        'Notifications adressages reçus',
        'Réseau de confiance',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Comment fonctionne l'adressage patient entre psychologues dans PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Dans PsyLib, quand vous orientez un patient vers un confrère, vous envoyez un adressage chiffré qui contient uniquement les informations nécessaires (motif, contexte clinique anonymisé). Le confrère reçoit une notification sécurisée, accepte ou non. Aucune donnée nominative du patient ne transite sans consentement explicite.",
          },
        },
        {
          '@type': 'Question',
          name: "Peut-on créer des groupes d'intervision sur PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, PsyLib permet de créer des groupes professionnels fermés pour l'intervision ou la supervision. Chaque groupe a ses membres, son espace de partage de cas cliniques anonymisés, et ses règles d'accès. Idéal pour les groupes de pairs entre psychologues partageant la même orientation.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment sont protégées les informations lors d'un adressage ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Les adressages dans PsyLib sont chiffrés avec AES-256-GCM. Seul le destinataire peut déchiffrer le contenu. Les informations du patient sont protégées : seules les données nécessaires à l'orientation sont partagées, avec consentement du patient requis. L'infrastructure est certifiée HDS.",
          },
        },
        {
          '@type': 'Question',
          name: "Peut-on trouver un psychologue selon son orientation thérapeutique sur PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, le moteur de matching de PsyLib permet de rechercher des confrères par approche thérapeutique (TCC, psychodynamique, ACT, systémique...), zone géographique, disponibilité, et tarifs. Idéal pour orienter un patient vers le praticien le plus adapté à sa problématique.",
          },
        },
        {
          '@type': 'Question',
          name: "Le profil professionnel est-il visible publiquement ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Vous contrôlez la visibilité de votre profil : visible uniquement par les confrères PsyLib, ou public sur la page 'Trouver mon psy' accessible aux patients. Vous choisissez quelles informations afficher : approche, spécialisations, disponibilité, tarifs.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Fonctionnalités',
          item: 'https://psylib.eu/fonctionnalites',
        },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Réseau Professionnel',
          item: 'https://psylib.eu/fonctionnalites/reseau-professionnel',
        },
      ],
    },
  ],
};

export default function ReseauProfessionnelPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Breadcrumb */}
        <nav className="mb-8 text-sm text-[#1E1B4B]/50" aria-label="Fil d'Ariane">
          <Link href="/" className="hover:text-[#3D52A0]">
            Accueil
          </Link>{' '}
          /{' '}
          <Link href="/fonctionnalites" className="hover:text-[#3D52A0]">
            Fonctionnalités
          </Link>{' '}
          / <span className="text-[#3D52A0]">Réseau Professionnel</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <span className="mb-4 inline-block rounded-full bg-[#3D52A0]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#3D52A0]">
            Réseau psy-to-psy
          </span>
          <h1 className="mb-6 font-playfair text-4xl font-bold leading-tight text-[#1E1B4B] md:text-5xl">
            Réseau Professionnel entre Psychologues : Adressages, Intervision, Orientation
          </h1>
          <p className="text-xl leading-relaxed text-[#1E1B4B]/70">
            Connectez-vous avec des confrères de confiance. Orientez vos patients vers le bon
            praticien. Partagez vos pratiques en groupe d&apos;intervision. Tout en restant conforme
            HDS.
          </p>
        </header>

        {/* Intro */}
        <div className="mb-12 rounded-2xl bg-[#F1F0F9] p-8">
          <p className="text-base leading-relaxed text-[#1E1B4B]/80">
            <strong>La pratique libérale ne devrait pas rimer avec isolement.</strong> PsyLib crée
            un espace professionnel sécurisé pour connecter les psychologues libéraux : adressages
            de patients chiffrés, groupes d&apos;intervision fermés, profils professionnels publics
            pour la patientèle. Le premier réseau psy-to-psy conçu pour la pratique française,
            conforme HDS.
          </p>
        </div>

        {/* Section 1 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Adressages patients : orienter en toute sécurité
          </h2>
          <p className="mb-6 leading-relaxed text-[#1E1B4B]/70">
            Orienter un patient vers un confrère est une situation quotidienne. PsyLib la
            sécurise et la structure :
          </p>
          <ol className="mb-6 space-y-4">
            {[
              {
                step: '1',
                title: 'Recherchez le bon confrère',
                desc: "Filtrez par orientation thérapeutique, ville, disponibilité et tarif. Le scoring de matching vous suggère les praticiens les plus adaptés à la problématique de votre patient.",
              },
              {
                step: '2',
                title: 'Rédigez l\'adressage sécurisé',
                desc: "Décrivez le contexte clinique pertinent (motif, antécédents utiles). Le contenu est chiffré AES-256 — seul le destinataire peut le lire.",
              },
              {
                step: '3',
                title: 'Le confrère reçoit une notification',
                desc: "Il accepte ou refuse l'adressage. Vous êtes notifié en temps réel. Le patient est informé de la suite.",
              },
              {
                step: '4',
                title: 'Suivi de l\'orientation',
                desc: "L'historique des adressages est conservé dans le dossier patient pour traçabilité.",
              },
            ].map((item) => (
              <li key={item.step} className="flex gap-4">
                <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-[#3D52A0] text-sm font-bold text-white">
                  {item.step}
                </span>
                <div>
                  <h3 className="font-semibold text-[#1E1B4B]">{item.title}</h3>
                  <p className="text-sm leading-relaxed text-[#1E1B4B]/70">{item.desc}</p>
                </div>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Groupes d&apos;intervision et supervision entre pairs
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            L&apos;intervision est essentielle pour prévenir l&apos;épuisement professionnel et affiner
            sa pratique clinique. PsyLib facilite la création et l&apos;animation de groupes de pairs :
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Groupes fermés et confidentiels',
                desc: 'Invitez vos confrères de confiance. Seuls les membres ont accès aux discussions et cas partagés.',
              },
              {
                title: 'Partage de cas anonymisés',
                desc: "Présentez un cas clinique difficile en supprimant automatiquement les données identifiantes du patient.",
              },
              {
                title: 'Orientation par approche',
                desc: 'Créez des groupes par orientation (TCC, psychodynamique, systémique) pour des échanges plus ciblés.',
              },
              {
                title: 'Notifications des échanges',
                desc: 'Recevez des alertes lors de nouvelles réponses dans le groupe, sans être noyé sous les emails.',
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl bg-[#F1F0F9] p-5">
                <h3 className="mb-2 font-semibold text-[#3D52A0]">{card.title}</h3>
                <p className="text-sm leading-relaxed text-[#1E1B4B]/70">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Votre profil professionnel public
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            Votre profil PsyLib peut être visible par les patients sur la page publique{' '}
            <Link href="/trouver-mon-psy" className="text-[#3D52A0] underline">
              Trouver mon psy
            </Link>
            . Vous contrôlez intégralement ce qui s&apos;affiche :
          </p>
          <ul className="space-y-3">
            {[
              'Prénom, approche thérapeutique, spécialisations',
              'Zone géographique et mode de consultation (présentiel / visio)',
              'Disponibilités et délai de prise en charge',
              "Tarifs et conventions (secteur 3, non conventionné)",
              'Langues parlées et populations accueillies',
              'Photo et courte biographie professionnelle',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-[#3D52A0]">✓</span>
                <span className="text-[#1E1B4B]/80">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Section 4 — Sécurité */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Sécurité des échanges professionnels
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            Les échanges entre professionnels impliquent des données sensibles. PsyLib applique
            le même niveau de protection que pour les dossiers patients :
          </p>
          <div className="overflow-hidden rounded-xl border border-[#3D52A0]/10">
            <table className="w-full text-sm">
              <thead className="bg-[#3D52A0] text-white">
                <tr>
                  <th className="p-4 text-left">Protection</th>
                  <th className="p-4 text-left">Détail</th>
                </tr>
              </thead>
              <tbody>
                {[
                  ['Chiffrement adressages', 'AES-256-GCM — seul le destinataire déchiffre'],
                  ['Hébergement', 'Infrastructure certifiée HDS, France'],
                  ['Consentement patient', 'Requis avant tout partage de données nominatives'],
                  ['Anonymisation', 'Détection et suppression auto des données identifiantes'],
                  ['Audit trail', 'Log de chaque accès aux données partagées'],
                ].map(([protection, detail], i) => (
                  <tr
                    key={protection}
                    className={`border-t border-[#3D52A0]/10 ${i % 2 === 0 ? 'bg-white' : 'bg-[#F1F0F9]'}`}
                  >
                    <td className="p-4 font-semibold text-[#3D52A0]">{protection}</td>
                    <td className="p-4 text-[#1E1B4B]/70">{detail}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Comment fonctionne l'adressage patient entre psychologues dans PsyLib ?",
                a: "Vous envoyez un adressage chiffré contenant le motif et le contexte clinique anonymisé. Le confrère reçoit une notification sécurisée, accepte ou refuse. Aucune donnée nominative ne transite sans consentement explicite du patient.",
              },
              {
                q: "Peut-on créer des groupes d'intervision sur PsyLib ?",
                a: "Oui, créez des groupes professionnels fermés pour l'intervision ou supervision. Chaque groupe a ses membres, son espace de partage de cas anonymisés, et ses règles d'accès.",
              },
              {
                q: "Comment sont protégées les informations lors d'un adressage ?",
                a: "Les adressages sont chiffrés AES-256-GCM. Seul le destinataire peut déchiffrer le contenu. Infrastructure certifiée HDS. Consentement patient requis.",
              },
              {
                q: "Peut-on trouver un psychologue par orientation thérapeutique ?",
                a: "Oui, le moteur de matching filtre par approche (TCC, psychodynamique, ACT, systémique), ville, disponibilité et tarifs. Idéal pour orienter un patient vers le praticien le plus adapté.",
              },
              {
                q: "Mon profil professionnel est-il obligatoirement public ?",
                a: "Non, vous contrôlez la visibilité : profil visible uniquement par les confrères PsyLib, ou public sur Trouver mon psy. Vous choisissez chaque information affichée.",
              },
            ].map((item) => (
              <details
                key={item.q}
                className="rounded-xl border border-[#3D52A0]/10 bg-white p-5 open:bg-[#F1F0F9]"
              >
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-[#1E1B4B]/70">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA */}
        <section className="rounded-2xl bg-[#3D52A0] p-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Rejoignez le réseau des psychologues libéraux
          </h2>
          <p className="mb-6 text-white/80">
            Adressages sécurisés, intervision, profil public. 14 jours d&apos;essai gratuit.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-full bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-white/90"
          >
            Essayer PsyLib 14j gratuit
          </Link>
        </section>

        {/* Nav */}
        <div className="mt-10 flex items-center justify-between border-t border-[#3D52A0]/10 pt-8 text-sm">
          <Link href="/fonctionnalites/notes-cliniques" className="text-[#3D52A0] hover:underline">
            ← Notes Cliniques
          </Link>
          <Link href="/fonctionnalites/espace-patient" className="text-[#3D52A0] hover:underline">
            Espace Patient →
          </Link>
        </div>
      </article>
    </>
  );
}
