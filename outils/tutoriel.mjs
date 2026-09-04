// Le tutoriel joué de bout en bout, sans navigateur : la simulation est du JS
// pur, on peut donc bâtir l'usine étape par étape et vérifier que chaque
// épreuve tombe au bon moment.
//
//   node outils/tutoriel.mjs
//
// Ce qu'il tient : que la suite des étapes soit jouable dans l'ordre — chaque
// geste fait avancer d'exactement une étape — et qu'au bout, l'usine livre
// vraiment des bonbons. Une étape ajoutée à la table demande un geste de plus
// ici, et c'est tant mieux : une étape qu'on ne sait pas jouer n'a rien à
// faire dans le tutoriel.
import { creerMonde, majMonde } from '../src/sim/world.js';
import { DEPART_NU } from '../src/data/depart.js';
import { poserExtracteur } from '../src/sim/gisement.js';
import { ajouterMachine, poserConvoyeur, machineEn } from '../src/sim/scene.js';
import { creerTutoriel, majTutoriel, etapeCourante } from '../src/tutoriel.js';
import { TUTORIEL } from '../src/data/tutoriel.js';

const monde = creerMonde(DEPART_NU);
const tuto = creerTutoriel();
let echecs = 0;

// Les gestes du joueur, dans l'ordre du tutoriel.
const GESTES = [
  () => poserExtracteur(monde, 4, 12),
  () => ajouterMachine(monde.scene, 'chaufferie', 6, 12, {}),
  () => tapis([[5, 12]], { cx: 4, cy: 12 }, { cx: 6, cy: 12 }),
  () => ajouterMachine(monde.scene, 'confiserie', 8, 14, {}),
  () => tapis([[6, 13], [6, 14], [7, 14]], { cx: 6, cy: 12 }, { cx: 8, cy: 14 }),
  () => poserExtracteur(monde, 8, 11),
  () => tapis([[8, 12], [8, 13]], { cx: 8, cy: 11 }, { cx: 8, cy: 14 }),
  () => poserExtracteur(monde, 11, 14),
  () => tapis([[10, 14], [9, 14]], { cx: 11, cy: 14 }, { cx: 8, cy: 14 }),
  () => ajouterMachine(monde.scene, 'plieuse', 10, 16, {}),
  () => tapis([[8, 15], [9, 15], [9, 16]], { cx: 8, cy: 14 }, { cx: 10, cy: 16 }),
  () => poserExtracteur(monde, 12, 16),
  () => ajouterMachine(monde.scene, 'scierie', 11, 17, {}),
  () => tapis([[12, 17]], { cx: 12, cy: 16 }, { cx: 11, cy: 17 }),
  () => tapis([[11, 16]], { cx: 11, cy: 17 }, { cx: 10, cy: 16 }),
  () => tapis([[10, 17]], { cx: 10, cy: 16 }, { cx: 10, cy: 18 }),
  () => { for (let i = 0; i < 60 * 90; i++) majMonde(monde, 1 / 60); },
];

function tapis(cellules, de, a) {
  const source = machineEn(monde.scene, de.cx, de.cy);
  const cible = machineEn(monde.scene, a.cx, a.cy);
  return poserConvoyeur(monde.scene, cellules.map(([cx, cy]) => ({ cx, cy })), source, cible);
}

for (let i = 0; i < GESTES.length; i++) {
  const etape = etapeCourante(tuto);
  if (!etape || etape.id !== TUTORIEL[i].id) {
    console.log(`  ✗ étape ${i} : on attendait ${TUTORIEL[i].id}, on est sur ${etape && etape.id}`);
    echecs++;
    break;
  }
  GESTES[i]();
  majMonde(monde, 1 / 60);
  majTutoriel(tuto, monde, 1 / 60);
  const passee = tuto.etape > i;
  console.log(`  ${passee ? '·' : '✗'} ${TUTORIEL[i].id} — ${etape.nom}`);
  if (!passee) echecs++;
}

const livraison = monde.scene.machines.find((m) => m.def.entree);
console.log('\nbonbons livrés :', livraison.consommes);
console.log('tutoriel fini :', tuto.etape >= TUTORIEL.length);
if (livraison.consommes === 0) { echecs++; console.log('  ✗ l’usine ne livre pas'); }
console.log(echecs === 0 ? '\n✓ le tutoriel mène à une usine qui tourne' : `\n✗ ${echecs} problème(s)`);
process.exit(echecs === 0 ? 0 : 1);
