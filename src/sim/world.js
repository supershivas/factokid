// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.
//
// Un seul monde, une seule grille : on mine et on construit au même endroit.
// La fenêtre n'en montre qu'une partie, mais la simulation ne sait pas laquelle
// — elle avance partout, tout le temps.

import { DEPART } from '../data/depart.js';
import { creerScene, ajouterMachine, poserConvoyeur, majScene, itemsDeScene } from './scene.js';
import { creerGisements, majGisements, gisementEn, poserExtracteur } from './gisement.js';

export function creerMonde() {
  const monde = { scene: creerScene(), gisements: creerGisements() };

  for (const e of DEPART.extracteurs) poserExtracteur(monde, e.cx, e.cy);

  const machines = DEPART.machines.map(
    (m) => ajouterMachine(monde.scene, m.type, m.cx, m.cy, {}),
  );

  const source = (c) => (c.extracteur
    ? gisementEn(monde, c.extracteur.cx, c.extracteur.cy).extracteur
    : machines[c.source]);

  for (const c of DEPART.convoyeurs) {
    poserConvoyeur(
      monde.scene, c.chemin.map((p) => ({ ...p })), source(c), machines[c.cible],
    );
  }
  return monde;
}

export function majMonde(monde, dt) {
  majGisements(monde, dt);
  majScene(monde.scene, dt);
}

export function nombreItems(monde) {
  return itemsDeScene(monde.scene);
}
