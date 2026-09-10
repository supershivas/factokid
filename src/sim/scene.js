// Une scène : une grille, ses machines, ses convoyeurs. L'usine en est une,
// chaque carte en est une autre. Même structure, même geste, même rendu — une
// carte n'est pas un niveau, c'est la même surface remplie autrement.

import { creerGrille, poser, lire, libre } from './grid.js';
import {
  creerMachine, majMachine, deposer, maxSorties, maxEntrees, aUneSortie,
} from './machine.js';
import {
  creerConvoyeur, avancer, reconstruire, majGeometrie, distances, peutAccepter,
  pousser, destinations, adjacentes,
} from './belt.js';
import { CELLULE } from '../design.js';

export function creerScene() {
  return { grille: creerGrille(), machines: [], convoyeurs: [] };
}

export function ajouterMachine(scene, type, cx, cy, options) {
  const machine = creerMachine(type, cx, cy, options);
  scene.machines.push(machine);
  poser(scene.grille, cx, cy, { genre: 'machine', machine });
  raccorderCeQuiVise(scene, machine);
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

// Rompt les liens devenus impossibles : une destination que le bout du tapis
// ne touche plus. Prolonger un tapis, ou lui retirer sa dernière tuile,
// éloigne ses branches ; mieux vaut les détacher proprement que de livrer à
// distance, ce qui ferait sauter les items par-dessus le vide.
function elaguerSorties(convoyeur) {
  const bout = convoyeur.chemin[convoyeur.chemin.length - 1];
  for (const branche of [...convoyeur.sorties]) {
    if (adjacentes(branche.chemin[0], bout)) continue;
    const k = convoyeur.sorties.indexOf(branche);
    if (k >= 0) convoyeur.sorties.splice(k, 1);
    const s = branche.sources.indexOf(convoyeur);
    if (s >= 0) branche.sources.splice(s, 1);
    if (branche.source === convoyeur) branche.source = branche.sources[0] || null;
    majGeometrie(branche);
  }
  if (convoyeur.cible && !adjacentes(convoyeur.cible, bout)) detacherCible(convoyeur);
  majGeometrie(convoyeur);
}

// Détruire une tuile n'enlève que celle-là. Ce qui précède reste posé et ne
// débouche plus sur rien ; ce qui suit reste posé aussi, et n'est plus
// alimenté. L'outil destruction retire un convoyeur à la fois — jamais toute
// la section sous les doigts de l'enfant.
export function couperConvoyeur(scene, convoyeur, cx, cy) {
  // Un connecteur du mur ne se coupe pas : il arrive et repart avec son mur.
  if (convoyeur.connecteur) return;
  const i = convoyeur.chemin.findIndex((c) => c.cx === cx && c.cy === cy);
  if (i < 0) return;

  // La suite devient un tapis à part entière, que rien n'alimente plus.
  if (i < convoyeur.chemin.length - 1) {
    const suite = couperEn(scene, convoyeur, i);
    if (suite) {
      const k = convoyeur.sorties.indexOf(suite);
      if (k >= 0) convoyeur.sorties.splice(k, 1);
      const s = suite.sources.indexOf(convoyeur);
      if (s >= 0) suite.sources.splice(s, 1);
      if (suite.source === convoyeur) suite.source = suite.sources[0] || null;
      // Elle n'est plus alimentée par personne : sa géométrie change avec ses
      // sources, et sans ça elle gardait l'entrée d'un tapis qui ne la touche
      // plus — ses items entraient par un bord qui n'existait plus. Elle
      // ressort donc ailleurs, et alimente ce qu'elle vise désormais.
      majGeometrie(suite);
    }
  }

  // Il ne reste que l'amont, dernière cellule comprise : on la retire.
  if (convoyeur.chemin.length <= 1) { retirerConvoyeur(scene, convoyeur); return; }
  poser(scene.grille, cx, cy, null);
  detacherCible(convoyeur);
  reconstruire(convoyeur, convoyeur.chemin.slice(0, -1), null);
  elaguerSorties(convoyeur);
  reconcilier(scene);
}

// Ce tapis vise-t-il cette cellule ? C'est la même question des deux côtés :
// un tapis qu'on raccourcit et une machine qu'on pose devant un tapis. Le
// rendu, lui, la pose déjà — il déduit la jonction de la géométrie, et c'est
// pour ça qu'un tapis non branché avait quand même l'air de l'être.
function vise(convoyeur, cx, cy) {
  const bout = convoyeur.celluleSortie;
  return Boolean(bout) && bout.cx === cx && bout.cy === cy;
}

// Une machine peut-elle prendre ce tapis de plus ? On ne libère jamais de
// place : raccorder tout seul ne doit rien détruire.
function peutPrendre(machine, convoyeur) {
  if (!machine || machine === convoyeur.source) return false;
  if (convoyeur.cible || convoyeur.sorties.length > 0) return false;
  return machine.entrees.length < maxEntrees(machine);
}

// Une machine posée au bout d'un tapis prend ce qui y arrive. C'est le
// pendant de la règle inverse — un extracteur posé devant un tapis s'y
// raccorde tout seul — et sans lui, poser une machine devant un tapis qui la
// visait déjà donnait le même tapis branché pour l'œil et mort pour elle.
function raccorderCeQuiVise(scene, machine, cellules = [machine]) {
  if (maxEntrees(machine) === 0) return;
  for (const cellule of cellules) {
    const voisines = [
      { cx: cellule.cx, cy: cellule.cy - 1 }, { cx: cellule.cx + 1, cy: cellule.cy },
      { cx: cellule.cx, cy: cellule.cy + 1 }, { cx: cellule.cx - 1, cy: cellule.cy },
    ];
    for (const c of voisines) {
      const convoyeur = convoyeurEn(scene, c.cx, c.cy);
      if (!convoyeur || !vise(convoyeur, cellule.cx, cellule.cy)) continue;
      if (!peutPrendre(machine, convoyeur)) continue;
      machine.entrees.push(convoyeur);
      reconstruire(convoyeur, convoyeur.chemin, machine);
    }
  }
}

// Une machine plus large qu'une cellule : elle en occupe d'autres, et chacune
// se touche comme la première. C'est la réception du mur, et c'est tout pour
// l'instant — une machine ordinaire tient dans sa case, et c'est ce qui rend
// la grille simple.
//
// La grille rend la même machine pour chacune de ses cellules : le tracé, le
// raccord et le rendu n'ont donc rien appris de neuf.
export function etendreMachine(scene, machine, cellules) {
  for (const c of cellules) poser(scene.grille, c.cx, c.cy, { genre: 'machine', machine });
  machine.cellules = [{ cx: machine.cx, cy: machine.cy }, ...cellules];
  raccorderCeQuiVise(scene, machine, machine.cellules);
}

// **Ce qu'un tapis vise, il l'alimente, quel que soit l'ordre des gestes.**
//
// La règle est décidée depuis longtemps ; elle était appliquée geste par
// geste, à chaque endroit où un tapis change de bout — et il en manquait la
// moitié. Un tapis qui perd sa destination ressort ailleurs ; un tapis qu'on
// vient de poser est parfois coupé en deux par un amont qui butait déjà en
// son milieu ; une machine retirée laisse ses entrées viser une case vide.
// Chacun de ces cas laissait derrière lui un tapis **branché pour l'œil et
// mort pour la simulation** : le rendu déduit la jonction de la géométrie, si
// bien qu'on voyait une chaîne là où une file s'accumulait en silence. Le
// juge des invariants en trouve un tous les deux cents gestes.
//
// La règle s'applique donc une fois, à la fin du geste, sur toute la scène :
// c'est le seul endroit où elle est vraie sans exception. Les gardes ne
// changent pas — on ne détourne pas un tapis qui travaille, on ne détruit
// jamais pour faire de la place, et jamais un tapis ne se nourrit de
// lui-même. Un raccord coupe un hôte en deux et fait donc naître un tapis de
// plus : on repasse tant que quelque chose a bougé, sans jamais boucler.
let reconciliant = false;

function reconcilier(scene) {
  // Un raccord passe lui-même par ici : on ne repart pas en arrière au milieu
  // d'une passe, la boucle des passes s'en charge.
  if (reconciliant) return;
  reconciliant = true;
  try { passesDeReconciliation(scene); } finally { reconciliant = false; }
}

function passesDeReconciliation(scene) {
  for (let passe = 0; passe < 4; passe++) {
    let bouge = false;
    for (const convoyeur of [...scene.convoyeurs]) {
      if (!scene.convoyeurs.includes(convoyeur)) continue;
      if (destinations(convoyeur).length > 0) continue;
      if (raccorderLeBout(scene, convoyeur)) bouge = true;
    }
    if (!bouge) return;
  }
}

// Un tapis raccourci se raccorde à la machine qu'il vise désormais.
//
// Sans ça il en avait seulement l'air : le rendu déduit la jonction de la
// géométrie, et dessinait donc la flèche vers la machine, mais la coupe
// remettait la cible à zéro sans jamais regarder ce que le nouveau bout
// touchait. Un doigt qui avait dépassé, puis retiré ses tuiles en trop, se
// retrouvait devant un tapis branché pour l'œil et mort pour la machine.
//
// Une machine, ou un autre tapis. Jamais rien de plus : libérer une place en
// détruirait un, et détruire une tuile ne doit jamais remanier ce qui est à
// côté. Se raccorder à un tapis, en revanche, ne détruit rien — cela le coupe
// au point de jonction, et c'est exactement ce que fait le doigt qui vient
// buter dessus.
function raccorderLeBout(scene, convoyeur) {
  const bout = convoyeur.celluleSortie;
  if (!bout) return false;
  const machine = machineEn(scene, bout.cx, bout.cy);
  if (peutPrendre(machine, convoyeur)) {
    machine.entrees.push(convoyeur);
    reconstruire(convoyeur, convoyeur.chemin, machine);
    return true;
  }
  const hote = convoyeurEn(scene, bout.cx, bout.cy);
  if (!peutSeDeverserDans(convoyeur, hote)) return false;
  raccorderA(scene, convoyeur, hote, bout);
  return destinations(convoyeur).length > 0;
}

// Ce tapis peut-il se déverser tout seul dans celui-là ?
//
// Seulement s'il n'a nulle part où aller : on ne détourne jamais un tapis qui
// travaille. Et seulement si l'autre ne revient pas jusqu'à lui — un tapis qui
// se nourrit de lui-même tournerait sans fin.
function peutSeDeverserDans(convoyeur, hote) {
  if (!hote || hote === convoyeur) return false;
  if (convoyeur.cible || convoyeur.sorties.length > 0) return false;
  return !mene(hote, convoyeur);
}

// L'aval d'un tapis mène-t-il jusqu'à celui-là ? On suit les sorties, en
// gardant trace de ce qu'on a vu : la scène peut déjà contenir une boucle.
function mene(depart, cherche) {
  const vus = new Set();
  const file = [depart];
  while (file.length) {
    const c = file.pop();
    if (c === cherche) return true;
    if (vus.has(c)) continue;
    vus.add(c);
    for (const s of c.sorties) file.push(s);
  }
  return false;
}

// Le pendant : un tapis qu'on vient de poser prend au passage ceux qui le
// visaient déjà. C'est aussi ce dont un connecteur a besoin quand son mur
// s'ouvre : les tapis qui montaient à la réception visent désormais un tapis
// rouge, et sans ce raccord ils resteraient pleins et muets au pied du mur
// qu'ils viennent d'ouvrir. C'est la même règle vue de l'autre côté — « ce qu'un tapis
// vise, il l'alimente, quel que soit l'ordre des gestes » — et sans elle, un
// tapis tracé avant celui qu'il devait nourrir restait plein et muet : branché
// pour l'œil, mort pour la simulation.
export function raccorderCeQuiViseLeTapis(scene, nouveau) {
  // Un raccord coupe l'hôte en deux : les cellules suivantes appartiennent
  // alors à la suite, pas au tapis qu'on vient de poser. On retient donc les
  // cellules, et on redemande à la grille à qui chacune est maintenant.
  const cellules = nouveau.chemin.map((c) => ({ cx: c.cx, cy: c.cy }));
  for (const cellule of cellules) {
    const hote = convoyeurEn(scene, cellule.cx, cellule.cy);
    if (!hote) continue;
    const voisines = [
      { cx: cellule.cx, cy: cellule.cy - 1 }, { cx: cellule.cx + 1, cy: cellule.cy },
      { cx: cellule.cx, cy: cellule.cy + 1 }, { cx: cellule.cx - 1, cy: cellule.cy },
    ];
    for (const v of voisines) {
      const amont = convoyeurEn(scene, v.cx, v.cy);
      if (!amont || !vise(amont, cellule.cx, cellule.cy)) continue;
      if (!peutSeDeverserDans(amont, hote)) continue;
      raccorderA(scene, amont, hote, cellule);
    }
  }
}

// Reprendre un tracé interrompu : on ajoute des cellules au bout, sans perdre
// ce qui circule déjà dessus.
export function prolongerConvoyeur(scene, convoyeur, cellules, cible) {
  if (!cheminValide(convoyeur.chemin.concat(cellules))) return;
  if (cible && maxEntrees(cible) === 0) cible = null;
  for (const c of cellules) poser(scene.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === convoyeur.source && c.role === convoyeur.role);
    if (dejaLa && dejaLa !== convoyeur) retirerConvoyeur(scene, dejaLa);
    liberer(scene, cible.entrees, maxEntrees(cible), convoyeur);
    cible.entrees.push(convoyeur);
  }
  reconstruire(convoyeur, convoyeur.chemin.concat(cellules), cible);
  elaguerSorties(convoyeur);
  reconcilier(scene);
}

