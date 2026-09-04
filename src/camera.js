// La caméra : quelle partie du monde la fenêtre montre, et à quelle échelle.
// Un décalage et un niveau, rien de plus — le jeu raisonne en cellules du
// monde, le rendu et l'entrée passent par ici pour savoir où elles tombent à
// l'écran.
//
// C'est le seul système ajouté par la carte générale. Il ne touche pas à la
// simulation : ni déplacer la vue ni reculer ne change quoi que ce soit à ce
// qui circule. `CELLULE` reste l'unité de la simulation pour toujours — un
// tapis mesure ses cellules × 48 et avance à 96 unités par seconde, quel que
// soit le zoom. C'est ce qui garde le débit indépendant de ce qu'on regarde.

import {
  CELLULE, PIXEL, COLONNES, LIGNES, LARGEUR_VUE, HAUTEUR_VUE,
  GRILLE_X, GRILLE_Y, ZOOMS,
} from './design.js';

export const camera = { x: 0, y: 0, niveau: 0 };

// Combien d'unités d'écran vaut une unité du monde : 1 quand on bâtit, 1/2
// quand on recule.
export function echelle() {
  return ZOOMS[camera.niveau] / CELLULE;
}

export function auPlusLoin() {
  return camera.niveau === ZOOMS.length - 1;
}

// Ce que la fenêtre montre du monde, en unités du monde. Reculer ne change pas
// la fenêtre : il change ce qui tient dedans.
export function vue() {
  const z = echelle();
  return { l: LARGEUR_VUE / z, h: HAUTEUR_VUE / z };
}

const borne = (v, max) => Math.max(0, Math.min(max, v));
const maxX = () => Math.max(0, COLONNES * CELLULE - vue().l);
const maxY = () => Math.max(0, LIGNES * CELLULE - vue().h);

// Le doigt tire le monde : il parle en unités d'écran, la caméra vit en unités
// du monde. Reculé, le même geste couvre deux fois plus de terrain — c'est ce
// qu'on attend, puisqu'on voit deux fois plus loin.
export function deplacerCamera(dx, dy) {
  const z = echelle();
  camera.x = borne(camera.x + dx / z, maxX());
  camera.y = borne(camera.y + dy / z, maxY());
}

// Centre la fenêtre sur une cellule, autant que les bords le permettent.
export function centrerCamera(cx, cy) {
  const v = vue();
  camera.x = borne((cx + 0.5) * CELLULE - v.l / 2, maxX());
  camera.y = borne((cy + 0.5) * CELLULE - v.h / 2, maxY());
}

// Reculer d'un cran, et revenir au premier après le dernier. Ce qu'on avait au
// milieu de l'écran y reste : on recule autour de ce qu'on regardait, on ne
// saute pas ailleurs.
export function zoomer() {
  const avant = vue();
  const cx = camera.x + avant.l / 2;
  const cy = camera.y + avant.h / 2;
  camera.niveau = (camera.niveau + 1) % ZOOMS.length;
  const apres = vue();
  camera.x = borne(cx - apres.l / 2, maxX());
  camera.y = borne(cy - apres.h / 2, maxY());
}

// Le décalage appliqué au rendu : arrondi au pixel d'art, pour que le monde
// glisse d'un pixel entier à la fois et reste net. Le pas est le même aux deux
// niveaux — un pixel d'art fait deux unités du monde par construction, et le
// décalage à l'écran vaut donc toujours un nombre entier de pixels.
export function decalage() {
  return {
    x: Math.round(camera.x / PIXEL) * PIXEL,
    y: Math.round(camera.y / PIXEL) * PIXEL,
  };
}

// Point de l'écran -> point du monde. L'entrée passe par là avant de demander
// une cellule.
export function versMonde(p) {
  const z = echelle();
  return {
    x: GRILLE_X + (p.x - GRILLE_X) / z + camera.x,
    y: GRILLE_Y + (p.y - GRILLE_Y) / z + camera.y,
  };
}

// Le seul endroit qui sait à quelle échelle le monde est dessiné : tout le
// reste du rendu travaille en unités du monde et n'a rien appris du zoom.
// À rendre par un `ctx.restore()`.
export function cadrerMonde(ctx) {
  const d = decalage();
  const z = echelle();
  ctx.save();
  ctx.beginPath();
  ctx.rect(GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE);
  ctx.clip();
  ctx.translate(GRILLE_X, GRILLE_Y);
  ctx.scale(z, z);
  ctx.translate(-GRILLE_X - d.x, -GRILLE_Y - d.y);
}

// Les cellules visibles, bornes comprises : de quoi ne dessiner que celles-là.
export function fenetre() {
  const d = decalage();
  const v = vue();
  return {
    cx0: Math.max(0, Math.floor(d.x / CELLULE)),
    cy0: Math.max(0, Math.floor(d.y / CELLULE)),
    cx1: Math.min(COLONNES - 1, Math.floor((d.x + v.l) / CELLULE)),
    cy1: Math.min(LIGNES - 1, Math.floor((d.y + v.h) / CELLULE)),
  };
}

export function celluleVisible(cx, cy, f) {
  return cx >= f.cx0 && cx <= f.cx1 && cy >= f.cy0 && cy <= f.cy1;
}
