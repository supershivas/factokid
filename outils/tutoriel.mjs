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

// Les gestes du joueur, tirés de la table elle-même : l'outil ne recopie plus
// les coordonnées à côté d'elle. Elles y étaient en double, et le jour où la
// table a bougé c'est l'outil qui est tombé — pas le tutoriel.
//
// Ce qu'il vérifie reste entier : que chaque étape soit jouable dans l'ordre,
// qu'un geste en fasse avancer exactement une, et qu'au bout l'usine livre.
// Une table incohérente échoue toujours ici, puisque ce sont ses propres
// cellules qu'on joue.
const GESTES = TUTORIEL.map((etape) => {
  if (etape.epreuve === 'extracteur') {
    return () => poserExtracteur(monde, etape.cible.cx, etape.cible.cy);
  }
  if (etape.epreuve === 'machine') {
    return () => ajouterMachine(monde.scene, etape.machine, etape.cible.cx, etape.cible.cy, {});
  }
  if (etape.epreuve === 'lien') return () => tapis(etape);
  // La dernière : on laisse tourner, et on regarde si un bonbon arrive.
  return () => { for (let i = 0; i < 60 * 90; i++) majMonde(monde, 1 / 60); };
});

// Le chemin d'un tapis : les cellules que l'étape montre et qui ne portent pas
// déjà une machine. Les deux bouts en portent une — ce sont elles qu'on relie.
function tapis(etape) {
  const source = machineEn(monde.scene, etape.de.cx, etape.de.cy);
  const cible = machineEn(monde.scene, etape.a.cx, etape.a.cy);
  const chemin = etape.cibles
    .filter((c) => !machineEn(monde.scene, c.cx, c.cy))
    .map((c) => ({ cx: c.cx, cy: c.cy }));
  return poserConvoyeur(monde.scene, chemin, source, cible);
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