function estMachine(x) { return Boolean(x && x.def); }

// Un chemin recevable : au moins une cellule, continu, et sans jamais repasser
// au même endroit. Le tracé au doigt s'en assure déjà ; le vérifier ici garde
// la grille cohérente quoi qu'il arrive en amont — une cellule occupée deux
// fois par le même tapis n'aurait plus de propriétaire à la destruction.
function cheminValide(chemin) {
  if (!chemin || chemin.length === 0) return false;
  const vues = new Set();
  for (let i = 0; i < chemin.length; i++) {
    const cle = chemin[i].cx + ',' + chemin[i].cy;
    if (vues.has(cle)) return false;
    vues.add(cle);
    if (i > 0 && !adjacentes(chemin[i - 1], chemin[i])) return false;
  }
  return true;
}

// Un convoyeur que plus rien n'alimente reste posé : il ne sert plus, mais il
// est à l'enfant de le retirer, une tuile à la fois. Rien ne disparaît tout
// seul de la grille.

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
    majGeometrie(branche);
  }
  convoyeur.sorties.length = 0;
  for (const c of convoyeur.chemin) poser(scene.grille, c.cx, c.cy, null);
  for (const amont of [...convoyeur.sources]) {
    const s = amont.sorties.indexOf(convoyeur);
    if (s >= 0) {
      amont.sorties.splice(s, 1);
      if (!estMachine(amont)) majGeometrie(amont);
    }
  }
  if (convoyeur.cible) {
    const i = convoyeur.cible.entrees.indexOf(convoyeur);
    if (i >= 0) convoyeur.cible.entrees.splice(i, 1);
  }
  reconcilier(scene);
}

