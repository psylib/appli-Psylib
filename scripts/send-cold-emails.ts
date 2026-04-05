#!/usr/bin/env tsx
/**
 * Cold Email Sender — PsyLib Prospection 2026 Q2
 *
 * Envoie une séquence 3 emails (J+0, J+4, J+10) via Resend API, conforme CNIL B2B.
 *
 * USAGE
 * -----
 * # Dry-run : affiche ce qui serait envoyé, n'envoie rien
 * pnpm tsx scripts/send-cold-emails.ts --touch 1 --max 5 --dry-run
 *
 * # Envoyer email 1 à 20 psys du 75 (warmup semaine 1)
 * pnpm tsx scripts/send-cold-emails.ts --touch 1 --dept 75 --max 20
 *
 * # Envoyer email 2 aux leads éligibles (J+4 après touch 1)
 * pnpm tsx scripts/send-cold-emails.ts --touch 2 --max 20
 *
 * # Stats de campagne
 * pnpm tsx scripts/send-cold-emails.ts --stats
 *
 * VARIABLES D'ENVIRONNEMENT
 * -------------------------
 *   RESEND_API_KEY         (obligatoire)
 *   UNSUBSCRIBE_SECRET     (obligatoire — pour signer les tokens)
 *   COLD_FROM_EMAIL        (défaut : "Tony de PsyLib <tony@psylib.eu>")
 *   COLD_REPLY_TO          (défaut : "tony@psylib.eu")
 *
 * FICHIERS
 * --------
 *   Input CSV       : ./tmp/psychologues-liberaux-brevo-ready.csv
 *   State           : ./tmp/cold-email-state.json
 *   Unsubscribed    : ./tmp/unsubscribed.txt (1 email par ligne)
 *   Logs            : ./tmp/cold-email-logs.jsonl
 *
 * WARMUP RECOMMANDÉ
 * -----------------
 *   Semaine 1 : 20 emails/jour
 *   Semaine 2 : 50 emails/jour
 *   Semaine 3+ : 100-200 emails/jour
 *
 * CONFORMITÉ CNIL
 * ---------------
 *   - Emails professionnels affichés publiquement dans RPPS (annuaire santé d'État)
 *   - Intérêt légitime B2B
 *   - Lien désabonnement fonctionnel dans chaque email
 *   - Header List-Unsubscribe (RFC 2369) + List-Unsubscribe-Post (one-click Gmail)
 *   - Arrêt immédiat sur désabonnement ou bounce
 */

import * as fs from 'node:fs';
import * as path from 'node:path';
import * as crypto from 'node:crypto';

// ============================================================================
// Configuration
// ============================================================================

const RESEND_API_KEY = process.env['RESEND_API_KEY'];
const UNSUBSCRIBE_SECRET = process.env['UNSUBSCRIBE_SECRET'] || 'change-me-in-prod';
const FROM_EMAIL = process.env['COLD_FROM_EMAIL'] || 'Tony de PsyLib <tony@psylib.eu>';
const REPLY_TO = process.env['COLD_REPLY_TO'] || 'tony@psylib.eu';

const INPUT_CSV = './tmp/psychologues-liberaux-brevo-ready.csv';
const STATE_PATH = './tmp/cold-email-state.json';
const UNSUB_PATH = './tmp/unsubscribed.txt';
const LOG_PATH = './tmp/cold-email-logs.jsonl';

const TOUCH_DELAYS_DAYS: Record<2 | 3, number> = { 2: 4, 3: 10 };
const SEND_INTERVAL_MS = 300; // 300ms entre chaque envoi (3.3/sec, sous les 10/sec Resend)

// ============================================================================
// Types
// ============================================================================

interface Lead {
  email: string;
  firstName: string;
  lastName: string;
  city: string;
  departement: string;
  phone: string;
  source: string;
}

interface TouchRecord {
  n: 1 | 2 | 3;
  sentAt: string; // ISO
  messageId?: string;
  error?: string;
}

interface LeadState {
  touches: TouchRecord[];
  unsubscribed?: boolean;
  bounced?: boolean;
  responded?: boolean;
  updatedAt: string;
}

type State = Record<string, LeadState>;

interface SendArgs {
  touch: 1 | 2 | 3;
  max: number;
  dept?: string;
  dryRun: boolean;
  stats: boolean;
}

// ============================================================================
// CSV parser (simple — handles quoted fields with commas)
// ============================================================================

