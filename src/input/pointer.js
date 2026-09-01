// Gestes unifiés (Pointer Events) : la souris produit exactement les mêmes
// gestes que le doigt. Un glissé d'une machine à l'autre crée le chemin entier.
//
// Ce module tient aussi l'état de l'interface (outil courant, menu des
// éléments constructibles). Le rendu le lit, il ne le modifie jamais.

import { BULLE_ANIMATION, rectBouton, rectBulle, dansRect } from '../design.js';
import { OUTILS, CONSTRUCTIBLES } from '../data/outils.js';
import { celluleDepuisPoint, adjacentes } from '../sim/grid.js';
import {
  machineEn, convoyeurEn, celluleLibre, poserConvoyeur, retirerConvoyeur,
} from '../sim/world.js';
import { aUneSortie, attendus } from '../sim/machine.js';

export function majInterface(etat, dt) {
  const vise = etat.menuOuvert ? 1 : 0;
  const pas = dt / BULLE_ANIMATION;
  etat.menu = vise > etat.menu ? Math.min(1, etat.menu + pas) : Math.max(0, etat.menu - pas);
}

export function brancherPointeur(canvas, vue, monde) {
  const etat = {
    outil: 'construction',
    constructible: CONSTRUCTIBLES[0].id,
    menuOuvert: false,
    menu: 0,
    trace: { actif: false, source: null, chemin: [] },
  };
  const trace = etat.trace;
  let pointeur = null;

  function point(e) { return vue.versLogique(e.clientX, e.clientY); }

  function derniere() {
    return trace.chemin.length > 0 ? trace.chemin[trace.chemin.length - 1] : trace.source;
  }

  function dejaTracee(c) {
    return trace.chemin.some((x) => x.cx === c.cx && x.cy === c.cy);
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
    if (etat.menu > 0) {
      for (let j = 0; j < CONSTRUCTIBLES.length; j++) {
        if (dansRect(rectBulle(j, etat.menu), p.x, p.y)) {
          etat.constructible = CONSTRUCTIBLES[j].id;
          etat.outil = 'construction';
          etat.menuOuvert = false;
          return true;
        }
      }
    }
    for (let i = 0; i < OUTILS.length; i++) {
      if (!dansRect(rectBouton(i), p.x, p.y)) continue;
      const outil = OUTILS[i].id;
      // Toucher « construction » fait sortir les éléments constructibles, et
      // ne fait que ça : pas de bascule, sinon un événement dupliqué par le
      // navigateur referme le menu dans la foulée.
      etat.menuOuvert = outil === 'construction';
      etat.outil = outil;
      return true;
    }
    if (etat.menuOuvert) { etat.menuOuvert = false; return true; }
    return false;
  }

  function detruire(c) {
    const convoyeur = convoyeurEn(monde, c.cx, c.cy);
    if (convoyeur) retirerConvoyeur(monde, convoyeur);
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

    if (etat.outil === 'destruction') { detruire(c); return; }

    const machine = machineEn(monde, c.cx, c.cy);
    if (!machine || !aUneSortie(machine)) return;
    trace.actif = true;
    trace.source = machine;
    trace.chemin = [];
  }

  function deplacement(e) {
    if (e.pointerId !== pointeur) return;
    const p = point(e);
    const c = celluleDepuisPoint(p.x, p.y);
    e.preventDefault();
    if (!c) return;
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
  }

  function fin(e) {
    if (e.pointerId !== pointeur) return;
    e.preventDefault();
    if (trace.actif && trace.chemin.length > 0) {
      const c = celluleDepuisPoint(point(e).x, point(e).y);
      const machine = c ? machineEn(monde, c.cx, c.cy) : null;
      const cible = machine && machine !== trace.source && attendus(machine).length > 0
        && adjacentes(derniere(), machine)
        ? machine
        : null;
      poserConvoyeur(monde, trace.chemin, trace.source, cible);
    }
    relacher();
  }

  canvas.addEventListener('pointerdown', debut);
  canvas.addEventListener('pointermove', deplacement);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  canvas.addEventListener('lostpointercapture', relacher);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return etat;
}
