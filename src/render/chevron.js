// Les chevrons d'un convoyeur : ils défilent à la vitesse du tapis, et une
// onde de lumière court par-dessus. Pure présentation — la simulation ne sait
// rien de ce module, et ce module ne modifie jamais la scène.
//
// Un tapis bouché fige ses chevrons : montrer un mouvement là où plus rien ne
// circule serait mentir à l'enfant, alors que la bulle « !!! » lui dit
// justement le contraire.

import { PALETTE, CELLULE, PIXEL } from '../design.js';
import { MACHINES } from '../data/machines.js';
import { pointA } from '../sim/belt.js';

const ESPACEMENT = CELLULE / 2;      // un chevron toutes les demi-cellules
const ONDE = CELLULE * 3;            // distance entre deux crêtes de lumière
const ECLAT = CELLULE / 2;           // largeur de la crête
const VITESSE_ONDE = 2.4;            // la lumière court plus vite que le tapis

// Distance parcourue par le motif de chaque tapis. Une WeakMap : un tapis
// détruit emporte sa phase avec lui.
const parcours = new WeakMap();

export function majChevrons(scene, dt) {
  for (const convoyeur of scene.convoyeurs) {
    const avance = convoyeur.bloque > 0 ? 0 : MACHINES.convoyeur.vitesse * dt;
    parcours.set(convoyeur, (parcours.get(convoyeur) || 0) + avance);
  }
}

// Le sens local du tapis à cette distance, en quarts de tour depuis l'est.
function quartsA(convoyeur, d) {
  const a = pointA(convoyeur, Math.max(0, d - 1));
  const b = pointA(convoyeur, Math.min(convoyeur.longueur, d + 1));
  if (Math.abs(b.x - a.x) >= Math.abs(b.y - a.y)) return b.x >= a.x ? 0 : 2;
  return b.y >= a.y ? 1 : 3;
}

// Arrondi au pixel d'art : les chevrons glissent d'un pixel entier à la fois,
// jamais entre deux.
const auPixel = (v) => Math.round(v / PIXEL) * PIXEL;

export function dessinerChevrons(ctx, convoyeur, sprite) {
  const avance = parcours.get(convoyeur) || 0;
  const debut = avance % ESPACEMENT;
  for (let d = debut; d < convoyeur.longueur; d += ESPACEMENT) {
    const p = pointA(convoyeur, d);
    // L'onde remonte le tapis dans le sens du flux, plus vite que lui.
    const phase = (((d - avance * VITESSE_ONDE) % ONDE) + ONDE) % ONDE;
    const vif = phase < ECLAT;
    ctx.save();
    ctx.globalAlpha = vif ? 1 : 0.5;
    ctx.translate(auPixel(p.x), auPixel(p.y));
    ctx.rotate((Math.PI / 2) * quartsA(convoyeur, d));
    ctx.drawImage(sprite(vif), -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
    ctx.restore();
  }
  ctx.globalAlpha = 1;
}

export const COULEUR_CHEVRON = PALETTE.bleu;
export const COULEUR_CRETE = PALETTE.creme;
