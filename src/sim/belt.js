// Convoyeurs : files compressées.
// On ne stocke pas une position par item, mais un écart par item :
//   items[0].ecart  = distance de la tête jusqu'à la sortie
//   items[i].ecart  = distance jusqu'à l'item qui le précède
// Seule la tête avance librement ; les suivants ne comblent que ce qui dépasse
// l'espacement minimal. L'accumulation en sortie saturée est gratuite.

import { CELLULE } from '../design.js';
import { MACHINES } from '../data/machines.js';
import { centreCellule } from './grid.js';

const VITESSE = MACHINES.convoyeur.vitesse;
const ESPACEMENT = MACHINES.convoyeur.espacement;

// Cellule qui suit la dernière, dans le sens de circulation. Sert de point de
// fuite quand le convoyeur ne débouche sur rien : les items s'y arrêtent.
function apres(chemin) {
  const n = chemin.length;
  const avant = n >= 2 ? chemin[n - 2] : { cx: chemin[0].cx - 1, cy: chemin[0].cy };
  return {
    cx: chemin[n - 1].cx + (chemin[n - 1].cx - avant.cx),
    cy: chemin[n - 1].cy + (chemin[n - 1].cy - avant.cy),
  };
}

// Polyligne parcourue par les items : demi-cellule d'entrée, centres, demi-cellule
// de sortie. Longueur totale = nombre de cellules × CELLULE.
function polyligne(chemin, celluleEntree, celluleSortie) {
  const centres = chemin.map((c) => centreCellule(c.cx, c.cy));
  const premier = centres[0];
  const dernier = centres[centres.length - 1];
  const entree = centreCellule(celluleEntree.cx, celluleEntree.cy);
  const sortie = centreCellule(celluleSortie.cx, celluleSortie.cy);
  return [
    { x: (entree.x + premier.x) / 2, y: (entree.y + premier.y) / 2 },
    ...centres,
    { x: (dernier.x + sortie.x) / 2, y: (dernier.y + sortie.y) / 2 },
  ];
}

// `cible` peut être nul : un convoyeur lâché en cours de tracé reste construit,
// mais ne débouche sur rien et les items s'y accumulent.
export function creerConvoyeur(chemin, source, cible) {
  // Sans machine à l'arrivée, la sortie vise la cellule suivante : le rendu et
  // la géométrie n'ont ainsi jamais à se demander si la cible existe.
  const celluleSortie = cible || apres(chemin);
  return {
    chemin,
    celluleSortie,
    points: polyligne(chemin, source, celluleSortie),
    longueur: chemin.length * CELLULE,
    items: [],
    queue: 0, // distance sortie -> dernier item (= somme des écarts)
    source,
    cible,
  };
}

export function peutAccepter(convoyeur) {
  if (convoyeur.items.length === 0) return true;
  return convoyeur.queue <= convoyeur.longueur - ESPACEMENT;
}

export function pousser(convoyeur, type) {
  if (!peutAccepter(convoyeur)) return false;
  const ecart = convoyeur.items.length === 0
    ? convoyeur.longueur
    : convoyeur.longueur - convoyeur.queue;
  convoyeur.items.push({ type, ecart });
  convoyeur.queue = convoyeur.longueur;
  return true;
}

// livrer(type) -> true si la destination a pris l'item.
export function avancer(convoyeur, dt, livrer) {
  const pas = VITESSE * dt;
  const items = convoyeur.items;

  for (let i = 0; i < items.length; i++) {
    const marge = i === 0 ? items[i].ecart : items[i].ecart - ESPACEMENT;
    const m = Math.min(pas, Math.max(0, marge));
    if (m <= 0) continue;
    items[i].ecart -= m;
    if (i + 1 < items.length) items[i + 1].ecart += m;
    else convoyeur.queue -= m;
  }

  while (items.length > 0 && items[0].ecart <= 0) {
    if (!livrer(items[0].type)) break; // aval saturé : la file s'accumule
    const reste = items.shift().ecart;
    if (items.length === 0) convoyeur.queue = 0;
    else items[0].ecart += reste;
  }
}

// Position logique d'une distance mesurée depuis l'entrée du convoyeur.
export function pointA(convoyeur, distanceEntree) {
  const pts = convoyeur.points;
  const n = convoyeur.chemin.length;
  const demi = CELLULE / 2;
  let a, b, t;
  if (distanceEntree <= demi) {
    a = pts[0]; b = pts[1]; t = distanceEntree / demi;
  } else {
    const d = distanceEntree - demi;
    const k = Math.floor(d / CELLULE);
    if (k >= n - 1) {
      a = pts[n]; b = pts[n + 1]; t = Math.min(1, (d - (n - 1) * CELLULE) / demi);
    } else {
      a = pts[k + 1]; b = pts[k + 2]; t = (d - k * CELLULE) / CELLULE;
    }
  }
  return { x: a.x + (b.x - a.x) * t, y: a.y + (b.y - a.y) * t };
}

// Parcourt les items de la tête vers la queue, en fournissant leur position.
export function parcourirItems(convoyeur, visiter) {
  let depuisSortie = 0;
  for (let i = 0; i < convoyeur.items.length; i++) {
    depuisSortie += convoyeur.items[i].ecart;
    const p = pointA(convoyeur, convoyeur.longueur - depuisSortie);
    visiter(convoyeur.items[i], p);
  }
}
