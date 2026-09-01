// Cartes : gisements, extraction, repousse. Ne dessine rien.
//
// Une carte n'est pas un niveau : c'est la même grille que l'usine, remplie de
// gisements au lieu de machines. On pose un extracteur sur un gisement, on le
// relie au téléporteur, et la matière part vers l'usine.

import { CARTES, EXTRACTEUR } from '../data/cartes.js';
import { TICKS_PAR_SECONDE } from '../data/machines.js';
import { creerScene, ajouterMachine, retirerConvoyeur } from './scene.js';
import { deposerDepuisCarte } from './machine.js';
import { COLONNES } from '../design.js';

export function creerCartes() {
  return CARTES.map((def) => {
    const carte = {
      scene: creerScene(),
      def,
      items: def.items,
      teleporteur: def.teleporteur,
      repousse: def.repousseTicks / TICKS_PAR_SECONDE,
      gisements: def.gisements.map((g) => ({
        cx: g.cx, cy: g.cy, item: g.item, present: true, horloge: 0, extracteur: null,
      })),
    };
    // Le téléporteur de la carte, posé en bas : les convoyeurs des extracteurs
    // y arrivent, et le toucher ramène à l'usine.
    carte.sortie = ajouterMachine(
      carte.scene, 'sortieCarte', def.teleporteur.cx, def.teleporteur.cy, { carte },
    );
    return carte;
  });
}

export function gisementEn(carte, cx, cy) {
  return carte.gisements.find((g) => g.cx === cx && g.cy === cy);
}

// Un extracteur se pose sur un gisement : il devient une machine de la scène
// de la carte, avec son propre stock. Il reste à le relier au téléporteur.
export function poserExtracteur(carte, cx, cy) {
  const g = gisementEn(carte, cx, cy);
  if (!g || g.extracteur) return false;
  g.extracteur = ajouterMachine(carte.scene, 'extracteur', cx, cy, { carte, item: g.item });
  g.extracteur.horlogeMine = 0;
  return true;
}

export function retirerExtracteur(carte, cx, cy) {
  const g = gisementEn(carte, cx, cy);
  if (!g || !g.extracteur) return false;
  for (const c of [...g.extracteur.sorties]) retirerConvoyeur(carte.scene, c);
  const i = carte.scene.machines.indexOf(g.extracteur);
  if (i >= 0) carte.scene.machines.splice(i, 1);
  carte.scene.grille.cellules[cy * COLONNES + cx] = null;
  g.extracteur = null;
  return true;
}

// Les extracteurs creusent leur gisement, qui repousse ensuite.
export function majCarte(carte, dt) {
  const periode = EXTRACTEUR.ticksParItem / TICKS_PAR_SECONDE;
  for (const g of carte.gisements) {
    if (!g.present) {
      g.horloge += dt;
      if (g.horloge >= carte.repousse) { g.present = true; g.horloge = 0; }
      continue;
    }
    if (!g.extracteur) continue;
    const machine = g.extracteur;
    machine.horlogeMine += dt;
    machine.creuse = machine.stocks[g.item] < machine.def.capacite;
    if (machine.horlogeMine < periode) continue;
    if (!deposerDepuisCarte(machine, g.item)) { machine.horlogeMine = periode; continue; }
    machine.horlogeMine = 0;
    g.present = false;
    g.horloge = 0;
  }
}
