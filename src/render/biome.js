// Le sol de la carte : la teinte de chaque cellule, et la tuile qui va avec.
// Pure présentation — la simulation ne sait pas qu'il existe des biomes.
//
// Une cellule appartient à la région la plus proche. Quand deux régions se la
// disputent, sa teinte est le mélange des deux : c'est tout ce qu'un passage
// demande, il n'y a aucune tuile de raccord à dessiner.

import { PALETTE, TUILE_PX, COLONNES, LIGNES } from '../design.js';
import { BIOMES, REGIONS, NUANCES, FONDU } from '../data/biomes.js';

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

// Un semis fixe : rien d'aléatoire au dessin, sinon le sol scintille d'une
// image à l'autre. Un point d'un pixel, ou un trait d'un pixel d'épaisseur et
// de deux à trois de long — jamais plus.
const POINTS = {
  point: [[3, 3], [10, 5], [6, 10], [13, 12], [2, 13]],
  couche: [[2, 4], [9, 2], [5, 9], [11, 12], [4, 14]],
  rang: [[2, 3], [7, 3], [12, 3], [2, 8], [7, 8], [12, 8], [2, 13], [7, 13], [12, 13]],
  debout: [[4, 4], [11, 6], [6, 11], [13, 13], [2, 9]],
};

const cache = new Map();

function tuile(fond, dessus, motif) {
  const cle = fond + dessus + motif;
  if (cache.has(cle)) return cache.get(cle);
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  g.fillStyle = fond;
  g.fillRect(0, 0, TUILE_PX, TUILE_PX);
  g.fillStyle = dessus;
  for (const [x, y] of POINTS[motif]) {
    if (motif === 'point') g.fillRect(x, y, 1, 1);
    else if (motif === 'debout') g.fillRect(x, y, 1, 2);
    else g.fillRect(x, y, 3, 1);
  }
  // Un seul pixel au coin : quatre cellules qui se touchent font un point.
  g.fillStyle = PALETTE.ardoise;
  g.fillRect(0, 0, 1, 1);
  cache.set(cle, c);
  return c;
}

// --- la carte des sols -----------------------------------------------------

// Une nuance stable par plaque de deux cases sur deux : les nuances font des
// zones plutôt qu'un damier, et le sol ne bouge jamais d'une image à l'autre.
function nuanceDe(cx, cy) {
  const px = Math.floor(cx / 2);
  const py = Math.floor(cy / 2);
  return (px * 5 + py * 3 + ((px * py) % 3)) % 3;
}

// Les deux régions les plus proches, et la part de la seconde.
function voisinage(cx, cy) {
  let premiere = null;
  let seconde = null;
  for (const r of REGIONS) {
    const d = Math.abs(r.cx - cx) + Math.abs(r.cy - cy);
    if (!premiere || d < premiere.d) { seconde = premiere; premiere = { r, d }; continue; }
    if (!seconde || d < seconde.d) seconde = { r, d };
  }
  // À égale distance, moitié-moitié ; au-delà du fondu, la première seule.
  const ecart = (seconde.d - premiere.d) / (2 * FONDU);
  return { premiere: premiere.r, seconde: seconde.r, part: Math.max(0, 0.5 - ecart) };
}

const sols = new Array(COLONNES * LIGNES).fill(null);
const teintes = new Array(COLONNES * LIGNES).fill(null);

function preparer(cx, cy) {
  const { premiere, seconde, part } = voisinage(cx, cy);
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
  sols[i] = tuile(fond, dessus, dominant.motif);
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
