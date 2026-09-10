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
import { poserMur, majMur, recepteurDuMur } from './mur.js';

// `disposition` dit ce qui est déjà posé au premier instant : l'usine qui
// tourne, ou la carte nue. C'est le scénario choisi qui l'apporte, avec la
// graine de sa carte : deux parties de même graine ont les mêmes gisements, et
// le pied du monde ne change jamais.
//
// Le sol, lui, n'appartient plus à la partie : le biome d'une cellule est
// donné par sa rangée, le monde se lisant en étages. Il n'y a donc plus de
// régions à porter.
export function creerMonde(disposition = DEPART, graine = 1, etageOuvert = 1) {
  const carte = creerCarte(graine);
  const monde = {
    // La graine de sa carte : le monde la garde parce que c'est elle qui le
    // décrit. La sauvegarde écrit tout de même les gisements en clair — une
    // partie doit survivre au jour où le tirage changera.
    graine,
    scene: creerScene(),
    // Ce que le joueur a déjà tenu entre les mains, une fois : le livre des
    // matières s'en sert, et rien d'autre. C'est de l'état de partie — une
    // nouvelle partie repart d'un livre vide.
    decouvertes: {},
    // La caisse : ce que la réception a payé. C'est le seul compteur de
    // l'écran, et il ne compte plus des bonbons mais ce qu'ils valent — la
    // réception achète aussi le caramel et la pastille, pour bien moins.
    caisse: disposition.caisse || 0,
    gisements: creerGisements(carte),
    // On ne progresse que vers le haut : au premier instant, seul l'étage du
    // bas est ouvert. Un mur ferme les autres, et il demande le produit de
    // l'étage qu'il ferme. Un essai peut en ouvrir davantage — le bac à sable
    // les ouvre tous.
    etageOuvert,
    // Ce qu'un mur vient d'ouvrir, que le monde pose et que l'écran relève —
    // comme la caisse et le livre. La simulation ne fait rien savoir
    // elle-même.
    murTombe: null,
  };

  // Le mur avant tout le reste : une disposition de départ ne doit jamais
  // pouvoir bâtir sur sa rangée.
  poserMur(monde);

  for (const e of disposition.extracteurs) poserExtracteur(monde, e.cx, e.cy);

  const machines = disposition.machines.map(
    (m) => ajouterMachine(monde.scene, m.type, m.cx, m.cy, {}),
  );

  const source = (c) => (c.extracteur
    ? gisementEn(monde, c.extracteur.cx, c.extracteur.cy).extracteur
    : machines[c.source]);

  // Une disposition peut viser la réception du mur : elle n'est pas une de ses
  // machines, c'est le mur qui l'apporte, et c'est là qu'on vend.
  const cible = (c) => (c.cible === 'recepteur' ? recepteurDuMur(monde) : machines[c.cible]);

  for (const c of disposition.convoyeurs) {
    poserConvoyeur(
      monde.scene, c.chemin.map((p) => ({ ...p })), source(c), cible(c),
    );
  }
  return monde;
}

export function majMonde(monde, dt) {
  majGisements(monde, dt);
  majScene(monde.scene, dt);
  noterDecouvertes(monde);
  releverCaisse(monde);
  majMur(monde);
}

// Ce que la réception a payé depuis la dernière image. La machine met de côté,
// le monde relève et efface : elle n'a jamais besoin de connaître la caisse,
// comme elle n'a jamais besoin de connaître le livre.
function releverCaisse(monde) {
  for (const machine of monde.scene.machines) {
    if (!machine.verse) continue;
    monde.caisse += machine.verse;
    machine.verse = 0;
  }
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
