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
// n'est compté à part pour autant : c'est la livraison qui sait ce qu'elle a
// reçu, matière par matière, et le mur ne fait que le lire.
//
// **Un mur ouvert redevient du sol ordinaire.** Pas de porte, pas de goulot
// d'une case où les tapis s'étranglent : ouvert veut dire franchi, on n'y
// pense plus.

import { COLONNES } from '../design.js';
import { ETAGES, OUVERT_AU_DEPART } from '../data/zones.js';
import { MACHINES } from '../data/machines.js';
import { rangeesDe } from './carte.js';
import { poser, lire } from './grid.js';
import { ajouterMachine, retirerMachine, etendreMachine } from './scene.js';

// L'étage le plus haut qu'on ait ouvert, et donc celui dont le mur nous
// arrête. Le dernier du monde n'a pas de mur : c'est le bord du monde qui le
// ferme, et il n'y a rien au-delà.
export function murCourant(monde) {
  if (monde.etageOuvert >= ETAGES.length) return null;
  return { etage: ETAGES[monde.etageOuvert - 1], cy: rangeesDe(monde.etageOuvert).mur };
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
// qu'il réclame. C'est une machine de la scène comme une autre — on y trace un
// tapis, elle a un stock, elle se remplit — et c'est ce qui fait qu'ouvrir un
// mur est un geste et non une attente.
//
// Elle n'est pas la livraison. Celle-ci achète et remplit la caisse ; la
// réception avale et ne paie rien. Deux endroits, deux rôles.
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
  const mur = murCourant(monde);
  if (!mur) return;
  const cellules = mur.etage.mur ? cellulesRecepteur(mur.cy) : [];
  const prise = new Set(cellules.map((c) => c.cx));
  for (let cx = 0; cx < COLONNES; cx++) {
    if (prise.has(cx)) continue;
    poser(monde.scene.grille, cx, mur.cy, { genre: 'mur' });
  }
  // Un mur sans seuil ne réclame rien : il n'a pas de réception, et il est
  // plein sur toute sa longueur. C'est le cas des étages qu'on n'a pas encore
  // décidés — le jeu s'arrête là, et ça se voit.
  if (cellules.length === 0) return;
  const milieu = cellules[Math.floor(cellules.length / 2)];
  // Une partie relue a déjà sa réception : elle est une machine de la scène,
  // et la sauvegarde l'a rendue comme les autres. On ne lui en pose pas une
  // seconde — on lui redonne seulement ses cellules, que la grille ne garde
  // pas.
  const recepteur = recepteurDuMur(monde) || ajouterMachine(
    monde.scene, 'recepteur', milieu.cx, milieu.cy, { item: mur.etage.mur.item },
  );
  etendreMachine(monde.scene, recepteur, cellules.filter((c) => c.cx !== recepteur.cx));
}

function retirerMur(monde, cy) {
  const recepteur = recepteurDuMur(monde);
  if (recepteur) {
    // Les tapis qui la nourrissaient restent posés : ils perdent seulement où
    // ils allaient. Rien ne disparaît tout seul de la grille.
    for (const c of recepteur.cellules || [recepteur]) poser(monde.scene.grille, c.cx, c.cy, null);
    retirerMachine(monde.scene, recepteur);
  }
  for (let cx = 0; cx < COLONNES; cx++) {
    const c = lire(monde.scene.grille, cx, cy);
    if (c && c.genre === 'mur') poser(monde.scene.grille, cx, cy, null);
  }
}

// Le mur tombe-t-il ? On regarde à chaque pas : c'est la livraison qui décide,
// et elle ne prévient personne.
//
// L'étage ouvert est relevé par le monde, comme la caisse et le livre : la
// simulation dit ce qui vient d'arriver, elle ne va pas l'annoncer elle-même.
export function majMur(monde) {
  const mur = murCourant(monde);
  if (!mur || !mur.etage.mur) return;
  if (livreAuMur(monde, mur.etage.mur.item) < mur.etage.mur.combien) return;
  retirerMur(monde, mur.cy);
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
