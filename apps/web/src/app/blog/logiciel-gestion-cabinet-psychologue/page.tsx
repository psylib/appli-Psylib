import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Logiciel de gestion de cabinet psychologue : le guide complet 2026',
  description:
    'Quel logiciel de gestion de cabinet choisir en 2026 ? Critères HDS, fonctionnalités essentielles, comparatif des solutions françaises et guide pour psychologues libéraux.',
  keywords: [
    'logiciel gestion cabinet psychologue',
    'logiciel psychologue libéral',
    'gestion cabinet psy',
    'logiciel notes séance psychologue',
    'outil psy conforme HDS',
    'logiciel cabinet psy France',
    'logiciel agenda psychologue',
    'logiciel HDS psychologue',
    'comparatif logiciel psy',
    'logiciel dossier patient psychologue',
    'logiciel facturation psychologue',
  ],
  alternates: {
    canonical: 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
  },
  openGraph: {
    title: 'Logiciel de gestion de cabinet psychologue : le guide complet 2026',
    description:
      'Critères de choix, fonctionnalités essentielles, conformité HDS/RGPD et comparatif des solutions françaises pour psychologues libéraux.',
    url: 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
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
      headline: 'Logiciel de gestion de cabinet psychologue : le guide complet 2026',
      description:
        'Guide complet pour choisir un logiciel de gestion de cabinet adapté aux psychologues libéraux en France — conformité HDS, fonctionnalités essentielles, comparatif.',
      datePublished: '2026-03-15',
      dateModified: '2026-03-27',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Un logiciel de gestion de cabinet pour psychologue doit-il être certifié HDS ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui. Les données de patients en psychologie sont des données de santé au sens de l'article L.1111-8 du Code de la santé publique. Leur hébergement en ligne est soumis à la certification HDS. Un logiciel non certifié expose le praticien à des sanctions CNIL pouvant atteindre 20 millions d'euros.",
          },
        },
        {
          '@type': 'Question',
          name: 'Quelle est la différence entre Doctolib et un logiciel de gestion de cabinet ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Doctolib est un outil de prise de rendez-vous et de visibilité. Un logiciel de gestion de cabinet couvre l'activité clinique et administrative : dossiers patients, notes de séance, facturation, suivi thérapeutique et réseau professionnel. Les deux sont complémentaires.",
          },
        },
        {
          '@type': 'Question',
          name: "Quel est le coût moyen d'un logiciel de gestion pour psychologue libéral ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: 'Les logiciels spécialisés coûtent entre 25 et 200 euros par mois selon les fonctionnalités. Les solutions complètes intègrent notes cliniques, outcome tracking (PHQ-9, GAD-7) et assistant IA conforme HDS.',
          },
        },
        {
          '@type': 'Question',
          name: 'Peut-on utiliser un tableur ou Word pour gérer ses patients ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Techniquement oui, mais stocker des données de santé sur des fichiers non chiffrés dans un cloud non certifié HDS (Google Drive, Dropbox) constitue une violation du RGPD et de l'article L.1111-8 du Code de la santé publique.",
          },
        },
        {
          '@type': 'Question',
          name: 'Peut-on tester PsyLib sans engagement ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui. PsyLib propose un plan Free gratuit pour toujours, sans carte bancaire. 10 patients et 20 sessions par mois inclus. Données exportables à tout moment.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://psylib.eu/blog' },
        { '@type': 'ListItem', position: 3, name: 'Logiciel gestion cabinet psychologue', item: 'https://psylib.eu/blog/logiciel-gestion-cabinet-psychologue' },
      ],
    },
  ],
};

