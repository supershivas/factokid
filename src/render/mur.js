// Le mur qui ferme un étage : sa rangée, ce qu'il y a derrière, et ce qu'il
// demande. Ne modifie jamais l'état — il lit le monde et la caméra.
//
// Trois choses à dire, et pas une de plus :
//
//   — **on ne passe pas** : une rangée de blocs, en ardoise, de la couleur de
//     ce qui est inerte. Rien qui ressemble à une machine, rien qui s'allume ;
//   — **il y a quelque chose derrière** : au-dessus du mur, le monde est
//     éteint. On voit qu'il y a un étage là sans savoir encore ce qu'il donne,
//     exactement comme le livre des matières montre ses silhouettes ;
//   — **voilà ce qu'il veut** : la matière qu'il réclame, et une jauge qui se
//     remplit. Un enfant regarde la jauge monter, il n'a pas à lire un compte.
//
// La plaque suit le milieu de l'écran : le mur fait quarante-deux cases de
// large et la fenêtre en montre sept — une jauge posée une fois pour toutes
// serait hors de vue neuf fois sur dix.

import { PALETTE, CELLULE, PIXEL, TUILE_PX, COLONNES } from '../design.js';
import { coinCellule } from '../sim/grid.js';
import { murCourant, avancementMur } from '../sim/mur.js';
import { camera, vue } from '../camera.js';
import { spriteItem } from './sprites.js';

// Ce que le monde fermé garde de lumière. Assez pour qu'on distingue les
// biomes de l'étage suivant — c'est ce qui donne envie d'y monter — et pas
// assez pour qu'on l'y confonde avec ce qui est ouvert.
const ETEINT = 0.62;

// Une tuile de mur, peinte une fois. Des blocs décalés d'une assise à
// l'autre : c'est ce qui fait lire un mur plutôt qu'une grille.
const tuileMur = (() => {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  g.fillStyle = PALETTE.profond;
  g.fillRect(0, 0, TUILE_PX, TUILE_PX);
  g.fillStyle = PALETTE.ardoise;
  // Trois assises de huit pixels, un joint d'un pixel, et le décalage d'une
  // demi-brique une assise sur deux.
  for (let a = 0; a < 3; a++) {
    const y = a * 8;
    const decale = a % 2 === 0 ? 0 : -6;
    for (let x = decale; x < TUILE_PX; x += 12) {
      g.fillRect(Math.max(0, x), y, Math.min(11, TUILE_PX - Math.max(0, x)), 7);
    }
  }
  // L'arête du haut : c'est par là qu'on voudrait passer, et c'est elle qu'on
  // voit en arrivant au pied du mur.
  g.fillStyle = PALETTE.brume;
  g.fillRect(0, 0, TUILE_PX, 1);
  return c;
})();

export function dessinerMur(ctx, monde, f) {
  const mur = murCourant(monde);
  if (!mur) return;

  // Ce qui est derrière s'éteint. Une seule plaque de noir : le sol continue
  // dessous, et on le devine.
  if (f.cy0 < mur.cy) {
    const haut = coinCellule(0, f.cy0);
    ctx.fillStyle = PALETTE.noir;
    ctx.globalAlpha = ETEINT;
    ctx.fillRect(haut.x, haut.y, COLONNES * CELLULE, (mur.cy - f.cy0) * CELLULE);
    ctx.globalAlpha = 1;
  }

  if (mur.cy < f.cy0 || mur.cy > f.cy1) return;
  for (let cx = f.cx0; cx <= f.cx1; cx++) {
    const coin = coinCellule(cx, mur.cy);
    ctx.drawImage(tuileMur, coin.x, coin.y, CELLULE, CELLULE);
  }
  if (mur.etage.mur) dessinerDemande(ctx, monde, mur);
}

// Ce que le mur demande, posé sur lui, au milieu de ce qu'on regarde.
const PLAQUE = { l: 96, h: 28 };
const IMAGE = 18;   // la matière, à l'échelle 2 : neuf pixels d'art en font 18
const JAUGE = { l: 54, h: 8 };

function dessinerDemande(ctx, monde, mur) {
  const milieu = camera.x + vue().l / 2;
  const coin = coinCellule(0, mur.cy);
  // Sur la grille du pixel d'art : une plaque à cheval sur deux pixels serait
  // floue à l'endroit précis où l'œil s'arrête.
  const x = Math.round((milieu - PLAQUE.l / 2) / PIXEL) * PIXEL;
  const y = coin.y + (CELLULE - PLAQUE.h) / 2;

  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(x, y, PLAQUE.l, PLAQUE.h);

  const image = spriteItem(mur.etage.mur.item);
  if (image) ctx.drawImage(image, x + 6, y + (PLAQUE.h - IMAGE) / 2, IMAGE, IMAGE);

  const jx = x + 30;
  const jy = y + (PLAQUE.h - JAUGE.h) / 2;
  ctx.fillStyle = PALETTE.profond;
  ctx.fillRect(jx, jy, JAUGE.l, JAUGE.h);
  ctx.fillStyle = PALETTE.vert;
  const part = avancementMur(monde);
  ctx.fillRect(jx, jy, Math.round(JAUGE.l * part / PIXEL) * PIXEL, JAUGE.h);
}
