// Mise à l'échelle : seul endroit du code où des pixels d'écran apparaissent.
// Échelle entière uniquement, jamais d'interpolation.

import { LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from '../design.js';

export function creerVue(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let echelle = 1;

  function redimensionner() {
    const cadre = canvas.parentElement.getBoundingClientRect();
    const brut = Math.min(cadre.width / LARGEUR_LOGIQUE, cadre.height / HAUTEUR_LOGIQUE);
    echelle = Math.max(1, Math.floor(brut));

    const l = LARGEUR_LOGIQUE * echelle;
    const h = HAUTEUR_LOGIQUE * echelle;
    canvas.width = l;
    canvas.height = h;
    canvas.style.width = l + 'px';
    canvas.style.height = h + 'px';
    ctx.setTransform(echelle, 0, 0, echelle, 0, 0);
    ctx.imageSmoothingEnabled = false;
  }

  // Coordonnées écran -> coordonnées logiques.
  function versLogique(clientX, clientY) {
    const r = canvas.getBoundingClientRect();
    return {
      x: (clientX - r.left) / echelle,
      y: (clientY - r.top) / echelle,
    };
  }

  redimensionner();
  addEventListener('resize', redimensionner);
  addEventListener('orientationchange', redimensionner);

  return { ctx, canvas, redimensionner, versLogique, echelle: () => echelle };
}