// Retirer une machine construite : ses tapis restent posés, ils perdent
// seulement ce qu'ils reliaient. Détruire un élément ne doit jamais faire
// disparaître tout un réseau sous les doigts de l'enfant.
export function retirerMachine(scene, machine) {
  const i = scene.machines.indexOf(machine);
  if (i < 0) return;
  scene.machines.splice(i, 1);
  // Toutes ses cases, et seulement les siennes : une machine large en occupe
  // plusieurs, et la case qu'elle rend a pu changer de mains entre-temps —
  // la réception d'un mur laisse la sienne à un connecteur.
  for (const c of (machine.cellules || [machine])) {
    if (machineEn(scene, c.cx, c.cy) === machine) poser(scene.grille, c.cx, c.cy, null);
  }
  for (const amont of [...machine.entrees]) {
    amont.cible = null;
    majGeometrie(amont);
  }
  machine.entrees.length = 0;
  for (const aval of [...machine.sorties]) {
    const k = aval.sources.indexOf(machine);
    if (k >= 0) aval.sources.splice(k, 1);
    if (aval.source === machine) aval.source = aval.sources[0] || null;
    majGeometrie(aval);
  }
  machine.sorties.length = 0;
  reconcilier(scene);
}

// Une sortie, un convoyeur, une entrée : chaque machine n'a qu'une sortie, et
// autant d'entrées que sa recette a d'ingrédients. Poser un convoyeur remplace
// ce qui occupait la place, il n'y a jamais de jonction sur un convoyeur.
export function poserConvoyeur(scene, chemin, source, cible) {
  if (!source || !cheminValide(chemin)) return null;
  // Une machine qui ne produit rien ne fait pas partir de tapis, et une machine
  // qui n'attend rien n'en reçoit pas. Le tracé au doigt le sait déjà ; on ne
  // compte pas dessus.
  if (estMachine(source) && !aUneSortie(source)) return null;
  if (cible && maxEntrees(cible) === 0) cible = null;
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
  liberer(scene, source.sorties, limite);
  if (cible) {
    const dejaLa = cible.entrees.find((c) => c.source === source && c.role === role);
    if (dejaLa) retirerConvoyeur(scene, dejaLa);
    // Le tapis d'où part le tracé peut être une des entrées de la cible : lui
    // faire de la place en le détruisant ferait naître la branche orpheline.
    liberer(scene, cible.entrees, maxEntrees(cible), estMachine(source) ? null : source);
  }
  const convoyeur = creerConvoyeur(chemin, source, cible);
  scene.convoyeurs.push(convoyeur);
  for (const c of chemin) poser(scene.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur });
  convoyeur.role = role;
  source.sorties.push(convoyeur);
  if (!estMachine(source)) majGeometrie(source);
  if (cible) cible.entrees.push(convoyeur);
  // Un tapis qui passe devant un extracteur au repos le prend au passage : la
  // règle vaut dans les deux sens, qu'on pose la machine ou le tapis en dernier.
  raccorderMinesAutour(scene, [...chemin]);
  // Et les tapis qui butaient déjà là, dans le vide, se déversent enfin.
  raccorderCeQuiViseLeTapis(scene, convoyeur);
  // Le nouveau venu, lui aussi, vise peut-être quelque chose : un doigt qui
  // s'arrête une case avant l'autre tapis dessine exactement la même image
  // qu'un doigt qui va jusqu'à lui.
  //
  // On demande à la grille à qui appartient la dernière case du tracé : le
  // tapis qu'on vient de poser a pu être coupé en deux au passage, par un
  // amont qui butait déjà en son milieu, et c'est la portion de la fin qui
  // vise ce qu'il y a devant.
  reconcilier(scene);
  return convoyeur;
}

