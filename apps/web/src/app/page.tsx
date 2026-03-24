import type { Metadata } from 'next';
import { LandingNav } from '@/components/landing/landing-nav';
import { HeroSection } from '@/components/landing/hero-section';
import { PainPointsSection } from '@/components/landing/pain-points-section';
import { FeaturesSection } from '@/components/landing/features-section';
import { OutcomeSection } from '@/components/landing/outcome-section';
import { NetworkSection } from '@/components/landing/network-section';
import { ComparisonSection } from '@/components/landing/comparison-section';
import { TrustSection } from '@/components/landing/trust-section';
import { PricingSection } from '@/components/landing/pricing-section';
import { TestimonialsSection } from '@/components/landing/testimonials-section';
import { FAQSection } from '@/components/landing/faq-section';
import { BeforeAfterSection } from '@/components/landing/before-after-section';
import { LeadNurtureCTA } from '@/components/landing/lead-nurture-cta';
import { CTASection } from '@/components/landing/cta-section';
import { LandingFooter } from '@/components/landing/landing-footer';
import { StickyCTA } from '@/components/landing/sticky-cta';

const jsonLd = {
  '@context': 'https://schema.org',
  '@graph': [
    {
      '@type': 'SoftwareApplication',
      name: 'PsyLib',
      applicationCategory: 'BusinessApplication',
      applicationSubCategory: 'Logiciel de gestion de cabinet psychologue',
      operatingSystem: 'Web',
      description:
        'Logiciel de gestion de cabinet tout-en-un pour psychologues liberaux. Dossiers patients securises, notes cliniques structurees, outcome tracking (PHQ-9/GAD-7), reseau professionnel, facturation. Conforme HDS France.',
      url: 'https://psylib.eu',
      featureList:
        'Dossiers patients securises HDS, Notes cliniques structurees (SOAP/DAP), Resume de seance par IA, Outcome tracking PHQ-9 GAD-7 CORE-OM, Facturation PDF conforme, Prise de rendez-vous en ligne, Reseau professionnel entre psychologues, Espace patient securise, Supervision et intervision, Chiffrement AES-256-GCM',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '49',
        highPrice: '149',
        priceCurrency: 'EUR',
        offerCount: '3',
      },
    },
    {
      '@type': 'HowTo',
      name: 'Comment demarrer avec PsyLib en 3 etapes',
      description:
        'Guide rapide pour commencer a utiliser PsyLib, le logiciel de gestion de cabinet pour psychologues liberaux.',
      step: [
        {
          '@type': 'HowToStep',
          position: 1,
          name: 'Creez votre compte',
          text: 'Inscrivez-vous gratuitement en 30 secondes. 14 jours d\'essai sans carte bancaire.',
        },
        {
          '@type': 'HowToStep',
          position: 2,
          name: 'Configurez votre cabinet',
          text: 'Renseignez votre profil, numero ADELI, specialites et disponibilites.',
        },
        {
          '@type': 'HowToStep',
          position: 3,
          name: 'Gerez vos patients',
          text: 'Ajoutez vos patients, redigez vos notes et generez vos factures.',
        },
      ],
    },
    {
      '@type': 'FAQPage',
      mainEntity: [
        {
          '@type': 'Question',
          name: 'PsyLib est-il conforme HDS ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui. PsyLib est heberge sur infrastructure certifiee HDS (Hebergement de Donnees de Sante) en France. Toutes les donnees cliniques sont chiffrees AES-256-GCM. Conforme aux exigences legales pour les professionnels de sante.",
          },
        },
        {
          '@type': 'Question',
          name: 'PsyLib remplace-t-il Doctolib ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "PsyLib et Doctolib ne sont pas en concurrence directe. Doctolib gere votre agenda et votre visibilite en ligne. PsyLib est l'outil de gestion complete de votre cabinet : dossiers patients, notes cliniques, outcome tracking, reseau professionnel et facturation.",
          },
        },
        {
          '@type': 'Question',
          name: "Combien coute PsyLib ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "PsyLib propose trois formules : Starter a 29,99 EUR/mois, Pro a 69,99 EUR/mois et Scale a 119,99 EUR/mois. Un essai gratuit de 14 jours est disponible sans carte bancaire.",
          },
        },
        {
          '@type': 'Question',
          name: "Quel est le meilleur logiciel de gestion pour psychologue liberal ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "PsyLib est le logiciel de gestion de cabinet concu specifiquement pour les psychologues liberaux en France. Contrairement aux solutions generiques, PsyLib propose des templates de notes TCC/psychodynamiques, l'outcome tracking (PHQ-9, GAD-7), un reseau professionnel entre psys, et un hebergement certifie HDS obligatoire pour les donnees de sante.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment fonctionne l'essai gratuit ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "14 jours d'acces complet au plan Pro, sans carte bancaire. A la fin de l'essai, vous choisissez votre plan ou votre compte est desactive. Vos donnees restent exportables.",
          },
        },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: 'PsyLib — Gestion cabinet psychologue libéral | HDS',
  description:
    'PsyLib : logiciel de gestion de cabinet pour psychologues liberaux en France. Dossiers patients securises (HDS), notes cliniques structurees, outcome tracking PHQ-9/GAD-7, facturation PDF, prise de RDV en ligne. Essai gratuit 14 jours.',
  keywords: [
    'psychologue libéral',
    'logiciel cabinet psychologue',
    'outcome tracking psychologue',
    'HDS psychologue',
    'gestion cabinet psy',
    'PHQ-9 GAD-7',
    'réseau psychologues France',
    'notes cliniques TCC ACT',
  ],
  openGraph: {
    title: 'PsyLib — L\'atelier numérique du psychologue libéral',
    description:
      'Outcome tracking, réseau pro, notes structurées. Tout ce que Doctolib n\'offre pas. 100% conforme HDS France.',
    url: 'https://psylib.eu',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PsyLib — Gestion cabinet psychologue libéral',
    description: 'Outcome tracking, réseau pro, notes cliniques. La plateforme spécifique pour psys libéraux.',
  },
  alternates: {
    canonical: 'https://psylib.eu',
  },
  robots: { index: true, follow: true },
};

export default function HomePage() {
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      <LandingNav />
      <main>
        <HeroSection />
        <PainPointsSection />
        <FeaturesSection />
        <OutcomeSection />
        <NetworkSection />
        <ComparisonSection />
        <BeforeAfterSection />
        <TrustSection />
        <PricingSection />
        <LeadNurtureCTA />
        <TestimonialsSection />
        <FAQSection />
        <CTASection />
      </main>
      <LandingFooter />
      <StickyCTA />
    </>
  );
}
