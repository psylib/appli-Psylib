import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Espace Patient Psychologue en Ligne : Portail Sécurisé entre les Séances | PsyLib',
  description:
    'Offrez à vos patients un espace sécurisé entre les séances : humeur, exercices, journal intime, messagerie. Portail patient chiffré HDS pour psychologues libéraux.',
  keywords: [
    'espace patient psychologue en ligne',
    'portail patient psychologue',
    'application patient psychologue',
    'suivi patient entre séances',
    'humeur patient psychologue',
    'exercices thérapeutiques en ligne',
    'messagerie sécurisée psychologue',
    'journal patient psychologue',
    'engagement patient thérapie',
    'outils numériques psychologue',
  ],
  alternates: { canonical: 'https://psylib.eu/fonctionnalites/espace-patient' },
  openGraph: {
    title: "Espace Patient Psychologue : Suivi Sécurisé entre les Séances | PsyLib",
    description:
      'Humeur, exercices, journal et messagerie sécurisée pour vos patients. Renforcez l\'alliance thérapeutique avec un espace digital HDS conforme.',
    url: 'https://psylib.eu/fonctionnalites/espace-patient',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: "PsyLib — Espace Patient",
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description:
        "Portail patient sécurisé de PsyLib : suivi d'humeur, exercices thérapeutiques, journal personnel, messagerie chiffrée avec le psychologue.",
      url: 'https://psylib.eu/fonctionnalites/espace-patient',
      featureList: [
        "Suivi d'humeur quotidien (1-10)",
        'Exercices thérapeutiques assignés',
        'Journal personnel chiffré',
        'Messagerie sécurisée avec le psy',
        'Questionnaires cliniques (PHQ-9, GAD-7)',
        'Rappels de séance automatiques',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Comment inviter un patient à rejoindre son espace PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Depuis la fiche patient dans PsyLib, cliquez sur 'Inviter le patient'. Un email sécurisé est envoyé avec un lien d'invitation valable 7 jours. Le patient crée son compte en 2 minutes et accède immédiatement à son espace personnel.",
          },
        },
        {
          '@type': 'Question',
          name: "Le journal intime du patient est-il visible par le psychologue ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Par défaut, le journal intime est privé : seul le patient peut le lire. Le patient peut choisir de partager certaines entrées avec son psychologue. Cette distinction est clairement affichée dans l'interface. Les entrées journal sont chiffrées AES-256.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment assigner des exercices thérapeutiques à un patient ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Depuis la fiche patient ou après une séance, cliquez sur 'Assigner un exercice'. Vous rédigez l'exercice manuellement ou utilisez l'assistant IA pour générer un exercice personnalisé (respiration, exposition graduelle, journal de pensées, etc.). Le patient reçoit une notification et peut marquer l'exercice complété.",
          },
        },
        {
          '@type': 'Question',
          name: "La messagerie avec le patient est-elle sécurisée ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, la messagerie PsyLib est chiffrée de bout en bout (AES-256-GCM). Les messages ne sont lisibles que par le psychologue et son patient. L'infrastructure est certifiée HDS. Aucun contenu ne transite en clair sur nos serveurs.",
          },
        },
        {
          '@type': 'Question',
          name: "Le suivi d'humeur du patient est-il visible en temps réel ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, depuis la fiche patient, vous accédez au graphique d'humeur avec l'historique complet. Vous recevez une notification si l'humeur chute en dessous d'un seuil configurable (alerte crise). Le patient peut ajouter une note à chaque enregistrement d'humeur.",
          },
        },
        {
          '@type': 'Question',
          name: "Les patients peuvent-ils remplir les questionnaires PHQ-9 et GAD-7 depuis leur espace ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, les questionnaires cliniques (PHQ-9, GAD-7, CORE-OM) sont accessibles directement depuis l'espace patient. PsyLib peut les envoyer automatiquement avant chaque séance, ou vous pouvez les assigner manuellement à tout moment.",
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
          name: 'Espace Patient',
          item: 'https://psylib.eu/fonctionnalites/espace-patient',
        },
      ],
    },
  ],
};

