import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Nantes',
  slug: 'nantes',
  department: '44',
  population: '320 000',
  psyCount: 'Plus de 300 psychologues',
  intro: `Nantes, régulièrement classée parmi les villes où il fait bon vivre en France, dispose d'un réseau solide de psychologues libéraux. Première ville des Pays-de-la-Loire, elle concentre ses praticiens dans les quartiers Bouffay, Hauts-Pavés, Chantenay et autour du CHU. La métropole nantaise, qui inclut Saint-Herblain, Rezé et Orvault, offre également de nombreuses options. Les psychologues nantais sont reconnus pour leur expertise en accompagnement des transitions professionnelles, du soutien parental et de la gestion du stress. L'offre TCC et EMDR est bien développée. Tarifs généralement pratiqués : 65 à 90 euros par séance. PsyLib vous permet de trouver le bon praticien et de réserver en ligne directement.`,
  faq: [
    {
      q: 'Comment trouver un psychologue spécialisé en thérapie familiale à Nantes ?',
      a: 'Nantes dispose de plusieurs praticiens formés aux thérapies familiales et systémiques. Ces approches sont particulièrement adaptées aux problématiques de couple, de parentalité ou de difficultés relationnelles familiales. PsyLib vous permet de filtrer par spécialité "thérapie familiale" ou "thérapie de couple" pour identifier les praticiens disponibles dans la métropole nantaise.',
    },
    {
      q: 'Existe-t-il des psychologues pour enfants et adolescents à Nantes ?',
      a: 'Oui, Nantes compte un bon nombre de psychologues spécialisés dans l\'accompagnement des enfants, adolescents et jeunes adultes. Ces praticiens interviennent sur des problématiques variées : troubles du comportement, difficultés scolaires, anxiété, dépression adolescente, troubles de l\'attachement ou haut potentiel intellectuel (HPI). La prise de rendez-vous est possible en ligne sur PsyLib.',
    },
    {
      q: 'Quel est le délai moyen pour obtenir un rendez-vous chez un psychologue à Nantes ?',
      a: 'À Nantes, les délais d\'attente varient selon la spécialité et le praticien. Pour une consultation classique, un délai de 2 à 4 semaines est courant. Pour les bilans neuropsychologiques ou les spécialités rares, le délai peut atteindre 2 à 3 mois. La prise de rendez-vous en ligne sur PsyLib vous permet de visualiser les créneaux disponibles en temps réel.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueNantes() {
  return <CityPage city={city} />;
}
