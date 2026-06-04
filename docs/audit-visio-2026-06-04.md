# 🎥 Audit Visio Téléconsultation — Europe & Monde (2026)

**Date :** 2026-06-04
**Pour :** PsyLib
**Périmètre :** 2 angles — (1) Produits de téléconsultation santé · (2) Infrastructure vidéo technique

> ⚠️ Note méthode : le harnais de recherche automatisé (deep-research workflow) a planté en cours (bug de format des sous-agents StructuredOutput, pas de la recherche). Recherche refaite manuellement via WebSearch + vérification des faits clés à jour. Rapport solide mais moins exhaustif en sources que prévu.

---

## PARTIE 1 — Plateformes de téléconsultation (concurrents UX/santé)

| Solution | Pays | Modèle | Visio | Conformité | Force UX |
|---|---|---|---|---|---|
| **Doctolib** | 🇫🇷🇩🇪 | Agenda + visio intégrée | E2E chiffré, **non enregistré** | HDS (AWS Paris/Francfort) | Notif push + SMS 10 min avant, zéro install patient, télétransmission SESAM-Vitale, paiement intégré |
| **Qare** (Livi) | 🇫🇷 | Marché téléconsult B2C | Visio native | HDS | Médecins à la demande, ordonnance numérique |
| **Maiia** (Cegedim) | 🇫🇷 | Agenda + téléconsult | Visio + paiement | HDS | Intégration logiciel métier, tiers payant |
| **Hellocare** | 🇫🇷 | Plateforme téléconsult | Visio + salle d'attente | HDS | Salle d'attente virtuelle, multi-praticiens |
| **Tixeo** | 🇫🇷 | Visio sécurisée | **E2E vrai chiffrement**, certifié ANSSI | HDS + CSPN ANSSI | Référence souveraine "secret médical", auto-hébergeable |
| **Doxy.me** | 🇺🇸 | Téléconsult simple | Navigateur, zéro install | HIPAA | Ultra-simple, lien unique, pensé pour psys/thérapeutes |
| **Zoom for Healthcare** | 🇺🇸 | Visio entreprise | Très robuste | HIPAA (BAA) | Qualité réseau, sous-titres IA, fiabilité |
| **Teladoc / Amwell** | 🇺🇸 | Télémédecine intégrée | Visio + triage | HIPAA | Écosystème complet (pharmacie, suivi), peu pertinent EU |

