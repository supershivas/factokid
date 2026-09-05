// Le sol de la carte : la teinte de chaque cellule, et la tuile qui va avec.
// Pure présentation — la simulation ne sait pas qu'il existe des biomes.
//
// Une cellule appartient à la région la plus proche. Quand deux régions se la
// disputent, sa teinte est le mélange des deux : c'est tout ce qu'un passage
// demande, il n'y a aucune tuile de raccord à dessiner.
//
// Les régions sont celles de la partie en cours, tirées à sa création : le
// rendu ne les invente pas, il les reçoit par `poserRegions()` — sinon le sol
// d'une carte resterait affiché sur la suivante.

import { PALETTE, TUILE_PX, COLONNES, LIGNES } from '../design.js';
import { BIOMES, NUANCES } from '../data/biomes.js';
import { voisinage, bruit, bruitLisse } from '../sim/carte.js';

// --- teintes ---------------------------------------------------------------

const versRvb = (hex) => [
  parseInt(hex.slice(1, 3), 16),
  parseInt(hex.slice(3, 5), 16),
  parseInt(hex.slice(5, 7), 16),
];

const NOIR = versRvb(PALETTE.noir);

function versHex(c) {
  const deux = (n) => Math.round(n).toString(16).padStart(2, '0');
  return '#' + deux(c[0]) + deux(c[1]) + deux(c[2]);
}

// Une couleur de la palette posée sur le noir, à une transparence donnée.
function teinte(couleur, alpha) {
  const c = versRvb(PALETTE[couleur]);
  return versHex(c.map((v, i) => NOIR[i] + (v - NOIR[i]) * alpha));
}

function melange(a, b, part) {
  const ca = versRvb(a);
  const cb = versRvb(b);
  return versHex(ca.map((v, i) => v + (cb[i] - v) * part));
}

// --- texture ---------------------------------------------------------------

// Le semis d'un biome : quelques marques d'un pixel, jamais plus. Rien n'est
// tiré au moment de dessiner — le sol scintillerait d'une image à l'autre —
// mais chaque cellule choisit son semis parmi plusieurs, et c'est ce qui casse
// le carrelage. Un semis unique par biome faisait réapparaître les mêmes cinq
// points dans chaque case, tous les quarante-huit unités : on ne voyait plus
// que la grille.
const VARIANTES = 12;
const MARQUES = [3, 7]; // combien par cellule, bornes comprises

// Chaque motif dit ce qu'il pose : un point, un trait couché, un trait debout.
const TRACES = {
  point: [1, 1],
  couche: [3, 1],
  rang: [3, 1],
  debout: [1, 3],
};

// Les semis, peints une fois pour toutes. Le hachage sert ici à écrire la
// table, pas à dessiner : elle est la même à chaque lancement.
const SEMIS = {};
for (const motif of Object.keys(TRACES)) {
  const [l, h] = TRACES[motif];
  SEMIS[motif] = [];
  for (let v = 0; v < VARIANTES; v++) {
    const marques = [];
    const combien = MARQUES[0]
      + Math.floor(bruit(v * 31 + 7, motif.length * 13) * (MARQUES[1] - MARQUES[0] + 1));
    for (let i = 0; i < combien; i++) {
      // Les marques peuvent frôler le bord : c'est ce qui les fait déborder
      // d'une cellule sur l'autre, et le sol cesse d'avoir des coutures.
      marques.push([
        Math.floor(bruit(v * 101 + i, motif.length * 7 + 3) * (TUILE_PX - l)),
        Math.floor(bruit(motif.length * 17 + 5, v * 53 + i) * (TUILE_PX - h)),
      ]);
    }
    SEMIS[motif].push(marques);
  }
}

const cache = new Map();

