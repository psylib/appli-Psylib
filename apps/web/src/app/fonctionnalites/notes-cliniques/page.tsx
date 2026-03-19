import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Templates Notes Cliniques Psychologue : TCC, ACT, Psychodynamique | PsyLib',
  description:
    'Structurez vos notes de séance avec des templates adaptés à votre orientation : TCC, ACT, psychodynamique, systémique. Gain de temps, qualité clinique, conformité RGPD.',
  keywords: [
    'template note séance psychologue',
    'modèle notes cliniques TCC',
    'notes psychologue logiciel',
    'structurer notes thérapeutiques',
    'note de séance psychodynamique',
    'template ACT psychologie',
    'note clinique systémique',
    'logiciel notes psychologue libéral',
    'rédiger notes séance',
    'dossier patient psychologue',
  ],
  alternates: { canonical: 'https://psylib.eu/fonctionnalites/notes-cliniques' },
  openGraph: {
    title: 'Templates Notes Cliniques : TCC, ACT, Psychodynamique | PsyLib',
    description:
      'Des templates de notes structurés pour chaque orientation thérapeutique. Rédigez vos notes de séance 3x plus vite avec PsyLib.',
    url: 'https://psylib.eu/fonctionnalites/notes-cliniques',
    type: 'website',
  },
  robots: { index: true, follow: true },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PsyLib — Templates Notes Cliniques',
      applicationCategory: 'HealthApplication',
      operatingSystem: 'Web',
      description:
        'Éditeur de notes de séance avec templates structurés par orientation thérapeutique : TCC, ACT, psychodynamique, systémique, autre.',
      url: 'https://psylib.eu/fonctionnalites/notes-cliniques',
      featureList: [
        'Template TCC — pensées, émotions, comportements',
        'Template psychodynamique — transfert, résistance, insight',
        'Template ACT — hexaflex, valeurs, défusion',
        'Template systémique — dynamique familiale, patterns relationnels',
        'Éditeur riche avec autosave',
        'Mode structuré ou libre',
        'Résumé IA optionnel',
        'Chiffrement AES-256 des notes',
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Quels templates de notes sont disponibles dans PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "PsyLib inclut 5 templates de notes cliniques : TCC (thérapie cognitive-comportementale), psychodynamique, systémique, ACT (Acceptance and Commitment Therapy), et un template libre. Chaque template est structuré selon les concepts clés de l'orientation, pour guider votre rédaction et ne rien oublier.",
          },
        },
        {
          '@type': 'Question',
          name: 'Est-ce qu\'on peut rédiger des notes en mode libre, sans template ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, PsyLib propose un mode dual : template structuré OU éditeur de texte libre. Vous pouvez basculer entre les deux en cours de rédaction. L'autosave toutes les 30 secondes garantit qu'aucune note n'est perdue.",
          },
        },
        {
          '@type': 'Question',
          name: "Les notes de séance sont-elles chiffrées dans PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, toutes les notes de séance sont chiffrées avec AES-256-GCM avant stockage en base de données. Même l'équipe PsyLib n'a pas accès à vos notes. Les données sont hébergées sur infrastructure certifiée HDS, conformément à la réglementation française pour les données de santé.",
          },
        },
        {
          '@type': 'Question',
          name: "PsyLib propose-t-il une synthèse automatique des notes par IA ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui, PsyLib propose un assistant IA optionnel qui peut générer un résumé structuré de vos notes brutes : points abordés, plan thérapeutique, suivi prévu. Cette fonctionnalité est entièrement opt-in — l'IA ne s'active jamais sans votre accord explicite.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment organiser les notes de séance par patient dans PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Chaque note est automatiquement archivée dans le dossier du patient, classée par date. Vous accédez à l'historique complet des séances en un clic, avec recherche fulltext dans les notes. La fiche patient centralise notes, mesures cliniques, rendez-vous et factures.",
          },
        },
        {
          '@type': 'Question',
          name: "Le template TCC couvre-t-il toutes les approches cognitivo-comportementales ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Le template TCC de PsyLib est structuré autour des composantes fondamentales : pensées automatiques, distorsions cognitives, émotions, comportements, expériences de vie et plan de séance. Il est adapté à la TCC classique, la TCC de 3e vague, et peut être personnalisé en mode libre.",
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
          name: 'Notes Cliniques',
          item: 'https://psylib.eu/fonctionnalites/notes-cliniques',
        },
      ],
    },
  ],
};