// Les extracteurs que ce chemin longe et qui ne débouchent sur rien.
function raccorderMinesAutour(scene, chemin) {
  const vues = new Set();
  for (const c of chemin) {
    const autour = [
      { cx: c.cx, cy: c.cy - 1 }, { cx: c.cx + 1, cy: c.cy },
      { cx: c.cx, cy: c.cy + 1 }, { cx: c.cx - 1, cy: c.cy },
    ];
    for (const v of autour) {
      const machine = machineEn(scene, v.cx, v.cy);
      if (!machine || !machine.def.mine || machine.sorties.length > 0) continue;
      const cle = v.cx + ',' + v.cy;
      if (vues.has(cle)) continue;
      vues.add(cle);
      raccorderAuVoisinage(scene, machine);
    }
  }
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
    majGeometrie(branche);
  }
  reconstruire(prolongement, suite, cibleInitiale, aval);
  majGeometrie(tronc);
  return prolongement;
}

// Un embranchement : on part d'une cellule au milieu d'un convoyeur. Il est
// coupé là, et la nouvelle branche s'ajoute à côté de la suite. Le bout
// distribue alors à tour de rôle entre ses branches.
export function brancherConvoyeur(scene, tronc, cellule, chemin, cible) {
  // Vérifié avant de couper : une branche impossible ne doit pas laisser le
  // tronc scindé pour rien.
  if (!cheminValide(chemin)) return null;
  const i = tronc.chemin.findIndex((c) => c.cx === cellule.cx && c.cy === cellule.cy);
  if (i < 0) return null;
  couperEn(scene, tronc, i);
  const branche = poserConvoyeur(scene, chemin, tronc, cible);
  majGeometrie(tronc);
  return branche;
}

