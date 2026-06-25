// Capture la vidéo explicative complète PsyLib (explainer.html) en MP4 vertical 9:16.
import { createRequire } from 'node:module';
import { spawn } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';
import path from 'node:path';

const require = createRequire(import.meta.url);
const PW = process.env.PLAYWRIGHT_DIR ||
  'C:/Users/tonyr/OneDrive/Projet/PsyFlow/tmp/node_modules/playwright';
const { chromium } = require(PW);

const FFMPEG = process.env.FFMPEG ||
  'C:/Users/tonyr/AppData/Local/Microsoft/WinGet/Packages/Gyan.FFmpeg_Microsoft.Winget.Source_8wekyb3d8bbwe/ffmpeg-8.1.1-full_build/bin/ffmpeg.exe';
const W = 1080, H = 1920;
const FPS = Number(process.env.FPS || 30);

const here = path.dirname(fileURLToPath(import.meta.url));
const framesDir = path.join(here, 'frames-explainer');
const outDir = path.join(here, 'out-explainer');
fs.mkdirSync(outDir, { recursive: true });

const ff = (args) => new Promise((res, rej) => {
  const p = spawn(FFMPEG, args, { cwd: here });
  let err = ''; p.stderr.on('data', d => (err += d));
  p.on('close', c => (c === 0 ? res() : rej(new Error('ffmpeg ' + c + '\n' + err.slice(-600)))));
});

const browser = await chromium.launch();
const page = await browser.newPage({ viewport: { width: W, height: H }, deviceScaleFactor: 1 });
await page.goto('file:///' + path.join(here, 'explainer.html').replace(/\\/g, '/'));

await page.evaluate(() => document.fonts.ready);
await page.evaluate(() => Promise.all(
  Array.from(document.images).map(img => (img.complete ? Promise.resolve() : img.decode().catch(() => {})))
));
await page.waitForTimeout(600);

const TOTAL = await page.evaluate(() => window.TOTAL);
const N = Math.round(TOTAL * FPS);

fs.rmSync(framesDir, { recursive: true, force: true });
fs.mkdirSync(framesDir, { recursive: true });
for (let i = 0; i < N; i++) {
  await page.evaluate(t => window.render(t), i / FPS);
  const buf = await page.screenshot({ type: 'png', clip: { x: 0, y: 0, width: W, height: H } });
  fs.writeFileSync(path.join(framesDir, `frame-${String(i).padStart(4, '0')}.png`), buf);
  if (i % 60 === 0) console.log(`  frame ${i}/${N}`);
}
await browser.close();

const mp4 = path.join(outDir, 'explainer-v.mp4');
await ff(['-y', '-framerate', String(FPS), '-i', path.join('frames-explainer', 'frame-%04d.png'),
  '-c:v', 'libx264', '-pix_fmt', 'yuv420p', '-crf', '19', '-preset', 'medium', '-movflags', '+faststart', mp4]);
console.log(`explainer-v.mp4 (${TOTAL}s @ ${FPS}fps, ${N} frames) -> ${(fs.statSync(mp4).size / 1024 / 1024).toFixed(2)} MB`);
console.log(mp4);
