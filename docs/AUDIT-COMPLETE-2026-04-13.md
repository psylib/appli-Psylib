# AUDIT COMPLÈTE PSYLIB — AVRIL 2026

*Perspective : VP Product chez un FAANG. Pas de complaisance.*

---

## I. ÉTAT DU PROJET — OÙ ON EN EST

| Métrique | Valeur |
|---|---|
| **Backend** | 185 fichiers TS, 44 services, 33 controllers |
| **Frontend** | 366 fichiers TS/TSX |
| **DB** | 23 tables, 1029 lignes de schema Prisma |
| **Tests unitaires** | 24 fichiers (13% de couverture estimée) |
| **Tests E2E** | 15 specs Playwright |
| **Tests frontend** | **0** |
| **Tech debt markers** | 80 (API) + 13 (Web) = **93 `as any` / TODO / HACK** |
| **Phases complétées** | Phase 1-4 ✅ |
| **Revenus** | 0€ MRR (pré-launch) |

**Verdict global : Le produit est techniquement fonctionnel mais PAS market-ready.**

---

## II. ANALYSE CONCURRENTIELLE MONDIALE

### A. FRANCE — Ton champ de bataille

| Concurrent | Prix/mois | Users estimés | Points forts | Faiblesse |
|---|---|---|---|---|
| **Doctolib** | 139€ | 350K+ praticiens | Monopole RDV France, SEO imbattable, base patients massive | Pas de notes cliniques, pas d'IA, cher pour les psys |
| **Docorga** | **Gratuit** → 25€ | 1 500 psys | Gratuit, spécialisé psys, RGPD, bons avis (4.8/5) | Pas d'IA, pas de visio, pas de formations |
| **Terapiz** | 40€ | ~500 | RDV en ligne, SMS, visio, multi-cabinet | UX datée, pas d'IA |
| **RVPsy** | Gratuit → ~20€ | ~300 | 100% psy, compta, visio | Petit, pas d'IA |
| **Scriboupsy** | Gratuit → ~15€ | ~200 | Écrits psychologiques, simulateur charges | Niche, pas de gestion cabinet complète |
| **MaGestionPsy** | ~20€ | ~400 | Agenda, compta, facturation | Pas d'IA, UX basique |
| **Medica-psy** | ~30€ | ~200 | Tout-en-un psys | Design médiocre |

**Réalité brutale France :** Docorga est ton vrai concurrent direct et il est **GRATUIT**. 1500 psys, 4.8/5, RGPD compliant. Tu dois offrir une valeur 10x supérieure pour justifier 43-69€/mois.

### B. AMÉRIQUE DU NORD — Les mastodontes

| Concurrent | Prix/mois | Users estimés | Killer feature |
|---|---|---|---|
| **SimplePractice** | $49-$99 | **250 000+** praticiens | All-in-one leader, AI Note Taker, insurance billing |
| **TherapyNotes** | $69 | 100K+ | Documentation clinique structurée, TherapyFuel AI ($40/mo addon) |
| **Jane App** | $54-$79 | 80K+ | UX premium (meilleur design du marché), AI Scribe |
| **Carepatron** | $0-$39 | 50K+ | **Freemium agressif**, global, telehealth |
| **Alma** | $125 | 30K+ | Network d'assurances, credentialing |
| **Upheal** | $0-$49 | 20K+ | AI-first EHR, notes automatiques depuis audio |
| **Blueprint.ai** | ~$50 | 10K+ | Transcription temps réel + notes IA pendant la séance |

**Ce qui se passe en US que tu rates :** L'IA ne se limite plus aux résumés de notes textuelles. SimplePractice, Jane, Blueprint, Upheal **transcrivent les séances en temps réel** (audio → notes structurées automatiques). C'est LE game-changer de 2025-2026. Tu es une génération en retard sur l'IA.

### C. EUROPE

| Concurrent | Prix | Marché |
|---|---|---|
| **Power Diary / Zanda** | $9.50-$24.50 | UK/AU, multi-langue, 50K+ users |
| **Carepatron** | $0-$39 | Global, freemium, disponible en français |
| **PracticePal** | ~£30 | UK, NHS-compatible |

### D. ASIE

