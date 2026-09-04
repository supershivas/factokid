// La mini-carte : le monde entier dans le bandeau haut, à deux unités par
// cellule. Ne modifie jamais l'état — elle lit le monde et la caméra.
//
// Elle sert deux choses à la fois : ne pas se perdre dans neuf écrans, et y
// aller d'un doigt. Le cadre montre où est la fenêtre.

import { PALETTE, MINICARTE, MINICARTE_PAS, CELLULE, COLONNES, LIGNES } from '../design.js';
import { ITEMS } from '../data/items.js';
import { camera, vue } from '../camera.js';
import { teinteSol } from './biome.js';
import { LARGEUR_VUE, HAUTEUR_VUE } from '../design.js';

const P = MINICARTE_PAS;

// Le fond de la mini-carte : les teintes des biomes, peintes une fois pour
// toutes sur une image d'une cellule par pixel, puis affichée à l'échelle.
let fond = null;

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

export function dessinerMiniCarte(ctx, monde) {
  if (!fond) fond = preparerFond();
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(MINICARTE.x - 2, MINICARTE.y - 2, MINICARTE.l + 4, MINICARTE.h + 4);
  ctx.drawImage(fond, MINICARTE.x, MINICARTE.y, MINICARTE.l, MINICARTE.h);
  ctx.strokeStyle = PALETTE.ardoise;
  ctx.lineWidth = 1;
  ctx.strokeRect(MINICARTE.x - 1.5, MINICARTE.y - 1.5, MINICARTE.l + 3, MINICARTE.h + 3);

  // Les gisements d'abord : ce sont eux qu'on cherche.
  for (const g of monde.gisements) {
    ctx.fillStyle = g.present ? PALETTE[ITEMS[g.item].couleur] : PALETTE.ardoise;
    ctx.fillRect(MINICARTE.x + g.cx * P, MINICARTE.y + g.cy * P, P, P);
  }

  // Puis ce qu'on a bâti : les tapis en gris, les machines en clair.
  ctx.fillStyle = PALETTE.ardoise;
  for (const convoyeur of monde.scene.convoyeurs) {
    for (const c of convoyeur.chemin) {
      ctx.fillRect(MINICARTE.x + c.cx * P, MINICARTE.y + c.cy * P, P, P);
    }
  }
  ctx.fillStyle = PALETTE.creme;
  for (const m of monde.scene.machines) {
    ctx.fillRect(MINICARTE.x + m.cx * P, MINICARTE.y + m.cy * P, P, P);
  }

  // Le cadre de la fenêtre : où l'on regarde, dans tout ça.
  ctx.strokeStyle = PALETTE.creme;
  ctx.strokeRect(
    MINICARTE.x + Math.round(camera.x / CELLULE * P) + 0.5,
    MINICARTE.y + Math.round(camera.y / CELLULE * P) + 0.5,
    // Le cadre grandit quand on recule : c'est bien plus de monde qu'on voit.
    (vue().l / CELLULE) * P, (vue().h / CELLULE) * P,
  );
}

// La cellule visée par un doigt posé sur la mini-carte.
export function celluleMiniCarte(p) {
  return {
    cx: Math.floor((p.x - MINICARTE.x) / P),
    cy: Math.floor((p.y - MINICARTE.y) / P),
  };
}
