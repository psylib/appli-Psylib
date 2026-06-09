# Registre des sous-traitants techniques — PsyLib

**Responsable de traitement :** PsyLib (psylib.eu)
**Date :** 2026-05-15
**Version :** 1.1
**Objet :** Conformement a l'article 28 du RGPD, ce document recense l'ensemble des sous-traitants techniques auxquels PsyLib fait appel dans le cadre de son activite de plateforme SaaS destinee aux psychologues liberaux.

---

## 1. Liste des sous-traitants techniques

### 1.1 OVH (OVHcloud)

| Champ | Detail |
|---|---|
| **Raison sociale** | OVHcloud SAS |
| **Role** | Hebergement principal — compute, base de donnees PostgreSQL, stockage fichiers (Object Storage), authentification Keycloak, visioconference LiveKit |
| **Donnees transmises** | Toutes les donnees de la plateforme : donnees patients (chiffrees AES-256-GCM), donnees psychologues, fichiers partages, sessions, rendez-vous, audit logs |
| **Sensibilite des donnees** | Elevee — donnees de sante au sens de l'article L.1111-8 du Code de la sante publique |
| **Localisation** | France (datacenters OVHcloud) |
| **Certification HDS** | OVHcloud est certifie hebergeur de donnees de sante (HDS), certification delivree par un organisme accredite COFRAC |
| **DPA / Contrat** | Inclus dans le contrat d'hebergement HDS OVH |

---

### 1.2 Vercel

