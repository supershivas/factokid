// Grille : occupation des cellules. Ne dessine rien.

import { COLONNES, LIGNES, CELLULE, GRILLE_X, GRILLE_Y } from '../design.js';

export function creerGrille() {
  return { cellules: new Array(COLONNES * LIGNES).fill(null) };
}

export function dansGrille(cx, cy) {
  return cx >= 0 && cy >= 0 && cx < COLONNES && cy < LIGNES;
}

export function lire(grille, cx, cy) {
  if (!dansGrille(cx, cy)) return undefined;
  return grille.cellules[cy * COLONNES + cx];
}

export function poser(grille, cx, cy, contenu) {
  if (!dansGrille(cx, cy)) return;
  grille.cellules[cy * COLONNES + cx] = contenu;
}

export function libre(grille, cx, cy) {
  return dansGrille(cx, cy) && grille.cellules[cy * COLONNES + cx] === null;
}

// Point logique -> cellule. null si hors grille.
export function celluleDepuisPoint(x, y) {
  const cx = Math.floor((x - GRILLE_X) / CELLULE);
  const cy = Math.floor((y - GRILLE_Y) / CELLULE);
  return dansGrille(cx, cy) ? { cx, cy } : null;
}

export function coinCellule(cx, cy) {
  return { x: GRILLE_X + cx * CELLULE, y: GRILLE_Y + cy * CELLULE };
}

export function centreCellule(cx, cy) {
  return { x: GRILLE_X + cx * CELLULE + CELLULE / 2, y: GRILLE_Y + cy * CELLULE + CELLULE / 2 };
}

export function adjacentes(a, b) {
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) === 1;
}
