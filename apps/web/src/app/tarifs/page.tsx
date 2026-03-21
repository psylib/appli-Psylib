import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Tarifs | PsyLib — Logiciel pour psychologues",
  description:
    "Decouvrez les tarifs PsyLib : a partir de 49 euros/mois pour gerer votre cabinet de psychologue liberal. Essai gratuit 14 jours sans carte bancaire. Plans Starter, Pro et Scale.",
  keywords: [
    "tarifs psychologue",
    "prix logiciel psychologue",
    "logiciel gestion cabinet psychologue tarif",
    "psylib prix",
    "abonnement psychologue liberal",
    "logiciel psy tarif",
    "outil psychologue liberal prix",
  ],
  alternates: { canonical: "https://psylib.eu/tarifs" },
  openGraph: {
    title: "Tarifs PsyLib — Logiciel pour psychologues liberaux",
    description:
      "Plans a partir de 49 euros/mois. Dossiers patients, notes cliniques, facturation, IA. 14 jours d\"essai gratuit.",
    url: "https://psylib.eu/tarifs",
    type: "website",
    locale: "fr_FR",
    siteName: "PsyLib",
  },
  robots: { index: true, follow: true },
};

const tarifsJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "SoftwareApplication",
      name: "PsyLib",
      applicationCategory: "BusinessApplication",
      applicationSubCategory: "Logiciel de gestion de cabinet psychologue",
      operatingSystem: "Web",
      url: "https://psylib.eu/tarifs",
      offers: [
        {
          "@type": "Offer",
          name: "Starter",
          price: "49",
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "49",
            priceCurrency: "EUR",
            billingDuration: "P1M",
          },
          description:
            "20 patients, 40 sessions/mois, 10 resumes IA, profil public",
        },
        {
          "@type": "Offer",
          name: "Pro",
          price: "97",
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "97",
            priceCurrency: "EUR",
            billingDuration: "P1M",
          },
          description:
            "Patients et sessions illimites, 100 resumes IA, supervision, facturation PDF",
        },
        {
          "@type": "Offer",
          name: "Scale",
          price: "149",
          priceCurrency: "EUR",
          priceSpecification: {
            "@type": "UnitPriceSpecification",
            price: "149",
            priceCurrency: "EUR",
            billingDuration: "P1M",
          },
          description:
            "Tout Pro + IA illimitee, multi-praticiens, support prioritaire, analytics avances",
        },
      ],
    },
    {
      "@type": "FAQPage",
      mainEntity: [
        {
          "@type": "Question",
          name: "Puis-je changer de plan a tout moment ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Oui, vous pouvez passer a un plan superieur ou inferieur a tout moment. Le changement prend effet immediatement et le prorata est calcule automatiquement.",
          },
        },
        {
          "@type": "Question",
          name: "Que se passe-t-il apres les 14 jours d\"essai gratuit ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "A la fin de l\"essai gratuit, vous choisissez le plan qui vous convient. Si vous ne souscrivez pas, votre compte passe en mode lecture seule. Aucune donnee n\"est supprimee.",
          },
        },
        {
          "@type": "Question",
          name: "Y a-t-il un engagement de duree ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Non, tous les plans sont sans engagement. Vous pouvez resilier a tout moment depuis votre espace de facturation. L\"abonnement annuel offre une reduction de 20%.",
          },
        },
        {
          "@type": "Question",
          name: "Quels moyens de paiement acceptez-vous ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Nous acceptons les cartes bancaires (Visa, Mastercard, CB) via Stripe, notre partenaire de paiement securise. Le prelevement SEPA est disponible pour les abonnements annuels.",
          },
        },
        {
          "@type": "Question",
          name: "Mes donnees sont-elles securisees ?",
          acceptedAnswer: {
            "@type": "Answer",
            text: "Absolument. PsyLib est heberge sur infrastructure certifiee HDS en France. Toutes les donnees cliniques sont chiffrees avec AES-256-GCM. Nous sommes conformes au RGPD et a la reglementation HDS.",
          },
        },
      ],
    },
  ],
};

