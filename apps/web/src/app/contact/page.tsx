import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Contact | PsyLib — Nous contacter",
  description:
    "Contactez l\"equipe PsyLib : support technique, questions commerciales, partenariats ou demandes RGPD. Reponse garantie sous 24h ouvrees.",
  keywords: [
    "contact psylib",
    "support psychologue logiciel",
    "contacter psylib",
    "aide logiciel psy",
    "dpo psylib",
  ],
  alternates: { canonical: "https://psylib.eu/contact" },
  openGraph: {
    title: "Contactez PsyLib — Support et informations",
    description:
      "Support technique, questions commerciales, partenariats ou RGPD. Notre equipe repond sous 24h ouvrees.",
    url: "https://psylib.eu/contact",
    type: "website",
    locale: "fr_FR",
    siteName: "PsyLib",
  },
  robots: { index: true, follow: true },
};

const contactJsonLd = {
  "@context": "https://schema.org",
  "@graph": [
    {
      "@type": "ContactPage",
      name: "Contact PsyLib",
      url: "https://psylib.eu/contact",
      description:
        "Contactez l\"equipe PsyLib pour le support technique, les questions commerciales, les partenariats ou les demandes RGPD.",
    },
    {
      "@type": "Organization",
      name: "PsyLib",
      url: "https://psylib.eu",
      logo: "https://psylib.eu/logo.png",
      email: "contact@psylib.eu",
      contactPoint: [
        {
          "@type": "ContactPoint",
          contactType: "technical support",
          email: "support@psylib.eu",
          availableLanguage: "French",
          hoursAvailable: {
            "@type": "OpeningHoursSpecification",
            dayOfWeek: [
              "Monday",
              "Tuesday",
              "Wednesday",
              "Thursday",
              "Friday",
            ],
            opens: "09:00",
            closes: "18:00",
          },
        },
        {
          "@type": "ContactPoint",
          contactType: "sales",
          email: "contact@psylib.eu",
          availableLanguage: "French",
        },
        {
          "@type": "ContactPoint",
          contactType: "data protection",
          email: "dpo@psylib.eu",
          availableLanguage: "French",
        },
      ],
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
          name: "Contact",
          item: "https://psylib.eu/contact",
        },
      ],
    },
  ],
};

