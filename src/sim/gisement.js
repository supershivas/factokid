// Gisements : ce qu'on extrait du sol, et sa repousse. Ne dessine rien.
//
// Ils sont posés sur la grande grille, au milieu des machines : on mine et on
// construit au même endroit. Un extracteur posé sur un gisement le récolte
// tout seul ; il reste à le relier à ce qu'on veut nourrir.

import { EXTRACTEUR, REPOUSSE_TICKS } from '../data/monde.js';
import { TICKS_PAR_SECONDE } from '../data/machines.js';
import { ajouterMachine, retirerMachine, raccorderAuVoisinage } from './scene.js';
import { deposerBrut } from './machine.js';

// Les gisements de la carte tirée : elle dit où et quoi, on n'ajoute ici que
// ce qui vit — présent ou non, la repousse en cours, l'extracteur posé dessus.
export function creerGisements(carte) {
  return carte.gisements.map((g) => ({
    cx: g.cx, cy: g.cy, item: g.item, present: true, horloge: 0, extracteur: null,
  }));
}

export function gisementEn(monde, cx, cy) {
  return monde.gisements.find((g) => g.cx === cx && g.cy === cy);
}

// Un extracteur se pose sur un gisement : il devient une machine de la scène,
// avec son propre stock, et se raccorde au tapis qui passerait devant lui.
export function poserExtracteur(monde, cx, cy) {
  const g = gisementEn(monde, cx, cy);
  if (!g || g.extracteur) return false;
  g.extracteur = ajouterMachine(monde.scene, 'extracteur', cx, cy, { item: g.item });
  g.extracteur.horlogeMine = 0;
  raccorderAuVoisinage(monde.scene, g.extracteur);
  return true;
}

export function retirerExtracteur(monde, cx, cy) {
  const g = gisementEn(monde, cx, cy);
  if (!g || !g.extracteur) return false;
  // Le tapis qu'il alimentait n'est pas détruit avec lui : il peut avoir
  // d'autres sources. Ce qui ne serait plus alimenté par personne reste posé
  // aussi — rien ne disparaît tout seul de la grille.
  retirerMachine(monde.scene, g.extracteur);
  g.extracteur = null;
  return true;
}

// Les extracteurs creusent leur gisement, qui repousse ensuite.
export function majGisements(monde, dt) {
  const periode = EXTRACTEUR.ticksParItem / TICKS_PAR_SECONDE;
  const repousse = REPOUSSE_TICKS / TICKS_PAR_SECONDE;
  for (const g of monde.gisements) {
    if (!g.present) {
      g.horloge += dt;
      if (g.horloge >= repousse) { g.present = true; g.horloge = 0; }
      continue;
    }
    if (!g.extracteur) continue;
    const machine = g.extracteur;
    machine.horlogeMine += dt;
    machine.creuse = machine.stocks[g.item] < machine.def.capacite;
    if (machine.horlogeMine < periode) continue;
    if (!deposerBrut(machine, g.item)) { machine.horlogeMine = periode; continue; }
    machine.horlogeMine = 0;
    g.present = false;
    g.horloge = 0;
  }
}
