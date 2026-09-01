// Cartes : gisements, ramassage, repousse, et le héros. Ne dessine rien.
//
// Une carte n'est pas un niveau : c'est la même grille que l'usine, remplie de
// gisements au lieu de machines. On désigne un gisement, le héros va le
// chercher ; on peut en désigner plusieurs, il les fait dans l'ordre.

import { CARTES, HEROS } from '../data/cartes.js';
import { TICKS_PAR_SECONDE } from '../data/machines.js';
import { centreCellule } from './grid.js';

export function creerCartes() {
  return CARTES.map((def) => {
    const depart = centreCellule(def.teleporteur.cx, def.teleporteur.cy);
    return {
      def,
      item: def.item,
      teleporteur: def.teleporteur,
      repousse: def.repousseTicks / TICKS_PAR_SECONDE,
      gisements: def.gisements.map((g) => ({ cx: g.cx, cy: g.cy, present: true, horloge: 0 })),
      heros: {
        x: depart.x,
        y: depart.y,
        etat: 'repos',   // repos | vers | ramasse | retour
        file: [],        // gisements désignés, dans l'ordre
        cible: null,
        sac: 0,
        horloge: 0,
      },
    };
  });
}

// Désigner un gisement : il rejoint la file du héros. Le redésigner l'enlève,
// pour qu'un doigt maladroit puisse toujours revenir en arrière.
export function designer(carte, cx, cy) {
  const g = carte.gisements.find((x) => x.cx === cx && x.cy === cy);
  if (!g || !g.present) return false;
  const i = carte.heros.file.findIndex((f) => f.cx === cx && f.cy === cy);
  if (i >= 0) { carte.heros.file.splice(i, 1); return true; }
  carte.heros.file.push({ cx, cy });
  return true;
}

export function estDesigne(carte, gisement) {
  return carte.heros.file.some((f) => f.cx === gisement.cx && f.cy === gisement.cy);
}

function gisementEn(carte, c) {
  return carte.gisements.find((g) => g.cx === c.cx && g.cy === c.cy);
}

// Avance vers un point, renvoie true une fois arrivé.
function avancerVers(heros, point, dt) {
  const dx = point.x - heros.x;
  const dy = point.y - heros.y;
  const distance = Math.hypot(dx, dy);
  const pas = HEROS.vitesse * dt;
  if (distance <= pas) {
    heros.x = point.x;
    heros.y = point.y;
    return true;
  }
  heros.x += (dx / distance) * pas;
  heros.y += (dy / distance) * pas;
  return false;
}

// `livrer(item, n)` vide le sac au téléporteur et renvoie ce qui a été pris.
export function majCarte(carte, dt, livrer) {
  for (const g of carte.gisements) {
    if (g.present) continue;
    g.horloge += dt;
    if (g.horloge >= carte.repousse) { g.present = true; g.horloge = 0; }
  }
  majHeros(carte, dt, livrer);
}

function majHeros(carte, dt, livrer) {
  const heros = carte.heros;
  const maison = centreCellule(carte.teleporteur.cx, carte.teleporteur.cy);

  if (heros.etat === 'repos') {
    // On saute les gisements qui ont disparu entre-temps.
    while (heros.file.length > 0 && !gisementEn(carte, heros.file[0]).present) heros.file.shift();
    // Il ne rentre que la file finie, ou les bras pleins.
    if (heros.file.length === 0) {
      if (heros.sac > 0) heros.etat = 'retour';
      return;
    }
    heros.cible = heros.file[0];
    heros.etat = 'vers';
    return;
  }

  if (heros.etat === 'vers') {
    const g = gisementEn(carte, heros.cible);
    if (!g || !g.present) { heros.file.shift(); heros.etat = 'repos'; return; }
    const point = centreCellule(heros.cible.cx, heros.cible.cy);
    if (!avancerVers(heros, point, dt)) return;
    heros.etat = 'ramasse';
    heros.horloge = 0;
    return;
  }

  if (heros.etat === 'ramasse') {
    heros.horloge += dt;
    if (heros.horloge < HEROS.ticksRamassage / TICKS_PAR_SECONDE) return;
    const g = gisementEn(carte, heros.cible);
    if (g && g.present) { g.present = false; g.horloge = 0; heros.sac++; }
    heros.file.shift();
    heros.cible = null;
    heros.etat = heros.sac >= HEROS.capacite || heros.file.length === 0 ? 'retour' : 'repos';
    return;
  }

  if (heros.etat === 'retour') {
    if (!avancerVers(heros, maison, dt)) return;
    while (heros.sac > 0 && livrer(carte.item)) heros.sac--;
    if (heros.sac === 0) heros.etat = 'repos';
  }
}
