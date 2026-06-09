# Migration HDS — VPS (non conforme) → OVH Public Cloud HDS

**Créé :** 2026-06-09
**Motif :** la gamme VPS OVHcloud **n'est pas certifiée HDS et ne peut pas l'être** (confirmé par OVH). PsyLib héberge aujourd'hui des données de santé réelles sur infra non conforme (art. L.1111-8 CSP). Migration **urgente** vers un produit OVH éligible HDS.
**Décision (Tony, 2026-06-09) :** migrer d'abord, déployer les correctifs site après (les claims HDS redeviennent vrais une fois migré).

**⚠️ Orientation révisée (2026-06-09) :** OVH Public Cloud DIY **écarté** — le support Business obligatoire (min 250 €/mois) le rend cher ET l'activité 5 resterait non couverte. **Cible privilégiée : hébergeur HDS clé en main** (PaaS HDS type Clever Cloud, ou VM HDS infogérée type GPLExpert/AZNETWORK/InterHop — Docker tel quel, LiveKit inclus, activité 5 portée par l'hébergeur). Devis en cours via `demande-devis-hds.md`. Les étapes techniques ci-dessous (dump/restore, cutover DNS) restent valables quelle que soit la cible.

---

## État actuel (VPS `vps-37348db5` / `51.178.31.68`)

6 vCPU / 11 Go RAM / 96 Go disque (11 Go utilisés). Volumes de données ≈ **300 Mo total** → migration data légère.

Stacks dans `/opt/` :
| Stack | Containers | Données santé | Migrer vers HDS |
|---|---|---|---|
| `psyscale-api` | api (NestJS), postgres (DB principale), redis | OUI | ✅ |
| `psyscale-keycloak` | keycloak, keycloak-db (postgres) | identités/auth | ✅ |
| `livekit` | livekit-server, redis-livekit | flux visio (non enregistrés) | ✅ |
| `n8n` | n8n, n8n-db | marketing only, **pas de patients** | ✅ migré aussi (pour fermer le VPS) |

Stockage fichiers : **OVH Object Storage** bucket `psylib-documents` (région GRA) — séparé du VPS. À recréer/déplacer dans le projet Public Cloud HDS.

DNS à basculer au cutover : `api.psylib.eu` (A → nouvelle IP), `auth.psylib.eu` (AAAA/A → nouvelle instance), `n8n.psylib.eu`, hostname LiveKit/visio. Reste : `psylib.eu` (Vercel, inchangé). **On migre TOUT (n8n inclus) puis on ferme le VPS.**

---

## ÉTAPE 0 — Provisioning (TONY, manager OVH — bloquant, seul Tony peut signer)

1. **Public Cloud → créer/choisir un projet**, puis activer l'**option HDS** sur le projet → **signature du contrat/avenant HDS** dans le manager (engagement contractuel : c'est CE qui rend la certif HDS opposable pour PsyLib).
2. **Région HDS : GRA** (Gravelines) — cohérent avec l'Object Storage actuel.
3. **Provisionner une instance** (Ubuntu 24.04) : ~**8–16 Go RAM / 4 vCPU** suffit (charge actuelle 4,5 Go). Gamme General Purpose (ex. `b3-8` ou `b3-16`).
4. **Créer un bucket Object Storage** dans ce projet PCI HDS (région GRA) pour les fichiers patients.
5. Communiquer : **IP publique de l'instance** + clé SSH d'accès.

> ⚠️ Coût : l'option HDS Public Cloud + l'instance + l'Object Storage HDS ont un surcoût mensuel. Non négociable légalement.

---

## ÉTAPE 1 — Mise en place infra (technique, sur la nouvelle instance)

1. Installer Docker + compose.
2. Copier les 4 stacks `/opt/{psyscale-api,psyscale-keycloak,livekit,n8n}` + tous les `.env` (secrets : `ENCRYPTION_KEY`, OpenRouter, Stripe, Resend, Keycloak client secrets, creds S3, n8n…).
3. Rebuild image `psyscale-api:latest` sur la nouvelle instance (cf. procédure `cicd-infra` / MEMORY).

## ÉTAPE 2 — Migration des données (fenêtre de maintenance courte)

1. Stop écritures (mettre l'API en maintenance).
2. `pg_dump` des 2 bases (psyscale-api postgres + keycloak-db) sur le VPS → restore sur la nouvelle instance.
3. Migrer les objets `psylib-documents` → bucket HDS (rclone/swift, OVH→OVH même région).
4. Redis : volumes non critiques (cache/queues) — repartir à vide.

## ÉTAPE 3 — Bascule (cutover)

1. Vérifier la nouvelle stack (login psy, MFA Keycloak, lecture patient, déchiffrement note, visio, paiement test).
2. Repointer DNS : `api.psylib.eu` → nouvelle IP, `auth.psylib.eu` → nouvelle instance, hostname LiveKit. (TTL court avant J-1.)
3. Certificats TLS (Let's Encrypt) sur la nouvelle instance.
4. Surveiller 24–48 h, VPS gardé en rollback.

## ÉTAPE 4 — Finalisation

1. **Purger les données de santé du VPS non-HDS** (volumes postgres + Object Storage si déplacé) une fois la bascule validée + fenêtre de rollback écoulée.
2. **Fermer / résilier le VPS entièrement** (tout a migré, n8n inclus).
3. **Déployer les correctifs site** (claims HDS désormais vrais) : `npx vercel --prod --yes`.
4. Répondre à Gonzalo (on est alors réellement sur infra HDS).
5. Mettre à jour `DPA-sous-traitants.md` + `CLAUDE.md` avec le produit exact (Public Cloud HDS) et le n° de projet.

---

## Point de fond NON résolu par la migration : activité 5

La migration règle les activités 1-4 + 6 (infra HDS OVH). L'**activité 5** (administration et exploitation du SI) reste assurée par PsyLib → couverture à organiser (certif propre ou infogérance HDS). Voir [[hds-compliance-status]].
