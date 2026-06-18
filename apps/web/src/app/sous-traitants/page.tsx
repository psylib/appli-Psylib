import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Liste des sous-traitants | PsyLib",
  description:
    "Liste complete des sous-traitants techniques de PsyLib. Hebergement HDS, paiement, emails, IA, monitoring. Transparence RGPD.",
  alternates: { canonical: 'https://psylib.eu/sous-traitants' },
  openGraph: {
    title: "Liste des sous-traitants | PsyLib",
    description:
      "Sous-traitants de PsyLib : AZNETWORK (HDS V2 + ISO 27001), Stripe, Resend, OpenRouter. Transparence totale.",
    url: 'https://psylib.eu/sous-traitants',
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
      '@type': 'WebPage',
      name: "Liste des sous-traitants",
      url: 'https://psylib.eu/sous-traitants',
      description: "Liste des sous-traitants techniques de PsyLib.",
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      dateModified: '2026-05-07',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        {
          '@type': 'ListItem',
          position: 2,
          name: "Sous-traitants",
          item: 'https://psylib.eu/sous-traitants',
        },
      ],
    },
  ],
};

export default function SousTraitantsPage() {
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
          <span className="text-gray-700">Sous-traitants</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Transparence RGPD — Derniere mise a jour : Mai 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Liste des sous-traitants
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Conformement a notre{' '}
            <Link href="/dpa" className="text-[#3D52A0] hover:underline">
              accord de traitement des donnees (DPA)
            </Link>
            , voici la liste complete des sous-traitants techniques auxquels PsyLib fait appel.
            Toute modification de cette liste est notifiee par email 30 jours avant sa prise d&apos;effet.
          </p>
        </header>

        {/* Hébergement et infrastructure */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Hebergement et infrastructure
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="font-semibold text-[#1E1B4B]">AZNETWORK</h3>
                <span className="rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-800">
                  HDS V2 · ISO 27001
                </span>
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                <li><strong>Role :</strong> hebergement des serveurs API, base de donnees PostgreSQL, authentification Keycloak, visio-consultation (LiveKit), sauvegardes et infogerance (administration et exploitation du systeme — activite 5 HDS)</li>
                <li><strong>Donnees traitees :</strong> toutes les donnees de sante (notes, messages, dossiers patients), donnees d&apos;authentification, sauvegardes</li>
                <li><strong>Localisation :</strong> Alencon (France) — PRA sur un second datacenter francais certifie</li>
                <li><strong>Certification HDS :</strong> HDS V2 certifie sur les 6 activites + ISO/IEC 27001:2022 — conforme article L.1111-8 du Code de la sante publique</li>
                <li><strong>Site web :</strong> <a href="https://www.aznetwork.eu/" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">aznetwork.eu</a></li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="font-semibold text-[#1E1B4B]">Vercel Inc.</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Pas de donnees de sante
                </span>
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                <li><strong>Role :</strong> hebergement du frontend (site marketing et interface utilisateur)</li>
                <li><strong>Donnees traitees :</strong> aucune donnee de sante. Les appels API transitent directement vers le serveur HDS. Seuls des cookies de session et des assets statiques sont servis.</li>
                <li><strong>Localisation :</strong> USA (CDN mondial avec edge en Europe)</li>
                <li><strong>Site web :</strong> <a href="https://vercel.com" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">vercel.com</a></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Paiement */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Paiement
          </h2>

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="font-semibold text-[#1E1B4B]">Stripe</h3>
              <span className="rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-medium text-blue-800">
                PCI-DSS Niveau 1
              </span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              <li><strong>Role :</strong> traitement des paiements par carte bancaire, gestion des abonnements, facturation</li>
              <li><strong>Donnees traitees :</strong> nom, email, donnees de carte bancaire (stockees exclusivement chez Stripe), historique de paiement, montants factures</li>
              <li><strong>Donnees de sante :</strong> aucune</li>
              <li><strong>Localisation :</strong> Irlande (Stripe Technology Europe Ltd) — transferts USA encadres par SCC</li>
              <li><strong>Certification :</strong> PCI-DSS niveau 1 (plus haut niveau de certification paiement)</li>
              <li><strong>Site web :</strong> <a href="https://stripe.com/fr" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">stripe.com</a></li>
            </ul>
          </div>
        </section>

        {/* Email */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Emails transactionnels
          </h2>

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="font-semibold text-[#1E1B4B]">Resend (via Amazon SES)</h3>
              <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                Pas de donnees de sante
              </span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              <li><strong>Role :</strong> envoi des emails transactionnels (confirmations, rappels de rendez-vous, notifications, factures)</li>
              <li><strong>Donnees traitees :</strong> adresse email du destinataire, nom, objet et contenu du mail (jamais de notes cliniques ni de donnees de sante)</li>
              <li><strong>Domaine d&apos;envoi :</strong> noreply@send.psylib.eu (authentifie SPF + DKIM)</li>
              <li><strong>Localisation :</strong> EU (Amazon SES region Europe)</li>
              <li><strong>Site web :</strong> <a href="https://resend.com" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">resend.com</a></li>
            </ul>
          </div>
        </section>

        {/* IA */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Intelligence artificielle
          </h2>

          <div className="rounded-xl border border-gray-200 p-5">
            <div className="mb-2 flex items-center gap-3">
              <h3 className="font-semibold text-[#1E1B4B]">OpenRouter</h3>
              <span className="rounded-full bg-amber-100 px-2.5 py-0.5 text-xs font-medium text-amber-800">
                Opt-in uniquement
              </span>
            </div>
            <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
              <li><strong>Role :</strong> routage vers les modeles d&apos;IA (Claude, GPT) pour les fonctionnalites de resume de seance et generation d&apos;exercices</li>
              <li><strong>Donnees traitees :</strong> extraits de notes cliniques anonymises/pseudonymises, transmis uniquement sur demande explicite du praticien</li>
              <li><strong>Consentement :</strong> le praticien doit activer l&apos;IA manuellement et donner son consentement explicite avant toute transmission</li>
              <li><strong>Localisation :</strong> USA</li>
              <li><strong>Garanties :</strong> les donnees transmises ne sont pas utilisees pour l&apos;entrainement des modeles</li>
              <li><strong>Site web :</strong> <a href="https://openrouter.ai" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">openrouter.ai</a></li>
            </ul>
          </div>
        </section>

        {/* Monitoring */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Monitoring et analytics
          </h2>

          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="font-semibold text-[#1E1B4B]">Sentry</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Pas de donnees de sante
                </span>
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                <li><strong>Role :</strong> monitoring des erreurs applicatives et performance</li>
                <li><strong>Donnees traitees :</strong> stack traces, metadata techniques (navigateur, OS, URL). Aucune donnee patient ni donnee de sante.</li>
                <li><strong>Localisation :</strong> USA — encadre par SCC</li>
                <li><strong>Site web :</strong> <a href="https://sentry.io" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">sentry.io</a></li>
              </ul>
            </div>

            <div className="rounded-xl border border-gray-200 p-5">
              <div className="mb-2 flex items-center gap-3">
                <h3 className="font-semibold text-[#1E1B4B]">PostHog</h3>
                <span className="rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-medium text-gray-600">
                  Marketing uniquement
                </span>
              </div>
              <ul className="list-inside list-disc space-y-1 text-sm text-gray-700">
                <li><strong>Role :</strong> analytics produit sur les pages marketing uniquement</li>
                <li><strong>Donnees traitees :</strong> pages visitees, parcours utilisateur, temps de session. Actif uniquement sur les pages marketing, jamais dans l&apos;application.</li>
                <li><strong>Donnees de sante :</strong> aucune. Aucune collecte sur les pages de l&apos;espace praticien ou patient.</li>
                <li><strong>Consentement :</strong> soumis au consentement prealable via banniere cookies</li>
                <li><strong>Localisation :</strong> EU (PostHog Cloud EU)</li>
                <li><strong>Site web :</strong> <a href="https://posthog.com" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">posthog.com</a></li>
              </ul>
            </div>
          </div>
        </section>

        {/* Résumé */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Resume
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-3 font-semibold text-[#1E1B4B]">Sous-traitant</th>
                  <th className="py-3 pr-3 font-semibold text-[#1E1B4B]">Role</th>
                  <th className="py-3 pr-3 font-semibold text-[#1E1B4B]">Localisation</th>
                  <th className="py-3 pr-3 font-semibold text-[#1E1B4B]">HDS</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Donnees sante</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">AZNETWORK</td>
                  <td className="py-3 pr-3">Hebergement, DB, auth, backups, visio, infogerance</td>
                  <td className="py-3 pr-3">France</td>
                  <td className="py-3 pr-3 text-green-700 font-medium">Oui</td>
                  <td className="py-3 text-green-700 font-medium">Oui</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">Vercel</td>
                  <td className="py-3 pr-3">Frontend</td>
                  <td className="py-3 pr-3">USA</td>
                  <td className="py-3 pr-3 text-gray-400">Non requis</td>
                  <td className="py-3 text-gray-400">Non</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">Stripe</td>
                  <td className="py-3 pr-3">Paiements</td>
                  <td className="py-3 pr-3">Irlande/USA</td>
                  <td className="py-3 pr-3 text-gray-400">N/A</td>
                  <td className="py-3 text-gray-400">Non</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">Resend</td>
                  <td className="py-3 pr-3">Emails transactionnels</td>
                  <td className="py-3 pr-3">EU</td>
                  <td className="py-3 pr-3 text-gray-400">N/A</td>
                  <td className="py-3 text-gray-400">Non</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">OpenRouter</td>
                  <td className="py-3 pr-3">IA (opt-in)</td>
                  <td className="py-3 pr-3">USA</td>
                  <td className="py-3 pr-3 text-gray-400">N/A</td>
                  <td className="py-3 text-amber-600 font-medium">Anonymise</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-3 font-medium">Sentry</td>
                  <td className="py-3 pr-3">Monitoring erreurs</td>
                  <td className="py-3 pr-3">USA</td>
                  <td className="py-3 pr-3 text-gray-400">N/A</td>
                  <td className="py-3 text-gray-400">Non</td>
                </tr>
                <tr>
                  <td className="py-3 pr-3 font-medium">PostHog</td>
                  <td className="py-3 pr-3">Analytics marketing</td>
                  <td className="py-3 pr-3">EU</td>
                  <td className="py-3 pr-3 text-gray-400">N/A</td>
                  <td className="py-3 text-gray-400">Non</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* Notification */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Notification de modification
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Conformement a notre{' '}
              <Link href="/dpa" className="text-[#3D52A0] hover:underline">DPA</Link>
              , toute modification de cette liste est notifiee par email aux praticiens 30 jours
              avant sa prise d&apos;effet. En cas de question ou d&apos;objection :
            </p>
            <p className="text-gray-700">
              <strong>Contact DPO :</strong>{' '}
              <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
                tony@psylib.eu
              </a>
            </p>
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Derniere mise a jour : Mai 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/dpa" className="text-[#3D52A0] hover:underline">DPA</Link>
            {' '}|{' '}
            <Link href="/privacy" className="text-[#3D52A0] hover:underline">Politique de confidentialite</Link>
            {' '}|{' '}
            <Link href="/legal" className="text-[#3D52A0] hover:underline">Mentions legales</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
