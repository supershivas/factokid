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

// La cellule qui précède le chemin, quand rien ne l'alimente encore.
function avant(chemin) {
  const suivante = chemin.length >= 2 ? chemin[1] : { cx: chemin[0].cx + 1, cy: chemin[0].cy };
  return {
    cx: chemin[0].cx - (suivante.cx - chemin[0].cx),
    cy: chemin[0].cy - (suivante.cy - chemin[0].cy),
  };
}

// Deux cellules se touchent-elles par un côté ? Toute la géométrie du tapis
// en dépend : une entrée ou une sortie qui ne touche pas le bout du chemin
// enverrait la polyligne — donc les items et les chevrons — hors du tapis.
export function adjacentes(a, b) {
  if (!a || !b) return false;
  return Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) === 1;
}

// La cellule d'où vient l'alimentation : celle de la machine, ou le bout du
// convoyeur qui déverse ici.
export function celluleDe(source) {
  if (!source) return null;
  if (source.chemin) return source.chemin[source.chemin.length - 1];
  return { cx: source.cx, cy: source.cy };
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
  const convoyeur = {
    chemin,
    celluleEntree: null,
    celluleSortie: null,
    points: null,
    longueur: chemin.length * CELLULE,
    items: [],
    queue: 0, // distance sortie -> dernier item (= somme des écarts)
    source,
    sources: source ? [source] : [], // ce qui déverse ici : plusieurs, si fusion
    cible,
    sorties: [],  // convoyeurs alimentés par ce bout : un embranchement
    tour: 0,      // à qui le prochain item revient
    bloque: 0,    // depuis combien de temps la tête n'avance plus
  };
  majGeometrie(convoyeur);
  return convoyeur;
}

// Où en est chaque item, mesuré depuis l'entrée. La tête d'abord.
export function distances(convoyeur) {
  const liste = [];
  let depuisSortie = 0;
  for (const item of convoyeur.items) {
    depuisSortie += item.ecart;
    liste.push({ type: item.type, entree: convoyeur.longueur - depuisSortie });
  }
  return liste;
}

// Repose une liste d'items à des distances données depuis l'entrée. Ceux qui
// ne tiennent plus sur le convoyeur sont écartés.
export function reposerItems(convoyeur, liste) {
  convoyeur.items = [];
  let precedente = 0;
  for (const d of liste) {
    if (d.entree > convoyeur.longueur) continue;
    const sortie = convoyeur.longueur - d.entree;
    convoyeur.items.push({ type: d.type, ecart: sortie - precedente });
    precedente = sortie;
  }
  convoyeur.queue = precedente;
}

// Redonne au convoyeur un chemin différent — plus court quand on détruit une
// tuile, plus long quand on reprend un tracé — en gardant les items qui y
// tiennent encore. Leur distance depuis l'entrée ne change pas : c'est la
// sortie qui bouge.
export function reconstruire(convoyeur, chemin, cible, itemsImposes) {
  const liste = itemsImposes || distances(convoyeur);

  convoyeur.chemin = chemin;
  convoyeur.cible = cible;
  convoyeur.longueur = chemin.length * CELLULE;
  majGeometrie(convoyeur);

  reposerItems(convoyeur, liste);
}

// Où va ce tapis : sa machine, puis ses branches. Le tout dans l'ordre du tour
// de rôle, pour que la géométrie et la livraison désignent toujours la même.
export function destinations(convoyeur) {
  const liste = convoyeur.cible ? [convoyeur.cible] : [];
  return liste.concat(convoyeur.sorties);
}

// La cellule par laquelle on entre dans une destination : la case de la
// machine, ou la première du tapis.
function celluleVisee(destination) {
  if (!destination) return null;
  if (destination.chemin) return destination.chemin[0];
  return { cx: destination.cx, cy: destination.cy };
}

// La première cellule d'une liste qui touche `bout`. Une destination ou une
// source qui ne le touche pas est une géométrie périmée — un raccord dont le
// tapis a été raccourci depuis — et on l'ignore plutôt que de dessiner à côté.
function premiereAdjacente(cellules, bout) {
  for (const c of cellules) if (adjacentes(c, bout)) return c;
  return null;
}

// Recalcule la géométrie : entrée, sortie, polyligne. Un seul endroit, appelé
// dès que le chemin, la cible, les sources ou les branches changent.
export function majGeometrie(convoyeur) {
  const chemin = convoyeur.chemin;
  const premiere = chemin[0];
  const derniere = chemin[chemin.length - 1];

  // Entrée : ce qui alimente, si ça touche encore le début du chemin.
  const amonts = convoyeur.sources.map(celluleDe).filter(Boolean);
  convoyeur.celluleEntree = premiereAdjacente(
    [celluleDe(convoyeur.source), ...amonts].filter(Boolean), premiere,
  ) || avant(chemin);

  // Sortie : quand le bout distribue entre plusieurs destinations, il vise
  // celle à qui le prochain item revient — pas la première de la liste. Sinon
  // l'item file dans une direction puis saute dans une autre à la livraison.
  const dests = destinations(convoyeur);
  const visees = dests.map(celluleVisee).filter(Boolean);
  const tour = dests.length > 0 ? convoyeur.tour % dests.length : 0;
  const prochaine = visees[tour];
  convoyeur.celluleSortie = (adjacentes(prochaine, derniere) && prochaine)
    || premiereAdjacente(visees, derniere)
    || apres(chemin);

  convoyeur.points = polyligne(convoyeur.chemin, convoyeur.celluleEntree, convoyeur.celluleSortie);
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

  let bouchon = false;
  while (items.length > 0 && items[0].ecart <= 0) {
    if (!livrer(items[0].type)) { bouchon = true; break; } // aval saturé
    const reste = items.shift().ecart;
    if (items.length === 0) convoyeur.queue = 0;
    else items[0].ecart += reste;
  }
  // Un bouchon qui dure se signale : la tête est arrivée et rien ne la prend.
  convoyeur.bloque = bouchon ? convoyeur.bloque + dt : 0;
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
