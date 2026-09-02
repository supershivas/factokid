// Atlas de tuiles et dessin de la scène. Ne modifie jamais l'état.
// Toutes les tuiles sont peintes sur une grille de 16 × 16 pixels d'art,
// puis affichées à l'échelle entière PIXEL (3 unités logiques par pixel).

import {
  PALETTE, TUILE_PX, PIXEL, CELLULE, GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE,
  ALERTE_DELAI,
} from '../design.js';
import { decalage, fenetre, celluleVisible } from '../camera.js';
import { ITEMS } from '../data/items.js';
import { REPOUSSE_TICKS } from '../data/monde.js';
import { TICKS_PAR_SECONDE } from '../data/machines.js';
import { centreCellule, coinCellule } from '../sim/grid.js';
import { attendus } from '../sim/machine.js';
import { dessinerAlerte } from './alerte.js';
import { chutePose } from './pose.js';
import { dessinerChevrons, COULEUR_CHEVRON, COULEUR_CRETE } from './chevron.js';
import { parcourirItems, celluleDe } from '../sim/belt.js';

const REPOUSSE = REPOUSSE_TICKS / TICKS_PAR_SECONDE;
const TAILLE_ITEM_PX = 6;
const TAILLE_ITEM = TAILLE_ITEM_PX * (CELLULE / TUILE_PX); // 18 unités logiques

function toile(taille, peindre) {
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  const disque = (cx, cy, r, couleur) => {
    g.fillStyle = couleur;
    for (let y = 0; y < taille; y++) {
      for (let x = 0; x < taille; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
      }
    }
  };
  peindre(rect, disque, g);
  return c;
}

// --- formes des items -----------------------------------------------------
// Définies avant les tuiles : les machines s'en servent pour porter la forme
// de ce qu'elles produisent.

// Décale un peintre de rectangles : sert à poser une forme d'item ailleurs
// que dans son propre coin, par exemple sur la façade d'une mine.
function decale(rect, ox, oy) {
  return (x, y, w, h, couleur) => rect(x + ox, y + oy, w, h, couleur);
}

const formes = {
  carre: (rect, couleur) => {
    rect(0, 0, 6, 6, PALETTE.noir);
    rect(1, 1, 4, 4, couleur);
    rect(1, 1, 1, 1, PALETTE.creme);
  },
  triangle: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(2, 0, 2, 1, n);
    rect(1, 1, 1, 1, n); rect(2, 1, 2, 1, couleur); rect(4, 1, 1, 1, n);
    rect(1, 2, 1, 1, n); rect(2, 2, 2, 1, couleur); rect(4, 2, 1, 1, n);
    rect(0, 3, 1, 1, n); rect(1, 3, 4, 1, couleur); rect(5, 3, 1, 1, n);
    rect(0, 4, 1, 1, n); rect(1, 4, 4, 1, couleur); rect(5, 4, 1, 1, n);
    rect(0, 5, 6, 1, n);
  },
  // Le caramel : une barre plate, silhouette qu'aucune autre matière n'a.
  barre: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(0, 1, 6, 1, n);
    rect(0, 2, 6, 2, couleur);
    rect(1, 2, 1, 1, PALETTE.creme);
    rect(0, 4, 6, 1, n);
  },
  bonbon: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(2, 0, 2, 1, n);
    rect(1, 1, 1, 1, n); rect(2, 1, 2, 1, couleur); rect(4, 1, 1, 1, n);
    rect(0, 2, 6, 2, couleur);
    rect(1, 4, 1, 1, n); rect(2, 4, 2, 1, couleur); rect(4, 4, 1, 1, n);
    rect(2, 5, 2, 1, n);
  },
  // Le papier : une feuille dont tout le coin est corné. Le pli traverse la
  // silhouette en biais : même en gris, on ne la confond pas avec le sucre.
  feuille: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(0, 0, 3, 1, n);
    rect(3, 1, 1, 1, n);
    rect(4, 2, 1, 1, n);
    rect(0, 1, 1, 4, n);
    rect(5, 3, 1, 2, n);
    rect(0, 5, 6, 1, n);
    rect(1, 1, 2, 1, couleur);
    rect(1, 2, 3, 1, couleur);
    rect(1, 3, 4, 1, couleur);
    rect(1, 4, 4, 1, couleur);
    rect(1, 1, 1, 1, PALETTE.creme);
  },
  rond: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(2, 0, 2, 1, n);
    rect(1, 1, 1, 1, n); rect(2, 1, 2, 1, couleur); rect(4, 1, 1, 1, n);
    rect(0, 2, 1, 2, n); rect(1, 2, 4, 2, couleur); rect(5, 2, 1, 2, n);
    rect(1, 4, 1, 1, n); rect(2, 4, 2, 1, couleur); rect(4, 4, 1, 1, n);
    rect(2, 5, 2, 1, n);
    rect(2, 1, 1, 1, PALETTE.creme);
  },
};


