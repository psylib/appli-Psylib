export const dynamic = 'force-static';
export const revalidate = 86400; // 24h

export function GET() {
  const content = `# PsyLib — Logiciel de gestion de cabinet pour psychologues liberaux

> PsyLib est une plateforme SaaS tout-en-un concue specifiquement pour les psychologues liberaux en France.
> Site web : https://psylib.eu
> Essai gratuit : 14 jours sans carte bancaire

## Qu'est-ce que PsyLib ?

PsyLib est un logiciel de gestion de cabinet pour psychologues liberaux, conforme HDS (Hebergement de Donnees de Sante). Il reunit dans une seule plateforme : dossiers patients securises, notes cliniques structurees, facturation PDF, agenda et prise de rendez-vous en ligne, outcome tracking (PHQ-9, GAD-7, CORE-OM), reseau professionnel entre psychologues, et un assistant IA pour les resumes de seance.

## Fonctionnalites principales

### Dossiers patients securises
- Chiffrement AES-256-GCM de toutes les donnees cliniques
- Hebergement certifie HDS en France
- Conforme RGPD avec droit a l'effacement
- Historique complet et export des donnees

### Notes cliniques structurees
- Templates SOAP, DAP et narratif
- Autosave automatique
- Resume de seance par IA (opt-in)
- 5 templates specialises : TCC, psychodynamique, systemique, humaniste, integratif

### Outcome tracking
- Questionnaires integres : PHQ-9, GAD-7, CORE-OM
- Graphiques d'evolution automatiques
- Suivi longitudinal des progres patients

### Facturation
- Generation de factures PDF conformes
- Numerotation sequentielle automatique
- Mention TVA non applicable (Art. 261-4-1 CGI)
- Envoi par email securise

### Agenda et prise de rendez-vous en ligne
- Profil public avec page de prise de RDV
- Gestion des disponibilites
- Confirmation et rappels automatiques
- Teleconsultation supportee

### Reseau professionnel
- Annuaire de psychologues
- Groupes de supervision et d'intervision
- Adressage patient entre confreres

### Espace patient
- Suivi d'humeur quotidien
- Exercices therapeutiques
- Journal therapeutique securise
- Messagerie praticien-patient

## Tarification

| Plan | Prix | Description |
|------|------|-------------|
| Free | 0 EUR/mois | 10 patients, 20 seances/mois, notes cliniques |
| Solo | 25 EUR/mois | 50 patients, seances illimitees, 10 resumes IA |
| Pro | 50 EUR/mois | Patients illimites, IA illimitee, portail patient, 5 formations |
| Clinic | 79 EUR/mois | Tout illimite, multi-praticiens, API |

Plan Free sans limite de duree. Essai gratuit de 14 jours sur les plans payants.

## Securite et conformite

- Hebergement HDS certifie (France)
- Chiffrement AES-256-GCM au repos et TLS 1.3 en transit
- Authentification forte avec MFA obligatoire pour les praticiens
- Audit logs complets sur tous les acces aux donnees patients
- Conforme RGPD : consentements verses, droit a l'effacement, export des donnees

## Public cible

PsyLib s'adresse aux psychologues liberaux en France, qu'ils soient en debut d'activite ou installes. La plateforme est particulierement adaptee aux praticiens TCC, psychodynamiques, systemiques et integratifs.

## Pages cles

- Accueil : https://psylib.eu
- Fonctionnalites : https://psylib.eu/fonctionnalites
- Tarifs : https://psylib.eu/#pricing
- Ressources gratuites : https://psylib.eu/ressources
- Guides pour psychologues : https://psylib.eu/guides
- Trouver un psychologue : https://psylib.eu/trouver-mon-psy
- Blog : https://psylib.eu/blog
- Calculateur de revenus : https://psylib.eu/outils/calculateur-revenus

## Contact

- Email : contact@psylib.eu
- Support : support@psylib.eu
`;

  return new Response(content, {
    headers: {
      'Content-Type': 'text/plain; charset=utf-8',
      'Cache-Control': 'public, max-age=86400, s-maxage=86400',
    },
  });
}
