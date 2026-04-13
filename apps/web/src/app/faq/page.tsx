import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "FAQ | PsyLib — Questions frequentes",
  description:
    "Retrouvez les reponses a toutes vos questions sur PsyLib : fonctionnalites, securite HDS, conformite RGPD, abonnement, facturation et support technique.",
  keywords: [
    "faq psychologue",
    "questions logiciel psy",
    "psylib aide",
    "logiciel psychologue questions",
    "hds psychologue faq",
    "rgpd psychologue",
    "support psylib",
  ],
  alternates: { canonical: "https://psylib.eu/faq" },
  openGraph: {
    title: "FAQ PsyLib — Questions frequentes",
    description:
      "Securite, fonctionnalites, abonnement, support : toutes les reponses pour les psychologues liberaux.",
    url: "https://psylib.eu/faq",
    type: "website",
    locale: "fr_FR",
    siteName: "PsyLib",
  },
  robots: { index: true, follow: true },
};

const faqCategories = [
  {
    title: "General",
    questions: [
      {
        q: "Qu\"est-ce que PsyLib ?",
        a: "PsyLib est une plateforme SaaS tout-en-un concue specifiquement pour les psychologues liberaux en France. Elle reunit la gestion de cabinet (dossiers patients, notes cliniques, agenda), la facturation, le suivi therapeutique (outcome tracking), un assistant IA et un espace patient securise — le tout heberge sur infrastructure certifiee HDS.",
      },
      {
        q: "A qui s\"adresse PsyLib ?",
        a: "PsyLib s\"adresse a tous les psychologues liberaux en France, qu\"ils soient en debut de carriere ou praticiens etablis. Le plan Starter convient aux jeunes installes (jusqu\"a 40 patients), le plan Pro aux praticiens avec une patientele etablie, et le plan Scale aux cabinets multi-praticiens.",
      },
      {
        q: "Puis-je essayer PsyLib gratuitement ?",
        a: "Oui, tous les plans incluent 14 jours d\"essai gratuit, sans carte bancaire requise. Vous avez acces a toutes les fonctionnalites du plan Pro pendant votre essai pour decouvrir l\"ensemble des outils.",
      },
      {
        q: "Comment demarrer avec PsyLib ?",
        a: "L\"inscription prend moins de 3 minutes. Creez votre compte, completez votre profil praticien (nom, numero ADELI, specialite), configurez votre cabinet et commencez a utiliser PsyLib immediatement. Un onboarding guide vous accompagne pas a pas.",
      },
    ],
  },
  {
    title: "Securite et Conformite",
    questions: [
      {
        q: "PsyLib est-il certifie HDS (Hebergeur de Donnees de Sante) ?",
        a: "Oui, PsyLib est heberge sur une infrastructure certifiee HDS en France, conformement a l\"article L.1111-8 du Code de la sante publique. Les donnees de vos patients sont stockees exclusivement sur des serveurs situes en France.",
      },
      {
        q: "Comment les donnees de mes patients sont-elles chiffrees ?",
        a: "Toutes les donnees cliniques sensibles (notes de seance, resumes IA, messages, journaux patients) sont chiffrees avec l\"algorithme AES-256-GCM au niveau applicatif. Les donnees sont egalement chiffrees au repos (chiffrement disque) et en transit (TLS 1.3). Chaque acces aux donnees chiffrees est trace dans les logs d\"audit.",
      },
      {
        q: "PsyLib est-il conforme au RGPD ?",
        a: "Oui, PsyLib est entierement conforme au RGPD. Nous implementons : consentements explicites versiones, droit a l\"effacement (suppression complete des donnees sur demande), droit a la portabilite (export de toutes les donnees), minimisation des donnees collectees, et un registre de traitement a jour. Notre DPO est joignable a dpo@psylib.eu.",
      },
      {
        q: "Ou sont stockees mes donnees ?",
        a: "Toutes les donnees sont hebergees en France (region Paris). La base de donnees PostgreSQL, le stockage fichiers et les sauvegardes sont tous situes sur des infrastructures certifiees HDS. Aucune donnee patient ne transite par des serveurs hors de France.",
      },
    ],
  },
  {
    title: "Fonctionnalites",
    questions: [
      {
        q: "Comment fonctionne le resume de seance par IA ?",
        a: "Apres avoir redige vos notes de seance, cliquez sur \"Assistant IA\" pour generer un resume structure comprenant les themes abordes, les progres observes, le plan therapeutique et les points de suivi. L\"IA ne s\"active jamais automatiquement : c\"est toujours vous qui decidez. Les notes ne sont traitees qu\"avec votre consentement explicite.",
      },
      {
        q: "Qu\"est-ce que l\"espace patient ?",
        a: "L\"espace patient est un portail securise accessible a vos patients via invitation. Ils peuvent y suivre leur humeur quotidienne, tenir un journal therapeutique, completer des exercices que vous leur assignez et remplir des questionnaires d\"evaluation (PHQ-9, GAD-7). Tout est chiffre et conforme HDS.",
      },
      {
        q: "PsyLib propose-t-il la facturation ?",
        a: "Oui, a partir du plan Pro, PsyLib genere automatiquement des factures PDF conformes aux obligations legales (mentions obligatoires, exoneration TVA article 261-4-1 du CGI). Vous pouvez les envoyer directement par email a vos patients ou les telecharger.",
      },
      {
        q: "Comment fonctionne la prise de rendez-vous en ligne ?",
        a: "Configurez vos disponibilites (jours, horaires, duree de seance) dans votre profil. Vos patients ou nouveaux patients peuvent ensuite prendre rendez-vous directement depuis votre profil public psylib.eu/psy/votre-nom. Vous recevez une notification et pouvez confirmer ou decliner chaque demande.",
      },
    ],
  },
  {
    title: "Abonnement et Facturation",
    questions: [
      {
        q: "Quels sont les plans disponibles ?",
        a: "PsyLib propose quatre plans : Free (gratuit, 10 patients), Solo (25 euros/mois ou 22 euros/mois en annuel, 50 patients), Pro (50 euros/mois ou 45 euros/mois en annuel, patients illimites et IA illimitee), et Clinic (79 euros/mois ou 69 euros/mois en annuel, multi-praticiens). Les plans payants incluent 14 jours d\"essai gratuit.",
      },
      {
        q: "Que se passe-t-il a la fin de l\"essai gratuit ?",
        a: "A la fin des 14 jours, vous choisissez le plan qui vous convient. Si vous ne souscrivez pas, votre compte passe en mode lecture seule : vous conservez l\"acces a vos donnees existantes mais ne pouvez plus creer de sessions ou de patients. Aucune donnee n\"est supprimee.",
      },
      {
        q: "Puis-je resilier a tout moment ?",
        a: "Oui, tous les plans sont sans engagement. Vous pouvez resilier a tout moment depuis votre espace de facturation dans les parametres. Votre acces reste actif jusqu\"a la fin de la periode payee. Pour les abonnements annuels, un remboursement au prorata est possible.",
      },
      {
        q: "Quels moyens de paiement sont acceptes ?",
        a: "Nous acceptons les cartes bancaires (Visa, Mastercard, CB) via Stripe, notre partenaire de paiement certifie PCI DSS. Le prelevement SEPA est disponible pour les abonnements annuels. Toutes les transactions sont securisees.",
      },
    ],
  },
  {
    title: "Support",
    questions: [
      {
        q: "Comment contacter le support ?",
        a: "Vous pouvez nous contacter par email a support@psylib.eu, via le chat en direct integre dans votre tableau de bord (Crisp), ou consulter notre centre d\"aide. Les utilisateurs du plan Scale beneficient d\"un support prioritaire dedie.",
      },
      {
        q: "Quel est le delai de reponse du support ?",
        a: "Nous nous engageons a repondre sous 24 heures ouvrees pour tous les plans. Les utilisateurs Scale beneficient d\"un support prioritaire avec un delai garanti de 4 heures ouvrees. Les incidents critiques (indisponibilite du service) sont traites en priorite absolue.",
      },
      {
        q: "Puis-je exporter mes donnees ?",
        a: "Oui, vous pouvez exporter toutes vos donnees a tout moment : export CSV de vos patients, sessions et factures depuis le tableau de bord, et export RGPD complet (toutes les donnees associees a un patient) au format JSON. Vos donnees vous appartiennent.",
      },
    ],
  },
];