// --- tuiles ---------------------------------------------------------------

const sol = toile(TUILE_PX, (rect) => {
  rect(0, 0, TUILE_PX, TUILE_PX, PALETTE.noir);
  // Coins de cellule marqués : la grille se lit sans lignes pleines.
  const a = PALETTE.ardoise;
  rect(0, 0, 3, 1, a);   rect(0, 0, 1, 3, a);
  rect(13, 0, 3, 1, a);  rect(15, 0, 1, 3, a);
  rect(0, 15, 3, 1, a);  rect(0, 13, 1, 3, a);
  rect(13, 15, 3, 1, a); rect(15, 13, 1, 3, a);
});

// Les crans du tapis : de petites encoches creusées dans le bord noir, jamais
// dans la bande. Le milieu appartient aux chevrons, qui bougent ; le bord, lui,
// ne bouge pas — les deux motifs ne se brouillent donc jamais.
function cransHorizontaux(rect, y, x0 = 1, x1 = 16) {
  for (let x = x0; x < x1; x += 4) rect(x, y, 2, 1, PALETTE.ardoise);
}

function cransVerticaux(rect, x, y0 = 1, y1 = 16) {
  for (let y = y0; y < y1; y += 4) rect(x, y, 1, 2, PALETTE.ardoise);
}

// Convoyeur droit : flux vers l'est.
const convoyeurDroit = toile(TUILE_PX, (rect) => {
  rect(0, 3, 16, 1, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(0, 12, 16, 1, PALETTE.noir);
  cransHorizontaux(rect, 3);
  cransHorizontaux(rect, 12);
});

// Convoyeur en virage : entre par l'ouest, sort par le sud. La bande est nue :
// depuis que les chevrons défilent, deux motifs mobiles l'un sur l'autre se
// brouilleraient.
const convoyeurVirage = toile(TUILE_PX, (rect) => {
  rect(0, 3, 13, 10, PALETTE.noir);
  rect(3, 3, 10, 13, PALETTE.noir);
  rect(0, 4, 12, 8, PALETTE.ardoise);
  rect(4, 4, 8, 12, PALETTE.ardoise);
  // Bord extérieur : le haut, puis la descente à droite. Bord intérieur : le
  // court morceau en bas à gauche.
  cransHorizontaux(rect, 3, 1, 12);
  cransVerticaux(rect, 12, 5, 16);
  cransHorizontaux(rect, 12, 0, 3);
  cransVerticaux(rect, 3, 13, 16);
});

// Le chevron qui dit le sens de circulation. Il défile le long du tapis, à sa
// vitesse (voir render/chevron.js) : un enfant voit où ça va sans attendre
// qu'un item passe, et voit que ça avance sans en attendre deux.
// Deux teintes : le chevron ordinaire, et celui que la crête de lumière
// traverse.
// Une pointe d'un pixel, deux ailes de trois : un simple trait plié, sans
// épaisseur ni renflement. La pointe est en (9,7) et les ailes reculent
// symétriquement : le signe est exactement centré en largeur. En hauteur il
// tient sur la rangée 7 — une pointe impaire ne peut pas tomber au milieu
// d'une bande paire, et c'est un demi-pixel d'art, invisible en jeu.
function chevronTeinte(couleur) {
  return toile(TUILE_PX, (rect) => {
    rect(9, 7, 1, 1, couleur);
    for (let i = 1; i <= 3; i++) {
      rect(9 - i, 7 - i, 1, 1, couleur);
      rect(9 - i, 7 + i, 1, 1, couleur);
    }
  });
}

const chevronOrdinaire = chevronTeinte(COULEUR_CHEVRON);
const chevronVif = chevronTeinte(COULEUR_CRETE);
export const spriteChevron = (vif) => (vif ? chevronVif : chevronOrdinaire);

// Convoyeur en T : arrive par l'ouest, repart vers l'est et vers le sud. Les
// quatre rotations couvrent les quatre jonctions à trois branches.
const convoyeurT = toile(TUILE_PX, (rect) => {
  rect(0, 3, 16, 10, PALETTE.noir);
  rect(3, 3, 10, 13, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(4, 4, 8, 12, PALETTE.ardoise);
  cransHorizontaux(rect, 3);
  cransHorizontaux(rect, 12, 0, 3);
  cransHorizontaux(rect, 12, 13, 16);
  cransVerticaux(rect, 3, 13, 16);
  cransVerticaux(rect, 12, 13, 16);
});

// Convoyeur en croix : les quatre bords sont reliés.
const convoyeurCroix = toile(TUILE_PX, (rect) => {
  rect(0, 3, 16, 10, PALETTE.noir);
  rect(3, 0, 10, 16, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(4, 0, 8, 16, PALETTE.ardoise);
  for (const y of [3, 12]) { cransHorizontaux(rect, y, 0, 3); cransHorizontaux(rect, y, 13, 16); }
  for (const x of [3, 12]) { cransVerticaux(rect, x, 0, 3); cransVerticaux(rect, x, 13, 16); }
});

// Le téléporteur a disparu avec les cartes séparées : tout voyage sur des
// tapis, du premier gisement à la livraison. Son sprite reviendra le jour où
// il reviendra, en déblocage de fin.

const trieur = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(7, 2, 2, 4, PALETTE.creme);
  rect(4, 6, 8, 2, PALETTE.creme);
  rect(3, 8, 2, 5, PALETTE.creme);
  rect(11, 8, 2, 5, PALETTE.creme);
});

// La confiserie : deux entonnoirs qui versent, et un bonbon sur la façade.
const confiserie = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 2, 3, 2, PALETTE.creme);
  rect(10, 2, 3, 2, PALETTE.creme);
  rect(4, 4, 8, 1, PALETTE.creme);
  rect(2, 10, 12, 4, PALETTE.noir);
  formes.bonbon(decale(rect, 5, 10), PALETTE.orange);
});

