// Le mur qui ferme un étage : sa rangée, sa réception, et ce qu'il y a
// derrière. Ne modifie jamais l'état — il lit le monde et la caméra.
//
// Trois choses à dire, et pas une de plus :
//
//   — **on ne passe pas** : une rangée de blocs, en ardoise, de la couleur de
//     ce qui est inerte. Rien qui ressemble à une machine, rien qui s'allume ;
//   — **on est passé par là** : un mur ouvert reste debout, et les trois cases
//     de son ancienne réception deviennent ses connecteurs — des bouts de
//     convoyeur rouges, dessinés comme tous les tapis, par où la chaîne d'en
//     bas monte. Le mur ne les dessine pas : il se contente de leur laisser
//     leurs cases ;
//   — **il y a quelque chose derrière** : au-dessus du mur, le monde est
//     éteint. On voit qu'il y a un étage là sans savoir encore ce qu'il donne,
//     exactement comme le livre des matières montre ses silhouettes ;
//   — **voilà où porter, et voilà ce qu'il veut** : trois cases creusées au
//     milieu du mur, avec la matière réclamée et une jauge qui se remplit.
//     C'est une machine de la scène : on y trace un tapis comme ailleurs.
//
// Le mur fait quarante-deux cases et la fenêtre en montre sept : sa réception
// est donc presque toujours hors de vue. Une **flèche au bord de la zone
// sûre** dit alors de quel côté elle est — c'est le seul repère du jeu qui
// désigne un endroit du monde depuis l'écran.

import {
  PALETTE, CELLULE, PIXEL, TUILE_PX, COLONNES, LARGEUR_VUE, HAUTEUR_VUE,
  GRILLE_X, GRILLE_Y, ZONE_SURE,
} from '../design.js';
import { coinCellule, centreCellule } from '../sim/grid.js';
import {
  murCourant, mursPoses, cellulesPassage, avancementMur, recepteurDuMur,
} from '../sim/mur.js';
import { versEcran } from '../camera.js';
import { spriteItem } from './sprites.js';

// Ce que le monde fermé garde de lumière. Assez pour qu'on distingue les
// biomes de l'étage suivant — c'est ce qui donne envie d'y monter — et pas
// assez pour qu'on l'y confonde avec ce qui est ouvert.
const ETEINT = 0.62;