| Concurrent | Marché | Modèle |
|---|---|---|
| **Mind Café** | Corée → Japon | #1 mental health Corée, expansion Japon |
| **Intellect** | 100 pays, 4M+ users | B2B mental health benefits |
| **AMI** | Asie du Sud-Est | B2B employee wellness, backed by Meta |

**Le marché mondial du software santé mentale : $6.77B en 2026 → $18.38B en 2035 (CAGR 11.7%).**

---

## III. AUDIT TECHNIQUE

### Scores consolidés (3 agents d'audit)

| Domaine | Architecture | Sécurité | UX/UI | **Moyenne** |
|---|---|---|---|---|
| **Score** | 6.8/10 | 7.25/10 | 6.7/10 | **6.9/10** |

### A. CE QUI EST BIEN (à garder)

1. **Chiffrement AES-256-GCM** — Implémentation exemplaire avec versioning de clé, support legacy, rotation. Note : 9/10
2. **Multi-tenant isolation** — `psychologist_id` systématique sur toutes les queries. Solide.
3. **Architecture NestJS** — 22 modules métier bien découpés, Guards, Interceptors, DTOs avec class-validator
4. **SessionNoteEditor** — Meilleur composant du projet : autosave 30s, Ctrl+S, streaming IA opt-in, disclaimer légal, tags éditables
5. **Conformité HDS/RGPD** — audit_logs, gdpr_consents, Keycloak MFA, chiffrement transit+rest. Vrai avantage concurrentiel vs les SaaS US.
6. **Stripe webhook** — Idempotency, signature validation, rawBody parsing. Bien fait.
7. **Health checks** — PostgreSQL + Redis vérifiés
8. **Rate limiting** — ThrottlerModule global + override par endpoint
9. **Sentry** — Filtrage des données patients dans les erreurs (beforeSend supprime request.data)
10. **Helmet + HSTS + Compression** — Headers de sécurité HTTP bien configurés

### B. PROBLÈMES TECHNIQUES — PAR GRAVITÉ

#### 🔴 CRITIQUES (à fixer immédiatement)

| # | Problème | Fichier | Impact |
|---|---|---|---|
| C1 | **Pas de graceful shutdown** | `apps/api/src/main.ts` | `app.enableShutdownHooks()` absent → perte de données au redéploiement, connexions Prisma/Redis non fermées |
| C2 | **0 tests frontend** | `apps/web/` | Aucun test React. Inacceptable pour un SaaS santé. |
| C3 | **13% couverture tests API** | 24 specs / 185 fichiers | EmailService (1498L), SubscriptionService (1078L), InvoicesService (610L) = ZÉRO test |
| C4 | **Pas de timeout sur OpenRouter** | `apps/api/src/ai/ai.service.ts:409-427` | Pas d'AbortController → connexion SSE bloquée indéfiniment si l'API IA hang |
| C5 | **Logging prod trop restrictif** | `apps/api/src/main.ts:35` | Seuls `error`+`warn` en prod. `log` nécessaire pour audit trail HDS |
| C6 | **19 items sidebar sans groupement** | `apps/web/src/components/layouts/sidebar.tsx` | Surcharge cognitive massive, friction quotidienne |
| C7 | **Mobile incomplet** | 15/19 routes inaccessibles | Pas de hamburger/drawer, note editor inutilisable avec clavier virtuel |

#### 🟡 MAJEURS (à planifier)

