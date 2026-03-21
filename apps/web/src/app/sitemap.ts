import type { MetadataRoute } from 'next';

const BASE = 'https://psylib.eu';
const API = 'https://api.psylib.eu/api/v1';

const GUIDE_DATE = new Date('2026-03-16');
const CITY_DATE = new Date('2026-03-18');
const NEW_GUIDE_DATE = new Date('2026-03-18');

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // Fetch des slugs psychologues onboardés
  let psyEntries: MetadataRoute.Sitemap = [];
  try {
    const res = await fetch(`${API}/public/psy/psychologists?limit=500`, {
      next: { revalidate: 3600 },
    });
    if (res.ok) {
      const data = (await res.json()) as Array<{ slug: string; createdAt: string }>;
      psyEntries = data.map((p) => ({
        url: `${BASE}/psy/${p.slug}`,
        lastModified: new Date(p.createdAt),
        changeFrequency: 'weekly' as const,
        priority: 0.7,
      }));
    }
  } catch {
    // Silencieux en cas d'indisponibilité API
  }

  return [
    // Pages principales
    {
      url: BASE,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 1,
    },
    {
      url: `${BASE}/trouver-mon-psy`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    // Blog
    {
      url: `${BASE}/blog`,
      lastModified: now,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/blog/logiciel-gestion-cabinet-psychologue`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/notes-seance-psychologue-logiciel`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/facturation-psychologue-liberal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/outcome-tracking-psychotherapie`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/agenda-psychologue-en-ligne`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/blog/application-psychologue-liberal`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Fonctionnalités
    {
      url: `${BASE}/fonctionnalites`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/fonctionnalites/outcome-tracking`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/fonctionnalites/notes-cliniques`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/fonctionnalites/reseau-professionnel`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    {
      url: `${BASE}/fonctionnalites/espace-patient`,
      lastModified: new Date('2026-03-15'),
      changeFrequency: 'monthly',
      priority: 0.9,
    },
    // Outils
    {
      url: `${BASE}/outils`,
      lastModified: new Date('2026-03-16'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/outils/calculateur-revenus`,
      lastModified: new Date('2026-03-16'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    // Guides SEO (existants)
    {
      url: `${BASE}/guides`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'weekly',
      priority: 0.7,
    },
    {
      url: `${BASE}/guides/tarif-psychologue-liberal`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/remboursement-psychologue-mutuelle`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/agenda-psychologue-logiciel`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/dossier-patient-psychologue`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/teleconsultation-psychologue`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/supervision-psychologue-liberale`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/tcc-therapie-cognitive-comportementale`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/notes-seance-structurees`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/espace-patient-numerique`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/burnout-psychologue-liberale`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/guides/facturation-psychologue-tva`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/logiciel-hds-donnees-sante`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/ouvrir-cabinet-psychologue`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/psychologue-en-ligne-visio`,
      lastModified: GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Nouveaux guides SEO (Sprint 1 — P1)
    {
      url: `${BASE}/guides/therapie-emdr-psychologue`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE}/guides/trouble-borderline-accompagnement`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE}/guides/psychologue-enfant-adolescent`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    {
      url: `${BASE}/guides/psychologue-autoentrepreneur`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Sprint 2 — P2
    {
      url: `${BASE}/guides/alliance-therapeutique`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/reconversion-psychologue-liberal`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/questionnaire-bilan-patient`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/secret-professionnel-psychologue`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    {
      url: `${BASE}/guides/communication-cabinet-psychologue`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/guides/conventionnement-psychologue`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    // Sprint 3 — P3
    {
      url: `${BASE}/guides/contrat-psychologue-liberal`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/guides/therapie-narrative`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/guides/consentement-eclaire-psychologie`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.75,
    },
    {
      url: `${BASE}/guides/annulation-rdv-psychologue`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    {
      url: `${BASE}/guides/statistiques-cabinet-psychologue`,
      lastModified: NEW_GUIDE_DATE,
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Pages SEO locales — villes
    {
      url: `${BASE}/psychologue-paris`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.9,
    },
    {
      url: `${BASE}/psychologue-lyon`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE}/psychologue-marseille`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE}/psychologue-toulouse`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.85,
    },
    {
      url: `${BASE}/psychologue-bordeaux`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/psychologue-nantes`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/psychologue-montpellier`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/psychologue-strasbourg`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/psychologue-lille`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.8,
    },
    {
      url: `${BASE}/psychologue-rennes`,
      lastModified: CITY_DATE,
      changeFrequency: 'weekly',
      priority: 0.75,
    },
    // Ressources
    {
      url: `${BASE}/ressources`,
      lastModified: new Date('2026-03-19'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Ambassadeurs
    {
      url: `${BASE}/ambassadeurs`,
      lastModified: new Date('2026-03-18'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Tarifs
    {
      url: `${BASE}/tarifs`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'monthly',
      priority: 0.95,
    },
    // FAQ
    {
      url: `${BASE}/faq`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'monthly',
      priority: 0.8,
    },
    // Contact
    {
      url: `${BASE}/contact`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'monthly',
      priority: 0.7,
    },
    // Comparaison
    {
      url: `${BASE}/comparaison`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'monthly',
      priority: 0.85,
    },
    // Legal
    {
      url: `${BASE}/privacy`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE}/terms`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'yearly',
      priority: 0.4,
    },
    {
      url: `${BASE}/legal`,
      lastModified: new Date('2026-03-20'),
      changeFrequency: 'yearly',
      priority: 0.3,
    },
    // Profils psychologues dynamiques
    ...psyEntries,
  ];
}
