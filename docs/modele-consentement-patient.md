# Modele de consentement patient — PsyLib

**Version 1.0 — Mai 2026**
**Document a destination des psychologues utilisant PsyLib**

> Ce modele est fourni a titre indicatif. Chaque psychologue reste responsable de l'adapter a sa pratique et de verifier sa conformite avec ses obligations deontologiques et legales.

---

## FORMULAIRE D'INFORMATION ET DE CONSENTEMENT DU PATIENT
### Traitement des donnees personnelles et de sante via la plateforme PsyLib

---

### 1. IDENTITE DU RESPONSABLE DE TRAITEMENT

**Psychologue :**

- Nom et prenom : ____________________________________
- Numero ADELI / RPPS : ____________________________________
- Adresse du cabinet : ____________________________________
- Telephone : ____________________________________
- Email : ____________________________________

Le psychologue est le **responsable de traitement** de vos donnees personnelles et de sante au sens du Reglement General sur la Protection des Donnees (RGPD).

La societe PsyLib (micro-entreprise Tony Ruppel, SIRET 102 784 956 00017) intervient en qualite de **sous-traitant** pour l'hebergement et le fonctionnement de la plateforme logicielle.

---

### 2. DONNEES COLLECTEES

Dans le cadre de votre suivi psychologique, les donnees suivantes peuvent etre collectees et traitees via la plateforme PsyLib :

**Donnees d'identification :**
- Nom, prenom, date de naissance
- Adresse e-mail, numero de telephone
- Pour les mineurs : identite du ou des tuteurs legaux

