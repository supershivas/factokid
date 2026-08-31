// Design system : toute constante visuelle vit ici.
// Aucune de ces valeurs ne doit être recalculée ailleurs.

export const LARGEUR_LOGIQUE = 360;
export const HAUTEUR_LOGIQUE = 640;

export const TUILE_PX = 16;      // pixel art natif
export const CELLULE = 48;       // unités logiques par cellule
export const PIXEL = CELLULE / TUILE_PX; // 3 unités logiques par pixel d'art

// Grille de départ : 7 × 10 (336 × 480), centrée horizontalement.
// Dérogation validée : 10 × 10 ne tient pas dans 360 de large à 48/cellule.
export const COLONNES = 7;
export const LIGNES = 10;
export const GRILLE_X = (LARGEUR_LOGIQUE - COLONNES * CELLULE) / 2; // 12
export const GRILLE_Y = 80;

export const BANDEAU_HAUT = GRILLE_Y;
export const BANDEAU_BAS = HAUTEUR_LOGIQUE - (GRILLE_Y + LIGNES * CELLULE); // 80

export const CIBLE_TACTILE = 48;

export const PALETTE = {
  noir:    '#1a1c2c',
  ardoise: '#566c86',
  creme:   '#f4f4f4',
  rouge:   '#b13e53',
  orange:  '#ef7d57',
  jaune:   '#ffcd75',
  vert:    '#38b764',
  bleu:    '#41a6f6',
};

// Index de palette utilisés par les matrices de pixels (0 = transparent).
export const INDEX_PALETTE = [
  null, PALETTE.noir, PALETTE.ardoise, PALETTE.creme, PALETTE.rouge,
  PALETTE.orange, PALETTE.jaune, PALETTE.vert, PALETTE.bleu,
];

// Deux tailles de texte seulement.
export const TEXTE_GRAND = 3; // facteur sur la fonte 3×5
export const TEXTE_PETIT = 2;
