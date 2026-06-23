// Génère les 10 cartes en PNG STATIQUE (état révélé) avec le nouveau logo.
// Réutilise le même template/données que l'animation -> rendu identique, logo à jour.
import { chromium } from 'playwright';
import fs from 'node:fs';
import path from 'node:path';
import { CARDS } from './cards.mjs';

const SZ = Number(process.env.SZ || 1080);
const root = path.resolve('.');
const outDir = path.join(root, 'static-out');
fs.mkdirSync(outDir, { recursive: true });

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: SZ, height: SZ }, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(root, 'card.html').replace(/\\/g, '/'));
await page.evaluate((s) => {
  const st = document.getElementById('stage');
  st.style.transform = `scale(${s})`;
  st.style.transformOrigin = 'top left';
  document.body.style.width = (1080 * s) + 'px';
  document.body.style.height = (1080 * s) + 'px';
}, SZ / 1080);

const T = await page.evaluate(() => window.TOTAL); // état final = tout révélé
let first = true;
for (const card of CARDS) {
  await page.evaluate((c) => window.buildCard(c), card);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {})))));
  if (first) { await page.waitForTimeout(500); first = false; }
  await page.evaluate((t) => window.render(t), T);
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: SZ, height: SZ } });
  fs.writeFileSync(path.join(outDir, `card-${card.id}.png`), buf);
  console.log(`static card-${card.id} (${card.style})`);
}
await browser.close();
console.log('DONE static');
