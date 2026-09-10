// Le bandeau qui annonce quelque chose et s'en va. Ne modifie jamais l'état.
//
// Il n'y en a qu'un à la fois et il ne se touche pas : c'est une nouvelle, pas
// une question. Rien dans le jeu ne l'attend — il sort du voile du bas, reste
// le temps qu'on le lise, et repart par où il est venu.
//
// **En bas de la fenêtre de jeu, jamais sur ce qu'on touche.** Il descendait
// du haut et couvrait le compteur et la mini-carte ; il se pose maintenant
// juste au-dessus de la barre d'outils, à l'intérieur de la zone sûre, et il
// s'efface quand le menu pause est ouvert : on ne parle pas par-dessus ce que
// le joueur est en train de lire.
//
// C'est aujourd'hui la mise à jour qui s'en sert, et elle seule.

import { PALETTE, LARGEUR_LOGIQUE, BANDEAU_BAS, TEXTE_PETIT } from '../design.js';
import { dessinerMotCentre, largeurMot } from './texte.js';
import { dessinerPilule, teinteDe } from './plaque.js';

const ENTREE = 0.22;   // secondes : la descente
const TENUE = 3.6;     // secondes : le temps de lire
const SORTIE = 0.4;    // secondes : la remontée
const HAUTEUR = 24;    // il était de 34 : une nouvelle n'a pas à peser
const MARGE = 12;      // de chaque côté du mot
const ECART = 10;      // entre le bandeau et le haut de la barre d'outils

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
  // Il monte de sous le voile du bas : il en sort, il n'apparaît pas, et il
  // s'arrête juste au-dessus de la barre d'outils.
  const repos = BANDEAU_BAS.y - ECART - HAUTEUR;
  const r = {
    x: Math.round((LARGEUR_LOGIQUE - l) / 2),
    y: Math.round(BANDEAU_BAS.y + (repos - BANDEAU_BAS.y) * p),
    l,
    h: HAUTEUR,
  };
  ctx.save();
  ctx.globalAlpha = alpha;
  dessinerPilule(ctx, r, { teinte: teinteDe(toast.couleur) });
  dessinerMotCentre(ctx, toast.texte, r.x + MARGE, r.y + r.h / 2, TEXTE_PETIT, PALETTE.noir);
  ctx.restore();
}
