// Vérification des cartes engendrées, sans navigateur : la génération est du
// JS pur, on peut en tirer des centaines et les relire.
//
//   node outils/carte.mjs [combien]
//
// Depuis que la carte est tirée au sort, ce n'est plus une table qu'on relit
// mais une promesse qu'on tient. Ce qu'elle promet :
//
//   1. la clairière ne change jamais — mêmes quatre gisements, même région de
//      terre au centre, et rien d'autre de tiré dans son rayon ;
//   2. aucune matière ne manque — une carte à un seul arbre est une chasse au
//      trésor, pas une partie ;
//   3. la carte est saine — pas deux gisements sur la même case, rien hors de
//      la grille, et une graine donne toujours la même carte.

import { COLONNES, LIGNES, CENTRE } from '../src/design.js';
import { creerCarte } from '../src/sim/carte.js';
import { GISEMENTS } from '../src/data/monde.js';
import { MATIERE_DE, MINIMUM_PAR_MATIERE, RAYON_CLAIRIERE } from '../src/data/biomes.js';

const COMBIEN = Number(process.argv[2] || 300);
let echecs = 0;
const echec = (m) => { echecs++; console.log('  ✗ ' + m); };
const cle = (g) => g.cx + ',' + g.cy;
const distance = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);

const matieres = Object.values(MATIERE_DE);
const clairiere = GISEMENTS.map((g) => cle(g) + ':' + g.item).join(' ');
const pires = {};
for (const m of matieres) pires[m] = Infinity;
let totalGisements = 0;

for (let graine = 1; graine <= COMBIEN; graine++) {
  const carte = creerCarte(graine);
  totalGisements += carte.gisements.length;

  // 1. la clairière, intacte
  const quatre = carte.gisements.slice(0, GISEMENTS.length).map((g) => cle(g) + ':' + g.item).join(' ');
  if (quatre !== clairiere) echec(`graine ${graine} : la clairière a bougé — ${quatre}`);
  const centre = carte.regions[0];
  if (centre.cx !== CENTRE.cx || centre.cy !== CENTRE.cy || centre.biome !== 'terre') {
    echec(`graine ${graine} : la région du milieu n'est plus la terre du centre`);
  }
  for (const g of carte.gisements.slice(GISEMENTS.length)) {
    if (distance(g, CENTRE) < RAYON_CLAIRIERE) {
      echec(`graine ${graine} : un gisement tiré en ${cle(g)} est dans la clairière`);
      break;
    }
  }

  // 2. aucune matière ne manque
  const compte = {};
  for (const g of carte.gisements) compte[g.item] = (compte[g.item] || 0) + 1;
  for (const m of matieres) {
    const n = compte[m] || 0;
    pires[m] = Math.min(pires[m], n);
    if (n < MINIMUM_PAR_MATIERE) echec(`graine ${graine} : ${n} gisement(s) de ${m}`);
  }

  // 3. la carte est saine
  const vues = new Set();
  for (const g of carte.gisements) {
    if (vues.has(cle(g))) { echec(`graine ${graine} : deux gisements en ${cle(g)}`); break; }
    vues.add(cle(g));
    if (g.cx < 0 || g.cy < 0 || g.cx >= COLONNES || g.cy >= LIGNES) {
      echec(`graine ${graine} : un gisement en ${cle(g)} est hors de la grille`);
      break;
    }
  }
}

// La même graine doit rendre la même carte : c'est ce qui rend une partie
// rejouable et cet outil reproductible.
const a = JSON.stringify(creerCarte(7));
const b = JSON.stringify(creerCarte(7));
if (a !== b) echec('deux cartes de même graine diffèrent');

console.log(`${COMBIEN} cartes — ${(totalGisements / COMBIEN).toFixed(0)} gisements en moyenne`);
console.log('  au pire :', matieres.map((m) => `${m} ${pires[m]}`).join(', '),
  `(plancher ${MINIMUM_PAR_MATIERE})`);
console.log(echecs === 0 ? '\n✓ toutes les cartes tiennent' : `\n✗ ${echecs} problème(s)`);
process.exit(echecs === 0 ? 0 : 1);