// La chaufferie : une cuve sur un feu, où le sucre fond en caramel.
const chaufferie = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 3, 10, 6, PALETTE.noir);
  rect(4, 5, 8, 3, PALETTE.jaune);
  rect(4, 4, 8, 1, PALETTE.creme);
  for (let i = 0; i < 3; i++) rect(4 + i * 3, 11, 2, 3, PALETTE.orange);
  rect(3, 14, 10, 1, PALETTE.rouge);
});

// La plieuse : deux volets qui se referment sur une feuille de papier.
const plieuse = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(2, 3, 4, 10, PALETTE.noir);
  rect(10, 3, 4, 10, PALETTE.noir);
  rect(3, 4, 2, 8, PALETTE.creme);
  rect(11, 4, 2, 8, PALETTE.creme);
  formes.feuille(decale(rect, 5, 5), PALETTE.bleu);
});

// La livraison : un bocal ouvert où tombent les bonbons.
const livraison = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 2, 10, 2, PALETTE.creme);
  rect(4, 4, 8, 9, PALETTE.noir);
  rect(5, 5, 6, 7, PALETTE.vert);
  rect(5, 5, 6, 2, PALETTE.noir);
});

// --- cartes ---------------------------------------------------------------

// Un gisement porte la forme de sa matière, posée sur un socle.
function gisement(item) {
  return toile(TUILE_PX, (rect) => {
    rect(2, 11, 12, 3, PALETTE.ardoise);
    rect(2, 14, 12, 1, PALETTE.noir);
    rect(4, 8, 8, 3, PALETTE.ardoise);
    formes[item.forme](decale(rect, 5, 2), PALETTE[item.couleur]);
  });
}

// Gisement ramassé : le socle reste, la matière repousse.
const gisementVide = toile(TUILE_PX, (rect) => {
  rect(2, 11, 12, 3, PALETTE.ardoise);
  rect(2, 14, 12, 1, PALETTE.noir);
});

// Un extracteur : un chevalet posé sur le gisement, qui le récolte tout seul.
const extracteur = toile(TUILE_PX, (rect) => {
  rect(2, 12, 12, 3, PALETTE.ardoise);
  rect(2, 15, 12, 1, PALETTE.noir);
  rect(7, 3, 2, 9, PALETTE.creme);
  rect(4, 6, 8, 2, PALETTE.noir);
  rect(4, 6, 8, 1, PALETTE.jaune);
  rect(3, 3, 3, 2, PALETTE.jaune);
});

export const ICONES = {
  trieur, confiserie, plieuse, livraison, chaufferie, extracteur,
};

const spritesGisements = {};
for (const item of Object.values(ITEMS)) spritesGisements[item.id] = gisement(item);

// --- interface ------------------------------------------------------------

// La touche est une plaque claire pleine, sans contour : c'est le signe qu'on
// lit, pas son cadre. L'outil actif se distingue par sa pleine intensité,
// l'autre s'efface (voir hud.js).
const bouton = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.creme);
});

// Les boutons du panneau, eux, restent sombres : leurs icônes sont claires —
// la pause, l'extracteur — et une icône crème sur une plaque crème ne se voit
// pas. La barre d'outils est claire, le panneau est sombre : chacun garde le
// fond sur lequel ses signes se lisent.
const plaqueOption = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
});

const boutonActif = bouton;

