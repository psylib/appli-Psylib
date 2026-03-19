import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Strasbourg',
  slug: 'strasbourg',
  department: '67',
  population: '285 000',
  psyCount: 'Plus de 250 psychologues',
  intro: `Strasbourg, capitale de l'Alsace et siège du Parlement européen, dispose d'une offre en psychologues libéraux à la fois dense et diversifiée. La ville bénéficie d'une double influence franco-allemande dans les pratiques thérapeutiques, avec une forte tradition en psychanalyse et psychothérapie d'inspiration germanique. L'Université de Strasbourg forme régulièrement de nouveaux psychologues cliniciens. La Neustadt, le quartier de l'Orangerie et la Krutenau concentrent de nombreux cabinets. L'offre couvre toutes les spécialités classiques et inclut des praticiens bilingues (français-allemand ou français-anglais) — atout précieux pour les nombreux expatriés et fonctionnaires européens résidant à Strasbourg. Tarifs : 65 à 100 euros par séance.`,
  faq: [
    {
      q: 'Y a-t-il des psychologues bilingues français-allemand à Strasbourg ?',
      a: 'Oui, Strasbourg dispose d\'un nombre significatif de psychologues bilingues français-allemand, ainsi que de praticiens maîtrisant l\'anglais pour les expatriés et travailleurs des institutions européennes. PsyLib vous permet de filtrer par langue de consultation pour trouver un praticien adapté à votre situation.',
    },
    {
      q: 'Quelles spécialités sont disponibles chez les psychologues à Strasbourg ?',
      a: 'Les psychologues libéraux à Strasbourg couvrent l\'ensemble des grandes spécialités : TCC, psychanalyse, EMDR, thérapies familiales et de couple, neuropsychologie (bilans cognitifs, TDAH, dyslexie), accompagnement des troubles anxieux et dépressifs. La ville dispose également de praticiens formés aux thérapies d\'orientation humaniste et à la psychologie positive.',
    },
    {
      q: 'Comment fonctionnent les remboursements mutuelles pour les consultations à Strasbourg ?',
      a: 'En Alsace-Moselle, le régime local d\'assurance maladie complémentaire peut offrir des remboursements légèrement différents du régime général. Certaines mutuelles remboursent tout ou partie des consultations psychologiques. Renseignez-vous auprès de votre mutuelle sur votre couverture spécifique pour les consultations en psychologie libérale.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueStrasbourg() {
  return <CityPage city={city} />;
}