| # | Problème | Fichier | Impact |
|---|---|---|---|
| M1 | **SubscriptionService = God class (1078L)** | `apps/api/src/billing/subscription.service.ts` | Checkout + portal + refunds + webhooks + feature gates + payments. À splitter en 4 services. |
| M2 | **EmailService = 1498 lignes** | `apps/api/src/notifications/email.service.ts` | Chaque email duplique le layout HTML (~150L × 10 types). Template engine nécessaire. |
| M3 | **AiService = 660 lignes mixed concerns** | `apps/api/src/ai/ai.service.ts` | HTTP streaming + patient history + data extraction + marketing CRUD + usage tracking |
| M4 | **Caching sous-utilisé** | `apps/api/src/common/cache.service.ts` | Redis ne cache que JWT blacklist. Pas de cache sur profil psy, subscription, patient list. 3 hits DB par requête protégée via SubscriptionGuard. |
| M5 | **CSP avec `unsafe-eval` + `unsafe-inline`** | `apps/web/next.config.mjs:50` | Annule la protection XSS. Causé par Crisp + Next.js. |
| M6 | **CORS accepte `origin: null`** | `apps/api/src/common/cors.config.ts:33-37` | Pour React Native, mais vulnérable aux sandboxed iframes. |
| M7 | **N+1 queries** | `analytics.service.ts`, `ai.service.ts` | Pas de `select`/`include` optimisés sur findMany |
| M8 | **CSV export sans limit** | `patients.service.ts:351`, `sessions.service.ts:386` | `findMany` sans pagination → memory blow-up sur gros cabinet |
| M9 | **`enableImplicitConversion: true`** | `apps/api/src/main.ts:78` | Coercion silencieuse string → boolean dans query params |
| M10 | **2 palettes contradictoires** | Landing vs App | sage/cream/terracotta vs primary/accent/warm. Rupture d'identité visuelle. |
| M11 | **Pas d'internationalisation (i18n)** | Tout le frontend | Messages hardcodés FR. Bloque expansion européenne. |
| M12 | **getPsychologist() dupliqué 10+ fois** | Tous les services | Même code copié-collé dans chaque service. Extraire dans PsychologistResolver. |
| M13 | **Indexes manquants** | schema.prisma | Payment(psychologistId,status), AiUsage(psychologistId,createdAt), Message(conversationId,readAt), Invoice(sessionId) |
| M14 | **Redis failure = token révoqués acceptés** | `cache.service.ts:22` | Redis errors silently warned. JWT blacklist non fonctionnel si Redis down → tokens révoqués acceptés. |
| M15 | **SSE streaming error recovery** | `ai.service.ts:329-335` | Pas de check `res.writableEnded` avant write dans finally. Crash si client déconnecté. |
| M16 | **Webhook idempotency race condition** | `webhook.controller.ts:58-72` | 2 webhooks identiques dans 1s = double traitement |
| M17 | **`as any` sessionId dans AI controller** | `ai.controller.ts:49` | `@IsString()` au lieu de `@IsUUID()` pour sessionId |
| M18 | **Prisma query events non écoutés** | `prisma.service.ts:10-11` | Query events configurés mais pas de listener → slow query detection désactivée |
| M19 | **`trustHost: true` dans next-auth** | `auth.config.ts:201` | Désactive les checks CSRF. Nécessaire pour Vercel mais risque de sécurité. |
| M20 | **getPayments() charge tout en mémoire** | `subscription.service.ts:990-994` | Charge TOUS les payments pour calculer sum/count. Utiliser `prisma.payment.aggregate()`. |

#### 🟢 MINEURS (nice-to-have)

| # | Problème | Impact |
|---|---|---|
| L1 | Empty states inconsistants | UX |
| L2 | Pas d'animations/transitions | Perception qualité |
| L3 | AutosaveDto défini dans controller au lieu de DTO file | Convention |
| L4 | Pas de cursor-based pagination | Scalabilité future |
| L5 | Swagger gated par NODE_ENV seul | Sécurité mineure |
| L6 | Health check Redis via TCP brut au lieu de PING | Fiabilité check |
| L7 | CSV sanitization dupliquée entre patients et sessions | DRY |
| L8 | Pas de return type explicite sur controllers | Documentation |

### C. FEATURES À SUPPRIMER / REPORTER

| Feature | Statut actuel | Recommandation | Raison |
|---|---|---|---|
| Marketing IA (LinkedIn/Newsletter/Blog) | Phase 4 déployé | **Reporter Phase 5+** | Personne n'a payé pour ça. Dilue le produit. |
| Plateforme formations complète | Phase 4 déployé | **Reporter Phase 5+** | Trop ambitieux pour MVP. Psys veulent gérer cabinet d'abord. |
| Réseau Pro / Supervision | Actif en sidebar | **Cacher / Settings** | Bruit dans la sidebar, feature avancée |
| Parrainage | Actif en sidebar | **Reporter post-100 users** | Prématuré sans base utilisateurs |
| Admin Outbound dashboard | Actif | **Sortir en admin panel séparé** | Outil interne, pas feature utilisateur |

