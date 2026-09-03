// Mise à l'échelle : seul endroit du code où des pixels d'écran apparaissent.
// Échelle entière uniquement, jamais d'interpolation.

import { LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from '../design.js';

// La place qu'un cadre qui épouse le jeu a le droit de prendre : celle de son
// parent, moins l'épaisseur de sa propre coque. Mesurer le cadre lui-même ne
// dirait rien, puisque c'est le jeu qui lui donnera sa taille.
function placeDisponible(conteneur) {
  const autour = conteneur.parentElement.getBoundingClientRect();
  const style = getComputedStyle(conteneur);
  const bords = (a, b) => parseFloat(style[a]) + parseFloat(style[b]);
  return {
    width: autour.width - bords('borderLeftWidth', 'borderRightWidth'),
    height: autour.height - bords('borderTopWidth', 'borderBottomWidth'),
  };
}

export function creerVue(canvas) {
  const ctx = canvas.getContext('2d', { alpha: false });
  let echelle = 1;

  function redimensionner() {
    const conteneur = canvas.parentElement;
    // Le cadre d'aperçu épouse le jeu : on efface la taille posée à la mesure
    // précédente avant de mesurer, sinon il ne pourrait plus que rétrécir.
    const epouse = conteneur.dataset.epouse !== undefined;
    if (epouse) { conteneur.style.width = ''; conteneur.style.height = ''; }

    const cadre = epouse ? placeDisponible(conteneur) : conteneur.getBoundingClientRect();
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

    // L'aperçu desktop dessine un téléphone : sa coque se ferme sur l'écran,
    // sans bande noire autour. C'est la seule chose que le cadre ajoute.
    if (epouse) { conteneur.style.width = l + 'px'; conteneur.style.height = h + 'px'; }
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
