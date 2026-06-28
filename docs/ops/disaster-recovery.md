# Plan de reprise d'activité (DR) — PsyLib

**Date :** 2026-06-28 · **Périmètre :** prod AZNetwork (`psylib-papp01`, `185.74.10.169`).
**Réf. :** audit 360° 2026-06-24 (risque #2 « SPOF infra + restauration jamais testée »).

> **Mise à jour de l'audit :** la restauration **EST** testée — automatiquement, chaque
> semaine, et elle **passe**. L'item « restauration jamais testée » est **obsolète**.
> Le vrai risque résiduel est documenté en §4 (perte totale du VPS) et §5 (gap clés).

---

## 1. Posture de sauvegarde actuelle (vérifiée le 2026-06-28)

| Élément | État |
|---|---|
| Backup PostgreSQL | **Quotidien 02:00**, double format (`.dump` custom + `.sql.gz`), contrôle de taille |
| Backup Keycloak DB | **Quotidien 03:00** (`.sql.gz`) |
| Rétention | **30 j local** (`/opt/psyscale-backups/`) + **90 j offsite** (OVH Object Storage) |
| Offsite (cross-cloud) | **Sync OVH Object Storage** via rclone — vérifié OK (28/06) |
| **Test de restauration** | **Cron hebdo dim. 04:00** (`restore-postgres.sh --verify`) → restaure le dernier dump dans un conteneur jetable + vérifie 5 tables critiques. **Dernier passage : 28/06/2026, SUCCESS** (users 37, psychologists 29, patients 28, sessions 14, audit_logs 3458). |
| Monitoring | healthchecks.io (ping succès/échec sur chaque backup) |
| Crons | `crontab -l` root : backup PG, backup KC, verify, docker-prune — tous installés |

**RPO (perte de données max)** : **≤ 24 h** (backup quotidien).
**RTO restauration DB** (données) : **~8 s** mesuré (28/06 : 04:00:01 → 04:00:09 — base jeune/petite).

> Scripts (source de vérité) : `scripts/backup-postgres.sh`, `scripts/backup-keycloak-db.sh`,
> `scripts/restore-postgres.sh`, `scripts/sync-backups-to-ovh.sh`, `scripts/install-backup-cron.sh`.

---

## 2. Restaurer la DB (cas courant : corruption / mauvaise migration / erreur humaine)

Le serveur est vivant, on veut revenir à un état antérieur.

```bash
# Lister les dumps disponibles
ls -lat /opt/psyscale-backups/psyscale-*.dump

# Restaurer un dump précis vers la DB de prod (demande confirmation 'RESTORE')
/opt/psyscale-api/scripts/restore-postgres.sh /opt/psyscale-backups/psyscale-AAAA-MM-JJ_HHMMSS.dump
```

Tester l'intégrité d'un backup sans toucher la prod (ce que fait le cron hebdo) :
```bash
/opt/psyscale-api/scripts/restore-postgres.sh --verify
```

---

## 3. Récupérer un backup depuis l'offsite OVH (si le local est perdu)

```bash
# Config rclone par variables d'env (cf. scripts/ovh-backup.env)
rclone copy ovh_psyscale:psyscale-backups-prod/ /opt/psyscale-backups/ \
  --include "psyscale-*.dump" --s3-no-check-bucket
```

---

## 4. Reprise après perte TOTALE du VPS (le vrai scénario SPOF)

Le serveur unique est mort (panne matérielle, incident AZNetwork). Les **données sont
saines** (offsite OVH), mais **le service est down** le temps de reconstruire. Procédure :

1. **Provisionner un VPS neuf** (AZNetwork, même offre HDS, Debian 13). Noter son IP.
2. **Installer le socle** : Docker + Docker Compose, `rclone`, `sops`, `age`, `certbot`.
3. **Récupérer le code** : `git clone` du repo (compose, scripts, build-ctx, deploy.sh).
   Arborescence cible : `/opt/psyscale-api`, `/opt/psyscale-keycloak`, `/opt/livekit`…
   (cf. `docker/api-prod/`, `docker/keycloak-prod/`, `docker/livekit/`).
4. **Restaurer les secrets** (cf. §5 — DOIVENT venir d'une copie hors-VPS) :
   - poser `age.key` + `secrets.enc.env` dans `/opt/psyscale-api/`
   - poser `scripts/ovh-backup.env` (creds OVH S3)
   - `./docker/api-prod/render-secrets.sh` → régénère `/opt/psyscale-api/.env`
5. **Rapatrier les backups** depuis l'offsite OVH (§3).
6. **Restaurer les DB** : PostgreSQL applicatif (§2) + Keycloak DB.
7. **Démarrer la stack** : `docker compose up -d` (api+pg+redis, keycloak, livekit).
8. **TLS** : réémettre les certs via `certbot --nginx` (auth/api/video.psylib.eu).
9. **DNS** : repointer les A-records `psylib.eu` (et sous-domaines) vers la nouvelle IP
   (Manager OVH → zone DNS). ⚠️ propagation TTL.
10. **Smoke-test** : `curl https://api.psylib.eu/api/v1/health`, login psy + MFA, visio.

**RTO total estimé (non chronométré)** : **~2–4 h** (provisioning + DNS propagation =
les postes les plus longs). À chronométrer lors d'un exercice DR réel pour fiabiliser.

---

## 5. ⚠️ GAP CRITIQUE — artefacts de récupération à mettre HORS-VPS

La reprise §4 est **impossible** si ces fichiers ne vivent QUE sur le VPS (cas actuel) :

| Artefact | Rôle en DR | État | Action |
|---|---|---|---|
| `age.key` | Déchiffre `secrets.enc.env` | ✅ dans le gestionnaire de mots de passe (à **re-confirmer**) | Confirmer présence |
| `secrets.enc.env` | **Tous** les secrets app, dont **`ENCRYPTION_KEY`** (déchiffrement des données patients) | ⚠️ **uniquement sur le VPS** (non committé) | **Copier hors-VPS** (chiffré → sans risque) |
| `scripts/ovh-backup.env` | Creds OVH S3 pour **atteindre les backups offsite** | ⚠️ **uniquement sur le VPS** (gitignoré) | **Copier hors-VPS** (ou régénérer depuis la console OVH) |

> **Sans ces deux fichiers hors-VPS, une perte totale du serveur = backups offsite
> inaccessibles ET données patients indéchiffrables, malgré des sauvegardes par ailleurs
> excellentes.** C'est la priorité DR n°1, et elle est **gratuite**.

**Procédure sécurisée (le `secrets.enc.env` est chiffré → affichable sans risque ;
PAS `age.key` ni `ovh-backup.env` en clair dans une session bastion enregistrée) :**
- `secrets.enc.env` : `cat /opt/psyscale-api/secrets.enc.env` → copier dans le gestionnaire de mots de passe.
- `age.key` : déjà censé y être → **confirmer**, ne pas réafficher.
- `ovh-backup.env` : récupérer les creds S3 depuis la **console OVH** (utilisateur S3) et les ranger dans le gestionnaire — éviter de les `cat` dans une session enregistrée.

**Amélioration future (optionnelle) :** synchroniser aussi `secrets.enc.env` vers
l'offsite OVH dans le backup quotidien (il est chiffré → sûr ; récupérable avec
`age.key`). Non fait pour l'instant afin de ne pas modifier le script de backup
critique en prod — la **copie manuelle hors-VPS ci-dessus suffit** à fermer le gap.

---

## 6. Décision SPOF — faut-il payer pour de la redondance ? (dossier)

Le SPOF « serveur unique » subsiste : sa chute = **interruption de service** (pas perte
de données, cf. ci-dessus) le temps de la reprise §4.

| Option | Effet | Coût récurrent | Reco |
|---|---|---|---|
| **Statu quo + gap §5 fermé** | Données saines & récupérables ; service down ~2–4 h sur sinistre total | **0 €** | ✅ **Maintenant** |
| PostgreSQL managé HDS | DB séparée, répliquée/sauvegardée par l'hébergeur | ~+50–150 €/mois (à confirmer AZNetwork) | Quand MRR le justifie |
| 2ᵉ VPS standby (réplication) | Bascule rapide si le primaire tombe (RTO ↓ à minutes) | ~+187 €/mois HT (≈ doublement) | Plus tard / SLA client |

**Recommandation :** pour une micro-entreprise bootstrappée, **ne pas payer maintenant**.
Le risque de **perte de données** est traité (backups offsite testés + gap §5 fermé). Le
risque d'**interruption** (quelques heures sur sinistre total, rare) est acceptable à ce
stade. Réévaluer la redondance payante à ~15–20 k€ MRR ou si un client exige un SLA.

---

## 7. Exercice DR recommandé (gratuit, à planifier)

Une fois le gap §5 fermé : faire **un exercice de reprise réel** sur un VPS jetable
(provisionner → restaurer secrets + DB depuis l'offsite → démarrer → smoke-test) pour
**chronométrer le RTO total** et fiabiliser le §4. ~½ journée, zéro coût récurrent.
