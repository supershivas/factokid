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
// jeu. Une image, un mot, et le bouton qui passe le tutoriel — un secondaire,
// à droite, comme la pause d'une machine.
export const TUTORIEL_BANDEAU = { x: 12, y: GRILLE_Y + 8, l: 336, h: 48 };

export function rectPasserTuto() {
  return {
    x: TUTORIEL_BANDEAU.x + TUTORIEL_BANDEAU.l - BOUTON_SECONDAIRE - 6,
    y: TUTORIEL_BANDEAU.y + (TUTORIEL_BANDEAU.h - BOUTON_SECONDAIRE) / 2,
    l: BOUTON_SECONDAIRE,
    h: BOUTON_SECONDAIRE,
  };
}

// Un bouchon ne se signale qu'après avoir duré : sinon l'écran clignote au
// moindre à-coup.
export const ALERTE_DELAI = 1.2; // secondes

// Panneau d'information d'un élément construit : son nom, ce qu'il fait de
// quoi, et ses réglages. Sa hauteur n'est pas un nombre écrit ici : elle se
// calcule depuis ce qu'il y a dedans. Une hauteur fixe marchait tant que les
// descriptions tenaient sur deux lignes — celle du sucre en fait quatre, et
// le texte passait sous les réglages.
//
// Le bas ne bouge pas : le panneau pousse vers le haut, au-dessus de la barre
// d'outils, et ce qu'on règle reste sous le pouce.
export const PANNEAU = { x: 12, l: 336, bas: 556 };
export const PANNEAU_TEXTE = { x: 12, y: 68 }; // décalages dans le panneau
export const PANNEAU_MARGE = 12;

// La surmodale : ce qu'un mot souligné explique. Elle se pose au-dessus du
// panneau, sans le fermer — on revient à ce qu'on regardait en la refermant.
// Elle se mesure comme lui, et se cale juste au-dessus.
export const SURMODALE = { x: 24, l: 312 };
export const SURMODALE_TEXTE = { x: 12, y: 72 };
export const SURMODALE_ECART = 12;
export const FERMER = { l: 40, h: 40 };

// Un bouton secondaire : plus petit qu'une touche d'outil, sombre, posé à
// droite d'un titre. C'est le second rang du design system — ce qui règle
// l'élément qu'on regarde, jamais ce qui agit sur le monde. La pause d'une
// machine en est un.
export const BOUTON_SECONDAIRE = 40;

// Les options du panneau sont des touches comme les autres : même rond, même
// épaisseur. Il n'en reste que les réglages — les quatre matières d'un trieur ;
// la pause est passée au second rang, à droite du nom.
export const OPTION = BOUTON;
export const OPTION_ECART = 8;
export const OPTION_HAUT = 10; // ce qui sépare la rangée du texte au-dessus

// Ce que mesure un panneau qui porte tant de lignes de texte et, s'il y en a,
// une rangée de réglages. `interligne` vient de la mise en page du texte : le
// panneau ne le recalcule pas, il le reçoit.
export function boitePanneau(lignes, interligne, options) {
  const texte = Math.max(1, lignes) * interligne;
  const bas = options
    ? OPTION_HAUT + OPTION + BOUTON_SOUS + PANNEAU_MARGE
    : PANNEAU_MARGE;
  const h = PANNEAU_TEXTE.y + texte + bas;
  return { x: PANNEAU.x, y: PANNEAU.bas - h, l: PANNEAU.l, h };
}

// La surmodale se mesure pareil, et se pose juste au-dessus du panneau qu'elle
// recouvre — elle grandit donc avec lui, sans jamais mordre dessus.
export function boiteSurmodale(lignes, interligne, panneau) {
  const h = SURMODALE_TEXTE.y + Math.max(1, lignes) * interligne + PANNEAU_MARGE;
  const bas = panneau ? panneau.y - SURMODALE_ECART : (HAUTEUR_LOGIQUE + h) / 2;
  return { x: SURMODALE.x, y: Math.max(PANNEAU_MARGE, bas - h), l: SURMODALE.l, h };
}

export function rectFermer(boite) {
  return {
    x: boite.x + boite.l - FERMER.l - 10,
    y: boite.y + 10,
    l: FERMER.l,
    h: FERMER.h,
  };
}

export function rectSecondaire(boite) {
  return {
    x: boite.x + boite.l - BOUTON_SECONDAIRE - 12,
    y: boite.y + PANNEAU_MARGE + (CELLULE - BOUTON_SECONDAIRE) / 2,
    l: BOUTON_SECONDAIRE,
    h: BOUTON_SECONDAIRE,
  };
}

export function rectOption(j, boite) {
  return {
    x: boite.x + 12 + j * (OPTION + OPTION_ECART),
    y: boite.y + boite.h - PANNEAU_MARGE - BOUTON_SOUS - OPTION,
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

// Poser une image de pixel art dans une touche : à quelle taille, et à quelle
// marge. Une image ne se met à l'échelle qu'en nombre entier de fois — à ×1,4
// ses pixels n'ont plus tous la même largeur et son centre tombe entre deux.
// On prend donc le plus grand multiple entier du pixel natif qui tienne dans
// la part voulue, et la marge se cale sur le pixel d'art.
//
// `natif` est la taille du sprite en pixels d'art (24 pour une icône
// d'interface, 9 pour une matière), `part` ce qu'elle a le droit d'occuper.
export function poserImage(cible, natif, part) {
  const facteur = Math.max(1, Math.floor((cible * part) / natif));
  const taille = natif * facteur;
  const marge = Math.round((cible - taille) / 2 / PIXEL) * PIXEL;
  return { taille, marge, facteur };
}

export function dansRect(r, x, y) {
  return x >= r.x && y >= r.y && x < r.x + r.l && y < r.y + r.h;
}

// Deux tailles de texte seulement, facteur sur la fonte 5 × 7.
// L'étiquette est à l'échelle 1 : la fonte porte assez de forme pour être lue
// sans être grossie, et c'est ce qui la rend fine.
export const TEXTE_GRAND = 3;
export const TEXTE_PETIT = 1;
