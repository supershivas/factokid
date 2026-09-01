// Cartes : gisements, ramassage, repousse. Ne dessine rien.
//
// Une carte n'est pas un niveau : c'est la même grille que l'usine, remplie de
// gisements au lieu de machines. Toucher un gisement le vide, il repousse.

import { CARTES } from '../data/cartes.js';
import { TICKS_PAR_SECONDE } from '../data/machines.js';

export function creerCartes() {
  return CARTES.map((def) => ({
    def,
    item: def.item,
    repousse: def.repousseTicks / TICKS_PAR_SECONDE,
    gisements: def.gisements.map((g) => ({ cx: g.cx, cy: g.cy, present: true, horloge: 0 })),
  }));
}

export function majCarte(carte, dt) {
  for (const g of carte.gisements) {
    if (g.present) continue;
    g.horloge += dt;
    if (g.horloge >= carte.repousse) {
      g.present = true;
      g.horloge = 0;
    }
  }
}

// Renvoie la matière ramassée, ou null si la case ne portait rien.
export function ramasser(carte, cx, cy) {
  const g = carte.gisements.find((x) => x.cx === cx && x.cy === cy && x.present);
  if (!g) return null;
  g.present = false;
  g.horloge = 0;
  return carte.item;
}

// Part de repousse écoulée, pour dessiner l'attente.
export function maturite(carte, gisement) {
  return gisement.present ? 1 : Math.min(1, gisement.horloge / carte.repousse);
}
