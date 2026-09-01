// Atelier d'animations : une vignette par proposition, chacune sur son propre
// canvas, à la même échelle et avec le même rendu que le jeu.
//
// Une proposition est une fonction (ctx, t, taille) où t est le temps écoulé
// depuis le déclenchement, en secondes. Elle se rejoue au clic, et en boucle.

import { PALETTE } from '../src/design.js';

export const VIGNETTE = 72;   // unités logiques
export const ECHELLE = 3;     // pixels d'écran par unité logique

export function poserVignette(parent, titre, note, dessiner, duree) {
  const carte = document.createElement('figure');
  carte.className = 'vignette';

  const canvas = document.createElement('canvas');
  canvas.width = VIGNETTE * ECHELLE;
  canvas.height = VIGNETTE * ECHELLE;
  const ctx = canvas.getContext('2d');
  ctx.setTransform(ECHELLE, 0, 0, ECHELLE, 0, 0);
  ctx.imageSmoothingEnabled = false;

  const legende = document.createElement('figcaption');
  legende.innerHTML = `<b>${titre}</b><span>${note}</span>`;

  carte.append(canvas, legende);
  parent.append(carte);

  let debut = performance.now();
  canvas.addEventListener('click', () => { debut = performance.now(); });

  function image(maintenant) {
    let t = (maintenant - debut) / 1000;
    if (t > duree) { debut = maintenant; t = 0; }
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(0, 0, VIGNETTE, VIGNETTE);
    dessiner(ctx, t, VIGNETTE);
    requestAnimationFrame(image);
  }
  requestAnimationFrame(image);
}

// --- petites fonctions de temps -------------------------------------------

export const borne = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v));

export function ressortAmorti(t, raideur = 22, amortissement = 7) {
  // Réponse d'un ressort à un échelon : dépasse puis se pose.
  if (t <= 0) return 0;
  const w = Math.sqrt(raideur);
  return 1 - Math.exp(-amortissement * t / 2) * Math.cos(w * t);
}

export const sortieCubique = (t) => 1 - (1 - borne(t)) ** 3;
export const entreeCubique = (t) => borne(t) ** 3;

// Un tremblement pseudo-aléatoire mais reproductible.
export function tremble(t, graine = 0) {
  return Math.sin(t * 47.1 + graine * 12.9) * Math.sin(t * 31.7 + graine * 7.3);
}