---

## IV. POSITIONNEMENT STRATÉGIQUE

### Avantages concurrentiels RÉELS

1. **Conformité HDS française** — SimplePractice, Jane, Carepatron = HIPAA (US). Pas conformes HDS. Moat réglementaire.
2. **IA intégrée** — Docorga, RVPsy, Terapiz = pas d'IA. Avantage tech sur marché FR.
3. **Tout-en-un** — Cabinet + patients + visio + facturation + portail patient + IA. Personne en France ne fait tout ça.
4. **Stack moderne** — Next.js + NestJS + Prisma. Facilité de maintenance et évolution vs les legacy PHP des concurrents FR.

### Faiblesses CRITIQUES

1. **0 users payants** — vs Docorga (1500 gratuit), Doctolib (350K+). Partir de zéro.
2. **Prix trop élevé** — 43€/mois quand Docorga est gratuit et Carepatron à 0-23€.
3. **IA en retard vs US** — Résumé de texte vs transcription audio temps réel (SimplePractice/Jane/Blueprint).
4. **Pas de SEO** — Aucune présence Google. Les psys trouvent Docorga, Doctolib, Terapiz.
5. **UX pas au niveau du prix** — Pricing SimplePractice ($49-79) mais pas leur UX. Jane App = référence design.

### Menaces immédiates

1. **Doctolib rajoute des features cliniques** — Synthèse IA consultation lancée fin 2025. Notes structurées = game over.
2. **Carepatron lance en français** — Freemium, global, multi-langue. Game over sur le prix.
3. **AI scribes standalone** — Upheal, Blueprint, Mentalyc = $0-49/mois juste pour notes IA. IA pas assez différenciante en standalone.

### Opportunités

1. **AI Scribe audio FR** — Personne ne le fait en France + conformité HDS. First mover advantage.
2. **Marché sous-équipé** — La majorité des psys FR utilisent Excel + papier. Le marché est à éduquer.
3. **Expansion francophone** — Belgique, Suisse, Luxembourg = mêmes réglementations, même langue.
4. **Intégrations CPAM / MonSoutienPsy** — Automatiser le remboursement = killer feature administrative.
5. **Marché en croissance** — $6.77B → $18.38B (2026-2035, CAGR 11.7%).

---

## V. PLAN D'ACTION RECOMMANDÉ

### Phase 0 — FIX IMMÉDIAT (Semaines 1-2)

| Action | Effort | Impact |
|---|---|---|
| `app.enableShutdownHooks()` dans main.ts | 30 min | Empêche perte données redéploiement |
| AbortController timeout 30s sur fetch() OpenRouter | 1h | Empêche connexions zombies |
| Ajouter `'log'` au logger prod | 5 min | Audit trail HDS |
| 4 indexes manquants (Payment, AiUsage, Message, Invoice) | 1h | Performance queries |
| Fix Redis failure → log error (pas warn) | 15 min | Sécurité token revocation |
| Fix SSE `res.writableEnded` check | 30 min | Crash prevention |
| `@IsUUID()` sur sessionId dans AI controller | 5 min | Validation input |

### Phase 1 — PRODUCT-MARKET FIT (Semaines 3-6)

**Objectif : 50 psys beta testeurs GRATUITS.**

| Action | Effort | Impact |
|---|---|---|
| **Free tier (10 patients, 0€)** | 2 jours | Funnel acquisition |
| **Refonte sidebar** — 5 groupes max | 2 jours | Rétention UX |
| **Mobile responsive complet** — Drawer nav, note editor mobile | 5 jours | Usage quotidien |
| **SEO : 10 articles blog** ("logiciel psychologue", "gestion cabinet psy") | 5 jours | Trafic organique |
| **Onboarding contextuel** — Checklist in-app | 3 jours | Activation |
| **Unifier palettes** landing/app | 2 jours | Cohérence marque |
| **Outreach : 200 psys** via LinkedIn + annuaires ADELI | Continu | Beta testers |

### Phase 2 — KILLER FEATURE IA (Semaines 7-12)

**Objectif : AI Scribe audio = différenciation unique en France.**

