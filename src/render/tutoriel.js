// Le tutoriel dessiné : le halo sur les cellules à toucher, et le bandeau qui
// dit ce qu'il y a à poser. Ne modifie jamais l'état.
//
// Rien à lire pour l'enfant : c'est l'image de la bulle du menu de
// construction qui est reprise telle quelle, et le halo qui dit où. Le mot est
// pour l'adulte assis à côté.

import {
  PALETTE, CELLULE, GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE, PIXEL,
  TEXTE_PETIT, TUTORIEL_BANDEAU, rectPasserTuto,
} from '../design.js';
import { cadrerMonde, celluleVisible, fenetre } from '../camera.js';
import { coinCellule } from '../sim/grid.js';
import { dessinerMotCentre } from './texte.js';
import { dessinerPastille, INTERFACE } from './sprites.js';
import { dessinerTouche, SOMBRE } from './plaque.js';
import { enfoncement } from './bouton.js';

// Le halo bat lentement : il attire l'œil sans clignoter.
const PERIODE = 1.4; // secondes

export function dessinerHalo(ctx, etape, age) {
  if (!etape) return;
  const f = fenetre();
  const battement = 0.5 + 0.5 * Math.sin((age / PERIODE) * Math.PI * 2);
  const epaisseur = PIXEL;

  // Le halo vit dans le monde comme la scène : même cadre, donc même échelle.
  cadrerMonde(ctx);
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

// `part` dit où l'on en est, de 0 à 1 : le tutoriel a une fin, et la barre
// la montre. Sans elle, on ne saurait pas s'il en reste deux gestes ou vingt.
export function dessinerBandeau(ctx, etape, part) {
  if (!etape) return;
  const b = TUTORIEL_BANDEAU;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(b.x, b.y, b.l, b.h);
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 1, b.y + 1, b.l - 2, b.h - 2);

  const taille = b.h - 16;
  dessinerPastille(ctx, etape.icone, b.x + 6, b.y + 8, taille);
  // Le mot s'arrête avant le bouton qui passe : il ne passe jamais dessous.
  dessinerMotCentre(
    ctx, etape.nom, b.x + 6 + taille + 10, b.y + b.h / 2 - 3, TEXTE_PETIT, PALETTE.creme,
  );

  // La barre d'avancement, tout en bas du bandeau : deux pixels d'art.
  const marge = 6;
  const large = b.l - marge * 2;
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(b.x + marge, b.y + b.h - 8, large, PIXEL);
  ctx.fillStyle = PALETTE.creme;
  ctx.fillRect(b.x + marge, b.y + b.h - 8, Math.round(large * part), PIXEL);

  // Passer : on ne guide plus, et la carte reste telle qu'elle est.
  dessinerTouche(ctx, rectPasserTuto(), INTERFACE.menuFermer, {
    teinte: SOMBRE,
    enfonce: enfoncement('passer'),
  });
}
