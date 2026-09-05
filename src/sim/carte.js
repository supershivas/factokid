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
  BIOMES, MATIERE_DE, FONDU, REGION_CENTRALE, REGIONS_TIREES, ECART_REGIONS,
  RAYON_CLAIRIERE, BOUQUETS, PAR_BOUQUET, RAYON_BOUQUET,
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

// Les deux régions les plus proches d'une cellule, et la part de la seconde.
// C'est la seule chose qu'il faut savoir d'un sol : le rendu en tire une
// teinte, le tirage des gisements en tire une matière.
export function voisinage(regions, cx, cy) {
  let premiere = null;
  let seconde = null;
  for (const r of regions) {
    const d = Math.abs(r.cx - cx) + Math.abs(r.cy - cy);
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
  for (let essais = 0; essais < REGIONS_TIREES * 30; essais++) {
    if (regions.length > REGIONS_TIREES) break;
    const cx = Math.floor(tirer() * COLONNES);
    const cy = Math.floor(tirer() * LIGNES);
    if (regions.some((r) => distance(r, { cx, cy }) < ECART_REGIONS)) continue;
    regions.push({ cx, cy, biome: noms[Math.floor(tirer() * noms.length)] });
  }
  return regions;
}

// Les gisements : ceux de la clairière tels quels, puis des bouquets semés
// partout ailleurs. Chaque bouquet porte la matière du biome où tombe son
// cœur — c'est ce qui fait qu'on sait où chercher rien qu'à la couleur du sol.
function semerGisements(tirer, regions) {
  const pris = new Set();
  const gisements = [];
  const poser = (cx, cy, item) => {
    if (cx < 0 || cy < 0 || cx >= COLONNES || cy >= LIGNES) return;
    const cle = cx + ',' + cy;
    if (pris.has(cle)) return;
    pris.add(cle);
    gisements.push({ cx, cy, item });
  };
  for (const g of GISEMENTS) poser(g.cx, g.cy, g.item);

  const [mini, maxi] = PAR_BOUQUET;
  for (let b = 0; b < BOUQUETS; b++) {
    const cx = Math.floor(tirer() * COLONNES);
    const cy = Math.floor(tirer() * LIGNES);
    // La clairière garde ses quatre gisements pour elle : ce sont eux que le
    // premier tapis doit trouver.
    if (distance({ cx, cy }, CENTRE) < RAYON_CLAIRIERE) continue;
    const item = MATIERE_DE[biomeEn(regions, cx, cy)];
    if (!item) continue;
    const combien = mini + Math.floor(tirer() * (maxi - mini + 1));
    for (let i = 0; i < combien; i++) {
      const dx = Math.round((tirer() * 2 - 1) * RAYON_BOUQUET);
      const dy = Math.round((tirer() * 2 - 1) * RAYON_BOUQUET);
      poser(cx + dx, cy + dy, item);
    }
  }
  return gisements;
}

export function creerCarte(graine) {
  const tirer = hasard(graine);
  const regions = semerRegions(tirer);
  return { regions, gisements: semerGisements(tirer, regions) };
}
