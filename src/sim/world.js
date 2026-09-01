// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.

import { creerGrille, poser, lire, libre } from './grid.js';
import { DEPART } from '../data/depart.js';
import { creerMachine, majMachine, deposer, attendus } from './machine.js';
import { creerConvoyeur, avancer } from './belt.js';

export function creerMonde() {
  const monde = {
    grille: creerGrille(),
    machines: [],
    convoyeurs: [],
  };
  const machines = DEPART.machines.map((m) => ajouterMachine(monde, m.type, m.cx, m.cy));
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

export function retirerConvoyeur(monde, convoyeur) {
  const i = monde.convoyeurs.indexOf(convoyeur);
  if (i < 0) return;
  monde.convoyeurs.splice(i, 1);
  for (const c of convoyeur.chemin) poser(monde.grille, c.cx, c.cy, null);
  if (convoyeur.source.sortie === convoyeur) convoyeur.source.sortie = null;
  if (convoyeur.cible) {
    const i = convoyeur.cible.entrees.indexOf(convoyeur);
    if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  }
}

// Une sortie, un convoyeur, une entrée : chaque machine n'a qu'une sortie, et
// autant d'entrées que sa recette a d'ingrédients. Poser un convoyeur remplace
// ce qui occupait la place, il n'y a jamais de jonction sur un convoyeur.
export function poserConvoyeur(monde, chemin, source, cible) {
  if (source.sortie) retirerConvoyeur(monde, source.sortie);
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === source);
    if (dejaLa) retirerConvoyeur(monde, dejaLa);
    while (cible.entrees.length >= attendus(cible).length) retirerConvoyeur(monde, cible.entrees[0]);
  }
  const convoyeur = creerConvoyeur(chemin, source, cible);
  monde.convoyeurs.push(convoyeur);
  for (const c of chemin) poser(monde.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  source.sortie = convoyeur;
  if (cible) cible.entrees.push(convoyeur);
  return convoyeur;
}

export function majMonde(monde, dt) {
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
