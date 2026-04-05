# Cold Email Sequence — Prospection psychologues libéraux

Séquence 3 emails prête à importer dans **Brevo** (ex-Sendinblue). Conforme CNIL B2B (emails professionnels uniquement + lien désabonnement).

---

## Pré-requis obligatoires AVANT envoi

### 1. Configuration domaine
- [ ] Domaine d'envoi dédié (ex : `hello@psylib.eu` ou `marie@psylib.eu`) — **JAMAIS** `contact@`
- [ ] SPF configuré : `v=spf1 include:spf.brevo.com include:_spf.google.com ~all`
- [ ] DKIM configuré (clé Brevo)
- [ ] DMARC : `v=DMARC1; p=none; rua=mailto:dmarc@psylib.eu`
- [ ] Tester délivrabilité : https://www.mail-tester.com (score > 9/10 requis)

### 2. Warmup domaine
- **Semaine 1 :** 20 emails/jour max
- **Semaine 2 :** 50 emails/jour max
- **Semaine 3+ :** 100-200 emails/jour max
- Outils warmup auto : Warmbox, Mailwarm (optionnel)

### 3. Ciblage légal (CNIL)
- ✅ Email professionnel cabinet (affiché publiquement sur site/annuaire)
- ✅ Message concerne directement l'activité professionnelle
- ✅ Lien désabonnement fonctionnel dans CHAQUE email
- ❌ PAS d'email générique gratuit (gmail perso, yahoo)
- ❌ PAS de données sensibles dans le message (pas de "données de santé")
- ❌ PAS de relance après désabonnement

### 4. Setup Brevo (checklist)
- [ ] Créer une liste "Prospects Psychologues — Cold 2026-Q2"
- [ ] Créer les 3 templates ci-dessous
- [ ] Créer une **Automation** déclenchée à l'ajout dans la liste
- [ ] Configurer tracking UTM : `?utm_source=cold&utm_medium=email&utm_campaign=psy-hds-q2`
- [ ] Activer tracking ouvertures + clics
- [ ] Tester avec 5 emails amis avant envoi en masse

---

## EMAIL 1 — J+0 (initial)

**Objet (A/B test) :**
- Version A : `Votre logiciel cabinet est-il légalement conforme ?`
- Version B : `{{contact.FIRSTNAME}}, petite question sur votre logiciel de cabinet`
- Version C : `RGPD cabinet : 80% des psys sont hors-la-loi sans le savoir`

**Preheader :** `Article L.1111-8 du Code de la santé publique — ce que personne ne vous dit.`

**Corps (HTML) :**
```html
Bonjour {{contact.FIRSTNAME}},

Je vous écris depuis PsyLib — je construis le premier logiciel de gestion
de cabinet 100% HDS pour psychologues libéraux.

Pourquoi je vous contacte : l'article L.1111-8 du Code de la santé
publique impose que tout logiciel hébergeant des données patients soit
certifié HDS (Hébergeur de Données de Santé).

En pratique, 80% des psys utilisent aujourd'hui des outils non conformes
(Google Drive, Dropbox, Excel, logiciels SaaS hébergés hors France) —
souvent sans le savoir. Sanction CNIL potentielle : jusqu'à 20 M€ ou 4% du CA.

J'ai construit PsyLib pour résoudre ce problème — avec en bonus tout ce
que Doctolib ne fait PAS : notes de séance structurées, outcome tracking
PHQ-9/GAD-7, facturation conforme, IA clinique, paiement en ligne Stripe,
espace patient.

Prix : 43€/mois pour l'offre Fondateurs (15 places, ~10 restantes).

Est-ce que vous auriez 15 minutes cette semaine pour une démo courte ?

Cordialement,
[Prénom]
Fondateur PsyLib
https://psylib.eu

P.S. : Si ce n'est pas le bon moment, aucun souci. Je vous enverrai
dans 4 jours notre guide gratuit "RGPD & HDS pour psychologues"
(12 pages) — ça peut déjà vous être utile.

---
Cet email vous est envoyé dans un cadre professionnel (intérêt légitime B2B).
Se désabonner : {{unsubscribe}}
```

