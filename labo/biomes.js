// Chantier des biomes : de quoi le sol est fait, et comment on passe de l'un
// à l'autre.
//
// Trois règles, posées d'emblée :
//
// 1. Le fond reste sombre, mais il est teinté. Chaque biome a sa couleur, et
//    trois nuances de la même : la teinte est la couleur du biome posée sur le
//    noir à trois transparences. Le sol change donc de couleur d'un biome à
//    l'autre sans jamais monter au niveau des items, qui sont saturés.
// 2. C'est cette transparence qui fait les passages : entre deux biomes, on
//    mélange les deux teintes. Aucun raccord à dessiner, aucune tuile de
//    transition à prévoir — le fondu est une valeur, pas un sprite.
// 3. Les textures sont minimales : des points d'un pixel, ou des traits d'un
//    pixel d'épaisseur et de deux à trois de long. Rien de plus : ce qui roule
//    sur le tapis doit rester le seul motif qu'on suit des yeux.

import { PALETTE, TUILE_PX } from '../src/design.js';

const CASE = 32;                 // la cellule du jeu fait 48 ; réduite ici
const CASES_L = 7;
const CASES_H = 4;
export const FORMAT = { largeur: CASES_L * CASE, hauteur: CASES_H * CASE, echelle: 1 };

// --- teintes ---------------------------------------------------------------

function versRvb(hex) {
  return [
    parseInt(hex.slice(1, 3), 16),
    parseInt(hex.slice(3, 5), 16),
    parseInt(hex.slice(5, 7), 16),
  ];
}

const NOIR = versRvb(PALETTE.noir);

function versHex([r, v, b]) {
  const deux = (n) => Math.round(n).toString(16).padStart(2, '0');
  return '#' + deux(r) + deux(v) + deux(b);
}

// Une couleur de la palette posée sur le noir, à une transparence donnée.
function teinte(couleur, alpha) {
  const c = versRvb(couleur);
  return versHex(c.map((v, i) => NOIR[i] + (v - NOIR[i]) * alpha));
}

// Deux teintes mélangées : c'est tout ce qu'il faut pour fondre deux biomes.
function melange(a, b, part) {
  const ca = versRvb(a);
  const cb = versRvb(b);
  return versHex(ca.map((v, i) => v + (cb[i] - v) * part));
}

// Trois nuances par biome, du plus sombre au plus clair. Elles restent basses,
// et resserrées : à cellule près, un écart plus large se lit comme un damier
// de carrés, pas comme un sol.
const NUANCES = [0.08, 0.11, 0.14];

// --- les biomes ------------------------------------------------------------
//
// « motif » dit la texture : un point, un trait couché, un trait debout. Sa
// couleur est la même teinte, montée d'un cran — jamais une couleur de plus.

export const BIOMES = {
  sucre: {
    nom: 'plaines de sucre',
    note: 'des grains d’un pixel, épars',
    couleur: PALETTE.creme,
    motif: 'point',
  },
  terre: {
    nom: 'terre',
    note: 'des traits couchés de trois pixels, comme des mottes',
    couleur: PALETTE.orange,
    motif: 'couche',
  },
  fraise: {
    nom: 'champs de fraises',
    note: 'des rangs : traits couchés serrés, alignés',
    couleur: PALETTE.rouge,
    motif: 'rang',
  },
  menthe: {
    nom: 'champs de menthe',
    note: 'des touffes : traits debout de deux pixels',
    couleur: PALETTE.vert,
    motif: 'debout',
  },
};

// Un semis fixe par cellule : rien d'aléatoire au dessin, sinon le sol
// scintille d'une image à l'autre.
const POINTS = {
  point: [[3, 3], [10, 5], [6, 10], [13, 12], [2, 13]],
  couche: [[2, 4], [9, 2], [5, 9], [11, 12], [4, 14]],
  rang: [[2, 3], [7, 3], [12, 3], [2, 8], [7, 8], [12, 8], [2, 13], [7, 13], [12, 13]],
  debout: [[4, 4], [11, 6], [6, 11], [13, 13], [2, 9]],
};

function dessinerMotif(rect, motif, couleur) {
  for (const [x, y] of POINTS[motif]) {
    if (motif === 'point') rect(x, y, 1, 1, couleur);
    else if (motif === 'debout') rect(x, y, 1, 2, couleur);
    else rect(x, y, 3, 1, couleur);
  }
}

// --- tuiles ----------------------------------------------------------------

const cache = new Map();

// Une tuile de sol : le fond teinté, la texture d'un cran au-dessus, et le
// point de grille au coin. `fond` et `dessus` sont déjà des couleurs.
function tuile(fond, dessus, motif) {
  const cle = fond + dessus + motif;
  if (cache.has(cle)) return cache.get(cle);
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  rect(0, 0, TUILE_PX, TUILE_PX, fond);
  dessinerMotif(rect, motif, dessus);
  // Un seul pixel au coin : quatre cellules qui se touchent font un point.
  rect(0, 0, 1, 1, PALETTE.ardoise);
  cache.set(cle, c);
  return c;
}

// La tuile d'un biome, à l'une de ses trois nuances.
function tuileBiome(biome, nuance) {
  const fond = teinte(biome.couleur, NUANCES[nuance]);
  const dessus = teinte(biome.couleur, NUANCES[Math.min(2, nuance + 1)] + 0.10);
  return tuile(fond, dessus, biome.motif);
}