export default function ArticleLogicielGestionCabinet() {
  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Breadcrumb */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Logiciel gestion cabinet psychologue</span>
        </nav>

        {/* Header */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">Guide complet — Mars 2026</p>
          <h1 className="font-playfair text-3xl font-bold leading-tight md:text-4xl">
            Logiciel de gestion de cabinet psychologue : le guide complet 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Critères de choix, fonctionnalités essentielles, conformité HDS et comparatif des solutions françaises — tout ce qu'un psychologue libéral doit savoir avant de choisir son outil.
          </p>
          <p className="mt-2 text-sm text-gray-400">Mis à jour le 27 mars 2026 · 10 min de lecture</p>
        </header>

        {/* Introduction */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            Exercer en libéral, c'est assumer deux rôles simultanément : celui de praticien et celui de chef d'entreprise. Entre la tenue des dossiers patients, la rédaction des notes de séance, la facturation, la gestion de l'agenda et la conformité réglementaire, le temps administratif peut rapidement empiéter sur le temps clinique.
          </p>
          <p className="mt-4 leading-relaxed">
            Un logiciel de gestion de cabinet psychologue bien choisi réduit cette charge — à condition qu'il soit réellement conçu pour les psychologues, et non pour l'ensemble des professions de santé. Ce guide présente les critères indispensables, les fonctionnalités à vérifier, le cadre réglementaire et un comparatif des solutions disponibles.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold">Pourquoi un logiciel dédié aux psychologues ?</h2>
          <p className="mb-4 leading-relaxed">
            La première tentation est de s'appuyer sur des outils existants : un tableur pour les finances, Word pour les notes, Google Agenda pour les rendez-vous. Cette approche révèle rapidement ses limites dès que le carnet de patients s'étoffe.
          </p>
          <p className="mb-4 leading-relaxed">
            Les outils généralistes créent une fragmentation des données : informations éparpillées, aucune vue d'ensemble sur le suivi d'un patient, risque de pertes. Surtout, ils ne répondent pas aux obligations légales spécifiques à la pratique psychologique.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold">Les besoins spécifiques de la pratique</h3>
          <p className="mb-4 leading-relaxed">
            La psychologie libérale implique des besoins que les logiciels médicaux généralistes ne couvrent pas : notes cliniques structurées par orientation thérapeutique (TCC, psychodynamique, ACT), suivi longitudinal avec questionnaires validés (PHQ-9, GAD-7, CORE-OM), gestion des adressages entre confrères, et parfois un espace patient inter-séances.
          </p>

          <div className="my-6 rounded-xl border-l-4 border-[#3D52A0] bg-[#F1F0F9] px-5 py-4">
            <p className="font-semibold">Point réglementaire essentiel</p>
            <p className="mt-2 text-sm leading-relaxed">
              Les notes de séance d'un psychologue sont des données de santé au sens de l'article L.1111-8 du Code de la santé publique. Toute solution qui les héberge en ligne doit être certifiée <strong>HDS</strong> (Hébergeur de Données de Santé). Utiliser un service non certifié — Google Drive, Dropbox, un hébergeur standard — expose le praticien à des sanctions CNIL pouvant atteindre <strong>20 millions d'euros</strong>.
            </p>
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold">Les 7 fonctionnalités essentielles</h2>

          <h3 className="mb-2 font-playfair text-lg font-semibold">1. Dossier patient numérique et sécurisé</h3>
          <p className="mb-4 leading-relaxed">
            Centralise les informations administratives, l'historique des séances et les notes cliniques. Les données sensibles doivent être chiffrées AES-256-GCM au niveau applicatif.
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold">2. Notes de séance structurées par orientation</h3>
          <p className="mb-4 leading-relaxed">
            Gabarits TCC, psychodynamique, ACT, systémique. Champs structurés pour objectifs, techniques, exercices inter-séances. Autosauvegarde toutes les 30 secondes.
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold">3. Agenda et gestion des rendez-vous</h3>
          <p className="mb-4 leading-relaxed">
            Créneaux, rappels automatiques, durées par défaut, gestion des annulations. Synchronisation avec Google Calendar ou Apple Calendar.
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold">4. Facturation conforme</h3>
          <p className="mb-4 leading-relaxed">
            Notes d'honoraires avec mention d'exonération TVA (article 261-4-1° du CGI), numéro ADELI, SIRET, numérotation séquentielle. Compatible Mon Soutien Psy.
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold">5. Outcome tracking (PHQ-9, GAD-7, CORE-OM)</h3>
          <p className="mb-4 leading-relaxed">
            Administration régulière de questionnaires standardisés et visualisation de l'évolution sur des graphiques longitudinaux. Recommandé dans le cadre du dispositif Mon Soutien Psy depuis juin 2024.
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold">6. Espace patient inter-séances</h3>
          <p className="mb-4 leading-relaxed">
            Portail patient pour exercices thérapeutiques, suivi de l'humeur et messagerie sécurisée. Améliore l'engagement et réduit les abandons de suivi.
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold">7. Assistant IA clinique conforme HDS</h3>
          <p className="mb-4 leading-relaxed">
            Résumés de séance, exercices personnalisés. Point de vigilance : les données cliniques ne doivent jamais être transmises à des modèles tiers sans consentement explicite et garantie HDS.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold">Conformité HDS et RGPD : les garanties à exiger</h2>
          <ul className="mb-4 space-y-3">
            <li className="flex items-start gap-3">
              <span className="mt-1 font-bold text-[#3D52A0]">&#10003;</span>
              <span><strong>Chiffrement applicatif</strong> — AES-256-GCM sur les champs sensibles (notes, messages, journal)</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 font-bold text-[#3D52A0]">&#10003;</span>
              <span><strong>Authentification forte (MFA)</strong> — TOTP obligatoire pour les praticiens</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 font-bold text-[#3D52A0]">&#10003;</span>
              <span><strong>Audit des accès</strong> — journal traçant qui a accédé à quel dossier</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 font-bold text-[#3D52A0]">&#10003;</span>
              <span><strong>Export RGPD + droit à l'effacement</strong> — export complet et purge sur demande</span>
            </li>
          </ul>
        </section>

        {/* Section 4 — Comparatif */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold">Comparatif des solutions pour psychologues en France (2026)</h2>
          <div className="overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold">Logiciel</th>
                  <th className="px-4 py-3 text-left font-semibold">Prix</th>
                  <th className="px-4 py-3 text-left font-semibold">Points forts</th>
                  <th className="px-4 py-3 text-left font-semibold">Limites</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="px-4 py-3 font-medium">Docorga</td>
                  <td className="px-4 py-3">Sur devis</td>
                  <td className="px-4 py-3">Base utilisateurs établie, dossier patient</td>
                  <td className="px-4 py-3">Pas d'outcome tracking, interface vieillissante</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Scriboupsy</td>
                  <td className="px-4 py-3">27 €/mois</td>
                  <td className="px-4 py-3">Dédié psychothérapeutes, prix accessible</td>
                  <td className="px-4 py-3">Fonctionnalités limitées, pas d'IA</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium">Mon Cabinet Libéral</td>
                  <td className="px-4 py-3">Dès 24 €/mois</td>
                  <td className="px-4 py-3">Agenda, facturation, solution établie</td>
                  <td className="px-4 py-3">Généraliste, pas de templates par orientation</td>
                </tr>
                <tr className="bg-gray-50">
                  <td className="px-4 py-3 font-medium">Terapiz</td>
                  <td className="px-4 py-3">Sur devis</td>
                  <td className="px-4 py-3">Agenda en ligne, rappels</td>
                  <td className="px-4 py-3">Orienté prise de RDV, clinique limité</td>
                </tr>
                <tr>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">PsyLib</td>
                  <td className="px-4 py-3 font-medium text-[#3D52A0]">Gratuit puis 25 €/mois</td>
                  <td className="px-4 py-3">PHQ-9/GAD-7, templates TCC/ACT, réseau pro, IA HDS, espace patient</td>
                  <td className="px-4 py-3">Solution récente, base en croissance</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-3 text-xs text-gray-500">Données indicatives — mars 2026.</p>
        </section>

        {/* Section 5 — 5 questions */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold">5 questions à poser avant de vous engager</h2>
          <ol className="space-y-3 list-decimal list-inside">
            <li className="leading-relaxed"><strong>L'hébergement est-il certifié HDS en France ?</strong> — Premier critère non négociable.</li>
            <li className="leading-relaxed"><strong>Le logiciel est-il conçu pour les psychologues ?</strong> — Pas un outil généraliste "professions de santé".</li>
            <li className="leading-relaxed"><strong>Essai gratuit sans carte bancaire ?</strong> — 14 à 30 jours pour tester avant engagement.</li>
            <li className="leading-relaxed"><strong>Données exportables à tout moment ?</strong> — Droit RGPD et exigence pratique.</li>
            <li className="leading-relaxed"><strong>Support en français et réactif ?</strong> — Délai sous 24h minimum.</li>
          </ol>
        </section>

        {/* PsyLib */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold">PsyLib : une plateforme tout-en-un</h2>
          <p className="mb-4 leading-relaxed">
            PsyLib est un logiciel de gestion de cabinet conçu spécifiquement pour les psychologues libéraux en France. Hébergement HDS, chiffrement AES-256-GCM, MFA TOTP, audit complet des accès.
          </p>
          <ul className="mb-6 space-y-2">
            {[
              'Dossiers patients chiffrés + export RGPD',
              'Notes structurées TCC, psychodynamique, ACT, systémique',
              'Outcome tracking PHQ-9, GAD-7, CORE-OM',
              'Facturation PDF conforme (TVA, ADELI)',
              'Réseau professionnel psy-to-psy',
              'Assistant IA clinique conforme HDS',
              'Espace patient inter-séances',
            ].map((f) => (
              <li key={f} className="flex items-start gap-3">
                <span className="mt-0.5 font-bold text-[#3D52A0]">&#10003;</span>
                <span className="leading-relaxed">{f}</span>
              </li>
            ))}
          </ul>
          <p className="leading-relaxed">
            Free gratuit, Solo à 25€/mois, Pro à 40€/mois, Clinic à 79€/mois. Plan gratuit sans limite de durée.
          </p>
        </section>

        {/* Maillage interne */}
        <section className="mb-10 rounded-xl border border-gray-200 bg-gray-50 p-6">
          <h2 className="mb-4 font-playfair text-xl font-bold">Pour approfondir</h2>
          <ul className="space-y-2 text-sm">
            <li><Link href="/blog/notes-seance-psychologue-logiciel" className="text-[#3D52A0] hover:underline">Notes de séance psychologue : templates structurés par orientation</Link></li>
            <li><Link href="/blog/facturation-psychologue-liberal" className="text-[#3D52A0] hover:underline">Facturation psychologue libéral : guide complet 2026</Link></li>
            <li><Link href="/blog/outcome-tracking-psychotherapie" className="text-[#3D52A0] hover:underline">Outcome tracking en psychothérapie : PHQ-9, GAD-7 et CORE-OM</Link></li>
            <li><Link href="/blog/agenda-psychologue-en-ligne" className="text-[#3D52A0] hover:underline">Agenda psychologue en ligne : passer au numérique en 2026</Link></li>
          </ul>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">Testez PsyLib gratuitement pendant 14 jours</h2>
          <p className="mb-6 text-white/80">
            Accès complet au plan Pro. Sans carte bancaire. Conforme HDS.
          </p>
          <Link href="/beta" className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100">
            Commencer gratuitement
          </Link>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold">Questions fréquentes</h2>
          <div className="space-y-4">
            {[
              { q: 'Un logiciel de gestion de cabinet doit-il être certifié HDS ?', a: "Oui. Les données de patients en psychologie sont des données de santé (article L.1111-8). L'hébergement non certifié HDS expose à des sanctions CNIL jusqu'à 20 millions d'euros." },
              { q: 'Quelle différence entre Doctolib et un logiciel de gestion ?', a: 'Doctolib gère la prise de rendez-vous et la visibilité. Un logiciel de gestion couvre dossiers patients, notes cliniques, facturation, suivi thérapeutique. Les deux sont complémentaires.' },
              { q: "Coût moyen d'un logiciel pour psychologue libéral ?", a: 'Entre 25 et 200 euros/mois selon les fonctionnalités. Les solutions complètes intègrent notes structurées, outcome tracking et assistant IA.' },
              { q: 'Peut-on utiliser Word ou Excel pour gérer ses patients ?', a: "Techniquement oui, mais stocker des données de santé dans un cloud non certifié HDS (Google Drive, Dropbox) est une violation RGPD et de l'article L.1111-8." },
              { q: 'Peut-on tester PsyLib sans engagement ?', a: "Oui. Plan Free gratuit pour toujours, sans carte bancaire. Données exportables à tout moment." },
            ].map(({ q, a }) => (
              <details key={q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold">{q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{a}</p>
              </details>
            ))}
          </div>
        </section>

        {/* Footer */}
        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Article rédigé par l'équipe PsyLib — mis à jour mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Accueil</Link>
            {' | '}
            <Link href="/blog" className="text-[#3D52A0] hover:underline">Tous les articles</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
