// Génère les cartes animées : capture 1080p via Playwright -> MP4 (H.264) + GIF (palette ffmpeg).
// Usage : node generate.mjs            (les 10)
//         ONLY=02,04 node generate.mjs (sous-ensemble)
import { chromium } from 'playwright';
import { spawn } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { CARDS } from './cards.mjs';

const FFMPEG = process.env.FFMPEG ||
  'C:/Users/tonyr/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe';
const SZ = Number(process.env.SZ || 1080);
const FPS = Number(process.env.FPS || 30);
const GIF_SZ = Number(process.env.GIF_SZ || 540);
const GIF_FPS = Number(process.env.GIF_FPS || 16);
const only = (process.env.ONLY || '').split(',').map((s) => s.trim()).filter(Boolean);

const root = path.resolve('.');
const framesDir = path.join(root, 'frames');
const outDir = path.join(root, 'out');
fs.mkdirSync(outDir, { recursive: true });

const ff = (args) => new Promise((res, rej) => {
  const p = spawn(FFMPEG, args, { cwd: root });
  let err = '';
  p.stderr.on('data', (d) => (err += d));
  p.on('close', (c) => (c === 0 ? res() : rej(new Error('ffmpeg exit ' + c + '\n' + err.slice(-600)))));
});

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

const TOTAL = await page.evaluate(() => window.TOTAL);
const N = Math.round(TOTAL * FPS);
let first = true;

for (const card of CARDS) {
  if (only.length && !only.includes(card.id)) continue;
  await page.evaluate((c) => window.buildCard(c), card);
  await page.evaluate(() => document.fonts.ready);
  await page.evaluate(() => Promise.all(Array.from(document.images).map((img) => (img.complete ? Promise.resolve() : img.decode().catch(() => {})))));
  if (first) { await page.waitForTimeout(500); first = false; }

  fs.rmSync(framesDir, { recursive: true, force: true });
  fs.mkdirSync(framesDir, { recursive: true });
  for (let i = 0; i < N; i++) {
    await page.evaluate((t) => window.render(t), i / FPS);
    const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: SZ, height: SZ } });
    fs.writeFileSync(path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`), buf);
  }

  const mp4 = path.join(outDir, `card-${card.id}.mp4`);
  const gif = path.join(outDir, `card-${card.id}.gif`);
  // MP4 H.264
  await ff(['-y', '-framerate', String(FPS), '-i', 'frames/frame-%04d.png',
    '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '18', '-preset', 'medium', '-movflags', '+faststart', mp4]);
  // GIF : palette dédiée (2 passes) pour des dégradés propres
  await ff(['-y', '-framerate', String(FPS), '-i', 'frames/frame-%04d.png',
    '-vf', `fps=${GIF_FPS},scale=${GIF_SZ}:-1:flags=lanczos,palettegen=stats_mode=diff`, 'palette.png']);
  await ff(['-y', '-framerate', String(FPS), '-i', 'frames/frame-%04d.png', '-i', 'palette.png',
    '-filter_complex', `fps=${GIF_FPS},scale=${GIF_SZ}:-1:flags=lanczos[x];[x][1:v]paletteuse=dither=sierra2_4a`, gif]);

  const mb = (fs.statSync(mp4).size / 1024 / 1024).toFixed(2);
  const gmb = (fs.statSync(gif).size / 1024 / 1024).toFixed(2);
  console.log(`card-${card.id} (${card.style}) -> mp4 ${mb} MB | gif ${gmb} MB`);
}

await browser.close();
console.log('DONE');
