// Les murs : ce qui ferme un étage tant qu'on ne lui a pas livré son dû.
// Ne dessine rien — render/mur.js s'en charge.
//
// Un mur est une rangée sur laquelle on ne peut pas bâtir, et un plafond sur
// ce qu'on peut atteindre. C'est tout ce qu'il coûte : le monde ne grandit
// pas — il fait toujours 42 × 60 — c'est ce qu'on peut atteindre qui grandit.
//
// **Il demande le produit de l'étage qu'il ferme** : du caramel pour le
// premier. On ne réclame jamais ce qu'on ne sait pas encore faire, et le but
// est toujours « fais ce que tu viens d'apprendre, en plus grand ».
//
// **Le total livré ne se dépense pas.** Il monte pendant que la caisse, elle,
// se dépense — deux nombres, deux rôles, aucun arbitrage à expliquer. Rien
// n'est compté à part pour autant : c'est la réception qui sait ce qu'elle a
// reçu, matière par matière, et le mur ne fait que le lire.
//
// **Un mur ouvert reste debout.** Il ne redevient pas du sol ordinaire : sa
// rangée de blocs demeure, et ce qui s'ouvre, ce sont les trois cases de sa
// réception. **Elles deviennent ses connecteurs** : trois bouts de convoyeur
// d'une case, rouges, qui montent d'un étage à l'autre. Ce sont des tapis
// comme les autres — on s'y branche par-dessous, on en repart par-dessus, ils
// portent une file et s'accumulent — à ceci près qu'ils appartiennent au mur :
// ils ne se détruisent pas, et rien ne les libère.
//
// C'est trois cases pour quarante-deux, donc un passage à viser, et c'est
// voulu : un mur franchi doit rester visible, sinon rien ne dit ce qu'on a
// gagné. La chaîne d'en bas monte par les connecteurs, et l'usine du dessous
// continue de tourner pour toujours.

import { COLONNES } from '../design.js';
import { ETAGES, OUVERT_AU_DEPART } from '../data/zones.js';
import { MACHINES } from '../data/machines.js';
import { rangeesDe } from './carte.js';
import { poser } from './grid.js';
import { ajouterMachine, retirerMachine, etendreMachine } from './scene.js';
import { creerConvoyeur, majGeometrie } from './belt.js';

// L'étage le plus haut qu'on ait ouvert, et donc celui dont le mur nous
// arrête. Le dernier du monde en a un aussi, tout en haut : sans seuil, il ne
// s'ouvre jamais — c'est ce qui dit que le jeu s'arrête là — mais il porte sa
// réception, et c'est là qu'on vend quand on est arrivé au sommet.
export function murCourant(monde) {
  if (monde.etageOuvert > ETAGES.length) return null;
  return { etage: ETAGES[monde.etageOuvert - 1], cy: rangeesDe(monde.etageOuvert).mur };
}

// Tous les murs posés sur la grille : ceux qu'on a ouverts, du bas vers le
// haut, puis celui qui nous arrête. Un mur ouvert reste debout — ce n'est que
// sa réception qui a cédé la place à un passage.
export function mursPoses(monde) {
  const liste = [];
  const dernier = Math.min(monde.etageOuvert, ETAGES.length);
  // Le mur de l'étage où l'on est n'est posé que s'il existe : au-delà du
  // dernier étage, il n'y a plus rien à fermer.
  for (let n = 1; n <= dernier; n++) {
    liste.push({
      etage: ETAGES[n - 1],
      cy: rangeesDe(n).mur,
      ouvert: n < monde.etageOuvert,
    });
  }
  return liste;
}

// Les trois cases du passage d'un mur : sa réception tant qu'il est fermé, ses
// connecteurs une fois ouvert.
export function cellulesPassage(cy) {
  return cellulesRecepteur(cy);
}

// Les connecteurs déjà posés sur cette rangée : une partie relue les rend avec
// le reste de la scène, et on ne lui en pose pas de seconds.
export function connecteursDuMur(scene, cy) {
  return scene.convoyeurs.filter((c) => c.connecteur && c.chemin[0].cy === cy);
}

