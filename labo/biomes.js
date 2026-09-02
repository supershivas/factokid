// Chantier des biomes : de quoi le sol est fait, et comment on passe de l'un
// à l'autre.
//
// Contrainte de départ : un biome se voit au premier coup d'œil, mais ne doit
// jamais concurrencer ce qui roule dessus. Les items et les tapis sont clairs
// et saturés ; le sol reste donc sombre, et ne parle que par sa texture.
//
// Quatre biomes pour la chaîne du bonbon : les plaines de sucre, la terre
// (le papier vient des arbres), les champs de fraises, les champs de menthe.

import { PALETTE, TUILE_PX, CELLULE } from '../src/design.js';

const CASES_L = 7;
const CASES_H = 4;
// Échelle 1 : la tuile de 16 pixels d'art s'affiche à 32, soit ×2 — entier,
// et sept cases tiennent dans la colonne de la page.
export const FORMAT = { largeur: CASES_L * 32, hauteur: CASES_H * 32, echelle: 1 };
const CASE = 32; // la cellule du jeu fait 48 ; réduite ici pour en montrer plus

function tuile(peindre) {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  peindre((x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); });
  return c;
}

// Les coins de cellule marqués, communs à tous les biomes : c'est la grille,
// elle ne change pas d'un sol à l'autre.
function coins(rect) {
  const a = PALETTE.ardoise;
  rect(0, 0, 3, 1, a); rect(0, 0, 1, 3, a);
  rect(13, 0, 3, 1, a); rect(15, 0, 1, 3, a);
  rect(0, 15, 3, 1, a); rect(0, 13, 1, 3, a);
  rect(13, 15, 3, 1, a); rect(15, 13, 1, 3, a);
}

// Un semis reproductible : deux biomes voisins ne doivent pas scintiller d'une
// image à l'autre, donc rien d'aléatoire au dessin.
function semis(rect, points, couleur) {
  for (const [x, y, w, h] of points) rect(x, y, w || 1, h || 1, couleur);
}

// --- les quatre sols ------------------------------------------------------

export const BIOMES = {
  sucre: {
    nom: 'plaines de sucre',
    note: 'des grains clairs, épars : le sol est pâle sans être blanc',
    tuile: tuile((rect) => {
      rect(0, 0, 16, 16, PALETTE.noir);
      semis(rect, [[3, 3], [10, 5], [6, 9], [13, 11], [2, 12], [8, 14]], PALETTE.creme);
      semis(rect, [[4, 7], [12, 2], [9, 12]], PALETTE.ardoise);
      coins(rect);
    }),
  },
  terre: {
    nom: 'terre',
    note: 'des mottes larges et sombres, le sol le plus neutre des quatre',
    tuile: tuile((rect) => {
      rect(0, 0, 16, 16, PALETTE.noir);
      semis(rect, [[2, 4, 3, 1], [9, 2, 4, 1], [5, 8, 4, 1], [11, 10, 3, 1], [3, 13, 3, 1]],
        PALETTE.ardoise);
      coins(rect);
    }),
  },
  fraise: {
    nom: 'champs de fraises',
    note: 'des rangs, et un fruit de temps en temps',
    tuile: tuile((rect) => {
      rect(0, 0, 16, 16, PALETTE.noir);
      semis(rect, [[1, 5, 14, 1], [1, 11, 14, 1]], PALETTE.ardoise);
      semis(rect, [[4, 4], [11, 10]], PALETTE.rouge);
      semis(rect, [[5, 3], [12, 9]], PALETTE.vert);
      coins(rect);
    }),
  },
  menthe: {
    nom: 'champs de menthe',
    note: 'des touffes basses, plus serrées que les rangs de fraises',
    tuile: tuile((rect) => {
      rect(0, 0, 16, 16, PALETTE.noir);
      semis(rect, [[3, 4, 2, 1], [4, 3, 1, 1], [10, 7, 2, 1], [11, 6, 1, 1],
        [6, 12, 2, 1], [7, 11, 1, 1], [13, 13, 2, 1]], PALETTE.vert);
      semis(rect, [[8, 5], [2, 10]], PALETTE.ardoise);
      coins(rect);
    }),
  },
};