// La tuile d'un passage : les deux fonds mélangés, et la texture de celui qui
// domine. Le motif bascule au milieu, la couleur passe en continu.
function tuilePassage(a, b, part, nuance) {
  const fondA = teinte(a.couleur, NUANCES[nuance]);
  const fondB = teinte(b.couleur, NUANCES[nuance]);
  const gagnant = part < 0.5 ? a : b;
  const dessus = teinte(gagnant.couleur, NUANCES[Math.min(2, nuance + 1)] + 0.10);
  return tuile(melange(fondA, fondB, part), dessus, gagnant.motif);
}

// Une nuance stable par plaque de deux cases sur deux, sans hasard : le sol ne
// bouge jamais d'une image à l'autre, et les nuances font des zones plutôt
// qu'un damier.
function nuanceDe(cx, cy) {
  const px = Math.floor(cx / 2);
  const py = Math.floor(cy / 2);
  return (px * 5 + py * 3 + ((px * py) % 3)) % 3;
}

function poser(ctx, sprite, cx, cy) {
  ctx.drawImage(sprite, cx * CASE, cy * CASE, CASE, CASE);
}

// --- les vignettes ---------------------------------------------------------

export const SOLS = Object.values(BIOMES).map((b) => ({
  titre: b.nom,
  note: b.note,
  duree: 3,
  format: { largeur: 4 * CASE, hauteur: 3 * CASE, echelle: 1 },
  dessiner(ctx) {
    for (let cy = 0; cy < 3; cy++) {
      for (let cx = 0; cx < 4; cx++) poser(ctx, tuileBiome(b, nuanceDe(cx, cy)), cx, cy);
    }
  },
}));

// Les trois nuances d'un même biome, côte à côte : de quoi juger l'écart.
export const NUANCIER = Object.values(BIOMES).map((b) => ({
  titre: b.nom,
  note: 'ses trois nuances, de la plus sombre à la plus claire',
  duree: 3,
  format: { largeur: 3 * CASE, hauteur: CASE, echelle: 1 },
  dessiner(ctx) {
    for (let i = 0; i < 3; i++) poser(ctx, tuileBiome(b, i), i, 0);
  },
}));

function passage(titre, note, largeurFondu) {
  return {
    titre,
    note,
    duree: 3,
    format: FORMAT,
    dessiner(ctx) {
      const a = BIOMES.sucre;
      const b = BIOMES.fraise;
      const milieu = (CASES_L - 1) / 2;
      for (let cy = 0; cy < CASES_H; cy++) {
        for (let cx = 0; cx < CASES_L; cx++) {
          // La part de second biome dans cette colonne : 0 avant, 1 après.
          const brut = (cx - milieu) / largeurFondu + 0.5;
          const part = Math.max(0, Math.min(1, brut));
          poser(ctx, tuilePassage(a, b, part, nuanceDe(cx, cy)), cx, cy);
        }
      }
    },
  };
}

export const PASSAGES = [
  passage('1. Fondu large', 'la couleur passe sur cinq cases : on ne voit pas la frontière', 5),
  passage('2. Fondu court  ✔ retenu', 'sur deux cases : on sent le changement sans le heurter — c’est celui du jeu', 2),
  passage('3. Bord franc', 'aucun fondu : les deux teintes se touchent', 0.001),
  {
    titre: '4. Fondu en dents',
    note: 'le fondu avance et recule d’une case selon la ligne : une côte, pas un mur',
    duree: 3,
    format: FORMAT,
    dessiner(ctx) {
      const a = BIOMES.sucre;
      const b = BIOMES.fraise;
      const milieu = (CASES_L - 1) / 2;
      for (let cy = 0; cy < CASES_H; cy++) {
        const ecart = (cy % 2 === 0 ? -0.6 : 0.6);
        for (let cx = 0; cx < CASES_L; cx++) {
          const brut = (cx - milieu - ecart) / 2 + 0.5;
          const part = Math.max(0, Math.min(1, brut));
          poser(ctx, tuilePassage(a, b, part, nuanceDe(cx, cy)), cx, cy);
        }
      }
    },
  },
];

// Les quatre biomes qui se rejoignent, comme sur la carte. Aucun raccord
// dessiné : la couleur de chaque cellule est le mélange des quatre teintes,
// pesées par la distance. C'est tout ce qu'un passage demande.
export const CARREFOUR = {
  titre: 'Les quatre, fondus',
  note: 'sucre et terre en haut, fraises et menthe en bas — aucune tuile de raccord',
  duree: 3,
  format: { largeur: 8 * CASE, hauteur: 6 * CASE, echelle: 1 },
  dessiner(ctx) {
    const [hg, hd, bg, bd] = [BIOMES.sucre, BIOMES.terre, BIOMES.fraise, BIOMES.menthe];
    for (let cy = 0; cy < 6; cy++) {
      for (let cx = 0; cx < 8; cx++) {
        const px = Math.max(0, Math.min(1, (cx - 2.5) / 3));
        const py = Math.max(0, Math.min(1, (cy - 1.5) / 3));
        const n = nuanceDe(cx, cy);
        const fond = melange(
          melange(teinte(hg.couleur, NUANCES[n]), teinte(hd.couleur, NUANCES[n]), px),
          melange(teinte(bg.couleur, NUANCES[n]), teinte(bd.couleur, NUANCES[n]), px),
          py,
        );
        // La texture est celle du biome le plus proche : elle bascule d'un
        // coup là où la couleur, elle, passe en continu.
        const dominant = py < 0.5 ? (px < 0.5 ? hg : hd) : (px < 0.5 ? bg : bd);
        const dessus = teinte(dominant.couleur, NUANCES[2] + 0.10);
        poser(ctx, tuile(fond, dessus, dominant.motif), cx, cy);
      }
    }
  },
};
