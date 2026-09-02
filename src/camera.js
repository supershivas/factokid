// La caméra : quelle partie du monde la fenêtre montre. Un décalage, rien de
// plus — le jeu raisonne en cellules du monde, le rendu et l'entrée passent
// par ici pour savoir où elles tombent à l'écran.
//
// C'est le seul système ajouté par la carte générale. Il ne touche pas à la
// simulation : déplacer la vue ne change rien à ce qui circule.

import {
  CELLULE, PIXEL, COLONNES, LIGNES, COLONNES_VUE, LIGNES_VUE, LARGEUR_VUE, HAUTEUR_VUE,
} from './design.js';

const MAX_X = (COLONNES - COLONNES_VUE) * CELLULE;
const MAX_Y = (LIGNES - LIGNES_VUE) * CELLULE;

export const camera = { x: 0, y: 0 };

const borne = (v, max) => Math.max(0, Math.min(max, v));

export function deplacerCamera(dx, dy) {
  camera.x = borne(camera.x + dx, MAX_X);
  camera.y = borne(camera.y + dy, MAX_Y);
}

// Centre la fenêtre sur une cellule, autant que les bords le permettent.
export function centrerCamera(cx, cy) {
  camera.x = borne((cx + 0.5) * CELLULE - LARGEUR_VUE / 2, MAX_X);
  camera.y = borne((cy + 0.5) * CELLULE - HAUTEUR_VUE / 2, MAX_Y);
}

// Le décalage appliqué au rendu : arrondi au pixel d'art, pour que le monde
// glisse d'un pixel entier à la fois et reste net.
export function decalage() {
  return {
    x: Math.round(camera.x / PIXEL) * PIXEL,
    y: Math.round(camera.y / PIXEL) * PIXEL,
  };
}

// Point de l'écran -> point du monde. L'entrée passe par là avant de demander
// une cellule.
export function versMonde(p) {
  return { x: p.x + camera.x, y: p.y + camera.y };
}

// Les cellules visibles, bornes comprises : de quoi ne dessiner que celles-là.
export function fenetre() {
  const d = decalage();
  return {
    cx0: Math.max(0, Math.floor(d.x / CELLULE)),
    cy0: Math.max(0, Math.floor(d.y / CELLULE)),
    cx1: Math.min(COLONNES - 1, Math.floor((d.x + LARGEUR_VUE) / CELLULE)),
    cy1: Math.min(LIGNES - 1, Math.floor((d.y + HAUTEUR_VUE) / CELLULE)),
  };
}

export function celluleVisible(cx, cy, f) {
  return cx >= f.cx0 && cx <= f.cx1 && cy >= f.cy0 && cy <= f.cy1;
}