// Une fusion : un convoyeur vient se raccorder à n'importe quel niveau d'un
// autre. L'hôte est coupé à la jonction, et les deux amonts déversent dans la
// suite — sans jamais mêler deux files compressées.
export function raccorderConvoyeur(scene, chemin, source, hote, cellule) {
  const nouveau = poserConvoyeur(scene, chemin, source, null);
  raccorderA(scene, nouveau, hote, cellule);
  return nouveau;
}

// Branche un convoyeur déjà posé sur n'importe quel niveau d'un autre.
//
// L'hôte est coupé *juste avant* la cellule de jonction : celle-ci ouvre donc
// la suite, que les deux amonts alimentent côte à côte. C'est la même coupure
// que pour une machine posée le long d'un tapis, et elle a la même vertu : le
// nouveau venu déverse dans une cellule qu'il touche, si bien que ses items
// n'ont aucune case à sauter au passage de la jonction.
// La portion d'un tapis qui touche cette cellule. Poser un tapis le coupe
// parfois en deux — un autre venait déjà buter en plein milieu, et le raccord
// sépare —, si bien que ce qu'on croyait poser n'est plus que l'amont. C'est
// sa dernière portion qui touche ce qu'il vise, et c'est elle qu'il faut
// brancher : sans ça le bout du tracé restait muet, plein et branché pour
// l'œil seulement.
function portionQuiTouche(convoyeur, cellule) {
  const vus = new Set();
  const file = [convoyeur];
  while (file.length) {
    const c = file.pop();
    if (!c || vus.has(c)) continue;
    vus.add(c);
    if (adjacentes(c.chemin[c.chemin.length - 1], cellule)) return c;
    for (const s of c.sorties) file.push(s);
  }
  return null;
}

