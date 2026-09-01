// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.

import { creerGrille, poser, lire, libre } from './grid.js';
import { DEPART } from '../data/depart.js';
import {
  creerMachine, majMachine, deposer, deposerDepuisCarte, attendus, maxSorties,
} from './machine.js';
import { creerCartes, majCarte, designer } from './carte.js';
import { creerConvoyeur, avancer, reconstruire } from './belt.js';

export function creerMonde() {
  const monde = {
    grille: creerGrille(),
    machines: [],
    convoyeurs: [],
    cartes: [],
    teleporteur: null,
  };
  monde.cartes = creerCartes();
  const machines = DEPART.machines.map((m) => {
    const machine = ajouterMachine(monde, m.type, m.cx, m.cy);
    for (const [item, n] of Object.entries(m.stock || {})) {
      if (item in machine.stocks) machine.stocks[item] = n;
    }
    return machine;
  });
  monde.teleporteur = machines.find((m) => m.def.source);
  for (const c of DEPART.convoyeurs) {
    poserConvoyeur(monde, c.chemin.map((p) => ({ ...p })), machines[c.source], machines[c.cible]);
  }
  return monde;
}

function ajouterMachine(monde, type, cx, cy) {
  const machine = creerMachine(type, cx, cy);
  monde.machines.push(machine);
  poser(monde.grille, cx, cy, { genre: 'machine', machine });
  return machine;
}

export function machineEn(monde, cx, cy) {
  const c = lire(monde.grille, cx, cy);
  return c && c.genre === 'machine' ? c.machine : null;
}

export function celluleLibre(monde, cx, cy) {
  return libre(monde.grille, cx, cy);
}

export function convoyeurEn(monde, cx, cy) {
  const c = lire(monde.grille, cx, cy);
  return c && c.genre === 'convoyeur' ? c.convoyeur : null;
}

function detacherCible(convoyeur) {
  if (!convoyeur.cible) return;
  const i = convoyeur.cible.entrees.indexOf(convoyeur);
  if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  convoyeur.cible = null;
}

// Détruire une tuile ne détruit pas tout le convoyeur : il est coupé là. Ce
// qui précède reste posé et ne débouche plus sur rien, ce qui suit disparaît.
export function couperConvoyeur(monde, convoyeur, cx, cy) {
  const i = convoyeur.chemin.findIndex((c) => c.cx === cx && c.cy === cy);
  if (i < 0) return;
  if (i === 0) { retirerConvoyeur(monde, convoyeur); return; }
  for (let k = i; k < convoyeur.chemin.length; k++) {
    poser(monde.grille, convoyeur.chemin[k].cx, convoyeur.chemin[k].cy, null);
  }
  detacherCible(convoyeur);
  reconstruire(convoyeur, convoyeur.chemin.slice(0, i), null);
}

// Reprendre un tracé interrompu : on ajoute des cellules au bout, sans perdre
// ce qui circule déjà dessus.
export function prolongerConvoyeur(monde, convoyeur, cellules, cible) {
  for (const c of cellules) poser(monde.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === convoyeur.source && c.matiere === convoyeur.matiere);
    if (dejaLa && dejaLa !== convoyeur) retirerConvoyeur(monde, dejaLa);
    while (cible.entrees.length >= attendus(cible).length) retirerConvoyeur(monde, cible.entrees[0]);
    cible.entrees.push(convoyeur);
  }
  reconstruire(convoyeur, convoyeur.chemin.concat(cellules), cible);
}

export function retirerConvoyeur(monde, convoyeur) {
  const i = monde.convoyeurs.indexOf(convoyeur);
  if (i < 0) return;
  monde.convoyeurs.splice(i, 1);
  for (const c of convoyeur.chemin) poser(monde.grille, c.cx, c.cy, null);
  const s = convoyeur.source.sorties.indexOf(convoyeur);
  if (s >= 0) convoyeur.source.sorties.splice(s, 1);
  if (convoyeur.cible) {
    const i = convoyeur.cible.entrees.indexOf(convoyeur);
    if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  }
}

// Une sortie, un convoyeur, une entrée : chaque machine n'a qu'une sortie, et
// autant d'entrées que sa recette a d'ingrédients. Poser un convoyeur remplace
// ce qui occupait la place, il n'y a jamais de jonction sur un convoyeur.
export function poserConvoyeur(monde, chemin, source, cible) {
  // La place occupée n'est pas « cette machine », c'est « cette matière depuis
  // cette machine » : un trieur envoie légitimement deux tapis au même
  // assembleur, un pour chaque ingrédient.
  const matiere = matiereSortante(source, cible);
  const memePlace = source.sorties.find((c) => c.matiere === matiere && c.cible === cible);
  if (memePlace) retirerConvoyeur(monde, memePlace);
  while (source.sorties.length >= maxSorties(source)) retirerConvoyeur(monde, source.sorties[0]);
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === source && c.matiere === matiere);
    if (dejaLa) retirerConvoyeur(monde, dejaLa);
    while (cible.entrees.length >= attendus(cible).length) retirerConvoyeur(monde, cible.entrees[0]);
  }
  const convoyeur = creerConvoyeur(chemin, source, cible);
  monde.convoyeurs.push(convoyeur);
  for (const c of chemin) poser(monde.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  convoyeur.matiere = matiere;
  source.sorties.push(convoyeur);
  if (cible) cible.entrees.push(convoyeur);
  return convoyeur;
}

// Un trieur range : la matière d'un convoyeur sortant est celle qu'attend la
// machine à l'arrivée et que ce trieur ne sert pas déjà. Le joueur ne configure
// rien, il relie.
function matiereSortante(source, cible) {
  if (!source.def.tri) return null;
  if (!cible) return null;
  const dejaServies = source.sorties.map((c) => c.matiere);
  const attendu = attendus(cible).map((e) => e.item).filter((i) => source.def.tri.includes(i));
  return attendu.find((i) => !dejaServies.includes(i)) || attendu[0] || null;
}

// On désigne un gisement : le héros ira le chercher. Le joueur ne déplace
// jamais le héros lui-même, il lui montre quoi rapporter.
export function designerSurCarte(monde, indexCarte, cx, cy) {
  const carte = monde.cartes[indexCarte];
  if (!carte) return false;
  return designer(carte, cx, cy);
}

export function majMonde(monde, dt) {
  for (const carte of monde.cartes) {
    majCarte(carte, dt, (item) => deposerDepuisCarte(monde.teleporteur, item));
  }
  for (const convoyeur of monde.convoyeurs) {
    avancer(convoyeur, dt, (type) => (convoyeur.cible ? deposer(convoyeur.cible, type) : false));
  }
  for (const machine of monde.machines) majMachine(machine, dt);
}

export function nombreItems(monde) {
  let n = 0;
  for (const convoyeur of monde.convoyeurs) n += convoyeur.items.length;
  for (const machine of monde.machines) {
    for (const item of Object.keys(machine.stocks)) n += machine.stocks[item];
  }
  return n;
}
