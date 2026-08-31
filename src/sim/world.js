// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.

import { creerGrille, poser, lire, libre } from './grid.js';
import { DEPART } from '../data/depart.js';
import { creerMachine, majMachine, deposer } from './machine.js';
import { creerConvoyeur, avancer } from './belt.js';

export function creerMonde() {
  const monde = {
    grille: creerGrille(),
    machines: [],
    convoyeurs: [],
  };
  const machines = DEPART.machines.map((m) => ajouterMachine(monde, m.type, m.cx, m.cy));
  const c = DEPART.convoyeur;
  poserConvoyeur(monde, c.chemin.map((p) => ({ ...p })), machines[c.source], machines[c.cible]);
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
  if (convoyeur.cible && convoyeur.cible.entree === convoyeur) convoyeur.cible.entree = null;
}

// Une sortie, un convoyeur, une entrée : poser un convoyeur remplace les
// précédents des deux machines concernées.
export function poserConvoyeur(monde, chemin, source, cible) {
  if (source.sortie) retirerConvoyeur(monde, source.sortie);
  if (cible && cible.entree) retirerConvoyeur(monde, cible.entree);
  const convoyeur = creerConvoyeur(chemin, source, cible);
  monde.convoyeurs.push(convoyeur);
  for (const c of chemin) poser(monde.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  source.sortie = convoyeur;
  if (cible) cible.entree = convoyeur;
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
  for (const machine of monde.machines) n += machine.stock;
  return n;
}