| Action | Effort | Impact |
|---|---|---|
| **AI Scribe : transcription audio → notes structurées** (Whisper/Deepgram) | 3 semaines | Game-changer France |
| **Résumé inter-séances** — évolution patient sur 6 mois | 1 semaine | Stickiness |
| **Templates notes par orientation** — TCC, psychanalyse, systémique, EMDR | 1 semaine | Pertinence métier |
| **Split SubscriptionService** (1078L → 4 services) | 3 jours | Maintenabilité |
| **Split EmailService** (1498L → template engine) | 2 jours | Maintenabilité |
| **Tests unitaires services critiques** (billing, invoices, sessions) | 1 semaine | Fiabilité |

### Phase 3 — SCALE TECHNIQUE (Semaines 13-20)

| Action | Effort | Impact |
|---|---|---|
| Cache Redis sur profil psy + subscription + patient list | 3 jours | Performance |
| Tests frontend (Vitest + Testing Library) | 1 semaine | Fiabilité |
| Cursor-based pagination | 2 jours | Scalabilité |
| i18n (next-intl) | 1 semaine | Expansion européenne |
| Google Calendar sync | 3 jours | Rétention |
| Certifications ISO 27001 / label e-santé HAS | Continu | Crédibilité |

### Phase 4 — GROWTH (Semaines 21+)

| Action | Impact |
|---|---|
| Marketplace intégrations (MonPsy, CPAM, mutuelles) | Distribution |
| API publique | Plateforme |
| Mobile native React Native | Rétention mobile |
| Réactiver formations (quand 200+ psys actifs) | Revenus additionnels |
| Expansion Belgique/Suisse/Luxembourg | Scale géographique |

---

## VI. PRICING RECOMMANDÉ

### Actuel (problématique)
- Starter : 43€/mois | Pro : 69€/mois | Scale : 119€/mois
- **Problème :** Pas de free tier face à Docorga gratuit et Carepatron $0

### Recommandé

| Plan | Prix | Cible | Inclus |
|---|---|---|---|
| **Free** | 0€ | Découverte | 10 patients, pas d'IA, pas de visio |
| **Solo** | **29€/mois** (25€ annuel) | Psy débutant | 50 patients, 10 résumés IA/mois, visio basique |
| **Pro** | **59€/mois** (49€ annuel) | Psy établi | Illimité, IA illimitée, AI Scribe audio, portail patient |
| **Clinic** | **99€/mois** (89€ annuel) | Cabinets multi-psys | Multi-praticiens, analytics avancées, API |

---

## VII. DONNÉES MARCHÉ

### Taille du marché

| Segment | 2026 | 2035 | CAGR |
|---|---|---|---|
| Mental Health Software (mondial) | $6.77B | $18.38B | 11.7% |
| US Mental Health Software | $1.74B | $4.35B | 12.1% |
| Behavioral Health AI Platform | $2.3B | $13.1B | ~20% |

### Marché cible France
- ~30 000 psychologues libéraux en France
- ~70% n'utilisent aucun logiciel spécialisé (source : FDPL)
- TAM France : 30 000 × 59€/mois × 12 = **21.24M€/an**
- SAM réaliste (5%) : **1 500 psys × 59€ × 12 = 1.06M€ ARR**
- Objectif 1000 psys payants = ~708K€ ARR

---

## VIII. VERDICT FINAL

### Forces
- Architecture technique solide (6.9/10)
- Conformité HDS exemplaire (moat réglementaire)
- IA intégrée (avance sur concurrence FR)
- Stack moderne et maintenable

### Faiblesses
- 0 product-market fit validé
- Prix trop élevé sans free tier
- IA en retard vs standards US 2026
- UX pas au niveau premium
- 13% couverture tests

### Recommandation principale
**Arrêter d'ajouter des features. Trouver 20-50 psys beta testeurs. Écouter. Itérer. Puis construire l'AI Scribe audio comme killer feature unique en France.**

*Score global : **6.9/10** — Techniquement solide, stratégiquement fragile.*

---

*Audit réalisée le 13 avril 2026 par Claude Opus 4.6*
*Sources : Firecrawl (web scraping concurrents), 3 agents d'audit spécialisés (architecture, sécurité, UX/UI), analyse codebase directe*
