import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Conditions de l'offre Fondateurs | PsyLib",
  description:
    "Conditions specifiques du programme fondateurs PsyLib. Offre reservee, tarif garanti a vie, engagements reciproques, modalites.",
  alternates: { canonical: 'https://psylib.eu/offre-fondateurs' },
  openGraph: {
    title: "Conditions de l'offre Fondateurs | PsyLib",
    description:
      "Programme fondateurs PsyLib : plan Clinic gratuit 1 an, tarif garanti 25 euros/mois a vie. Conditions et engagements.",
    url: 'https://psylib.eu/offre-fondateurs',
    type: 'article',
    locale: 'fr_FR',
    siteName: 'PsyLib',
  },
  robots: { index: false, follow: false },
};

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'WebPage',
      name: "Conditions de l'offre Fondateurs",
      url: 'https://psylib.eu/offre-fondateurs',
      description: "Conditions specifiques du programme fondateurs PsyLib.",
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      dateModified: '2026-05-07',
    },
  ],
};

export default function OffreFondateursPage() {
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
          <span className="text-gray-700">Offre Fondateurs</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Document contractuel — Derniere mise a jour : Mai 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Conditions specifiques de l&apos;offre Fondateurs
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Le programme Fondateurs est une offre limitee reservee aux premiers praticiens
            ayant rejoint PsyLib. Ce programme est desormais cloture (7 places attribuees sur 7).
          </p>
        </header>

        {/* Statut */}
        <section className="mb-10">
          <div className="rounded-2xl border-2 border-[#3D52A0]/20 bg-[#F8F7FF] p-6">
            <p className="text-sm font-medium text-[#3D52A0]">
              Programme cloture — Les conditions ci-dessous s&apos;appliquent aux 7 praticiens
              deja inscrits au programme. Aucune nouvelle inscription n&apos;est possible.
            </p>
          </div>
        </section>

        {/* 1. Objet */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Objet du programme
          </h2>
          <p className="mb-4 leading-relaxed">
            Le programme Fondateurs a pour objet de permettre a un nombre restreint de
            praticiens de beneficier d&apos;un acces privilegie a PsyLib en echange de retours
            reguliers sur le produit. Les fondateurs participent activement a l&apos;amelioration
            de la plateforme en signalant des bugs, en proposant des ameliorations et en
            identifiant les fonctionnalites inutiles ou manquantes.
          </p>
        </section>

        {/* 2. Avantages */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Avantages accordes aux fondateurs
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2.1. Phase 1 — Premiere annee (gratuite)
          </h3>
          <div className="mb-4 rounded-2xl bg-[#F1F0F9] p-6">
            <ul className="list-inside list-disc space-y-2 text-gray-700">
              <li><strong>Plan :</strong> Clinic (plan le plus complet)</li>
              <li><strong>Tarif :</strong> 0 euros — aucun paiement requis pendant 12 mois</li>
              <li><strong>Duree :</strong> 12 mois a compter de la date de creation du compte</li>
              <li><strong>Fonctionnalites :</strong> acces complet a toutes les fonctionnalites PsyLib (patients illimites, IA illimitee, visio, portail patient, comptabilite, multi-praticiens, API)</li>
              <li><strong>Moyen de paiement :</strong> aucune carte bancaire requise</li>
            </ul>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2.2. Phase 2 — Apres la premiere annee (tarif fondateur a vie)
          </h3>
          <div className="mb-4 rounded-2xl bg-[#F1F0F9] p-6">
            <ul className="list-inside list-disc space-y-2 text-gray-700">
              <li><strong>Plan :</strong> Clinic (maintenu)</li>
              <li><strong>Tarif fondateur :</strong> 25 euros HT par mois (au lieu de 79 euros HT — soit 68 % de reduction)</li>
              <li><strong>Duree :</strong> a vie, tant que l&apos;abonnement n&apos;est pas resilie par le fondateur</li>
              <li><strong>Garantie tarifaire :</strong> le tarif de 25 euros HT/mois est garanti et ne sera jamais augmente pour les fondateurs, quel que soit l&apos;evolution des tarifs standards</li>
            </ul>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            2.3. Avantages complementaires
          </h3>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Acces prioritaire</strong> aux nouvelles fonctionnalites (beta testing)</li>
            <li><strong>Support direct</strong> par email et messagerie avec le fondateur de PsyLib</li>
            <li><strong>Influence sur la roadmap :</strong> les retours des fondateurs sont priorises dans le developpement produit</li>
            <li><strong>Badge &quot;Fondateur&quot;</strong> sur le profil (visible dans l&apos;application)</li>
          </ul>
        </section>

        {/* 3. Engagements du fondateur */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Engagements du fondateur
          </h2>
          <p className="mb-4 leading-relaxed">
            En contrepartie des avantages ci-dessus, le fondateur s&apos;engage a :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Utiliser regulierement PsyLib</strong> dans sa pratique quotidienne
              (au minimum une connexion par semaine pendant la phase 1)
            </li>
            <li>
              <strong>Signaler les bugs</strong> rencontres par email ou via le support integre
            </li>
            <li>
              <strong>Partager des retours constructifs</strong> sur les fonctionnalites existantes
              et les ameliorations souhaitees (au minimum un retour par mois)
            </li>
            <li>
              <strong>Identifier les fonctionnalites inutiles</strong> ou peu adaptees a la pratique
              reelle en cabinet
            </li>
            <li>
              <strong>Participer a un point mensuel</strong> (optionnel, 15-30 minutes par visio
              ou email) pour discuter des evolutions du produit
            </li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Ces engagements sont des engagements de moyens, pas de resultat. Le fondateur n&apos;est
            pas tenu a un volume minimum de retours et PsyLib ne sanctionnera pas une periode
            d&apos;inactivite ponctuelle (conges, surcharge).
          </p>
        </section>

        {/* 4. Engagements de PsyLib */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Engagements de PsyLib
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib s&apos;engage envers les fondateurs a :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <strong>Garantir le tarif fondateur a vie</strong> (25 euros HT/mois apres la premiere
              annee), sans aucune augmentation
            </li>
            <li>
              <strong>Maintenir l&apos;acces au plan Clinic</strong> avec toutes les fonctionnalites
              incluses, y compris celles ajoutees apres l&apos;inscription
            </li>
            <li>
              <strong>Prioriser les retours des fondateurs</strong> dans la roadmap produit
            </li>
            <li>
              <strong>Assurer un support direct et reactif</strong> (delai cible : 24 heures ouvrees)
            </li>
            <li>
              <strong>Informer les fondateurs en priorite</strong> des evolutions majeures du produit,
              des changements tarifaires et des mises a jour de securite
            </li>
          </ul>
        </section>

        {/* 5. Durée et résiliation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Duree et resiliation
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5.1. Duree
          </h3>
          <p className="mb-4 leading-relaxed">
            Le programme Fondateurs est a duree indeterminee. Le statut de fondateur et les
            avantages associes sont maintenus tant que le fondateur conserve un abonnement actif.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5.2. Resiliation par le fondateur
          </h3>
          <p className="mb-4 leading-relaxed">
            Le fondateur peut resilier son abonnement a tout moment par email ou depuis le
            tableau de bord. La resiliation prend effet a la fin de la periode en cours.
          </p>
          <div className="mb-4 rounded-xl border-2 border-amber-200 bg-amber-50 p-4">
            <p className="text-sm font-medium text-amber-800">
              Attention : en cas de resiliation, le statut de fondateur et le tarif garanti sont
              definitivement perdus. Une re-souscription ulterieure sera effectuee aux tarifs
              standards en vigueur.
            </p>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            5.3. Resiliation par PsyLib
          </h3>
          <p className="leading-relaxed">
            PsyLib ne peut resilier le statut de fondateur que dans les cas prevus a l&apos;article
            8.2 des{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>{' '}
            (violation des conditions, fraude, defaut de paiement persistant). En cas de cessation
            totale de l&apos;activite PsyLib, les fondateurs seront informes avec un preavis de
            90 jours et un export complet de leurs donnees sera mis a disposition.
          </p>
        </section>

        {/* 6. Transition phase 1 → phase 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Transition vers le tarif payant
          </h2>
          <p className="mb-4 leading-relaxed">
            A l&apos;approche de la fin de la premiere annee gratuite, PsyLib :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>Notifie le fondateur par email <strong>60 jours</strong> avant la fin de la periode gratuite</li>
            <li>Envoie un rappel <strong>30 jours</strong> avant</li>
            <li>Envoie un dernier rappel <strong>7 jours</strong> avant</li>
            <li>Demande l&apos;ajout d&apos;un moyen de paiement (carte bancaire via Stripe)</li>
          </ul>
          <p className="mt-4 leading-relaxed">
            Le premier prelevement au tarif fondateur (25 euros HT/mois) intervient le jour
            anniversaire de la creation du compte. Si aucun moyen de paiement n&apos;est renseigne,
            l&apos;acces aux fonctionnalites Clinic est suspendu et le compte bascule sur le plan
            Free. Le fondateur dispose ensuite de 30 jours pour regulariser et retrouver son statut.
          </p>
        </section>

        {/* 7. Protection des données */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Protection des donnees
          </h2>
          <p className="leading-relaxed">
            Les fondateurs beneficient des memes garanties de protection des donnees que tous
            les utilisateurs de PsyLib, telles que decrites dans notre{' '}
            <Link href="/privacy" className="text-[#3D52A0] hover:underline">Politique de confidentialite</Link>,
            notre{' '}
            <Link href="/dpa" className="text-[#3D52A0] hover:underline">DPA</Link> et nos{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>.
            Hebergement HDS, chiffrement AES-256-GCM, MFA obligatoire, droit a l&apos;effacement
            et a la portabilite.
          </p>
        </section>

        {/* 8. Documents applicables */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Documents contractuels applicables
          </h2>
          <p className="mb-4 leading-relaxed">
            Les presentes conditions specifiques completent et s&apos;ajoutent aux documents
            contractuels suivants, qui restent pleinement applicables :
          </p>
          <ul className="list-inside list-disc space-y-2 text-gray-700">
            <li>
              <Link href="/terms" className="text-[#3D52A0] hover:underline">
                Conditions Generales d&apos;Utilisation (CGU)
              </Link>
            </li>
            <li>
              <Link href="/cgv" className="text-[#3D52A0] hover:underline">
                Conditions Generales de Vente (CGV)
              </Link>
            </li>
            <li>
              <Link href="/privacy" className="text-[#3D52A0] hover:underline">
                Politique de confidentialite / RGPD
              </Link>
            </li>
            <li>
              <Link href="/dpa" className="text-[#3D52A0] hover:underline">
                Accord de traitement des donnees (DPA)
              </Link>
            </li>
            <li>
              <Link href="/legal" className="text-[#3D52A0] hover:underline">
                Mentions legales
              </Link>
            </li>
          </ul>
          <p className="mt-4 leading-relaxed">
            En cas de contradiction entre les presentes conditions et les documents ci-dessus,
            les presentes conditions specifiques priment pour les clauses propres au programme
            Fondateurs.
          </p>
        </section>

        {/* 9. Contact */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Contact
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Pour toute question relative au programme Fondateurs :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>
                <strong>Tony Ruppel, fondateur PsyLib :</strong>{' '}
                <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
                  tony@psylib.eu
                </a>
              </li>
            </ul>
          </div>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Derniere mise a jour : Mai 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>
            {' '}|{' '}
            <Link href="/cgv" className="text-[#3D52A0] hover:underline">CGV</Link>
            {' '}|{' '}
            <Link href="/privacy" className="text-[#3D52A0] hover:underline">Politique de confidentialite</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