const bulleFond = toile(TUILE_PX, (rect, disque) => {
  disque(8, 8, 8, PALETTE.noir);
  disque(8, 8, 7, PALETTE.creme);
  disque(8, 8, 5.5, PALETTE.ardoise);
});

// Un plus pour construire, une croix pour détruire : deux formes qui se
// distinguent en niveaux de gris, la couleur ne fait que confirmer.
// Le milieu de la tuile tombe entre les colonnes 7 et 8 : un trait d'épaisseur
// paire posé à (16 - épaisseur) / 2 l'enjambe exactement. Les deux signes
// passent par ces deux fonctions, donc aucun ne peut être décalé d'un pixel.
function traitPlus(rect, couleur, marge = 2, epaisseur = 2) {
  const a = (TUILE_PX - epaisseur) / 2;
  const l = TUILE_PX - marge * 2;
  rect(a, marge, epaisseur, l, couleur);
  rect(marge, a, l, epaisseur, couleur);
}

// La croix est décrite par une condition symétrique en x et en y : elle est
// centrée par construction. « écart » donne la finesse du trait.
function traitCroix(rect, couleur, marge = 2, ecart = 0) {
  for (let y = marge; y < TUILE_PX - marge; y++) {
    for (let x = marge; x < TUILE_PX - marge; x++) {
      const premiere = Math.abs(x - y) <= ecart;
      const seconde = Math.abs(x + y - (TUILE_PX - 1)) <= ecart;
      if (premiere || seconde) rect(x, y, 1, 1, couleur);
    }
  }
}

const outilConstruction = toile(TUILE_PX, (rect) => traitPlus(rect, PALETTE.noir));

// Sur la plaque claire, le rouge tranche largement (5,2 : 1) : la croix peut
// donc être rouge pleine, sans trait de renfort. La forme la distingue déjà du
// plus en niveaux de gris ; le rouge ne fait que confirmer.
const outilDestruction = toile(TUILE_PX, (rect) => traitCroix(rect, PALETTE.rouge, 2, 1));

// Deux barres noires : le menu pause, en haut de l'écran.
const outilPause = toile(TUILE_PX, (rect) => {
  rect(4, 3, 3, 10, PALETTE.noir);
  rect(9, 3, 3, 10, PALETTE.noir);
});

// La flèche de reprise du menu : noire, comme les autres signes posés sur les
// plaques claires.
const menuReprise = toile(TUILE_PX, (rect) => {
  for (let i = 0; i < 5; i++) rect(5 + i, 3 + i, 1, 10 - 2 * i, PALETTE.noir);
  rect(10, 7, 1, 2, PALETTE.noir);
});

// La main qui tire le monde : une paume et quatre doigts, en noir sur la
// plaque claire de la barre d'outils.
const outilMain = toile(TUILE_PX, (rect) => {
  const n = PALETTE.noir;
  rect(4, 4, 2, 5, n);
  rect(7, 2, 2, 7, n);
  rect(10, 4, 2, 5, n);
  rect(3, 8, 10, 5, n);
  rect(2, 7, 2, 4, n);
  rect(5, 13, 6, 1, n);
});

// Pause et reprise, pour le panneau d'une machine.
const bullePause = toile(TUILE_PX, (rect) => {
  rect(4, 3, 3, 10, PALETTE.creme);
  rect(9, 3, 3, 10, PALETTE.creme);
});

// Le vert seul ne tranche pas sur l'ardoise du bouton (2,1 : 1) : la flèche
// est donc cernée de crème, qui tranche (4,9 : 1), et garde son cœur vert.
const bulleReprise = toile(TUILE_PX, (rect) => {
  for (let i = 0; i < 5; i++) rect(5 + i, 3 + i, 1, 10 - 2 * i, PALETTE.creme);
  rect(10, 7, 1, 2, PALETTE.creme);
  for (let i = 0; i < 3; i++) rect(6 + i, 5 + i, 1, 6 - 2 * i, PALETTE.vert);
});

const bulleExtracteur = toile(TUILE_PX, (rect) => {
  rect(2, 11, 12, 3, PALETTE.ardoise);
  rect(7, 3, 2, 8, PALETTE.creme);
  rect(4, 6, 8, 1, PALETTE.jaune);
  rect(3, 3, 3, 2, PALETTE.jaune);
});

const bulleConvoyeur = toile(TUILE_PX, (rect) => {
  rect(2, 5, 12, 1, PALETTE.noir);
  rect(2, 6, 12, 5, PALETTE.ardoise);
  rect(2, 11, 12, 1, PALETTE.noir);
  for (let x = 3; x < 14; x += 4) rect(x, 8, 2, 1, PALETTE.bleu);
});