| Champ | Detail |
|---|---|
| **Raison sociale** | Vercel Inc. |
| **Role** | Hebergement frontend (CDN, rendu SSR des pages de l'application web) |
| **Donnees transmises** | Aucune donnee patient — code statique et assets uniquement, aucun stockage de donnees personnelles ou de sante |
| **Sensibilite des donnees** | Aucune — pas de donnees de sante ni de donnees personnelles stockees |
| **Localisation** | Global (reseau CDN edge) |
| **Certification HDS** | Non applicable (aucune donnee de sante hebergee) |
| **DPA / Contrat** | [vercel.com/legal/dpa](https://vercel.com/legal/dpa) |

---

### 1.3 Stripe (Stripe Payments Europe Ltd)

| Champ | Detail |
|---|---|
| **Raison sociale** | Stripe Payments Europe, Limited |
| **Role** | Traitement des paiements en ligne (abonnements psychologues, paiements patients) |
| **Donnees transmises** | Nom, adresse email et coordonnees bancaires du psychologue. Jamais de donnees patients directement — les patients interagissent avec Stripe via le formulaire de paiement sans transit par PsyLib |
| **Sensibilite des donnees** | Moderee — donnees financieres, aucune donnee de sante |
| **Localisation** | Irlande (Union europeenne) pour les comptes europeens |
| **Certification HDS** | Non applicable (aucune donnee de sante traitee) |
| **DPA / Contrat** | [stripe.com/fr/legal/dpa](https://stripe.com/fr/legal/dpa) |

---

### 1.4 Resend (via Amazon SES)

| Champ | Detail |
|---|---|
| **Raison sociale** | Resend Inc. |
| **Role** | Envoi d'emails transactionnels (confirmations, rappels de rendez-vous, invitations patients, notifications) |
| **Donnees transmises** | Adresse email du destinataire et contenu du message. Les emails ne contiennent jamais de notes cliniques, de comptes rendus de seance ni de donnees de sante |
| **Sensibilite des donnees** | Faible — adresses email et contenu non clinique uniquement |
| **Localisation** | Etats-Unis (infrastructure Amazon SES) |
| **Certification HDS** | Non applicable (aucune donnee de sante transmise) |
| **DPA / Contrat** | [resend.com/legal/dpa](https://resend.com/legal/dpa) |
| **Note** | Les templates d'emails sont concus pour ne jamais inclure de donnees cliniques ou de sante. Seules des informations logistiques (date, heure, nom) sont transmises. |

---

### 1.5 OpenRouter / Anthropic

| Champ | Detail |
|---|---|
| **Raison sociale** | OpenRouter Inc. / Anthropic PBC |
| **Role** | Intelligence artificielle — resume automatique de seances, generation d'exercices therapeutiques personnalises |
| **Donnees transmises** | Notes de seance du psychologue, uniquement apres consentement explicite du patient (type de consentement : `ai_processing`, enregistre dans la table `gdpr_consents`) |
| **Sensibilite des donnees** | Elevee — donnees de sante (notes cliniques) transmises uniquement avec consentement |
| **Localisation** | Etats-Unis |
| **Certification HDS** | Non |
| **DPA / Contrat** | [openrouter.ai/terms](https://openrouter.ai/terms) + [anthropic.com/legal](https://anthropic.com/legal) |
| **Note** | Le consentement `ai_processing` du patient est verifie systematiquement avant chaque appel a l'API IA. Sans consentement enregistre et valide, aucune donnee ne quitte le serveur HDS. Le psychologue est informe de cette verification et peut consulter l'etat du consentement dans la fiche patient. |

---

### 1.6 Sentry

| Champ | Detail |
|---|---|
| **Raison sociale** | Functional Software Inc. (dba Sentry) |
| **Role** | Monitoring des erreurs applicatives — detection et diagnostic des dysfonctionnements techniques de la plateforme |
| **Donnees transmises** | Traces d'erreurs techniques (stack traces, URL de la page, navigateur, version de l'application). Les messages d'erreur sont anonymises cote serveur avant envoi : aucune donnee patient (nom, email, notes, contenu clinique) n'est jamais transmise a Sentry |
| **Sensibilite des donnees** | Aucune — donnees techniques uniquement, aucune donnee de sante ni donnee personnelle identifiante |
| **Localisation** | Etats-Unis |
| **Certification HDS** | Non applicable (aucune donnee de sante traitee) |
| **DPA / Contrat** | [sentry.io/legal/dpa](https://sentry.io/legal/dpa) — Standard Contractual Clauses (SCCs) pour le transfert hors UE |
| **Note** | Sentry est configure pour ne capturer que les metadonnees techniques d'erreur. Un filtre cote serveur (scrubbing) empeche toute fuite accidentelle de donnees personnelles ou cliniques dans les rapports d'erreur. |

---

### 1.7 PostHog

| Champ | Detail |
|---|---|
| **Raison sociale** | PostHog Inc. |
| **Role** | Analytics produit — mesure d'utilisation de l'interface par les psychologues uniquement, pour ameliorer l'ergonomie et les fonctionnalites de la plateforme |
| **Donnees transmises** | Evenements d'interaction anonymises des psychologues (pages visitees, clics sur fonctionnalites, duree de session). Aucune donnee patient n'est jamais collectee — le tracking est strictement limite aux comptes psychologues |
| **Sensibilite des donnees** | Faible — donnees d'usage anonymisees, aucune donnee de sante, aucune donnee patient |
| **Localisation** | Union europeenne (hebergement EU disponible et selectionne) |
| **Certification HDS** | Non applicable (aucune donnee de sante traitee) |
| **DPA / Contrat** | [posthog.com/docs/privacy/dpa](https://posthog.com/docs/privacy/dpa) |
| **Note** | PostHog ne suit que l'activite des psychologues sur l'interface de gestion. Les espaces patients (portail patient, mood tracking, journal) ne sont pas instruments. Aucun identifiant patient n'est jamais transmis. |

---

### 1.8 LiveKit (auto-heberge)

| Champ | Detail |
|---|---|
| **Raison sociale** | N/A — logiciel open-source auto-heberge |
| **Role** | Visioconference en temps reel (consultations individuelles et groupees) |
| **Donnees transmises** | Metadonnees de salle (identifiants codes, tokens de participation JWT). Les flux audio/video transitent en temps reel et ne sont pas enregistres |
| **Sensibilite des donnees** | Faible — metadonnees techniques uniquement, pas de stockage de contenu |
| **Localisation** | France (auto-heberge sur OVH HDS, meme VPS que l'infrastructure principale) |
| **Certification HDS** | Oui (heberge sur infrastructure OVH certifiee HDS) |
| **DPA / Contrat** | N/A — aucune donnee transmise a un tiers. LiveKit est deploye en auto-hebergement, les flux restent integralement sur l'infrastructure HDS |

---

## 2. Mesures de securite mises en oeuvre

PsyLib met en oeuvre les mesures techniques et organisationnelles suivantes pour garantir la protection des donnees personnelles et de sante :

- **Chiffrement au repos :** AES-256-GCM sur tous les champs sensibles (notes de seance, resumes IA, messages, journal patient). Format stocke : `iv:authTag:encrypted`. Cle de chiffrement rotative via variable d'environnement.
- **Chiffrement en transit :** TLS 1.3 sur l'ensemble des communications (API, frontend, WebSocket, emails).
- **Authentification forte :** Keycloak (auto-heberge OVH HDS) avec MFA TOTP obligatoire pour les psychologues. Tokens JWT : access 15 min, refresh 8 heures.
- **Journalisation des acces :** Table `audit_logs` enregistrant toutes les operations sur les donnees sensibles (creation, lecture, modification, suppression, dechiffrement). Chaque entree inclut : acteur, action, entite, adresse IP, horodatage.
- **Isolation multi-tenant :** Filtrage systematique par `psychologist_id` sur toutes les requetes. Double protection : filtre applicatif (NestJS Guards) + contraintes au niveau de la base de donnees.
- **Consentement RGPD :** Table `gdpr_consents` versionnee et horodatee. Types de consentement : `data_processing`, `ai_processing`, `marketing`. Chaque consentement enregistre la version, la date et l'adresse IP.
- **Rate limiting :** Protection contre les abus sur les endpoints d'authentification (Keycloak natif) et les appels IA (5 requetes/min/tenant via BullMQ).
- **En-tetes de securite HTTP :** Strict-Transport-Security, X-Frame-Options, X-Content-Type-Options, Content-Security-Policy, Referrer-Policy, Permissions-Policy.

---

## 3. Droits des personnes concernees

Conformement aux articles 15 a 21 du RGPD, PsyLib garantit l'exercice effectif des droits suivants :

- **Droit d'acces (Article 15)** : Toute personne concernee peut obtenir la confirmation que ses donnees sont traitees et en obtenir une copie. Endpoint technique : `GET /patients/:id/export` (export complet au format structure).
- **Droit de rectification (Article 16)** : Les donnees personnelles inexactes peuvent etre corrigees a tout moment par le psychologue referent via l'interface de gestion.
- **Droit a l'effacement (Article 17)** : Suppression totale et irreversible de toutes les donnees d'un patient, incluant les seances, rendez-vous, messages, exercices, journal et consentements. Endpoint technique : `DELETE /patients/:id/purge`. Les relations en base de donnees sont configurees avec `onDelete: SetNull` pour garantir l'integrite referentielle lors de la purge.
- **Droit a la portabilite (Article 20)** : Export des donnees dans un format structure et lisible par machine via `GET /patients/:id/export`.
- **Droit d'opposition (Article 21)** : Le patient peut retirer son consentement au traitement IA a tout moment. Le retrait est enregistre dans `gdpr_consents` avec horodatage (`withdrawn_at`).

**Contact pour l'exercice des droits :** tony@psylib.eu

---

## 4. Procedure de mise a jour

Ce registre est mis a jour a chaque ajout, modification ou suppression d'un sous-traitant technique. Les psychologues utilisateurs de PsyLib sont informes de toute modification substantielle par email et via une notification dans l'application.

---

*Document mis a jour le 2026-05-15 — PsyLib v1.1*
*Changements v1.1 : ajout de Sentry (§1.6) et PostHog (§1.7) au registre*
