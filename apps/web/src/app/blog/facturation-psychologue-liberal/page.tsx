import type { Metadata } from 'next';
import Link from 'next/link';

export const metadata: Metadata = {
  title: 'Facturation psychologue libéral : guide complet 2026',
  description:
    'Tout savoir sur la facturation du psychologue libéral : mentions obligatoires, TVA exonérée, numéro ADELI, SIRET, génération PDF et logiciel de facturation.',
  keywords: [
    'facturation psychologue libéral',
    'facture psychologue',
    'TVA psychologue exonération',
    'note honoraires psychologue',
    'mentions obligatoires facture psychologue',
    'ADELI facture psychologue',
    'logiciel facturation psychologue',
    'facture psychologue PDF',
    'comptabilité psychologue libéral',
  ],
  alternates: {
    canonical: 'https://psylib.eu/blog/facturation-psychologue-liberal',
  },
  openGraph: {
    title: 'Facturation psychologue libéral : guide complet 2026',
    description:
      'Guide complet sur la facturation pour psychologues libéraux en France : obligations légales, TVA, mentions obligatoires et logiciel de facturation PDF.',
    url: 'https://psylib.eu/blog/facturation-psychologue-liberal',
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
      headline: 'Facturation psychologue libéral : guide complet 2026',
      description:
        'Guide complet sur la facturation pour psychologues libéraux en France.',
      datePublished: '2026-03-15',
      dateModified: '2026-03-15',
      author: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      publisher: {
        '@type': 'Organization',
        name: 'PsyLib',
        url: 'https://psylib.eu',
      },
      mainEntityOfPage: {
        '@type': 'WebPage',
        '@id': 'https://psylib.eu/blog/facturation-psychologue-liberal',
      },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'Les psychologues libéraux sont-ils soumis à la TVA ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Non. Les prestations de soins à la personne réalisées par les psychologues sont exonérées de TVA en application de l'article 261-4-1° du Code général des impôts. Les factures doivent comporter la mention : \"TVA non applicable selon l'article 261-4-1° du Code Général des Impôts\".",
          },
        },
        {
          '@type': 'Question',
          name: 'Quelles sont les mentions obligatoires sur la facture d\'un psychologue ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les mentions obligatoires sont : nom et prénom du praticien, adresse professionnelle, numéro ADELI, numéro SIRET, date d'émission, numéro de facture unique et séquentiel, description de la prestation (séance de psychologie), date(s) de séance(s), montant HT (= TTC car TVA exonérée), mention d'exonération de TVA (article 261-4-1° CGI), coordonnées du patient. En dessous de 25 euros, une note de caisse simplifiée suffit.",
          },
        },
        {
          '@type': 'Question',
          name: 'Un psychologue doit-il obligatoirement émettre une facture ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui, pour toute prestation d'un montant supérieur à 25 euros, l'émission d'une facture (ou note d'honoraires) est une obligation légale pour tous les professionnels libéraux. La facture doit être conservée pendant 10 ans à des fins comptables.",
          },
        },
        {
          '@type': 'Question',
          name: "Les séances Mon Soutien Psy sont-elles facturées différemment ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Dans le cadre du dispositif Mon Soutien Psy, le psychologue conventionné facture 50 euros par séance (tarif conventionné). La Caisse d'Assurance Maladie rembourse 60 % du tarif, soit 30 euros. Le patient règle le reste (20 euros), potentiellement pris en charge par sa mutuelle. La facturation s'effectue via la feuille de soins électronique ou papier, et non par une facture classique.",
          },
        },
        {
          '@type': 'Question',
          name: "Peut-on générer des factures PDF automatiquement avec un logiciel ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les logiciels de gestion de cabinet comme PsyLib génèrent automatiquement des factures PDF conformes à partir des données du dossier patient : numéro ADELI, SIRET, date de séance, montant, mention d'exonération de TVA. Les factures sont ensuite envoyées directement par email au patient en un clic.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Blog', item: 'https://psylib.eu/blog' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Facturation psychologue libéral',
          item: 'https://psylib.eu/blog/facturation-psychologue-liberal',
        },
      ],
    },
  ],
};

