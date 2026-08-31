// Capture les deux cibles d'affichage, toujours ensemble.
// Usage : node outils/captures.mjs <dossier de sortie> [secondes d'attente]
//
// Sert un serveur statique local, trace un convoyeur au pointeur depuis le
// producteur jusqu'au consommateur, puis capture mobile et aperçu desktop.

import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { extname, join, normalize } from 'node:path';
import pw from '/opt/node22/lib/node_modules/playwright/index.js';

const RACINE = new URL('..', import.meta.url).pathname;
const SORTIE = process.argv[2] || '.';
const ATTENTE = Number(process.argv[3] || 3) * 1000;
const PORT = 8123;

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css' };

const serveur = createServer(async (req, res) => {
  const chemin = join(RACINE, normalize(decodeURI(req.url.split('?')[0])));
  try {
    const corps = await readFile(chemin);
    res.writeHead(200, { 'content-type': TYPES[extname(chemin)] || 'application/octet-stream' });
    res.end(corps);
  } catch {
    res.writeHead(404).end();
  }
});
await new Promise((r) => serveur.listen(PORT, r));

const navigateur = await pw.chromium.launch({ executablePath: '/opt/pw-browsers/chromium' });

async function capturer(nom, page, url) {
  await page.goto(`http://127.0.0.1:${PORT}/${url}`);
  await page.waitForTimeout(400);
  const geo = await page.evaluate(() => {
    const c = document.getElementById('jeu');
    const r = c.getBoundingClientRect();
    return { left: r.left, top: r.top, echelle: c.width / 360 };
  });
  const centre = (cx, cy) => ({
    x: geo.left + (12 + cx * 48 + 24) * geo.echelle,
    y: geo.top + (80 + cy * 48 + 24) * geo.echelle,
  });

  // Serpentin : toutes les cellules libres, du producteur au consommateur.
  const chemin = [];
  for (let cx = 0; cx < 7; cx++) {
    for (let i = 0; i < 10; i++) {
      const cy = cx % 2 === 0 ? i : 9 - i;
      if ((cx === 0 && cy === 0) || (cx === 6 && cy === 9)) continue;
      chemin.push({ cx, cy });
    }
  }
  const depart = centre(0, 0);
  await page.mouse.move(depart.x, depart.y);
  await page.mouse.down();
  for (const c of chemin) { const p = centre(c.cx, c.cy); await page.mouse.move(p.x, p.y); }
  const arrivee = centre(6, 9);
  await page.mouse.move(arrivee.x, arrivee.y);
  await page.mouse.up();

  await page.waitForTimeout(ATTENTE);
  await page.screenshot({ path: join(SORTIE, nom) });
  console.log(nom, '— échelle ×' + geo.echelle);
}

const mobile = await navigateur.newPage({
  viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, isMobile: true, hasTouch: true,
});
await capturer('mobile.png', mobile, 'index.html');

const desktop = await navigateur.newPage({ viewport: { width: 1200, height: 900 }, deviceScaleFactor: 1 });
await capturer('apercu-desktop.png', desktop, 'preview.html');

await navigateur.close();
serveur.close();
