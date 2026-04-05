# PsyLib LinkedIn + Facebook AutoPoster — Guide de Configuration n8n

## Vue d'ensemble

Ce workflow publie automatiquement les posts PsyLib les mardis et jeudis à 8h30, en **parallèle sur LinkedIn et sur la page Facebook PsyLib**, en lisant les posts depuis un Google Sheet et en trackant chaque publication.

**Fichiers :**
- `n8n-linkedin-autoposter.json` — workflow à importer dans n8n
- `linkedin-posts-sheet-template.csv` — données à coller dans Google Sheets

---

## Etape 1 — Créer le Google Sheet

1. Aller sur https://sheets.google.com → créer un nouveau fichier
2. Nommer le fichier : **PsyLib Social Media Posts**
3. Renommer l'onglet par défaut : **Posts**
4. Coller les données de `linkedin-posts-sheet-template.csv` en ligne 1 (avec les en-têtes)

### Colonnes du sheet

| Colonne | Type | Description |
|---------|------|-------------|
| `post_id` | Texte | Identifiant unique (POST_001, etc.) |
| `title` | Texte | Titre interne pour s'y retrouver |
| `content` | Texte | Texte complet du post |
| `hashtags` | Texte | Hashtags séparés par des espaces |
| `type` | Texte | `text` ou `carousel` |
| `status` | Texte | `pending` / `published` / `draft` / `skip` |
| `published_at` | Texte | Rempli automatiquement par n8n |
| `linkedin_post_id` | Texte | ID retourné par LinkedIn, rempli par n8n |
| `facebook_status` | Texte | `published` ou `error`, rempli par n8n |
| `facebook_post_id` | Texte | ID retourné par Facebook Graph API, rempli par n8n |

**Statuts gérés :**
- `pending` : sera publié au prochain déclenchement (LinkedIn + Facebook)
- `published` : déjà publié, ne sera plus touché
- `draft` : brouillon, ignoré par le workflow
- `skip` : passer ce post sans le supprimer

5. Copier l'ID du sheet depuis l'URL :
   `https://docs.google.com/spreadsheets/d/`**CECI_EST_L_ID**`/edit`

---

## Etape 2 — Configurer LinkedIn OAuth2 dans n8n

### 2.1 — Créer une app LinkedIn

1. Aller sur https://www.linkedin.com/developers/apps
2. Cliquer "Create App"
3. Remplir :
   - App name : `PsyLib AutoPoster`
   - LinkedIn Page : votre page entreprise PsyLib (en créer une si besoin)
   - App logo : logo PsyLib
4. Aller dans l'onglet **Auth**
5. Noter le **Client ID** et **Client Secret**
6. Ajouter l'OAuth 2.0 redirect URL : `https://n8n.claire-clavel.fr/rest/oauth2-credential/callback`
7. Aller dans l'onglet **Products** → activer **Share on LinkedIn** (et **Sign In with LinkedIn** si proposé)

### 2.2 — Créer le credential dans n8n