const allQuestions = faqCategories.flatMap((cat) =>
  cat.questions.map((q) => ({
    "@type": "Question" as const,
    name: q.q,
    acceptedAnswer: {
      "@type": "Answer" as const,
      text: q.a,
    },
  }))
);

const faqJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "FAQPage",
      mainEntity: allQuestions,
    },
    {
      "@type": "BreadcrumbList",
      itemListElement: [
        {
          "@type": "ListItem",
          position: 1,
          name: "Accueil",
          item: "https://psylib.eu",
        },
        {
          "@type": "ListItem",
          position: 2,
          name: "FAQ",
          item: "https://psylib.eu/faq",
        },
      ],
    },
  ],
};

export default function FaqPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF] font-dm-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(faqJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-playfair text-4xl font-bold md:text-5xl">
            Questions frequentes
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Retrouvez les reponses a toutes vos questions sur PsyLib,
            la plateforme de gestion de cabinet pour psychologues liberaux.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-4xl px-6 pt-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-800">
            Accueil
          </Link>{" "}
          &rsaquo;{" "}
          <span className="font-medium text-gray-800">FAQ</span>
        </nav>
      </div>

      {/* FAQ Categories */}
      <section className="mx-auto max-w-4xl px-6 py-12">
        {/* Quick nav */}
        <div className="mb-12 flex flex-wrap gap-3">
          {faqCategories.map((cat) => (
            <a
              key={cat.title}
              href={`#${cat.title.toLowerCase().replace(/[^a-z]/g, "-")}`}
              className="rounded-full bg-white px-4 py-2 text-sm font-medium text-[#3D52A0] shadow-sm transition hover:bg-[#3D52A0] hover:text-white"
            >
              {cat.title}
            </a>
          ))}
        </div>

        <div className="space-y-12">
          {faqCategories.map((category) => (
            <div
              key={category.title}
              id={category.title.toLowerCase().replace(/[^a-z]/g, "-")}
            >
              <h2 className="font-playfair text-2xl font-bold text-[#1E1B4B]">
                {category.title}
              </h2>
              <div className="mt-4 space-y-3">
                {category.questions.map((faq) => (
                  <details
                    key={faq.q}
                    className="group rounded-xl border border-gray-200 bg-white px-6 py-4"
                  >
                    <summary className="flex cursor-pointer items-center justify-between font-semibold text-[#1E1B4B]">
                      <span className="pr-4">{faq.q}</span>
                      <svg
                        className="h-5 w-5 flex-shrink-0 text-[#3D52A0] transition-transform group-open:rotate-180"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                        strokeWidth={2}
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </summary>
                    <p className="mt-3 text-gray-600 leading-relaxed">
                      {faq.a}
                    </p>
                  </details>
                ))}
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Still have questions */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6 text-center">
          <h2 className="font-playfair text-2xl font-bold text-[#1E1B4B]">
            Vous n&apos;avez pas trouve votre reponse ?
          </h2>
          <p className="mt-3 text-gray-500">
            Notre equipe est disponible pour repondre a toutes vos questions.
          </p>
          <div className="mt-8 flex flex-col items-center gap-4 sm:flex-row sm:justify-center">
            <Link
              href="/contact"
              className="rounded-lg bg-[#3D52A0] px-6 py-3 font-semibold text-white transition hover:bg-[#2D3F80]"
            >
              Nous contacter
            </Link>
            <Link
              href="/guides"
              className="rounded-lg bg-[#F1F0F9] px-6 py-3 font-semibold text-[#3D52A0] transition hover:bg-[#E5E3F0]"
            >
              Consulter nos guides
            </Link>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-[#3D52A0] to-[#7B9CDA] py-16 text-center text-white">
        <h2 className="font-playfair text-2xl font-bold md:text-3xl">
          Pret a simplifier la gestion de votre cabinet ?
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Essayez PsyLib gratuitement pendant 14 jours. Sans carte bancaire,
          sans engagement.
        </p>
        <Link
          href="/register"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
        >
          Commencer l&apos;essai gratuit
        </Link>
      </section>
    </main>
  );
}
