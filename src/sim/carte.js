// La carte d'une partie : ses régions de biome et ses gisements, tirés au sort
// à la création du monde. Ne dessine rien — le rendu lit ce qui sort d'ici.
//
// Le monde fait trente-six fenêtres. Écrire ses cent gisements à la main
// revenait à dessiner la même carte pour tout le monde, à jamais ; ils sont
// donc engendrés, et deux parties ne se ressemblent plus.
//
// **Sauf la clairière.** Le centre du monde ne bouge jamais : sa région est de
// terre, ses quatre gisements sont ceux de data/monde.js, et rien n'est tiré
// dans son rayon. C'est ce qui permet au tutoriel de nommer des cellules
// précises et à l'usine de départ d'être posée d'avance — la carte change
// autour d'eux, jamais sous eux.
//
// La graine est celle de la partie : à graine égale, carte égale. C'est ce qui
// rend une carte rejouable et les outils reproductibles.

import { COLONNES, LIGNES, CENTRE } from '../design.js';
import {
  BIOMES, MATIERE_DE, FONDU, ONDULATION, PAS_ONDULATION, REGION_CENTRALE,
  REGIONS_TIREES, REGIONS_GARANTIES, ECART_REGIONS, RAYON_CLAIRIERE, BOUQUETS, PAR_BOUQUET,
  RAYON_BOUQUET, MINIMUM_PAR_MATIERE,
} from '../data/biomes.js';
import { GISEMENTS } from '../data/monde.js';

// Un générateur reproductible et correctement mélangé : les bits de poids
// faible d'un LCG naïf ne le sont pas, et la carte y ferait des rayures.
export function hasard(graine) {
  let etat = graine >>> 0;
  return () => {
    etat = (etat + 0x6d2b79f5) >>> 0;
    let t = Math.imul(etat ^ (etat >>> 15), 1 | etat);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const distance = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);

// Un hachage stable, entre 0 et 1 : la même cellule rend toujours la même
// valeur, et deux voisines des valeurs sans rapport. Rien n'est tiré au
// dessin — le sol ne doit pas scintiller d'une image à l'autre.
export function bruit(x, y) {
  let h = Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263);
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
}

// Le même, adouci : la valeur est interpolée entre les quatre coins de sa
// maille. Ça donne des taches là où le hachage seul donne du grésillement.
export function bruitLisse(x, y) {
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const fx = x - x0;
  const fy = y - y0;
  // Adoucissement aux bords de la maille, sinon on voit ses arêtes.
  const sx = fx * fx * (3 - 2 * fx);
  const sy = fy * fy * (3 - 2 * fy);
  const haut = bruit(x0, y0) + (bruit(x0 + 1, y0) - bruit(x0, y0)) * sx;
  const bas = bruit(x0, y0 + 1) + (bruit(x0 + 1, y0 + 1) - bruit(x0, y0 + 1)) * sx;
  return haut + (bas - haut) * sy;
}

// Les deux régions les plus proches d'une cellule, et la part de la seconde.
// C'est la seule chose qu'il faut savoir d'un sol : le rendu en tire une
// teinte, le tirage des gisements en tire une matière.
export function voisinage(regions, cx, cy) {
  // La frontière ondule : sans ça, deux régions se partagent le sol le long
  // d'une droite, et le passage d'un biome à l'autre se voit à la règle. Ce
  // n'est pas la distance qu'on fausse mais la cellule : on la déplace d'un
  // bruit doux avant de mesurer. Les taches gardent leur forme, leur bord
  // serpente, et deux cellules voisines dérivent ensemble.
  const x = cx + (bruitLisse(cx / PAS_ONDULATION, cy / PAS_ONDULATION) - 0.5) * 2 * ONDULATION;
  const y = cy + (bruitLisse((cx + 97) / PAS_ONDULATION, (cy + 31) / PAS_ONDULATION) - 0.5) * 2 * ONDULATION;
  let premiere = null;
  let seconde = null;
  for (const r of regions) {
    const d = Math.abs(r.cx - x) + Math.abs(r.cy - y);
    if (!premiere || d < premiere.d) { seconde = premiere; premiere = { r, d }; continue; }
    if (!seconde || d < seconde.d) seconde = { r, d };
  }
  // À égale distance, moitié-moitié ; au-delà du fondu, la première seule.
  const ecart = (seconde.d - premiere.d) / (2 * FONDU);
  return { premiere: premiere.r, seconde: seconde.r, part: Math.max(0, 0.5 - ecart) };
}

// Le biome qui règne sur une cellule : celui des deux voisines qui l'emporte.
export function biomeEn(regions, cx, cy) {
  const { premiere, seconde, part } = voisinage(regions, cx, cy);
  return part < 0.5 ? premiere.biome : seconde.biome;
}