export default function EspacePatientPage() {
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
          / <span className="text-[#3D52A0]">Espace Patient</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <span className="mb-4 inline-block rounded-full bg-[#3D52A0]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#3D52A0]">
            Portail patient
          </span>
          <h1 className="mb-6 font-playfair text-4xl font-bold leading-tight text-[#1E1B4B] md:text-5xl">
            Espace Patient en Ligne : Suivi Thérapeutique entre les Séances
          </h1>
          <p className="text-xl leading-relaxed text-[#1E1B4B]/70">
            Offrez à vos patients un espace sécurisé pour suivre leur humeur, réaliser leurs
            exercices et vous contacter entre les séances. Alliance thérapeutique renforcée,
            abandon de suivi réduit.
          </p>
        </header>

        {/* Intro */}
        <div className="mb-12 rounded-2xl bg-[#F1F0F9] p-8">
          <p className="text-base leading-relaxed text-[#1E1B4B]/80">
            <strong>La thérapie ne se passe pas que dans le cabinet.</strong> Les 7 jours entre
            deux séances sont cruciaux pour l&apos;intégration du travail thérapeutique. L&apos;espace
            patient PsyLib donne à vos patients les outils pour continuer à progresser entre les
            rendez-vous — sous votre guidance, dans un cadre entièrement sécurisé et conforme HDS.
          </p>
        </div>

        {/* Section 1 — Fonctionnalités */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Ce que l&apos;espace patient propose à vos patients
          </h2>
          <div className="space-y-5">
            {[
              {
                icon: '📊',
                title: "Suivi d'humeur quotidien",
                desc: "Le patient enregistre son humeur en un clic (1 à 10), avec une note optionnelle. Vous visualisez le graphique complet depuis la fiche patient. Une alerte vous est envoyée si l'humeur passe sous un seuil critique.",
              },
              {
                icon: '🎯',
                title: 'Exercices thérapeutiques assignés',
                desc: 'Vous assignez des exercices personnalisés depuis PsyLib (rédigés manuellement ou générés par IA). Le patient les retrouve dans son espace, avec description, date limite et statut (assigné / en cours / complété).',
              },
              {
                icon: '📓',
                title: 'Journal personnel chiffré',
                desc: "Le patient tient un journal intime dans son espace. Par défaut privé, il peut choisir de partager certaines entrées avec vous. Toutes les entrées sont chiffrées AES-256 — ni PsyLib ni votre équipe n'y ont accès sans consentement explicite.",
              },
              {
                icon: '💬',
                title: 'Messagerie sécurisée',
                desc: 'Canal de communication direct chiffré entre vous et votre patient. Idéal pour répondre aux questions simples entre séances, sans passer par email. Les messages sont chiffrés de bout en bout.',
              },
              {
                icon: '📋',
                title: 'Questionnaires cliniques',
                desc: 'PHQ-9, GAD-7 et CORE-OM accessibles directement depuis l\'espace patient. PsyLib les envoie automatiquement avant chaque séance ou vous les assignez manuellement.',
              },
              {
                icon: '🔔',
                title: 'Rappels et notifications',
                desc: "Le patient reçoit des rappels automatiques (email ou notification) pour ses séances, ses exercices en attente, et ses questionnaires à remplir. Taux d'abandon réduit, engagement renforcé.",
              },
            ].map((feature) => (
              <div
                key={feature.title}
                className="flex gap-5 rounded-xl border border-[#3D52A0]/10 bg-white p-6"
              >
                <span className="text-3xl">{feature.icon}</span>
                <div>
                  <h3 className="mb-2 font-semibold text-[#1E1B4B]">{feature.title}</h3>
                  <p className="text-sm leading-relaxed text-[#1E1B4B]/70">{feature.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 — Onboarding patient */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Inviter un patient en 30 secondes
          </h2>
          <p className="mb-6 leading-relaxed text-[#1E1B4B]/70">
            Pas besoin que le patient installe quoi que ce soit. L&apos;espace patient fonctionne
            directement depuis n&apos;importe quel navigateur.
          </p>
          <ol className="space-y-3">
            {[
              "Ouvrez la fiche patient dans PsyLib",
              "Cliquez sur \"Inviter le patient\"",
              "Un email sécurisé est envoyé avec un lien d'invitation (valable 7 jours)",
              "Le patient crée son compte en 2 minutes",
              "Il accède immédiatement à son espace et vos exercices assignés",
            ].map((step, i) => (
              <li key={step} className="flex items-start gap-3">
                <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-[#3D52A0] text-xs font-bold text-white">
                  {i + 1}
                </span>
                <span className="text-[#1E1B4B]/80">{step}</span>
              </li>
            ))}
          </ol>
        </section>

        {/* Section 3 — Bénéfices */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les bénéfices pour votre pratique
          </h2>
          <div className="grid gap-4 md:grid-cols-2">
            {[
              {
                title: 'Réduction des abandons',
                desc: "Les patients engagés entre les séances (exercices, humeur) abandonnent moins fréquemment le suivi.",
              },
              {
                title: 'Séances plus riches',
                desc: "Arrivez en séance avec les données d'humeur, les exercices complétés, les questionnaires remplis. Moins de temps à \"rattraper\", plus de temps de travail clinique.",
              },
              {
                title: 'Alliance thérapeutique renforcée',
                desc: "Le patient sent un accompagnement continu, pas seulement ponctuel. L'espace patient matérialise le cadre thérapeutique entre les séances.",
              },
              {
                title: 'Conformité RGPD simplifiée',
                desc: "Consentements patients gérés dans PsyLib. Export de données sur demande. Droit à l'effacement en un clic.",
              },
            ].map((card) => (
              <div key={card.title} className="rounded-xl bg-[#F1F0F9] p-5">
                <h3 className="mb-2 font-semibold text-[#3D52A0]">{card.title}</h3>
                <p className="text-sm leading-relaxed text-[#1E1B4B]/70">{card.desc}</p>
              </div>
            ))}
          </div>
        </section>

        {/* Section 4 — Sécurité */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Sécurité et conformité : aucun compromis
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            Les données de l&apos;espace patient sont des données de santé au sens légal français.
            PsyLib les protège avec le même niveau d&apos;exigence que les notes de séance :
          </p>
          <ul className="space-y-3">
            {[
              'Hébergement certifié HDS — obligatoire pour les données de santé en France',
              'Chiffrement AES-256-GCM de toutes les données sensibles (journal, messages)',
              'Authentification sécurisée par email (lien magique) — pas de mot de passe à retenir',
              "Aucune donnée patient partagée avec des tiers sans consentement explicite",
              "Droit à l'effacement RGPD : le patient peut supprimer son compte et toutes ses données",
              'Audit log de chaque accès aux données chiffrées',
            ].map((item) => (
              <li key={item} className="flex items-start gap-3">
                <span className="mt-1 text-[#3D52A0]">🔒</span>
                <span className="text-sm leading-relaxed text-[#1E1B4B]/80">{item}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes sur l&apos;espace patient
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Comment inviter un patient à rejoindre son espace PsyLib ?",
                a: "Depuis la fiche patient, cliquez sur 'Inviter le patient'. Un email sécurisé est envoyé avec un lien d'invitation valable 7 jours. Le patient crée son compte en 2 minutes et accède immédiatement à son espace.",
              },
              {
                q: "Le journal intime est-il visible par le psychologue ?",
                a: "Par défaut, le journal est privé : seul le patient peut le lire. Le patient peut choisir de partager certaines entrées avec vous. Cette distinction est clairement affichée. Les entrées sont chiffrées AES-256.",
              },
              {
                q: "Comment assigner des exercices thérapeutiques ?",
                a: "Depuis la fiche patient, cliquez sur 'Assigner un exercice'. Rédigez manuellement ou utilisez l'assistant IA. Le patient reçoit une notification et peut marquer l'exercice complété.",
              },
              {
                q: "La messagerie avec le patient est-elle sécurisée ?",
                a: "Oui, messagerie chiffrée de bout en bout (AES-256-GCM). Les messages sont lisibles uniquement par vous et votre patient. Infrastructure HDS.",
              },
              {
                q: "Les patients peuvent-ils remplir les questionnaires PHQ-9 depuis leur espace ?",
                a: "Oui, PHQ-9, GAD-7 et CORE-OM sont accessibles depuis l'espace patient. PsyLib peut les envoyer automatiquement avant chaque séance.",
              },
              {
                q: "L'espace patient est-il accessible sur mobile ?",
                a: "Oui, l'espace patient est une application web responsive, accessible depuis n'importe quel navigateur mobile. Aucune installation requise. Une app mobile native est prévue dans les prochaines versions.",
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
            Offrez à vos patients un suivi continu entre les séances
          </h2>
          <p className="mb-6 text-white/80">
            Humeur, exercices, journal, messagerie sécurisée. Inclus dans tous les plans PsyLib.
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
          <Link
            href="/fonctionnalites/reseau-professionnel"
            className="text-[#3D52A0] hover:underline"
          >
            ← Réseau Professionnel
          </Link>
          <Link href="/" className="text-[#3D52A0] hover:underline">
            Accueil →
          </Link>
        </div>
      </article>
    </>
  );
}
