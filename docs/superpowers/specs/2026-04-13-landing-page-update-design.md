# Landing Page Update — New Features + SEO

## Summary

Update the PsyLib landing page to showcase 5 deployed features currently missing from marketing:
1. Video consultation (LiveKit, HDS-compliant)
2. Auto-invoicing (PDF after session/payment)
3. Realtime notifications (WebSocket)
4. Patient portal (mood, journal, exercises)
5. Enhanced AI (contextual summaries, personalized exercises, explicit consent)

**Approach:** Hybrid — 2 new dedicated sections (Visio + Patient Portal) + enrichment of 3 existing sections (AI card, Payments card, new Notifications card) + SEO improvements.

## New Sections

### VisioSection (position: after OutcomeSection)

Split layout: text left, video interface mockup right.

- Headline: "Consultez en visio, sans compromis sur la sécurité"
- Subtext: LiveKit self-hosted HDS, zero third-party tools
- 4 bullets: HD video/audio France HDS, note-taking during call, unique patient link, no Zoom/Meet
- 3 badges: HDS Certifié, Chiffrement TLS 1.3, Données en France
- Plan badge: "Pro & Scale"
- Right side: mockup of video interface with timer, HD badge, dual video feeds, control bar (mic/camera/hangup/notes)
- Background: subtle gradient or clean white with primary accent
- `id="visio"` for anchor navigation

### PatientPortalSection (position: after VisioSection)

Split layout inverse: phone mockup left, text right.

- Headline: "Le suivi ne s'arrête pas à la porte du cabinet"
- Subtext: dedicated patient space for mood, journal, AI exercises
- 4 bullets: daily mood tracking (1-10 + note), therapeutic journal (private or shared), personalized exercises (manual or AI), mood alerts for practitioner
- Callout box: "Pour le psy : visualisez l'évolution entre les séances. Le mood tracking alimente vos graphiques Outcome Tracking."
- Plan badge: "Inclus dans tous les plans"
- Left side: phone mockup showing mood selector, journal entry, exercise progress bar
- `id="espace-patient"` for anchor navigation

## Enriched Existing Sections

### FeaturesSection (6 → 7 cards)

**Card #4 AI (modified):**
- Title: "Assistant IA contextuel"
- Description: "Résumé structuré de séance en streaming. Exercices thérapeutiques personnalisés générés par IA. Consentement patient explicite requis — zéro données envoyées sans votre accord."
- New badge: "Consentement explicite"

**Card #5 Payments (modified):**
- Title: "Paiements, factures & zéro no-show"
- Description adds: "Facture PDF auto-générée après chaque séance. Numérotation séquentielle, TVA 0% psychologue. Envoi automatique au patient."

**Card #7 Notifications (new):**
- Title: "Notifications temps réel"
- Description: "Nouveau RDV, paiement reçu, rappels patient, alertes humeur. Tout arrive instantanément dans votre dashboard — sans rafraîchir."
- Icon: bell with realtime badge

### ComparisonSection (+3 rows)

| Feature | PsyLib | Agenda médical | Fichiers locaux |
|---|---|---|---|
| Visio intégrée HDS | ✓ | ✗ | ✗ |
| Espace patient (humeur, journal, exercices) | ✓ | ✗ | ✗ |
| Factures PDF automatiques | ✓ | Partiel | ✗ |

### FAQSection (+3 FAQs)

1. **"PsyLib propose-t-il la téléconsultation ?"**
   → Oui, visio HD intégrée, hébergée sur infrastructure HDS certifiée en France. Pas besoin de Zoom ou Google Meet. Lien unique envoyé au patient, prise de notes pendant la consultation. Disponible sur les plans Pro et Scale.

2. **"Comment fonctionne l'espace patient ?"**
   → Chaque patient invité reçoit un espace personnel sécurisé : suivi d'humeur quotidien, journal thérapeutique (privé ou partagé avec le psy), et exercices assignés. Le praticien visualise l'évolution entre les séances directement dans son dashboard.

3. **"Les factures sont-elles générées automatiquement ?"**
   → Oui. Après chaque séance marquée comme payée ou après un paiement Stripe, PsyLib génère automatiquement une facture PDF avec numérotation séquentielle et TVA 0% (exonération psychologue). Configurable dans Paramètres > Cabinet.

## SEO Improvements

### Metadata (page.tsx)

**Keywords to add:**
- "téléconsultation psychologue HDS"
- "visio psy conforme"
- "espace patient psychologue"
- "suivi humeur patient"
- "facturation automatique psychologue"

**Description update:** Add mention of video consultation and patient portal.

**OG description update:** Same additions.

### JSON-LD Schema

**SoftwareApplication.featureList additions:**
- "téléconsultation vidéo HDS intégrée"
- "espace patient avec mood tracking et journal thérapeutique"
- "facturation automatique PDF"
- "notifications temps réel WebSocket"
- "exercices thérapeutiques personnalisés par IA"

**FAQPage additions:** The 3 new FAQs above (with structured Q&A).

### Navigation

**LandingNav:** Add "Visio" anchor link (#visio) in desktop and mobile nav.

**LandingFooter:** Add "Visio-consultation" and "Espace patient" links in Produit column.

## Files

### New files
- `components/landing/visio-section.tsx`
- `components/landing/patient-portal-section.tsx`

### Modified files
- `app/page.tsx` — import + render new sections in order
- `components/landing/features-section.tsx` — modify AI card, payments card, add notifications card
- `components/landing/comparison-section.tsx` — add 3 rows
- `components/landing/faq-section.tsx` — add 3 FAQs
- `components/landing/landing-nav.tsx` — add anchor links
- `components/landing/landing-footer.tsx` — add footer links

## Design Guidelines

- Follow existing landing page patterns (Tailwind classes, color tokens, responsive breakpoints)
- Use existing palette: primary #3D52A0, accent #0D9488, surface #F1F0F9, text #1E1B4B
- Fonts: Playfair Display (headlines), DM Sans (body)
- Responsive: mobile-first, mockups hidden on small screens, text stacks vertically
- Animations: use existing framer-motion patterns from other sections
- All text in French