// Bulles des machines constructibles : le même motif que la machine posée,
// sans son cadre, pour qu'il tienne dans le rond de la bulle.
const bulleTrieur = toile(TUILE_PX, (rect) => {
  rect(7, 3, 2, 4, PALETTE.creme);
  rect(4, 7, 8, 2, PALETTE.creme);
  rect(3, 9, 2, 4, PALETTE.creme);
  rect(11, 9, 2, 4, PALETTE.creme);
});

const bulleChaufferie = toile(TUILE_PX, (rect) => {
  rect(3, 3, 10, 6, PALETTE.noir);
  rect(4, 4, 8, 1, PALETTE.creme);
  rect(4, 5, 8, 3, PALETTE.jaune);
  for (let i = 0; i < 3; i++) rect(4 + i * 3, 11, 2, 3, PALETTE.orange);
});

const bulleConfiserie = toile(TUILE_PX, (rect) => {
  rect(3, 2, 3, 2, PALETTE.creme);
  rect(10, 2, 3, 2, PALETTE.creme);
  rect(5, 4, 2, 2, PALETTE.creme);
  rect(9, 4, 2, 2, PALETTE.creme);
  formes.bonbon(decale(rect, 5, 7), PALETTE.orange);
});

const bulliePlieuse = toile(TUILE_PX, (rect) => {
  rect(2, 3, 3, 10, PALETTE.noir);
  rect(11, 3, 3, 10, PALETTE.noir);
  rect(3, 4, 2, 8, PALETTE.creme);
  rect(11, 4, 2, 8, PALETTE.creme);
  formes.feuille(decale(rect, 5, 5), PALETTE.bleu);
});

export const INTERFACE = {
  bouton, boutonActif, plaqueOption, bulleFond, bulleConvoyeur, bulleExtracteur,
  bulleTrieur, bulleChaufferie, bulleConfiserie, bulliePlieuse,
  bullePause, bulleReprise,
  outilConstruction, outilDestruction, outilMain, outilPause, menuReprise,
};

// --- items ----------------------------------------------------------------

const spritesItems = {};
for (const item of Object.values(ITEMS)) {
  spritesItems[item.id] = toile(TAILLE_ITEM_PX, (rect) => {
    formes[item.forme](rect, PALETTE[item.couleur]);
  });
}
export function spriteItem(id) { return spritesItems[id]; }
export { TAILLE_ITEM };

// --- orientation des convoyeurs ------------------------------------------

const EST = { dx: 1, dy: 0 };
const OUEST = { dx: -1, dy: 0 };
const SUD = { dx: 0, dy: 1 };

function tourner(v, quarts) {
  let { dx, dy } = v;
  for (let i = 0; i < quarts; i++) { const t = dx; dx = -dy; dy = t; }
  return { dx, dy };
}

function memeSens(a, b) { return a.dx === b.dx && a.dy === b.dy; }
function oppose(v) { return { dx: -v.dx, dy: -v.dy }; }

function memesBords(a, b) {
  return (memeSens(a[0], b[0]) && memeSens(a[1], b[1]))
      || (memeSens(a[0], b[1]) && memeSens(a[1], b[0]));
}

// Rotation de la tuile de base pour une entrée et une sortie données.
function orientation(entree, sortie) {
  if (memeSens(entree, sortie)) {
    for (let q = 0; q < 4; q++) {
      if (memeSens(tourner(EST, q), sortie)) return { sprite: convoyeurDroit, quarts: q };
    }
  }
  // Un virage ne relie que deux bords de la cellule. Le sens de circulation ne
  // change pas la tuile : seul le couple de bords compte. Les quatre rotations
  // de la tuile de base (ouest + sud) couvrent les quatre couples possibles,
  // virages à gauche compris.
  const bords = [oppose(entree), sortie];
  for (let q = 0; q < 4; q++) {
    if (memesBords([tourner(OUEST, q), tourner(SUD, q)], bords)) {
      return { sprite: convoyeurVirage, quarts: q };
    }
  }
  return { sprite: convoyeurDroit, quarts: 0 };
}

// Une jonction relie trois bords, parfois quatre : la tuile se choisit sur
// l'ensemble des bords occupés, pas sur un sens de circulation.
function memeEnsemble(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v) => b.some((w) => memeSens(v, w)));
}

const BASE_T = [OUEST, EST, SUD];

// Ne garde que les bords qui touchent vraiment la case : un voisin direct, une
// fois chacun. Sans ce filtre, un vecteur en diagonale passait pour un bord et
// faisait dessiner une croix aux bras dans le vide.
function bordsCardinaux(liste) {
  const gardes = [];
  for (const v of liste) {
    if (Math.abs(v.dx) + Math.abs(v.dy) !== 1) continue;
    if (gardes.some((w) => memeSens(v, w))) continue;
    gardes.push(v);
  }
  return gardes;
}

