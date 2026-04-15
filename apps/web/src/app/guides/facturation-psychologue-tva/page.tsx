import type { Metadata } from 'next';
import Link from 'next/link';
import { LeadMagnetCTA } from '@/components/lead-magnet-cta';

export const metadata: Metadata = {
  title: 'Facturation psychologue et TVA : exonération, mentions légales et factures conformes | PsyLib',
  description:
    'Psychologues libéraux exonérés de TVA (art. 261 CGI), mentions obligatoires sur une facture, numéro ADELI. PsyLib génère automatiquement des factures conformes en un clic.',
  keywords: [
    'facturation psychologue TVA',
    'psychologue exonéré TVA',
    'facture psy libéral',
    'mentions légales facture psychologue',
    'numéro ADELI facture',
    'note honoraires psychologue',
    'facturation cabinet psychologie',
  ],
  alternates: { canonical: 'https://psylib.eu/guides/facturation-psychologue-tva' },
  openGraph: {
    title: 'Facturation psychologue et TVA : exonération, mentions légales et factures conformes',
    description:
      'Exonération TVA des psychologues (art. 261 CGI), mentions obligatoires sur facture, numéro ADELI. Générez des factures conformes automatiquement avec PsyLib.',
    url: 'https://psylib.eu/guides/facturation-psychologue-tva',
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
      headline: 'Facturation psychologue et TVA : exonération, mentions légales et factures conformes',
      datePublished: '2026-03-16',
      dateModified: '2026-03-16',
      author: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: "Les psychologues libéraux sont-ils exonérés de TVA ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Les consultations de psychologie exercées dans le cadre d'une activité libérale de soins à la personne sont exonérées de TVA en vertu de l'article 261-4-1° du Code général des impôts. Cette exonération s'applique aux actes de diagnostic et de traitement des troubles mentaux et comportementaux. Les factures ne doivent donc pas mentionner de TVA mais doivent indiquer la base légale de l'exonération.",
          },
        },
        {
          '@type': 'Question',
          name: "Quelles mentions sont obligatoires sur une facture de psychologue libéral ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Les mentions obligatoires sont : date d'émission, numéro de facture séquentiel, nom et prénom du psychologue, adresse professionnelle, numéro ADELI, numéro SIRET, nom et prénom du patient (ou référence anonymisée), date de la prestation, description de la prestation, montant TTC, et la mention 'TVA non applicable - article 261-4-1° du CGI'.",
          },
        },
        {
          '@type': 'Question',
          name: "Un psychologue libéral est-il obligé de délivrer une facture ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Oui. Pour toute prestation dont le montant est supérieur à 25 euros réalisée envers un particulier, le praticien est obligé de délivrer une note d'honoraires (équivalent de la facture pour les professions libérales) sur demande du patient. Il est recommandé de la délivrer systématiquement, même sans demande explicite.",
          },
        },
        {
          '@type': 'Question',
          name: "Quelle est la différence entre micro-BNC et déclaration contrôlée pour un psychologue ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text:
              "Le micro-BNC s'applique si le chiffre d'affaires annuel est inférieur à 77 700 euros (seuil 2026). Il offre une comptabilité simplifiée avec un abattement forfaitaire de 34 % sur les recettes. La déclaration contrôlée (régime réel) est obligatoire au-delà de ce seuil et permet de déduire les charges réelles. La tenue d'une comptabilité rigoureux est indispensable dans les deux cas.",
          },
        },
      ],
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        { '@type': 'ListItem', position: 2, name: 'Guides', item: 'https://psylib.eu/guides' },
        {
          '@type': 'ListItem',
          position: 3,
          name: 'Facturation psychologue TVA',
          item: 'https://psylib.eu/guides/facturation-psychologue-tva',
        },
      ],
    },
  ],
};

