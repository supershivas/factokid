// Une scène : une grille, ses machines, ses convoyeurs. L'usine en est une,
// chaque carte en est une autre. Même structure, même geste, même rendu — une
// carte n'est pas un niveau, c'est la même surface remplie autrement.

import { creerGrille, poser, lire, libre } from './grid.js';
import { creerMachine, majMachine, deposer, maxSorties, maxEntrees } from './machine.js';
import {
  creerConvoyeur, avancer, reconstruire, majSortie, distances, peutAccepter,
  pousser
} from './belt.js';
import { CELLULE } from '../design.js';

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

function estMachine(x) { return Boolean(x && x.def); }

// Un convoyeur que plus rien n'alimente ne peut plus rien recevoir : il reste
// à l'écran sans jamais servir. On l'enlève, et de proche en proche.
function alimente(convoyeur) {
  return estMachine(convoyeur.source) || convoyeur.sources.length > 0;
}

let nettoyageEnCours = false;

function nettoyerOrphelins(scene) {
  if (nettoyageEnCours) return;
  nettoyageEnCours = true;
  let encore = true;
  while (encore) {
    encore = false;
    for (const c of [...scene.convoyeurs]) {
      if (alimente(c)) continue;
      retirerConvoyeur(scene, c);
      encore = true;
    }
  }
  nettoyageEnCours = false;
}

export function retirerConvoyeur(scene, convoyeur) {
  const i = scene.convoyeurs.indexOf(convoyeur);
  if (i < 0) return;
  scene.convoyeurs.splice(i, 1);
  // Ce qu'il alimentait perd une source, mais reste posé : détruire un morceau
  // ne doit pas faire disparaître tout un réseau sous les doigts de l'enfant.
  for (const branche of [...convoyeur.sorties]) {
    const k = branche.sources.indexOf(convoyeur);
    if (k >= 0) branche.sources.splice(k, 1);
    if (branche.source === convoyeur) branche.source = branche.sources[0] || null;
  }
  convoyeur.sorties.length = 0;
  for (const c of convoyeur.chemin) poser(scene.grille, c.cx, c.cy, null);
  for (const amont of [...convoyeur.sources]) {
    const s = amont.sorties.indexOf(convoyeur);
    if (s >= 0) {
      amont.sorties.splice(s, 1);
      if (!estMachine(amont)) majSortie(amont);
    }
  }
  if (convoyeur.cible) {
    const i = convoyeur.cible.entrees.indexOf(convoyeur);
    if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  }
  nettoyerOrphelins(scene);
}

// Retirer une machine construite : ses tapis restent posés, ils perdent
// seulement ce qu'ils reliaient. Détruire un élément ne doit jamais faire
// disparaître tout un réseau sous les doigts de l'enfant.
export function retirerMachine(scene, machine) {
  const i = scene.machines.indexOf(machine);
  if (i < 0) return;
  scene.machines.splice(i, 1);
  poser(scene.grille, machine.cx, machine.cy, null);
  for (const amont of [...machine.entrees]) {
    amont.cible = null;
    majSortie(amont);
  }
  machine.entrees.length = 0;
  for (const aval of [...machine.sorties]) {
    const k = aval.sources.indexOf(machine);
    if (k >= 0) aval.sources.splice(k, 1);
    if (aval.source === machine) aval.source = aval.sources[0] || null;
  }
  machine.sorties.length = 0;
  nettoyerOrphelins(scene);
}

// Une sortie, un convoyeur, une entrée : chaque machine n'a qu'une sortie, et
// autant d'entrées que sa recette a d'ingrédients. Poser un convoyeur remplace
// ce qui occupait la place, il n'y a jamais de jonction sur un convoyeur.
export function poserConvoyeur(scene, chemin, source, cible) {
  // Un trieur a deux branches : la matière choisie, et le reste. Le rôle du
  // tapis dépend de la place encore libre, pas d'un réglage.
  const role = estMachine(source) && source.def.tri
    ? (source.sorties.some((c) => c.role === 'triee') ? 'reste' : 'triee')
    : null;
  // Repartir d'une machine vers la même place remplace le tapis qui l'occupait.
  // Repartir d'un convoyeur ajoute une branche : c'est le but.
  if (estMachine(source)) {
    const memePlace = source.sorties.find((c) => (role ? c.role === role : c.cible === cible));
    if (memePlace) retirerConvoyeur(scene, memePlace);
  }
  const limite = estMachine(source) ? maxSorties(source) : BRANCHES_MAX;
  while (source.sorties.length >= limite) retirerConvoyeur(scene, source.sorties[0]);
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
  if (!estMachine(source)) majSortie(source);
  if (cible) cible.entrees.push(convoyeur);
  return convoyeur;
}