export function raccorderA(scene, nouveau, hote, cellule) {
  nouveau = portionQuiTouche(nouveau, cellule) || nouveau;
  if (!nouveau || nouveau === hote) return;
  // Ni l'un ni l'autre ne doit avoir disparu entre-temps. Poser un tapis en
  // détruit parfois un autre — une machine n'a qu'une sortie, et retracer
  // depuis elle remplace ce qui partait déjà —, et ce qu'on croyait raccorder
  // n'est alors plus là : on se serait déversé dans un tapis mort, qui
  // n'avance plus et que rien ne dessine.
  if (!scene.convoyeurs.includes(nouveau) || !scene.convoyeurs.includes(hote)) return;
  // Le bout du nouveau venu doit toucher la jonction : sans cela il déverserait
  // à distance, et ses items traverseraient le vide pour y arriver.
  const bout = nouveau.chemin[nouveau.chemin.length - 1];
  if (!adjacentes(bout, cellule)) return;
  const i = hote.chemin.findIndex((c) => c.cx === cellule.cx && c.cy === cellule.cy);
  if (i < 0) return;
  const suite = i === 0 ? hote : couperEn(scene, hote, i - 1);
  if (!suite || suite === nouveau || suite.sources.includes(nouveau)) return;
  nouveau.sorties.push(suite);
  suite.sources.push(nouveau);
  majGeometrie(nouveau);
  majGeometrie(suite);
  // La coupure vient de faire naître un tapis : c'est un geste comme un autre,
  // et ce qu'il vise, il l'alimente.
  reconcilier(scene);
}

// Une machine posée devant un tapis s'y raccorde toute seule. Le tapis est
// coupé juste avant la cellule voisine : ce qui suit devient un tapis à part,
// que l'amont et la machine alimentent tous les deux. Rien n'est inséré au
// milieu d'une file — la coupure sépare, elle n'insère pas.
//
// Poser un extracteur sur un gisement que le tapis longe déjà suffit donc à le
// mettre au travail : un enfant n'a pas à deviner qu'il faut retracer par
// dessus.
export function raccorderAuVoisinage(scene, machine) {
  if (!aUneSortie(machine) || machine.sorties.length >= maxSorties(machine)) return null;
  const voisines = [
    { cx: machine.cx, cy: machine.cy - 1 }, { cx: machine.cx + 1, cy: machine.cy },
    { cx: machine.cx, cy: machine.cy + 1 }, { cx: machine.cx - 1, cy: machine.cy },
  ];
  for (const c of voisines) {
    const hote = convoyeurEn(scene, c.cx, c.cy);
    if (!hote) continue;
    const i = hote.chemin.findIndex((x) => x.cx === c.cx && x.cy === c.cy);
    if (i < 0) continue;
    // La machine déverse à la cellule qu'elle touche : le tapis est donc coupé
    // juste avant elle, et c'est la suite qu'elle alimente.
    const suite = i === 0 ? hote : couperEn(scene, hote, i - 1);
    if (!suite || suite.sources.includes(machine)) continue;
    machine.sorties.push(suite);
    suite.sources.push(machine);
    if (!suite.source) suite.source = machine;
    majGeometrie(suite);
    return suite;
  }
  return null;
}