export default function PageFacturationTVA() {
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
          <Link href="/guides" className="hover:underline">Guides</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Facturation psychologue TVA</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Guide pratique — Mars 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Facturation psychologue et TVA : exonération, mentions légales et factures conformes
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Tout ce qu&apos;un psychologue libéral doit savoir sur l&apos;exonération de TVA,
            les mentions légales obligatoires sur ses factures, et comment automatiser
            la facturation conforme.
          </p>
        </header>

        <section className="mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <p className="leading-relaxed">
            La facturation est l&apos;une des obligations administratives les moins bien maîtrisées
            par les psychologues libéraux en début de carrière. Entre l&apos;exonération de TVA,
            les mentions obligatoires, la numérotation séquentielle des factures et les modalités
            de conservation, les erreurs sont fréquentes et peuvent entraîner des redressements
            fiscaux. Ce guide fait le point sur les règles en vigueur et les bonnes pratiques.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            L&apos;exonération de TVA : le fondement légal
          </h2>
          <p className="mb-4 leading-relaxed">
            Les psychologues libéraux sont exonérés de TVA sur leurs prestations de soins.
            Cette exonération est prévue à l&apos;article 261-4-1° du Code général des impôts
            (CGI), qui exonère de TVA « les soins dispensés aux personnes par les membres des
            professions médicales et paramédicales réglementées ».
          </p>
          <p className="mb-4 leading-relaxed">
            Les psychologues, bien que leur profession ne soit pas « paramédicale » au sens
            strict, bénéficient de cette exonération pour les actes de diagnostic et de traitement
            des troubles mentaux et comportementaux exercés dans le cadre de leur pratique
            clinique habituelle. Cette exonération s&apos;applique également aux bilans
            neuropsychologiques et aux séances de psychothérapie.
          </p>
          <p className="mb-4 leading-relaxed">
            En pratique, cela signifie que le psychologue ne facture pas de TVA à ses patients,
            ne collecte pas de TVA et n&apos;a pas à déposer de déclaration de TVA (sauf si
            des activités accessibles non exonérées sont exercées en parallèle, comme la
            formation professionnelle non certifiée Qualiopi).
          </p>

          <div className="my-6 rounded-xl border border-amber-200 bg-amber-50 p-5">
            <p className="font-semibold text-amber-900">Attention — activités non exonérées</p>
            <p className="mt-2 text-sm text-amber-800">
              Certaines activités exercées par les psychologues sont soumises à TVA :
              vente de livres ou de matériel, formations professionnelles non certifiées Qualiopi,
              conférences à vocation commerciale. Si vous exercez ces activités, une déclaration
              de TVA peut être nécessaire. Consultez un expert-comptable pour sécuriser votre
              situation.
            </p>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Les mentions obligatoires sur une facture de psychologue
          </h2>
          <p className="mb-4 leading-relaxed">
            Une note d&apos;honoraires conforme doit comporter les informations suivantes :
          </p>

          <div className="mb-6 overflow-x-auto rounded-xl border border-gray-200">
            <table className="min-w-full text-sm">
              <thead className="bg-[#F1F0F9]">
                <tr>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Mention</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Obligatoire</th>
                  <th className="px-4 py-3 text-left font-semibold text-[#1E1B4B]">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {[
                  ['Date d\'émission', 'Oui', 'Date de rédaction de la facture'],
                  ['Numéro de facture séquentiel', 'Oui', 'Numérotation continue sans interruption (ex. PSY-2026-0001)'],
                  ['Nom et prénom du praticien', 'Oui', 'Tel qu\'enregistré à l\'ADELI'],
                  ['Adresse professionnelle', 'Oui', 'Adresse du cabinet'],
                  ['Numéro ADELI', 'Oui', 'Identifiant professionnel obligatoire'],
                  ['Numéro SIRET / SIREN', 'Oui', 'Si exercice en entreprise individuelle'],
                  ['Nom et prénom du patient', 'Oui', 'Ou référence anonymisée si confidentialité requise'],
                  ['Date de la prestation', 'Oui', 'Date de la séance'],
                  ['Description de la prestation', 'Oui', 'Ex. : « Consultation de psychologie »'],
                  ['Montant TTC', 'Oui', 'Montant total incluant les éventuels frais'],
                  ['Mention exonération TVA', 'Oui', '« TVA non applicable - article 261-4-1° du CGI »'],
                  ['Mode de paiement', 'Recommandé', 'Espèces, CB, virement, chèque'],
                ].map(([mention, req, note]) => (
                  <tr key={mention} className={req === 'Oui' ? '' : 'bg-gray-50'}>
                    <td className="px-4 py-3 font-medium">{mention}</td>
                    <td className="px-4 py-3">
                      <span className={`rounded px-2 py-0.5 text-xs font-medium ${req === 'Oui' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-600'}`}>
                        {req}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{note}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Le numéro ADELI : pourquoi est-il indispensable sur la facture ?
          </h2>
          <p className="mb-4 leading-relaxed">
            Le numéro ADELI (Automatisation DEs LIstes) est l&apos;identifiant national
            attribué à chaque professionnel de santé lors de son enregistrement auprès de
            l&apos;ARS. Pour les psychologues, cet identifiant est obligatoire sur toutes
            les notes d&apos;honoraires : il permet aux mutuelles et aux organismes de sécurité
            sociale de vérifier la qualité du praticien et de traiter les demandes de
            remboursement.
          </p>
          <p className="mb-4 leading-relaxed">
            Un numéro ADELI se compose de 9 chiffres. Si vous ne connaissez pas votre numéro,
            vous pouvez le retrouver sur votre attestation d&apos;enregistrement ARS ou en
            contactant directement l&apos;ARS de votre région.
          </p>
        </section>

        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Comment PsyLib génère des factures conformes automatiquement
          </h2>
          <p className="mb-4 leading-relaxed">
            PsyLib génère automatiquement les notes d&apos;honoraires conformes à l&apos;issue
            de chaque séance enregistrée. Le praticien renseigne une seule fois ses informations
            (nom, ADELI, SIRET, adresse) lors de l&apos;onboarding. Ensuite, chaque facture
            est pré-remplie avec toutes les mentions obligatoires, un numéro séquentiel unique,
            la date de la séance et le montant. L&apos;envoi par email au patient se fait en
            un clic.
          </p>
          <p className="mb-4 leading-relaxed">
            Le tableau de bord financier affiche en temps réel les revenus du mois, les factures
            en attente de paiement et le chiffre d&apos;affaires de l&apos;année. L&apos;export
            comptable permet de transmettre facilement les données à un expert-comptable.
          </p>
        </section>

        <section className="mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            Essayez PsyLib gratuitement pendant 14 jours
          </h2>
          <p className="mb-6 text-white/80">
            Factures conformes générées automatiquement, export comptable, tableau de bord financier.
            Sans carte bancaire.
          </p>
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>

        <section className="mb-12">
          <h2 className="mb-6 font-playfair text-2xl font-bold text-[#1E1B4B]">
            Questions fréquentes
          </h2>
          <div className="space-y-4">
            {[
              {
                q: "Les psychologues libéraux sont-ils exonérés de TVA ?",
                a: "Oui. Les prestations de soins de psychologie en libéral sont exonérées de TVA en vertu de l'article 261-4-1° du CGI. Cette exonération s'applique aux consultations, psychothérapies et bilans neuropsychologiques.",
              },
              {
                q: "Quelles mentions sont obligatoires sur une facture de psychologue libéral ?",
                a: "Date, numéro séquentiel, nom et coordonnées du praticien, numéro ADELI, SIRET, nom du patient, date et description de la prestation, montant TTC, mention 'TVA non applicable - art. 261-4-1° CGI'.",
              },
              {
                q: "Un psychologue est-il obligé de délivrer une facture ?",
                a: "Oui, pour toute prestation supérieure à 25 euros, sur demande du patient. La délivrance systématique est recommandée pour faciliter les remboursements mutuelle.",
              },
              {
                q: "Quelle est la différence entre micro-BNC et déclaration contrôlée ?",
                a: "Le micro-BNC (CA annuel < 77 700 €) offre un abattement forfaitaire de 34 %. La déclaration contrôlée (au-delà ou sur option) permet de déduire les charges réelles. Consultez un expert-comptable pour le choix optimal.",
              },
              {
                q: "PsyLib inclut-il le numéro ADELI automatiquement sur les factures ?",
                a: "Oui. Vous renseignez votre numéro ADELI une seule fois lors de l'onboarding PsyLib. Ensuite, il apparaît automatiquement sur toutes les notes d'honoraires générées.",
              },
            ].map((item) => (
              <details key={item.q} className="rounded-xl border border-gray-200 p-5">
                <summary className="cursor-pointer font-semibold text-[#1E1B4B]">{item.q}</summary>
                <p className="mt-3 leading-relaxed text-gray-700">{item.a}</p>
              </details>
            ))}
          </div>
        </section>

        <LeadMagnetCTA
          slug="guide-tarifs-facturation"
          title="Guide tarifs et facturation (PDF gratuit)"
          description="Recevez le guide complet : TVA Art. 261, mentions obligatoires, URSSAF, dispositif MonPsy et outils de facturation."
        />

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Guide rédigé par l&apos;équipe PsyLib — Mars 2026.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour à l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/guides" className="text-[#3D52A0] hover:underline">Tous les guides</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