**Version texte plain :**
```
Bonjour {{contact.FIRSTNAME}},

Je vous écris depuis PsyLib - je construis le premier logiciel de gestion de cabinet 100% HDS pour psychologues libéraux.

Pourquoi je vous contacte : l'article L.1111-8 du Code de la santé publique impose que tout logiciel hébergeant des données patients soit certifié HDS.

80% des psys utilisent aujourd'hui des outils non conformes (Drive, Dropbox, Excel, SaaS non-HDS) - souvent sans le savoir. Sanction CNIL : jusqu'a 20 M€ ou 4% du CA.

PsyLib combine tout ce que Doctolib ne fait PAS : notes de séance, outcome tracking PHQ-9/GAD-7, facturation conforme, IA clinique, paiement Stripe, espace patient.

Prix : 43€/mois pour les 15 premiers Fondateurs.

15 minutes cette semaine pour une démo ?

Cordialement,
[Prénom] - Fondateur PsyLib
https://psylib.eu

Se désabonner : {{unsubscribe}}
```

---

## EMAIL 2 — J+4 (valeur gratuite)

**Déclencheur :** J+4 après Email 1, uniquement si pas de réponse/click.

**Objet (A/B test) :**
- Version A : `Le guide RGPD/HDS que je vous avais promis`
- Version B : `{{contact.FIRSTNAME}}, une ressource utile pour votre cabinet`

**Preheader :** `12 pages pour comprendre vos obligations et vérifier votre conformité.`

**Corps (HTML) :**
```html
Bonjour {{contact.FIRSTNAME}},

Comme promis, voici notre guide gratuit :

👉 Guide RGPD & HDS pour psychologues libéraux
   https://psylib.eu/ressources/guide-rgpd-hds?utm_source=cold&utm_medium=email&utm_campaign=psy-hds-q2&utm_content=email2

12 pages pour comprendre :
1. Ce que dit exactement la loi (L.1111-8, RGPD, Code de déontologie)
2. Les 7 obligations HDS concrètes pour un cabinet psy
3. La checklist "mon logiciel est-il conforme ?"
4. Les pièges les plus fréquents (Google Drive, Doctolib, Excel...)
5. Les sanctions CNIL récentes sur des professionnels de santé
6. Le droit d'information patient et les mentions légales
7. Comment migrer sans douleur vers un outil conforme

C'est gratuit, pas d'engagement. Téléchargez, lisez tranquillement.

Si après lecture vous voulez comparer PsyLib à votre solution actuelle,
je reste disponible pour une démo de 20 minutes.

Bonne journée,
[Prénom]
PsyLib — https://psylib.eu

---
Se désabonner : {{unsubscribe}}
```

**Version texte plain :**
```
Bonjour {{contact.FIRSTNAME}},

Comme promis, le guide gratuit :

Guide RGPD & HDS pour psychologues libéraux (12 pages)
https://psylib.eu/ressources/guide-rgpd-hds

Vous y trouverez :
- Ce que dit la loi (L.1111-8, RGPD)
- Les 7 obligations HDS pour un cabinet psy
- Checklist "mon logiciel est-il conforme ?"
- Les pièges fréquents (Drive, Doctolib, Excel)
- Sanctions CNIL récentes
- Guide de migration

Gratuit, sans engagement.

Bonne lecture,
[Prénom] - PsyLib
https://psylib.eu

Se désabonner : {{unsubscribe}}
```

---

## EMAIL 3 — J+10 (dernière relance — scarcity)

**Déclencheur :** J+10 après Email 1, uniquement si pas de réponse et pas désabonné.

**Objet (A/B test) :**
- Version A : `Dernière relance — 7 places Fondateurs restantes`
- Version B : `{{contact.FIRSTNAME}}, je ne vous écrirai plus après ça`
- Version C : `L'offre Fondateurs ferme dans quelques jours`

**Preheader :** `43€/mois à vie, prix gelé pour toujours — 15 places, 7 restantes.`