export default function ArticleFacturationPsychologue() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        {/* Fil d'Ariane */}
        <nav aria-label="Fil d'Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <Link href="/blog" className="hover:underline">Blog</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Facturation psychologue libéral</span>
        </nav>

        {/* En-tête */}
        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Gestion administrative — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Facturation psychologue libéral : guide complet 2026
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Mentions obligatoires, exonération de TVA, numéro ADELI, statut juridique —
            tout ce qu'il faut savoir pour facturer correctement en libéral, avec ou sans
            logiciel.
          </p>
        </header>

        {/* Avertissement */}
        <div className="mb-8 rounded-xl border border-amber-200 bg-amber-50 px-5 py-4 text-sm text-amber-900">
          <strong>Note :</strong> Cet article présente les règles générales applicables
          aux psychologues libéraux en France en 2026. Pour toute question spécifique à
          votre situation fiscale ou comptable, consultez un expert-comptable.
        </div>

        {/* Introduction */}
        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La facturation est l'une des premières questions pratiques que se posent
            les psychologues qui s'installent en libéral. Quelle forme doit prendre
            la facture ? Quelles informations sont obligatoires ? Faut-il facturer la
            TVA ? Comment gérer la comptabilité simplement sans y consacrer des heures ?
          </p>
          <p className="mt-4 leading-relaxed">
            La bonne nouvelle est que la facturation des psychologues libéraux est
            relativement simple sur le plan fiscal : les prestations sont exonérées
            de TVA et le régime micro-BNC — accessible à la grande majorité des
            praticiens — simplifie la comptabilité. La mauvaise nouvelle est que
            les erreurs dans les mentions obligatoires sont fréquentes et peuvent
            entraîner des redressements fiscaux. Ce guide détaille les obligations
            à respecter en 2026.
          </p>
        </section>

        {/* Section 1 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            TVA et psychologue libéral : une exonération totale
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            L'exonération de TVA — article 261-4-1° du CGI
          </h3>
          <p className="mb-4 leading-relaxed">
            Les psychologues libéraux sont exonérés de TVA sur l'ensemble de leurs
            prestations de soins. Cette exonération est prévue par l'article 261-4-1°
            du Code général des impôts, qui dispose que les prestations de soins à
            la personne effectuées par les membres des professions réglementées de
            santé — dont les psychologues — sont exonérées de taxe sur la valeur ajoutée.
          </p>
          <p className="mb-4 leading-relaxed">
            Cette exonération s'applique quel que soit le montant du chiffre d'affaires
            annuel et quel que soit le statut juridique du praticien (entreprise
            individuelle, EIRL, SELAS, etc.). Il est impossible — et illégal — de
            facturer de la TVA sur des séances de psychologie.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La mention obligatoire d'exonération
          </h3>
          <p className="mb-4 leading-relaxed">
            Toutes les factures et notes d'honoraires doivent comporter la mention
            suivante, conformément à l'article 293 B du CGI :
          </p>
          <div className="my-4 rounded-lg border border-gray-200 bg-gray-50 px-5 py-4 font-mono text-sm text-gray-700">
            TVA non applicable selon l'article 261-4-1° du Code Général des Impôts
          </div>
          <p className="mb-4 leading-relaxed">
            L'omission de cette mention est l'une des erreurs les plus fréquentes
            constatées lors des contrôles fiscaux. Un logiciel de facturation intègre
            automatiquement cette mention sur chaque document généré.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Cas particuliers : formations et supervision
          </h3>
          <p className="mb-4 leading-relaxed">
            L'exonération de TVA s'applique aux prestations de soin. Si le psychologue
            exerce également une activité de formation professionnelle ou de supervision
            de confrères, ces prestations peuvent, selon les cas, être soumises à la TVA
            ou exonérées au titre de la formation professionnelle continue (article 261-4-4°
            du CGI). Il est recommandé de consulter un expert-comptable pour ces
            situations spécifiques.
          </p>
        </section>

        {/* Section 2 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Mentions obligatoires sur la facture d'un psychologue
          </h2>
          <p className="mb-4 leading-relaxed">
            Pour toute prestation d'un montant supérieur à 25 euros, l'émission d'une
            facture est une obligation légale. Le document doit comporter les informations
            suivantes :
          </p>

          <div className="mb-6 grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border border-[#3D52A0]/20 bg-[#F1F0F9] p-5">
              <h3 className="mb-3 font-semibold text-[#3D52A0]">Informations du praticien</h3>
              <ul className="space-y-2 text-sm leading-relaxed">
                <li>Nom et prénom</li>
                <li>Adresse professionnelle complète</li>
                <li>Numéro de téléphone professionnel</li>
                <li>Adresse email professionnelle</li>
                <li>
                  <strong>Numéro ADELI</strong> (identifiant professionnel de santé)
                </li>
                <li>
                  <strong>Numéro SIRET</strong> (obligatoire pour tout professionnel
                  libéral immatriculé)
                </li>
              </ul>
            </div>

            <div className="rounded-xl border border-[#3D52A0]/20 bg-[#F1F0F9] p-5">
              <h3 className="mb-3 font-semibold text-[#3D52A0]">Informations de la facture</h3>
              <ul className="space-y-2 text-sm leading-relaxed">
                <li>Date d'émission de la facture</li>
                <li>
                  <strong>Numéro de facture</strong> unique et séquentiel (ex. : PSY-2026-0045)
                </li>
                <li>Description de la prestation (ex. : "Séance de psychologie individuelle")</li>
                <li>Date(s) de séance(s) facturée(s)</li>
                <li>Montant total (HT = TTC, TVA exonérée)</li>
                <li>Mention d'exonération de TVA (art. 261-4-1° CGI)</li>
              </ul>
            </div>
          </div>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Le numéro ADELI : un identifiant professionnel obligatoire
          </h3>
          <p className="mb-4 leading-relaxed">
            Le numéro ADELI est l'identifiant national attribué par l'Agence régionale
            de santé (ARS) à chaque psychologue titulaire d'un diplôme reconnu par l'Etat.
            Il est obtenu lors de l'inscription au répertoire ADELI, démarche obligatoire
            avant toute exercice légal du titre de psychologue.
          </p>
          <p className="mb-4 leading-relaxed">
            Ce numéro doit figurer sur tous les documents professionnels : factures, notes
            d'honoraires, en-tête de courriers et site internet. Il atteste du droit légal
            à l'usage du titre protégé de psychologue et constitue une mention indispensable
            pour la déductibilité des frais par les patients et pour les remboursements
            par les mutuelles.
          </p>
        </section>

        {/* Section 3 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Numérotation des factures et organisation comptable
          </h2>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            La numérotation séquentielle obligatoire
          </h3>
          <p className="mb-4 leading-relaxed">
            Chaque facture doit porter un numéro unique et chronologique. La séquence
            ne doit comporter aucun "trou" — supprimer ou modifier a posteriori une
            facture émise est interdit. Une numérotation courante est de la forme
            PSY-AAAA-NNNN (ex. : PSY-2026-0001, PSY-2026-0002, etc.).
          </p>
          <p className="mb-4 leading-relaxed">
            Un logiciel de facturation gère automatiquement cette numérotation et garantit
            l'intégrité de la séquence. La génération manuelle, dans un tableur ou un
            traitement de texte, est une source fréquente d'erreurs.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Durée de conservation : 10 ans
          </h3>
          <p className="mb-4 leading-relaxed">
            Les factures et documents comptables doivent être conservés pendant 10 ans
            à compter de la clôture de l'exercice comptable. Cette obligation s'applique
            aux originaux ou aux copies numériques, à condition que celles-ci soient
            fidèles à l'original et lisibles sur toute la durée de conservation.
          </p>

          <h3 className="mb-3 font-playfair text-xl font-semibold text-[#1E1B4B]">
            Régime micro-BNC et livre de recettes
          </h3>
          <p className="mb-4 leading-relaxed">
            La majorité des psychologues libéraux relèvent du régime micro-BNC (Bénéfices
            Non Commerciaux) tant que leur chiffre d'affaires annuel ne dépasse pas le seuil
            légal (77 700 euros en 2026). Ce régime simplifié ne nécessite pas de bilan
            comptable complet, mais impose la tenue d'un livre de recettes chronologique
            mentionnant, pour chaque encaissement : la date, l'identité du client, la nature
            de la prestation et le montant perçu.
          </p>
        </section>

        {/* Section 4 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Facturation Mon Soutien Psy : spécificités du dispositif
          </h2>
          <p className="mb-4 leading-relaxed">
            Le dispositif Mon Soutien Psy, opérationnel depuis 2022 et renforcé en
            juin 2024, permet aux patients de bénéficier de 12 séances par an
            prises en charge par l'Assurance Maladie, sans ordonnance préalable.
          </p>
          <p className="mb-4 leading-relaxed">
            Pour les psychologues conventionnés dans ce dispositif, la facturation
            diffère de la facturation classique :
          </p>
          <ul className="mb-4 space-y-2 pl-6">
            <li className="leading-relaxed">
              Le tarif de la séance est fixé à <strong>50 euros</strong> (tarif
              conventionné).
            </li>
            <li className="leading-relaxed">
              L'Assurance Maladie rembourse <strong>60 % du tarif</strong>, soit
              30 euros, directement au praticien (tiers-payant).
            </li>
            <li className="leading-relaxed">
              Le patient règle le ticket modérateur (20 euros), partiellement ou
              totalement pris en charge par sa mutuelle complémentaire.
            </li>
            <li className="leading-relaxed">
              La facturation s'effectue via la <strong>feuille de soins
              électronique</strong> (FSE) transmise à la CPAM, et non par une
              note d'honoraires classique.
            </li>
          </ul>
          <p className="mb-4 leading-relaxed">
            La coexistence des séances "Mon Soutien Psy" et des séances au tarif libre
            nécessite une organisation comptable distincte pour chaque type de
            prestation. Un logiciel de gestion adapté permet de catégoriser les séances
            et d'assurer un suivi clair des remboursements.
          </p>
        </section>

        {/* Section 5 */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Générer des factures PDF automatiquement avec un logiciel
          </h2>
          <p className="mb-4 leading-relaxed">
            La génération manuelle de factures dans un traitement de texte ou un
            tableur présente trois risques principaux : des erreurs dans les mentions
            obligatoires, une numérotation non conforme et une perte de temps
            considérable. Un logiciel de facturation dédié supprime ces trois risques
            en automatisant l'ensemble du processus.
          </p>
          <p className="mb-4 leading-relaxed">
            Avec PsyLib, la génération d'une facture PDF prend moins de 10 secondes.
            Le logiciel :
          </p>
          <ul className="mb-4 space-y-2 pl-6">
            <li className="leading-relaxed">
              Pre-remplit automatiquement les informations du praticien (numéro ADELI,
              SIRET, adresse) depuis le profil.
            </li>
            <li className="leading-relaxed">
              Importe les données de la séance (date, durée, tarif, nom du patient)
              depuis le dossier patient.
            </li>
            <li className="leading-relaxed">
              Applique systématiquement la mention d'exonération de TVA.
            </li>
            <li className="leading-relaxed">
              Attribue automatiquement un numéro de facture séquentiel.
            </li>
            <li className="leading-relaxed">
              Génère un PDF prêt à envoyer, envoyé directement au patient par email
              depuis la plateforme.
            </li>
            <li className="leading-relaxed">
              Archive les factures émises avec un statut (brouillon, envoyée, payée)
              et permet leur téléchargement à tout moment.
            </li>
          </ul>
          <p className="mb-4 leading-relaxed">
            Les factures générées respectent les exigences du Code de commerce et
            du Code général des impôts. Elles constituent des preuves comptables
            valables en cas de contrôle fiscal.
          </p>
        </section>

        {/* Récapitulatif */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Récapitulatif : checklist de la facture conforme
          </h2>
          <div className="rounded-xl border border-gray-200 p-6">
            <p className="mb-4 text-sm font-medium text-gray-500 uppercase tracking-wide">
              A vérifier sur chaque facture
            </p>
            <ul className="space-y-3">
              {[
                'Nom, prénom et adresse professionnelle du praticien',
                'Numéro ADELI',
                'Numéro SIRET',
                'Date d\'émission de la facture',
                'Numéro de facture unique et séquentiel',
                'Description de la prestation',
                'Date(s) de séance(s) facturée(s)',
                'Montant total (HT = TTC)',
                'Mention : "TVA non applicable selon l\'article 261-4-1° du CGI"',
                'Nom et coordonnées du patient (pour les remboursements mutuelles)',
              ].map((item) => (
                <li key={item} className="flex items-start gap-3 text-sm leading-relaxed">
                  <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[#3D52A0] text-xs text-white">
                    ✓
                  </span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* CTA */}
        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Automatisez votre facturation en moins de 10 secondes par séance
          </h2>
          <p className="mb-6 text-white/80">
            PsyLib génère des factures PDF conformes, les archive et les envoie par
            email à vos patients. Numéro ADELI, mention TVA, numérotation séquentielle
            — tout est géré automatiquement.
          </p>
          <a
            href="https://psylib.eu/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Essayer PsyLib gratuitement 14 jours
          </a>
        </section>

        {/* FAQ */}
        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>

          <div className="space-y-4">
            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Les psychologues libéraux sont-ils soumis à la TVA ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Non. Les prestations de soins à la personne réalisées par les psychologues
                sont exonérées de TVA en application de l'article 261-4-1° du Code général
                des impôts. Les factures doivent comporter la mention : "TVA non applicable
                selon l'article 261-4-1° du Code Général des Impôts".
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Quelles sont les mentions obligatoires sur la facture d'un psychologue ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Les mentions obligatoires sont : nom et adresse du praticien, numéro ADELI,
                numéro SIRET, date d'émission, numéro de facture séquentiel, description
                de la prestation, date de séance, montant TTC, et mention d'exonération
                de TVA (article 261-4-1° CGI).
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Un psychologue doit-il obligatoirement émettre une facture ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui, pour toute prestation d'un montant supérieur à 25 euros. La facture
                (ou note d'honoraires) est une obligation légale pour tous les
                professionnels libéraux. Les documents comptables doivent être conservés
                pendant 10 ans.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Les séances Mon Soutien Psy sont-elles facturées différemment ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. Dans le cadre du dispositif Mon Soutien Psy, la facturation s'effectue
                via la feuille de soins électronique (FSE) transmise à la CPAM, au tarif
                conventionné de 50 euros. L'Assurance Maladie rembourse 30 euros (60 %),
                le patient règle le reste, potentiellement couvert par sa mutuelle.
              </p>
            </details>

            <details className="rounded-xl border border-gray-200 p-5">
              <summary className="cursor-pointer font-semibold text-[#1E1B4B]">
                Peut-on générer des factures PDF automatiquement avec un logiciel ?
              </summary>
              <p className="mt-3 leading-relaxed text-gray-700">
                Oui. Les logiciels comme PsyLib génèrent automatiquement des factures PDF
                conformes à partir des données du dossier patient. Les documents sont
                envoyés par email au patient et archivés dans la plateforme avec gestion
                des statuts (brouillon, envoyée, payée).
              </p>
            </details>
          </div>
        </section>

        {/* Conclusion */}
        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Article rédigé par l'équipe PsyLib — Mars 2026. Les informations fiscales
            présentées sont données à titre indicatif et ne constituent pas un conseil
            juridique ou comptable.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">
              Retour à l'accueil
            </Link>
            {' '}|{' '}
            <Link href="/blog" className="text-[#3D52A0] hover:underline">
              Tous les articles
            </Link>
            {' '}|{' '}
            <Link
              href="/blog/logiciel-gestion-cabinet-psychologue"
              className="text-[#3D52A0] hover:underline"
            >
              Logiciel gestion cabinet psychologue
            </Link>
          </p>
        </footer>
      </article>
    </>
  );
}