// Les régions : celle du milieu, puis des graines semées au hasard, en gardant
// un écart minimal. On abandonne après un nombre d'essais raisonnable plutôt
// que de boucler — une région de moins ne se voit pas, une page figée si.
function semerRegions(tirer) {
  const regions = [{ cx: CENTRE.cx, cy: CENTRE.cy, biome: REGION_CENTRALE.biome }];
  const noms = Object.keys(BIOMES);
  // Un plancher, mélangé : les premières régions posées se partagent les quatre
  // biomes, deux fois chacun, dans un ordre tiré. Ensuite le tirage est libre.
  // Leur place reste au hasard dans tous les cas — c'est la présence qui est
  // garantie, pas la carte.
  const dus = [];
  for (let i = 0; i < REGIONS_GARANTIES; i++) dus.push(...noms);
  for (let i = dus.length - 1; i > 0; i--) {
    const j = Math.floor(tirer() * (i + 1));
    [dus[i], dus[j]] = [dus[j], dus[i]];
  }
  for (let essais = 0; essais < REGIONS_TIREES * 40; essais++) {
    if (regions.length > REGIONS_TIREES) break;
    const cx = Math.floor(tirer() * COLONNES);
    const cy = Math.floor(tirer() * LIGNES);
    if (regions.some((r) => distance(r, { cx, cy }) < ECART_REGIONS)) continue;
    const biome = dus.length > 0 ? dus.pop() : noms[Math.floor(tirer() * noms.length)];
    regions.push({ cx, cy, biome });
  }
  return regions;
}

// Les gisements : ceux de la clairière tels quels, puis des bouquets semés
// partout ailleurs. Chaque bouquet porte la matière du biome où tombe son
// cœur — c'est ce qui fait qu'on sait où chercher rien qu'à la couleur du sol.
function semerGisements(tirer, regions) {
  const pris = new Set();
  const gisements = [];
  // La clairière se refuse ici, et pas seulement au cœur du bouquet : un
  // bouquet s'étale de deux cases, et ses bords tombaient dedans. Ses quatre
  // gisements écrits doivent rester les plus proches — c'est toute la promesse
  // du premier écran.
  const poser = (cx, cy, item, ecrit = false) => {
    if (cx < 0 || cy < 0 || cx >= COLONNES || cy >= LIGNES) return;
    if (!ecrit && distance({ cx, cy }, CENTRE) < RAYON_CLAIRIERE) return;
    const cle = cx + ',' + cy;
    if (pris.has(cle)) return;
    pris.add(cle);
    gisements.push({ cx, cy, item });
  };
  for (const g of GISEMENTS) poser(g.cx, g.cy, g.item, true);

  for (let b = 0; b < BOUQUETS; b++) {
    const cx = Math.floor(tirer() * COLONNES);
    const cy = Math.floor(tirer() * LIGNES);
    const item = MATIERE_DE[biomeEn(regions, cx, cy)];
    if (!item) continue;
    bouquet(tirer, cx, cy, item, poser);
  }

  // Aucune matière ne peut manquer. Un bouquet tombe où il tombe : garantir
  // des régions ne garantit pas des gisements, et une graine sur cent donnait
  // une carte à un seul arbre. On compte, et on complète au pied d'une région
  // du bon biome — jamais dans la clairière, qui garde ses quatre.
  const compte = {};
  for (const g of gisements) compte[g.item] = (compte[g.item] || 0) + 1;
  for (const biome of Object.keys(MATIERE_DE)) {
    const item = MATIERE_DE[biome];
    const siennes = regions.filter(
      (r) => r.biome === biome && distance(r, CENTRE) >= RAYON_CLAIRIERE,
    );
    if (siennes.length === 0) continue;
    for (let essais = 0; essais < 60 && (compte[item] || 0) < MINIMUM_PAR_MATIERE; essais++) {
      const r = siennes[Math.floor(tirer() * siennes.length)];
      const avant = gisements.length;
      bouquet(tirer, r.cx, r.cy, item, poser);
      compte[item] = (compte[item] || 0) + gisements.length - avant;
    }
  }
  return gisements;
}

// Un bouquet : quelques gisements de la même matière, serrés autour d'un cœur.
function bouquet(tirer, cx, cy, item, poser) {
  const [mini, maxi] = PAR_BOUQUET;
  const combien = mini + Math.floor(tirer() * (maxi - mini + 1));
  for (let i = 0; i < combien; i++) {
    const dx = Math.round((tirer() * 2 - 1) * RAYON_BOUQUET);
    const dy = Math.round((tirer() * 2 - 1) * RAYON_BOUQUET);
    poser(cx + dx, cy + dy, item);
  }
}

export function creerCarte(graine) {
  const tirer = hasard(graine);
  const regions = semerRegions(tirer);
  return { regions, gisements: semerGisements(tirer, regions) };
}
