// Ce qu'une scène doit toujours vérifier, quoi qu'on lui ait fait.
//
// C'était le cœur de outils/tapis.mjs, et c'est devenu un module à part le
// jour où la sauvegarde a eu besoin du même juge : une scène relue doit passer
// les mêmes vérifications que l'originale, et « les mêmes » n'a de sens que
// si c'est le même code. Deux listes d'invariants finissent toujours par
// diverger.
//
// Ne dépend que de la simulation : pas de navigateur, pas d'état global.

import { lire } from '../src/sim/grid.js';
import { destinations, majGeometrie } from '../src/sim/belt.js';
import { CELLULE } from '../src/design.js';
import { MACHINES } from '../src/data/machines.js';

const ESPACEMENT = MACHINES.convoyeur.espacement;
const cle = (c) => c.cx + ',' + c.cy;
const adj = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) === 1;

// Tout ce qui ne va pas dans cette scène, en clair. Une liste vide veut dire
// qu'elle est saine — pour le rendu comme pour la simulation.
export function problemes(scene) {
  const pbs = [];
  const vues = new Map();
  scene.convoyeurs.forEach((c, n) => {
    const q = 'tapis#' + n + '[' + c.chemin.map(cle).join(' ') + ']';
    if (!c.chemin.length) { pbs.push('chemin vide ' + q); return; }
    for (let i = 1; i < c.chemin.length; i++) if (!adj(c.chemin[i - 1], c.chemin[i])) pbs.push('chemin discontinu ' + q);
    for (const p of c.chemin) {
      if (vues.has(cle(p))) pbs.push('cellule partagée ' + cle(p) + ' ' + q);
      vues.set(cle(p), c);
      const g = lire(scene.grille, p.cx, p.cy);
      if (!g || g.genre !== 'convoyeur' || g.convoyeur !== c) pbs.push('grille désaccordée ' + cle(p) + ' ' + q);
    }
    const bout = c.chemin[c.chemin.length - 1];
    if (!adj(bout, c.celluleSortie)) pbs.push('sortie non adjacente ' + q + ' -> ' + cle(c.celluleSortie));
    if (!adj(c.chemin[0], c.celluleEntree)) pbs.push('entrée non adjacente ' + q);
    for (const d of destinations(c)) {
      const e = d.chemin ? d.chemin[0] : d;
      if (!adj(bout, e)) pbs.push('destination hors de portée ' + q + ' -> ' + cle(e));
    }
    if (c.longueur !== c.chemin.length * CELLULE) pbs.push('longueur fausse ' + q);
    if (c.points.length !== c.chemin.length + 2) pbs.push('polyligne fausse ' + q);
    for (const s of c.sorties) {
      if (!scene.convoyeurs.includes(s)) pbs.push('branche retirée ' + q);
      else if (!s.sources.includes(c)) pbs.push('branche non réciproque ' + q);
    }
    for (const s of c.sources) if (!(s.sorties || []).includes(c)) pbs.push('source non réciproque ' + q);
    // Ce qui alimente un tapis doit être dans la scène. La réciprocité ne
    // suffit pas à le dire : un tapis retiré peut garder ses liens des deux
    // côtés, et ne plus rien alimenter tout en restant l'entrée dessinée de
    // son aval.
    const present = (x) => scene.convoyeurs.includes(x) || scene.machines.includes(x);
    if (c.source && !present(c.source)) pbs.push('source hors de la scène ' + q);
    for (const s of c.sources) if (!present(s)) pbs.push('amont hors de la scène ' + q);
    if (c.cible && !scene.machines.includes(c.cible)) pbs.push('cible hors de la scène ' + q);
    if (c.cible && !c.cible.entrees.includes(c)) pbs.push('cible sans entrée ' + q);

    // La géométrie se déduit du graphe : entrée, sortie et polyligne ne sont
    // que des conséquences des sources, de la cible et des branches. La
    // recalculer ne doit donc rien changer — un tapis qui garde l'entrée d'une
    // source qu'il a perdue est un tapis dessiné d'après un passé qui n'existe
    // plus, et c'est ce qui rendait une scène impossible à sauvegarder :
    // relue, elle se serait dessinée autrement.
    const avant = cle(c.celluleEntree) + '>' + cle(c.celluleSortie);
    majGeometrie(c);
    if (cle(c.celluleEntree) + '>' + cle(c.celluleSortie) !== avant) {
      pbs.push('géométrie périmée ' + q + ' : ' + avant + ' au lieu de '
        + cle(c.celluleEntree) + '>' + cle(c.celluleSortie));
    }
    let somme = 0;
    for (const it of c.items) somme += it.ecart;
    if (Math.abs(somme - c.queue) > 1e-6) pbs.push('queue fausse ' + q);
    for (let i = 1; i < c.items.length; i++) if (c.items[i].ecart < ESPACEMENT - 1e-6) pbs.push('items trop serrés ' + q);
    if (c.items.length && c.items[0].ecart < -1e-6) pbs.push('tête au-delà de la sortie ' + q);
    if (somme > c.longueur + 1e-6) pbs.push('file plus longue que le tapis ' + q);
  });
  for (const m of scene.machines) {
    for (const s of m.sorties) if (!scene.convoyeurs.includes(s)) pbs.push('machine tient un tapis retiré');
    for (const e of m.entrees) if (!scene.convoyeurs.includes(e)) pbs.push('machine tient une entrée retirée');
  }
  return pbs;
}
