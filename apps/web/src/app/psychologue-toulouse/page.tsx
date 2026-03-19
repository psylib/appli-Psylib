import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Toulouse',
  slug: 'toulouse',
  department: '31',
  population: '490 000',
  psyCount: 'Plus de 400 psychologues',
  intro: `Toulouse, la Ville Rose, est l'un des pôles universitaires et scientifiques les plus dynamiques de France. Avec plusieurs facultés de psychologie et un bassin de population jeune et actif, la ville dispose d'une offre étoffée en psychologues libéraux. Les praticiens toulousains couvrent l'ensemble des grandes spécialités cliniques : accompagnement du burn-out (sujet particulièrement prévalent dans le secteur aéronautique local), TCC, EMDR, soutien psychologique étudiant, prise en charge des troubles alimentaires. Le quartier Capitole, Saint-Cyprien et les communes de la métropole toulousaine (Blagnac, Colomiers, Balma) concentrent une grande partie des cabinets. Les tarifs varient entre 65 et 95 euros par séance. Trouvez votre psychologue à Toulouse sur PsyLib.`,
  faq: [
    {
      q: 'Y a-t-il des psychologues spécialisés dans le burn-out à Toulouse ?',
      a: 'Oui, Toulouse compte plusieurs psychologues spécialisés dans l\'accompagnement du burn-out, notamment en lien avec les secteurs très représentés localement (aéronautique, high-tech, santé). La TCC et les thérapies d\'acceptation et d\'engagement (ACT) sont les approches les plus couramment proposées pour ce type d\'accompagnement. Vous pouvez filtrer par spécialité sur PsyLib.',
    },
    {
      q: 'Peut-on trouver un psychologue pour étudiants à Toulouse ?',
      a: 'Toulouse compte parmi les villes étudiantes les plus importantes de France. Plusieurs psychologues libéraux proposent des tarifs adaptés aux étudiants ou des créneaux spécifiques. L\'université Paul Sabatier et d\'autres établissements disposent également de services psychologiques universitaires gratuits, complémentaires à l\'offre libérale.',
    },
    {
      q: 'Combien coûte une séance de psychologue à Toulouse ?',
      a: 'À Toulouse, les tarifs des psychologues libéraux se situent généralement entre 65 et 95 euros pour une séance de 50 minutes. Les praticiens installés en centre-ville (Capitole, Carmes) pratiquent des tarifs légèrement plus élevés que ceux des communes limitrophes. Certains praticiens proposent des tarifs spécifiques pour les étudiants ou les revenus modestes.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueToulouse() {
  return <CityPage city={city} />;
}