function parseCsvLine(line: string): string[] {
  const result: string[] = [];
  let current = '';
  let inQuotes = false;
  for (let i = 0; i < line.length; i++) {
    const char = line[i]!;
    if (inQuotes) {
      if (char === '"' && line[i + 1] === '"') {
        current += '"';
        i++;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        current += char;
      }
    } else {
      if (char === '"') {
        inQuotes = true;
      } else if (char === ',') {
        result.push(current);
        current = '';
      } else {
        current += char;
      }
    }
  }
  result.push(current);
  return result;
}

function loadLeads(csvPath: string): Lead[] {
  if (!fs.existsSync(csvPath)) {
    throw new Error(`CSV introuvable : ${csvPath}`);
  }
  const content = fs.readFileSync(csvPath, 'utf-8');
  const lines = content.split(/\r?\n/).filter((l) => l.trim().length > 0);
  const [, ...dataLines] = lines;
  return dataLines
    .map((line) => parseCsvLine(line))
    .filter((fields) => fields.length >= 6 && !!fields[0])
    .map((fields) => ({
      email: (fields[0] || '').toLowerCase().trim(),
      firstName: toTitleCase(fields[1] || ''),
      lastName: toTitleCase(fields[2] || ''),
      city: fields[3] || '',
      departement: fields[4] || '',
      phone: fields[5] || '',
      source: fields[6] || 'rpps-2026-q2',
    }));
}

function toTitleCase(s: string): string {
  return s
    .toLowerCase()
    .split(/\s+|-/)
    .map((w) => (w.length > 0 ? w[0]!.toUpperCase() + w.slice(1) : ''))
    .join(' ')
    .trim();
}

// ============================================================================
// State management
// ============================================================================

function loadState(): State {
  if (!fs.existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(fs.readFileSync(STATE_PATH, 'utf-8')) as State;
  } catch {
    console.warn(`⚠️  State file corrupted, starting fresh.`);
    return {};
  }
}

function saveState(state: State): void {
  fs.mkdirSync(path.dirname(STATE_PATH), { recursive: true });
  fs.writeFileSync(STATE_PATH, JSON.stringify(state, null, 2), 'utf-8');
}

function loadUnsubscribed(): Set<string> {
  if (!fs.existsSync(UNSUB_PATH)) return new Set();
  const content = fs.readFileSync(UNSUB_PATH, 'utf-8');
  return new Set(
    content
      .split(/\r?\n/)
      .map((l) => l.trim().toLowerCase())
      .filter((l) => l.length > 0 && l.includes('@')),
  );
}

function logEvent(event: Record<string, unknown>): void {
  fs.mkdirSync(path.dirname(LOG_PATH), { recursive: true });
  fs.appendFileSync(LOG_PATH, JSON.stringify({ ts: new Date().toISOString(), ...event }) + '\n');
}

// ============================================================================
// Unsubscribe token (HMAC-SHA256 truncated)
// ============================================================================

function makeUnsubToken(email: string): string {
  return crypto
    .createHmac('sha256', UNSUBSCRIBE_SECRET)
    .update(email.toLowerCase().trim())
    .digest('hex')
    .slice(0, 16);
}

function unsubscribeUrl(email: string): string {
  const token = makeUnsubToken(email);
  return `https://psylib.eu/unsubscribe?email=${encodeURIComponent(email)}&token=${token}`;
}

// ============================================================================
// Templates (3 touches)
// ============================================================================

function baseStyle(): string {
  return 'font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",sans-serif;font-size:15px;line-height:1.6;color:#1E1B4B;max-width:560px;margin:0 auto;padding:0 16px;';
}

function footerHtml(unsubUrl: string): string {
  return `
<hr style="border:none;border-top:1px solid #e5e5e5;margin:24px 0 12px;" />
<p style="font-size:12px;color:#999;line-height:1.5;">
  Cet email vous est adressé dans un cadre professionnel (intérêt légitime B2B) — votre email est public dans l'annuaire santé officiel (RPPS).<br />
  Pour ne plus recevoir de messages, cliquez ici : <a href="${unsubUrl}" style="color:#999;">se désabonner</a>.<br />
  PsyLib — <a href="https://psylib.eu" style="color:#999;">psylib.eu</a>
</p>`;
}

function footerText(unsubUrl: string): string {
  return `\n---\nEmail professionnel (intérêt légitime B2B). Email public RPPS.\nSe désabonner : ${unsubUrl}\nPsyLib — https://psylib.eu`;
}

