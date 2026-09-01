// Cartes : gisements, ramassage, repousse, héros et mines. Ne dessine rien.
//
// Une carte n'est pas un niveau : c'est la même grille que l'usine, remplie de
// gisements au lieu de machines. On désigne un gisement, le héros va le
// chercher ; une mine posée dessus le récolte toute seule.

import { CARTES, HEROS, MINE } from '../data/cartes.js';
import { TICKS_PAR_SECONDE } from '../data/machines.js';
import { centreCellule } from './grid.js';

export function creerCartes() {
  return CARTES.map((def) => {
    const depart = centreCellule(def.teleporteur.cx, def.teleporteur.cy);
    return {
      def,
      items: def.items,
      teleporteur: def.teleporteur,
      repousse: def.repousseTicks / TICKS_PAR_SECONDE,
      gisements: def.gisements.map((g) => ({
        cx: g.cx, cy: g.cy, item: g.item, present: true, horloge: 0, mine: false,
      })),
      heros: {
        x: depart.x,
        y: depart.y,
        etat: 'repos',   // repos | vers | ramasse | retour
        file: [],
        cible: null,
        sac: [],
        horloge: 0,
      },
    };
  });
}

export function gisementEn(carte, cx, cy) {
  return carte.gisements.find((g) => g.cx === cx && g.cy === cy);
}

// Désigner un gisement : il rejoint la file du héros. Le redésigner l'enlève,
// pour qu'un doigt maladroit puisse toujours revenir en arrière.
export function designer(carte, cx, cy) {
  const g = gisementEn(carte, cx, cy);
  if (!g || !g.present || g.mine) return false;
  const i = carte.heros.file.findIndex((f) => f.cx === cx && f.cy === cy);
  if (i >= 0) { carte.heros.file.splice(i, 1); return true; }
  carte.heros.file.push({ cx, cy });
  return true;
}

export function estDesigne(carte, gisement) {
  return carte.heros.file.some((f) => f.cx === gisement.cx && f.cy === gisement.cy);
}

// Une mine se pose sur un gisement, et prend sa récolte en charge.
export function poserMine(carte, cx, cy) {
  const g = gisementEn(carte, cx, cy);
  if (!g || g.mine) return false;
  g.mine = true;
  g.horlogeMine = 0;
  const i = carte.heros.file.findIndex((f) => f.cx === cx && f.cy === cy);
  if (i >= 0) carte.heros.file.splice(i, 1);
  return true;
}

export function retirerMine(carte, cx, cy) {
  const g = gisementEn(carte, cx, cy);
  if (!g || !g.mine) return false;
  g.mine = false;
  return true;
}

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

// `livrer(item)` verse au téléporteur et renvoie false s'il est plein.
export function majCarte(carte, dt, livrer) {
  const periodeMine = MINE.ticksParItem / TICKS_PAR_SECONDE;
  for (const g of carte.gisements) {
    if (!g.present) {
      g.horloge += dt;
      if (g.horloge >= carte.repousse) { g.present = true; g.horloge = 0; }
      continue;
    }
    if (!g.mine) continue;
    g.horlogeMine += dt;
    if (g.horlogeMine < periodeMine) continue;
    if (!livrer(g.item)) { g.horlogeMine = periodeMine; continue; }
    g.horlogeMine = 0;
    g.present = false;
    g.horloge = 0;
  }
  majHeros(carte, dt, livrer);
}

function majHeros(carte, dt, livrer) {
  const heros = carte.heros;
  const maison = centreCellule(carte.teleporteur.cx, carte.teleporteur.cy);

  if (heros.etat === 'repos') {
    while (heros.file.length > 0) {
      const g = gisementEn(carte, heros.file[0].cx, heros.file[0].cy);
      if (g && g.present && !g.mine) break;
      heros.file.shift();
    }
    // Il ne rentre que la file finie, ou les bras pleins.
    if (heros.file.length === 0) {
      if (heros.sac.length > 0) heros.etat = 'retour';
      return;
    }
    heros.cible = heros.file[0];
    heros.etat = 'vers';
    return;
  }

  if (heros.etat === 'vers') {
    const g = gisementEn(carte, heros.cible.cx, heros.cible.cy);
    if (!g || !g.present) { heros.file.shift(); heros.etat = 'repos'; return; }
    if (!avancerVers(heros, centreCellule(heros.cible.cx, heros.cible.cy), dt)) return;
    heros.etat = 'ramasse';
    heros.horloge = 0;
    return;
  }

  if (heros.etat === 'ramasse') {
    heros.horloge += dt;
    if (heros.horloge < HEROS.ticksRamassage / TICKS_PAR_SECONDE) return;
    const g = gisementEn(carte, heros.cible.cx, heros.cible.cy);
    if (g && g.present) { g.present = false; g.horloge = 0; heros.sac.push(g.item); }
    heros.file.shift();
    heros.cible = null;
    heros.etat = heros.sac.length >= HEROS.capacite || heros.file.length === 0 ? 'retour' : 'repos';
    return;
  }

  if (heros.etat === 'retour') {
    if (!avancerVers(heros, maison, dt)) return;
    while (heros.sac.length > 0 && livrer(heros.sac[0])) heros.sac.shift();
    if (heros.sac.length === 0) heros.etat = 'repos';
  }
}
