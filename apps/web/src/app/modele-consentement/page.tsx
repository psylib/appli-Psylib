import type { Metadata } from 'next';
import Link from 'next/link';
import { PrintButton } from './print-button';

export const metadata: Metadata = {
  title: "Modele de consentement patient RGPD | PsyLib",
  description:
    "Modele de formulaire de consentement patient pour psychologues. Information et recueil du consentement au traitement des donnees de sante, IA et teleconsultation. Conforme RGPD.",
  alternates: { canonical: 'https://psylib.eu/modele-consentement' },
  openGraph: {
    title: "Modele de consentement patient RGPD | PsyLib",
    description:
      "Formulaire type pour informer et recueillir le consentement de vos patients sur le traitement de leurs donnees via PsyLib.",
    url: 'https://psylib.eu/modele-consentement',
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
      name: "Modele de consentement patient",
      url: 'https://psylib.eu/modele-consentement',
      description:
        "Formulaire de consentement patient RGPD pour psychologues utilisant PsyLib.",
      publisher: { '@type': 'Organization', name: 'PsyLib', url: 'https://psylib.eu' },
      dateModified: '2026-05-08',
    },
    {
      '@type': 'BreadcrumbList',
      itemListElement: [
        { '@type': 'ListItem', position: 1, name: 'Accueil', item: 'https://psylib.eu' },
        {
          '@type': 'ListItem',
          position: 2,
          name: "Modele de consentement",
          item: 'https://psylib.eu/modele-consentement',
        },
      ],
    },
  ],
};