function template1(lead: Lead): { subject: string; html: string; text: string } {
  const fn = lead.firstName || 'Docteur';
  const unsub = unsubscribeUrl(lead.email);
  const subject = `${fn}, petite question sur votre logiciel de cabinet`;

  const html = `<div style="${baseStyle()}">
<p>Bonjour ${fn},</p>
<p>Je vous écris depuis <strong>PsyLib</strong> — je construis le premier logiciel de gestion de cabinet 100% HDS pour psychologues libéraux.</p>
<p>Petite question franche : votre logiciel actuel est-il certifié HDS (Hébergeur de Données de Santé) ?</p>
<p>L'article L.1111-8 du Code de la santé publique l'impose pour toute donnée patient hébergée en ligne. En pratique, ~80% des psys utilisent aujourd'hui des outils non conformes (Drive, Dropbox, Excel, SaaS hébergés hors France) — souvent sans le savoir. Sanction CNIL potentielle : jusqu'à 20 M€ ou 4% du CA.</p>
<p>PsyLib combine tout ce que Doctolib ne fait <em>pas</em> :<br />
agenda + notes de séance structurées + outcome tracking PHQ-9/GAD-7 + facturation + IA clinique + paiement Stripe + espace patient — 100% HDS France.</p>
<p><strong>Prix : 43€/mois à vie</strong> pour l'offre Fondateurs (15 places, ~10 restantes).</p>
<p>Auriez-vous 15 minutes cette semaine pour une démo courte ?</p>
<p>Cordialement,<br />
<strong>Tony</strong><br />
Fondateur PsyLib — <a href="https://psylib.eu" style="color:#3D52A0;">psylib.eu</a></p>
<p style="font-size:13px;color:#666;"><em>P.S. Si ce n'est pas le bon moment, aucun souci — je vous enverrai dans 4 jours un guide gratuit "RGPD & HDS pour psychologues" (12 pages) qui peut déjà vous être utile.</em></p>
${footerHtml(unsub)}
</div>`;

  const text = `Bonjour ${fn},

Je vous écris depuis PsyLib — je construis le premier logiciel de gestion de cabinet 100% HDS pour psychologues libéraux.

Petite question franche : votre logiciel actuel est-il certifié HDS ?

L'article L.1111-8 du Code de la santé publique l'impose pour toute donnée patient hébergée en ligne. ~80% des psys utilisent des outils non conformes (Drive, Dropbox, Excel, SaaS non-HDS) - souvent sans le savoir. Sanction CNIL : jusqu'à 20 M€ ou 4% du CA.

PsyLib combine tout ce que Doctolib ne fait PAS : agenda + notes de séance + outcome tracking PHQ-9/GAD-7 + facturation + IA clinique + paiement Stripe + espace patient - 100% HDS France.

Prix : 43€/mois à vie pour l'offre Fondateurs (15 places, ~10 restantes).

15 minutes cette semaine pour une démo ?

Cordialement,
Tony - Fondateur PsyLib
https://psylib.eu

P.S. Si ce n'est pas le bon moment, dans 4 jours je vous envoie un guide gratuit "RGPD & HDS pour psychologues" (12 pages).${footerText(unsub)}`;

  return { subject, html, text };
}

function template2(lead: Lead): { subject: string; html: string; text: string } {
  const fn = lead.firstName || 'Docteur';
  const unsub = unsubscribeUrl(lead.email);
  const subject = `${fn}, le guide RGPD/HDS que je vous avais promis`;
  const guideUrl =
    'https://psylib.eu/ressources/guide-rgpd-hds?utm_source=cold&utm_medium=email&utm_campaign=psy-hds-q2&utm_content=email2';

  const html = `<div style="${baseStyle()}">
<p>Bonjour ${fn},</p>
<p>Comme promis, voici le guide gratuit :</p>
<p style="margin:24px 0;"><a href="${guideUrl}" style="background:#3D52A0;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">📘 Télécharger le guide RGPD & HDS (12 pages)</a></p>
<p>Vous y trouverez :</p>
<ol style="padding-left:20px;">
  <li>Ce que dit exactement la loi (L.1111-8, RGPD, Code de déontologie)</li>
  <li>Les 7 obligations HDS concrètes pour un cabinet psy</li>
  <li>La checklist "mon logiciel est-il conforme ?"</li>
  <li>Les pièges fréquents (Drive, Doctolib, Excel…)</li>
  <li>Les sanctions CNIL récentes sur des professionnels de santé</li>
  <li>Le droit d'information patient et mentions légales</li>
  <li>Comment migrer sans douleur vers un outil conforme</li>
</ol>
<p>C'est gratuit, pas d'engagement. Téléchargez, lisez tranquillement.</p>
<p>Si après lecture vous voulez comparer PsyLib à votre solution actuelle, je reste disponible pour une démo de 20 minutes.</p>
<p>Bonne journée,<br />
<strong>Tony</strong><br />
PsyLib — <a href="https://psylib.eu" style="color:#3D52A0;">psylib.eu</a></p>
${footerHtml(unsub)}
</div>`;

  const text = `Bonjour ${fn},

Comme promis, le guide gratuit :

Guide RGPD & HDS pour psychologues libéraux (12 pages)
${guideUrl}

Vous y trouverez :
1. Ce que dit exactement la loi (L.1111-8, RGPD)
2. Les 7 obligations HDS concrètes pour un cabinet psy
3. La checklist "mon logiciel est-il conforme ?"
4. Les pièges fréquents (Drive, Doctolib, Excel…)
5. Sanctions CNIL récentes sur des professionnels de santé
6. Droit d'information patient et mentions légales
7. Guide de migration vers un outil conforme

Gratuit, sans engagement.

Bonne lecture,
Tony - PsyLib
https://psylib.eu${footerText(unsub)}`;

  return { subject, html, text };
}

