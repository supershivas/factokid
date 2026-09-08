// Chantier des sols colorés : six façons de teindre la carte, jugées là où
// elles comptent — sous un tapis bleu et sous des matières.
//
// Le sol du jeu est aujourd'hui une couleur posée sur le noir à trois
// transparences très basses, de huit à quatorze pour cent. C'est ce qui le
// rend presque noir : on distingue les biomes de loin, mais on ne dirait pas
// que la carte a des couleurs. Monter ces transparences est le seul réglage
// qu'il y ait, et une direction n'est rien d'autre qu'un jeu de valeurs.
//
// Une seule chose décide vraiment, et elle se mesure : le contour noir d'une
// matière doit trancher sur le sol. Sous 3 : 1, une matière posée à même le
// sol se dissout — c'est la règle de outils/lisibilite.mjs, et chaque vignette
// affiche son chiffre.

import { PALETTE, FACES, TUILE_PX } from '../src/design.js';
import { MOTIFS } from '../src/render/motifs.js';
import { bruit, bruitLisse } from '../src/sim/carte.js';
import { BIOMES } from '../src/data/biomes.js';
import { ITEMS } from '../src/data/items.js';

const CASE = 32;
const CASES_L = 9;
const CASES_H = 5;
export const FORMAT = { largeur: CASES_L * CASE, hauteur: CASES_H * CASE, echelle: 1 };

// --- teintes ---------------------------------------------------------------

const rvb = (hex) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16));
const hex = (c) => '#' + c.map((v) => Math.round(v).toString(16).padStart(2, '0')).join('');
const melange = (a, b, part) => hex(rvb(a).map((v, i) => v + (rvb(b)[i] - v) * part));

// Une couleur posée sur une autre, à une transparence donnée. C'est toute la
// recette d'un sol : il n'y a jamais de teinte écrite à la main.
const pose = (couleur, sur, alpha) => melange(sur, couleur, alpha);