1. Dans n8n → Credentials → Add Credential → **OAuth2 API**
2. Remplir :
   - Name : `LinkedIn PsyLib OAuth2`
   - Grant Type : `Authorization Code`
   - Authorization URL : `https://www.linkedin.com/oauth/v2/authorization`
   - Access Token URL : `https://www.linkedin.com/oauth/v2/accessToken`
   - Client ID : (depuis l'app LinkedIn)
   - Client Secret : (depuis l'app LinkedIn)
   - Scope : `w_member_social r_liteprofile`
3. Cliquer "Connect my account" → se connecter avec le compte PsyLib LinkedIn
4. Noter l'ID du credential créé (visible dans l'URL)

### 2.3 — Récupérer votre LinkedIn Person URN

1. Dans le workflow, lancer manuellement le node **HTTP LinkedIn Get Profile URN** (node isolé en haut)
2. La réponse contiendra un champ `id` : ex. `"id": "a1B2c3D4e5"`
3. Votre URN est : `urn:li:person:a1B2c3D4e5`
4. Dans le workflow, ouvrir le node **Code Construire Payload LinkedIn**
5. Remplacer `REPLACE_WITH_LINKEDIN_PERSON_URN` par votre URN complet

---

## Etape 3 — Configurer Facebook Graph API

### 3.1 — Créer une application Facebook Developer

1. Aller sur https://developers.facebook.com/apps
2. Cliquer "Create App"
3. Choisir le type : **Business** (pour accéder à l'API Pages)
4. Remplir :
   - App name : `PsyLib AutoPoster`
   - App contact email : votre email
5. Une fois l'app créée, aller dans **Settings → Basic** et noter l'**App ID** et l'**App Secret**
6. Dans la barre latérale → **Add a Product** → ajouter **Facebook Login** et **Pages API**

### 3.2 — Obtenir un User Access Token avec les bons scopes

1. Aller sur https://developers.facebook.com/tools/explorer
2. Sélectionner votre app dans le menu déroulant
3. Cliquer "Generate Access Token"
4. Cocher les permissions suivantes :
   - `pages_manage_posts` (publier sur la page)
   - `pages_read_engagement` (lire la page)
   - `pages_show_list` (lister vos pages)
5. Cliquer "Generate Access Token" → autoriser avec le compte Facebook admin de la page PsyLib
6. Copier le **User Access Token** affiché (il expire dans 1-2 heures, c'est normal — on va le convertir)

### 3.3 — Convertir en Long-Lived User Token (60 jours)

Faire cette requête GET dans un navigateur ou via curl (remplacer les valeurs) :

```
https://graph.facebook.com/v19.0/oauth/access_token
  ?grant_type=fb_exchange_token
  &client_id=VOTRE_APP_ID
  &client_secret=VOTRE_APP_SECRET
  &fb_exchange_token=VOTRE_SHORT_LIVED_TOKEN
```

La réponse contient un `access_token` valide 60 jours. Copier ce token.

### 3.4 — Obtenir le Page Access Token permanent (jamais expiré)

Un **Page Access Token** généré depuis un Long-Lived User Token ne expire **jamais** tant que :
- L'utilisateur ne révoque pas les permissions
- L'app reste active

Faire cette requête GET (remplacer LONG_LIVED_USER_TOKEN) :

```
https://graph.facebook.com/v19.0/me/accounts
  ?access_token=LONG_LIVED_USER_TOKEN
```

La réponse liste toutes vos pages avec leur `access_token` dédié. Chercher la page PsyLib :

```json
{
  "data": [
    {
      "id": "123456789012345",
      "name": "PsyLib",
      "access_token": "EAAxxxxx...TRES_LONG_TOKEN...xxxxx",
      "category": "Software"
    }
  ]
}
```

- `id` = votre **Page ID** (à mettre dans `FACEBOOK_PAGE_ID`)
- `access_token` = votre **Page Access Token permanent** (à mettre dans `FACEBOOK_PAGE_ACCESS_TOKEN`)

**Ce Page Access Token ne expire jamais** tant que l'admin de la page n'a pas révoqué l'accès.

### 3.5 — Récupérer l'ID de votre page via n8n (alternative)

Dans le workflow, le node **HTTP Facebook Get Pages** est isolé en haut (node utilitaire). Pour l'utiliser :
1. Dans n8n → Settings → Variables → ajouter temporairement `FACEBOOK_PAGE_ACCESS_TOKEN` avec votre Long-Lived User Token
2. Lancer manuellement le node → la réponse liste vos pages avec leur ID
3. Mettre à jour la variable avec le Page Access Token permanent récupéré

---

## Etape 4 — Configurer Google Sheets OAuth2 dans n8n

1. Dans n8n → Credentials → Add Credential → **Google Sheets OAuth2 API**
2. Suivre le flow OAuth (compte Google avec accès au sheet)
3. Name : `Google Sheets PsyLib`
4. Accorder les droits lecture/écriture sur Sheets

---

## Etape 5 — Configurer Gmail OAuth2 dans n8n

1. Dans n8n → Credentials → Add Credential → **Gmail OAuth2**
2. Suivre le flow OAuth
3. Name : `Gmail PsyLib`

---

## Etape 6 — Importer et configurer le workflow

### 6.1 — Importer le workflow

1. Dans n8n → Workflows → Import from File
2. Sélectionner `n8n-linkedin-autoposter.json`
3. Le workflow s'ouvre avec des erreurs de credentials (normal à ce stade)

### 6.2 — Configurer les variables n8n

Dans n8n → Settings → Variables → Add Variable, créer ces 3 variables :

| Key | Value |
|-----|-------|
| `GOOGLE_SHEET_ID` | L'ID du Google Sheet (copié à l'étape 1) |
| `FACEBOOK_PAGE_ID` | L'ID numérique de votre page Facebook PsyLib |
| `FACEBOOK_PAGE_ACCESS_TOKEN` | Le Page Access Token permanent (étape 3.4) |

### 6.3 — Brancher les credentials

Pour chaque node, ouvrir les paramètres et sélectionner le credential correspondant :

| Node | Credential |
|------|-----------|
| Sheets Lire Tous Les Posts | Google Sheets PsyLib |
| Sheets Marquer Publie | Google Sheets PsyLib |
| HTTP LinkedIn Publier Post | LinkedIn PsyLib OAuth2 |
| HTTP LinkedIn Get Profile URN | LinkedIn PsyLib OAuth2 |
| Gmail Notification Succes | Gmail PsyLib |
| Gmail Notification Vide | Gmail PsyLib |

> Le node **HTTP Facebook Publier Post** n'utilise pas de credential n8n — il lit directement `$vars.FACEBOOK_PAGE_ACCESS_TOKEN` dans le header Authorization. Pas d'action requise sur ce node.

### 6.4 — Remplacer les adresses email

Dans les deux nodes Gmail, remplacer `REPLACE_WITH_YOUR_EMAIL` par votre adresse réelle.

### 6.5 — Remplacer le Person URN LinkedIn

Dans le node **Code Construire Payload LinkedIn**, remplacer :
```
author: 'urn:li:person:REPLACE_WITH_LINKEDIN_PERSON_URN',
```
par votre URN réel (voir Etape 2.3).

---

## Etape 7 — Tester avant d'activer

### Test 1 — Vérifier la lecture du Sheet
1. Ouvrir le workflow
2. Cliquer sur le trigger → "Test Step"
3. Vérifier que "Sheets Lire Tous Les Posts" retourne bien les 5 posts
4. Vérifier que "Code Filtrer Post Suivant" retourne POST_001 avec `found: true`

### Test 2 — Tester sans publier
1. Mettre le status de POST_001 en `draft` temporairement dans le Sheet
2. Déclencher le workflow → devrait aller dans la branche "aucun post" → email Gmail

### Test 3 — Publication réelle
1. Remettre POST_001 en `pending`
2. Cliquer "Test Workflow" sur le trigger
3. Vérifier la publication sur le profil LinkedIn
4. Vérifier la publication sur la page Facebook PsyLib
5. Vérifier que le Sheet est mis à jour (status = published, les deux IDs renseignés)
6. Vérifier l'email de notification — il doit mentionner LinkedIn ET Facebook

---

## Etape 8 — Activer le workflow

Une fois les tests OK :
1. Cliquer le toggle "Active" en haut à droite
2. Le workflow se déclenchera automatiquement chaque mardi et jeudi à 8h30

**Important — Fuseau horaire :** Vérifier que n8n est configuré en `Europe/Paris` :
- Settings → General → Timezone → `Europe/Paris`

---

## Ajouter de nouveaux posts

Pour ajouter un post après épuisement des 5 existants :
1. Ouvrir le Google Sheet
2. Ajouter une ligne avec un nouvel `post_id` (POST_006, etc.)
3. Mettre `status = pending`
4. Laisser les colonnes `published_at`, `linkedin_post_id`, `facebook_status`, `facebook_post_id` vides
5. Le workflow le publiera au prochain déclenchement (LinkedIn + Facebook simultanément)

---

## Structure du workflow (résumé visuel)

```
Schedule Trigger (mar+jeu 8h30)
  -> Sheets : lire tous les posts
  -> Code : filtrer le premier "pending"
  -> IF post trouvé ?
     OUI -> [PARALLELE]
              Branche A : Code payload LinkedIn -> HTTP POST /ugcPosts
              Branche B : Code payload Facebook -> HTTP POST /{page-id}/feed
            [FIN PARALLELE]
            -> Merge : attendre les deux reponses
            -> Code : consolider resultats (IDs LinkedIn + Facebook)
            -> Sheets : marquer "published" + date + les deux IDs
            -> Gmail : notification (statut LinkedIn + statut Facebook)
     NON -> Gmail : "plus de posts en attente"
```

---

## Troubleshooting

### Erreur 401 LinkedIn
→ Le token OAuth2 a expiré. Ouvrir le credential LinkedIn dans n8n → "Reconnect".
LinkedIn access tokens durent 60 jours. n8n gère le refresh automatiquement si le refresh token est valide.

### Erreur 403 LinkedIn "Unauthorized"
→ Le scope `w_member_social` n'est pas activé sur l'app LinkedIn.
Aller sur https://www.linkedin.com/developers/apps → Products → activer "Share on LinkedIn".

### Le post LinkedIn ne se publie pas mais pas d'erreur
→ Vérifier que `author` contient bien un URN valide (`urn:li:person:XXXXX`).
→ Tester avec le node HTTP Profile URN pour confirmer l'URN.

### Erreur 190 Facebook "Invalid OAuth access token"
→ Le Page Access Token a expiré ou a été révoqué.
→ Renouveler en refaisant les étapes 3.2 → 3.3 → 3.4 et mettre à jour la variable `FACEBOOK_PAGE_ACCESS_TOKEN`.

### Erreur 200 Facebook "Permissions error"
→ Le token ne possède pas le scope `pages_manage_posts`.
→ Refaire l'étape 3.2 en cochant bien `pages_manage_posts`.

### Erreur 100 Facebook "Invalid parameter"
→ La variable `FACEBOOK_PAGE_ID` contient une valeur incorrecte.
→ Utiliser le node **HTTP Facebook Get Pages** pour retrouver l'ID exact de votre page.

### Le Merge node ne se déclenche pas
→ Le Merge de type "Merge By Position" attend un item sur chaque entrée (index 0 = LinkedIn, index 1 = Facebook).
→ Si l'une des deux branches échoue totalement (exception non catchée), le Merge bloquera.
→ Solution : activer `continueOnFail` sur les deux nodes HTTP (LinkedIn + Facebook) pour que le Merge reçoive toujours 2 items même en cas d'erreur partielle.

### facebook_post_id vide dans le Sheet
→ La publication a eu lieu mais l'ID n'a pas été récupéré. Vérifier dans l'exécution n8n la réponse brute du node HTTP Facebook Publier Post. L'ID est dans `response.body.id`.

### Posts "carousel" (Post 2)
Le Post 2 est de type `carousel` dans le Sheet. Ni l'API LinkedIn UGC Posts ni l'API Facebook Graph ne gèrent nativement les carrousels texte de la même façon. Recommandation : mettre POST_002 en `skip` dans le Sheet et créer ce post manuellement via les outils natifs LinkedIn et Facebook.

---

## Renouvellement du Page Access Token Facebook

Bien que les Page Access Tokens soient théoriquement permanents, un renouvellement préventif est recommandé tous les 6 mois :

1. Se connecter sur https://developers.facebook.com/tools/explorer
2. Regénérer un User Access Token avec les mêmes scopes (étape 3.2)
3. Convertir en Long-Lived Token (étape 3.3)
4. Obtenir le nouveau Page Access Token (étape 3.4)
5. Mettre à jour la variable `FACEBOOK_PAGE_ACCESS_TOKEN` dans n8n (Settings → Variables)
6. Tester une publication manuelle pour valider
