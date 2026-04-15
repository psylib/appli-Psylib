import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: "Mentions legales | PsyLib",
  description:
    "Mentions legales de PsyLib, logiciel SaaS pour psychologues liberaux. Editeur, hebergement HDS, propriete intellectuelle, cookies, contact.",
  alternates: { canonical: 'https://psylib.eu/legal' },
  openGraph: {
    title: "Mentions legales | PsyLib",
    description:
      "Mentions legales de PsyLib : editeur, hebergement, propriete intellectuelle, cookies.",
    url: 'https://psylib.eu/legal',
    type: 'website',
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
      name: 'Mentions legales',
      url: 'https://psylib.eu/legal',
      description: 'Mentions legales de PsyLib, logiciel SaaS pour psychologues liberaux.',
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
          name: 'Mentions legales',
          item: 'https://psylib.eu/legal',
        },
      ],
    },
  ],
};

export default function LegalPage() {
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
          <span className="text-gray-700">Mentions legales</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Informations legales — Derniere mise a jour : Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Mentions legales
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Conformement aux dispositions des articles 6-III et 19 de la loi n 2004-575 du
            21 juin 2004 pour la confiance dans l&apos;economie numerique (LCEN), les
            informations suivantes sont portees a la connaissance des utilisateurs du site
            psylib.eu.
          </p>
        </header>

        {/* 1. Éditeur du site */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Editeur du site
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <ul className="list-inside list-disc space-y-2 text-gray-700">
              <li><strong>Denomination :</strong> PsyLib (en cours d&apos;immatriculation)</li>
              <li><strong>Forme juridique :</strong> SAS (en cours de creation)</li>
              <li><strong>Siege social :</strong> France</li>
              <li><strong>Numero SIRET :</strong> En cours d&apos;immatriculation</li>
              <li><strong>Numero de TVA intracommunautaire :</strong> En cours d&apos;attribution</li>
              <li>
                <strong>Email de contact :</strong>{' '}
                <a href="mailto:contact@psylib.eu" className="text-[#3D52A0] hover:underline">
                  contact@psylib.eu
                </a>
              </li>
              <li><strong>Site web :</strong>{' '}
                <a href="https://psylib.eu" className="text-[#3D52A0] hover:underline">
                  https://psylib.eu
                </a>
              </li>
            </ul>
          </div>
        </section>

        {/* 2. Directeur de la publication */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Directeur de la publication
          </h2>
          <p className="leading-relaxed">
            Le directeur de la publication est le representant legal de PsyLib. Il peut etre
            contacte a l&apos;adresse email :{' '}
            <a href="mailto:contact@psylib.eu" className="text-[#3D52A0] hover:underline">
              contact@psylib.eu
            </a>
            .
          </p>
        </section>

        {/* 3. Hébergement */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Hebergement
          </h2>
          <p className="mb-4 leading-relaxed">
            Le site et l&apos;application PsyLib sont heberges par les prestataires suivants,
            tous situes en France et certifies pour l&apos;hebergement de donnees de sante
            lorsque requis :
          </p>
          <div className="space-y-4">
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Frontend (site web et interface)</h3>
              <ul className="list-inside list-disc space-y-1 text-gray-700">
                <li><strong>Hebergeur :</strong> Vercel Inc.</li>
                <li><strong>Adresse :</strong> 440 N Baxter St, Los Angeles, CA 90004, USA</li>
                <li><strong>Site web :</strong> vercel.com</li>
                <li><strong>Objet :</strong> hebergement du site marketing et de l&apos;interface utilisateur (aucune donnee de sante)</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Backend et donnees de sante (HDS)</h3>
              <ul className="list-inside list-disc space-y-1 text-gray-700">
                <li><strong>Hebergeur :</strong> Amazon Web Services (AWS) — Region eu-west-3 (Paris)</li>
                <li><strong>Certification HDS :</strong> Oui (depuis 2022)</li>
                <li><strong>Objet :</strong> API backend, base de donnees PostgreSQL, stockage de fichiers patients</li>
                <li><strong>Chiffrement :</strong> AES-256 au repos (RDS) + AES-256-GCM applicatif + TLS 1.3 en transit</li>
              </ul>
            </div>
            <div className="rounded-xl border border-gray-200 p-5">
              <h3 className="mb-2 font-semibold text-[#1E1B4B]">Authentification et sauvegardes (HDS)</h3>
              <ul className="list-inside list-disc space-y-1 text-gray-700">
                <li><strong>Hebergeur :</strong> OVHcloud</li>
                <li><strong>Adresse :</strong> 2 rue Kellermann, 59100 Roubaix, France</li>
                <li><strong>Certification HDS :</strong> Oui</li>
                <li><strong>Objet :</strong> serveur d&apos;authentification Keycloak (MFA TOTP), sauvegardes chiffrees de la base de donnees</li>
              </ul>
            </div>
          </div>
        </section>

        {/* 4. Propriété intellectuelle */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Propriete intellectuelle
          </h2>
          <p className="mb-4 leading-relaxed">
            L&apos;ensemble du contenu du site psylib.eu (textes, images, graphismes, logo,
            icones, logiciel, base de donnees) est protege par les lois francaises et
            internationales relatives a la propriete intellectuelle.
          </p>
          <p className="mb-4 leading-relaxed">
            La marque PsyLib, le logo et les elements graphiques associes sont la propriete
            exclusive de PsyLib. Toute reproduction, representation, modification, publication,
            adaptation ou exploitation, partielle ou totale, de ces elements est interdite
            sans l&apos;autorisation ecrite prealable de PsyLib.
          </p>
          <p className="leading-relaxed">
            Les contenus generes par les utilisateurs (dossiers patients, notes de seance,
            factures) restent la propriete exclusive de leurs auteurs. PsyLib ne revendique
            aucun droit de propriete sur ces contenus.
          </p>
        </section>

        {/* 5. Conditions d'utilisation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Conditions d&apos;utilisation
          </h2>
          <p className="leading-relaxed">
            L&apos;utilisation du service PsyLib est regie par nos{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">
              Conditions Generales d&apos;Utilisation (CGU)
            </Link>
            . En accedant au site et en creant un compte, l&apos;utilisateur reconnait avoir
            pris connaissance de ces conditions et les accepter sans reserve. Les CGU decrivent
            notamment l&apos;objet du service, les obligations reciproques, les modalites
            d&apos;abonnement et de resiliation, et la limitation de responsabilite.
          </p>
        </section>

        {/* 6. Protection des données */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Protection des donnees personnelles
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib accorde une importance primordiale a la protection des donnees personnelles
            de ses utilisateurs. Le traitement des donnees est effectue dans le respect du
            Reglement General sur la Protection des Donnees (RGPD) et de la loi Informatique
            et Libertes.
          </p>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-2 font-semibold text-[#1E1B4B]">Points cles :</p>
            <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
              <li>Hebergement certifie HDS en France</li>
              <li>Chiffrement AES-256-GCM des donnees sensibles</li>
              <li>Authentification multi-facteurs (MFA) obligatoire</li>
              <li>Audit de tous les acces aux donnees de sante</li>
              <li>Droit d&apos;acces, de rectification, de suppression et de portabilite</li>
            </ul>
            <p className="text-gray-700">
              Pour plus de details, consultez notre{' '}
              <Link href="/privacy" className="text-[#3D52A0] hover:underline">
                Politique de confidentialite
              </Link>{' '}
              complete. Pour exercer vos droits, contactez notre DPO :{' '}
              <a href="mailto:dpo@psylib.eu" className="text-[#3D52A0] hover:underline">
                dpo@psylib.eu
              </a>
              .
            </p>
          </div>
        </section>

        {/* 7. Cookies */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Cookies
          </h2>
          <p className="mb-4 leading-relaxed">
            Le site psylib.eu utilise des cookies pour assurer son bon fonctionnement et
            ameliorer l&apos;experience utilisateur.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Cookies strictement necessaires
          </h3>
          <p className="mb-4 leading-relaxed">
            Ces cookies sont indispensables au fonctionnement du site. Ils permettent la
            gestion de l&apos;authentification (session Keycloak), la securite de la navigation
            et la memorisation des preferences. Ils ne necessitent pas de consentement
            prealable.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Cookies d&apos;analyse (PostHog)
          </h3>
          <p className="mb-4 leading-relaxed">
            PsyLib utilise PostHog pour analyser l&apos;utilisation du site marketing
            (pages visitees, parcours utilisateur, temps de session). Ces cookies sont
            soumis a votre consentement prealable. Ils ne collectent aucune donnee patient
            et ne sont actifs que sur les pages marketing du site.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Desactiver les cookies d&apos;analyse
          </h3>
          <p className="leading-relaxed">
            Vous pouvez refuser les cookies d&apos;analyse lors de votre premiere visite
            via la banniere de consentement. Vous pouvez egalement modifier vos preferences
            a tout moment en effacant les cookies de votre navigateur. Le refus des cookies
            d&apos;analyse n&apos;affecte pas le fonctionnement du service. Aucun cookie
            publicitaire n&apos;est utilise par PsyLib.
          </p>
        </section>

        {/* 8. Liens hypertextes */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Liens hypertextes
          </h2>
          <p className="mb-4 leading-relaxed">
            Le site psylib.eu peut contenir des liens hypertextes vers des sites tiers. PsyLib
            n&apos;exerce aucun controle sur le contenu de ces sites et decline toute
            responsabilite quant a leur contenu ou aux dommages pouvant resulter de leur
            consultation.
          </p>
          <p className="leading-relaxed">
            La mise en place de liens hypertextes vers le site psylib.eu est libre, sous reserve
            que ces liens ne portent pas atteinte a l&apos;image de PsyLib et qu&apos;ils ne
            constituent pas une contrefacon.
          </p>
        </section>

        {/* 9. Disponibilité du site */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Disponibilite du site
          </h2>
          <p className="leading-relaxed">
            PsyLib s&apos;efforce de maintenir le site accessible en permanence. Toutefois,
            l&apos;acces peut etre temporairement suspendu pour des raisons de maintenance,
            de mise a jour ou de force majeure. PsyLib ne saurait etre tenu responsable des
            eventuelles indisponibilites du site.
          </p>
        </section>

        {/* 10. Crédits */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            10. Credits
          </h2>
          <ul className="list-inside list-disc space-y-1 text-gray-700">
            <li><strong>Conception et developpement :</strong> PsyLib</li>
            <li><strong>Framework frontend :</strong> Next.js (Vercel)</li>
            <li><strong>Framework backend :</strong> NestJS</li>
            <li><strong>Design :</strong> TailwindCSS</li>
            <li><strong>Typographies :</strong> Inter, DM Sans, Playfair Display (Google Fonts)</li>
          </ul>
        </section>

        {/* 11. Contact */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            11. Contact
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 leading-relaxed">
              Pour toute question relative au site psylib.eu :
            </p>
            <ul className="list-inside list-disc space-y-1 text-gray-700">
              <li>
                <strong>Contact general :</strong>{' '}
                <a href="mailto:contact@psylib.eu" className="text-[#3D52A0] hover:underline">
                  contact@psylib.eu
                </a>
              </li>
              <li>
                <strong>Support technique :</strong>{' '}
                <a href="mailto:support@psylib.eu" className="text-[#3D52A0] hover:underline">
                  support@psylib.eu
                </a>
              </li>
              <li>
                <strong>Protection des donnees (DPO) :</strong>{' '}
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
            Decouvrez PsyLib
          </h2>
          <p className="mb-6 text-white/80">
            Le logiciel de gestion de cabinet concu pour les psychologues liberaux.
            Conforme HDS, securise, intuitif. Commencez gratuitement.
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
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