const plans = [
  {
    name: "Starter",
    description: "Pour demarrer votre pratique",
    priceMonthly: 49,
    priceAnnual: 39,
    highlighted: false,
    features: [
      "20 patients maximum",
      "40 sessions par mois",
      "10 resumes IA par mois",
      "Profil public psylib.eu/psy/votre-nom",
      "Prise de RDV en ligne",
      "Notes cliniques SOAP / DAP",
      "Dossiers patients securises",
      "Chiffrement HDS AES-256",
      "Support par email",
    ],
    cta: "Commencer l\"essai gratuit",
  },
  {
    name: "Pro",
    description: "Pour les praticiens etablis",
    priceMonthly: 97,
    priceAnnual: 79,
    highlighted: true,
    badge: "Le plus populaire",
    features: [
      "Patients illimites",
      "Sessions illimitees",
      "100 resumes IA par mois",
      "5 formations incluses",
      "Supervision / Intervision",
      "Facturation PDF automatique",
      "Outcome tracking (PHQ-9, GAD-7)",
      "Espace patient securise",
      "Messagerie psy-patient",
      "Analytics de cabinet",
      "Support prioritaire",
    ],
    cta: "Commencer l\"essai gratuit",
  },
  {
    name: "Scale",
    description: "Pour les cabinets multi-praticiens",
    priceMonthly: 149,
    priceAnnual: 119,
    highlighted: false,
    features: [
      "Tout le plan Pro inclus",
      "Resumes IA illimites",
      "Multi-praticiens (jusqu\"a 10)",
      "Support prioritaire dedie",
      "Analytics avances et rapports",
      "API personnalisee",
      "Formations illimitees",
      "Onboarding personnalise",
      "SLA garanti 99.9%",
    ],
    cta: "Contacter l\"equipe commerciale",
  },
];

const comparisonFeatures = [
  { name: "Patients", starter: "20", pro: "Illimite", scale: "Illimite" },
  { name: "Sessions / mois", starter: "40", pro: "Illimite", scale: "Illimite" },
  { name: "Resumes IA / mois", starter: "10", pro: "100", scale: "Illimite" },
  { name: "Notes cliniques SOAP / DAP", starter: true, pro: true, scale: true },
  { name: "Profil public", starter: true, pro: true, scale: true },
  { name: "Prise de RDV en ligne", starter: true, pro: true, scale: true },
  { name: "Chiffrement HDS", starter: true, pro: true, scale: true },
  { name: "Facturation PDF", starter: false, pro: true, scale: true },
  { name: "Outcome tracking", starter: false, pro: true, scale: true },
  { name: "Espace patient", starter: false, pro: true, scale: true },
  { name: "Supervision / Intervision", starter: false, pro: true, scale: true },
  { name: "Formations", starter: "0", pro: "5", scale: "Illimite" },
  { name: "Messagerie psy-patient", starter: false, pro: true, scale: true },
  { name: "Analytics de cabinet", starter: false, pro: true, scale: true },
  { name: "Multi-praticiens", starter: false, pro: false, scale: true },
  { name: "Support prioritaire dedie", starter: false, pro: false, scale: true },
  { name: "API personnalisee", starter: false, pro: false, scale: true },
  { name: "SLA garanti", starter: false, pro: false, scale: true },
];

const faqs = [
  {
    question: "Puis-je changer de plan a tout moment ?",
    answer:
      "Oui, vous pouvez passer a un plan superieur ou inferieur a tout moment depuis votre espace de facturation. Le changement prend effet immediatement et le prorata est calcule automatiquement par Stripe.",
  },
  {
    question: "Que se passe-t-il apres les 14 jours d\"essai gratuit ?",
    answer:
      "A la fin de votre essai, vous choisissez le plan qui correspond a votre pratique. Si vous ne souscrivez pas, votre compte passe en mode lecture seule : vous conservez l\"acces a vos donnees mais ne pouvez plus creer de sessions ou de patients. Aucune donnee n\"est jamais supprimee.",
  },
  {
    question: "Y a-t-il un engagement de duree ?",
    answer:
      "Non, tous les plans sont sans engagement. Vous pouvez resilier a tout moment. L\"abonnement annuel offre une reduction de 20% mais reste resiliable avec remboursement au prorata des mois non consommes.",
  },
  {
    question: "Quels moyens de paiement acceptez-vous ?",
    answer:
      "Nous acceptons les cartes bancaires (Visa, Mastercard, CB) via Stripe, notre partenaire de paiement securise certifie PCI DSS. Le prelevement SEPA est disponible pour les abonnements annuels.",
  },
  {
    question: "Mes donnees sont-elles securisees meme sur le plan Starter ?",
    answer:
      "Oui, tous les plans beneficient du meme niveau de securite : hebergement HDS certifie en France, chiffrement AES-256-GCM des donnees cliniques, authentification MFA, et conformite RGPD complete. La securite n\"est jamais une option payante.",
  },
];