**Corps (HTML) :**
```html
Bonjour {{contact.FIRSTNAME}},

Promis, c'est mon dernier email.

Rapide récap :
→ PsyLib = logiciel tout-en-un pour psys libéraux (agenda + notes +
  facturation + IA + paiement + espace patient)
→ 100% conforme HDS (hébergement France + chiffrement AES-256-GCM)
→ Alternative à Doctolib (139€+) et aux 3-4 outils que vous cumulez

Offre Fondateurs : 43€/mois garantis à vie, prix gelé même quand
on passera à 69€/mois. Il reste 7 places sur 15.

Je ferme l'offre dans quelques jours.

Deux façons de continuer :

1. Candidature directe (2 minutes) :
   https://psylib.eu/beta?utm_source=cold&utm_medium=email&utm_campaign=psy-hds-q2&utm_content=email3

2. Démo en visio (20 min, créneaux cette semaine) :
   [Lien Calendly]

Si rien ne vous intéresse, c'est OK — désabonnez-vous sans culpabilité
avec le lien en bas.

Bonne continuation dans votre pratique,

[Prénom]
Fondateur PsyLib
https://psylib.eu

---
Se désabonner définitivement : {{unsubscribe}}
```

**Version texte plain :**
```
Bonjour {{contact.FIRSTNAME}},

Promis, c'est mon dernier email.

PsyLib = logiciel tout-en-un psy libéraux, 100% HDS.
Offre Fondateurs : 43€/mois à vie, 7 places restantes sur 15.

Je ferme l'offre dans quelques jours.

1. Candidater directement :
https://psylib.eu/beta

2. Démo en visio 20 min :
[Lien Calendly]

Bonne continuation,
[Prénom] - PsyLib
https://psylib.eu

Se désabonner : {{unsubscribe}}
```

---

## Paramétrage Automation Brevo

**Trigger :** Ajout à la liste "Prospects Psychologues — Cold 2026-Q2"

**Flow :**
```
Ajout liste
    ↓
Attente 1h (délai aléatoire 10h-18h)
    ↓
Envoi Email 1
    ↓
Attente 4 jours
    ↓
Condition : Si pas de réponse ET pas de clic ET pas de désabonnement
    ↓
Envoi Email 2
    ↓
Attente 6 jours
    ↓
Condition : Si pas de réponse ET pas de désabonnement
    ↓
Envoi Email 3
    ↓
Attente 2 jours
    ↓
Déplacer vers liste "Cold Campaign Terminée — Avril 2026"
```

**Règles anti-spam :**
- Maximum 50 emails/jour la 1ère semaine (warmup)
- Répartir envois entre 9h et 17h heure FR
- Pas de pièce jointe
- Pas plus de 2 liens par email
- Ratio texte/image minimum 80/20

---

## KPIs cibles (suivi hebdo)

| Metric | Cible | Alerte si < |
|---|---|---|
| Taux délivrabilité | ≥ 95% | 90% |
| Taux ouverture Email 1 | ≥ 35% | 25% |
| Taux ouverture Email 2 | ≥ 40% | 30% |
| Taux ouverture Email 3 | ≥ 30% | 20% |
| Taux clic global | ≥ 5% | 2% |
| Taux réponse | ≥ 5% | 2% |
| Taux désabonnement | ≤ 2% | — |
| Taux conversion démo | ≥ 3% | — |
| Taux plainte spam | ≤ 0,1% | **STOP si > 0,3%** |

---

## A/B test prioritaire semaine 1

Tester 2 objets sur Email 1 :
- **A (peur) :** "Votre logiciel cabinet est-il légalement conforme ?"
- **B (personnel) :** "{{contact.FIRSTNAME}}, petite question sur votre logiciel de cabinet"

Lancer sur 100 contacts (50/50), gagnant = utilisé sur toute la suite.

---

## Template enrichi pour Brevo (import CSV)

Colonnes attendues pour importer dans Brevo :

```csv
EMAIL,FIRSTNAME,LASTNAME,CITY,DEPARTEMENT,SPECIALITE,SOURCE,ADELI
marie.dupont@cabinet-psy.fr,Marie,Dupont,Paris,75,TCC,rpps-2026-q2,751234567
jean.martin@psy-lyon.fr,Jean,Martin,Lyon,69,Psychodynamique,rpps-2026-q2,691234567
```

---

## Liens utiles

- CNIL — Prospection B2B : https://www.cnil.fr/fr/la-prospection-commerciale-par-courrier-electronique
- Brevo — Configuration SPF/DKIM : https://help.brevo.com/hc/fr/articles/208836149
- Mail Tester (score délivrabilité) : https://www.mail-tester.com
- Spam Test : https://www.litmus.com/spam-testing