### À retenir / copier pour PsyLib
1. **Zéro friction patient (Doctolib)** : rappel SMS + push 10 min avant avec lien direct, aucune install, aucun compte requis pour rejoindre. (Invités/salle d'attente déjà faits le 3 juin — vérifier le rappel auto pré-séance avec lien direct.)
2. **Doxy.me = vrai modèle pour psys** : référence mondiale des thérapeutes solo, force = simplicité radicale (un lien, salle d'attente perso brandée). Exactement le segment PsyLib.
3. **Argument "non enregistré / E2E"** : pour la psy, le secret médical = argument commercial massif. Doctolib affiche "ni enregistré ni stocké". À mettre en avant côté patient.
4. **Salle d'attente brandée** au nom du psy = standard attendu (Tixeo, Doxy.me en font un argument premium).

---

## PARTIE 2 — Infrastructure vidéo (la brique technique)

### Fait majeur 2024-2026
- **Twilio Video** : annoncé mort (EOL déc. 2024) → ressuscité, EOL repoussé à 2026 puis machine arrière. **Statut instable, déconseillé pour un nouveau projet.** Twilio recommandait Zoom Video SDK.
- **Vonage/TokBox (OpenTok)** : legacy en déclin. Peu de nouveaux projets.
- Marché recentré sur : **LiveKit, Daily, Agora, 100ms, Amazon Chime SDK, Whereby Embedded, Jitsi**.

| Infra | Self-host | Prix (ordre de grandeur) | Conformité santé | Scalabilité | IA | Verdict PsyLib |
|---|---|---|---|---|---|---|
| **LiveKit** (choix actuel) | ✅ Total | Cloud ~$0.004 audio / $0.006-0.024 vidéo/min · **self-host quasi gratuit** | HIPAA (Cloud tiers payants) · **HDS = self-host OVH ✅** | Excellente (SFU moderne) | ✅ **Agents framework natif** (meilleur pour scribe IA) | 🟢 **Garder** |
| **Daily.co** | ❌ managed | 10k min/mois gratuits, $0.004→$0.0015/min | HIPAA (BAA) | Bonne | Transcription, recording | 🟡 Excellent DX, managed US, pas HDS |
| **Agora** | ❌ | ~$0.99/1000 min audio | HIPAA possible | 🥇 Meilleure (10k+, edge Asie/LatAm) | Conversational AI | 🟡 Overkill, edge non-EU |
| **100ms** | ❌ | Par min, composants UI prêts | HIPAA | Bonne | Limité | 🟡 Rapide à shipper mais managed |
| **Whereby Embedded** | ❌ | Par min/participant | GDPR (🇳🇴 Europe) | Bonne | Transcription | 🟢 Alternative EU crédible si managed voulu |
| **Amazon Chime SDK** | ❌ | Pay-as-you-go AWS | HIPAA + **HDS (AWS Paris)** | Très bonne | Transcribe, AI | 🟡 HDS-ready mais lock-in AWS |
| **Jitsi** | ✅ Total | Gratuit (self-host) | À toi | Moyenne | Faible | 🔴 Qualité inférieure à LiveKit |

### Verdict infra : LiveKit reste le bon choix. Ne pas changer.
1. **Coût** : LiveKit managed annoncé 2,5×–8× moins cher que les concurrents ; en self-host (OVH) quasi gratuit (juste le VPS). Meilleure marge possible.
2. **HDS** : self-host OVH = contrôle 100% de la conformité, impossible avec Daily/Agora/100ms (US, BAA HIPAA ≠ HDS FR). Seuls Chime (AWS Paris) et Whereby (Norvège) rivaliseraient, au prix d'un lock-in.
3. **IA** : LiveKit a le meilleur framework d'agents temps réel — exactement ce qu'il faut pour l'AI Scribe audio (plan Pro). Un agent rejoint la room comme participant et transcrit en direct.

➡️ Migrer = perte de temps et de marge. Seul scénario de changement : si l'exploitation du SFU sur OVH devient ingérable → bascule vers **LiveKit Cloud** (même API, zéro refonte) ou **Whereby Embedded** (seule alt. EU-native managed).

---

## PARTIE 3 — Tendances 2025-2026 : l'IA dans la visio
1. **AI Ambient Scribe = standard émergent.** Abridge a gagné "Best in KLAS 2025" devant Nuance DAX et Suki. Génèrent note clinique structurée + résumé patient en direct. Gain : 1-2h/jour de paperasse. ➡️ **Plus grosse opportunité PsyLib** : scribe en direct pendant la visio via LiveKit Agents (pas juste post-séance).
2. **Sous-titres temps réel + transcription live** : devenu standard (Zoom, Daily, Whereby).
3. **Qualité réseau adaptative (simulcast/SVC)** : LiveKit natif — bascule auto de résolution selon bande passante. Critique pour zones mal couvertes.
4. **Résumés patient-friendly post-séance** : Abridge génère résumé patient en plus de la note praticien. Idée : résumé partagé au patient via le portail.

⚠️ **Conformité (règle absolue #3)** : tout scribe IA = consentement explicite + anonymisation avant LLM. Pour le scribe en direct, prévoir un nouveau type `ai_video_transcription` versionné dans `gdpr_consents`.

---

## Synthèse — 5 actions concrètes

| Priorité | Action | Effort |
|---|---|---|
| 🔴 1 | **Garder LiveKit self-host** — bon choix coût + HDS + IA. Verdict tranché. | 0 |
| 🔴 2 | **AI Scribe en direct via LiveKit Agents** : transcription + note + résumé patient pendant/après la visio. Vrai différenciateur vs Doctolib. | Élevé |
| 🟠 3 | **Rappel pré-séance avec lien direct** (SMS/push 10 min avant, zéro friction, modèle Doctolib). | Moyen |
| 🟠 4 | **Salle d'attente brandée psy + argument "E2E, non enregistré"** mis en avant côté patient (modèle Doxy.me/Tixeo). | Faible |
| 🟡 5 | **Sous-titres live temps réel** + consentement `ai_video_transcription`. | Moyen |

**En une phrase :** l'infra (LiveKit/OVH HDS) est déjà au niveau du meilleur du marché et coûte moins cher que tous les concurrents managed — la bataille des 12 prochains mois se gagne sur l'UX zéro-friction (Doctolib/Doxy.me) et surtout sur l'AI Scribe en direct, qu'aucun concurrent FR généraliste n'offre encore aux psys.

---

## Sources
- [Twilio Video EOL/résurrection (Dyte)](https://dyte.io/blog/twilio-video-end-of-life/)
- [Twilio back from the dead (BlogGeek.me)](https://bloggeek.me/twilio-programmable-video-back/)
- [LiveKit vs Agora cost analysis 2026 (Forasoft)](https://www.forasoft.com/blog/article/livekit-vs-agora-cost-analysis)
- [WebRTC Platforms Compared 2026 (RTC Insights)](https://www.rtcinsights.com/blog/webrtc-platforms-compared/)
- [LiveKit alternatives 2026 (GetStream)](https://getstream.io/blog/livekit-alternatives/)
- [Doctolib sécurité & HDS](https://doctolib.zendesk.com/hc/fr/articles/360040107491-Tout-savoir-sur-la-s%C3%A9curit%C3%A9-des-donn%C3%A9es-et-la-protection-des-donn%C3%A9es-personnelles)
- [Panorama solutions téléconsultation FR (Télésanté Bretagne, mars 2025)](https://www.telesante-bretagne.fr/voy_content/uploads/2025/07/Panorama_editeurs_Telesante-avec-Lexique-partie-liberale-VD.pdf)
- [Ambient AI scribes — Best in KLAS 2025 (Twofold)](https://www.trytwofold.com/blog/best-ai-medical-scribe-2026)
- [Nuance DAX télésanté](https://www.nuance.com/healthcare/dragon-ai-clinical-solutions/dax-copilot/infographic/move-beyond-scribes-to-automatically-document-care.html)
