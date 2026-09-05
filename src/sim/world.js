// État de la partie en cours. Structure volontairement distincte de tout état
// permanent (prestige) : rien ici n'est censé survivre à une partie.
//
// Un seul monde, une seule grille : on mine et on construit au même endroit.
// La fenêtre n'en montre qu'une partie, mais la simulation ne sait pas laquelle
// — elle avance partout, tout le temps.

import { DEPART } from '../data/depart.js';
import { creerScene, ajouterMachine, poserConvoyeur, majScene, itemsDeScene } from './scene.js';
import { creerGisements, majGisements, gisementEn, poserExtracteur } from './gisement.js';
import { creerCarte } from './carte.js';

// `disposition` dit ce qui est déjà posé au premier instant : l'usine qui
// tourne, ou la carte nue. C'est le scénario choisi qui l'apporte, avec la
// graine de sa carte : deux parties de même graine ont le même sol et les
// mêmes gisements, et la clairière du milieu ne change jamais.
//
// Le monde garde ses régions : le rendu en tire la teinte de chaque cellule,
// et il n'y a donc qu'une carte, pas une pour la simulation et une pour l'œil.
export function creerMonde(disposition = DEPART, graine = 1) {
  const carte = creerCarte(graine);
  const monde = {
    scene: creerScene(),
    regions: carte.regions,
    // Ce que le joueur a déjà tenu entre les mains, une fois : le livre des
    // matières s'en sert, et rien d'autre. C'est de l'état de partie — une
    // nouvelle partie repart d'un livre vide.
    decouvertes: {},
    gisements: creerGisements(carte),
  };

  for (const e of disposition.extracteurs) poserExtracteur(monde, e.cx, e.cy);

  const machines = disposition.machines.map(
    (m) => ajouterMachine(monde.scene, m.type, m.cx, m.cy, {}),
  );

  const source = (c) => (c.extracteur
    ? gisementEn(monde, c.extracteur.cx, c.extracteur.cy).extracteur
    : machines[c.source]);

  for (const c of disposition.convoyeurs) {
    poserConvoyeur(
      monde.scene, c.chemin.map((p) => ({ ...p })), source(c), machines[c.cible],
    );
  }
  return monde;
}

export function majMonde(monde, dt) {
  majGisements(monde, dt);
  majScene(monde.scene, dt);
  noterDecouvertes(monde);
}

// Ce qui vient de sortir d'une machine entre au livre. La machine dit ce
// qu'elle a versé, le monde le relève et efface : elle n'a jamais besoin de
// connaître le monde, et le livre n'a jamais besoin de fouiller les tapis.
function noterDecouvertes(monde) {
  for (const machine of monde.scene.machines) {
    if (!machine.sorti) continue;
    monde.decouvertes[machine.sorti] = true;
    machine.sorti = null;
  }
}

export function nombreItems(monde) {
  return itemsDeScene(monde.scene);
}