// Une tuile de mur, peinte une fois. Des blocs décalés d'une assise à
// l'autre : c'est ce qui fait lire un mur plutôt qu'une grille.
export const tuileMur = (() => {
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

  // Ce qui est derrière s'éteint. Une seule plaque de noir : le sol continue
  // dessous, et on le devine. Seul le mur qui nous arrête éteint quelque
  // chose — ceux qu'on a ouverts ne cachent plus rien.
  if (mur && f.cy0 < mur.cy) {
    const haut = coinCellule(0, f.cy0);
    ctx.fillStyle = PALETTE.noir;
    ctx.globalAlpha = ETEINT;
    ctx.fillRect(haut.x, haut.y, COLONNES * CELLULE, (mur.cy - f.cy0) * CELLULE);
    ctx.globalAlpha = 1;
  }

  for (const pose of mursPoses(monde)) {
    if (pose.cy < f.cy0 || pose.cy > f.cy1) continue;
    const passage = new Set(cellulesPassage(pose.cy).map((c) => c.cx));
    for (let cx = f.cx0; cx <= f.cx1; cx++) {
      if (passage.has(cx)) continue;
      const coin = coinCellule(cx, pose.cy);
      ctx.drawImage(tuileMur, coin.x, coin.y, CELLULE, CELLULE);
    }
  }

  const recepteur = recepteurDuMur(monde);
  if (recepteur) dessinerRecepteur(ctx, monde, recepteur);
}

// --- la réception ----------------------------------------------------------

const IMAGE = 18;            // la matière : neuf pixels d'art à l'échelle 2
const JAUGE = { h: 10 };
const MARGE = 8;

// Trois cases creusées dans le mur : un fond noir, une arête d'ardoise, la
// matière réclamée et sa jauge. Les chevrons du bas disent par où ça entre —
// c'est la seule chose qu'un enfant a besoin de comprendre ici.
function dessinerRecepteur(ctx, monde, recepteur) {
  const cellules = [...recepteur.cellules].sort((a, b) => a.cx - b.cx);
  const coin = coinCellule(cellules[0].cx, cellules[0].cy);
  const l = cellules.length * CELLULE;

  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(coin.x, coin.y, l, CELLULE);
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(coin.x, coin.y, l, PIXEL);
  ctx.fillRect(coin.x, coin.y + CELLULE - PIXEL, l, PIXEL);

  // Un mur sans seuil ne réclame rien : sa réception n'a ni matière ni jauge.
  // Elle achète, et c'est tout ce qu'elle a à dire — le jeu s'arrête là, et ça
  // se voit à ce qu'elle ne demande rien.
  const image = spriteItem(recepteur.item);
  if (image) {
    ctx.drawImage(image, coin.x + MARGE, coin.y + (CELLULE - IMAGE) / 2, IMAGE, IMAGE);
    const jx = coin.x + MARGE + IMAGE + MARGE;
    const jl = l - (jx - coin.x) - MARGE;
    const jy = coin.y + (CELLULE - JAUGE.h) / 2;
    ctx.fillStyle = PALETTE.profond;
    ctx.fillRect(jx, jy, jl, JAUGE.h);
    ctx.fillStyle = PALETTE.vert;
    ctx.fillRect(jx, jy, Math.round(jl * avancementMur(monde) / PIXEL) * PIXEL, JAUGE.h);
  }

  // Par où ça entre : trois chevrons qui montent, sur le bord du bas.
  ctx.fillStyle = PALETTE.brume;
  for (const c of cellules) {
    const centre = coinCellule(c.cx, c.cy).x + CELLULE / 2;
    for (let i = 0; i < 3; i++) {
      ctx.fillRect(centre - PIXEL * (i + 1), coin.y + CELLULE - PIXEL * (2 + i), PIXEL, PIXEL);
      ctx.fillRect(centre + PIXEL * i, coin.y + CELLULE - PIXEL * (2 + i), PIXEL, PIXEL);
    }
  }
}

// --- la flèche -------------------------------------------------------------

// Dessinée en unités d'écran, hors du cadre du monde : elle appartient à
// l'incrustation, pas à la carte. Elle ne sort donc jamais de la zone sûre.
const FLECHE = { taille: 14, marge: 20, ecart: 6 };

export function dessinerRepereMur(ctx, monde) {
  const recepteur = recepteurDuMur(monde);
  if (!recepteur) return;

  const cible = versEcran(centreCellule(recepteur.cx, recepteur.cy));
  const zone = {
    x0: GRILLE_X + FLECHE.marge,
    y0: GRILLE_Y + ZONE_SURE.haut + FLECHE.marge,
    x1: GRILLE_X + LARGEUR_VUE - FLECHE.marge,
    y1: GRILLE_Y + HAUTEUR_VUE - ZONE_SURE.bas - FLECHE.marge,
  };
  // Elle est sous les yeux : rien à montrer.
  if (cible.x >= zone.x0 && cible.x <= zone.x1 && cible.y >= zone.y0 && cible.y <= zone.y1) return;

  const x = Math.max(zone.x0, Math.min(zone.x1, cible.x));
  const y = Math.max(zone.y0, Math.min(zone.y1, cible.y));
  const dx = cible.x - x;
  const dy = cible.y - y;
  const norme = Math.hypot(dx, dy) || 1;
  const ux = dx / norme;
  const uy = dy / norme;

  // La matière derrière la pointe : la flèche dit où, l'image dit quoi.
  const image = spriteItem(recepteur.item);
  if (image) {
    ctx.drawImage(
      image,
      Math.round(x - ux * (FLECHE.taille + FLECHE.ecart + IMAGE / 2) - IMAGE / 2),
      Math.round(y - uy * (FLECHE.taille + FLECHE.ecart + IMAGE / 2) - IMAGE / 2),
      IMAGE, IMAGE,
    );
  }

  ctx.save();
  ctx.translate(x, y);
  ctx.rotate(Math.atan2(uy, ux));
  ctx.fillStyle = PALETTE.creme;
  ctx.beginPath();
  ctx.moveTo(FLECHE.taille / 2, 0);
  ctx.lineTo(-FLECHE.taille / 2, -FLECHE.taille / 2);
  ctx.lineTo(-FLECHE.taille / 2, FLECHE.taille / 2);
  ctx.closePath();
  ctx.fill();
  ctx.restore();
}