function template3(lead: Lead): { subject: string; html: string; text: string } {
  const fn = lead.firstName || 'Docteur';
  const unsub = unsubscribeUrl(lead.email);
  const subject = `${fn}, je ne vous écrirai plus après ça`;
  const betaUrl =
    'https://psylib.eu/beta?utm_source=cold&utm_medium=email&utm_campaign=psy-hds-q2&utm_content=email3';

  const html = `<div style="${baseStyle()}">
<p>Bonjour ${fn},</p>
<p>Promis, c'est mon dernier email.</p>
<p>Rapide récap :</p>
<ul style="padding-left:20px;">
  <li><strong>PsyLib</strong> = logiciel tout-en-un pour psys libéraux (agenda + notes + facturation + IA + paiement + espace patient)</li>
  <li>100% conforme HDS (hébergement France + chiffrement AES-256-GCM applicatif)</li>
  <li>Alternative à Doctolib (139€+/mois) et aux 3-4 outils que vous cumulez probablement</li>
</ul>
<p><strong>Offre Fondateurs : 43€/mois garantis à vie</strong>, prix gelé même quand on passera à 69€/mois. Il reste 7 places sur 15.</p>
<p>Je ferme l'offre dans quelques jours.</p>
<p style="margin:24px 0;"><a href="${betaUrl}" style="background:#D97757;color:#fff;padding:12px 20px;border-radius:8px;text-decoration:none;display:inline-block;font-weight:600;">Candidater Fondateur (2 min) →</a></p>
<p>Si rien ne vous intéresse, c'est OK — désabonnez-vous sans culpabilité avec le lien en bas.</p>
<p>Bonne continuation dans votre pratique,<br />
<strong>Tony</strong><br />
Fondateur PsyLib — <a href="https://psylib.eu" style="color:#3D52A0;">psylib.eu</a></p>
${footerHtml(unsub)}
</div>`;

  const text = `Bonjour ${fn},

Promis, c'est mon dernier email.

PsyLib = logiciel tout-en-un pour psys libéraux, 100% HDS.
Offre Fondateurs : 43€/mois à vie, 7 places restantes sur 15.

Je ferme l'offre dans quelques jours.

Candidater directement (2 min) :
${betaUrl}

Bonne continuation,
Tony - Fondateur PsyLib
https://psylib.eu${footerText(unsub)}`;

  return { subject, html, text };
}

function getTemplate(touch: 1 | 2 | 3, lead: Lead): { subject: string; html: string; text: string } {
  if (touch === 1) return template1(lead);
  if (touch === 2) return template2(lead);
  return template3(lead);
}

// ============================================================================
// Resend API
// ============================================================================

interface ResendResponse {
  id?: string;
  message?: string;
  name?: string;
  statusCode?: number;
}

async function sendViaResend(
  to: string,
  subject: string,
  html: string,
  text: string,
  unsubUrl: string,
): Promise<{ ok: true; id: string } | { ok: false; error: string }> {
  if (!RESEND_API_KEY) {
    return { ok: false, error: 'RESEND_API_KEY not set' };
  }
  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: FROM_EMAIL,
        to: [to],
        subject,
        html,
        text,
        reply_to: REPLY_TO,
        headers: {
          'List-Unsubscribe': `<${unsubUrl}>, <mailto:unsubscribe@psylib.eu?subject=unsubscribe>`,
          'List-Unsubscribe-Post': 'List-Unsubscribe=One-Click',
          'X-Campaign': 'cold-2026-q2',
        },
      }),
    });
    const data = (await res.json()) as ResendResponse;
    if (!res.ok || !data.id) {
      return { ok: false, error: data.message || `HTTP ${res.status}` };
    }
    return { ok: true, id: data.id };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : 'unknown' };
  }
}