**Donnees de sante et donnees cliniques :**
- Notes cliniques redigees par le psychologue
- Resumes de seance (rediges par le psychologue ou assistes par IA)
- Exercices therapeutiques proposes
- Suivi d'humeur (si vous utilisez l'espace patient)
- Entrees de journal personnel (si vous utilisez l'espace patient)

**Donnees d'echange :**
- Messages echanges avec votre psychologue via la messagerie securisee
- Documents partages par votre psychologue

**Donnees de rendez-vous et facturation :**
- Dates et horaires de rendez-vous
- Factures et informations de paiement

---

### 2bis. EMPREINTE BANCAIRE ET POLITIQUE D'ANNULATION

Certains praticiens peuvent demander l'enregistrement de votre carte bancaire comme garantie au moment de la reservation. Dans ce cas :

- **Aucun montant n'est preleve** a la reservation.
- Votre carte est enregistree de facon securisee par notre prestataire de paiement **Stripe** (certifie PCI-DSS). PsyLib ne stocke jamais vos donnees de carte.
- Le praticien peut debiter un montant de son choix **en cas d'absence non signalee** (lapin) ou selon sa politique d'annulation, a la fin de la seance ou posterieurement.
- Vous pouvez contacter le praticien ou notre support (tony@psylib.eu) pour contester tout debit.

Cette demande est facultative : seuls les praticiens qui l'activent explicitement y recourent. Votre consentement vous est demande au moment de la reservation, avant tout enregistrement de carte.

---

### 3. FINALITES DU TRAITEMENT

Vos donnees sont traitees exclusivement pour les finalites suivantes :

1. **Suivi psychologique** : gestion de votre dossier patient, prise de notes de seance, planification de rendez-vous
2. **Communication securisee** : echanges par messagerie chiffree entre vous et votre psychologue
3. **Espace patient** (si active) : suivi d'humeur, exercices therapeutiques, journal personnel
4. **Facturation** : emission de factures et suivi des paiements
5. **Aide redactionnelle par IA** (uniquement avec votre consentement specifique) : generation de resumes structures de seance et d'exercices therapeutiques

**Vos donnees ne sont jamais utilisees a des fins :**
- Marketing, publicitaires ou commerciales
- De recherche, de statistiques ou d'analyse secondaire
- D'entrainement ou d'amelioration de modeles d'intelligence artificielle

---

### 4. BASE LEGALE

| Traitement | Base legale |
|---|---|
| Suivi psychologique | Execution du contrat de soins |
| Donnees de sante | Consentement explicite (art. 9.2.a RGPD) |
| Facturation | Obligation legale |
| Traitement par IA | Consentement specifique (section 8) |

---

### 5. HEBERGEMENT ET SECURITE

Vos donnees sont hebergees en **France** sur une infrastructure **certifiee HDS** (Hebergement de Donnees de Sante), conformement a l'article L.1111-8 du Code de la sante publique.

**Mesures de securite appliquees :**

- **Chiffrement en transit** : TLS 1.3 (toutes les communications)
- **Chiffrement au repos** : AES-256-GCM sur les notes cliniques, messages, resumes IA et contenus de journal
- **Authentification renforcee** : le psychologue accede a la plateforme via une authentification a deux facteurs (MFA) obligatoire
- **Isolation des donnees** : vos donnees sont strictement isolees et accessibles uniquement a votre psychologue
- **Tracabilite** : chaque acces a vos donnees est enregistre dans un journal d'audit

**Aucun membre de l'equipe PsyLib ne peut lire vos donnees cliniques** — le chiffrement applicatif rend ces informations illisibles meme avec un acces au serveur.

---

### 6. DESTINATAIRES

Vos donnees sont accessibles uniquement par :

- **Votre psychologue** : acces complet a votre dossier
- **Vous-meme** : acces a votre espace patient (humeur, exercices, journal, documents partages)

Les sous-traitants techniques suivants interviennent dans le fonctionnement de la plateforme, sans acces au contenu clinique :

| Sous-traitant | Role | Donnees | Localisation |
|---|---|---|---|
| OVH (HDS) | Hebergement serveur | Donnees chiffrees | France |
| Stripe | Paiement en ligne | Donnees bancaires uniquement | UE (Irlande) |
| Resend | Envoi d'e-mails | Adresse e-mail + contenu du mail | UE |

---

### 7. DUREE DE CONSERVATION

| Donnee | Duree de conservation |
|---|---|
| Dossier patient | Duree du suivi + 5 ans apres la fin du suivi (recommandation ordinale) |
| Notes cliniques | Idem dossier patient |
| Messages | Duree du suivi + 1 an |
| Factures | 10 ans (obligation legale comptable) |
| Journal et humeur | Duree du suivi, supprime sur demande |

A l'issue de ces delais, les donnees sont supprimees definitivement.

---

### 8. TRAITEMENT PAR INTELLIGENCE ARTIFICIELLE

Votre psychologue peut utiliser un outil d'**aide redactionnelle par intelligence artificielle** integre a PsyLib. Cet outil permet :

- De generer un **resume structure** a partir des notes de seance redigees par le psychologue
- De proposer des **exercices therapeutiques** adaptes a votre profil

**Garanties :**

- L'IA est **strictement une aide redactionnelle**. Elle ne produit aucun diagnostic, aucune interpretation psychologique, aucun score de risque.
- Le psychologue **valide, modifie ou supprime** systematiquement tout contenu genere avant integration a votre dossier.
- Vos donnees **ne sont jamais utilisees** pour entrainer ou ameliorer des modeles d'IA.
- L'IA n'a **jamais** acces a l'integralite de votre dossier — seules les notes de la seance concernee sont transmises, sans informations directement identifiantes.
- Le traitement IA ne se declenche **jamais automatiquement** — c'est toujours une action volontaire du psychologue.

**Ce traitement necessite votre consentement specifique** (voir section 10).

---

### 9. TELECONSULTATION ET MESSAGERIE

**Visioconference :**
- Les consultations video sont realisees via un systeme auto-heberge en France sur infrastructure HDS.
- **Aucun enregistrement** audio ou video n'est effectue. Les flux sont transmis en temps reel et ne sont pas conserves.
- Aucune transcription automatique n'est realisee.

**Messagerie securisee :**
- Les messages echanges avec votre psychologue sont **chiffres** (AES-256-GCM) et heberges en France (HDS).
- Seuls vous et votre psychologue pouvez lire vos echanges.

---

### 10. VOS DROITS

Conformement au RGPD et a la loi Informatique et Libertes, vous disposez des droits suivants :

- **Droit d'acces** : obtenir une copie de toutes vos donnees
- **Droit de rectification** : corriger des informations inexactes
- **Droit a l'effacement** : demander la suppression de vos donnees
- **Droit a la portabilite** : recevoir vos donnees dans un format structure (JSON)
- **Droit d'opposition** : vous opposer a un traitement specifique
- **Droit de retrait du consentement** : retirer votre consentement a tout moment, sans effet retroactif

Pour exercer ces droits, adressez-vous directement a votre psychologue ou contactez PsyLib a l'adresse : **tony@psylib.eu**

Vous pouvez egalement introduire une reclamation aupres de la **CNIL** (Commission Nationale de l'Informatique et des Libertes) : www.cnil.fr

---

### 11. CONSENTEMENT

**Patient :**

- Nom et prenom : ____________________________________
- Date de naissance : ____________________________________

---

En signant ce document, je reconnais avoir pris connaissance des informations ci-dessus et :

&#9744; **J'accepte** le traitement de mes donnees personnelles et de sante via la plateforme PsyLib, dans les conditions decrites dans ce document, pour les finalites de mon suivi psychologique.

&#9744; **J'accepte** que mes notes de seance puissent faire l'objet d'un traitement par intelligence artificielle (aide redactionnelle), sous le controle et la validation de mon psychologue.

&#9744; **Je refuse** le traitement de mes notes par intelligence artificielle. Je comprends que mon suivi psychologique ne sera pas affecte par ce refus.

&#9744; **J'accepte** de recevoir des messages de mon psychologue via la messagerie securisee PsyLib.

&#9744; **J'accepte** de recevoir des documents partages par mon psychologue via PsyLib.

---

**Date :** ____________________________________

**Signature du patient :**



---

### 12. CONSENTEMENT POUR UN PATIENT MINEUR

*A remplir par le ou les titulaires de l'autorite parentale.*

**Mineur concerne :**
- Nom et prenom : ____________________________________
- Date de naissance : ____________________________________

**Titulaire(s) de l'autorite parentale :**

- Nom et prenom (tuteur 1) : ____________________________________
- Lien avec le mineur : ____________________________________
- Telephone : ____________________________________
- Email : ____________________________________

- Nom et prenom (tuteur 2, le cas echeant) : ____________________________________
- Lien avec le mineur : ____________________________________
- Telephone : ____________________________________
- Email : ____________________________________

---

En qualite de titulaire de l'autorite parentale, je reconnais avoir pris connaissance des informations ci-dessus et :

&#9744; **J'autorise** le traitement des donnees personnelles et de sante de mon enfant via la plateforme PsyLib, dans les conditions decrites dans ce document.

&#9744; **J'autorise** le traitement des notes de seance de mon enfant par intelligence artificielle (aide redactionnelle), sous le controle du psychologue.

&#9744; **Je refuse** le traitement par intelligence artificielle pour mon enfant.

&#9744; **J'autorise** l'envoi de documents et messages via la plateforme PsyLib dans le cadre du suivi de mon enfant.

&#9744; **Je comprends** que certaines informations cliniques peuvent rester confidentielles entre le psychologue et mon enfant, conformement au Code de deontologie des psychologues et dans l'interet therapeutique du mineur.

---

**Date :** ____________________________________

**Signature du tuteur 1 :**


**Signature du tuteur 2 (le cas echeant) :**


---

### 13. RETRAIT DU CONSENTEMENT

Vous pouvez retirer votre consentement a tout moment, sans justification et sans consequence sur votre suivi. Le retrait du consentement n'affecte pas la licéite du traitement effectue avant ce retrait.

Pour retirer votre consentement :
- Informez directement votre psychologue
- Ou envoyez un e-mail a : **tony@psylib.eu**

Le retrait sera effectif sous 48 heures.

---

*Document fourni par PsyLib (psylib.eu) — version 1.0, mai 2026*
*Ce document ne constitue pas un conseil juridique. Chaque professionnel est invite a le faire valider par un juriste si necessaire.*
