// Ce qu'un geste vient de coûter, écrit sur la case qui l'a coûté. Pure
// présentation : la caisse vit dans l'entrée, le rendu ne fait que la dire.
//
// La caisse est en haut de l'écran et la main est en bas : un enfant qui pose
// un extracteur ne voit pas le nombre bouger. Le prix monte donc de la case
// elle-même — en rouge ce qu'on paie, en vert ce que la destruction rend —
// puis s'efface. C'est le retour visuel de la même image que le geste, comme
// la gerbe d'étoiles de la pose.

import { PALETTE, TEXTE_GRAND } from '../design.js';
import { dessinerMot, largeurMot, hauteurTexte } from './texte.js';
import { centreCellule } from '../sim/grid.js';

const DUREE = 0.8;
const MONTEE = 30;   // unités du monde parcourues vers le haut

const etiquettes = [];

// `montant` est signé : négatif ce qu'on paie, positif ce qu'on récupère.
export function marquerCout(cx, cy, montant) {
  if (!montant) return;
  const centre = centreCellule(cx, cy);
  etiquettes.push({ x: centre.x, y: centre.y, montant, age: 0 });
}

export function majCouts(dt) {
  for (let i = etiquettes.length - 1; i >= 0; i--) {
    etiquettes[i].age += dt;
    if (etiquettes[i].age >= DUREE) etiquettes.splice(i, 1);
  }
}

export function oublierCouts() {
  etiquettes.length = 0;
}

export function dessinerCouts(ctx) {
  for (const e of etiquettes) {
    const p = e.age / DUREE;
    const texte = (e.montant < 0 ? '-' : '+') + Math.abs(e.montant);
    // Elle s'efface sur le dernier tiers : avant, elle se lit en plein.
    ctx.globalAlpha = Math.min(1, (1 - p) * 3);
    dessinerMot(
      ctx, texte,
      e.x - largeurMot(texte, TEXTE_GRAND) / 2,
      e.y - hauteurTexte(TEXTE_GRAND) / 2 - MONTEE * p,
      TEXTE_GRAND,
      e.montant < 0 ? PALETTE.rouge : PALETTE.vert,
    );
    ctx.globalAlpha = 1;
  }
}