function tuile(fond, dessus, motif, variante) {
  const cle = fond + dessus + motif + variante;
  if (cache.has(cle)) return cache.get(cle);
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  g.fillStyle = fond;
  g.fillRect(0, 0, TUILE_PX, TUILE_PX);
  g.fillStyle = dessus;
  const [l, h] = TRACES[motif];
  for (const [x, y] of SEMIS[motif][variante]) g.fillRect(x, y, l, h);
  // Un pixel au coin : quatre cellules qui se touchent font un point, et c'est
  // tout ce qui reste de la grille sous les pieds. Il était en ardoise —
  // pleine couleur sur un sol à dix pour cent — et faisait un quadrillage de
  // points brillants qu'on voyait avant le sol. À la teinte de la texture, il
  // dit la case sans la crier.
  g.fillStyle = dessus;
  g.fillRect(0, 0, 1, 1);
  cache.set(cle, c);
  return c;
}

// --- la carte des sols -----------------------------------------------------

// La nuance d'une cellule. C'était une formule sur des plaques de deux cases
// sur deux : elle faisait des rayures en diagonale, régulières comme un
// carrelage. C'est maintenant un bruit doux à deux échelles — de larges taches,
// et un peu de grain par-dessus — et les nuances font des zones de forme
// quelconque. Rien ne bouge d'une image à l'autre : c'est une fonction de la
// cellule, pas un tirage.
// Trois échelles dont les mailles ne s'alignent pas, lues à un point qu'on a
// d'abord déplacé. Un bruit seul donne des rectangles : ce sont les mailles du
// bruit, vues à travers trois paliers. Décalées et empilées, elles ne se
// voient plus.
const PAS_NUANCE = [7, 3.1, 1.7];
const PARTS = [0.5, 0.32, 0.18];
const DERIVE = 4;

function nuanceDe(cx, cy) {
  const x = cx + (bruitLisse(cx / DERIVE, cy / DERIVE) - 0.5) * DERIVE;
  const y = cy + (bruitLisse((cx + 53) / DERIVE, (cy + 17) / DERIVE) - 0.5) * DERIVE;
  let v = 0;
  for (let i = 0; i < PAS_NUANCE.length; i++) {
    v += bruitLisse(x / PAS_NUANCE[i], y / PAS_NUANCE[i]) * PARTS[i];
  }
  return Math.min(2, Math.floor(v * 3));
}

// Le semis que porte cette cellule : un hachage, donc stable et sans rapport
// avec celui d'à côté. C'est là que le carrelage se défait.
function varianteDe(cx, cy) {
  return Math.floor(bruit(cx * 3 + 11, cy * 5 + 29) * VARIANTES);
}

const sols = new Array(COLONNES * LIGNES).fill(null);
const teintes = new Array(COLONNES * LIGNES).fill(null);
let regions = [];

// Les régions de la partie qui commence. Tout ce qui était peint appartenait à
// la précédente : on l'oublie.
export function poserRegions(nouvelles) {
  regions = nouvelles;
  sols.fill(null);
  teintes.fill(null);
}

function preparer(cx, cy) {
  const { premiere, seconde, part } = voisinage(regions, cx, cy);
  const a = BIOMES[premiere.biome];
  const b = BIOMES[seconde.biome];
  const n = nuanceDe(cx, cy);
  const fond = melange(teinte(a.couleur, NUANCES[n]), teinte(b.couleur, NUANCES[n]), part);
  // La texture est celle du biome qui domine : elle bascule d'un coup là où la
  // couleur, elle, passe en continu.
  const dominant = part < 0.5 ? a : b;
  // La texture monte d'un cran au-dessus de la nuance la plus claire : assez
  // pour se voir, pas assez pour tirer l'œil au-dessus des items.
  const dessus = teinte(dominant.couleur, NUANCES[2] + 0.07);
  const i = cy * COLONNES + cx;
  teintes[i] = fond;
  sols[i] = tuile(fond, dessus, dominant.motif, varianteDe(cx, cy));
}

export function tuileSol(cx, cy) {
  const i = cy * COLONNES + cx;
  if (!sols[i]) preparer(cx, cy);
  return sols[i];
}

// La couleur seule, pour la mini-carte.
export function teinteSol(cx, cy) {
  const i = cy * COLONNES + cx;
  if (!teintes[i]) preparer(cx, cy);
  return teintes[i];
}
