import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Lyon',
  slug: 'lyon',
  department: '69',
  population: '520 000',
  psyCount: 'Plus de 600 psychologues',
  intro: `Lyon, deuxième ville de France par la dynamique économique, dispose d'un tissu dense de psychologues libéraux répartis entre la Presqu'île, la Part-Dieu, les pentes de la Croix-Rousse et les communes de la métropole (Villeurbanne, Caluire, Bron). La ville accueille plusieurs universités formant des psychologues chaque année, garantissant un renouvellement constant de l'offre. Les Lyonnais bénéficient d'un accès à toutes les grandes approches thérapeutiques : TCC, EMDR, psychanalyse, thérapies systémiques, sophrologie clinique et neuropsychologie. Les tarifs lyonnais restent plus accessibles qu'à Paris, généralement entre 65 et 100 euros la séance. PsyLib vous aide à trouver le praticien qui correspond à vos besoins, avec prise de rendez-vous en ligne.`,
  faq: [
    {
      q: 'Quel est le tarif moyen d\'une séance de psychologue à Lyon ?',
      a: 'À Lyon, les tarifs des psychologues libéraux se situent généralement entre 65 et 100 euros pour une séance de 50 minutes. Les praticiens des quartiers centraux (Presqu\'île, 6e arrondissement) pratiquent des tarifs légèrement plus élevés que ceux installés en périphérie de la métropole. Les bilans neuropsychologiques sont facturés à part, généralement entre 350 et 600 euros.',
    },
    {
      q: 'Comment trouver un psychologue spécialisé en TCC à Lyon ?',
      a: 'PsyLib propose un filtre par approche thérapeutique qui vous permet de rechercher spécifiquement des praticiens formés aux Thérapies Cognitivo-Comportementales à Lyon. La ville dispose de nombreux praticiens TCC, notamment formés à l\'Institut de TCC de Lyon. Vous pouvez prendre rendez-vous directement en ligne.',
    },
    {
      q: 'Y a-t-il des psychologues en libéral dans toute la métropole lyonnaise ?',
      a: 'Oui, les psychologues libéraux sont présents dans l\'ensemble de la métropole lyonnaise. Villeurbanne, Caluire-et-Cuire, Bron, Vénissieux et Saint-Priest disposent toutes de praticiens en libéral. Si vous habitez en périphérie, la visio est également une option très répandue qui vous évite les déplacements en centre-ville.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueLyon() {
  return <CityPage city={city} />;
}
