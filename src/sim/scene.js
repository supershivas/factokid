// Une scène : une grille, ses machines, ses convoyeurs. L'usine en est une,
// chaque carte en est une autre. Même structure, même geste, même rendu — une
// carte n'est pas un niveau, c'est la même surface remplie autrement.

import { creerGrille, poser, lire, libre } from './grid.js';
import { creerMachine, majMachine, deposer, attendus, maxSorties, maxEntrees } from './machine.js';
import { creerConvoyeur, avancer, reconstruire } from './belt.js';

export function creerScene() {
  return { grille: creerGrille(), machines: [], convoyeurs: [] };
}

export function ajouterMachine(scene, type, cx, cy, options) {
  const machine = creerMachine(type, cx, cy, options);
  scene.machines.push(machine);
  poser(scene.grille, cx, cy, { genre: 'machine', machine });
  return machine;
}

export function machineEn(scene, cx, cy) {
  const c = lire(scene.grille, cx, cy);
  return c && c.genre === 'machine' ? c.machine : null;
}

export function celluleLibre(scene, cx, cy) {
  return libre(scene.grille, cx, cy);
}

export function convoyeurEn(scene, cx, cy) {
  const c = lire(scene.grille, cx, cy);
  return c && c.genre === 'convoyeur' ? c.convoyeur : null;
}

function detacherCible(convoyeur) {
  if (!convoyeur.cible) return;
  const i = convoyeur.cible.entrees.indexOf(convoyeur);
  if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  convoyeur.cible = null;
}

// Détruire une tuile ne détruit pas tout le convoyeur : il est coupé là. Ce
// qui précède reste posé et ne débouche plus sur rien, ce qui suit disparaît.
export function couperConvoyeur(scene, convoyeur, cx, cy) {
  const i = convoyeur.chemin.findIndex((c) => c.cx === cx && c.cy === cy);
  if (i < 0) return;
  if (i === 0) { retirerConvoyeur(scene, convoyeur); return; }
  for (let k = i; k < convoyeur.chemin.length; k++) {
    poser(scene.grille, convoyeur.chemin[k].cx, convoyeur.chemin[k].cy, null);
  }
  detacherCible(convoyeur);
  reconstruire(convoyeur, convoyeur.chemin.slice(0, i), null);
}

// Reprendre un tracé interrompu : on ajoute des cellules au bout, sans perdre
// ce qui circule déjà dessus.
export function prolongerConvoyeur(scene, convoyeur, cellules, cible) {
  for (const c of cellules) poser(scene.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === convoyeur.source && c.role === convoyeur.role);
    if (dejaLa && dejaLa !== convoyeur) retirerConvoyeur(scene, dejaLa);
    while (cible.entrees.length >= maxEntrees(cible)) retirerConvoyeur(scene, cible.entrees[0]);
    cible.entrees.push(convoyeur);
  }
  reconstruire(convoyeur, convoyeur.chemin.concat(cellules), cible);
}

export function retirerConvoyeur(scene, convoyeur) {
  const i = scene.convoyeurs.indexOf(convoyeur);
  if (i < 0) return;
  scene.convoyeurs.splice(i, 1);
  for (const c of convoyeur.chemin) poser(scene.grille, c.cx, c.cy, null);
  const s = convoyeur.source.sorties.indexOf(convoyeur);
  if (s >= 0) convoyeur.source.sorties.splice(s, 1);
  if (convoyeur.cible) {
    const i = convoyeur.cible.entrees.indexOf(convoyeur);
    if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  }
}

// Une sortie, un convoyeur, une entrée : chaque machine n'a qu'une sortie, et
// autant d'entrées que sa recette a d'ingrédients. Poser un convoyeur remplace
// ce qui occupait la place, il n'y a jamais de jonction sur un convoyeur.
export function poserConvoyeur(scene, chemin, source, cible) {
  // La place occupée n'est pas « cette machine », c'est « cette matière depuis
  // cette machine » : un trieur envoie légitimement deux tapis au même
  // assembleur, un pour chaque ingrédient.
  // Un trieur a deux branches : la matière choisie, et le reste. Le rôle du
  // tapis dépend de la place encore libre, pas d'un réglage.
  const role = source.def.tri
    ? (source.sorties.some((c) => c.role === 'triee') ? 'reste' : 'triee')
    : null;
  const memePlace = source.sorties.find(
    (c) => (role ? c.role === role : c.cible === cible),
  );
  if (memePlace) retirerConvoyeur(scene, memePlace);
  while (source.sorties.length >= maxSorties(source)) retirerConvoyeur(scene, source.sorties[0]);
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === source && c.role === role);
    if (dejaLa) retirerConvoyeur(scene, dejaLa);
    while (cible.entrees.length >= maxEntrees(cible)) retirerConvoyeur(scene, cible.entrees[0]);
  }
  const convoyeur = creerConvoyeur(chemin, source, cible);
  scene.convoyeurs.push(convoyeur);
  for (const c of chemin) poser(scene.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  convoyeur.role = role;
  source.sorties.push(convoyeur);
  if (cible) cible.entrees.push(convoyeur);
  return convoyeur;
}

export function majScene(scene, dt) {
  for (const convoyeur of scene.convoyeurs) {
    avancer(convoyeur, dt, (type) => (convoyeur.cible ? deposer(convoyeur.cible, type) : false));
  }
  for (const machine of scene.machines) majMachine(machine, dt);
}

export function itemsDeScene(scene) {
  let n = 0;
  for (const convoyeur of scene.convoyeurs) n += convoyeur.items.length;
  for (const machine of scene.machines) {
    for (const item of Object.keys(machine.stocks)) n += machine.stocks[item];
  }
  return n;
}
