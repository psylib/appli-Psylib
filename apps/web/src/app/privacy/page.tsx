import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Politique de confidentialite — RGPD | PsyLib",
  description:
    "Politique de confidentialite et protection des donnees personnelles de PsyLib. Hebergement HDS certifie France, chiffrement AES-256-GCM, conformite RGPD. Droits d'acces, rectification, suppression.",
  alternates: { canonical: 'https://psylib.eu/privacy' },
  openGraph: {
    title: "Politique de confidentialite — RGPD | PsyLib",
    description:
      "Decouvrez comment PsyLib protege vos donnees de sante. Hebergement HDS France, chiffrement AES-256-GCM, conformite RGPD complete.",
    url: 'https://psylib.eu/privacy',
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
      name: "Politique de confidentialite — RGPD",
      url: 'https://psylib.eu/privacy',
      description:
        "Politique de confidentialite et protection des donnees personnelles de PsyLib. Hebergement HDS, chiffrement AES-256-GCM, conformite RGPD.",
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      dateModified: '2026-03-20',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        {
          '@type': 'ListItem',
          position: 2,
          name: 'Politique de confidentialite',
          item: 'https://psylib.eu/privacy',
        },
      ],
    },
  ],
};

export default function PrivacyPage() {
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
          <span className="text-gray-700">Politique de confidentialite</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Protection des donnees — Derniere mise a jour : Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Politique de confidentialite
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            PsyLib s&apos;engage a proteger la vie privee de ses utilisateurs et a
            traiter les donnees personnelles dans le respect du Reglement General sur
            la Protection des Donnees (RGPD) et de la loi Informatique et Libertes.
          </p>
        </header>

        {/* 1. Responsable du traitement */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Responsable du traitement
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-2 leading-relaxed">
              Le responsable du traitement des donnees personnelles est :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li><strong>Raison sociale :</strong> PsyLib (en cours d&apos;immatriculation)</li>
              <li><strong>Adresse :</strong> France</li>
              <li><strong>Email de contact :</strong> contact@psylib.eu</li>
              <li><strong>Delegue a la Protection des Donnees (DPO) :</strong> dpo@psylib.eu</li>
            </ul>
          </div>
        </section>

        {/* 2. Données collectées */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Donnees collectees
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib collecte differentes categories de donnees en fonction du role de
            l&apos;utilisateur et de l&apos;utilisation du service :
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2.1. Donnees du praticien (psychologue)
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Nom, prenom, adresse email professionnelle</li>
            <li>Numero ADELI (obligatoire pour l&apos;exercice legal)</li>
            <li>Adresse du cabinet, numero de telephone professionnel</li>
            <li>Specialisations et approches therapeutiques</li>
            <li>Donnees de facturation et d&apos;abonnement (gerees via Stripe)</li>
            <li>Preferences d&apos;utilisation du logiciel</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2.2. Donnees patient
          </h3>
          <p className="mb-4 leading-relaxed">
            Les donnees patient sont saisies exclusivement par le psychologue dans le
            cadre de sa relation therapeutique. PsyLib agit en qualite de sous-traitant
            au sens du RGPD pour ces donnees. Le psychologue demeure le responsable du
            traitement des donnees de ses patients.
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Identite du patient (nom, prenom, email, telephone)</li>
            <li>Date de naissance</li>
            <li>Notes de seance et notes cliniques (<strong>chiffrees AES-256-GCM</strong>)</li>
            <li>Resumes de seance generes par l&apos;IA (<strong>chiffres AES-256-GCM</strong>)</li>
            <li>Donnees du portail patient : suivi d&apos;humeur, journal therapeutique, exercices</li>
            <li>Messages echanges entre le psychologue et le patient (<strong>chiffres AES-256-GCM</strong>)</li>
            <li>Rendez-vous et historique des seances</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2.3. Donnees de navigation
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Adresse IP (anonymisee dans les outils d&apos;analyse)</li>
            <li>Type de navigateur et systeme d&apos;exploitation</li>
            <li>Pages visitees et duree de visite (via PostHog — site marketing uniquement)</li>
            <li>Cookies techniques necessaires au fonctionnement du service</li>
          </ul>
        </section>

        {/* 3. Finalités */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Finalites du traitement
          </h2>
          <p className="mb-4 leading-relaxed">
            Les donnees personnelles collectees sont utilisees pour les finalites suivantes :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Fourniture du service :</strong> gestion du compte praticien, gestion des
              dossiers patients, prise de rendez-vous, facturation, messagerie securisee
            </li>
            <li>
              <strong>Amelioration du service :</strong> analyse d&apos;utilisation anonymisee pour
              ameliorer l&apos;experience utilisateur (jamais de donnees patient)
            </li>
            <li>
              <strong>Securite :</strong> audit des acces, detection des intrusions, journalisation
              des connexions (conformite HDS)
            </li>
            <li>
              <strong>Communication :</strong> emails transactionnels (confirmation de rendez-vous,
              rappels, factures), sequences d&apos;accueil
            </li>
            <li>
              <strong>Obligations legales :</strong> conservation des donnees de facturation
              conformement au Code de commerce et au Code general des impots
            </li>
          </ul>
        </section>

        {/* 4. Base légale */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Base legale du traitement
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Execution du contrat (Art. 6.1.b RGPD)</h3>
              <p className="text-gray-700">
                Le traitement des donnees du praticien est necessaire a l&apos;execution du contrat
                d&apos;abonnement PsyLib (creation de compte, gestion de l&apos;abonnement, facturation,
                fourniture des fonctionnalites du logiciel).
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Consentement (Art. 6.1.a RGPD)</h3>
              <p className="text-gray-700">
                Le consentement explicite est recueilli pour l&apos;utilisation des fonctionnalites
                d&apos;intelligence artificielle (resume de seance, generation d&apos;exercices),
                les cookies d&apos;analyse (PostHog) et l&apos;envoi de communications marketing.
                Le consentement peut etre retire a tout moment.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Interet legitime (Art. 6.1.f RGPD)</h3>
              <p className="text-gray-700">
                L&apos;interet legitime de PsyLib justifie le traitement des donnees a des fins de
                securite du service (audit des connexions, detection d&apos;anomalies), d&apos;amelioration
                du produit (analyse d&apos;utilisation anonymisee) et de prevention de la fraude.
              </p>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Obligation legale (Art. 6.1.c RGPD)</h3>
              <p className="text-gray-700">
                La conservation des donnees de facturation et des logs d&apos;acces est imposee par
                la legislation francaise (Code de commerce, Code general des impots, article
                L.1111-8 du Code de la sante publique pour l&apos;hebergement HDS).
              </p>
            </div>
          </div>
        </section>

        {/* 5. Durée de conservation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Duree de conservation
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Type de donnees</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Duree de conservation</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Compte praticien</td>
                  <td className="py-3">Duree du contrat + 3 ans apres resiliation</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Dossiers patients</td>
                  <td className="py-3">Duree fixee par le praticien (min. 5 ans — recommandation ordinale)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Notes de seance</td>
                  <td className="py-3">Duree du dossier patient associe</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Donnees de facturation</td>
                  <td className="py-3">10 ans (obligation legale comptable)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Logs d&apos;audit</td>
                  <td className="py-3">12 mois (obligation HDS)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4">Donnees de navigation</td>
                  <td className="py-3">13 mois maximum (recommandation CNIL)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4">Consentements RGPD</td>
                  <td className="py-3">Duree du consentement + 5 ans (preuve)</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mt-4 leading-relaxed">
            A l&apos;expiration de ces durees, les donnees sont supprimees de maniere securisee
            ou anonymisees de facon irreversible.
          </p>
        </section>

        {/* 6. Hébergement et sécurité */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Hebergement et securite des donnees
          </h2>
          <div className="mb-6 rounded-2xl bg-[#F1F0F9] p-6">
            <h3 className="mb-3 font-semibold text-[#1E1B4B]">Hebergement certifie HDS</h3>
            <p className="mb-4 leading-relaxed">
              Conformement a l&apos;article L.1111-8 du Code de la sante publique, toutes les
              donnees de sante sont hebergees sur une infrastructure certifiee Hebergeur de
              Donnees de Sante (HDS) situee en France :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li><strong>AWS eu-west-3 (Paris) :</strong> base de donnees PostgreSQL, API backend, stockage fichiers — certifie HDS depuis 2022</li>
              <li><strong>OVH (France) :</strong> serveur d&apos;authentification Keycloak, sauvegardes — certifie HDS</li>
            </ul>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Mesures de securite techniques
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Chiffrement au repos :</strong> AES-256-GCM sur les champs sensibles
              (notes de seance, resumes IA, messages, journal therapeutique) au niveau applicatif,
              en complement du chiffrement natif de la base de donnees (AWS RDS AES-256)
            </li>
            <li>
              <strong>Chiffrement en transit :</strong> TLS 1.3 sur toutes les communications
            </li>
            <li>
              <strong>Authentification forte :</strong> Keycloak avec OIDC, authentification
              multi-facteurs (MFA TOTP) obligatoire pour les praticiens
            </li>
            <li>
              <strong>Controle d&apos;acces :</strong> RBAC (Role-Based Access Control) avec
              isolation multi-tenant par psychologue
            </li>
            <li>
              <strong>Audit des acces :</strong> journalisation de tous les acces aux donnees
              sensibles dans une table d&apos;audit dediee
            </li>
            <li>
              <strong>Sauvegardes :</strong> sauvegardes automatiques quotidiennes avec retention
              de 7 jours, stockees sur infrastructure HDS distincte
            </li>
            <li>
              <strong>Rotation des cles :</strong> systeme de versionnement des cles de chiffrement
              avec migration progressive des donnees
            </li>
          </ul>
        </section>

        {/* 7. Sous-traitants */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Sous-traitants et services tiers
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib fait appel a des sous-traitants pour le fonctionnement de certaines
            fonctionnalites. <strong>Aucune donnee patient n&apos;est transmise a ces services.</strong>
          </p>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Service</th>
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Usage</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Donnees concernees</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Stripe</td>
                  <td className="py-3 pr-4">Paiement et facturation des abonnements</td>
                  <td className="py-3">Email du praticien, donnees de carte bancaire (tokenisees par Stripe, jamais stockees chez PsyLib)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Resend</td>
                  <td className="py-3 pr-4">Envoi d&apos;emails transactionnels</td>
                  <td className="py-3">Adresse email du destinataire (praticien uniquement)</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Sentry</td>
                  <td className="py-3 pr-4">Monitoring des erreurs techniques</td>
                  <td className="py-3">Donnees techniques uniquement (stack traces) — aucune donnee patient</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">PostHog</td>
                  <td className="py-3 pr-4">Analyse d&apos;utilisation du site marketing</td>
                  <td className="py-3">Donnees de navigation anonymisees du praticien — aucune donnee patient</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Vercel</td>
                  <td className="py-3 pr-4">Hebergement du site web (frontend)</td>
                  <td className="py-3">Pages statiques et interface utilisateur — aucune donnee de sante</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Anthropic (Claude API)</td>
                  <td className="py-3 pr-4">Fonctionnalites d&apos;intelligence artificielle</td>
                  <td className="py-3">Donnees transmises uniquement avec consentement explicite du praticien — jamais de donnees identifiantes de patients</td>
                </tr>
              </tbody>
            </table>
          </div>
          <div className="mt-4 rounded-xl border-2 border-[#3D52A0]/20 bg-[#F8F7FF] p-4">
            <p className="text-sm font-medium text-[#3D52A0]">
              Engagement fondamental : les donnees de sante des patients (notes de seance,
              dossiers cliniques, messages) ne sont <strong>jamais</strong> transmises a des
              services tiers non certifies HDS. Elles restent exclusivement sur l&apos;infrastructure
              HDS certifiee (AWS eu-west-3 Paris + OVH France).
            </p>
          </div>
        </section>

        {/* 8. Transferts hors UE */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Transferts de donnees hors de l&apos;Union europeenne
          </h2>
          <p className="mb-4 leading-relaxed">
            Les donnees de sante sont hebergees exclusivement en France (AWS eu-west-3 Paris
            et OVH France). Aucun transfert de donnees de sante n&apos;est effectue hors de
            l&apos;Union europeenne.
          </p>
          <p className="leading-relaxed">
            Certains sous-traitants techniques (Stripe, Sentry, PostHog) peuvent traiter des
            donnees non sensibles (email du praticien, donnees de navigation anonymisees) dans
            des pays tiers. Ces transferts sont encadres par les Clauses Contractuelles Types
            (CCT) approuvees par la Commission europeenne et/ou le cadre EU-US Data Privacy
            Framework lorsque applicable.
          </p>
        </section>

        {/* 9. Droits des utilisateurs */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Droits des utilisateurs
          </h2>
          <p className="mb-4 leading-relaxed">
            Conformement au RGPD (articles 15 a 22) et a la loi Informatique et Libertes,
            vous disposez des droits suivants :
          </p>
          <div className="space-y-3">
            {[
              {
                title: "Droit d'acces (Art. 15)",
                desc: "Obtenir la confirmation que vos donnees sont traitees et en recevoir une copie.",
              },
              {
                title: "Droit de rectification (Art. 16)",
                desc: "Corriger les donnees inexactes ou completer les donnees incompletes.",
              },
              {
                title: "Droit a l'effacement (Art. 17)",
                desc: "Demander la suppression de vos donnees dans les conditions prevues par le RGPD. Un endpoint dedie permet la purge complete des donnees patient.",
              },
              {
                title: "Droit a la limitation (Art. 18)",
                desc: "Demander la limitation du traitement de vos donnees dans certaines circonstances.",
              },
              {
                title: "Droit a la portabilite (Art. 20)",
                desc: "Recevoir vos donnees dans un format structure et lisible par machine (export CSV/JSON disponible dans les parametres).",
              },
              {
                title: "Droit d'opposition (Art. 21)",
                desc: "Vous opposer au traitement de vos donnees fonde sur l'interet legitime, y compris le profilage.",
              },
              {
                title: "Droit de retirer le consentement",
                desc: "Retirer a tout moment votre consentement pour les traitements fondes sur celui-ci, sans affecter la licite du traitement anterieurement effectue.",
              },
            ].map((item) => (
              <div key={item.title} className="rounded-xl border border-gray-200 p-4">
                <h3 className="mb-1 font-semibold text-[#1E1B4B]">{item.title}</h3>
                <p className="text-sm text-gray-700">{item.desc}</p>
              </div>
            ))}
          </div>
          <div className="mt-6 rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-2 font-semibold text-[#1E1B4B]">Comment exercer vos droits</p>
            <p className="leading-relaxed text-gray-700">
              Vous pouvez exercer vos droits en contactant notre DPO a l&apos;adresse{' '}
              <a href="mailto:dpo@psylib.eu" className="text-[#3D52A0] hover:underline">
                dpo@psylib.eu
              </a>
              . Nous repondrons dans un delai maximum de 30 jours. Une verification
              d&apos;identite pourra etre demandee. En cas de difficulte, vous pouvez
              egalement introduire une reclamation aupres de la CNIL (Commission Nationale
              de l&apos;Informatique et des Libertes) sur{' '}
              <a
                href="https://www.cnil.fr"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3D52A0] hover:underline"
              >
                www.cnil.fr
              </a>
              .
            </p>
          </div>
        </section>

        {/* 10. Cookies */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            10. Cookies
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib utilise des cookies strictement necessaires au fonctionnement du service
            (authentification, preferences de session). Ces cookies ne necessitent pas de
            consentement.
          </p>
          <p className="mb-4 leading-relaxed">
            Des cookies d&apos;analyse (PostHog) sont utilises sur le site marketing pour
            comprendre l&apos;utilisation du service. Ces cookies sont soumis a votre
            consentement prealable et peuvent etre refuses sans impact sur le fonctionnement
            du service.
          </p>
          <p className="leading-relaxed">
            Aucun cookie publicitaire ou de tracking tiers n&apos;est utilise par PsyLib.
          </p>
        </section>

        {/* 11. Modifications */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            11. Modifications de la politique
          </h2>
          <p className="leading-relaxed">
            PsyLib se reserve le droit de modifier la presente politique de confidentialite.
            En cas de modification substantielle, les utilisateurs seront informes par email
            et/ou par notification dans l&apos;application au moins 30 jours avant l&apos;entree
            en vigueur des modifications. La date de derniere mise a jour est indiquee en haut
            de cette page.
          </p>
        </section>

        {/* 12. Contact */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            12. Contact
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Pour toute question relative a la protection de vos donnees personnelles :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>
                <strong>DPO :</strong>{' '}
                <a href="mailto:dpo@psylib.eu" className="text-[#3D52A0] hover:underline">
                  dpo@psylib.eu
                </a>
              </li>
              <li>
                <strong>Support general :</strong>{' '}
                <a href="mailto:support@psylib.eu" className="text-[#3D52A0] hover:underline">
                  support@psylib.eu
                </a>
              </li>
              <li>
                <strong>CNIL :</strong>{' '}
                <a
                  href="https://www.cnil.fr"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-[#3D52A0] hover:underline"
                >
                  www.cnil.fr
                </a>{' '}
                (en cas de reclamation)
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            La securite de vos donnees est notre priorite
          </h2>
          <p className="mb-6 text-white/80">
            Hebergement HDS certifie France, chiffrement AES-256-GCM, MFA obligatoire.
            Essayez PsyLib gratuitement pendant 14 jours.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer l&apos;essai gratuit
          </Link>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Derniere mise a jour : Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>
            {' '}|{' '}
            <Link href="/legal" className="text-[#3D52A0] hover:underline">Mentions legales</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
