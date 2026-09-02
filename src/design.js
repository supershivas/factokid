// Design system : toute constante visuelle vit ici.
// Aucune de ces valeurs ne doit être recalculée ailleurs.

export const LARGEUR_LOGIQUE = 360;
export const HAUTEUR_LOGIQUE = 640;

export const TUILE_PX = 16;      // pixel art natif
export const CELLULE = 48;       // unités logiques par cellule
export const PIXEL = CELLULE / TUILE_PX; // 3 unités logiques par pixel d'art

// La fenêtre : 7 × 10 cellules (336 × 480), centrée horizontalement. C'est ce
// qu'on voit à la fois, et ça n'a pas bougé — l'échelle, la cible tactile et la
// mise en page en dépendent.
// Dérogation validée : 10 × 10 ne tient pas dans 360 de large à 48/cellule.
export const COLONNES_VUE = 7;
export const LIGNES_VUE = 10;

// Le monde : neuf fenêtres. La grille est plus grande que l'écran, et la
// caméra s'y promène. C'est la seule différence entre la fenêtre et le monde —
// tout le reste du jeu raisonne en cellules, sans savoir laquelle est visible.
export const COLONNES = 21;
export const LIGNES = 30;

export const GRILLE_X = (LARGEUR_LOGIQUE - COLONNES_VUE * CELLULE) / 2; // 12
export const GRILLE_Y = 80;
export const LARGEUR_VUE = COLONNES_VUE * CELLULE;
export const HAUTEUR_VUE = LIGNES_VUE * CELLULE;

export const BANDEAU_HAUT = GRILLE_Y;
export const BANDEAU_BAS = HAUTEUR_LOGIQUE - (GRILLE_Y + HAUTEUR_VUE); // 80

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

// Barre d'outils : deux boutons à la cible tactile pleine, et les bulles des
// éléments constructibles qui sortent au-dessus du bouton construction.
export const BOUTON = CIBLE_TACTILE;
export const BOUTON_Y = GRILLE_Y + HAUTEUR_VUE + 16;
export const BOUTON_X = 12;
export const BOUTON_ECART = 8;
export const BULLE = CIBLE_TACTILE; // jamais en dessous de la cible tactile
export const BULLE_ECART = 8;
export const BULLE_ANIMATION = 0.18; // secondes

// Un bouchon ne se signale qu'après avoir duré : sinon l'écran clignote au
// moindre à-coup.
export const ALERTE_DELAI = 1.2; // secondes

// Panneau d'information d'un élément construit : son nom et ses options.
export const PANNEAU = { x: 12, y: 408, l: 336, h: 148 };
export const PANNEAU_TEXTE = { x: 12, y: 70 }; // décalages dans le panneau
export const OPTION = CIBLE_TACTILE;
export const OPTION_ECART = 8;

export function rectOption(j) {
  return {
    x: PANNEAU.x + 12 + j * (OPTION + OPTION_ECART),
    y: PANNEAU.y + PANNEAU.h - OPTION - 10,
    l: OPTION,
    h: OPTION,
  };
}

// Géométrie partagée par le rendu et l'entrée : une seule source de vérité,
// sinon le bouton dessiné et le bouton touché finissent par diverger.
export function rectBouton(i) {
  return { x: BOUTON_X + i * (BOUTON + BOUTON_ECART), y: BOUTON_Y, l: BOUTON, h: BOUTON };
}

// Les bulles sortent de l'objet touché : le bouton construction, ou le
// téléporteur posé sur la grille.
export function rectBulle(ancre, j, progression) {
  // Les bulles s'éloignent du bord le plus proche : vers le bas depuis un objet
  // haut, vers le haut depuis la barre d'outils. Elles ne sortent jamais de
  // l'écran.
  const sens = ancre.y < HAUTEUR_LOGIQUE / 2 ? 1 : -1;
  const distance = (j + 1) * (BULLE + BULLE_ECART) * progression * sens;
  return {
    x: ancre.x + (ancre.l - BULLE) / 2,
    y: ancre.y + (ancre.h - BULLE) / 2 + distance,
    l: BULLE,
    h: BULLE,
  };
}

export function dansRect(r, x, y) {
  return x >= r.x && y >= r.y && x < r.x + r.l && y < r.y + r.h;
}

// Deux tailles de texte seulement.
export const TEXTE_GRAND = 3; // facteur sur la fonte 3×5
export const TEXTE_PETIT = 2;