// La rangée la plus haute qu'on puisse regarder : celle du mur. Elle doit
// pouvoir venir dans la zone sûre — on est au pied du mur, on le voit — et pas
// une rangée de plus : ce qu'il y a derrière ne se visite pas.
export function plafond(monde) {
  const mur = murCourant(monde);
  return mur ? mur.cy : 0;
}

// Peut-on bâtir sur cette rangée ? La grille dit déjà non sur le mur lui-même,
// puisqu'il l'occupe ; au-dessus, elle est vide et dirait oui. Or on voit ces
// rangées-là en reculant d'un cran, et un doigt les atteint.
export function constructible(monde, cy) {
  const mur = murCourant(monde);
  return !mur || cy > mur.cy;
}

// La réception du mur : trois cases au milieu de sa rangée, où l'on apporte ce
// qu'on produit. C'est une machine de la scène comme une autre — on y trace un
// tapis, elle a un stock, elle se remplit — et c'est ce qui fait qu'ouvrir un
// mur est un geste et non une attente.
//
// **C'est la seule adresse du jeu.** Elle achète ce qu'on lui porte et remplit
// la caisse ; ce qui intéresse son mur monte sa jauge au passage. Il y avait
// deux endroits — la livraison qui payait, la réception qui comptait — et un
// enfant devait choisir entre les deux sans qu'on lui ait dit pourquoi.
//
// Tout mur en a une, même celui qu'on ne sait pas encore ouvrir : sans elle,
// le dernier étage atteint n'aurait plus où vendre.
export function recepteurDuMur(monde) {
  return monde.scene.machines.find((m) => m.def.recepteur) || null;
}

// Les trois cellules de la réception, la sienne au milieu.
function cellulesRecepteur(cy) {
  const milieu = Math.floor(COLONNES / 2);
  const large = Math.floor(MACHINES.recepteur.largeur / 2);
  const cellules = [];
  for (let d = -large; d <= large; d++) cellules.push({ cx: milieu + d, cy });
  return cellules;
}

// Ce que la réception a reçu. Elle le compte déjà, matière par matière : le
// mur n'ajoute aucun compteur.
export function livreAuMur(monde, item) {
  const recepteur = recepteurDuMur(monde);
  return recepteur ? (recepteur.recus[item] || 0) : 0;
}

// Où en est le mur, de 0 à 1. C'est ce que le rendu montre, et rien d'autre :
// un enfant voit une jauge se remplir, il n'a pas à lire un compte.
export function avancementMur(monde) {
  const mur = murCourant(monde);
  if (!mur || !mur.etage.mur) return 0;
  return Math.min(1, livreAuMur(monde, mur.etage.mur.item) / mur.etage.mur.combien);
}

// La rangée du mur est occupée : rien ne s'y pose, aucun tapis ne la traverse.
// C'est la grille elle-même qui le dit, et tout le reste du jeu en hérite sans
// avoir appris ce qu'est un mur.
export function poserMur(monde) {
  // Les murs ouverts d'abord : ils restent debout, seul leur passage est
  // libre. C'est ce qui fait qu'un mur franchi se voit encore.
  for (const mur of mursPoses(monde)) {
    if (!mur.ouvert) continue;
    poserConnecteurs(monde, poserRangee(monde, mur.cy));
  }

  const mur = murCourant(monde);
  if (!mur) return;
  const cellules = poserRangee(monde, mur.cy);
  const milieu = cellules[Math.floor(cellules.length / 2)];
  // Une partie relue a déjà sa réception : elle est une machine de la scène,
  // et la sauvegarde l'a rendue comme les autres. On ne lui en pose pas une
  // seconde — on lui redonne seulement ses cellules, que la grille ne garde
  // pas.
  const recepteur = recepteurDuMur(monde) || ajouterMachine(
    // Un mur sans seuil ne réclame rien : sa réception n'a pas de matière, pas
    // de jauge, et ne s'ouvrira pas. Elle achète quand même — c'est là qu'on
    // vend, au dernier étage atteint comme aux autres.
    monde.scene, 'recepteur', milieu.cx, milieu.cy,
    { item: mur.etage.mur ? mur.etage.mur.item : null },
  );
  etendreMachine(monde.scene, recepteur, cellules.filter((c) => c.cx !== recepteur.cx));
}

