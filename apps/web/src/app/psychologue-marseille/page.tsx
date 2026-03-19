import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Marseille',
  slug: 'marseille',
  department: '13',
  population: '870 000',
  psyCount: 'Plus de 500 psychologues',
  intro: `Marseille, troisième ville de France et capitale de la Provence-Alpes-Côte d'Azur, dispose d'un réseau croissant de psychologues libéraux. La ville est répartie en 16 arrondissements avec des bassins de vie bien distincts — du centre-ville au Prado, de Belsunce aux quartiers Nord. Si la densité de praticiens reste inférieure à Paris ou Lyon dans certains quartiers périphériques, l'offre est en forte expansion depuis 2022. Les Marseillais ont accès à des psychologues spécialisés en TCC, psychotraumatologie, thérapies familiales et soutien psychologique interculturel. Les tarifs y sont légèrement inférieurs à la moyenne nationale pour les grandes villes, généralement entre 60 et 95 euros. Avec PsyLib, prenez rendez-vous en ligne avec un praticien disponible rapidement.`,
  faq: [
    {
      q: 'Quel est le délai pour obtenir un rendez-vous chez un psychologue à Marseille ?',
      a: 'À Marseille, les délais varient selon les quartiers et les spécialités. Dans le centre-ville et les secteurs bien couverts, il est possible d\'obtenir un rendez-vous en 1 à 3 semaines. Pour les spécialités plus rares (neuropsychologie, EMDR), comptez parfois 4 à 8 semaines. En optant pour la téléconsultation, vous accédez à un panel beaucoup plus large de praticiens disponibles rapidement.',
    },
    {
      q: 'Existe-t-il des psychologues bilingues ou interculturels à Marseille ?',
      a: 'Oui, compte tenu de la diversité culturelle de Marseille, plusieurs praticiens proposent des consultations en arabe, anglais, italien ou d\'autres langues. PsyLib vous permet de filtrer par langue de consultation. Des praticiens spécialisés dans l\'accompagnement interculturel ou des populations issues de l\'immigration sont également disponibles.',
    },
    {
      q: 'Comment se passe la prise de RDV en ligne avec un psychologue à Marseille ?',
      a: 'Sur PsyLib, vous sélectionnez un psychologue marseillais, consultez ses créneaux disponibles et réservez en quelques clics. Vous recevez une confirmation par email avec les informations pratiques (adresse du cabinet ou lien visio). Le praticien reçoit simultanément votre demande et peut confirmer ou vous proposer un autre créneau.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueMarseille() {
  return <CityPage city={city} />;
}