// ============================================================================
// Eligibility logic
// ============================================================================

function isEligible(
  lead: Lead,
  state: LeadState | undefined,
  unsubscribed: Set<string>,
  touch: 1 | 2 | 3,
): { eligible: boolean; reason?: string } {
  if (!lead.email || !lead.email.includes('@')) return { eligible: false, reason: 'email-invalid' };
  if (unsubscribed.has(lead.email)) return { eligible: false, reason: 'unsubscribed-list' };

  const s = state;
  if (s?.unsubscribed) return { eligible: false, reason: 'unsubscribed-state' };
  if (s?.bounced) return { eligible: false, reason: 'bounced' };
  if (s?.responded) return { eligible: false, reason: 'responded' };

  const touches = s?.touches || [];
  const alreadySent = touches.find((t) => t.n === touch && !t.error);
  if (alreadySent) return { eligible: false, reason: `already-sent-touch-${touch}` };

  if (touch === 1) return { eligible: true };

  // Touch 2 or 3 : require prior touch AND delay
  const touch1 = touches.find((t) => t.n === 1 && !t.error);
  if (!touch1) return { eligible: false, reason: 'no-touch-1' };

  const delay = TOUCH_DELAYS_DAYS[touch];
  const touch1Date = new Date(touch1.sentAt);
  const eligibleDate = new Date(touch1Date.getTime() + delay * 24 * 60 * 60 * 1000);
  if (new Date() < eligibleDate) {
    return { eligible: false, reason: `delay-not-reached (${delay}d after touch 1)` };
  }

  if (touch === 3) {
    // Also need touch 2 already sent (optional — skip if user wants to skip touch 2)
    const touch2 = touches.find((t) => t.n === 2 && !t.error);
    if (!touch2) return { eligible: false, reason: 'no-touch-2' };
  }

  return { eligible: true };
}

// ============================================================================
// Stats
// ============================================================================

function printStats(state: State, leads: Lead[], unsubscribed: Set<string>): void {
  const totalLeads = leads.length;
  let t1 = 0,
    t2 = 0,
    t3 = 0,
    errors = 0,
    unsubCount = 0,
    bounced = 0,
    responded = 0;
  for (const email of Object.keys(state)) {
    const s = state[email]!;
    for (const t of s.touches) {
      if (t.error) errors++;
      else if (t.n === 1) t1++;
      else if (t.n === 2) t2++;
      else if (t.n === 3) t3++;
    }
    if (s.unsubscribed) unsubCount++;
    if (s.bounced) bounced++;
    if (s.responded) responded++;
  }
  unsubCount = Math.max(unsubCount, unsubscribed.size);

  console.log('\n📊 Campaign Stats — PsyLib Cold 2026-Q2\n');
  console.log(`   Leads total (CSV)           : ${totalLeads.toLocaleString('fr-FR')}`);
  console.log(`   Leads contactés             : ${Object.keys(state).length.toLocaleString('fr-FR')}`);
  console.log(`   Touch 1 envoyés             : ${t1.toLocaleString('fr-FR')}`);
  console.log(`   Touch 2 envoyés             : ${t2.toLocaleString('fr-FR')}`);
  console.log(`   Touch 3 envoyés             : ${t3.toLocaleString('fr-FR')}`);
  console.log(`   Erreurs envoi               : ${errors.toLocaleString('fr-FR')}`);
  console.log(`   Bounces détectés            : ${bounced.toLocaleString('fr-FR')}`);
  console.log(`   Désabonnés                  : ${unsubCount.toLocaleString('fr-FR')}`);
  console.log(`   Ont répondu                 : ${responded.toLocaleString('fr-FR')}`);
  console.log('');
}

// ============================================================================
// CLI
// ============================================================================