export default function ModeleConsentementPage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />

      {/* Print styles */}
      <style dangerouslySetInnerHTML={{ __html: `
        @media print {
          nav[aria-label="Fil d'Ariane"],
          .print-hide,
          header nav,
          footer {
            display: none !important;
          }
          article {
            max-width: 100% !important;
            padding: 0 !important;
            font-size: 11pt !important;
          }
          section {
            break-inside: avoid;
          }
          .consent-box {
            border: 1px solid #000 !important;
            background: transparent !important;
          }
          .signature-line {
            border-bottom: 1px solid #000;
            min-height: 60px;
          }
        }
      `}} />

      <article className="mx-auto max-w-3xl px-6 py-16 font-dm-sans text-[#1E1B4B]">
        <nav aria-label="Fil d&apos;Ariane" className="mb-8 text-sm text-gray-500">
          <Link href="/" className="hover:underline">Accueil</Link>
          <span className="mx-2">/</span>
          <span className="text-gray-700">Modele de consentement patient</span>
        </nav>

        <header className="mb-10">
          <p className="mb-3 text-sm font-medium uppercase tracking-wide text-[#3D52A0]">
            Document praticien — Version 1.0 — Mai 2026
          </p>
          <h1 className="font-playfair text-3xl font-bold leading-tight text-[#1E1B4B] md:text-4xl">
            Modele de consentement patient
          </h1>
          <p className="mt-4 text-lg text-gray-600">
            Formulaire d&apos;information et de recueil du consentement du patient au traitement
            de ses donnees personnelles et de sante via la plateforme PsyLib.
          </p>
        </header>

        {/* Print button */}
        <div className="print-hide mb-10 rounded-2xl bg-[#F1F0F9] p-6">
          <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="font-semibold text-[#1E1B4B]">Imprimez ce document</p>
              <p className="text-sm text-gray-600">
                Utilisez ce modele pour informer vos patients et recueillir leur consentement.
                Personnalisez-le avec vos coordonnees avant impression.
              </p>
            </div>
            <PrintButton />
          </div>
        </div>

        {/* Avertissement */}
        <div className="print-hide mb-10 rounded-2xl border border-amber-200 bg-amber-50 p-6">
          <p className="text-sm text-amber-800">
            <strong>Note :</strong> ce modele est fourni a titre indicatif. Chaque psychologue reste
            responsable de l&apos;adapter a sa pratique et de verifier sa conformite avec ses obligations
            deontologiques et legales. Ce document ne constitue pas un conseil juridique.
          </p>
        </div>

        {/* ==================== DÉBUT DU FORMULAIRE ==================== */}

        <div className="mb-10 border-b-2 border-[#3D52A0] pb-4 text-center">
          <h2 className="font-playfair text-2xl font-bold text-[#1E1B4B]">
            Formulaire d&apos;information et de consentement du patient
          </h2>
          <p className="mt-2 text-gray-600">
            Traitement des donnees personnelles et de sante via la plateforme PsyLib
          </p>
        </div>

        {/* 1. Identité du responsable */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            1. Identite du responsable de traitement
          </h2>
          <div className="rounded-2xl bg-[#F1F0F9] p-6 space-y-4">
            <p className="text-sm text-gray-600 italic">A remplir par le psychologue :</p>
            <div className="grid gap-3">
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Nom et prenom :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Numero ADELI / RPPS :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Adresse du cabinet :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Telephone :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Email :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
            </div>
          </div>
          <p className="mt-4 leading-relaxed">
            Le psychologue est le <strong>responsable de traitement</strong> de vos donnees
            personnelles et de sante au sens du Reglement General sur la Protection des Donnees (RGPD).
          </p>
          <p className="mt-2 leading-relaxed">
            La societe PsyLib (micro-entreprise Tony Ruppel, SIRET 102 784 956 00017) intervient en
            qualite de <strong>sous-traitant</strong> pour l&apos;hebergement et le fonctionnement de
            la plateforme logicielle.
          </p>
        </section>

        {/* 2. Données collectées */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            2. Donnees collectees
          </h2>
          <p className="mb-4 leading-relaxed">
            Dans le cadre de votre suivi psychologique, les donnees suivantes peuvent etre
            collectees et traitees via la plateforme PsyLib :
          </p>

          <h3 className="mb-2 font-playfair text-lg font-semibold text-[#1E1B4B]">
            Donnees d&apos;identification
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Nom, prenom, date de naissance</li>
            <li>Adresse e-mail, numero de telephone</li>
            <li>Pour les mineurs : identite du ou des tuteurs legaux</li>
          </ul>

          <h3 className="mb-2 font-playfair text-lg font-semibold text-[#1E1B4B]">
            Donnees de sante et donnees cliniques
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Notes cliniques redigees par le psychologue</li>
            <li>Resumes de seance (rediges par le psychologue ou assistes par IA)</li>
            <li>Exercices therapeutiques proposes</li>
            <li>Suivi d&apos;humeur (si vous utilisez l&apos;espace patient)</li>
            <li>Entrees de journal personnel (si vous utilisez l&apos;espace patient)</li>
          </ul>

          <h3 className="mb-2 font-playfair text-lg font-semibold text-[#1E1B4B]">
            Donnees d&apos;echange
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Messages echanges avec votre psychologue via la messagerie securisee</li>
            <li>Documents partages par votre psychologue</li>
          </ul>

          <h3 className="mb-2 font-playfair text-lg font-semibold text-[#1E1B4B]">
            Donnees de rendez-vous et facturation
          </h3>
          <ul className="list-inside list-disc space-y-1 text-gray-700">
            <li>Dates et horaires de rendez-vous</li>
            <li>Factures et informations de paiement</li>
          </ul>
        </section>

        {/* 3. Finalités */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            3. Finalites du traitement
          </h2>
          <p className="mb-4 leading-relaxed">
            Vos donnees sont traitees exclusivement pour les finalites suivantes :
          </p>
          <ul className="mb-6 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Suivi psychologique :</strong> gestion de votre dossier patient, prise de notes de seance, planification de rendez-vous</li>
            <li><strong>Communication securisee :</strong> echanges par messagerie chiffree entre vous et votre psychologue</li>
            <li><strong>Espace patient :</strong> suivi d&apos;humeur, exercices therapeutiques, journal personnel (si active)</li>
            <li><strong>Facturation :</strong> emission de factures et suivi des paiements</li>
            <li><strong>Aide redactionnelle par IA :</strong> generation de resumes structures de seance et d&apos;exercices therapeutiques (uniquement avec votre consentement specifique)</li>
          </ul>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="font-semibold text-[#1E1B4B]">Vos donnees ne sont jamais utilisees a des fins :</p>
            <ul className="mt-2 list-inside list-disc space-y-1 text-gray-700">
              <li>Marketing, publicitaires ou commerciales</li>
              <li>De recherche, de statistiques ou d&apos;analyse secondaire</li>
              <li>D&apos;entrainement ou d&apos;amelioration de modeles d&apos;intelligence artificielle</li>
            </ul>
          </div>
        </section>

        {/* 4. Hébergement et sécurité */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            4. Hebergement et securite
          </h2>
          <p className="mb-4 leading-relaxed">
            Vos donnees sont hebergees en <strong>France</strong> sur une infrastructure{' '}
            <strong>certifiee HDS</strong> (Hebergement de Donnees de Sante), conformement a
            l&apos;article L.1111-8 du Code de la sante publique.
          </p>
          <div className="mb-4 overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Couche</th>
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Technologie</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Perimetre</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">En transit</td>
                  <td className="py-3 pr-4">TLS 1.3</td>
                  <td className="py-3">Toutes les communications</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Au repos (disque)</td>
                  <td className="py-3 pr-4">Chiffrement OVH</td>
                  <td className="py-3">Toute la base de donnees</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Au repos (applicatif)</td>
                  <td className="py-3 pr-4">AES-256-GCM</td>
                  <td className="py-3">Notes cliniques, resumes IA, messages, journal</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Authentification</td>
                  <td className="py-3 pr-4">Keycloak + MFA TOTP</td>
                  <td className="py-3">Connexion du psychologue</td>
                </tr>
              </tbody>
            </table>
          </div>
          <p className="text-sm leading-relaxed text-gray-600">
            Aucun membre de l&apos;equipe PsyLib ne peut lire vos donnees cliniques — le chiffrement
            applicatif rend ces informations illisibles meme avec un acces au serveur. Chaque acces
            aux donnees sensibles est trace dans un journal d&apos;audit.
          </p>
        </section>

        {/* 5. Destinataires */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            5. Destinataires de vos donnees
          </h2>
          <p className="mb-4 leading-relaxed">Vos donnees sont accessibles uniquement par :</p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Votre psychologue :</strong> acces complet a votre dossier</li>
            <li><strong>Vous-meme :</strong> acces a votre espace patient (humeur, exercices, journal, documents partages)</li>
          </ul>
          <p className="leading-relaxed">
            Les sous-traitants techniques (hebergeur OVH, paiement Stripe, email Resend) n&apos;ont
            pas acces au contenu clinique. La liste complete des sous-traitants est consultable sur{' '}
            <Link href="/sous-traitants" className="text-[#3D52A0] hover:underline">
              psylib.eu/sous-traitants
            </Link>.
          </p>
        </section>

        {/* 6. Durée de conservation */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            6. Duree de conservation
          </h2>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-sm">
              <thead>
                <tr className="border-b border-gray-200 text-left">
                  <th className="py-3 pr-4 font-semibold text-[#1E1B4B]">Donnee</th>
                  <th className="py-3 font-semibold text-[#1E1B4B]">Duree de conservation</th>
                </tr>
              </thead>
              <tbody className="text-gray-700">
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Dossier patient et notes cliniques</td>
                  <td className="py-3">Duree du suivi + 5 ans apres la fin du suivi</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Messages</td>
                  <td className="py-3">Duree du suivi + 1 an</td>
                </tr>
                <tr className="border-b border-gray-100">
                  <td className="py-3 pr-4 font-medium">Factures</td>
                  <td className="py-3">10 ans (obligation legale comptable)</td>
                </tr>
                <tr>
                  <td className="py-3 pr-4 font-medium">Journal et suivi d&apos;humeur</td>
                  <td className="py-3">Duree du suivi, supprime sur demande</td>
                </tr>
              </tbody>
            </table>
          </div>
        </section>

        {/* 7. Intelligence artificielle */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            7. Traitement par intelligence artificielle
          </h2>
          <p className="mb-4 leading-relaxed">
            Votre psychologue peut utiliser un outil d&apos;<strong>aide redactionnelle par intelligence
            artificielle</strong> integre a PsyLib. Cet outil permet :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>De generer un resume structure a partir des notes de seance</li>
            <li>De proposer des exercices therapeutiques adaptes a votre profil</li>
          </ul>
          <div className="rounded-2xl bg-[#F1F0F9] p-6">
            <p className="mb-3 font-semibold text-[#1E1B4B]">Garanties :</p>
            <ul className="list-inside list-disc space-y-2 text-gray-700">
              <li>L&apos;IA est <strong>strictement une aide redactionnelle</strong>. Elle ne produit aucun diagnostic, aucune interpretation psychologique, aucun score de risque.</li>
              <li>Le psychologue <strong>valide, modifie ou supprime</strong> systematiquement tout contenu genere avant integration a votre dossier.</li>
              <li>Vos donnees <strong>ne sont jamais utilisees</strong> pour entrainer ou ameliorer des modeles d&apos;IA.</li>
              <li>L&apos;IA n&apos;a <strong>jamais</strong> acces a l&apos;integralite de votre dossier — seules les notes de la seance concernee sont transmises.</li>
              <li>Le traitement IA ne se declenche <strong>jamais automatiquement</strong> — c&apos;est toujours une action volontaire du psychologue.</li>
            </ul>
          </div>
          <p className="mt-4 text-sm text-gray-600 italic">
            Ce traitement necessite votre consentement specifique (section 10 ci-dessous).
            Vous pouvez le refuser sans consequence sur votre suivi.
          </p>
        </section>

        {/* 8. Téléconsultation et messagerie */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            8. Teleconsultation et messagerie
          </h2>
          <h3 className="mb-2 font-playfair text-lg font-semibold text-[#1E1B4B]">
            Visioconference
          </h3>
          <ul className="mb-4 list-inside list-disc space-y-1 text-gray-700">
            <li>Les consultations video sont realisees via un systeme auto-heberge en France (infrastructure HDS).</li>
            <li><strong>Aucun enregistrement</strong> audio ou video n&apos;est effectue.</li>
            <li>Les flux sont transmis en temps reel et ne sont pas conserves.</li>
            <li>Aucune transcription automatique n&apos;est realisee.</li>
          </ul>

          <h3 className="mb-2 font-playfair text-lg font-semibold text-[#1E1B4B]">
            Messagerie securisee
          </h3>
          <ul className="list-inside list-disc space-y-1 text-gray-700">
            <li>Les messages sont <strong>chiffres</strong> (AES-256-GCM) et heberges en France (HDS).</li>
            <li>Seuls vous et votre psychologue pouvez lire vos echanges.</li>
            <li>La messagerie est bidirectionnelle : vous et votre psychologue pouvez vous ecrire.</li>
          </ul>
        </section>

        {/* 9. Vos droits */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            9. Vos droits
          </h2>
          <p className="mb-4 leading-relaxed">
            Conformement au RGPD et a la loi Informatique et Libertes, vous disposez des droits suivants :
          </p>
          <ul className="mb-4 list-inside list-disc space-y-2 text-gray-700">
            <li><strong>Droit d&apos;acces :</strong> obtenir une copie de toutes vos donnees</li>
            <li><strong>Droit de rectification :</strong> corriger des informations inexactes</li>
            <li><strong>Droit a l&apos;effacement :</strong> demander la suppression de vos donnees</li>
            <li><strong>Droit a la portabilite :</strong> recevoir vos donnees dans un format structure</li>
            <li><strong>Droit d&apos;opposition :</strong> vous opposer a un traitement specifique</li>
            <li><strong>Droit de retrait du consentement :</strong> retirer votre consentement a tout moment, sans effet retroactif</li>
          </ul>
          <p className="leading-relaxed">
            Pour exercer ces droits, adressez-vous directement a votre psychologue ou contactez
            PsyLib a l&apos;adresse :{' '}
            <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
              tony@psylib.eu
            </a>
          </p>
          <p className="mt-2 leading-relaxed">
            Vous pouvez egalement introduire une reclamation aupres de la{' '}
            <strong>CNIL</strong> (Commission Nationale de l&apos;Informatique et des Libertes) :{' '}
            <a href="https://www.cnil.fr" className="text-[#3D52A0] hover:underline" target="_blank" rel="noopener noreferrer">
              www.cnil.fr
            </a>
          </p>
        </section>

        {/* 10. Consentement patient adulte */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            10. Consentement
          </h2>

          <div className="consent-box rounded-2xl bg-[#F1F0F9] p-6 mb-6">
            <p className="mb-4 text-sm font-medium text-gray-600 italic">A remplir par le patient :</p>
            <div className="grid gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Nom et prenom :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Date de naissance :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
            </div>

            <p className="mb-4 leading-relaxed">
              En signant ce document, je reconnais avoir pris connaissance des informations
              ci-dessus et :
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;accepte</strong> le traitement de mes donnees personnelles et de sante via
                  la plateforme PsyLib, dans les conditions decrites dans ce document, pour les
                  finalites de mon suivi psychologique.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;accepte</strong> que mes notes de seance puissent faire l&apos;objet
                  d&apos;un traitement par intelligence artificielle (aide redactionnelle), sous le
                  controle et la validation de mon psychologue.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>Je refuse</strong> le traitement de mes notes par intelligence artificielle.
                  Je comprends que mon suivi psychologique ne sera pas affecte par ce refus.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;accepte</strong> de recevoir des messages de mon psychologue via la
                  messagerie securisee PsyLib.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;accepte</strong> de recevoir des documents partages par mon psychologue
                  via PsyLib.
                </span>
              </label>
            </div>

            <div className="mt-8 grid gap-6 sm:grid-cols-2">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Date :</p>
                <div className="border-b border-dashed border-gray-400 h-8" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Signature du patient :</p>
                <div className="signature-line border-b border-dashed border-gray-400 h-16" />
              </div>
            </div>
          </div>
        </section>

        {/* 11. Consentement mineur */}
        <section className="mb-10">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            11. Consentement pour un patient mineur
          </h2>
          <p className="mb-4 text-sm text-gray-600 italic">
            A remplir par le ou les titulaires de l&apos;autorite parentale.
          </p>

          <div className="consent-box rounded-2xl bg-[#F1F0F9] p-6">
            <h3 className="mb-4 font-playfair text-lg font-semibold text-[#1E1B4B]">
              Mineur concerne
            </h3>
            <div className="grid gap-3 mb-6">
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Nom et prenom :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Date de naissance :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
            </div>

            <h3 className="mb-4 font-playfair text-lg font-semibold text-[#1E1B4B]">
              Titulaire(s) de l&apos;autorite parentale
            </h3>
            <div className="grid gap-3 mb-2">
              <p className="text-sm font-medium text-gray-600">Tuteur 1 :</p>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Nom et prenom :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Lien avec le mineur :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Email :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
            </div>
            <div className="grid gap-3 mb-6 mt-4">
              <p className="text-sm font-medium text-gray-600">Tuteur 2 (le cas echeant) :</p>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Nom et prenom :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Lien avec le mineur :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="w-48 text-sm font-medium text-gray-700">Email :</span>
                <span className="flex-1 border-b border-dashed border-gray-400">&nbsp;</span>
              </div>
            </div>

            <p className="mb-4 leading-relaxed">
              En qualite de titulaire de l&apos;autorite parentale, je reconnais avoir pris
              connaissance des informations ci-dessus et :
            </p>

            <div className="space-y-4">
              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;autorise</strong> le traitement des donnees personnelles et de sante
                  de mon enfant via la plateforme PsyLib, dans les conditions decrites dans ce document.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;autorise</strong> le traitement des notes de seance de mon enfant par
                  intelligence artificielle (aide redactionnelle), sous le controle du psychologue.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>Je refuse</strong> le traitement par intelligence artificielle pour mon enfant.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>J&apos;autorise</strong> l&apos;envoi de documents et messages via la
                  plateforme PsyLib dans le cadre du suivi de mon enfant.
                </span>
              </label>

              <label className="flex items-start gap-3">
                <span className="mt-0.5 inline-block h-5 w-5 shrink-0 rounded border-2 border-gray-400" />
                <span className="text-gray-700">
                  <strong>Je comprends</strong> que certaines informations cliniques peuvent rester
                  confidentielles entre le psychologue et mon enfant, conformement au Code de
                  deontologie des psychologues et dans l&apos;interet therapeutique du mineur.
                </span>
              </label>
            </div>

            <div className="mt-8 grid gap-6">
              <div>
                <p className="text-sm font-medium text-gray-700 mb-2">Date :</p>
                <div className="border-b border-dashed border-gray-400 h-8" />
              </div>
              <div className="grid gap-6 sm:grid-cols-2">
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Signature du tuteur 1 :</p>
                  <div className="signature-line border-b border-dashed border-gray-400 h-16" />
                </div>
                <div>
                  <p className="text-sm font-medium text-gray-700 mb-2">Signature du tuteur 2 :</p>
                  <div className="signature-line border-b border-dashed border-gray-400 h-16" />
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 12. Retrait du consentement */}
        <section className="mb-12">
          <h2 className="mb-4 font-playfair text-2xl font-bold text-[#1E1B4B]">
            12. Retrait du consentement
          </h2>
          <p className="mb-4 leading-relaxed">
            Vous pouvez retirer votre consentement a tout moment, sans justification et sans
            consequence sur votre suivi. Le retrait du consentement n&apos;affecte pas la liceite du
            traitement effectue avant ce retrait.
          </p>
          <p className="leading-relaxed">
            Pour retirer votre consentement, informez directement votre psychologue ou envoyez un
            e-mail a{' '}
            <a href="mailto:tony@psylib.eu" className="text-[#3D52A0] hover:underline">
              tony@psylib.eu
            </a>. Le retrait sera effectif sous 48 heures.
          </p>
        </section>

        {/* CTA */}
        <section className="print-hide mb-12 rounded-2xl bg-[#3D52A0] px-8 py-10 text-center text-white">
          <h2 className="mb-3 font-playfair text-2xl font-bold">
            La conformite RGPD simplifiee
          </h2>
          <p className="mb-6 text-white/80">
            PsyLib vous fournit les outils et les documents pour exercer votre activite en toute
            conformite. Hebergement HDS, chiffrement, audit — tout est integre.
          </p>
          <Link
            href="/register"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer gratuitement
          </Link>
        </section>

        <footer className="border-t border-gray-200 pt-8 text-sm text-gray-500">
          <p>
            Version 1.0 — Mai 2026.{' '}
            Ce document ne constitue pas un conseil juridique.{' '}
            <Link href="/" className="text-[#3D52A0] hover:underline">Retour a l&apos;accueil</Link>
            {' '}|{' '}
            <Link href="/privacy" className="text-[#3D52A0] hover:underline">Politique de confidentialite</Link>
            {' '}|{' '}
            <Link href="/dpa" className="text-[#3D52A0] hover:underline">DPA</Link>
            {' '}|{' '}
            <Link href="/terms" className="text-[#3D52A0] hover:underline">CGU</Link>
          </p>
        </footer>
      </article>
    </>
  );
}
