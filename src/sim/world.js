// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.

import { COLONNES, LIGNES } from '../design.js';
import { creerGrille, poser, lire, libre } from './grid.js';
import { creerMachine, majMachine, deposer } from './machine.js';
import { creerConvoyeur, avancer } from './belt.js';

export function creerMonde() {
  const monde = {
    grille: creerGrille(),
    machines: [],
    convoyeurs: [],
  };
  ajouterMachine(monde, 'producteur', 0, 0);
  ajouterMachine(monde, 'consommateur', COLONNES - 1, LIGNES - 1);
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

export function retirerConvoyeur(monde, convoyeur) {
  const i = monde.convoyeurs.indexOf(convoyeur);
  if (i < 0) return;
  monde.convoyeurs.splice(i, 1);
  for (const c of convoyeur.chemin) poser(monde.grille, c.cx, c.cy, null);
  if (convoyeur.source.sortie === convoyeur) convoyeur.source.sortie = null;
  if (convoyeur.cible.entree === convoyeur) convoyeur.cible.entree = null;
}

// Une sortie, un convoyeur, une entrée : poser un convoyeur remplace les
// précédents des deux machines concernées.
export function poserConvoyeur(monde, chemin, source, cible) {
  if (source.sortie) retirerConvoyeur(monde, source.sortie);
  if (cible.entree) retirerConvoyeur(monde, cible.entree);
  const convoyeur = creerConvoyeur(chemin, source, cible);
  monde.convoyeurs.push(convoyeur);
  for (const c of chemin) poser(monde.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  source.sortie = convoyeur;
  cible.entree = convoyeur;
  return convoyeur;
}

export function majMonde(monde, dt) {
  for (const convoyeur of monde.convoyeurs) {
    avancer(convoyeur, dt, (type) => deposer(convoyeur.cible, type));
  }
  for (const machine of monde.machines) majMachine(machine, dt);
}

export function nombreItems(monde) {
  let n = 0;
  for (const convoyeur of monde.convoyeurs) n += convoyeur.items.length;
  for (const machine of monde.machines) n += machine.stock;
  return n;
}
