// La mini-carte : le monde entier dans le bandeau haut, à deux unités par
// cellule. Ne modifie jamais l'état — elle lit le monde et la caméra.
//
// Elle sert deux choses à la fois : ne pas se perdre dans neuf écrans, et y
// aller d'un doigt. Le cadre montre où est la fenêtre.

import { PALETTE, MINICARTE, MINICARTE_PAS, CELLULE } from '../design.js';
import { ITEMS } from '../data/items.js';
import { camera } from '../camera.js';
import { LARGEUR_VUE, HAUTEUR_VUE } from '../design.js';

const P = MINICARTE_PAS;

export function dessinerMiniCarte(ctx, monde) {
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(MINICARTE.x - 2, MINICARTE.y - 2, MINICARTE.l + 4, MINICARTE.h + 4);
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
    (LARGEUR_VUE / CELLULE) * P, (HAUTEUR_VUE / CELLULE) * P,
  );
}

// La cellule visée par un doigt posé sur la mini-carte.
export function celluleMiniCarte(p) {
  return {
    cx: Math.floor((p.x - MINICARTE.x) / P),
    cy: Math.floor((p.y - MINICARTE.y) / P),
  };
}
