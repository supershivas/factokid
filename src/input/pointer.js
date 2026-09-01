// Gestes unifiés (Pointer Events) : la souris produit exactement les mêmes
// gestes que le doigt. Un glissé d'une machine à l'autre crée le chemin entier.
//
// Ce module tient aussi l'état de l'interface (outil courant, menu des
// éléments constructibles). Le rendu le lit, il ne le modifie jamais.

import { BULLE_ANIMATION, CELLULE, rectBouton, rectBulle, dansRect } from '../design.js';
import { OUTILS, CONSTRUCTIBLES } from '../data/outils.js';
import { celluleDepuisPoint, adjacentes } from '../sim/grid.js';
import {
  machineEn, convoyeurEn, celluleLibre, poserConvoyeur, couperConvoyeur,
  prolongerConvoyeur, ramasserSurCarte,
} from '../sim/world.js';
import { aUneSortie, attendus } from '../sim/machine.js';
import { coinCellule } from '../sim/grid.js';

export function majInterface(etat, dt) {
  const vise = etat.menuOuvert ? 1 : 0;
  const pas = dt / BULLE_ANIMATION;
  etat.menu = vise > etat.menu ? Math.min(1, etat.menu + pas) : Math.max(0, etat.menu - pas);
}

export function brancherPointeur(canvas, vue, monde) {
  const etat = {
    vue: -1,                     // -1 = l'usine, sinon l'index d'une carte
    outil: 'construction',
    constructible: CONSTRUCTIBLES[0].id,
    menuOuvert: false,
    menu: 0,
    ancre: null,                 // d'où sortent les bulles
    bulles: [],                  // ce que le rendu doit dessiner
    boutons: [],
    trace: { actif: false, source: null, chemin: [], reprise: null },
  };
  const trace = etat.trace;
  let pointeur = null;
  let actionsBulles = [];
  let actionsBoutons = [];
  let tapSur = null;             // machine touchée sans glissé

  // La barre d'outils dépend de l'écran : dans une carte, on ne construit pas,
  // on revient.
  function majBoutons() {
    if (etat.vue < 0) {
      etat.boutons = OUTILS.map((o) => ({ icone: o.icone, actif: o.id === etat.outil }));
      actionsBoutons = OUTILS.map((o) => () => {
        etat.outil = o.id;
        if (o.id === 'construction') ouvrirMenu(bullesConstructibles(), rectBouton(0));
        else fermerMenu();
        majBoutons();
      });
      return;
    }
    etat.boutons = [{ icone: 'outilRetour', actif: false }];
    actionsBoutons = [() => { etat.vue = -1; fermerMenu(); majBoutons(); }];
  }

  function ouvrirMenu(contenu, ancre) {
    etat.menuOuvert = true;
    etat.ancre = ancre;
    etat.bulles = contenu.map((c) => ({ icone: c.icone }));
    actionsBulles = contenu.map((c) => c.action);
  }

  function fermerMenu() {
    etat.menuOuvert = false;
  }

  function bullesConstructibles() {
    return CONSTRUCTIBLES.map((c) => ({
      icone: c.icone,
      action: () => { etat.constructible = c.id; etat.outil = 'construction'; fermerMenu(); majBoutons(); },
    }));
  }

  function bullesCartes() {
    return monde.cartes.map((carte, i) => ({
      icone: 'bulleCarte_' + carte.item,
      action: () => { etat.vue = i; fermerMenu(); majBoutons(); },
    }));
  }

  function point(e) { return vue.versLogique(e.clientX, e.clientY); }

  // Les cellules déjà posées quand on reprend un tracé interrompu.
  function base() {
    return trace.reprise ? trace.reprise.chemin : [];
  }

  function derniere() {
    if (trace.chemin.length > 0) return trace.chemin[trace.chemin.length - 1];
    const posees = base();
    return posees.length > 0 ? posees[posees.length - 1] : trace.source;
  }

  function dejaTracee(c) {
    return trace.chemin.some((x) => x.cx === c.cx && x.cy === c.cy)
      || base().some((x) => x.cx === c.cx && x.cy === c.cy);
  }

  function ajouter(c) {
    const avant = derniere();
    if (c.cx === avant.cx && c.cy === avant.cy) return;
    // Retour en arrière : on efface la dernière cellule.
    const avantAvant = trace.chemin.length >= 2 ? trace.chemin[trace.chemin.length - 2] : trace.source;
    if (c.cx === avantAvant.cx && c.cy === avantAvant.cy) { trace.chemin.pop(); return; }
    if (!adjacentes(avant, c) || dejaTracee(c) || !celluleLibre(monde, c.cx, c.cy)) return;
    trace.chemin.push(c);
  }

  // Le doigt va plus vite que les cellules : on comble en L (horizontal puis
  // vertical) pour que le chemin reste continu.
  function relier(c) {
    for (let garde = 0; garde < 64; garde++) {
      const avant = derniere();
      if (avant.cx === c.cx && avant.cy === c.cy) return;
      const pas = avant.cx !== c.cx
        ? { cx: avant.cx + Math.sign(c.cx - avant.cx), cy: avant.cy }
        : { cx: avant.cx, cy: avant.cy + Math.sign(c.cy - avant.cy) };
      const longueur = trace.chemin.length;
      ajouter(pas);
      if (trace.chemin.length === longueur) return; // bloqué : on s'arrête là
    }
  }

  // Renvoie true si le point est tombé sur l'interface, qui a la priorité.
  function interfaceTouchee(p) {
    if (etat.menu > 0 && etat.ancre) {
      for (let j = 0; j < etat.bulles.length; j++) {
        if (dansRect(rectBulle(etat.ancre, j, etat.menu), p.x, p.y)) {
          actionsBulles[j]();
          return true;
        }
      }
    }
    for (let i = 0; i < etat.boutons.length; i++) {
      if (!dansRect(rectBouton(i), p.x, p.y)) continue;
      // Un bouton ouvre, et ne fait que ça : pas de bascule, sinon un
      // événement dupliqué par le navigateur referme le menu dans la foulée.
      actionsBoutons[i]();
      return true;
    }
    if (etat.menuOuvert) { fermerMenu(); return true; }
    return false;
  }

  function detruire(c) {
    const convoyeur = convoyeurEn(monde, c.cx, c.cy);
    if (convoyeur) couperConvoyeur(monde, convoyeur, c.cx, c.cy);
  }

  function debut(e) {
    const p = point(e);
    e.preventDefault();
    // L'interface est testée avant tout : un pointeur resté coincé (pointerup
    // perdu, ce qui arrive sur mobile) ne doit pas condamner la barre d'outils.
    if (interfaceTouchee(p)) { relacher(); return; }
    if (pointeur !== null) return;

    const c = celluleDepuisPoint(p.x, p.y);
    if (!c) return;
    pointeur = e.pointerId;
    canvas.setPointerCapture(pointeur);
    tapSur = null;

    // Dans une carte, le seul geste est de ramasser.
    if (etat.vue >= 0) { ramasserSurCarte(monde, etat.vue, c.cx, c.cy); return; }

    if (etat.outil === 'destruction') { detruire(c); return; }

    // Reprendre un tracé arrêté en route : on repart de son bout mort.
    const convoyeur = convoyeurEn(monde, c.cx, c.cy);
    if (convoyeur && !convoyeur.cible) {
      const bout = convoyeur.chemin[convoyeur.chemin.length - 1];
      if (bout.cx === c.cx && bout.cy === c.cy) {
        trace.actif = true;
        trace.source = convoyeur.source;
        trace.chemin = [];
        trace.reprise = convoyeur;
        return;
      }
    }

    const machine = machineEn(monde, c.cx, c.cy);
    if (!machine || !aUneSortie(machine)) return;
    // Le téléporteur répond à deux gestes : un appui ouvre les cartes, un
    // glissé trace un convoyeur. On tranche au relâchement.
    if (machine.def.source) tapSur = machine;
    trace.actif = true;
    trace.source = machine;
    trace.chemin = [];
    trace.reprise = null;
  }

  function deplacement(e) {
    if (e.pointerId !== pointeur) return;
    const p = point(e);
    const c = celluleDepuisPoint(p.x, p.y);
    e.preventDefault();
    if (!c) return;
    if (etat.vue >= 0) return;
    if (etat.outil === 'destruction') { detruire(c); return; }
    if (trace.actif && !machineEn(monde, c.cx, c.cy)) relier(c);
  }

  // Un convoyeur lâché en cours de route reste construit : on ne recommence
  // jamais du début. Sans machine à l'arrivée, il ne débouche sur rien et les
  // items s'y accumulent.
  function relacher() {
    if (pointeur !== null && canvas.hasPointerCapture(pointeur)) canvas.releasePointerCapture(pointeur);
    pointeur = null;
    trace.actif = false;
    trace.chemin = [];
    trace.reprise = null;
  }

  function fin(e) {
    if (e.pointerId !== pointeur) return;
    e.preventDefault();
    if (tapSur && trace.chemin.length === 0) {
      const coin = coinCellule(tapSur.cx, tapSur.cy);
      ouvrirMenu(bullesCartes(), { x: coin.x, y: coin.y, l: CELLULE, h: CELLULE });
      tapSur = null;
      relacher();
      return;
    }
    tapSur = null;
    if (trace.actif && trace.chemin.length > 0) {
      const c = celluleDepuisPoint(point(e).x, point(e).y);
      const machine = c ? machineEn(monde, c.cx, c.cy) : null;
      const cible = machine && machine !== trace.source && attendus(machine).length > 0
        && adjacentes(derniere(), machine)
        ? machine
        : null;
      if (trace.reprise) prolongerConvoyeur(monde, trace.reprise, trace.chemin, cible);
      else poserConvoyeur(monde, trace.chemin, trace.source, cible);
    }
    relacher();
  }

  majBoutons();
  canvas.addEventListener('pointerdown', debut);
  canvas.addEventListener('pointermove', deplacement);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  canvas.addEventListener('lostpointercapture', relacher);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return etat;
}
