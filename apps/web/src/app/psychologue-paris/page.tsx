import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Paris',
  slug: 'paris',
  department: '75',
  population: '2,1 millions',
  psyCount: 'Plus de 3 000 psychologues',
  intro: `Paris concentre la plus forte densité de psychologues libéraux en France, avec plus de 3 000 praticiens répartis dans les 20 arrondissements. Cette abondance offre aux Parisiens un accès privilégié à toutes les spécialités : TCC, EMDR, psychanalyse, neuropsychologie, thérapies systémiques. Cependant, trouver le bon praticien, disponible rapidement, avec des horaires adaptés et un tarif raisonnable, reste un défi. Les délais d'attente peuvent dépasser 4 à 6 semaines chez les praticiens les plus demandés. PsyLib vous permet de filtrer les profils par arrondissement, spécialité et disponibilité, et de réserver directement en ligne — sans passer par la case email ou téléphone.`,
  faq: [
    {
      q: 'Quel est le tarif moyen d\'une séance de psychologue à Paris ?',
      a: 'À Paris, les tarifs des psychologues libéraux sont plus élevés qu\'en province. Une séance individuelle de 50 minutes coûte en moyenne 90 à 130 euros dans la capitale, avec des tarifs pouvant dépasser 150 euros chez les praticiens très expérimentés ou très spécialisés. Les séances en visio peuvent être légèrement moins chères. Le dispositif Mon Soutien Psy permet d\'accéder à 8 séances à 50 euros (sur prescription médicale).',
    },
    {
      q: 'Comment trouver un psychologue disponible rapidement à Paris ?',
      a: 'Sur PsyLib, vous pouvez filtrer les psychologues parisiens par disponibilité pour trouver un praticien libre dans les 7 à 14 jours. Vous pouvez également opter pour une séance en visio, ce qui élargit considérablement le choix. Certains praticiens proposent des créneaux de consultation le soir ou le week-end.',
    },
    {
      q: 'Les psychologues à Paris proposent-ils des séances en visio ?',
      a: 'Oui, la très grande majorité des psychologues libéraux parisiens propose aujourd\'hui la téléconsultation. La visio est particulièrement appréciée par les Parisiens actifs qui souhaitent éviter les transports. Les séances en ligne bénéficient du même niveau de confidentialité et de la même qualité thérapeutique que les séances en présentiel.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueParis() {
  return <CityPage city={city} />;
}
