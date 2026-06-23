# Cartes citations animées PsyLib (MP4 + GIF)

Versions **animées** des 10 cartes citations (boucle 5 s, 1080×1080) : reveal ligne par ligne,
halo pulsé sur le highlight, blobs colorés flottants, logo « P + feuilles » dans une pastille blanche.

## Fichiers
- `card.html` — template paramétrable (4 styles indigo/light/teal/violet + timeline `window.render(t)` + `window.buildCard(card)`)
- `cards.mjs` — données des 10 cartes (style, lignes, highlight `*…*`, légende, etc.)
- `generate.mjs` — capture Playwright 1080p → **MP4 (H.264)** + **GIF** (palette ffmpeg 2 passes) par carte → `out/`
- `static.mjs` — capture l'état révélé → **PNG statiques** (mêmes cartes, nouveau logo) → `static-out/`
- `logo-mark.png` — le logo de marque (référencé par le template)

## Régénérer
```bash
npm install   # (dans un dossier avec playwright dispo ; ffmpeg requis dans le PATH ou via env FFMPEG)
node generate.mjs            # les 10 animées (MP4+GIF)
ONLY=02,04 node generate.mjs # un sous-ensemble
node static.mjs              # les 10 PNG statiques
```
Dépendances : Playwright (Chromium), **ffmpeg** (chemin via env `FFMPEG` sinon `ffmpeg` du PATH).

## Déploiement / hébergement
- MP4 + PNG copiés dans `apps/web/public/cards/` → servis par **Vercel** sur `https://psylib.eu/cards/card-0X.{mp4,png}`
- ⚠️ **Toujours Vercel, jamais `n8n.psylib.eu/cards/`** : le conteneur n8n (AZNetwork) ne joint pas son propre domaine (hairpin NAT).
- ⚠️ `.vercelignore` exclut `*.mp4`/`*.png` globalement → garder les lignes `!apps/web/public/cards/*.mp4` et `!apps/web/public/cards/*.png`.

## Autoposter
Le workflow n8n « Visuel LinkedIn Lundi 13h30 » (`WDSEYshzz3rFD2F7`) poste ces **MP4** sur LinkedIn + Facebook
chaque lundi 13h30 (rotation des 10 cartes). Voir mémoire `animated-cards.md`.