function parseArgs(): SendArgs {
  const argv = process.argv.slice(2);
  const get = (flag: string): string | undefined => {
    const idx = argv.indexOf(flag);
    return idx >= 0 && idx + 1 < argv.length ? argv[idx + 1] : undefined;
  };
  const has = (flag: string): boolean => argv.includes(flag);

  const touchRaw = get('--touch');
  const touch = (touchRaw ? parseInt(touchRaw, 10) : 1) as 1 | 2 | 3;
  const maxRaw = get('--max');
  const max = maxRaw ? parseInt(maxRaw, 10) : 20;
  const dept = get('--dept');

  return {
    touch,
    max,
    dept,
    dryRun: has('--dry-run'),
    stats: has('--stats'),
  };
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function main() {
  const args = parseArgs();

  console.log('📧 PsyLib Cold Email Sender — 2026 Q2');
  console.log(`   From        : ${FROM_EMAIL}`);
  console.log(`   Reply-to    : ${REPLY_TO}`);
  console.log(`   Dry-run     : ${args.dryRun}`);
  console.log('');

  const leads = loadLeads(INPUT_CSV);
  const state = loadState();
  const unsubscribed = loadUnsubscribed();

  if (args.stats) {
    printStats(state, leads, unsubscribed);
    return;
  }

  if (!args.touch || ![1, 2, 3].includes(args.touch)) {
    console.error('❌ --touch doit être 1, 2 ou 3');
    process.exit(1);
  }

  if (!RESEND_API_KEY && !args.dryRun) {
    console.error('❌ RESEND_API_KEY manquant. Utiliser --dry-run pour tester.');
    process.exit(1);
  }

  if (UNSUBSCRIBE_SECRET === 'change-me-in-prod' && !args.dryRun) {
    console.error('❌ UNSUBSCRIBE_SECRET non défini. Exporte un secret fort avant envoi.');
    process.exit(1);
  }

  // Filter + build queue
  let filteredLeads = leads;
  if (args.dept) {
    filteredLeads = leads.filter((l) => l.departement === args.dept);
    console.log(`   Filtre département : ${args.dept} (${filteredLeads.length} leads)`);
  }

  const queue: Lead[] = [];
  const reasons: Record<string, number> = {};
  for (const lead of filteredLeads) {
    const { eligible, reason } = isEligible(lead, state[lead.email], unsubscribed, args.touch);
    if (eligible) {
      queue.push(lead);
      if (queue.length >= args.max) break;
    } else if (reason) {
      reasons[reason] = (reasons[reason] || 0) + 1;
    }
  }

  console.log(`   Queue éligible : ${queue.length} / ${args.max} max`);
  if (Object.keys(reasons).length > 0) {
    console.log('   Filtrés :');
    for (const [r, c] of Object.entries(reasons).sort((a, b) => b[1] - a[1]).slice(0, 5)) {
      console.log(`     ${r} : ${c}`);
    }
  }
  console.log('');

  if (queue.length === 0) {
    console.log('✅ Rien à envoyer.');
    return;
  }

  let sent = 0;
  let failed = 0;

  for (const lead of queue) {
    const { subject, html, text } = getTemplate(args.touch, lead);
    const unsub = unsubscribeUrl(lead.email);

    if (args.dryRun) {
      console.log(`[DRY] → ${lead.email} (${lead.firstName} ${lead.lastName}, ${lead.departement})`);
      console.log(`       Subject: ${subject}`);
      console.log(`       Preview: ${text.slice(0, 140).replace(/\n/g, ' ')}…`);
      console.log('');
      sent++;
      continue;
    }

    process.stdout.write(`→ ${lead.email.padEnd(45)} `);
    const result = await sendViaResend(lead.email, subject, html, text, unsub);

    const now = new Date().toISOString();
    const prev = state[lead.email] || { touches: [], updatedAt: now };
    const touchRecord: TouchRecord = {
      n: args.touch,
      sentAt: now,
      ...(result.ok ? { messageId: result.id } : { error: result.error }),
    };
    state[lead.email] = { ...prev, touches: [...prev.touches, touchRecord], updatedAt: now };

    if (result.ok) {
      console.log(`✓ ${result.id.slice(0, 12)}…`);
      sent++;
    } else {
      console.log(`✗ ${result.error}`);
      failed++;
    }

    logEvent({
      email: lead.email,
      touch: args.touch,
      ok: result.ok,
      messageId: result.ok ? result.id : null,
      error: result.ok ? null : result.error,
    });

    saveState(state);
    await sleep(SEND_INTERVAL_MS);
  }

  console.log('');
  console.log(`✅ Envoi terminé : ${sent} OK, ${failed} erreurs`);
  console.log('');
}

main().catch((err) => {
  console.error('❌ Erreur fatale :', err);
  process.exit(1);
});
