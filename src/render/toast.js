// Le bandeau qui annonce quelque chose et s'en va. Ne modifie jamais l'état.
//
// Il n'y en a qu'un à la fois et il ne se touche pas : c'est une nouvelle, pas
// une question. Rien dans le jeu ne l'attend — il se pose sous le voile du
// haut, reste le temps qu'on le lise, et repart par où il est venu.
//
// C'est aujourd'hui la mise à jour qui s'en sert, et elle seule.

import { PALETTE, LARGEUR_LOGIQUE, BANDEAU_HAUT, TEXTE_PETIT } from '../design.js';
import { dessinerMotCentre, largeurMot } from './texte.js';
import { dessinerPilule, teinteDe } from './plaque.js';

const ENTREE = 0.22;   // secondes : la descente
const TENUE = 3.6;     // secondes : le temps de lire
const SORTIE = 0.4;    // secondes : la remontée
const HAUTEUR = 34;
const MARGE = 18;      // de chaque côté du mot

let toast = null;

// `couleur` dit de quelle famille est la nouvelle, comme pour une touche : le
// vert pour ce qui est fait, le jaune pour ce qui va l'être.
export function annoncer(texte, couleur = 'vert') {
  toast = { texte, couleur, age: 0 };
}

export function majToast(dt) {
  if (!toast) return;
  toast.age += dt;
  if (toast.age > ENTREE + TENUE + SORTIE) toast = null;
}

// Une descente franche, une remontée franche, et rien entre les deux : le
// bandeau ne bouge pas pendant qu'on le lit.
function place(age) {
  if (age < ENTREE) return { p: age / ENTREE, alpha: age / ENTREE };
  const reste = age - ENTREE - TENUE;
  if (reste <= 0) return { p: 1, alpha: 1 };
  const q = 1 - reste / SORTIE;
  return { p: q, alpha: q };
}

export function dessinerToast(ctx) {
  if (!toast) return;
  const { p, alpha } = place(toast.age);
  const l = Math.round(largeurMot(toast.texte, TEXTE_PETIT)) + MARGE * 2;
  const r = {
    x: Math.round((LARGEUR_LOGIQUE - l) / 2),
    // Il glisse de sous le voile du haut : il en sort, il n'apparaît pas.
    y: Math.round(BANDEAU_HAUT.h - HAUTEUR + (HAUTEUR + 14) * p),
    l,
    h: HAUTEUR,
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  dessinerPilule(ctx, r, { teinte: teinteDe(toast.couleur) });
  dessinerMotCentre(ctx, toast.texte, r.x + MARGE, r.y + r.h / 2, TEXTE_PETIT, PALETTE.noir);
  ctx.restore();
}