// Coupe un convoyeur après la cellule d'indice i. Ce qui suit devient un
// convoyeur à part entière, alimenté par le premier. Les items restent à leur
// place : la file compressée est simplement séparée en deux.
function couperEn(scene, tronc, i) {
  if (i < 0 || i >= tronc.chemin.length - 1) return null;

  const coupe = (i + 1) * CELLULE;
  const liste = distances(tronc);
  const amont = liste.filter((d) => d.entree <= coupe);
  const aval = liste
    .filter((d) => d.entree > coupe)
    .map((d) => ({ type: d.type, entree: d.entree - coupe }));

  const suite = tronc.chemin.slice(i + 1);
  const cibleInitiale = tronc.cible;
  const sortiesInitiales = [...tronc.sorties];
  if (tronc.cible) {
    const k = tronc.cible.entrees.indexOf(tronc);
    if (k >= 0) tronc.cible.entrees.splice(k, 1);
  }
  tronc.sorties.length = 0;
  reconstruire(tronc, tronc.chemin.slice(0, i + 1), null, amont);

  const prolongement = creerConvoyeur(suite, tronc, cibleInitiale);
  scene.convoyeurs.push(prolongement);
  for (const c of suite) {
    poser(scene.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur: prolongement });
  }
  tronc.sorties.push(prolongement);
  if (cibleInitiale) cibleInitiale.entrees.push(prolongement);
  // Ce que le tronc alimentait est désormais alimenté par le prolongement.
  for (const branche of sortiesInitiales) {
    prolongement.sorties.push(branche);
    const k = branche.sources.indexOf(tronc);
    if (k >= 0) branche.sources[k] = prolongement;
    if (branche.source === tronc) branche.source = prolongement;
  }
  reconstruire(prolongement, suite, cibleInitiale, aval);
  majSortie(tronc);
  return prolongement;
}

// Un embranchement : on part d'une cellule au milieu d'un convoyeur. Il est
// coupé là, et la nouvelle branche s'ajoute à côté de la suite. Le bout
// distribue alors à tour de rôle entre ses branches.
export function brancherConvoyeur(scene, tronc, cellule, chemin, cible) {
  const i = tronc.chemin.findIndex((c) => c.cx === cellule.cx && c.cy === cellule.cy);
  if (i < 0) return null;
  couperEn(scene, tronc, i);
  const branche = poserConvoyeur(scene, chemin, tronc, cible);
  majSortie(tronc);
  return branche;
}

// Une fusion : un convoyeur vient se raccorder à n'importe quel niveau d'un
// autre. L'hôte est coupé au point de raccord, et les deux amonts déversent
// dans la suite — sans jamais mêler deux files compressées.
export function raccorderConvoyeur(scene, chemin, source, hote, cellule) {
  const nouveau = poserConvoyeur(scene, chemin, source, null);
  raccorderA(scene, nouveau, hote, cellule);
  return nouveau;
}

// Branche un convoyeur déjà posé sur n'importe quel niveau d'un autre.
export function raccorderA(scene, nouveau, hote, cellule) {
  if (!nouveau || nouveau === hote) return;
  const i = hote.chemin.findIndex((c) => c.cx === cellule.cx && c.cy === cellule.cy);
  if (i < 0) return;
  const suite = couperEn(scene, hote, i);
  // Les items sortent par la cellule de jonction, qui touche le bout du tapis.
  nouveau.sortieImposee = { cx: cellule.cx, cy: cellule.cy };
  if (suite) {
    nouveau.sorties.push(suite);
    suite.sources.push(nouveau);
  } else {
    // Raccord sur le bout de l'hôte : le nouveau venu vise ce qu'il visait.
    nouveau.cible = hote.cible;
    if (hote.cible) hote.cible.entrees.push(nouveau);
    for (const branche of hote.sorties) {
      if (nouveau.sorties.includes(branche)) continue;
      nouveau.sorties.push(branche);
      branche.sources.push(nouveau);
    }
  }
  majSortie(nouveau);
}

const BRANCHES_MAX = 3;

// Ce que le bout d'un convoyeur fait de l'item qui arrive : le remettre à sa
// machine, ou le répartir à tour de rôle entre ses branches.
function livrerDepuis(convoyeur, type) {
  if (convoyeur.cible) return deposer(convoyeur.cible, type);
  const n = convoyeur.sorties.length;
  for (let k = 0; k < n; k++) {
    const suivant = convoyeur.sorties[(convoyeur.tour + k) % n];
    if (!peutAccepter(suivant)) continue;
    pousser(suivant, type);
    convoyeur.tour = (convoyeur.tour + k + 1) % n;
    return true;
  }
  return false;
}

export function majScene(scene, dt) {
  for (const convoyeur of scene.convoyeurs) {
    avancer(convoyeur, dt, (type) => livrerDepuis(convoyeur, type));
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
