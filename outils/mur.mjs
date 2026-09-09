// Le mur joué de bout en bout, sans navigateur : on bâtit l'usine de l'étage
// 1, on la laisse tourner, et on regarde le mur tomber.
//
//   node outils/mur.mjs
//
// Ce qu'il tient :
//
//   1. on ne bâtit pas derrière un mur — ni sa rangée, ni celles du dessus ;
//   2. un tapis ne le traverse pas ;
//   3. il tombe quand la livraison a reçu son dû, et pas avant ;
//   4. tombé, il redevient du sol ordinaire : on bâtit sur sa rangée, et le
//      mur suivant a pris sa place plus haut ;
//   5. ce qu'il coûte en temps, mesuré : c'est le seul chiffre qui dise si le
//      seuil est juste, et il change à chaque fois qu'on touche à l'économie.

import { creerMonde, majMonde } from '../src/sim/world.js';
import { DEPART, DEPART_NU } from '../src/data/depart.js';
import { ETAGES } from '../src/data/zones.js';
import {
  murCourant, plafond, constructible, livreAuMur, ouverts, recepteurDuMur,
} from '../src/sim/mur.js';
import { rangeesDe } from '../src/sim/carte.js';
import { celluleLibre, ajouterMachine, poserConvoyeur, machineEn } from '../src/sim/scene.js';
import { peutAccepter, pousser } from '../src/sim/belt.js';
import { poserExtracteur } from '../src/sim/gisement.js';
import { GISEMENTS } from '../src/data/monde.js';
import { problemes } from './invariants.mjs';

let echecs = 0;
const veut = (condition, quoi) => {
  if (condition) return true;
  echecs++;
  console.log('✗', quoi);
  return false;
};

// ————— 1. ce qui est fermé est fermé
{
  const monde = creerMonde(DEPART_NU, 1);
  const mur = murCourant(monde);
  veut(mur && mur.cy === rangeesDe(1).mur, 'le premier mur ferme l’étage 1');
  veut(plafond(monde) === mur.cy, 'la caméra s’arrête à sa rangée');

  veut(!celluleLibre(monde.scene, 0, mur.cy), 'sa rangée occupe la grille');
  veut(!celluleLibre(monde.scene, 21, mur.cy), 'd’un bout à l’autre');

  // Trois cases au milieu ne sont pas du mur mais sa réception : c'est là
  // qu'on apporte ce qu'il réclame.
  const recepteur = recepteurDuMur(monde);
  veut(recepteur !== null, 'le mur a sa réception');
  veut(recepteur.item === mur.etage.mur.item, 'elle attend ce que le mur réclame');
  veut(recepteur.cellules.length === 3, 'elle occupe trois cases');
  for (const c of recepteur.cellules) {
    veut(machineEn(monde.scene, c.cx, c.cy) === recepteur, `la case ${c.cx},${c.cy} est la sienne`);
  }
  veut(livreAuMur(monde, mur.etage.mur.item) === 0, 'et elle n’a rien reçu');
  veut(!constructible(monde, mur.cy), 'on ne bâtit pas sur le mur');
  veut(!constructible(monde, mur.cy - 1), 'ni derrière');
  veut(constructible(monde, mur.cy + 1), 'mais bien juste devant');

  // Au pied du monde, on pose un extracteur et une chaufferie, et c'est tout
  // ce qu'il y a à comprendre.
  const ouvert = ouverts(monde);
  veut(ouvert.has('extracteur') && ouvert.has('chaufferie'), 'l’étage 1 ouvre le noyau');
  veut(ouvert.has('convoyeur'), 'et le tapis est là depuis toujours');
  veut(!ouvert.has('trieur') && !ouvert.has('confiserie'), 'le reste attend son étage');

  // Un tapis ne le traverse pas : la grille refuse la case, et poserConvoyeur
  // ne pose rien du tout.
  const livraison = machineEn(monde.scene, DEPART_NU.machines[0].cx, DEPART_NU.machines[0].cy);
  const chemin = [];
  for (let cy = mur.cy + 3; cy >= mur.cy - 1; cy--) chemin.push({ cx: 5, cy });
  const traverse = poserConvoyeur(monde.scene, chemin, livraison, null);
  veut(traverse === null || traverse.chemin.every((c) => c.cy > mur.cy), 'aucun tapis ne franchit le mur');
  veut(problemes(monde.scene).length === 0, 'la scène reste saine');
}

// ————— 2. le mur tombe quand on lui a porté son dû
//
// Il ne tombe plus tout seul : la livraison achète, la réception avale, et ce
// sont deux endroits. Il faut donc détourner un tapis vers le mur — ce qui
// coûte ce qu'il rapportait à la caisse, et c'est exactement le choix qu'on
// veut faire prendre.
function detourner(monde, combien) {
  // Les chaufferies de l'usine de départ, de la plus proche du mur à la plus
  // loin. Chacune n'a qu'une sortie : la détourner, c'est cesser de vendre son
  // caramel pour le porter au mur.
  const chemins = [
    { four: { cx: 19, cy: 54 }, chemin: [[19, 53], [19, 52], [19, 51], [19, 50], [19, 49], [20, 49]] },
    { four: { cx: 25, cy: 52 }, chemin: [[25, 51], [25, 50], [24, 50], [23, 50], [22, 50], [22, 49]] },
    { four: { cx: 21, cy: 56 }, chemin: [[20, 56], [20, 55], [20, 54], [20, 53], [20, 52], [20, 51], [20, 50], [21, 50], [21, 49]] },
  ];
  const recepteur = recepteurDuMur(monde);
  let tuiles = 0;
  for (let i = 0; i < combien; i++) {
    const c = chemins[i];
    const four = machineEn(monde.scene, c.four.cx, c.four.cy);
    const pose = poserConvoyeur(
      monde.scene, c.chemin.map(([cx, cy]) => ({ cx, cy })), four, recepteur,
    );
    veut(Boolean(pose), `le tapis ${i + 1} vers la réception est posé`);
    veut(pose && pose.cible === recepteur, `et il vise bien la réception`);
    tuiles += c.chemin.length;
  }
  return tuiles;
}

