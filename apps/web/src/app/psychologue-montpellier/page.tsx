import type { Metadata } from 'next';
import { CityPage, generateCityMetadata } from '@/components/seo/city-page';
import type { CityConfig } from '@/components/seo/city-page';

const city: CityConfig = {
  name: 'Montpellier',
  slug: 'montpellier',
  department: '34',
  population: '290 000',
  psyCount: 'Plus de 280 psychologues',
  intro: `Montpellier, ville universitaire dynamique et septième ville de France, dispose d'une offre en psychologues libéraux en forte croissance. La présence de l'Université Paul Valéry, forte de ses formations en psychologie clinique, sociale et neuropsychologie, contribue à l'attractivité de la ville pour les jeunes praticiens. Le quartier Écusson, Beaux-Arts, Antigone et Port-Marianne concentrent de nombreux cabinets. La population étudiante importante génère une forte demande pour l'accompagnement psychologique, le soutien à l'anxiété de performance et la gestion du stress académique. Montpellier offre également un accès à des praticiens spécialisés en thérapies brèves et en hypnothérapie clinique. Tarifs : 60 à 90 euros par séance.`,
  faq: [
    {
      q: 'Y a-t-il des psychologues disponibles pour les étudiants à Montpellier ?',
      a: 'Oui, Montpellier est une ville universitaire avec de nombreux psychologues proposant des créneaux adaptés aux étudiants. Certains pratiquent des tarifs spécifiques. Le SUMPPS (Service Universitaire de Médecine Préventive et de Promotion de la Santé) propose également un suivi psychologique gratuit pour les étudiants de certaines universités. PsyLib recense les praticiens libéraux disponibles pour ce public.',
    },
    {
      q: 'Peut-on trouver un psychologue spécialisé en hypnothérapie à Montpellier ?',
      a: 'Oui, Montpellier compte plusieurs praticiens proposant l\'hypnose clinique ou l\'hypnothérapie dans le cadre d\'un accompagnement psychologique global. Attention : l\'hypnothérapie exercée par un psychologue (titulaire du titre réglementé) diffère des praticiens non-diplômés. PsyLib vous permet de vérifier les qualifications de chaque praticien.',
    },
    {
      q: 'Comment se rendre au cabinet d\'un psychologue à Montpellier sans voiture ?',
      a: 'Montpellier dispose d\'un réseau de tramway très développé qui dessert la grande majorité des quartiers. La plupart des cabinets de psychologues sont accessibles en tram ou en vélo (réseau Vélomagg). Si vous préférez ne pas vous déplacer, la téléconsultation est disponible avec la majorité des praticiens référencés sur PsyLib.',
    },
  ],
};

export const metadata: Metadata = generateCityMetadata(city);

export default function PagePsychologueMontpellier() {
  return <CityPage city={city} />;
}
