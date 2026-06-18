import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Contrat de sous-traitance RGPD (DPA) | PsyLib",
  description:
    "Accord de traitement des donnees (DPA) conforme a l'article 28 du RGPD. Obligations du sous-traitant PsyLib, mesures de securite, sous-traitants ulterieurs, hebergement HDS.",
  alternates: { canonical: 'https://psylib.eu/dpa' },
  openGraph: {
    title: "Contrat de sous-traitance RGPD (DPA) | PsyLib",
    description:
      "DPA PsyLib : accord de traitement des donnees conforme RGPD article 28. Hebergement HDS, chiffrement, audit.",
    url: 'https://psylib.eu/dpa',
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
      name: "Contrat de sous-traitance RGPD (DPA)",
      url: 'https://psylib.eu/dpa',
      description:
        "Accord de traitement des donnees conforme a l'article 28 du RGPD pour PsyLib.",
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
          name: "DPA — Sous-traitance RGPD",
          item: 'https://psylib.eu/dpa',
        },
      ],
    },
  ],
};

export default function DpaPage() {
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
          <span className="text-gray-700">DPA — Sous-traitance RGPD</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Document contractuel — Derniere mise a jour : Mai 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Accord de traitement des donnees (DPA)
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Contrat de sous-traitance au sens de l&apos;article 28 du Reglement General sur la
            Protection des Donnees (RGPD) entre le praticien (responsable de traitement) et
            PsyLib (sous-traitant).
          </p>
        </header>

        {/* Préambule */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Preambule
          </h2>
          <p className="mb-4 leading-relaxed">
            Dans le cadre de l&apos;utilisation de la plateforme PsyLib, le praticien
            (ci-apres &quot;le Responsable de traitement&quot;) confie a PsyLib (ci-apres
            &quot;le Sous-traitant&quot;) le traitement de donnees a caractere personnel,
            incluant des donnees de sante au sens de l&apos;article 9 du RGPD.
          </p>
          <p className="leading-relaxed">
            Le present accord definit les obligations respectives des parties conformement a
            l&apos;article 28 du RGPD et a l&apos;article L.1111-8 du Code de la sante publique
            relatif a l&apos;hebergement de donnees de sante.
          </p>
        </section>

        {/* 1. Objet et durée */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Objet et duree du traitement
          </h2>
          <p className="mb-4 leading-relaxed">
            Le Sous-traitant traite des donnees a caractere personnel pour le compte du
            Responsable de traitement dans le cadre de la fourniture de la plateforme SaaS
            PsyLib. Le traitement dure pendant toute la duree de l&apos;abonnement du
            Responsable de traitement, plus une periode de 90 jours apres la resiliation
            pour permettre l&apos;export des donnees.
          </p>
        </section>

        {/* 2. Nature et finalité */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Nature et finalite du traitement
          </h2>
          <p className="mb-4 leading-relaxed">
            Le traitement a pour finalite :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>La gestion des dossiers patients du praticien</li>
            <li>Le stockage securise des notes de seance chiffrees</li>
            <li>La planification et le suivi des rendez-vous</li>
            <li>La facturation et la gestion comptable</li>
            <li>La messagerie chiffree entre praticien et patient</li>
            <li>La visio-consultation</li>
            <li>Le portail patient (suivi d&apos;humeur, exercices, journal)</li>
            <li>La generation de resumes par intelligence artificielle (sur demande explicite du praticien uniquement)</li>
          </ul>
        </section>

        {/* 3. Types de données */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Types de donnees personnelles traitees
          </h2>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Categorie</th>
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Donnees</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Protection</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Identite praticien</td>
                  <td className="py-3 pr-4">Nom, email, ADELI/RPPS, telephone, adresse</td>
                  <td className="py-3">TLS 1.3 + HDS</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Identite patient</td>
                  <td className="py-3 pr-4">Nom, prenom, email, telephone, date de naissance</td>
                  <td className="py-3">TLS 1.3 + HDS</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Donnees de sante</td>
                  <td className="py-3 pr-4">Notes de seance, resumes IA, journal intime, suivi d&apos;humeur</td>
                  <td className="py-3">AES-256-GCM + HDS</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Messages</td>
                  <td className="py-3 pr-4">Contenu des messages praticien-patient</td>
                  <td className="py-3">AES-256-GCM + HDS</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Documents</td>
                  <td className="py-3 pr-4">Fichiers partages par le praticien au patient</td>
                  <td className="py-3">Stockage chiffre + HDS</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Facturation</td>
                  <td className="py-3 pr-4">Factures, paiements, historique</td>
                  <td className="py-3">TLS 1.3 + HDS</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 4. Personnes concernées */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Categories de personnes concernees
          </h2>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Praticiens :</strong> psychologues, psychiatres, psychotherapeutes, psychanalystes, psychopraticiens utilisant PsyLib</li>
            <li><strong>Patients :</strong> personnes suivies par les praticiens utilisateurs de PsyLib</li>
          </ul>
        </section>

        {/* 5. Obligations du sous-traitant */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Obligations du Sous-traitant (PsyLib)
          </h2>
          <p className="mb-4 leading-relaxed">
            Conformement a l&apos;article 28 du RGPD, le Sous-traitant s&apos;engage a :
          </p>
          <ul className="list-inside list-disc space-y-3 text-gray-700">
            <li>
              <strong>Traiter les donnees uniquement sur instruction documentee du Responsable de traitement.</strong>{' '}
              Le Sous-traitant ne traite les donnees que pour fournir le service PsyLib tel que decrit dans les CGU et la documentation.
            </li>
            <li>
              <strong>Garantir la confidentialite.</strong>{' '}
              Toute personne autorisee a traiter les donnees est soumise a une obligation de confidentialite.
            </li>
            <li>
              <strong>Mettre en oeuvre les mesures de securite appropriees</strong>{' '}
              (detail a l&apos;article 7 ci-dessous).
            </li>
            <li>
              <strong>Ne pas faire appel a un autre sous-traitant</strong>{' '}
              sans l&apos;autorisation prealable du Responsable de traitement. La liste des sous-traitants
              ulterieurs autorises est publiee sur{' '}
              <Link href="/sous-traitants" className="text-[#3D52A0] hover:underline">
                psylib.eu/sous-traitants
              </Link>. Toute modification sera notifiee 30 jours avant sa prise d&apos;effet.
            </li>
            <li>
              <strong>Assister le Responsable de traitement</strong>{' '}
              dans le respect de ses obligations (droit d&apos;acces, rectification, effacement, portabilite,
              notification de violation, analyse d&apos;impact).
            </li>
            <li>
              <strong>Supprimer ou restituer les donnees</strong>{' '}
              a la fin du contrat, au choix du Responsable de traitement. L&apos;export est disponible
              pendant 90 jours apres la resiliation.
            </li>
            <li>
              <strong>Mettre a disposition les informations necessaires</strong>{' '}
              pour demontrer le respect du present accord et permettre la realisation d&apos;audits.
            </li>
          </ul>
        </section>

        {/* 6. Obligations du responsable */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Obligations du Responsable de traitement (praticien)
          </h2>
          <p className="mb-4 leading-relaxed">
            Le Responsable de traitement s&apos;engage a :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Informer ses patients</strong> de l&apos;utilisation de PsyLib pour la gestion
              de leur dossier et recueillir leur consentement le cas echeant
            </li>
            <li>
              <strong>S&apos;assurer de la licite du traitement</strong> conformement a sa responsabilite
              deontologique et legale
            </li>
            <li>
              <strong>Maintenir la securite de son compte</strong> (mot de passe robuste, MFA active,
              ne pas partager ses identifiants)
            </li>
            <li>
              <strong>Transmettre au Sous-traitant</strong> toute demande d&apos;exercice de droits
              emanant d&apos;un patient et necessitant l&apos;intervention de PsyLib
            </li>
          </ul>
        </section>

        {/* 7. Mesures de sécurité */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Mesures techniques et organisationnelles de securite
          </h2>
          <p className="mb-4 leading-relaxed">
            Le Sous-traitant met en oeuvre les mesures suivantes pour garantir la securite des
            donnees conformement a l&apos;article 32 du RGPD :
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.1. Hebergement
          </h3>
          <div className="mb-4 rounded-2xl bg-[#F1F0F9] p-6">
            <ul className="list-inside list-disc space-y-2 text-gray-700">
              <li><strong>Infrastructure :</strong> AZNETWORK, serveur dedie en France, certifie HDS V2 sur les 6 activites (Hebergeur de Donnees de Sante) et ISO/IEC 27001:2022</li>
              <li><strong>Localisation :</strong> France exclusivement pour toutes les donnees de sante</li>
              <li><strong>Certification :</strong> conforme aux exigences de l&apos;article L.1111-8 du Code de la sante publique</li>
            </ul>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.2. Chiffrement
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>En transit :</strong> TLS 1.3 sur toutes les communications</li>
            <li><strong>Au repos :</strong> chiffrement AES-256 de la base de donnees</li>
            <li><strong>Applicatif :</strong> chiffrement AES-256-GCM des champs sensibles (notes de seance, resumes IA, messages, journal intime) avec cle rotatable</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.3. Authentification et controle d&apos;acces
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Authentification :</strong> Keycloak (OpenID Connect) heberge sur l&apos;infrastructure HDS AZNETWORK</li>
            <li><strong>MFA :</strong> authentification multi-facteurs TOTP obligatoire pour les praticiens</li>
            <li><strong>Tokens :</strong> access token JWT 15 minutes, refresh token 8 heures</li>
            <li><strong>RBAC :</strong> controle d&apos;acces base sur les roles (praticien, patient, admin)</li>
            <li><strong>Isolation :</strong> chaque praticien ne peut acceder qu&apos;a ses propres patients (filtre multi-tenant)</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.4. Audit et tracabilite
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li>Journalisation de tous les acces aux donnees de sante (table <code className="rounded bg-gray-100 px-1">audit_logs</code>)</li>
            <li>Evenements Keycloak : connexions, deconnexions, echecs de connexion, challenges MFA</li>
            <li>Conservation des logs d&apos;audit pendant toute la duree du contrat</li>
          </ul>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            7.5. Sauvegardes
          </h3>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Sauvegardes automatiques quotidiennes de la base de donnees</li>
            <li>Sauvegardes chiffrees stockees sur l&apos;infrastructure HDS AZNETWORK (France), avec PRA sur un second datacenter francais certifie</li>
            <li>Tests de restauration reguliers</li>
            <li>Retention de 7 jours</li>
          </ul>
        </section>

        {/* 8. Sous-traitants ultérieurs */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Sous-traitants ulterieurs
          </h2>
          <p className="mb-4 leading-relaxed">
            Le Responsable de traitement autorise le Sous-traitant a faire appel aux sous-traitants
            ulterieurs listes sur la page{' '}
            <Link href="/sous-traitants" className="text-[#3D52A0] hover:underline">
              psylib.eu/sous-traitants
            </Link>.
          </p>
          <p className="mb-4 leading-relaxed">
            Toute modification de la liste des sous-traitants ulterieurs sera notifiee par email
            au Responsable de traitement 30 jours avant sa prise d&apos;effet. Le Responsable de
            traitement dispose de ce delai pour emettre des objections. En l&apos;absence
            d&apos;objection, le nouveau sous-traitant est repute accepte.
          </p>
          <p className="leading-relaxed">
            Le Sous-traitant impose a ses sous-traitants ulterieurs les memes obligations de
            protection des donnees que celles prevues au present accord.
          </p>
        </section>

        {/* 9. Transferts hors UE */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Transferts de donnees hors Union europeenne
          </h2>
          <div className="mb-4 rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-2 font-semibold text-[#1E1B4B]">Principe : toutes les donnees de sante restent en France.</p>
            <p className="text-gray-700">
              Les donnees cliniques (notes de seance, resumes IA, messages, journal intime, dossiers
              patients) sont stockees exclusivement sur infrastructure HDS en France et ne font
              l&apos;objet d&apos;aucun transfert hors de l&apos;Union europeenne.
            </p>
          </div>
          <p className="mb-4 leading-relaxed">
            Certains sous-traitants ulterieurs non-HDS traitent des donnees non-cliniques :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Vercel (USA) :</strong> hebergement du frontend (interface web). Aucune donnee
              de sante ne transite par Vercel (les appels API sont directs vers le serveur HDS).
            </li>
            <li>
              <strong>Stripe (Irlande/USA) :</strong> traitement des paiements. Seules les donnees
              de facturation sont transmises (nom, email, montant). Stripe est certifie PCI-DSS et
              beneficie de clauses contractuelles types (SCC) pour les transferts EU-USA.
            </li>
            <li>
              <strong>OpenRouter (USA) :</strong> traitement IA sur demande explicite du praticien
              uniquement. Seules des donnees anonymisees ou pseudonymisees sont transmises, apres
              consentement explicite du praticien. Le praticien peut desactiver cette fonctionnalite.
            </li>
          </ul>
        </section>

        {/* 10. Notification de violation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            10. Notification de violation de donnees
          </h2>
          <p className="mb-4 leading-relaxed">
            En cas de violation de donnees a caractere personnel, le Sous-traitant s&apos;engage a :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Notifier le Responsable de traitement dans un delai de <strong>72 heures</strong> apres en avoir pris connaissance</li>
            <li>Fournir toutes les informations necessaires pour permettre au Responsable de traitement de notifier la CNIL et les personnes concernees</li>
            <li>Documenter la violation (nature, categories de donnees, nombre de personnes, consequences, mesures correctives)</li>
            <li>Prendre les mesures immediates pour limiter les consequences de la violation</li>
          </ul>
        </section>

        {/* 11. Droit d'audit */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            11. Droit d&apos;audit
          </h2>
          <p className="mb-4 leading-relaxed">
            Le Responsable de traitement dispose du droit de verifier le respect du present
            accord. Il peut :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Demander par ecrit des informations sur les mesures de securite mises en oeuvre</li>
            <li>Demander la realisation d&apos;un audit par un tiers independant, a ses frais, avec un preavis de 30 jours</li>
            <li>Consulter les logs d&apos;audit relatifs a ses propres donnees</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Le Sous-traitant s&apos;engage a cooperer de bonne foi et a fournir les informations
            necessaires dans un delai raisonnable.
          </p>
        </section>

        {/* 12. Sort des données */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            12. Sort des donnees en fin de contrat
          </h2>
          <p className="mb-4 leading-relaxed">
            A la fin du contrat (resiliation ou expiration), le Sous-traitant :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Maintient l&apos;acces aux donnees pendant <strong>90 jours</strong> pour permettre l&apos;export</li>
            <li>Met a disposition des fonctionnalites d&apos;export en formats ouverts (CSV, PDF)</li>
            <li>Supprime de maniere securisee l&apos;ensemble des donnees a l&apos;issue de la periode de 90 jours</li>
            <li>Conserve uniquement les donnees dont la conservation est imposee par la loi (factures : 10 ans, logs d&apos;audit : duree legale)</li>
            <li>Confirme par ecrit la suppression des donnees au Responsable de traitement sur demande</li>
          </ul>
        </section>

        {/* 13. Contact */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            13. Contact DPO
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Pour toute question relative au present accord ou a la protection des donnees :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>
                <strong>Delegue a la protection des donnees (DPO) :</strong>{' '}
                Tony Ruppel —{' '}
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
            La securite au coeur de PsyLib
          </h2>
          <p className="mb-6 text-white/80">
            Hebergement HDS certifie, chiffrement AES-256-GCM, MFA obligatoire.
            Vos donnees de sante sont protegees selon les plus hauts standards.
          </p>
          <Link
            href="/privacy"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Voir la politique de confidentialite
          </Link>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Derniere mise a jour : Mai 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/privacy" className="text-[#3D52A0] hover:underline">Politique de confidentialite</Link>
            {' '}|{' '}
            <Link href="/sous-traitants" className="text-[#3D52A0] hover:underline">Sous-traitants</Link>
            {' '}|{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
