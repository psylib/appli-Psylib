# Décision de sécurité — `'unsafe-inline'` dans le CSP `script-src`

**Statut :** risque résiduel **accepté et tracé** (révisable).
**Date :** 2026-06-28 · **Périmètre :** `apps/web` (Next.js, Vercel).
**Réf. :** audit 360° 2026-06-24, volet sécurité (« CSP `unsafe-inline` — durcissement »).

---

## 1. Contexte

Le CSP de production (défini dans `apps/web/next.config.mjs`, `headers()`) contient :

```
script-src 'self' 'wasm-unsafe-eval' 'unsafe-inline' https://client.crisp.chat https://eu-assets.i.posthog.com
```

`'unsafe-inline'` autorise **tout script inline**. C'est la directive la plus
permissive de `script-src` : en cas d'injection (XSS), elle n'oppose aucune barrière.

## 2. Analyse du risque réel (faible)

La valeur de `'unsafe-inline'` pour un attaquant suppose un point d'injection XSS.
Dans cette application :

- **Aucun HTML utilisateur n'est rendu brut.** React échappe par défaut. Les
  `dangerouslySetInnerHTML` (67 occurrences) sont **exclusivement** du JSON-LD
  (`<script type="application/ld+json">`) sérialisé depuis des données maîtrisées
  par l'app — et le JSON-LD **n'est pas du JS exécutable** (non soumis à `script-src`).
- **App sensible derrière authentification** (Keycloak + MFA) ; isolation tenant.
- Pas de rendu de contenu tiers non fiable.

→ Surface XSS pratiquement nulle aujourd'hui. L'audit a classé l'item en
**durcissement / défense en profondeur**, pas en faille critique.

## 3. Pourquoi ce n'est PAS retiré tout de suite (coût > bénéfice actuel)

Retirer `'unsafe-inline'` **exige la mécanique « nonce »** : les scripts de
hydratation de Next.js ont un contenu variable → ni `'unsafe-inline'` ni des
hash stables ne sont évitables autrement. Or :

1. **Le nonce force le rendu dynamique** de toute page qui l'utilise (doc Next 15 :
   « static optimization, ISR et PPR désactivés »). Sur un site **très orienté SEO**
   (~30 pages blog/comparaison/villes en statique), c'est une perte de perf/CDN réelle.
2. Le nonce **se branche dans `middleware.ts`** — le code d'authentification, le plus
   critique du front.
3. **Bus-factor 1** : le mainteneur principal n'opère pas le CSP au quotidien ; une
   mécanique nonce qui casse silencieusement (ajout futur d'un script tiers) serait
   difficile à diagnostiquer.

L'audit identifie la **fragilité opérationnelle** (SPOF, bus-factor) comme le risque
n°1 — pas le code. Ajouter une mécanique fragile sur l'auth pour un gain sécu faible
irait à contre-sens. **Priorité supérieure : SPOF infra + croissance.**

## 4. Plan de remédiation (à exécuter quand la capacité front le permet)

Approche recommandée = **hybride** : strict là où le risque existe, statique ailleurs.

> Seuls 2 vrais bloqueurs au retrait de `unsafe-inline` : les scripts framework Next
> (hydratation) et le snippet inline Crisp (`apps/web/src/components/crisp-widget.tsx`).
> PostHog (bundlé) et le JSON-LD ne sont **pas** concernés.

1. **Routes authentifiées** (`/dashboard/*`, `/patient-portal/*`, `/onboarding/*`,
   `/video/*`) — déjà dynamiques, et c'est là que le XSS serait dangereux (données
   patients) :
   - Dans `middleware.ts`, pour ces préfixes : générer un nonce
     (`crypto.randomUUID()`/`getRandomValues` → base64), le poser sur **le header de
     requête** `x-nonce` (pour que Next l'applique au SSR) **et** sur le header de
     réponse `Content-Security-Policy` avec
     `script-src 'self' 'nonce-<n>' 'strict-dynamic' 'wasm-unsafe-eval'`
     (`'strict-dynamic'` laisse le script Crisp nonce-é injecter `l.js`).
   - Forcer le rendu dynamique de ces routes si besoin : `await connection()`
     (`next/server`) dans `(dashboard)/layout.tsx` et `(patient-portal)/layout.tsx`.
   - `next/script` (Crisp) récupère le nonce automatiquement via le contexte Next.
2. **Pages publiques SEO** : conserver le CSP actuel (avec `unsafe-inline`) + rendu
   **statique**. Risque XSS quasi nul, perf préservée.
3. **Mettre le CSP entièrement dans le middleware** (source unique : strict pour les
   préfixes authentifiés, permissif sinon) pour éviter le doublon avec
   `next.config.mjs` `headers()`.
4. **Validation avant prod** :
   - `Content-Security-Policy-Report-Only` (strict) branché sur un collecteur
     (endpoint Sentry « security ») pendant quelques jours → repérer les violations
     réelles (scripts tiers oubliés) **sans rien bloquer**.
   - Tester en **preview Vercel** : login psy, dashboard, **Crisp s'ouvre**, PostHog
     capture, visio — avant promotion prod (rollback Vercel instantané).

Effort estimé : ~½ journie front + fenêtre report-only. Rollback : instantané (Vercel).

## 5. Revue

À ré-évaluer si : (a) ajout d'une surface rendant du contenu utilisateur en HTML,
(b) capacité front disponible pour le chantier hybride, (c) exigence client/audit
externe. Sinon, risque accepté en l'état.