const contactChannels = [
  {
    title: "Support technique",
    description:
      "Un probleme technique ? Notre equipe vous aide a le resoudre rapidement.",
    email: "support@psylib.eu",
    icon: (
      <svg
        className="h-8 w-8 text-[#3D52A0]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M11.42 15.17l-5.385 5.376A1.5 1.5 0 014.5 19.5V5.25A2.25 2.25 0 016.75 3h10.5A2.25 2.25 0 0119.5 5.25v6.5a2.25 2.25 0 01-2.25 2.25h-3.08l-2.75 1.17z"
        />
      </svg>
    ),
    responseTime: "Sous 24h ouvrees",
  },
  {
    title: "Questions commerciales",
    description:
      "Tarifs, plans, demos personnalisees, devis pour cabinets multi-praticiens.",
    email: "contact@psylib.eu",
    icon: (
      <svg
        className="h-8 w-8 text-[#3D52A0]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M20.25 8.511c.884.284 1.5 1.128 1.5 2.097v4.286c0 1.136-.847 2.1-1.98 2.193-.34.027-.68.052-1.02.072v3.091l-3-3a49.5 49.5 0 01-4.02-.163 2.115 2.115 0 01-1.825-2.098v-4.39a2.112 2.112 0 011.795-2.088 49.079 49.079 0 014.275-.2m0 0a49.1 49.1 0 014.275.2m-8.55 0a49.192 49.192 0 00-4.275.2A2.112 2.112 0 003.75 10.6v4.39c0 1.055.78 1.96 1.825 2.098.36.046.724.085 1.09.118l2.585 2.585v-2.7c.34-.02.68-.045 1.02-.072A2.12 2.12 0 0012.25 14.9v-4.39a2.115 2.115 0 00-1.795-2.093"
        />
      </svg>
    ),
    responseTime: "Sous 24h ouvrees",
  },
  {
    title: "Partenariats",
    description:
      "Vous etes un organisme de formation, une association ou un editeur ? Collaborons.",
    email: "partnerships@psylib.eu",
    icon: (
      <svg
        className="h-8 w-8 text-[#3D52A0]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M18 18.72a9.094 9.094 0 003.741-.479 3 3 0 00-4.682-2.72m.94 3.198l.001.031c0 .225-.012.447-.037.666A11.944 11.944 0 0112 21c-2.17 0-4.207-.576-5.963-1.584A6.062 6.062 0 016 18.719m12 0a5.971 5.971 0 00-.941-3.197m0 0A5.995 5.995 0 0012 12.75a5.995 5.995 0 00-5.058 2.772m0 0a3 3 0 00-4.681 2.72 8.986 8.986 0 003.74.477m.94-3.197a5.971 5.971 0 00-.94 3.197M15 6.75a3 3 0 11-6 0 3 3 0 016 0zm6 3a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0zm-13.5 0a2.25 2.25 0 11-4.5 0 2.25 2.25 0 014.5 0z"
        />
      </svg>
    ),
    responseTime: "Sous 48h ouvrees",
  },
  {
    title: "Delegue a la Protection des Donnees (DPO)",
    description:
      "Demandes RGPD, droit d\"acces, droit a l\"effacement, questions de conformite.",
    email: "dpo@psylib.eu",
    icon: (
      <svg
        className="h-8 w-8 text-[#3D52A0]"
        fill="none"
        viewBox="0 0 24 24"
        stroke="currentColor"
        strokeWidth={1.5}
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M9 12.75L11.25 15 15 9.75m-3-7.036A11.959 11.959 0 013.598 6 11.99 11.99 0 003 9.749c0 5.592 3.824 10.29 9 11.623 5.176-1.332 9-6.03 9-11.622 0-1.31-.21-2.571-.598-3.751h-.152c-3.196 0-6.1-1.248-8.25-3.285z"
        />
      </svg>
    ),
    responseTime: "Sous 48h ouvrees",
  },
];

const resources = [
  {
    title: "Questions frequentes",
    description:
      "Consultez notre FAQ pour trouver rapidement des reponses aux questions courantes.",
    href: "/faq",
    linkText: "Voir la FAQ",
  },
  {
    title: "Guides pratiques",
    description:
      "Plus de 25 guides gratuits pour les psychologues liberaux : installation, gestion, TCC, facturation.",
    href: "/guides",
    linkText: "Decouvrir les guides",
  },
  {
    title: "Ressources PDF gratuites",
    description:
      "Telechargez nos kits et templates : demarrage cabinet, notes TCC, guide tarifs et facturation.",
    href: "/ressources",
    linkText: "Voir les ressources",
  },
];