// --- les passages d'un biome à l'autre ------------------------------------
//
// Un passage doit se lire comme un lieu, pas comme une couture. Quatre façons,
// de la plus franche à la plus fondue.

function poserTuile(ctx, sprite, cx, cy) {
  ctx.drawImage(sprite, cx * CASE, cy * CASE, CASE, CASE);
}

// La colonne où les deux biomes se rencontrent.
const MILIEU = 3;

// Une clé stable par cellule : le motif ne bouge pas d'une image à l'autre.
const bruit = (cx, cy) => ((cx * 7 + cy * 13) % 5) / 5;

function proposition(titre, note, peindre) {
  return { titre, note, duree: 3, format: FORMAT, dessiner: peindre };
}

export const PASSAGES = [
  proposition(
    '1. Bord franc',
    'les deux sols se touchent, une ligne de pierres marque la frontière',
    (ctx, t, largeur) => {
      for (let cy = 0; cy < CASES_H; cy++) {
        for (let cx = 0; cx < CASES_L; cx++) {
          poserTuile(ctx, cx < MILIEU ? BIOMES.sucre.tuile : BIOMES.fraise.tuile, cx, cy);
        }
      }
      ctx.fillStyle = PALETTE.ardoise;
      for (let cy = 0; cy < CASES_H; cy++) {
        for (let k = 0; k < 4; k++) {
          ctx.fillRect(MILIEU * CASE - 2, cy * CASE + 4 + k * 8, 4, 4);
        }
      }
    },
  ),
  proposition(
    '2. Frange dentelée',
    'la frontière avance et recule d’une case : une côte, pas un mur',
    (ctx, t, largeur) => {
      for (let cy = 0; cy < CASES_H; cy++) {
        const limite = MILIEU + (bruit(0, cy) > 0.5 ? 1 : 0);
        for (let cx = 0; cx < CASES_L; cx++) {
          poserTuile(ctx, cx < limite ? BIOMES.sucre.tuile : BIOMES.fraise.tuile, cx, cy);
        }
      }
    },
  ),
  proposition(
    '3. Semis dégradé',
    'sur trois cases, l’un se raréfie pendant que l’autre s’installe',
    (ctx, t, largeur) => {
      for (let cy = 0; cy < CASES_H; cy++) {
        for (let cx = 0; cx < CASES_L; cx++) {
          const part = (cx - (MILIEU - 1)) / 3; // 0 avant, 1 après
          const versFraise = part <= 0 ? 0 : part >= 1 ? 1 : part;
          const fraise = bruit(cx, cy) < versFraise;
          poserTuile(ctx, fraise ? BIOMES.fraise.tuile : BIOMES.sucre.tuile, cx, cy);
        }
      }
    },
  ),
  proposition(
    '4. Chemin de terre',
    'une bande de terre sépare les deux : le passage est un lieu à traverser',
    (ctx, t, largeur) => {
      for (let cy = 0; cy < CASES_H; cy++) {
        for (let cx = 0; cx < CASES_L; cx++) {
          const sprite = cx < MILIEU ? BIOMES.sucre.tuile
            : cx > MILIEU ? BIOMES.fraise.tuile : BIOMES.terre.tuile;
          poserTuile(ctx, sprite, cx, cy);
        }
      }
    },
  ),
];

// Une vignette par biome, en grand : on juge d'abord le sol tout seul.
export const SOLS = Object.values(BIOMES).map((b) => ({
  titre: b.nom,
  note: b.note,
  duree: 3,
  format: { largeur: 4 * CASE, hauteur: 3 * CASE, echelle: 1 },
  dessiner(ctx) {
    for (let cy = 0; cy < 3; cy++) {
      for (let cx = 0; cx < 4; cx++) poserTuile(ctx, b.tuile, cx, cy);
    }
  },
}));
