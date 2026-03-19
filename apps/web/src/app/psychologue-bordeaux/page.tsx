import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Bordeaux',
  slug: 'bordeaux',
  department: '33',
  population: '260 000',
  psyCount: 'Plus de 350 psychologues',
  intro: `Bordeaux, ville en pleine expansion démographique grâce à l'attractivité de la métropole girondine, a vu son offre de psychologues libéraux croître significativement ces dernières années. Le quartier Saint-Michel, les Chartrons, le Cours de l'Intendance et la rive droite accueillent de nombreux cabinets. La proximité avec l'université de Bordeaux, forte de son département de psychologie clinique, assure un renouvellement régulier des praticiens. Les Bordelais ont accès à des approches variées : psychanalyse, TCC, thérapies humanistes, EMDR et accompagnement des addictions. La métropole couvre également Mérignac, Pessac et Talence. Tarifs habituels : 65 à 100 euros par séance. Trouvez votre psychologue sur PsyLib.`,
  faq: [
    {
      q: 'Quelles approches thérapeutiques sont disponibles chez les psychologues à Bordeaux ?',
      a: 'À Bordeaux, les psychologues libéraux proposent une grande diversité d\'approches : thérapies cognitivo-comportementales (TCC), psychanalyse et psychodynamique, EMDR pour les traumatismes, thérapies humanistes et existentielles, thérapies systémiques et familiales, et accompagnement des addictions. Vous pouvez filtrer par approche sur PsyLib pour trouver le praticien adapté à votre situation.',
    },
    {
      q: 'Y a-t-il des psychologues disponibles le soir ou le week-end à Bordeaux ?',
      a: 'Oui, plusieurs psychologues bordelais proposent des créneaux en soirée (après 18h) ou le samedi matin pour s\'adapter aux contraintes professionnelles de leurs patients. PsyLib affiche les disponibilités en temps réel, ce qui vous permet de filtrer selon vos horaires disponibles.',
    },
    {
      q: 'Peut-on consulter un psychologue bordelais en visio depuis chez soi ?',
      a: 'Absolument. La majorité des psychologues libéraux à Bordeaux propose désormais la téléconsultation, que ce soit pour des patients habitant dans les communes éloignées de la métropole ou pour ceux qui préfèrent consulter depuis leur domicile. Les séances en visio se déroulent sur des plateformes sécurisées conformes aux recommandations de la CNIL.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueBordeaux() {
  return <CityPage city={city} />;
}