// Fait de la place dans une liste de tapis : on retire les plus anciens
// jusqu'à ce qu'il en reste moins que la limite.
//
// `epargner` est le tapis qu'on s'apprête à brancher : il ne doit jamais être
// celui qu'on retire. Tracer une branche depuis un tapis qui nourrissait déjà
// la machine visée le faisait pourtant — la place se libérait en détruisant la
// source du tracé en cours, et la branche naissait alimentée par un tapis qui
// n'existait plus. Rien ne le disait à l'écran : elle restait dessinée,
// définitivement vide.
function liberer(scene, liste, limite, epargner) {
  // Une limite nulle — une machine qui n'accepte rien — ne doit pas faire
  // tourner la boucle à vide : sans la première condition, elle ne s'arrête
  // jamais et la page se fige.
  while (liste.length > 0 && liste.length >= limite) {
    // Un connecteur du mur ne se libère pas : il appartient au mur, pas au
    // joueur, et faire de la place en le retirant ouvrirait un trou dans le
    // mur que rien ne saurait refermer.
    const premier = liste.find((c) => c !== epargner && !c.connecteur);
    // Il ne reste que celui qu'on épargne : il n'y a plus de place à faire.
    if (!premier) return;
    retirerConvoyeur(scene, premier);
    // La liste elle-même est raccourcie, sans faire confiance à ce que
    // retirerConvoyeur en enlèvera : un tapis déjà retiré de la scène y
    // resterait sinon pour toujours, et la boucle ne se terminerait jamais.
    const i = liste.indexOf(premier);
    if (i >= 0) liste.splice(i, 1);
  }
}

const BRANCHES_MAX = 3;

// Ce que le bout d'un convoyeur fait de l'item qui arrive. Machine et branches
// sont une seule liste de destinations, prises à tour de rôle : un tapis qui
// nourrit une machine peut donc aussi se diviser, sans que la branche reste
// affamée.
// À partir de cet indice, la première destination qui a de la place. Un tapis
// plein n'en a pas ; une machine n'est jamais sautée — ce qu'elle accepte
// dépend de sa recette, et un tapis ne la lit pas.
function disponible(dests, depart) {
  for (let k = 0; k < dests.length; k++) {
    const i = (depart + k) % dests.length;
    if (estMachine(dests[i]) || peutAccepter(dests[i])) return i;
  }
  return depart;
}

function livrerDepuis(convoyeur, type) {
  const dests = destinations(convoyeur);
  const n = dests.length;
  for (let k = 0; k < n; k++) {
    const suivante = dests[(convoyeur.tour + k) % n];
    const pris = estMachine(suivante)
      ? deposer(suivante, type)
      : peutAccepter(suivante) && pousser(suivante, type, convoyeur);
    if (!pris) continue;
    // Le tour passe à la suivante — en sautant celles qui ne peuvent rien
    // prendre. Une branche pleine garde sa place dans la ronde, mais le bout
    // ne la vise pas : sans ce saut, l'item glissait une demi-case vers un
    // tapis bouché, puis sautait en travers dans la branche voisine au moment
    // d'être livré. Trois branches vers un mur, et c'était un item sur deux.
    convoyeur.tour = disponible(dests, (convoyeur.tour + k + 1) % n);
    // Le bout vise maintenant la destination du prochain item : celui-ci part
    // dans la bonne direction dès le premier pixel.
    majGeometrie(convoyeur);
    return true;
  }
  return false;
}

// Le bout ne regarde pas une branche bouchée. Tant qu'aucun item n'est entré
// dans sa dernière demi-cellule, il se tourne vers la première destination qui
// a de la place ; passé ce point il ne bouge plus, parce qu'un item déjà
// engagé ne doit pas changer de direction sous les yeux du joueur.
//
// C'est la moitié visible du saut de tour de `livrerDepuis` : sans elle, le
// premier item d'une file glisse vers une branche pleine avant de partir dans
// la voisine.
function viserCeQuiPeutPrendre(convoyeur) {
  const dests = destinations(convoyeur);
  if (dests.length < 2) return;
  if (convoyeur.items.length > 0 && convoyeur.items[0].ecart < CELLULE / 2) return;
  const tour = convoyeur.tour % dests.length;
  const vers = disponible(dests, tour);
  if (vers === tour) return;
  convoyeur.tour = vers;
  majGeometrie(convoyeur);
}

export function majScene(scene, dt) {
  for (const convoyeur of scene.convoyeurs) {
    viserCeQuiPeutPrendre(convoyeur);
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
