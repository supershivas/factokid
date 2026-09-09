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
import { murCourant, plafond, constructible, livreAuMur } from '../src/sim/mur.js';
import { rangeesDe } from '../src/sim/carte.js';
import { celluleLibre, ajouterMachine, poserConvoyeur, machineEn } from '../src/sim/scene.js';
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
  veut(!constructible(monde, mur.cy), 'on ne bâtit pas sur le mur');
  veut(!constructible(monde, mur.cy - 1), 'ni derrière');
  veut(constructible(monde, mur.cy + 1), 'mais bien juste devant');

  // Un tapis ne le traverse pas : la grille refuse la case, et poserConvoyeur
  // ne pose rien du tout.
  const livraison = machineEn(monde.scene, DEPART_NU.machines[0].cx, DEPART_NU.machines[0].cy);
  const chemin = [];
  for (let cy = mur.cy + 3; cy >= mur.cy - 1; cy--) chemin.push({ cx: 5, cy });
  const traverse = poserConvoyeur(monde.scene, chemin, livraison, null);
  veut(traverse === null || traverse.chemin.every((c) => c.cy > mur.cy), 'aucun tapis ne franchit le mur');
  veut(problemes(monde.scene).length === 0, 'la scène reste saine');
}

// ————— 2. le mur tombe quand la livraison a reçu son dû
{
  const monde = creerMonde(DEPART, 1);
  const etage = ETAGES[0];
  const avant = murCourant(monde);
  let secondes = 0;
  const PAS = 1 / 60;
  let ouvertA = null;
  for (let k = 0; k < 900 * 60; k++) {
    const etait = monde.etageOuvert;
    majMonde(monde, PAS);
    secondes += PAS;
    if (monde.etageOuvert !== etait) { ouvertA = secondes; break; }
  }
  veut(ouvertA !== null, 'le mur finit par tomber');
  if (ouvertA !== null) {
    veut(
      livreAuMur(monde, etage.mur.item) >= etage.mur.combien,
      'il n’est tombé qu’une fois son dû livré',
    );
    veut(monde.etageOuvert === 2, 'l’étage 2 s’ouvre');
    veut(monde.murTombe === ETAGES[1], 'le monde dit ce qui vient de s’ouvrir');

    // Sa rangée redevient du sol ordinaire, et le mur suivant a pris sa place.
    veut(celluleLibre(monde.scene, 21, avant.cy), 'sa rangée redevient libre');
    veut(constructible(monde, avant.cy), 'on y bâtit');
    const apres = murCourant(monde);
    veut(apres && apres.cy === rangeesDe(2).mur, 'le mur suivant ferme l’étage 2');
    veut(!celluleLibre(monde.scene, 21, apres.cy), 'et sa rangée occupe la grille');
    veut(plafond(monde) === apres.cy, 'la caméra monte d’un étage');
    veut(problemes(monde.scene).length === 0, 'la scène reste saine');

    console.log(
      `  l'usine des trois branches ouvre le premier mur en ${ouvertA.toFixed(0)} s`
      + ` (${etage.mur.combien} ${etage.mur.item})`,
    );
  }
}

// ————— 3. ce que le mur coûte à qui n'a bâti qu'une branche
//
// C'est l'écart entre les deux qui dit si le seuil demande d'agrandir l'usine
// ou seulement d'attendre. Une branche est ce que le tutoriel pose en premier ;
// trois, ce qu'il finit par bâtir.
{
  const monde = creerMonde(DEPART_NU, 1);
  const livraison = machineEn(monde.scene, 21, 54);
  poserExtracteur(monde, GISEMENTS[0].cx, GISEMENTS[0].cy);
  const four = ajouterMachine(monde.scene, 'chaufferie', 19, 54, {});
  poserConvoyeur(
    monde.scene,
    [{ cx: 16, cy: 54 }, { cx: 17, cy: 54 }, { cx: 18, cy: 54 }],
    machineEn(monde.scene, GISEMENTS[0].cx, GISEMENTS[0].cy), four,
  );
  poserConvoyeur(monde.scene, [{ cx: 20, cy: 54 }], four, livraison);
  veut(problemes(monde.scene).length === 0, 'la branche unique est saine');

  let secondes = 0;
  let ouvertA = null;
  for (let k = 0; k < 3600 * 60; k++) {
    const etait = monde.etageOuvert;
    majMonde(monde, 1 / 60);
    secondes += 1 / 60;
    if (monde.etageOuvert !== etait) { ouvertA = secondes; break; }
  }
  veut(ouvertA !== null, 'une seule branche y arrive aussi, à la longue');
  if (ouvertA !== null) {
    console.log(`  une branche seule ouvre le premier mur en ${ouvertA.toFixed(0)} s`);
  }
}

console.log(echecs === 0 ? '\n✓ le mur tient, et il tombe' : `\n✗ ${echecs} problème(s)`);
process.exit(echecs === 0 ? 0 : 1);
