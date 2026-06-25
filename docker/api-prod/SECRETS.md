# Gestion des secrets de l'API — SOPS + age

Les secrets de l'API (`/opt/psyscale-api/.env` : `ENCRYPTION_KEY`, Keycloak, Stripe, S3…)
sont **chiffrés au repos** avec [SOPS](https://github.com/getsops/sops) + [age].
La source de vérité est le fichier chiffré `secrets.enc.env` ; le `.env` en clair est
un artefact **dérivé** (rendu à la demande, root-only `600`).

## Modèle de sécurité (ce que ça protège / ne protège pas)

- ✅ Secrets **chiffrés au repos** (fichier `secrets.enc.env` illisible sans la clé).
- ✅ **Versionnables** (le fichier chiffré peut être commité → récupération/historique).
- ✅ **Clé maître séparée** : la clé privée age vit en `/opt/psyscale-api/age.key` (root `600`)
  ET dans le gestionnaire de mots de passe de Tony (copie hors-serveur).
- ⚠️ Install **mono-VPS** : au runtime le conteneur a besoin des valeurs en clair, et la clé
  de déchiffrement est sur le serveur → une compromission **root du serveur live** reste
  game over. Le gain est la **défense en profondeur** (fuite de fichier/backup, perte du
  serveur, secret jamais en clair dans git). Pour aller plus loin il faudrait un KMS externe
  (payant / service en plus) — hors périmètre choisi.

## Fichiers

| Fichier | Rôle | Au repos |
|---|---|---|
| `secrets.enc.env` | Secrets **chiffrés** (source de vérité) | `/opt/psyscale-api/` (+ git possible) |
| `age.key` | Clé privée age (déchiffrement) | `/opt/psyscale-api/`, **root `600`**, jamais commitée |
| `.env` | Secrets en clair, **dérivés** (compose `env_file`) | `/opt/psyscale-api/`, root `600` |
| `render-secrets.sh` | Rend `.env` depuis `secrets.enc.env` | repo `docker/api-prod/` |

## Installation initiale (sur le VPS, une seule fois)

> ⚠️ Réalisée par Tony (manipule les vraies valeurs). Commandes single-line (bastion).

```bash
# 1. Outils (Debian 13)
apt-get install -y age
curl -fsSL https://github.com/getsops/sops/releases/download/v3.13.1/sops-v3.13.1.linux.amd64 -o /usr/local/bin/sops && chmod +x /usr/local/bin/sops

# 2. Générer la clé age (root-only) + afficher la clé publique
age-keygen -o /opt/psyscale-api/age.key && chmod 600 /opt/psyscale-api/age.key
age-keygen -y /opt/psyscale-api/age.key        # => age1... (clé PUBLIQUE, non secrète)
#   -> SAUVEGARDER le CONTENU de age.key dans le gestionnaire de mots de passe (copie hors-serveur)

# 3. Chiffrer le .env existant
sops -e --age "$(age-keygen -y /opt/psyscale-api/age.key)" --input-type dotenv --output-type dotenv /opt/psyscale-api/.env > /opt/psyscale-api/secrets.enc.env

# 4. Vérifier que le déchiffré == l'original (sans afficher les valeurs)
SOPS_AGE_KEY_FILE=/opt/psyscale-api/age.key sops -d --input-type dotenv --output-type dotenv /opt/psyscale-api/secrets.enc.env | diff - /opt/psyscale-api/.env && echo MATCH
```

## Rituel de déploiement

Avant **tout** `docker compose up`, (re)générer le `.env` depuis la source chiffrée :

```bash
cd /opt/psyscale-api && ./render-secrets.sh && docker compose up -d --force-recreate api
```

`render-secrets.sh` ne révèle aucune valeur ; il écrit `.env` en `600`. Le conteneur en cours
garde son env à travers un reboot (`restart: unless-stopped`) — seul un nouveau `up` a besoin du `.env`.

## Modifier un secret

```bash
SOPS_AGE_KEY_FILE=/opt/psyscale-api/age.key sops /opt/psyscale-api/secrets.enc.env   # édite en clair, re-chiffre à la sauvegarde
cd /opt/psyscale-api && ./render-secrets.sh && docker compose up -d --force-recreate api
```

## Rotation de la clé age

`age-keygen` nouvelle clé → `sops updatekeys secrets.enc.env` (avec ancienne+nouvelle dans `.sops.yaml`)
→ retirer l'ancienne. Garder l'ancienne clé tant que d'anciens backups chiffrés existent.

## Récupération (perte du VPS)

Avec la clé privée age (gestionnaire de mots de passe) + `secrets.enc.env` (git/backup) :
`SOPS_AGE_KEY_FILE=age.key sops -d secrets.enc.env > .env`. Sans la clé age, les secrets sont
irrécupérables → **ne jamais perdre la clé age**.

## Durcissement optionnel (niveau 2, plus tard)

Pour ne PAS laisser `.env` en clair au repos entre deux déploiements : rendre `.env` sur un
**tmpfs** (RAM) ou `shred -u .env` après `docker compose up`. À encadrer par un wrapper
unique (sinon un `docker compose up` sans `.env` échoue = risque bus-factor).