export default function NotesCliniquesPage() {
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
          / <span className="text-[#3D52A0]">Notes Cliniques</span>
        </nav>

        {/* Header */}
        <header className="mb-12">
          <span className="mb-4 inline-block rounded-full bg-[#3D52A0]/10 px-4 py-1 text-xs font-semibold uppercase tracking-widest text-[#3D52A0]">
            Rédaction clinique
          </span>
          <h1 className="mb-6 font-playfair text-4xl font-bold leading-tight text-[#1E1B4B] md:text-5xl">
            Templates Notes de Séance : TCC, ACT, Psychodynamique, Systémique
          </h1>
          <p className="text-xl leading-relaxed text-[#1E1B4B]/70">
            Des modèles structurés pour chaque orientation thérapeutique. Rédigez des notes
            cliniques complètes en deux fois moins de temps, sans jamais oublier l&apos;essentiel.
          </p>
        </header>

        {/* Intro */}
        <div className="mb-12 rounded-2xl bg-[#F1F0F9] p-8">
          <p className="text-base leading-relaxed text-[#1E1B4B]/80">
            <strong>En moyenne, un psychologue consacre 15 à 25% de son temps à la rédaction.</strong>{' '}
            PsyLib réduit ce temps en proposant des templates de notes adaptés à votre cadre
            théorique. Plus besoin de partir d&apos;une page blanche : chaque template guide votre
            rédaction avec les concepts clés de votre approche, tout en laissant la liberté
            d&apos;un éditeur de texte libre.
          </p>
        </div>

        {/* Section 1 — Templates */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les 5 templates disponibles dans PsyLib
          </h2>
          <div className="space-y-5">
            {[
              {
                name: 'Thérapie Cognitive-Comportementale (TCC)',
                color: '#3D52A0',
                fields: [
                  'Problème présenté en séance',
                  'Pensées automatiques identifiées',
                  'Distorsions cognitives',
                  'Émotions associées (0-10)',
                  'Comportements observés',
                  'Expériences de vie liées',
                  "Plan d'action et homework",
                ],
              },
              {
                name: 'Psychodynamique / Analytique',
                color: '#7C3AED',
                fields: [
                  'Matériel clinique de la séance',
                  'Dynamique transférentielle',
                  'Résistances observées',
                  'Mouvements contre-transférentiels',
                  'Insights et prises de conscience',
                  'Liens avec histoire de vie',
                  'Hypothèses dynamiques',
                ],
              },
              {
                name: 'Systémique / Familiale',
                color: '#0D9488',
                fields: [
                  'Contexte relationnel présenté',
                  'Patterns systémiques identifiés',
                  'Dynamiques familiales / de couple',
                  'Rôles et positions dans le système',
                  'Ressources du système',
                  'Objectifs systémiques',
                  'Tâches proposées',
                ],
              },
              {
                name: 'ACT — Acceptance and Commitment Therapy',
                color: '#EA580C',
                fields: [
                  'Processus hexaflex travaillé',
                  'Défusion cognitive',
                  'Expériences de pleine conscience',
                  'Valeurs explorées',
                  "Engagement vers l'action",
                  "Exercices d'ACT proposés",
                  'Barrières à l\'engagement',
                ],
              },
              {
                name: 'Autre / Libre',
                color: '#64748B',
                fields: [
                  'Format entièrement libre',
                  'Éditeur riche (titres, listes, gras)',
                  'Personnalisable selon votre pratique',
                ],
              },
            ].map((t) => (
              <div
                key={t.name}
                className="rounded-xl border border-[#3D52A0]/10 bg-white overflow-hidden"
              >
                <div className="p-4" style={{ borderLeft: `4px solid ${t.color}` }}>
                  <h3 className="font-semibold text-[#1E1B4B]">{t.name}</h3>
                  <ul className="mt-3 grid grid-cols-1 gap-1 text-sm text-[#1E1B4B]/70 md:grid-cols-2">
                    {t.fields.map((f) => (
                      <li key={f} className="flex items-center gap-2">
                        <span style={{ color: t.color }}>→</span> {f}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* Section 2 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Mode structuré ou éditeur libre : vous choisissez
          </h2>
          <p className="mb-6 leading-relaxed text-[#1E1B4B]/70">
            Certaines séances se prêtent à une structure, d&apos;autres demandent plus de fluidité.
            PsyLib propose les deux modes, basculables en cours de rédaction.
          </p>
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl bg-[#F1F0F9] p-6">
              <h3 className="mb-2 font-semibold text-[#3D52A0]">Mode structuré (template)</h3>
              <ul className="space-y-2 text-sm text-[#1E1B4B]/70">
                <li>✓ Sections pré-définies selon l&apos;orientation</li>
                <li>✓ Champs clés toujours renseignés</li>
                <li>✓ Idéal pour les séances standard</li>
                <li>✓ Facilite la relecture et le suivi</li>
              </ul>
            </div>
            <div className="rounded-xl bg-[#F1F0F9] p-6">
              <h3 className="mb-2 font-semibold text-[#3D52A0]">Mode libre (éditeur riche)</h3>
              <ul className="space-y-2 text-sm text-[#1E1B4B]/70">
                <li>✓ Éditeur Markdown avec mise en forme</li>
                <li>✓ Liberté totale de structure</li>
                <li>✓ Idéal pour les séances atypiques</li>
                <li>✓ Peut coexister avec les templates</li>
              </ul>
            </div>
          </div>
        </section>

        {/* Section 3 */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Sécurité et conformité : vos notes protégées
          </h2>
          <p className="mb-4 leading-relaxed text-[#1E1B4B]/70">
            Les notes de séance contiennent les données les plus sensibles du dossier patient.
            PsyLib les traite avec le plus haut niveau de sécurité :
          </p>
          <ul className="space-y-3">
            {[
              'Chiffrement AES-256-GCM de bout en bout — même PsyLib ne peut pas lire vos notes',
              'Hébergement sur infrastructure certifiée HDS (Hébergeur de Données de Santé)',
              "Autosave toutes les 30 secondes — aucune note n'est jamais perdue",
              'Audit log de chaque accès aux données chiffrées',
              "Droit à l'effacement RGPD : suppression définitive sur demande du patient",
              'Aucune donnée patient envoyée à des serveurs tiers sans consentement',
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
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Quels templates de notes sont disponibles dans PsyLib ?",
                a: "PsyLib inclut 5 templates : TCC (pensées automatiques, distorsions, comportements), psychodynamique (transfert, résistance, insight), systémique (patterns, dynamiques familiales), ACT (hexaflex, valeurs, engagement) et un template libre. Chaque template est conçu avec les concepts clés de l'orientation.",
              },
              {
                q: "Peut-on rédiger des notes en mode libre sans template ?",
                a: "Oui, PsyLib propose un éditeur riche en mode libre, basculable à tout moment depuis le template structuré. L'autosave toutes les 30 secondes garantit qu'aucune note n'est perdue.",
              },
              {
                q: "Les notes sont-elles chiffrées ?",
                a: "Oui, toutes les notes sont chiffrées AES-256-GCM avant stockage. Même l'équipe PsyLib n'y a pas accès. Hébergement HDS en France.",
              },
              {
                q: "L'IA peut-elle générer des résumés de mes notes ?",
                a: "Oui, PsyLib propose un assistant IA optionnel qui génère un résumé structuré de vos notes brutes (points abordés, plan thérapeutique, suivi prévu). L'IA est entièrement opt-in et ne s'active jamais sans votre accord.",
              },
              {
                q: "Comment accéder aux notes passées d'un patient ?",
                a: "Depuis la fiche patient, toutes les notes sont classées chronologiquement. Recherche fulltext dans les notes, filtres par période ou thème. En un clic, vous accédez à l'historique complet des séances.",
              },
              {
                q: "Les templates sont-ils personnalisables ?",
                a: "Les templates système (TCC, psychodynamique, systémique, ACT) sont disponibles en standard. La personnalisation des sections et la création de templates sur mesure sont en cours de développement.",
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
            Rédigez vos notes cliniques 3x plus vite
          </h2>
          <p className="mb-6 text-white/80">
            Templates TCC, ACT, psychodynamique, systémique inclus. Essai 14 jours gratuit.
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
          <Link href="/fonctionnalites/outcome-tracking" className="text-[#3D52A0] hover:underline">
            ← Outcome Tracking
          </Link>
          <Link
            href="/fonctionnalites/reseau-professionnel"
            className="text-[#3D52A0] hover:underline"
          >
            Réseau Professionnel →
          </Link>
        </div>
      </article>
    </>
  );
}
