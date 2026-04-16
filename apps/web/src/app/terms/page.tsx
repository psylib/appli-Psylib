import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions Generales d'Utilisation (CGU) | PsyLib",
  description:
    "Conditions generales d'utilisation de PsyLib, logiciel SaaS pour psychologues liberaux. Abonnement, obligations, propriete intellectuelle, responsabilite, droit francais.",
  alternates: { canonical: 'https://psylib.eu/terms' },
  openGraph: {
    title: "Conditions Generales d'Utilisation (CGU) | PsyLib",
    description:
      "CGU de PsyLib : abonnement, obligations du praticien et de PsyLib, facturation, resiliation, droit applicable.",
    url: 'https://psylib.eu/terms',
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
      name: "Conditions Generales d'Utilisation (CGU)",
      url: 'https://psylib.eu/terms',
      description:
        "Conditions generales d'utilisation de PsyLib, logiciel SaaS pour psychologues liberaux.",
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
          name: "Conditions Generales d'Utilisation",
          item: 'https://psylib.eu/terms',
        },
      ],
    },
  ],
};

export default function TermsPage() {
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
          <span className="text-gray-700">Conditions Generales d&apos;Utilisation</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Document contractuel — Derniere mise a jour : Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Conditions Generales d&apos;Utilisation (CGU)
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Les presentes Conditions Generales d&apos;Utilisation regissent l&apos;acces et
            l&apos;utilisation de la plateforme PsyLib. En creant un compte, vous acceptez
            l&apos;integralite de ces conditions.
          </p>
        </header>

        {/* 1. Objet */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Objet du service
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib est une plateforme SaaS (Software as a Service) destinee aux psychologues
            liberaux exercant en France. Le service fournit des outils de gestion de cabinet
            comprenant notamment :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Gestion des dossiers patients</li>
            <li>Prise de notes de seance securisees (chiffrement AES-256-GCM)</li>
            <li>Agenda et prise de rendez-vous en ligne</li>
            <li>Facturation et generation de notes d&apos;honoraires</li>
            <li>Suivi des resultats therapeutiques (outcome tracking)</li>
            <li>Espace patient securise (portail patient)</li>
            <li>Messagerie chiffree entre praticien et patient</li>
            <li>Assistant IA pour resumes de seance et exercices therapeutiques</li>
            <li>Reseau professionnel entre psychologues (supervision, intervision)</li>
            <li>Profil public et referencement dans l&apos;annuaire PsyLib</li>
          </ul>
          <p className="leading-relaxed">
            Le service est accessible via le site web{' '}
            <a href="https://psylib.eu" className="text-[#3D52A0] hover:underline">
              psylib.eu
            </a>{' '}
            et l&apos;application mobile PsyLib.
          </p>
        </section>

        {/* 2. Inscription */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Inscription et acces
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;inscription au service s&apos;effectue via le protocole d&apos;authentification
            securise OpenID Connect (OIDC) gere par Keycloak, heberge sur infrastructure
            certifiee HDS en France.
          </p>
          <p className="mb-4 leading-relaxed">
            Pour creer un compte, l&apos;utilisateur doit :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Etre psychologue diplome exerçant en France</li>
            <li>Fournir une adresse email professionnelle valide</li>
            <li>Activer l&apos;authentification multi-facteurs (MFA) lors de la premiere connexion</li>
            <li>Completer le parcours d&apos;onboarding (profil praticien, informations du cabinet)</li>
          </ul>
          <p className="leading-relaxed">
            L&apos;utilisateur est responsable de la confidentialite de ses identifiants de
            connexion. Tout acces realise avec ses identifiants est presume effectue par
            l&apos;utilisateur lui-meme.
          </p>
        </section>

        {/* 3. Obligations de l'utilisateur */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Obligations de l&apos;utilisateur
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;utilisateur s&apos;engage a :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Disposer d&apos;un numero ADELI valide :</strong> l&apos;exercice de
              la profession de psychologue en France est soumis a l&apos;enregistrement
              ADELI aupres de l&apos;ARS. PsyLib se reserve le droit de verifier la validite
              du numero ADELI fourni
            </li>
            <li>
              <strong>Respecter le Code de deontologie des psychologues :</strong> l&apos;utilisation
              du service ne dispense pas le praticien de ses obligations deontologiques, notamment
              en matiere de secret professionnel, de consentement eclaire et de tenue du dossier patient
            </li>
            <li>
              <strong>Informer ses patients :</strong> le praticien est tenu d&apos;informer ses
              patients de l&apos;utilisation d&apos;un logiciel de gestion de cabinet et de
              recueillir leur consentement conformement au RGPD
            </li>
            <li>
              <strong>Ne pas detourner le service :</strong> le service est reserve a un usage
              professionnel licite dans le cadre de l&apos;exercice de la psychologie
            </li>
            <li>
              <strong>Maintenir la securite de son compte :</strong> utiliser un mot de passe
              robuste, activer le MFA, ne pas partager ses identifiants
            </li>
            <li>
              <strong>Utiliser l&apos;IA de maniere responsable :</strong> les fonctionnalites
              d&apos;intelligence artificielle (resumes, exercices) sont des outils d&apos;aide
              a la decision. Le praticien reste seul responsable de ses actes professionnels et
              de ses decisions cliniques
            </li>
          </ul>
        </section>

        {/* 4. Obligations de PsyLib */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Obligations de PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib s&apos;engage a :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Disponibilite du service :</strong> mettre en oeuvre les moyens raisonnables
              pour assurer la disponibilite du service 24h/24, 7j/7, hors periodes de maintenance
              programmee. PsyLib vise un taux de disponibilite de 99,5 % par mois
            </li>
            <li>
              <strong>Securite des donnees :</strong> heberger toutes les donnees de sante sur
              infrastructure certifiee HDS en France (AWS eu-west-3 Paris et OVH), chiffrer les
              donnees sensibles avec AES-256-GCM, et mettre en oeuvre les mesures techniques et
              organisationnelles appropriees
            </li>
            <li>
              <strong>Conformite reglementaire :</strong> respecter les obligations de l&apos;article
              L.1111-8 du Code de la sante publique relatif a l&apos;hebergement de donnees de
              sante et le RGPD
            </li>
            <li>
              <strong>Sauvegardes :</strong> effectuer des sauvegardes automatiques quotidiennes
              des donnees avec une retention de 7 jours
            </li>
            <li>
              <strong>Support technique :</strong> fournir une assistance par email a
              l&apos;adresse support@psylib.eu, avec un delai de reponse de 48 heures ouvrees
            </li>
            <li>
              <strong>Transparence :</strong> informer les utilisateurs en cas d&apos;incident
              de securite affectant leurs donnees, conformement aux obligations legales
            </li>
          </ul>
        </section>

        {/* 5. Propriété intellectuelle */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Propriete intellectuelle
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;ensemble des elements composant le service PsyLib (code source, interfaces,
            design, textes, logos, base de donnees) est protege par le droit de la propriete
            intellectuelle et reste la propriete exclusive de PsyLib.
          </p>
          <p className="mb-4 leading-relaxed">
            L&apos;utilisateur beneficie d&apos;un droit d&apos;utilisation personnel, non
            exclusif et non cessible, limite a la duree de son abonnement. Toute reproduction,
            representation, modification ou exploitation non autorisee du service est interdite.
          </p>
          <p className="leading-relaxed">
            Les donnees saisies par l&apos;utilisateur (dossiers patients, notes de seance,
            factures) restent la propriete exclusive de l&apos;utilisateur. PsyLib ne revendique
            aucun droit sur le contenu genere par l&apos;utilisateur dans le cadre de son
            activite professionnelle.
          </p>
        </section>

        {/* 6. Données et confidentialité */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Donnees et confidentialite
          </h2>
          <p className="mb-4 leading-relaxed">
            Le traitement des donnees personnelles par PsyLib est decrit en detail dans notre{' '}
            <Link href="/privacy" className="text-[#3D52A0] hover:underline">
              Politique de confidentialite
            </Link>
            , qui fait partie integrante des presentes CGU.
          </p>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-2 font-semibold text-[#1E1B4B]">Points essentiels :</p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>Hebergement HDS certifie en France (AWS eu-west-3 + OVH)</li>
              <li>Chiffrement AES-256-GCM des donnees cliniques sensibles</li>
              <li>Authentification MFA obligatoire</li>
              <li>Audit de tous les acces aux donnees patients</li>
              <li>Droit a l&apos;effacement et export des donnees (portabilite RGPD)</li>
              <li>Aucune donnee patient transmise a des services tiers non HDS</li>
            </ul>
          </div>
        </section>

        {/* 7. Abonnement et facturation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Abonnement et facturation
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.1. Plan gratuit
          </h3>
          <p className="mb-4 leading-relaxed">
            Tout nouvel utilisateur beneficie d&apos;un plan Free gratuit pour toujours,
            sans engagement et sans carte bancaire. Ce plan inclut patients et sessions
            illimites. Pour acceder aux fonctionnalites avancees (IA, visio,
            portail patient), l&apos;utilisateur peut souscrire un abonnement payant a tout moment.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.2. Plans tarifaires
          </h3>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Plan</th>
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Prix mensuel</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Inclus</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Free</td>
                  <td className="py-3 pr-4">0 euros</td>
                  <td className="py-3">Patients illimites, sessions illimitees, notes cliniques</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Solo</td>
                  <td className="py-3 pr-4">25 euros HT</td>
                  <td className="py-3">Patients illimites, sessions illimitees, 10 resumes IA, visio illimitee</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Pro</td>
                  <td className="py-3 pr-4">40 euros HT</td>
                  <td className="py-3">Patients illimites, IA illimitee, portail patient, analytics</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Clinic</td>
                  <td className="py-3 pr-4">79 euros HT</td>
                  <td className="py-3">Tout illimite, multi-praticiens, support prioritaire, API</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="mb-4 leading-relaxed">
            Les prix sont exprimes en euros hors taxes. Les psychologues liberaux sont
            generalement exoneres de TVA (article 261-4-1 du CGI). Le cas echeant, la TVA
            applicable sera ajoutee.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.3. Facturation et paiement
          </h3>
          <p className="mb-4 leading-relaxed">
            Le paiement s&apos;effectue par carte bancaire via Stripe, prestataire de paiement
            certifie PCI-DSS. L&apos;abonnement est facture mensuellement, a terme echu.
            Les factures sont disponibles dans l&apos;espace &quot;Facturation&quot; du tableau
            de bord. En cas d&apos;echec de paiement, PsyLib se reserve le droit de suspendre
            l&apos;acces au service apres deux relances par email espacees de 7 jours.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.4. Changement de plan
          </h3>
          <p className="leading-relaxed">
            L&apos;utilisateur peut changer de plan a tout moment depuis son tableau de bord.
            L&apos;upgrade prend effet immediatement avec facturation au prorata. Le
            downgrade prend effet a la fin de la periode de facturation en cours.
          </p>
        </section>

        {/* 8. Résiliation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Resiliation
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            8.1. Resiliation par l&apos;utilisateur
          </h3>
          <p className="mb-4 leading-relaxed">
            L&apos;utilisateur peut resilier son abonnement a tout moment depuis les parametres
            de facturation de son tableau de bord. La resiliation prend effet a la fin de la
            periode de facturation en cours. L&apos;utilisateur conserve l&apos;acces au
            service jusqu&apos;a cette date.
          </p>
          <p className="mb-4 leading-relaxed">
            Apres la resiliation, les donnees de l&apos;utilisateur sont conservees pendant
            90 jours pour permettre un eventuel export (droit a la portabilite RGPD). Passe
            ce delai, les donnees sont supprimees de maniere securisee, a l&apos;exception
            des donnees dont la conservation est imposee par la loi (facturation : 10 ans).
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            8.2. Resiliation par PsyLib
          </h3>
          <p className="leading-relaxed">
            PsyLib se reserve le droit de suspendre ou de resilier le compte d&apos;un
            utilisateur en cas de violation des presentes CGU, d&apos;utilisation frauduleuse
            du service, de defaut de paiement persistant (au-dela de 30 jours) ou de
            comportement portant atteinte a la securite du service. Dans ce cas,
            l&apos;utilisateur est informe par email avec un preavis de 15 jours (sauf cas
            d&apos;urgence lie a la securite).
          </p>
        </section>

        {/* 9. Limitation de responsabilité */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Limitation de responsabilite
          </h2>
          <div className="mb-4 rounded-xl border-2 border-[#3D52A0]/20 bg-[#F8F7FF] p-4">
            <p className="text-sm font-medium text-[#3D52A0]">
              Avertissement important concernant l&apos;IA : les fonctionnalites d&apos;intelligence
              artificielle de PsyLib (resumes de seance, suggestions d&apos;exercices) sont des
              outils d&apos;aide a la decision. Elles ne constituent en aucun cas un avis medical
              ou psychologique. Le praticien est et reste seul responsable de ses decisions
              cliniques, de ses diagnostics et de la prise en charge de ses patients.
            </p>
          </div>
          <p className="mb-4 leading-relaxed">
            PsyLib met en oeuvre tous les moyens raisonnables pour assurer la qualite et la
            disponibilite du service. Toutefois, PsyLib ne saurait etre tenu responsable :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>
              Des interruptions temporaires du service liees a la maintenance, aux mises a jour
              ou a des evenements de force majeure
            </li>
            <li>
              Des dommages indirects (perte de chiffre d&apos;affaires, perte de patientele,
              prejudice d&apos;image) lies a l&apos;utilisation ou a l&apos;impossibilite
              d&apos;utiliser le service
            </li>
            <li>
              Du contenu saisi par l&apos;utilisateur et des decisions cliniques prises sur
              la base des outils fournis, y compris les suggestions de l&apos;IA
            </li>
            <li>
              Des consequences d&apos;une utilisation du service non conforme aux presentes
              CGU ou aux recommandations de securite
            </li>
          </ul>
          <p className="leading-relaxed">
            En tout etat de cause, la responsabilite de PsyLib est limitee au montant total
            des sommes versees par l&apos;utilisateur au cours des 12 mois precedant le fait
            generateur.
          </p>
        </section>

        {/* 10. Force majeure */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            10. Force majeure
          </h2>
          <p className="leading-relaxed">
            PsyLib ne saurait etre tenu responsable de l&apos;inexecution de ses obligations
            en cas de force majeure au sens de l&apos;article 1218 du Code civil, notamment
            en cas de catastrophe naturelle, pandemie, guerre, greve generale, panne du reseau
            internet ou de l&apos;infrastructure cloud, acte de cyberattaque de grande ampleur,
            ou decision gouvernementale. PsyLib s&apos;engage a informer l&apos;utilisateur
            dans les meilleurs delais et a reprendre l&apos;execution de ses obligations des
            que les circonstances le permettent.
          </p>
        </section>

        {/* 11. Modification des CGU */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            11. Modification des CGU
          </h2>
          <p className="leading-relaxed">
            PsyLib se reserve le droit de modifier les presentes CGU. En cas de modification
            substantielle, les utilisateurs seront informes par email et/ou par notification
            dans l&apos;application au moins 30 jours avant l&apos;entree en vigueur des
            nouvelles conditions. L&apos;utilisation continue du service apres l&apos;entree
            en vigueur des modifications vaut acceptation des nouvelles CGU. En cas de refus,
            l&apos;utilisateur peut resilier son abonnement conformement a l&apos;article 8.
          </p>
        </section>

        {/* 12. Droit applicable */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            12. Droit applicable et juridiction competente
          </h2>
          <p className="mb-4 leading-relaxed">
            Les presentes CGU sont soumises au droit francais.
          </p>
          <p className="mb-4 leading-relaxed">
            En cas de litige relatif a l&apos;interpretation ou a l&apos;execution des
            presentes CGU, les parties s&apos;efforceront de trouver une solution amiable.
            A defaut d&apos;accord amiable dans un delai de 30 jours, le litige sera soumis
            aux tribunaux competents de Nancy (France).
          </p>
          <p className="leading-relaxed">
            Conformement a l&apos;article L.612-1 du Code de la consommation, l&apos;utilisateur
            peut recourir gratuitement a un mediateur de la consommation en vue de la resolution
            amiable du litige.
          </p>
        </section>

        {/* 13. Dispositions diverses */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            13. Dispositions diverses
          </h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Integralite :</strong> les presentes CGU, la{' '}
              <Link href="/privacy" className="text-[#3D52A0] hover:underline">
                Politique de confidentialite
              </Link>{' '}
              et les{' '}
              <Link href="/legal" className="text-[#3D52A0] hover:underline">
                Mentions legales
              </Link>{' '}
              constituent l&apos;integralite de l&apos;accord entre l&apos;utilisateur et PsyLib
            </li>
            <li>
              <strong>Divisibilite :</strong> si l&apos;une des clauses des presentes CGU est
              declaree nulle par une decision de justice, les autres clauses demeurent applicables
            </li>
            <li>
              <strong>Non-renonciation :</strong> le fait pour PsyLib de ne pas se prevaloir d&apos;un
              manquement de l&apos;utilisateur ne saurait constituer une renonciation a s&apos;en
              prevaloir ulterieurement
            </li>
            <li>
              <strong>Cession :</strong> l&apos;utilisateur ne peut ceder ses droits et obligations
              au titre des presentes CGU sans l&apos;accord prealable ecrit de PsyLib
            </li>
          </ul>
        </section>

        {/* 14. Contact */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            14. Contact
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Pour toute question relative aux presentes CGU :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>
                <strong>Support :</strong>{' '}
                <a href="mailto:support@psylib.eu" className="text-[#3D52A0] hover:underline">
                  support@psylib.eu
                </a>
              </li>
              <li>
                <strong>Contact general :</strong>{' '}
                <a href="mailto:contact@psylib.eu" className="text-[#3D52A0] hover:underline">
                  contact@psylib.eu
                </a>
              </li>
              <li>
                <strong>Protection des donnees :</strong>{' '}
                <a href="mailto:dpo@psylib.eu" className="text-[#3D52A0] hover:underline">
                  dpo@psylib.eu
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Logiciel de gestion de cabinet conforme HDS, concu pour les psychologues
            liberaux. Sans engagement, sans carte bancaire.
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
            Derniere mise a jour : Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
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
