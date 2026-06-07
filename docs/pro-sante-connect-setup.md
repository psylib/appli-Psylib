# Pro Santé Connect (e-CPS) — Marche à suivre pour activer la vérification forte

Pro Santé Connect (PSC) est le fournisseur d'identité **OIDC officiel de l'ANS**.
Un psychologue s'authentifie avec son app **e-CPS** (ou carte CPS), et PSC nous
renvoie son **numéro RPPS lié cryptographiquement à son identité réelle**
(vérifiée au RNIPP, niveau eIDAS substantiel). Impossible à usurper : c'est la
voie « reine » utilisée par Doctolib.

L'intégration côté code est **déjà faite et déployée**, mais **désactivée** tant
que les identifiants OIDC de l'ANS ne sont pas renseignés. Voici les étapes pour
l'activer.

---

## 1. Demander l'habilitation à l'ANS (Tony)

1. Créer/се connecter sur l'espace industriels de l'ANS :
   **https://industriels.esante.gouv.fr**
2. Déposer une demande d'accès à **Pro Santé Connect** (commencer par le **bac à
   sable / BAS**, puis la **production**).
3. Renseigner lors de la demande :
   - **Nom du service** : PsyLib
   - **Type de flux** : OpenID Connect — Authorization Code Flow
   - **redirect_uri (callback)** :
     - Bac à sable / prod : `https://api.psylib.eu/api/v1/auth/psc/callback`
   - **Scopes** : `openid scope_all`
   - **acr_values** : `eidas1`
4. L'ANS fournit en retour : un **`client_id`** et un **`client_secret`**
   (un jeu pour le bac à sable, un autre pour la prod).

> 📄 Réf. : https://esante.gouv.fr/produits-services/pro-sante-connect
> Guide technique OIDC : https://esante.gouv.fr/ens/offre/pro-sante-connect/documentation-technique

---

## 2. Renseigner les variables d'environnement (VPS)

Dans `/opt/psyscale-api/.env` (puis `docker compose restart api`) :

```env
PSC_ENABLED=true
PSC_ENV=sandbox                 # puis "production" une fois validé
PSC_CLIENT_ID=<fourni par l'ANS>
PSC_CLIENT_SECRET=<fourni par l'ANS>
PSC_REDIRECT_URI=https://api.psylib.eu/api/v1/auth/psc/callback
```

Tant que `PSC_ENABLED` n'est pas `true` (ou que client_id/secret sont vides),
l'endpoint `/auth/psc/status` renvoie `{ enabled: false }` et le bouton
« Vérifier avec Pro Santé Connect » reste **masqué** côté front.

---

## 3. Tester en bac à sable

L'ANS fournit des **cartes/identités de test** (e-CPS de démonstration) pour le
BAS. Parcours :

1. Psy connecté → **Paramètres** → carte « Vérification d'identité (Pro Santé
   Connect) » → bouton **Vérifier avec Pro Santé Connect**.
2. Redirection vers PSC → authentification e-CPS de test.
3. Retour sur `/dashboard/settings?psc=success` → le compte passe `verified`,
   le profil public est activé, et le `adeliNumber` adopte le RPPS prouvé.

Cas de retour gérés (`?psc=`):
- `success` — vérifié.
- `not_psychologist` — le compte PSC n'est pas un psychologue.
- `mismatch` / `error` — échec, revue manuelle possible via `/dashboard/admin/verifications`.

---

## 4. Passage en production

1. Refaire la demande pour l'environnement **production** (nouveau client_id/secret).
2. Mettre `PSC_ENV=production` + les identifiants prod dans `.env`, restart API.

---

## Détails techniques (déjà implémentés)

| Élément | Valeur |
|---|---|
| Service backend | `apps/api/src/auth/pro-sante-connect.service.ts` |
| Routes | `GET /auth/psc/status`, `GET /auth/psc/start` (psy), `GET /auth/psc/callback` (public) |
| Front | `apps/web/src/components/settings/psc-verify-card.tsx` |
| Authorize (BAS) | `https://wallet.bas.psc.esante.gouv.fr/auth` |
| Token (BAS) | `https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/token` |
| UserInfo (BAS) | `https://auth.bas.psc.esante.gouv.fr/auth/realms/esante-wallet/protocol/openid-connect/userinfo` |
| Authorize (PROD) | `https://wallet.esw.esante.gouv.fr/auth` |
| Claim RPPS | `SubjectNameID` (préfixe `8` → retiré ; ne PAS utiliser `sub`) |
| Claim profession | `SubjectRole` (`code^OID` ; psychologue = `93`) |

> ⚠️ Garder la vérification annuaire + validation manuelle (Palier 1) en
> fallback : **tous les psychologues n'ont pas encore d'e-CPS** (migration
> ADELI→RPPS+ en cours). PSC est un accélérateur, pas un prérequis obligatoire.
