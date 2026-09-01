// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.
//
// Le monde tient une scène par écran : l'usine, et une par carte.

import { DEPART } from '../data/depart.js';
import { creerScene, ajouterMachine, poserConvoyeur, majScene, itemsDeScene } from './scene.js';
import { creerCartes, majCarte, gisementEn } from './carte.js';
import { deposerDepuisCarte } from './machine.js';

export function creerMonde() {
  const monde = { usine: creerScene(), cartes: [] };
  monde.cartes = creerCartes(monde);

  const machines = DEPART.machines.map((m) => {
    const carte = m.carte === undefined ? undefined : monde.cartes[m.carte];
    const machine = ajouterMachine(monde.usine, m.type, m.cx, m.cy, { carte });
    if (carte) carte.machine = machine;
    for (const [item, n] of Object.entries(m.stock || {})) {
      if (item in machine.stocks) machine.stocks[item] = n;
    }
    return machine;
  });
  for (const c of DEPART.convoyeurs) {
    poserConvoyeur(monde.usine, c.chemin.map((p) => ({ ...p })), machines[c.source], machines[c.cible]);
  }
  return monde;
}

// La scène affichée : -1 pour l'usine, sinon l'index d'une carte.
export function sceneDe(monde, vue) {
  return vue < 0 ? monde.usine : monde.cartes[vue].scene;
}

export function gisementSurCarte(monde, indexCarte, cx, cy) {
  const carte = monde.cartes[indexCarte];
  return carte ? gisementEn(carte, cx, cy) : null;
}

export function majMonde(monde, dt) {
  for (const carte of monde.cartes) {
    majCarte(carte, dt);
    majScene(carte.scene, dt);
    // La sortie d'une carte reverse dans le téléporteur qui lui répond, côté
    // usine : c'est le même téléporteur, vu de ses deux bouts.
    if (carte.machine) viderSortie(carte, carte.machine);
  }
  majScene(monde.usine, dt);
}

function viderSortie(carte, teleporteur) {
  const sortie = carte.sortie;
  if (!sortie) return;
  for (const item of Object.keys(sortie.stocks)) {
    while (sortie.stocks[item] > 0 && deposerDepuisCarte(teleporteur, item)) sortie.stocks[item]--;
  }
}

export function nombreItems(monde) {
  let n = itemsDeScene(monde.usine);
  for (const carte of monde.cartes) n += itemsDeScene(carte.scene);
  return n;
}
