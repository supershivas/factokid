// Design system : toute constante visuelle vit ici.
// Aucune de ces valeurs ne doit être recalculée ailleurs.

export const LARGEUR_LOGIQUE = 360;
export const HAUTEUR_LOGIQUE = 640;

export const TUILE_PX = 24;      // pixel art natif
export const CELLULE = 48;       // unités logiques par cellule
export const PIXEL = CELLULE / TUILE_PX; // 2 unités logiques par pixel d'art

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

// Barre d'outils : des touches rondes, et les bulles des éléments
// constructibles qui sortent au-dessus du bouton construction.
//
// La touche est plus large que l'icône qu'elle porte : une icône de 48 unités
// déborde d'un disque de 48 par les coins — la croix et la main en sortaient.
// Le disque fait donc 56, l'icône reste à 48, centrée. La cible tactile y
// gagne, elle ne perd rien.
export const BOUTON = 56;
export const BOUTON_ICONE = CIBLE_TACTILE;
// Ce que la doublure du bouton dépasse en dessous : c'est elle qui lui donne
// son épaisseur, et sur elle qu'il s'enfonce.
export const BOUTON_SOUS = 6;
export const BOUTON_Y = HAUTEUR_LOGIQUE - BANDEAU_BAS + 8;
export const BOUTON_X = 12;
export const BOUTON_ECART = 8;
export const BULLE = BOUTON;        // les bulles sont des touches comme les autres
export const BULLE_ECART = 12;  // la doublure d'une rangée ne touche pas la suivante
export const BULLE_ANIMATION = 0.18; // secondes

// Bandeau haut : le compteur à gauche, le bouton pause, la mini-carte à droite.
// La mini-carte montre le monde entier à deux unités par cellule : 42 × 60
// pour 21 × 30 cellules, ce qui tient dans les 80 unités du bandeau.
export const MINICARTE_PAS = 2;
export const MINICARTE = {
  x: LARGEUR_LOGIQUE - 12 - COLONNES * MINICARTE_PAS,
  y: 10,
  l: COLONNES * MINICARTE_PAS,
  h: LIGNES * MINICARTE_PAS,
};
export const BOUTON_PAUSE = {
  x: MINICARTE.x - 12 - BOUTON, y: 14, l: BOUTON, h: BOUTON,
};

// Menu pause : des boutons de même largeur, empilés au milieu de l'écran.
export const MENU_BOUTON = { l: 240, h: 56 };
export const MENU_ECART = 12;
export const MENU_Y = 200;

export function rectMenu(j) {
  return {
    x: (LARGEUR_LOGIQUE - MENU_BOUTON.l) / 2,
    y: MENU_Y + j * (MENU_BOUTON.h + MENU_ECART),
    l: MENU_BOUTON.l,
    h: MENU_BOUTON.h,
  };
}

// Écran des essais : le choix de départ de la bêta. Des plaques larges,
// empilées, à la même largeur — aucune n'est plus importante qu'une autre.
export const CHOIX_BOUTON = { l: 264, h: 72 };
export const CHOIX_ECART = 16;
export const CHOIX_Y = 244;

export function rectChoix(j) {
  return {
    x: (LARGEUR_LOGIQUE - CHOIX_BOUTON.l) / 2,
    y: CHOIX_Y + j * (CHOIX_BOUTON.h + CHOIX_ECART),
    l: CHOIX_BOUTON.l,
    h: CHOIX_BOUTON.h,
  };
}

// Bandeau du tutoriel : ce qu'il y a à faire, posé en haut de la fenêtre de
// jeu. Une image, un mot pour l'adulte, et rien d'autre.
export const TUTORIEL_BANDEAU = { x: 12, y: GRILLE_Y + 8, l: 336, h: 40 };

// Un bouchon ne se signale qu'après avoir duré : sinon l'écran clignote au
// moindre à-coup.
export const ALERTE_DELAI = 1.2; // secondes

// Panneau d'information d'un élément construit : son nom et ses options.
export const PANNEAU = { x: 12, y: 408, l: 336, h: 148 };
export const PANNEAU_TEXTE = { x: 12, y: 70 }; // décalages dans le panneau
// Les options du panneau sont des touches comme les autres : même rond, même
// épaisseur. Cinq tiennent dans la largeur du panneau — c'est ce qu'il faut au
// trieur : quatre matières et sa pause.
export const OPTION = BOUTON;
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

// Une rangée du menu de construction : la bulle et le nom sur une même plaque.
// C'est la rangée entière qui se touche — un doigt qui vise le mot visait bien
// l'élément, et refermer le menu à sa place était le pire des malentendus.
export const RANGEE_L = 168;

// Les rangées ne sortent pas toutes ensemble : chacune part un peu après la
// précédente. `retard` est la part de progression que la rangée j attend.
export const RANGEE_RETARD = 0.09;

// La progression propre à une rangée. Elle vaut exactement 1 quand le menu est
// posé — sinon la mise en page finale dépendrait du nombre d'éléments — et
// suit le dépassement du ressort au-delà.
export function progressionRangee(progression, j) {
  const retard = RANGEE_RETARD * j;
  return progression * (1 + retard) - retard;
}

// Les rangées sortent de l'objet touché : le bouton construction.
export function rectRangee(ancre, j, progression) {
  // Elles s'éloignent du bord le plus proche : vers le bas depuis un objet
  // haut, vers le haut depuis la barre d'outils. Elles ne sortent jamais de
  // l'écran.
  const p = progressionRangee(progression, j);
  const sens = ancre.y < HAUTEUR_LOGIQUE / 2 ? 1 : -1;
  const distance = (j + 1) * (BULLE + BULLE_ECART) * p * sens;
  return {
    x: ancre.x + (ancre.l - BULLE) / 2,
    y: ancre.y + (ancre.h - BULLE) / 2 + distance,
    l: RANGEE_L,
    h: BULLE,
    p,
  };
}

// La bulle elle-même : le carré de gauche de la rangée.
export function rectBulle(ancre, j, progression) {
  const r = rectRangee(ancre, j, progression);
  return { x: r.x, y: r.y, l: BULLE, h: BULLE };
}

export function dansRect(r, x, y) {
  return x >= r.x && y >= r.y && x < r.x + r.l && y < r.y + r.h;
}

// Deux tailles de texte seulement, facteur sur la fonte 5 × 7.
// L'étiquette est à l'échelle 1 : la fonte porte assez de forme pour être lue
// sans être grossie, et c'est ce qui la rend fine.
export const TEXTE_GRAND = 3;
export const TEXTE_PETIT = 1;
