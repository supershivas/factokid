// La carte d'une partie : ses gisements, semés à la graine. Ne dessine rien —
// le rendu lit ce qui sort d'ici.
//
// **Le monde se lit en étages.** Cinq bandes horizontales de douze rangées,
// du bas vers le haut, décrites dans `data/zones.js` : un étage, un biome, une
// matière. Le biome d'une cellule est donc donné par sa rangée, et rien
// d'autre — il n'y a plus de régions tirées au hasard dans le plan, plus de
// garanties par matière, plus de plancher de rattrapage. Il ne peut pas
// manquer de sucre dans le monde du sucre.
//
// Ce que la carte invente encore, c'est où tombent les gisements : semés par
// **bouquets** — un arbre seul n'est pas une forêt, et c'est un bosquet qu'on
// veut trouver au bout d'un tapis — chacun dans l'étage où il naît.
//
// **Sauf le pied du monde.** Autour du départ, à l'étage 1, rien n'est tiré :
// ses gisements sont écrits dans `data/monde.js`. C'est ce qui permet au
// tutoriel de nommer des cellules précises et à l'usine de départ d'être posée
// d'avance — la carte change autour d'eux, jamais sous eux.
//
// La graine est celle de la partie : à graine égale, carte égale. C'est ce qui
// rend une carte rejouable et les outils reproductibles.

import { COLONNES, LIGNES } from '../design.js';
import {
  FONDU, ONDULATION, PAS_ONDULATION, BOUQUETS_PAR_ETAGE, PAR_BOUQUET,
  RAYON_BOUQUET, RAYON_DEPART,
} from '../data/biomes.js';
import { ETAGES, HAUTEUR_ETAGE } from '../data/zones.js';
import { GISEMENTS, PIED_DU_MONDE } from '../data/monde.js';

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

// --- les étages ------------------------------------------------------------

// Les rangées d'un étage, et celle de son mur. L'étage 1 est en bas du monde :
// on ne progresse que vers le haut. Le mur est la rangée qui le ferme, tout en
// haut de sa bande — quand on est au pied de l'étage, on le voit.
export function rangeesDe(n) {
  const haut = LIGNES - n * HAUTEUR_ETAGE;
  return { haut, bas: haut + HAUTEUR_ETAGE - 1, mur: haut };
}

const dernier = ETAGES.length - 1;

// L'indice de l'étage qui contient cette rangée. Prend un nombre continu : le
// fondu entre deux bandes travaille entre les rangées.
function indiceDe(y) {
  const i = Math.floor((LIGNES - 1 - y) / HAUTEUR_ETAGE);
  return Math.max(0, Math.min(dernier, i));
}

// L'étage d'une cellule. Tout le reste du jeu passe par là plutôt que de
// refaire la division.
export function etageDe(cy) {
  return ETAGES[indiceDe(cy)];
}

// Les deux biomes qui se disputent une cellule, et la part du second. C'est
// tout ce qu'il faut savoir d'un sol : le rendu en tire une teinte.
//
// La frontière ondule : sans ça, deux bandes se partagent le sol le long d'une
// droite, et le passage d'un biome à l'autre se voit à la règle. Ce n'est pas
// la distance qu'on fausse mais la cellule : on la déplace d'un bruit doux
// avant de regarder où elle tombe. Les bandes gardent leur hauteur, leur bord
// serpente, et deux cellules voisines dérivent ensemble.
export function voisinage(cx, cy) {
  const y = cy + (bruitLisse(cx / PAS_ONDULATION, cy / PAS_ONDULATION) - 0.5) * 2 * ONDULATION;
  const i = indiceDe(y);
  // Les deux bords de la bande, et celui dont on est le plus près.
  const versHaut = y - (LIGNES - (i + 1) * HAUTEUR_ETAGE - 0.5);
  const versBas = (LIGNES - i * HAUTEUR_ETAGE - 0.5) - y;
  const j = Math.max(0, Math.min(dernier, versHaut < versBas ? i + 1 : i - 1));
  const d = Math.max(0, Math.min(versHaut, versBas));
  // À cheval sur le bord, moitié-moitié ; au-delà du fondu, la bande seule.
  return {
    premiere: ETAGES[i].biome,
    seconde: ETAGES[j].biome,
    part: Math.max(0, 0.5 - d / (2 * FONDU)),
  };
}

// Le biome qui règne sur une cellule : celui des deux voisins qui l'emporte.
export function biomeEn(cx, cy) {
  const { premiere, seconde, part } = voisinage(cx, cy);
  return part < 0.5 ? premiere : seconde;
}

// --- les gisements ---------------------------------------------------------

// Ceux du pied du monde tels quels, puis des bouquets dans chaque étage qui
// porte une matière. Un bouquet ne déborde jamais de sa bande : c'est ce qui
// fait qu'on sait où chercher quoi rien qu'à la hauteur où l'on est.
function semerGisements(tirer) {
  const pris = new Set();
  const gisements = [];
  // Le pied du monde se refuse ici, et pas seulement au cœur du bouquet : un
  // bouquet s'étale de deux cases, et ses bords tombaient dedans. Les
  // gisements écrits doivent rester les plus proches du départ — c'est toute
  // la promesse du premier écran.
  const poser = (cx, cy, item, ecrit = false) => {
    if (cx < 0 || cy < 0 || cx >= COLONNES || cy >= LIGNES) return;
    if (!ecrit && distance({ cx, cy }, PIED_DU_MONDE) < RAYON_DEPART) return;
    const cle = cx + ',' + cy;
    if (pris.has(cle)) return;
    pris.add(cle);
    gisements.push({ cx, cy, item });
  };
  for (const g of GISEMENTS) poser(g.cx, g.cy, g.item, true);

  for (const etage of ETAGES) {
    if (!etage.matiere) continue;
    const { haut, bas } = rangeesDe(etage.n);
    // La rangée du mur ne porte rien : on ne peut pas y bâtir, un gisement y
    // serait un gisement qu'on regarde sans jamais le récolter.
    const premiere = haut + 1;
    for (let b = 0; b < BOUQUETS_PAR_ETAGE; b++) {
      const cx = Math.floor(tirer() * COLONNES);
      const cy = premiere + Math.floor(tirer() * (bas - premiere + 1));
      bouquet(tirer, cx, cy, etage.matiere, premiere, bas, poser);
    }
  }
  return gisements;
}

// Un bouquet : quelques gisements de la même matière, serrés autour d'un cœur.
// Il reste dans sa bande — un arbre au milieu des fraises dirait le contraire
// de ce que le sol raconte.
function bouquet(tirer, cx, cy, item, premiere, derniere, poser) {
  const [mini, maxi] = PAR_BOUQUET;
  const combien = mini + Math.floor(tirer() * (maxi - mini + 1));
  for (let i = 0; i < combien; i++) {
    const dx = Math.round((tirer() * 2 - 1) * RAYON_BOUQUET);
    const dy = Math.round((tirer() * 2 - 1) * RAYON_BOUQUET);
    poser(cx + dx, Math.max(premiere, Math.min(derniere, cy + dy)), item);
  }
}

export function creerCarte(graine) {
  return { gisements: semerGisements(hasard(graine)) };
}
