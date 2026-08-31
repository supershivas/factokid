// Gestes unifiés (Pointer Events) : la souris produit exactement les mêmes
// gestes que le doigt. Un glissé d'une machine à l'autre crée le chemin entier.

import { celluleDepuisPoint, adjacentes } from '../sim/grid.js';
import { machineEn, celluleLibre, poserConvoyeur } from '../sim/world.js';

export function brancherPointeur(canvas, vue, monde) {
  const trace = { actif: false, source: null, chemin: [] };
  let pointeur = null;

  function cellulePointee(e) {
    const p = vue.versLogique(e.clientX, e.clientY);
    return celluleDepuisPoint(p.x, p.y);
  }

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
      const longueurAvant = trace.chemin.length;
      ajouter(pas);
      if (trace.chemin.length === longueurAvant) return; // bloqué : on s'arrête là
    }
  }

  function debut(e) {
    if (pointeur !== null) return;
    const c = cellulePointee(e);
    if (!c) return;
    const machine = machineEn(monde, c.cx, c.cy);
    if (!machine || machine.type !== 'producteur') return;
    pointeur = e.pointerId;
    canvas.setPointerCapture(pointeur);
    trace.actif = true;
    trace.source = machine;
    trace.chemin = [];
    e.preventDefault();
  }

  function deplacement(e) {
    if (!trace.actif || e.pointerId !== pointeur) return;
    const c = cellulePointee(e);
    if (c && !machineEn(monde, c.cx, c.cy)) relier(c);
    e.preventDefault();
  }

  function fin(e) {
    if (!trace.actif || e.pointerId !== pointeur) return;
    const c = cellulePointee(e);
    const cible = c ? machineEn(monde, c.cx, c.cy) : null;
    if (cible && cible.type === 'consommateur' && trace.chemin.length > 0
        && adjacentes(derniere(), cible)
        && adjacentes(trace.source, trace.chemin[0])) {
      poserConvoyeur(monde, trace.chemin, trace.source, cible);
    }
    trace.actif = false;
    trace.chemin = [];
    if (canvas.hasPointerCapture(pointeur)) canvas.releasePointerCapture(pointeur);
    pointeur = null;
    e.preventDefault();
  }

  canvas.addEventListener('pointerdown', debut);
  canvas.addEventListener('pointermove', deplacement);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return trace;
}
