import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Lille',
  slug: 'lille',
  department: '59',
  population: '235 000',
  psyCount: 'Plus de 220 psychologues',
  intro: `Lille, capitale des Hauts-de-France et grande métropole transfrontalière, dispose d'une offre en psychologues libéraux bien établie. La ville universitaire — avec l'Université de Lille, forte de son département de psychologie — forme régulièrement de nouveaux praticiens qui s'installent dans la métropole. Le Vieux-Lille, Wazemmes, Vauban et les communes limitrophes (Villeneuve-d'Ascq, Roubaix, Tourcoing) concentrent de nombreux cabinets. Les psychologues lillois sont réputés pour leur expertise en accompagnement des travailleurs sociaux et soignants (profil fréquent dans une métropole hospitalière importante), ainsi qu'en soutien aux aidants. Tarifs pratiqués : 60 à 90 euros. PsyLib vous permet de trouver le praticien qui vous correspond et de réserver en ligne.`,
  faq: [
    {
      q: 'Y a-t-il des psychologues disponibles dans toute la métropole lilloise ?',
      a: 'Oui, les psychologues libéraux sont présents dans l\'ensemble de la métropole européenne de Lille (MEL). Villeneuve-d\'Ascq, Roubaix, Tourcoing, Marcq-en-Barœul, Lambersart et d\'autres communes disposent de praticiens. La téléconsultation permet également d\'accéder à des praticiens lillois depuis n\'importe quelle commune de la métropole.',
    },
    {
      q: 'Existe-t-il des psychologues spécialisés dans l\'accompagnement des soignants à Lille ?',
      a: 'Oui, Lille et sa métropole hospitalière (CHRU de Lille) génèrent une forte demande pour l\'accompagnement psychologique des professionnels de santé. Plusieurs praticiens sont spécialisés dans le soutien des soignants, le burn-out médical et la gestion du stress professionnel. PsyLib vous permet de cibler ces spécialistes.',
    },
    {
      q: 'Les psychologues à Lille proposent-ils des consultations le week-end ?',
      a: 'Certains psychologues lillois proposent des créneaux le samedi matin pour s\'adapter aux contraintes professionnelles de leurs patients. Pour les consultations en dehors des heures ouvrées classiques, la recherche par disponibilité sur PsyLib vous permettra d\'identifier les praticiens offrant ces créneaux.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueLille() {
  return <CityPage city={city} />;
}