function orientationJonction(bords) {
  if (bords.length >= 4) return { sprite: convoyeurCroix, quarts: 0 };
  for (let q = 0; q < 4; q++) {
    if (memeEnsemble(BASE_T.map((v) => tourner(v, q)), bords)) {
      return { sprite: convoyeurT, quarts: q };
    }
  }
  return { sprite: convoyeurCroix, quarts: 0 };
}

function sens(depuis, vers) {
  return { dx: Math.sign(vers.cx - depuis.cx), dy: Math.sign(vers.cy - depuis.cy) };
}

// --- scène ----------------------------------------------------------------

function tuile(ctx, sprite, cx, cy, quarts) {
  const c = centreCellule(cx, cy);
  c.y += chutePose(cx, cy);
  if (quarts === 0) {
    ctx.drawImage(sprite, c.x - CELLULE / 2, c.y - CELLULE / 2, CELLULE, CELLULE);
    return;
  }
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate((Math.PI / 2) * quarts);
  ctx.drawImage(sprite, -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
  ctx.restore();
}

// Dessine le monde vu par la fenêtre : le sol, les gisements, les convoyeurs,
// ce qui circule dessus, les machines.
//
// Tout est découpé à la fenêtre : on ne peint que les cellules visibles, et le
// dessin est décalé de la caméra. Le monde fait neuf écrans ; en peindre neuf
// pour en montrer un serait payer neuf fois trop cher.
export function dessinerScene(ctx, monde, trace, dessinerParticules) {
  const scene = monde.scene;
  const f = fenetre();
  const d = decalage();

  ctx.save();
  ctx.beginPath();
  ctx.rect(GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE);
  ctx.clip();
  ctx.translate(-d.x, -d.y);

  for (let cy = f.cy0; cy <= f.cy1; cy++) {
    for (let cx = f.cx0; cx <= f.cx1; cx++) tuile(ctx, sol, cx, cy, 0);
  }
  dessinerGisements(ctx, monde, f);
  dessinerConvoyeurs(ctx, scene, f);
  for (const machine of scene.machines) {
    if (celluleVisible(machine.cx, machine.cy, f)) dessinerMachine(ctx, machine);
  }
  // Les particules aussi vivent dans le monde : fumée et éclats restent sur la
  // case qui les a produits, même quand la fenêtre s'en va.
  if (dessinerParticules) dessinerParticules(ctx);
  dessinerAlertes(ctx, scene, f);
  if (trace && trace.actif) dessinerTrace(ctx, trace);

  ctx.restore();
}

// Un gisement porte sa matière ; vidé, il montre où en est sa repousse.
function dessinerGisements(ctx, monde, f) {
  for (const g of monde.gisements) {
    if (!celluleVisible(g.cx, g.cy, f)) continue;
    if (g.present) {
      tuile(ctx, spritesGisements[g.item], g.cx, g.cy, 0);
      continue;
    }
    tuile(ctx, gisementVide, g.cx, g.cy, 0);
    const coin = coinCellule(g.cx, g.cy);
    const part = Math.min(1, g.horloge / REPOUSSE);
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(coin.x + 6, coin.y + 24, 36, 6);
    ctx.fillStyle = PALETTE.vert;
    ctx.fillRect(coin.x + 6, coin.y + 24, Math.round(36 * part), 6);
  }
}

// Les convoyeurs d'une scène, puis ce qui roule dessus.
export function dessinerConvoyeurs(ctx, scene, f) {
  // Qui débouche sur quelle cellule : une fusion se voit du côté de la case
  // où les tapis se rejoignent, pas du côté de celui qui repart.
  const arrivees = new Map();
  for (const convoyeur of scene.convoyeurs) {
    const sortie = convoyeur.celluleSortie;
    if (!sortie) continue;
    const cle = sortie.cx + ',' + sortie.cy;
    if (!arrivees.has(cle)) arrivees.set(cle, []);
    arrivees.get(cle).push(convoyeur);
  }

  for (const convoyeur of scene.convoyeurs) {
    const chemin = convoyeur.chemin;
    for (let i = 0; i < chemin.length; i++) {
      if (!celluleVisible(chemin[i].cx, chemin[i].cy, f)) continue;
      const avant = i === 0 ? convoyeur.celluleEntree : chemin[i - 1];
      const apres = i === chemin.length - 1 ? convoyeur.celluleSortie : chemin[i + 1];

      // Sur la dernière cellule, on compte tous les bords réellement occupés :
      // d'où l'on vient, où l'on repart, et qui vient se déverser ici.
      if (i === chemin.length - 1) {
        const bords = [sens(chemin[i], avant), sens(chemin[i], apres)];
        for (const branche of convoyeur.sorties) bords.push(sens(chemin[i], branche.chemin[0]));
        for (const venant of arrivees.get(chemin[i].cx + ',' + chemin[i].cy) || []) {
          if (venant === convoyeur) continue;
          bords.push(sens(chemin[i], venant.chemin[venant.chemin.length - 1]));
        }
        const cardinaux = bordsCardinaux(bords);
        if (cardinaux.length >= 3) {
          const j = orientationJonction(cardinaux);
          tuile(ctx, j.sprite, chemin[i].cx, chemin[i].cy, j.quarts);
          continue;
        }
      }

      const o = orientation(sens(avant, chemin[i]), sens(chemin[i], apres));
      tuile(ctx, o.sprite, chemin[i].cx, chemin[i].cy, o.quarts);
    }
  }
  // Les chevrons passent après toutes les tuiles : un chevron ne doit jamais
  // se retrouver sous la bande du tapis voisin.
  for (const convoyeur of scene.convoyeurs) dessinerChevrons(ctx, convoyeur, spriteChevron);
  for (const convoyeur of scene.convoyeurs) {
    parcourirItems(convoyeur, (item, p) => {
      ctx.drawImage(
        spritesItems[item.type],
        Math.round(p.x - TAILLE_ITEM / 2), Math.round(p.y - TAILLE_ITEM / 2),
        TAILLE_ITEM, TAILLE_ITEM,
      );
    });
  }
}

function dessinerMachine(ctx, machine) {
  tuile(ctx, ICONES[machine.type], machine.cx, machine.cy, 0);
  const coin = coinCellule(machine.cx, machine.cy);
  contenuMine(ctx, machine, coin);
  dessinerStock(ctx, machine, coin);
  fileTrieur(ctx, machine, coin);
  dessinerFleches(ctx, machine);
  marquePause(ctx, machine, coin);
}

// Une machine en pause porte un petit carré crème, avec deux barres d'un pixel
// de large : le signe se lit à sa forme, sans couleur ni mot.
function marquePause(ctx, machine, coin) {
  if (!machine.pause) return;
  const x = coin.x + CELLULE - 8 * PIXEL;
  const y = coin.y + 1 * PIXEL;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(x - PIXEL, y - PIXEL, 9 * PIXEL, 9 * PIXEL);
  ctx.fillStyle = PALETTE.creme;
  ctx.fillRect(x, y, 7 * PIXEL, 7 * PIXEL);
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(x + 2 * PIXEL, y + 2 * PIXEL, PIXEL, 3 * PIXEL);
  ctx.fillRect(x + 4 * PIXEL, y + 2 * PIXEL, PIXEL, 3 * PIXEL);
}

// Les bulles passent au-dessus de tout : elles se dessinent en dernier.
// Une seule par bouchon, à l'endroit d'où il part : un tapis bloqué parce que
// ce qu'il alimente est lui-même bloqué ne dit rien, c'est l'autre qui parle.
function dessinerAlertes(ctx, scene, f) {
  for (const machine of scene.machines) {
    if (!celluleVisible(machine.cx, machine.cy, f)) continue;
    if (machine.bloqueeDepuis > ALERTE_DELAI) {
      alerte(ctx, machine.cx, machine.cy, machine.bloqueeDepuis - ALERTE_DELAI);
    }
  }
  for (const convoyeur of scene.convoyeurs) {
    if (convoyeur.bloque <= ALERTE_DELAI) continue;
    if (convoyeur.cible && convoyeur.cible.pause) continue; // en pause : elle assume
    if (convoyeur.cible && convoyeur.cible.bloqueeDepuis > ALERTE_DELAI) continue;
    if (convoyeur.sorties.some((suite) => suite.bloque > ALERTE_DELAI)) continue;
    const bout = convoyeur.chemin[convoyeur.chemin.length - 1];
    if (!celluleVisible(bout.cx, bout.cy, f)) continue;
    alerte(ctx, bout.cx, bout.cy, convoyeur.bloque - ALERTE_DELAI);
  }
}

// La bulle jaillit de la case et se secoue. `age` compte depuis le moment où
// le bouchon a été signalé, pas depuis le début du bouchon.
function alerte(ctx, cx, cy, age) {
  const c = centreCellule(cx, cy);
  dessinerAlerte(ctx, c.x, c.y, age);
}

// Une mine montre ce qu'elle a extrait : on voit ce qu'il y a dedans.
function contenuMine(ctx, machine, coin) {
  if (!machine.def.mine) return;
  const n = machine.stocks[machine.item] || 0;
  if (n === 0) return;
  ctx.drawImage(spritesItems[machine.item], coin.x + 15, coin.y + 24, TAILLE_ITEM, TAILLE_ITEM);
}

// La file d'un trieur, telle quelle : on voit le mélange qui attend.
function fileTrieur(ctx, machine, coin) {
  if (!machine.def.tri) return;
  const n = machine.def.capacite;
  for (let i = 0; i < n; i++) {
    const x = coin.x + 4 + (i % 3) * 14;
    const y = coin.y + CELLULE - 15 + Math.floor(i / 3) * 7;
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(x - 1, y - 1, 14, 7);
    ctx.fillStyle = i < machine.file.length ? PALETTE[ITEMS[machine.file[i]].couleur] : PALETTE.ardoise;
    ctx.fillRect(x, y, 12, 5);
  }
}

// Flèches d'entrée et de sortie : par où ça rentre, par où ça sort.
const FLECHE = 12;

function fleche(ctx, machine, direction, versLInterieur, couleur) {
  const coin = coinCellule(machine.cx, machine.cy);
  const cx = coin.x + CELLULE / 2;
  const cy = coin.y + CELLULE / 2;
  const bord = CELLULE / 2 - 3;
  // Pointe posée sur le bord concerné, base à l'intérieur.
  const sensPointe = versLInterieur ? -1 : 1;
  const px = cx + direction.dx * bord * (versLInterieur ? 1 : 1);
  const py = cy + direction.dy * bord;
  ctx.fillStyle = couleur;
  ctx.beginPath();
  const ux = direction.dx * sensPointe;
  const uy = direction.dy * sensPointe;
  ctx.moveTo(px + ux * (FLECHE / 2), py + uy * (FLECHE / 2));
  ctx.lineTo(px - ux * (FLECHE / 2) + uy * (FLECHE / 2), py - uy * (FLECHE / 2) + ux * (FLECHE / 2));
  ctx.lineTo(px - ux * (FLECHE / 2) - uy * (FLECHE / 2), py - uy * (FLECHE / 2) - ux * (FLECHE / 2));
  ctx.closePath();
  ctx.fill();
}

function dessinerFleches(ctx, machine) {
  for (const convoyeur of machine.entrees) {
    const derniere = convoyeur.chemin[convoyeur.chemin.length - 1];
    fleche(ctx, machine, sens(derniere, machine), true, PALETTE.bleu);
  }
  for (const convoyeur of machine.sorties) {
    fleche(ctx, machine, sens(machine, convoyeur.chemin[0]), false, PALETTE.creme);
  }
}

// Dessine une carte : même grille, même échelle, gisements et mines.
// Jauge de stock : une rangée de pastilles par ingrédient attendu, à la
// couleur de l'item. Le bouchon se voit sur la machine, pas seulement sur le
// convoyeur.
const PASTILLE = 4;
const PAS_PASTILLE = 6;

function dessinerStock(ctx, machine, coin) {
  const rangees = attendus(machine);
  for (let r = 0; r < rangees.length; r++) {
    const { item, capacite } = rangees[r];
    const largeur = capacite * PASTILLE + (capacite - 1) * (PAS_PASTILLE - PASTILLE);
    const x = coin.x + Math.round((CELLULE - largeur) / 2);
    const y = coin.y + CELLULE - 7 - r * (PASTILLE + 2);
    // Fond sombre derrière la rangée : les places vides doivent se voir autant
    // que les pleines, sinon on ne lit pas combien il en reste.
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(x - 2, y - 1, largeur + 4, PASTILLE + 2);
    for (let i = 0; i < capacite; i++) {
      ctx.fillStyle = i < machine.stocks[item] ? PALETTE[ITEMS[item].couleur] : PALETTE.ardoise;
      ctx.fillRect(x + i * PAS_PASTILLE, y, PASTILLE, PASTILLE);
    }
  }
}

function dessinerTrace(ctx, trace) {
  ctx.fillStyle = PALETTE.creme;
  ctx.globalAlpha = 0.35;
  // Le départ n'est une case que si c'est une machine ou une cellule de tapis :
  // un tapis privé de sa source n'en a plus, et le tracé se dessine sans elle.
  const source = trace.origine || trace.source;
  if (source && source.cx !== undefined) {
    const depart = coinCellule(source.cx, source.cy);
    ctx.fillRect(depart.x, depart.y, CELLULE, CELLULE);
  }
  for (const c of trace.chemin) {
    const coin = coinCellule(c.cx, c.cy);
    ctx.fillRect(coin.x + 6, coin.y + 6, CELLULE - 12, CELLULE - 12);
  }
  ctx.globalAlpha = 1;
}

export function bordureGrille(ctx) {
  ctx.strokeStyle = PALETTE.ardoise;
  ctx.lineWidth = 1;
  ctx.strokeRect(GRILLE_X - 0.5, GRILLE_Y - 0.5, LARGEUR_VUE + 1, HAUTEUR_VUE + 1);
}
