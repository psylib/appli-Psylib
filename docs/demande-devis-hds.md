# Demande de devis — Hébergement HDS pour PsyLib

> À envoyer à : Clever Cloud, GPLExpert, AZNETWORK, InterHop (et tout autre hébergeur/infogérant certifié HDS).
> Préparé le 2026-06-09. **Ne pas envoyer sans validation de Tony.**

---

**Objet : Demande de devis — hébergement HDS d'une application SaaS (psychologie libérale)**

Bonjour,

Je suis éditeur de **PsyLib** (psylib.eu), un logiciel SaaS de gestion de cabinet pour psychologues libéraux (micro-entreprise, France). L'application traite des **données de santé** (notes de séance, dossiers patients) et doit donc être hébergée sur une infrastructure **certifiée HDS**. Je migre depuis un VPS OVH (non éligible HDS) et cherche un hébergeur/infogérant HDS clé en main.

**Volume actuel :** ~6 cabinets utilisateurs, ~300 Mo de données, en croissance. Charge faible (≈4,5 Go RAM utilisés).

### Architecture à héberger (Docker)

| Composant | Détail | Sensibilité |
|---|---|---|
| API applicative | NestJS (Node 20), conteneur Docker | traite les données de santé |
| Base de données principale | PostgreSQL 16 | **données de santé** (champs chiffrés AES-256-GCM) |
| Cache / files d'attente | Redis 7 | transitoire |
| Authentification | Keycloak 24 + sa base PostgreSQL | identités/auth (MFA TOTP) |
| Visioconférence | **LiveKit** (WebRTC, SFU, ports UDP) — flux temps réel **non enregistrés** | flux de santé en transit |
| Stockage fichiers | Bucket S3-compatible (documents patients) | **données de santé** |
| Automation (optionnel) | n8n (marketing, **aucune donnée patient**) | non sensible |

### Questions

1. **Périmètre de votre certification HDS** : couvrez-vous les **6 activités**, en particulier l'**activité 5** (administration et exploitation du SI) ? Le certificat couvre-t-il le compute **et** le stockage objet ?
2. Pouvez-vous héberger notre stack **Docker / Docker Compose telle quelle** (self-managed sur VM/serveur infogéré), ou faut-il adapter à une plateforme spécifique ?
3. **LiveKit / WebRTC** : supportez-vous un service de visioconférence temps réel (ports UDP, IP publique dédiée, SFU) ? Ces flux ne sont pas enregistrés.
4. Proposez-vous un **stockage objet S3-compatible** dans le périmètre HDS pour les fichiers patients ?
5. **Modèle contractuel** : fournissez-vous le contrat HDS + un **DPA (art. 28 RGPD)** ? Quelle est la répartition de responsabilités (qui porte quelles activités HDS) ?
6. **Sauvegardes** (activité 6) : incluses ? Localisation France ?
7. **Prix mensuel** pour cette configuration (avec/sans engagement) + frais de mise en service + **accompagnement à la migration**.

Merci d'avance. Je reste disponible pour un échange.

Bien à vous,
Tony Ruppel — PsyLib
tony@psylib.eu