export default function ContactPage() {
  return (
    <main className="min-h-screen bg-[#F8F7FF] font-dm-sans">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(contactJsonLd) }}
      />

      {/* Hero */}
      <section className="bg-gradient-to-br from-[#3D52A0] to-[#7B9CDA] py-20 text-white">
        <div className="mx-auto max-w-5xl px-6 text-center">
          <h1 className="font-playfair text-4xl font-bold md:text-5xl">
            Contactez-nous
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-lg text-white/90">
            Notre equipe est a votre disposition pour repondre a toutes
            vos questions sur PsyLib.
          </p>
        </div>
      </section>

      {/* Breadcrumb */}
      <div className="mx-auto max-w-5xl px-6 pt-6">
        <nav className="text-sm text-gray-500">
          <Link href="/" className="hover:text-gray-800">
            Accueil
          </Link>{" "}
          &rsaquo;{" "}
          <span className="font-medium text-gray-800">Contact</span>
        </nav>
      </div>

      {/* Contact cards */}
      <section className="mx-auto max-w-5xl px-6 py-12">
        <div className="grid gap-6 md:grid-cols-2">
          {contactChannels.map((channel) => (
            <div
              key={channel.title}
              className="rounded-2xl border border-gray-200 bg-white p-8 shadow-sm transition hover:shadow-md"
            >
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 rounded-xl bg-[#F1F0F9] p-3">
                  {channel.icon}
                </div>
                <div className="flex-1">
                  <h2 className="font-playfair text-lg font-bold text-[#1E1B4B]">
                    {channel.title}
                  </h2>
                  <p className="mt-1 text-sm text-gray-500">
                    {channel.description}
                  </p>
                  <a
                    href={`mailto:${channel.email}`}
                    className="mt-3 inline-block text-sm font-semibold text-[#3D52A0] transition hover:text-[#2D3F80]"
                  >
                    {channel.email}
                  </a>
                  <p className="mt-2 text-xs text-gray-400">
                    Delai de reponse : {channel.responseTime}
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Response time banner */}
      <section className="mx-auto max-w-5xl px-6 pb-12">
        <div className="rounded-2xl bg-[#F1F0F9] p-8 text-center">
          <div className="mx-auto flex max-w-md flex-col items-center">
            <svg
              className="h-10 w-10 text-[#3D52A0]"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <h3 className="mt-3 font-playfair text-xl font-bold text-[#1E1B4B]">
              Nous repondons sous 24h ouvrees
            </h3>
            <p className="mt-2 text-sm text-gray-600">
              Du lundi au vendredi, de 9h a 18h (heure de Paris).
              Les utilisateurs du plan Scale beneficient d&apos;un
              support prioritaire avec un delai garanti de 4h ouvrees.
            </p>
          </div>
        </div>
      </section>

      {/* Resources section */}
      <section className="bg-white py-16">
        <div className="mx-auto max-w-5xl px-6">
          <h2 className="font-playfair text-center text-2xl font-bold text-[#1E1B4B]">
            Ressources utiles
          </h2>
          <p className="mx-auto mt-3 max-w-xl text-center text-gray-500">
            Avant de nous contacter, consultez nos ressources :
            vous y trouverez peut-etre la reponse a votre question.
          </p>

          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {resources.map((resource) => (
              <Link
                key={resource.href}
                href={resource.href}
                className="group rounded-2xl border border-gray-200 bg-[#F8F7FF] p-6 transition hover:border-[#3D52A0]/30 hover:shadow-md"
              >
                <h3 className="font-playfair text-lg font-bold text-[#1E1B4B] group-hover:text-[#3D52A0]">
                  {resource.title}
                </h3>
                <p className="mt-2 text-sm text-gray-600">
                  {resource.description}
                </p>
                <span className="mt-4 inline-block text-sm font-medium text-[#3D52A0]">
                  {resource.linkText} &rarr;
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Trust section */}
      <section className="mx-auto max-w-5xl px-6 py-16">
        <div className="grid gap-6 md:grid-cols-3">
          <div className="rounded-2xl bg-[#F1F0F9] p-6 text-center">
            <p className="text-3xl font-bold text-[#3D52A0]">HDS</p>
            <p className="mt-2 text-sm text-gray-600">
              Hebergement certifie en France
            </p>
          </div>
          <div className="rounded-2xl bg-[#F1F0F9] p-6 text-center">
            <p className="text-3xl font-bold text-[#3D52A0]">RGPD</p>
            <p className="mt-2 text-sm text-gray-600">
              Conforme a la reglementation europeenne
            </p>
          </div>
          <div className="rounded-2xl bg-[#F1F0F9] p-6 text-center">
            <p className="text-3xl font-bold text-[#3D52A0]">AES-256</p>
            <p className="mt-2 text-sm text-gray-600">
              Chiffrement de niveau bancaire
            </p>
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="bg-gradient-to-r from-[#3D52A0] to-[#7B9CDA] py-16 text-center text-white">
        <h2 className="font-playfair text-2xl font-bold md:text-3xl">
          Essayez PsyLib gratuitement
        </h2>
        <p className="mx-auto mt-3 max-w-xl text-white/90">
          14 jours d&apos;essai gratuit, sans carte bancaire.
          Dossiers patients, notes cliniques, facturation — tout en un,
          conforme HDS.
        </p>
        <Link
          href="/login"
          className="mt-6 inline-block rounded-lg bg-white px-8 py-3 font-semibold text-[#3D52A0] transition hover:bg-gray-100"
        >
          Commencer l&apos;essai gratuit
        </Link>
      </section>
    </main>
  );
}
