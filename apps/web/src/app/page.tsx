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
import { VisioSection } from '@/components/landing/visio-section';
import { PatientPortalSection } from '@/components/landing/patient-portal-section';
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
        'Dossiers patients securises HDS, Notes cliniques structurees (SOAP/DAP), Resume de seance par IA en streaming, Outcome tracking PHQ-9 GAD-7 CORE-OM, Facturation PDF automatique, Comptabilite integree (recettes depenses export FEC preparation 2035), Prise de rendez-vous en ligne, Paiement Stripe a la reservation, Rappels SMS et email automatiques, Liste d attente automatisee, Suivi Mon Soutien Psy 12 seances, Teleconsultation video HD integree HDS, Espace patient avec mood tracking et journal therapeutique, Exercices therapeutiques personnalises par IA, Notifications temps reel WebSocket, Reseau professionnel entre psychologues, Supervision et intervision, Chiffrement AES-256-GCM',
      offers: {
        '@type': 'AggregateOffer',
        lowPrice: '0',
        highPrice: '79',
        priceCurrency: 'EUR',
        offerCount: '4',
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
            text: "PsyLib propose quatre formules : Free (gratuit, patients et sessions illimites), Solo a 25 EUR/mois (IA + visio), Pro a 40 EUR/mois (IA illimitee + portail patient) et Clinic a 79 EUR/mois (multi-praticiens).",
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
          name: "Comment fonctionne le plan gratuit ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Le plan Free est gratuit pour toujours, sans carte bancaire. Il inclut patients et sessions illimites. Passez a un plan payant pour acceder a l'IA et la visio. Vos donnees restent exportables.",
          },
        },
        {
          '@type': 'Question',
          name: 'PsyLib propose-t-il la teleconsultation ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui. PsyLib integre la visio-consultation HD, hebergee sur infrastructure HDS certifiee en France. Pas besoin de Zoom ou Google Meet. Lien unique envoye au patient, prise de notes pendant la consultation. Disponible sur les plans Pro et Clinic.",
          },
        },
        {
          '@type': 'Question',
          name: "Comment fonctionne l'espace patient ?",
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Chaque patient invite recoit un espace personnel securise : suivi d'humeur quotidien, journal therapeutique prive ou partage, et exercices assignes. Le praticien visualise l'evolution entre les seances dans son dashboard.",
          },
        },
        {
          '@type': 'Question',
          name: 'Les factures sont-elles generees automatiquement ?',
          acceptedAnswer: {
            '@type': 'Answer',
            text: "Oui. Apres chaque seance ou paiement Stripe, PsyLib genere automatiquement une facture PDF avec numerotation sequentielle et TVA 0% (exoneration psychologue). Configurable dans Parametres > Cabinet.",
          },
        },
      ],
    },
  ],
};

export const metadata: Metadata = {
  title: 'PsyLib — Gestion cabinet psychologue libéral | HDS',
  description:
    'PsyLib : logiciel de gestion de cabinet pour psychologues liberaux en France. Dossiers patients securises (HDS), notes cliniques structurees, outcome tracking PHQ-9/GAD-7, teleconsultation video HDS, espace patient, facturation automatique PDF, comptabilite integree. Commencez gratuitement.',
  keywords: [
    'psychologue libéral',
    'logiciel cabinet psychologue',
    'outcome tracking psychologue',
    'HDS psychologue',
    'gestion cabinet psy',
    'PHQ-9 GAD-7',
    'réseau psychologues France',
    'notes cliniques TCC ACT',
    'téléconsultation psychologue HDS',
    'visio psy conforme',
    'espace patient psychologue',
    'facturation automatique psychologue',
  ],
  openGraph: {
    title: 'PsyLib — L\'atelier numérique du psy libéral',
    description:
      'Outcome tracking, visio HDS, espace patient, réseau pro, notes structurées, facturation auto, comptabilité intégrée. Tout ce que Doctolib n\'offre pas. 100% conforme HDS France.',
    url: 'https://psylib.eu',
    siteName: 'PsyLib',
    locale: 'fr_FR',
    type: 'website',
  },
  twitter: {
    card: 'summary_large_image',
    title: 'PsyLib — Gestion cabinet psychologue libéral',
    description: 'Outcome tracking, visio HDS, espace patient, réseau pro, facturation auto. La plateforme spécifique pour psys libéraux.',
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
        <VisioSection />
        <PatientPortalSection />
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