// Les blocs d'une rangée de mur, sauf les trois cases de son passage. Rend
// ces trois cases : selon le mur, elles porteront la réception ou rien.
function poserRangee(monde, cy) {
  const cellules = cellulesRecepteur(cy);
  const prise = new Set(cellules.map((c) => c.cx));
  for (let cx = 0; cx < COLONNES; cx++) {
    if (prise.has(cx)) continue;
    poser(monde.scene.grille, cx, cy, { genre: 'mur' });
  }
  return cellules;
}

// Les connecteurs d'un mur ouvert : un bout de convoyeur par case du passage,
// d'une seule cellule, qui monte. Un tapis d'une case n'a pas de direction à
// lui — `sens` la lui donne, pour que ses chevrons disent où ça va avant même
// qu'on y branche quoi que ce soit.
function poserConnecteurs(monde, cellules) {
  const deja = connecteursDuMur(monde.scene, cellules[0].cy);
  for (const c of cellules) {
    if (deja.some((x) => x.chemin[0].cx === c.cx)) continue;
    const connecteur = creerConvoyeur([{ cx: c.cx, cy: c.cy }], null, null);
    connecteur.connecteur = true;
    connecteur.sens = { dx: 0, dy: -1 }; // on ne progresse que vers le haut
    majGeometrie(connecteur);
    monde.scene.convoyeurs.push(connecteur);
    poser(monde.scene.grille, c.cx, c.cy, { genre: 'convoyeur', convoyeur: connecteur });
  }
}

// Ouvrir un mur, c'est retirer sa réception : la rangée, elle, reste debout.
// Les trois cases qu'elle occupait deviennent ses connecteurs — trois bouts de
// convoyeur rouges par où les tapis franchissent le mur.
function ouvrirMur(monde) {
  const recepteur = recepteurDuMur(monde);
  if (!recepteur) return;
  // Les tapis qui la nourrissaient restent posés : ils perdent seulement où
  // ils allaient. Rien ne disparaît tout seul de la grille.
  const cellules = [...(recepteur.cellules || [recepteur])];
  for (const c of cellules) poser(monde.scene.grille, c.cx, c.cy, null);
  retirerMachine(monde.scene, recepteur);
  poserConnecteurs(monde, cellules);
}

// Le mur tombe-t-il ? On regarde à chaque pas : c'est la réception qui décide,
// et elle ne prévient personne.
//
// L'étage ouvert est relevé par le monde, comme la caisse et le livre : la
// simulation dit ce qui vient d'arriver, elle ne va pas l'annoncer elle-même.
export function majMur(monde) {
  const mur = murCourant(monde);
  if (!mur || !mur.etage.mur) return;
  if (livreAuMur(monde, mur.etage.mur.item) < mur.etage.mur.combien) return;
  ouvrirMur(monde);
  monde.etageOuvert++;
  monde.murTombe = ETAGES[monde.etageOuvert - 1];
  poserMur(monde);
}

// Ce qu'on peut bâtir, à cet étage-là. Chaque étage apporte une mécanique et
// pas seulement une matière : c'est ce qui donne à un mur une récompense
// au-delà d'une case de plus à récolter, et c'est là que le jeu grossira sans
// grossir en systèmes — un étage est une entrée de table.
//
// Ce qui n'est pas ouvert n'est pas montré. Une touche éteinte dirait qu'il y
// a autre chose, et c'est déjà ce que dit le mur : il n'y a pas deux façons de
// dire la même chose à un enfant.
export function ouverts(monde) {
  const ids = new Set(OUVERT_AU_DEPART);
  for (let n = 1; n <= Math.min(monde.etageOuvert, ETAGES.length); n++) {
    for (const id of ETAGES[n - 1].ouvre) ids.add(id);
  }
  return ids;
}