function luminance(h) {
  const c = rvb(h).map((v) => v / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}

export function contraste(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// --- les six directions ----------------------------------------------------
//
// `fond` dit sur quoi la couleur du biome se pose : le noir, comme
// aujourd'hui, ou l'ombre de sa propre famille — c'est ce que `FACES` donne, et
// c'est ce qui fait passer un sol du sombre au coloré sans le rendre clair.
//
// `nuances` sont les trois transparences du sol, `texture` celle du semis, et
// `face` la couleur qu'il prend : le corps du biome, ou sa clarté. Une texture
// claire est le vernis du bonbon, appliqué au sol.

export const DIRECTIONS = [
  {
    id: 'temoin', nom: 'Ce qu’on a', fond: 'noir', face: 'corps',
    nuances: [0.08, 0.11, 0.14], texture: 0.21, faceTexture: 'corps',
    these: 'Le sol d’aujourd’hui, pour comparer. Presque noir : on voit les biomes, on ne voit pas leur couleur.',
  },
  {
    id: 'double', nom: 'Deux fois plus', fond: 'noir', face: 'corps',
    nuances: [0.16, 0.22, 0.28], texture: 0.38, faceTexture: 'corps',
    these: 'La même recette, au double. Rien de neuf à comprendre : c’est un réglage, pas une idée.',
  },
  {
    id: 'bonbon', nom: 'Bonbon', fond: 'noir', face: 'corps',
    nuances: [0.20, 0.26, 0.32], texture: 0.46, faceTexture: 'clair',
    these: 'Le sol prend le vernis des touches : sa texture passe à la clarté de la famille. Le sol brille un peu.',
  },
  {
    id: 'famille', nom: 'Sur son ombre', fond: 'ombre', face: 'corps',
    nuances: [0.10, 0.16, 0.22], texture: 0.34, faceTexture: 'clair',
    these: 'La couleur ne se pose plus sur le noir mais sur l’ombre de sa propre famille. Coloré sans être clair.',
  },
  {
    id: 'vitrail', nom: 'Vitrail', fond: 'ombre', face: 'corps',
    nuances: [0.04, 0.12, 0.20], texture: 0.30, faceTexture: 'corps',
    these: 'L’ombre de la famille en aplat, à peine nuancée. Ce sont de vraies couleurs, pas des voiles.',
  },
  {
    id: 'glace', nom: 'Sucre glace', fond: 'noir', face: 'corps',
    nuances: [0.34, 0.42, 0.50], texture: 0.64, faceTexture: 'clair',
    these: 'Le plus loin qu’on puisse aller. Un livre d’enfant — et la limite où le contour d’une matière lâche.',
  },
];

// La couleur de fond d'une famille : le noir, ou l'ombre de la famille.
function socleDe(d, couleur) {
  return d.fond === 'noir' ? PALETTE.noir : PALETTE[FACES[couleur].sombre];
}

// Les trois teintes d'un biome dans une direction donnée, plus celle du semis.
export function teintesDe(d, couleur) {
  const socle = socleDe(d, couleur);
  const corps = PALETTE[FACES[couleur][d.face]];
  const semis = PALETTE[FACES[couleur][d.faceTexture]];
  return {
    nuances: d.nuances.map((a) => pose(corps, socle, a)),
    semis: pose(semis, socle, d.texture),
  };
}

// Ce qui décide.
//
// Sur un sol sombre, le contour noir d'une matière ne sert à rien : c'est la
// silhouette colorée qui porte la forme, et le design system le dit déjà. Sur
// un sol clair, c'est l'inverse — la couleur se rapproche du fond et c'est le
// contour qui la détache. Une matière est donc lisible si **l'une des deux**
// tient : sa couleur tranche sur le sol (1,5 : 1), ou son contour tranche
// (3 : 1). Elle disparaît quand les deux lâchent en même temps, et c'est ce
// seul cas qu'on cherche.
//
// On rend la pire paire — matière, teinte de sol — de toute la direction : sa
// marge, et de quoi elle vit.
const SEUIL_COULEUR = 1.5;
const SEUIL_CONTOUR = 3;

export function verdict(d) {
  let pire = null;
  for (const b of Object.values(BIOMES)) {
    const t = teintesDe(d, b.couleur);
    for (const sol of [...t.nuances, t.semis]) {
      const parLeContour = contraste(PALETTE.noir, sol) / SEUIL_CONTOUR;
      for (const item of Object.values(ITEMS)) {
        const parLaCouleur = contraste(PALETTE[item.couleur], sol) / SEUIL_COULEUR;
        const marge = Math.max(parLaCouleur, parLeContour);
        if (!pire || marge < pire.marge) {
          pire = {
            marge,
            item: item.nom,
            biome: b.nom,
            par: parLaCouleur >= parLeContour ? 'sa couleur' : 'son contour',
          };
        }
      }
    }
  }
  return pire;
}

// --- semis -----------------------------------------------------------------

const TRACES = { point: [1, 1], couche: [3, 1], rang: [3, 1], debout: [1, 3] };
const VARIANTES = 12;
const MARQUES = [3, 7];

const SEMIS = {};
for (const motif of Object.keys(TRACES)) {
  const [l, h] = TRACES[motif];
  SEMIS[motif] = [];
  for (let v = 0; v < VARIANTES; v++) {
    const combien = MARQUES[0]
      + Math.floor(bruit(v * 31 + 7, motif.length * 13) * (MARQUES[1] - MARQUES[0] + 1));
    const marques = [];
    for (let i = 0; i < combien; i++) {
      marques.push([
        Math.floor(bruit(v * 101 + i, motif.length * 7 + 3) * (TUILE_PX - l)),
        Math.floor(bruit(motif.length * 17 + 5, v * 53 + i) * (TUILE_PX - h)),
      ]);
    }
    SEMIS[motif].push(marques);
  }
}

const PAS_NUANCE = [7, 3.1, 1.7];
const PARTS = [0.5, 0.32, 0.18];

function nuanceDe(cx, cy) {
  let v = 0;
  for (let i = 0; i < PAS_NUANCE.length; i++) {
    v += bruitLisse(cx / PAS_NUANCE[i], cy / PAS_NUANCE[i]) * PARTS[i];
  }
  return Math.min(2, Math.floor(v * 3));
}

// --- la vignette -----------------------------------------------------------

// Deux biomes qui se rencontrent, un tapis bleu qui les traverse, et trois
// matières posées à même le sol : c'est la seule scène qui répond à la
// question. Un sol se juge sous ce qu'on met dessus.
function dessinerSol(g, d, gauche, droite) {
  const a = BIOMES[gauche];
  const b = BIOMES[droite];
  const ta = teintesDe(d, a.couleur);
  const tb = teintesDe(d, b.couleur);
  const milieu = CASES_L / 2;

  for (let cy = 0; cy < CASES_H; cy++) {
    for (let cx = 0; cx < CASES_L; cx++) {
      // La frontière ondule : c'est un bruit doux sur la distance, comme dans
      // le jeu — une droite se verrait à la règle.
      const bord = milieu + (bruitLisse(cy / 3, 4) - 0.5) * 2;
      const part = Math.max(0, Math.min(1, (cx + 0.5 - bord) / 2 + 0.5));
      const n = nuanceDe(cx, cy);
      g.fillStyle = melange(ta.nuances[n], tb.nuances[n], part);
      g.fillRect(cx * CASE, cy * CASE, CASE, CASE);

      const dominant = part < 0.5 ? a : b;
      g.fillStyle = part < 0.5 ? ta.semis : tb.semis;
      const [l, h] = TRACES[dominant.motif];
      const v = Math.floor(bruit(cx * 3 + 11, cy * 5 + 29) * VARIANTES);
      const k = CASE / TUILE_PX;
      for (const [x, y] of SEMIS[dominant.motif][v]) {
        g.fillRect(cx * CASE + x * k, cy * CASE + y * k, l * k, h * k);
      }
      g.fillRect(cx * CASE, cy * CASE, k, k);
    }
  }
}

// Un morceau de tapis, aux couleurs qu'il a maintenant.
function dessinerTapis(g, y) {
  const k = CASE / TUILE_PX;
  g.fillStyle = PALETTE.noir;
  g.fillRect(0, y + 4 * k, CASES_L * CASE, 16 * k);
  g.fillStyle = PALETTE.bleu;
  g.fillRect(0, y + 6 * k, CASES_L * CASE, 12 * k);
  g.fillStyle = PALETTE.cyan;
  for (let x = 2; x < CASES_L * TUILE_PX; x += 6) {
    g.fillRect(x * k, y + 4 * k, 3 * k, k);
    g.fillRect(x * k, y + 19 * k, 3 * k, k);
  }
  g.fillStyle = PALETTE.nuit;
  for (let x = 2; x < CASES_L * TUILE_PX; x += 8) {
    for (let i = 0; i <= 5; i++) {
      g.fillRect((x + 5 - i) * k, y + (11 - i) * k, k, k);
      g.fillRect((x + 5 - i) * k, y + (11 + i) * k, k, k);
    }
  }
}

// Une matière posée à même le sol : c'est le cas qui décide, puisque rien ne
// la sépare du fond que son propre contour.
function dessinerMatiere(g, motif, couleur, x, y) {
  const k = CASE / (TUILE_PX / 1.5); // la matière fait 9 pixels d'art de côté
  const teintes = { n: PALETTE.noir, c: PALETTE[couleur], b: PALETTE.creme };
  const m = MOTIFS[motif];
  for (let l = 0; l < m.length; l++) {
    for (let c = 0; c < m[l].length; c++) {
      const s = m[l][c];
      if (s === '.') continue;
      g.fillStyle = teintes[s];
      g.fillRect(x + c * k, y + l * k, k, k);
    }
  }
}

export function peindre(canvas, id) {
  const d = DIRECTIONS.find((x) => x.id === id);
  const g = canvas.getContext('2d');
  dessinerSol(g, d, 'fraise', 'menthe');
  dessinerMatiere(g, 'fraise', 'rouge', CASE, CASE * 0.6);
  dessinerMatiere(g, 'buche', 'orange', CASE * 3, CASE * 0.6);
  dessinerMatiere(g, 'cube', 'creme', CASE * 5, CASE * 0.6);
  dessinerMatiere(g, 'rond', 'orange', CASE * 7, CASE * 0.6);
  dessinerTapis(g, CASE * 2);
  dessinerSol2(g, d);
}

// Les deux autres familles, sur la bande du bas : les quatre biomes se voient
// donc d'un coup, et c'est leur écart qui dit si le sol renseigne encore.
function dessinerSol2(g, d) {
  const bas = CASE * 3.6;
  const familles = ['sucre', 'terre'];
  for (let i = 0; i < familles.length; i++) {
    const b = BIOMES[familles[i]];
    const t = teintesDe(d, b.couleur);
    const l = (CASES_L * CASE) / 2;
    for (let cx = 0; cx < CASES_L / 2; cx++) {
      const n = nuanceDe(cx + i * 9, 11);
      g.fillStyle = t.nuances[n];
      g.fillRect(i * l + cx * CASE, bas, CASE, CASES_H * CASE - bas);
      g.fillStyle = t.semis;
      const k = CASE / TUILE_PX;
      const [ml, mh] = TRACES[b.motif];
      const v = Math.floor(bruit(cx * 3 + 11, (i + 7) * 5 + 29) * VARIANTES);
      for (const [x, y] of SEMIS[b.motif][v]) {
        if (y * k > CASES_H * CASE - bas) continue;
        g.fillRect(i * l + cx * CASE + x * k, bas + y * k, ml * k, mh * k);
      }
    }
  }
}
