import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions Generales de Vente (CGV) | PsyLib",
  description:
    "Conditions generales de vente de PsyLib. Tarifs, modalites de paiement, facturation, droit de retractation, garanties. Logiciel SaaS pour psychologues liberaux.",
  alternates: { canonical: 'https://psylib.eu/cgv' },
  openGraph: {
    title: "Conditions Generales de Vente (CGV) | PsyLib",
    description:
      "CGV de PsyLib : tarifs, paiement, facturation, retractation, garanties. SaaS conforme HDS pour psychologues.",
    url: 'https://psylib.eu/cgv',
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
      name: "Conditions Generales de Vente (CGV)",
      url: 'https://psylib.eu/cgv',
      description:
        "Conditions generales de vente de PsyLib, logiciel SaaS pour psychologues liberaux.",
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
          name: "Conditions Generales de Vente",
          item: 'https://psylib.eu/cgv',
        },
      ],
    },
  ],
};

export default function CgvPage() {
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
          <span className="text-gray-700">Conditions Generales de Vente</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Document contractuel — Derniere mise a jour : Mai 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Conditions Generales de Vente (CGV)
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Les presentes Conditions Generales de Vente regissent les relations commerciales entre
            PsyLib et ses utilisateurs professionnels. Elles completent les{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">
              Conditions Generales d&apos;Utilisation (CGU)
            </Link>.
          </p>
        </header>

        {/* 1. Vendeur */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Identification du vendeur
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <ul className="list-inside list-disc space-y-2 text-gray-700">
              <li><strong>Denomination :</strong> PsyLib</li>
              <li><strong>Exploitant :</strong> Tony Ruppel, micro-entreprise</li>
              <li><strong>SIRET :</strong> 102 784 956 00017</li>
              <li><strong>Siege social :</strong> France</li>
              <li>
                <strong>Email :</strong>{' '}
                <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
                  tony@psylib.eu
                </a>
              </li>
              <li>
                <strong>Site web :</strong>{' '}
                <a href="https://psylib.eu" className="text-[#3D52A0] hover:underline">
                  https://psylib.eu
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Objet */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Objet
          </h2>
          <p className="leading-relaxed">
            Les presentes CGV ont pour objet de definir les conditions dans lesquelles PsyLib
            fournit a ses clients professionnels (psychologues, psychiatres, psychotherapeutes,
            psychanalystes et psychopraticiens exercant en liberal) un acces a sa plateforme
            SaaS de gestion de cabinet, accessible via le site{' '}
            <a href="https://psylib.eu" className="text-[#3D52A0] hover:underline">
              psylib.eu
            </a>{' '}
            et l&apos;application mobile PsyLib.
          </p>
        </section>

        {/* 3. Offres et tarifs */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Offres et tarifs
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3.1. Plans disponibles
          </h3>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Plan</th>
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Mensuel</th>
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Annuel</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Inclus</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Free</td>
                  <td className="py-3 pr-4">0 euros</td>
                  <td className="py-3 pr-4">0 euros</td>
                  <td className="py-3">Patients et sessions illimites, comptabilite, notes cliniques chiffrees</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Solo</td>
                  <td className="py-3 pr-4">25 euros HT</td>
                  <td className="py-3 pr-4">22 euros HT/mois</td>
                  <td className="py-3">Free + 10 resumes IA/mois, visio-consultation illimitee</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Pro</td>
                  <td className="py-3 pr-4">40 euros HT</td>
                  <td className="py-3 pr-4">36 euros HT/mois</td>
                  <td className="py-3">Solo + IA illimitee, AI Scribe, portail patient, analytics</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Clinic</td>
                  <td className="py-3 pr-4">79 euros HT</td>
                  <td className="py-3 pr-4">69 euros HT/mois</td>
                  <td className="py-3">Pro + multi-praticiens, support prioritaire, API</td>
                </tr>
              </tbody>
            </table>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3.2. Nature des prix
          </h3>
          <p className="mb-4 leading-relaxed">
            Les prix sont exprimes en euros hors taxes (HT). La TVA applicable sera ajoutee
            au moment de la facturation selon la reglementation en vigueur. Les tarifs sont
            susceptibles d&apos;etre revises par PsyLib. Toute revision tarifaire sera notifiee
            par email au moins 30 jours avant son entree en vigueur. L&apos;utilisateur qui
            n&apos;accepte pas la revision peut resilier son abonnement avant la date d&apos;effet.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            3.3. Offres speciales
          </h3>
          <p className="leading-relaxed">
            PsyLib peut proposer des offres speciales (offre fondateur, tarifs reduits, promotions
            temporaires). Les conditions specifiques de ces offres sont detaillees dans les
            documents contractuels correspondants et priment sur les presentes CGV pour les
            clauses qui leur sont propres.
          </p>
        </section>

        {/* 4. Commande et souscription */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Commande et souscription
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4.1. Processus de souscription
          </h3>
          <p className="mb-4 leading-relaxed">
            La souscription a un plan payant s&apos;effectue en ligne via le tableau de bord
            PsyLib. L&apos;utilisateur selectionne le plan souhaite et procede au paiement
            par carte bancaire via notre prestataire Stripe. La souscription est effective des
            la confirmation du paiement.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            4.2. Mise a disposition du service
          </h3>
          <p className="leading-relaxed">
            L&apos;acces aux fonctionnalites du plan souscrit est active immediatement apres
            la confirmation du paiement. En cas de changement de plan (upgrade), les nouvelles
            fonctionnalites sont accessibles immediatement. En cas de downgrade, le plan actuel
            reste actif jusqu&apos;a la fin de la periode de facturation en cours.
          </p>
        </section>

        {/* 5. Paiement */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Modalites de paiement
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5.1. Moyen de paiement
          </h3>
          <p className="mb-4 leading-relaxed">
            Le paiement s&apos;effectue exclusivement par carte bancaire (Visa, Mastercard,
            American Express) via la plateforme securisee Stripe, certifiee PCI-DSS niveau 1.
            PsyLib ne stocke aucune donnee de carte bancaire sur ses propres serveurs.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5.2. Periodicite
          </h3>
          <p className="mb-4 leading-relaxed">
            L&apos;abonnement est facture mensuellement ou annuellement selon le choix de
            l&apos;utilisateur. Le prelevement est automatique a chaque date anniversaire de
            la souscription. En cas d&apos;abonnement annuel, le montant total est preleve en
            une seule fois lors de la souscription.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5.3. Echec de paiement
          </h3>
          <p className="leading-relaxed">
            En cas d&apos;echec de paiement, PsyLib envoie une notification par email.
            L&apos;utilisateur dispose de 14 jours pour regulariser sa situation. Passe ce
            delai, un second rappel est envoye. Si le paiement n&apos;est pas regularise sous
            30 jours au total, PsyLib se reserve le droit de suspendre l&apos;acces aux
            fonctionnalites payantes (retour au plan Free). Les donnees restent conservees
            et accessibles en lecture.
          </p>
        </section>

        {/* 6. Facturation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Facturation
          </h2>
          <p className="mb-4 leading-relaxed">
            Une facture est emise automatiquement a chaque prelevement et mise a disposition
            dans l&apos;espace &quot;Facturation&quot; du tableau de bord. Les factures sont
            egalement envoyees par email a l&apos;adresse associee au compte.
          </p>
          <p className="leading-relaxed">
            Les factures mentionnent la denomination du service, la periode de facturation,
            le montant HT, la TVA applicable et le montant TTC. Conformement aux obligations
            legales, les factures sont conservees pendant 10 ans.
          </p>
        </section>

        {/* 7. Droit de rétractation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Droit de retractation
          </h2>
          <div className="mb-4 rounded-xl border-2 border-[#3D52A0]/20 bg-[#F8F7FF] p-4">
            <p className="text-sm font-medium text-[#3D52A0]">
              PsyLib s&apos;adresse exclusivement a des professionnels (psychologues, psychiatres,
              psychotherapeutes). En application de l&apos;article L.221-3 du Code de la consommation,
              le droit de retractation de 14 jours ne s&apos;applique pas aux contrats conclus entre
              professionnels.
            </p>
          </div>
          <p className="leading-relaxed">
            Neanmoins, PsyLib offre une garantie de satisfaction : tout utilisateur peut resilier
            son abonnement a tout moment sans justification. La resiliation prend effet a la fin
            de la periode de facturation en cours et aucun remboursement au prorata n&apos;est
            effectue. Le plan Free etant gratuit, il constitue une alternative permanente pour
            tester le service sans engagement.
          </p>
        </section>

        {/* 8. Durée et renouvellement */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Duree et renouvellement
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;abonnement est souscrit pour une duree d&apos;un mois (abonnement mensuel) ou
            d&apos;un an (abonnement annuel). Il est renouvele automatiquement par tacite
            reconduction pour une duree equivalente, sauf resiliation par l&apos;utilisateur
            avant la date de renouvellement.
          </p>
          <p className="leading-relaxed">
            L&apos;utilisateur peut annuler le renouvellement automatique a tout moment depuis
            les parametres de facturation de son tableau de bord. L&apos;annulation prend effet
            a la fin de la periode en cours.
          </p>
        </section>

        {/* 9. Résiliation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Resiliation
          </h2>
          <p className="mb-4 leading-relaxed">
            La resiliation peut etre effectuee :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Par l&apos;utilisateur :</strong> a tout moment, depuis le tableau de bord
              (Parametres &gt; Facturation). La resiliation prend effet a la fin de la periode
              de facturation en cours.
            </li>
            <li>
              <strong>Par PsyLib :</strong> en cas de violation des CGU ou CGV, de defaut de paiement
              persistant (&gt; 30 jours), ou de comportement portant atteinte a la securite du service.
              L&apos;utilisateur est notifie par email avec un preavis de 15 jours.
            </li>
          </ul>
          <p className="leading-relaxed">
            A la resiliation, l&apos;utilisateur conserve l&apos;acces a ses donnees pendant 90 jours
            pour permettre l&apos;export (droit a la portabilite RGPD). Passe ce delai, les donnees
            sont supprimees de maniere securisee, a l&apos;exception de celles dont la conservation
            est imposee par la loi (factures : 10 ans).
          </p>
        </section>

        {/* 10. Garanties */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            10. Garanties et responsabilite
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib s&apos;engage a fournir un service conforme a sa description et a mettre en
            oeuvre les moyens necessaires pour assurer sa disponibilite et sa securite. PsyLib
            garantit notamment :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>L&apos;hebergement des donnees de sante sur infrastructure certifiee HDS en France</li>
            <li>Le chiffrement AES-256-GCM des donnees cliniques sensibles</li>
            <li>La sauvegarde quotidienne des donnees</li>
            <li>Un taux de disponibilite cible de 99,5 % par mois</li>
          </ul>
          <p className="mb-4 leading-relaxed">
            La responsabilite de PsyLib ne saurait exceder le montant des sommes versees par
            l&apos;utilisateur au cours des 12 mois precedant le fait generateur. PsyLib ne
            peut etre tenu responsable des dommages indirects, de la perte de donnees resultant
            d&apos;une faute de l&apos;utilisateur, ou des decisions cliniques prises sur la base
            des outils fournis.
          </p>
        </section>

        {/* 11. Propriété des données */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            11. Propriete des donnees
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;utilisateur reste proprietaire de toutes les donnees qu&apos;il saisit dans
            PsyLib (dossiers patients, notes de seance, factures, documents). PsyLib n&apos;acquiert
            aucun droit sur ces contenus.
          </p>
          <p className="leading-relaxed">
            A tout moment, l&apos;utilisateur peut exporter l&apos;integralite de ses donnees
            depuis le tableau de bord (formats CSV et PDF). En cas de resiliation, les donnees
            restent exportables pendant 90 jours.
          </p>
        </section>

        {/* 12. Droit applicable */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            12. Droit applicable et litiges
          </h2>
          <p className="mb-4 leading-relaxed">
            Les presentes CGV sont soumises au droit francais. En cas de litige, les parties
            s&apos;efforceront de trouver une solution amiable dans un delai de 30 jours. A
            defaut, le litige sera soumis aux tribunaux competents de Nancy (France).
          </p>
        </section>

        {/* 13. Contact */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            13. Contact
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Pour toute question relative aux presentes CGV :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>
                <strong>Contact commercial :</strong>{' '}
                <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
                  tony@psylib.eu
                </a>
              </li>
              <li>
                <strong>Facturation :</strong>{' '}
                <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
                  tony@psylib.eu
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Commencez gratuitement
          </h2>
          <p className="mb-6 text-white/80">
            Logiciel de gestion de cabinet conforme HDS, concu pour les psychologues
            liberaux. Plan Free sans engagement, sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Derniere mise a jour : Mai 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>
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
