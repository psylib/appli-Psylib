import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Rennes',
  slug: 'rennes',
  department: '35',
  population: '220 000',
  psyCount: 'Plus de 180 psychologues',
  intro: `Rennes, capitale de la Bretagne et ville universitaire dynamique, dispose d'un réseau de psychologues libéraux en pleine expansion. L'Université Rennes 2, réputée pour ses formations en sciences humaines et sociales, contribue à l'écosystème local de la psychologie clinique. Les quartiers Thabor, Colombier, Centre-ville et Villejean sont bien pourvus en praticiens. La métropole rennaise couvre également Cesson-Sévigné, Bruz et Saint-Malo. Rennes se distingue par une culture du bien-être et du développement personnel particulièrement ancrée, avec une offre diversifiée en thérapies brèves, pleine conscience et accompagnement des transitions de vie. Les tarifs sont généralement plus accessibles qu'à Paris ou Lyon : 60 à 85 euros par séance. Prenez rendez-vous en ligne sur PsyLib.`,
  faq: [
    {
      q: 'Comment trouver un psychologue pour accompagner une reconversion professionnelle à Rennes ?',
      a: 'Rennes est une ville économiquement dynamique avec un taux d\'emploi élevé dans le numérique et les services. Plusieurs psychologues y sont spécialisés dans l\'accompagnement des transitions professionnelles et reconversions. Ces praticiens utilisent des outils comme le bilan psychologique, le coaching orienté vers les ressources et les thérapies narratives. PsyLib vous permet de les identifier rapidement.',
    },
    {
      q: 'Y a-t-il des psychologues accessibles sans rendez-vous ou en urgence à Rennes ?',
      a: 'En cas d\'urgence psychiatrique, le CHU de Rennes dispose d\'une unité d\'urgences psychiatriques joignable 24h/24. Pour un accompagnement psychologique non urgent, les délais en libéral sont généralement de 1 à 3 semaines à Rennes. PsyLib affiche les premiers créneaux disponibles pour chaque praticien, vous permettant de trouver rapidement une consultation.',
    },
    {
      q: 'Les psychologues rennais proposent-ils des approches centrées sur la pleine conscience ?',
      a: 'Oui, plusieurs praticiens rennais sont formés aux approches MBSR (Mindfulness-Based Stress Reduction) et MBCT (Mindfulness-Based Cognitive Therapy), ainsi qu\'aux thérapies ACT (Acceptance and Commitment Therapy). Ces approches, fondées sur des données probantes, sont particulièrement efficaces pour la gestion du stress, de l\'anxiété et de la dépression récurrente.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueRennes() {
  return <CityPage city={city} />;
}
