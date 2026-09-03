// Le tutoriel dessiné : le halo sur les cellules à toucher, et le bandeau qui
// dit ce qu'il y a à poser. Ne modifie jamais l'état.
//
// Rien à lire pour l'enfant : c'est l'image de la bulle du menu de
// construction qui est reprise telle quelle, et le halo qui dit où. Le mot est
// pour l'adulte assis à côté.

import {
  PALETTE, CELLULE, GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE, PIXEL,
  TEXTE_PETIT, TUTORIEL_BANDEAU,
} from '../design.js';
import { decalage, celluleVisible, fenetre } from '../camera.js';
import { coinCellule } from '../sim/grid.js';
import { dessinerMotCentre } from './texte.js';
import { dessinerPastille } from './sprites.js';

// Le halo bat lentement : il attire l'œil sans clignoter.
const PERIODE = 1.4; // secondes

export function dessinerHalo(ctx, etape, age) {
  if (!etape) return;
  const f = fenetre();
  const d = decalage();
  const battement = 0.5 + 0.5 * Math.sin((age / PERIODE) * Math.PI * 2);
  const epaisseur = PIXEL;

  ctx.save();
  ctx.beginPath();
  ctx.rect(GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE);
  ctx.clip();
  ctx.translate(-d.x, -d.y);
  ctx.fillStyle = PALETTE.creme;
  for (const c of etape.cibles) {
    if (!celluleVisible(c.cx, c.cy, f)) continue;
    const coin = coinCellule(c.cx, c.cy);
    // Le halo grossit un peu en battant : un cadre qui respire, pas un cadre
    // qui clignote — rien ne doit sembler cassé.
    const marge = Math.round(battement * 2) * PIXEL;
    const x = coin.x - marge;
    const y = coin.y - marge;
    const t = CELLULE + marge * 2;
    ctx.globalAlpha = 0.35 + 0.45 * battement;
    ctx.fillRect(x, y, t, epaisseur);
    ctx.fillRect(x, y + t - epaisseur, t, epaisseur);
    ctx.fillRect(x, y, epaisseur, t);
    ctx.fillRect(x + t - epaisseur, y, epaisseur, t);
  }
  ctx.globalAlpha = 1;
  ctx.restore();
}

export function dessinerBandeau(ctx, etape) {
  if (!etape) return;
  const b = TUTORIEL_BANDEAU;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(b.x, b.y, b.l, b.h);
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 1, b.y + 1, b.l - 2, b.h - 2);

  const taille = b.h - 12;
  dessinerPastille(ctx, etape.icone, b.x + 6, b.y + 6, taille);
  dessinerMotCentre(ctx, etape.nom, b.x + 6 + taille + 10, b.y + b.h / 2, TEXTE_PETIT, PALETTE.creme);
}
