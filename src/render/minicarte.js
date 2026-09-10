// La mini-carte : le monde ouvert dans le voile du haut, à une unité par
// cellule. Ne modifie jamais l'état — elle lit le monde et la caméra.
//
// Elle sert deux choses à la fois : ne pas se perdre dans trente-six écrans,
// et y aller d'un doigt. Le cadre montre où est la fenêtre.
//
// **Elle ne montre que la partie en cours.** Elle éteignait les étages fermés
// pour en garder la silhouette ; une silhouette dit « il y a quelque chose
// là », et c'est déjà ce que dit le mur, qu'on a sous les yeux. Deux façons de
// dire la même chose à un enfant, c'est une de trop. Elle commence donc à la
// taille d'un étage et **grandit à chaque mur qui tombe** : c'est elle, la
// barre de progression du jeu entier — non plus un voile qui se retire, mais
// une carte qui s'allonge.

import { PALETTE, MINICARTE, MINICARTE_PAS, CELLULE, COLONNES, LIGNES } from '../design.js';
import { ITEMS } from '../data/items.js';
import { camera, vue } from '../camera.js';
import { teinteSol } from './biome.js';
import { murCourant } from '../sim/mur.js';

const P = MINICARTE_PAS;

// Le fond de la mini-carte : les teintes des biomes, peintes une fois pour
// toutes sur une image d'une cellule par pixel, puis affichée à l'échelle.
let fond = null;

// Le fond est celui d'une carte : quand une autre commence, il ne vaut plus
// rien. main.js le dit au moment où le monde est bâti.
export function oublierMiniCarte() {
  fond = null;
}

function preparerFond() {
  const c = document.createElement('canvas');
  c.width = COLONNES;
  c.height = LIGNES;
  const g = c.getContext('2d');
  for (let cy = 0; cy < LIGNES; cy++) {
    for (let cx = 0; cx < COLONNES; cx++) {
      g.fillStyle = teinteSol(cx, cy);
      g.fillRect(cx, cy, 1, 1);
    }
  }
  return c;
}

// Le cadre de la mini-carte : sa place à l'écran, et la première rangée du
// monde qu'elle montre. Elle est accrochée par le haut du voile et descend
// d'autant de rangées qu'on en a ouvertes.
export function cadreMiniCarte(monde) {
  const mur = monde ? murCourant(monde) : null;
  const cy0 = mur ? mur.cy : 0;
  return {
    x: MINICARTE.x, y: MINICARTE.y, l: MINICARTE.l,
    h: (LIGNES - cy0) * P,
    cy0,
  };
}

export function dessinerMiniCarte(ctx, monde) {
  if (!fond) fond = preparerFond();
  const cadre = cadreMiniCarte(monde);
  const { x, y, l, h, cy0 } = cadre;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(x - 2, y - 2, l + 4, h + 4);
  ctx.drawImage(fond, 0, cy0, COLONNES, LIGNES - cy0, x, y, l, h);
  ctx.strokeStyle = PALETTE.ardoise;
  ctx.lineWidth = 1;
  ctx.strokeRect(x - 1.5, y - 1.5, l + 3, h + 3);

  // Les gisements d'abord : ce sont eux qu'on cherche.
  for (const g of monde.gisements) {
    if (g.cy < cy0) continue;
    ctx.fillStyle = g.present ? PALETTE[ITEMS[g.item].couleur] : PALETTE.ardoise;
    ctx.fillRect(x + g.cx * P, y + (g.cy - cy0) * P, P, P);
  }

  // Puis ce qu'on a bâti : les tapis en gris, les machines en clair.
  ctx.fillStyle = PALETTE.ardoise;
  for (const convoyeur of monde.scene.convoyeurs) {
    for (const c of convoyeur.chemin) {
      if (c.cy < cy0) continue;
      ctx.fillRect(x + c.cx * P, y + (c.cy - cy0) * P, P, P);
    }
  }
  ctx.fillStyle = PALETTE.creme;
  for (const m of monde.scene.machines) {
    for (const c of m.cellules || [m]) {
      if (c.cy < cy0) continue;
      ctx.fillRect(x + c.cx * P, y + (c.cy - cy0) * P, P, P);
    }
  }

  // Le cadre de la fenêtre : où l'on regarde, dans tout ça. La caméra déborde
  // du monde en haut et en bas — c'est ce qui permet d'aller regarder sa
  // première et sa dernière rangée — mais le cadre, lui, reste dans la carte :
  // il dit ce qu'on voit *du monde*, et il n'y a rien à montrer au-delà.
  const v = vue();
  const x0 = Math.max(0, Math.min(COLONNES, camera.x / CELLULE));
  const y0 = Math.max(cy0, Math.min(LIGNES, camera.y / CELLULE));
  const x1 = Math.max(0, Math.min(COLONNES, (camera.x + v.l) / CELLULE));
  const y1 = Math.max(cy0, Math.min(LIGNES, (camera.y + v.h) / CELLULE));
  ctx.strokeStyle = PALETTE.creme;
  ctx.strokeRect(
    x + Math.round(x0 * P) + 0.5,
    y + Math.round((y0 - cy0) * P) + 0.5,
    Math.round((x1 - x0) * P), Math.round((y1 - y0) * P),
  );
}

// La cellule visée par un doigt posé sur la mini-carte.
export function celluleMiniCarte(p, monde) {
  const cadre = cadreMiniCarte(monde);
  return {
    cx: Math.floor((p.x - cadre.x) / P),
    cy: cadre.cy0 + Math.floor((p.y - cadre.y) / P),
  };
}
