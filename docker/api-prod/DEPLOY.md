# Déploiement de l'API PsyScale (VPS AZNetwork)

Runbook du déploiement backend. Réduit le risque **bus-factor 1** : la procédure
manuelle (transfert → build → recreate → smoke-test → rollback) est codifiée dans
deux scripts.

- `prepare-deploy.sh` (local) — fabrique le tarball build-ctx + l'héberge.
- `deploy.sh` (VPS, `/opt/psyscale-api/deploy.sh`) — déploie en **une commande**,
  avec **rollback automatique** si le health échoue.

> ⚠️ Le frontend (Next.js) se déploie séparément sur Vercel
> (`npx vercel --prod --yes`). Ce runbook ne concerne que l'**API NestJS**.

---

## Architecture du déploiement (pourquoi c'est ainsi)

- Le VPS **ne déploie pas depuis git** : il reconstruit une image Docker locale
  `psyscale-api:latest` à partir de `/opt/psyscale-api/build-ctx/`.
- Le `build-ctx` est **partiel** : `apps/` n'y contient que `api` (pas web/mobile).
- Le `Dockerfile` fait `pnpm install --frozen-lockfile` → le **lockfile racine**
  doit être présent et cohérent. La lockfile complète du monorepo est tolérée
  avec ce workspace partiel (confirmé en prod).
- Conséquence : tout déploiement qui **change des dépendances** doit transférer
  `pnpm-lock.yaml` + le `package.json` concerné, pas seulement du source. Les deux
  scripts s'en chargent automatiquement (le tarball contient tout le build-ctx).
- Accès VPS = **VPN + bastion Wallix** (interactif). On ne peut donc pas
  automatiser entièrement en CI → ces scripts sont le bon niveau d'automatisation.

---

## Accès au VPS

1. VPN actif.
2. `ssh tony.ruppel.psylib@172.18.39.115` → choisir la cible **`1`** (wallixbst) → root.
3. Le prompt devient `[root@psylib-papp01:~]#`.

> ⚠️ Le bastion **ne colle pas correctement les longues lignes** (bracketed-paste
> cassé). Toujours des commandes **courtes, une par une**. C'est pourquoi le
> transfert de fichiers passe par un tarball + `curl` (commande courte), jamais
> par un copier-coller de contenu.

---

## Bootstrap (à faire UNE seule fois)

Place `deploy.sh` à demeure sur le VPS. Comme `docker/` est exclu de Vercel, on
le publie temporairement via `public/` :

```bash
# Local (racine du repo) :
cp docker/api-prod/deploy.sh apps/web/public/_deploy-bootstrap.sh
npx vercel --prod --yes

# VPS :
curl -fsS https://psylib.eu/_deploy-bootstrap.sh -o /opt/psyscale-api/deploy.sh
chmod +x /opt/psyscale-api/deploy.sh

# Local — retirer l'exposition :
rm apps/web/public/_deploy-bootstrap.sh
npx vercel --prod --yes
```

Ensuite, `deploy.sh` est aussi inclus dans chaque tarball build-ctx → il se
retrouve dans `build-ctx/docker/api-prod/deploy.sh` et reste versionné.
Pour le mettre à jour : `cp build-ctx/docker/api-prod/deploy.sh /opt/psyscale-api/deploy.sh`.

---

## Déploiement normal (sans migration)

```bash
# 1) LOCAL — fabriquer + publier le tarball
bash docker/api-prod/prepare-deploy.sh     # imprime l'URL + le md5
npx vercel --prod --yes

# 2) VPS — déployer (URL + md5 imprimés à l'étape 1)
/opt/psyscale-api/deploy.sh https://psylib.eu/_apideploy-AAAAMMJJ-xxxxxx.tgz <md5>

# 3) LOCAL — nettoyer l'exposition publique
rm apps/web/public/_apideploy-*.tgz
npx vercel --prod --yes
```

`deploy.sh` enchaîne : vérif md5 → backup build-ctx + capture image courante →
extraction → `docker build` → recreate → smoke-test health. **Si le health
échoue, rollback automatique** vers l'image précédente.

### Vérification externe
```bash
curl -s https://api.psylib.eu/api/v1/health   # attendu : {"status":"ok",...}
```

---

## Déploiement avec migration Prisma

Ajouter `--migrate` (lance `prisma migrate deploy` avant le recreate) :

```bash
/opt/psyscale-api/deploy.sh https://psylib.eu/<tarball> <md5> --migrate
```

> La migration tourne dans un conteneur jetable de l'image fraîchement buildée.
> Vérifier dans la sortie : `All migrations have been successfully applied` (ou
> « No pending migrations »). En cas d'échec migration, **ne pas** recreate :
> investiguer d'abord (la migration peut être partielle).

---

## Rollback

`deploy.sh` roule back tout seul si le health post-bascule échoue. Rollback
**manuel** (ex. régression fonctionnelle détectée après coup) :

```bash
# Image précédente (notée par le dernier deploy) :
cat /opt/psyscale-api/.rollback-image
docker tag <id-image> psyscale-api:latest
cd /opt/psyscale-api && docker compose up -d --force-recreate api
```

Si l'image précédente a été pruned (cron hebdo `docker-prune`), reconstruire
depuis le backup build-ctx :

```bash
ls -t /opt/psyscale-api/build-ctx.bak-*.tgz | head   # le plus récent AVANT le deploy fautif
tar -xzf /opt/psyscale-api/build-ctx.bak-AAAAMMJJ-HHMMSS.tgz -C /opt/psyscale-api/build-ctx/
docker build -t psyscale-api:latest /opt/psyscale-api/build-ctx
cd /opt/psyscale-api && docker compose up -d --force-recreate api
```

---

## Diagnostic

```bash
docker compose -f /opt/psyscale-api/docker-compose.yml logs --tail=80 api
docker compose ps
df -h /                     # besoin ~2-3 Go libres pour un build
docker images | grep psyscale-api
```

## Hygiène (sans urgence)
- Nettoyer les vieux backups : `rm /opt/psyscale-api/build-ctx.bak-*.tgz` (garder le dernier).
- Le cron hebdo `docker-prune` retire les images dangling (anciennes versions).