export default function TarifsPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF] font-dm-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(tarifsJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-playfair text-4xl font-bold md:text-5xl">
            Des tarifs simples et transparents
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Choisissez le plan adapte a votre pratique. Tous les plans incluent
            14 jours d&apos;essai gratuit, sans carte bancaire.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-6xl px-6 pt-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-800">
            Accueil
          </Link>{" "}
          &rsaquo;{" "}
          <span className="font-medium text-gray-800">Tarifs</span>
        </nav>
      </div>

      {/* Pricing cards */}
      <section className="mx-auto max-w-6xl px-6 py-16">
        <div className="grid gap-8 md:grid-cols-3">
          {plans.map((plan) => (
            <div
              key={plan.name}
              className={`relative rounded-2xl border p-8 shadow-sm transition hover:shadow-md ${
                plan.highlighted
                  ? "border-[#3D52A0] bg-white ring-2 ring-[#3D52A0]"
                  : "border-gray-200 bg-white"
              }`}
            >
              {plan.highlighted && (
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 rounded-full bg-[#3D52A0] px-4 py-1 text-xs font-semibold text-white">
                  {plan.badge}
                </span>
              )}
              <h3 className="font-playfair text-2xl font-bold text-[#1E1B4B]">
                {plan.name}
              </h3>
              <p className="mt-1 text-sm text-gray-500">{plan.description}</p>

              {/* Monthly price */}
              <div className="mt-6">
                <div className="flex items-baseline gap-1">
                  <span className="text-4xl font-bold text-[#1E1B4B]">
                    {plan.priceMonthly}&euro;
                  </span>
                  <span className="text-gray-500">/mois</span>
                </div>
                <p className="mt-1 text-sm text-[#3D52A0] font-medium">
                  ou {plan.priceAnnual}&euro;/mois en annuel{" "}
                  <span className="text-xs text-gray-400">
                    (economisez{" "}
                    {Math.round(
                      ((plan.priceMonthly - plan.priceAnnual) /
                        plan.priceMonthly) *
                        100
                    )}
                    %)
                  </span>
                </p>
              </div>

              {/* Features */}
              <ul className="mt-8 space-y-3">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-gray-700"
                  >
                    <svg
                      className="mt-0.5 h-4 w-4 flex-shrink-0 text-[#3D52A0]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                    {feature}
                  </li>
                ))}
              </ul>

              <Link
                href="/login"
                className={`mt-8 block w-full rounded-lg py-3 text-center font-semibold transition ${
                  plan.highlighted
                    ? "bg-[#3D52A0] text-white hover:bg-[#2D3F80]"
                    : "bg-[#F1F0F9] text-[#3D52A0] hover:bg-[#E5E3F0]"
                }`}
              >
                {plan.cta}
              </Link>
            </div>
          ))}
        </div>

        <p className="mt-8 text-center text-sm text-gray-500">
          14 jours d&apos;essai gratuit sur tous les plans. Sans carte bancaire.
          Sans engagement.
        </p>
      </section>

      {/* Feature comparison table */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-6xl px-6">
          <h2 className="font-playfair text-center text-3xl font-bold text-[#1E1B4B]">
            Comparaison detaillee des plans
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Retrouvez toutes les fonctionnalites incluses dans chaque plan.
          </p>

          <div className="mt-10 overflow-x-auto">
            <table className="w-full min-w-[600px] text-left text-sm">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="py-4 pr-4 font-semibold text-[#1E1B4B]">
                    Fonctionnalite
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-[#1E1B4B]">
                    Starter
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-[#3D52A0]">
                    Pro
                  </th>
                  <th className="px-4 py-4 text-center font-semibold text-[#1E1B4B]">
                    Scale
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparisonFeatures.map((feature) => (
                  <tr
                    key={feature.name}
                    className="border-b border-gray-100 hover:bg-[#F8F7FF]"
                  >
                    <td className="py-3 pr-4 text-gray-700">{feature.name}</td>
                    {(["starter", "pro", "scale"] as const).map((plan) => (
                      <td key={plan} className="px-4 py-3 text-center">
                        {typeof feature[plan] === "boolean" ? (
                          feature[plan] ? (
                            <svg
                              className="mx-auto h-5 w-5 text-[#3D52A0]"
                              fill="none"
                              viewBox="0 0 24 24"
                              stroke="currentColor"
                              strokeWidth={2}
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                d="M5 13l4 4L19 7"
                              />
                            </svg>
                          ) : (
                            <span className="text-gray-300">&mdash;</span>
                          )
                        ) : (
                          <span className="font-medium text-gray-700">
                            {feature[plan]}
                          </span>
                        )}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* ROI Section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <h2 className="font-playfair text-center text-3xl font-bold text-[#1E1B4B]">
          Combien de temps gagnez-vous ?
        </h2>
        <p className="mx-auto mt-3 max-w-2xl text-center text-gray-500">
          Les psychologues qui utilisent PsyLib economisent en moyenne
          5 heures par semaine sur les taches administratives.
        </p>

        <div className="mt-10 grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-[#F1F0F9] p-8 text-center">
            <p className="text-4xl font-bold text-[#3D52A0]">5h</p>
            <p className="mt-2 text-sm text-gray-600">
              gagnees par semaine sur l&apos;administratif
            </p>
          </div>
          <div className="rounded-2xl bg-[#F1F0F9] p-8 text-center">
            <p className="text-4xl font-bold text-[#3D52A0]">20h</p>
            <p className="mt-2 text-sm text-gray-600">
              economisees par mois
            </p>
          </div>
          <div className="rounded-2xl bg-[#F1F0F9] p-8 text-center">
            <p className="text-4xl font-bold text-[#3D52A0]">1 400&euro;</p>
            <p className="mt-2 text-sm text-gray-600">
              de valeur gagnee par mois (a 70&euro;/h)
            </p>
          </div>
        </div>

        <div className="mt-8 rounded-2xl border border-gray-200 bg-white p-8">
          <h3 className="font-playfair text-xl font-bold text-[#1E1B4B]">
            Le calcul est simple
          </h3>
          <p className="mt-3 text-gray-600 leading-relaxed">
            Un psychologue liberal passe en moyenne 5 heures par semaine
            sur la gestion administrative : prises de notes, facturation,
            relances, agenda, dossiers patients. Avec PsyLib, ces taches
            sont automatisees ou simplifiees. A un tarif horaire moyen
            de 70&euro;, cela represente <strong>1 400&euro; de valeur
            recuperee chaque mois</strong> — soit un retour sur
            investissement de plus de 14x pour le plan Pro.
          </p>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-3xl px-6">
          <h2 className="font-playfair text-center text-3xl font-bold text-[#1E1B4B]">
            Questions sur les tarifs
          </h2>

          <div className="mt-10 space-y-4">
            {faqs.map((faq) => (
              <details
                key={faq.question}
                className="group rounded-xl border border-gray-200 bg-[#F8F7FF] px-6 py-4"
              >
                <summary className="flex cursor-pointer items-center justify-between font-semibold text-[#1E1B4B]">
                  {faq.question}
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
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-[#3D52A0] to-[#7B9CDA] py-16 text-center text-white">
        <h2 className="font-playfair text-2xl font-bold md:text-3xl">
          14 jours d&apos;essai gratuit — sans carte bancaire
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          Testez toutes les fonctionnalites de PsyLib sans engagement.
          Vos donnees sont securisees et hebergees en France (HDS).
        </p>
        <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link
            href="/login"
            className="inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
          >
            Commencer l&apos;essai gratuit
          </Link>
          <Link
            href="/comparaison"
            className="inline-block text-sm text-white/80 hover:text-white underline underline-offset-4 transition"
          >
            Comparer avec les alternatives
          </Link>
        </div>
      </section>
    </main>
  );
}