// La réception part avec son mur : ce qu'elle avait reçu se relève donc avant
// le pas qui l'emporte, pas après.
function jusquAuMur(monde, item, plafondSecondes = 1800) {
  let secondes = 0;
  for (let k = 0; k < plafondSecondes * 60; k++) {
    const etait = monde.etageOuvert;
    const porte = livreAuMur(monde, item);
    majMonde(monde, 1 / 60);
    secondes += 1 / 60;
    if (monde.etageOuvert !== etait) return { secondes, porte };
  }
  return null;
}

{
  const monde = creerMonde(DEPART, 1);
  const etage = ETAGES[0];
  const avant = murCourant(monde);
  const tuiles = detourner(monde, 1);
  veut(problemes(monde.scene).length === 0, 'la scène reste saine, tapis tiré');

  const fin = jusquAuMur(monde, etage.mur.item);
  veut(fin !== null, 'le mur finit par tomber');
  if (fin !== null) {
    const ouvertA = fin.secondes;
    veut(
      fin.porte + 1 >= etage.mur.combien,
      `il n'est tombé qu'une fois son dû porté (${fin.porte} sur ${etage.mur.combien})`,
    );
    veut(monde.etageOuvert === 2, 'l’étage 2 s’ouvre');
    veut(monde.murTombe === ETAGES[1], 'le monde dit ce qui vient de s’ouvrir');
    veut(recepteurDuMur(monde) === null, 'la réception part avec son mur');
    veut(celluleLibre(monde.scene, 21, avant.cy), 'sa rangée redevient libre');
    veut(constructible(monde, avant.cy), 'on y bâtit');
    const apres = murCourant(monde);
    veut(apres && apres.cy === rangeesDe(2).mur, 'le mur suivant ferme l’étage 2');
    veut(!celluleLibre(monde.scene, 21, apres.cy), 'et sa rangée occupe la grille');
    veut(plafond(monde) === apres.cy, 'la caméra monte d’un étage');
    veut(problemes(monde.scene).length === 0, 'la scène reste saine, mur tombé');

    // L'étage 2 n'a pas de seuil : son mur ne réclame rien, donc pas de
    // réception. C'est ce qui dit que le jeu s'arrête là.
    veut(recepteurDuMur(monde) === null, 'un mur sans seuil n’a pas de réception');

    // Chaque étage apporte une mécanique, pas seulement une matière.
    const apresOuvert = ouverts(monde);
    for (const id of ETAGES[1].ouvre) veut(apresOuvert.has(id), `l’étage 2 ouvre le ${id}`);
    for (const id of ETAGES[0].ouvre) veut(apresOuvert.has(id), `et garde le ${id}`);
    veut(!apresOuvert.has('plieuse'), 'la plieuse attend encore son étage');

    console.log(
      `  un tapis détourné (${tuiles} tuiles) ouvre le premier mur en `
      + `${ouvertA.toFixed(0)} s (${etage.mur.combien} ${etage.mur.item})`,
    );
  }
}

// ————— 3. ce que coûtent deux tapis détournés
//
// L'écart entre un et deux dit si le seuil demande d'agrandir l'usine ou
// seulement d'attendre. C'est le seul chiffre qui règle le seuil.
{
  const monde = creerMonde(DEPART, 1);
  detourner(monde, 2);
  const fin = jusquAuMur(monde, ETAGES[0].mur.item);
  veut(fin !== null, 'deux tapis y arrivent aussi');
  if (fin !== null) console.log(`  deux tapis détournés : ${fin.secondes.toFixed(0)} s`);
}

// ————— 4. la réception ne prend que ce que le mur réclame
{
  const monde = creerMonde(DEPART_NU, 1);
  const recepteur = recepteurDuMur(monde);
  const mine = ajouterMachine(monde.scene, 'extracteur', 21, 51, { item: 'sucre' });
  const tapis = poserConvoyeur(
    monde.scene, [{ cx: 21, cy: 50 }, { cx: 21, cy: 49 }], mine, recepteur,
  );
  veut(Boolean(tapis), 'un tapis de sucre atteint la réception');
  if (peutAccepter(tapis)) pousser(tapis, 'sucre');
  for (let k = 0; k < 600; k++) majMonde(monde, 1 / 60);
  veut(livreAuMur(monde, 'caramel') === 0, 'le sucre ne compte pas pour un mur qui veut du caramel');
  veut(tapis.items.length > 0, 'il s’accumule sur le tapis, et le joueur le voit');
  veut(problemes(monde.scene).length === 0, 'la scène reste saine');
}

console.log(echecs === 0 ? '\n✓ le mur tient, et il tombe' : `\n✗ ${echecs} problème(s)`);
process.exit(echecs === 0 ? 0 : 1);
