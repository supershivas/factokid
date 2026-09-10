// Vérification des cartes engendrées, sans navigateur : la génération est du
// JS pur, on peut en tirer des centaines et les relire.
//
//   node outils/carte.mjs [combien]
//
// Depuis que le monde se lit en étages, ce n'est plus une répartition qu'on
// espère mais une promesse qu'on tient. Ce qu'elle promet :
//
//   1. le pied du monde ne change jamais — mêmes gisements écrits, et rien
//      d'autre de tiré dans son rayon ;
//   2. un étage, une matière — aucun gisement ne déborde de sa bande, et
//      aucun ne porte autre chose que ce que son étage donne ;
//   3. aucun étage à matière n'est pauvre : il ne peut pas manquer de sucre
//      dans le monde du sucre ;
//   4. la rangée du mur ne porte rien — un gisement qu'on ne peut pas
//      atteindre est un gisement qu'on regarde ;
//   5. la carte est saine — pas deux gisements sur la même case, rien hors de
//      la grille, et une graine donne toujours la même carte ;
//   6. le premier contact reste jouable — aucun gisement tiré ne tombe sur une
//      case que le tutoriel demande d'occuper. C'est la promesse qui a coûté
//      le plus cher le jour où la graine d'une nouvelle partie est devenue
//      aléatoire : une carte sur deux posait du sucre sous une chaufferie.

import { COLONNES, LIGNES } from '../src/design.js';
import { creerCarte, etageDe, rangeesDe } from '../src/sim/carte.js';
import { GISEMENTS, PIED_DU_MONDE } from '../src/data/monde.js';
import { ETAGES } from '../src/data/zones.js';
import { RAYON_DEPART } from '../src/data/biomes.js';
import { TUTORIEL } from '../src/data/tutoriel.js';

// Ce qu'un étage doit porter au minimum pour qu'on y bâtisse quelque chose.
// Un tapis porte la récolte de dix extracteurs : bien en dessous de ça, un
// étage devient une chasse au trésor, et ce n'est pas le jeu.
const MINIMUM_PAR_ETAGE = 12;

const COMBIEN = Number(process.argv[2] || 300);
let echecs = 0;
const echec = (m) => { echecs++; console.log('  ✗ ' + m); };
const cle = (g) => g.cx + ',' + g.cy;
const distance = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy);

const depart = GISEMENTS.map((g) => cle(g) + ':' + g.item).join(' ');
// Les cases du premier contact, moins celles qui sont justement des gisements
// écrits : ce sont elles qu'un tirage ne doit jamais occuper.
const ecritsLa = new Set(GISEMENTS.map(cle));
const reserve = new Set(
  TUTORIEL.flatMap((e) => e.cibles).map(cle).filter((k) => !ecritsLa.has(k)),
);
// Le plus pauvre des étages, toutes graines confondues : c'est lui qui dit si
// une partie peut tourner court quelque part.
const pires = {};
for (const e of ETAGES) if (e.matiere) pires[e.n] = Infinity;

for (let graine = 1; graine <= COMBIEN; graine++) {
  const carte = creerCarte(graine);

  // 1. le pied du monde
  const ecrits = carte.gisements.slice(0, GISEMENTS.length).map((g) => cle(g) + ':' + g.item).join(' ');
  if (ecrits !== depart) echec(`graine ${graine} : le pied du monde a bougé — ${ecrits}`);
  for (const g of carte.gisements.slice(GISEMENTS.length)) {
    if (distance(g, PIED_DU_MONDE) < RAYON_DEPART) {
      echec(`graine ${graine} : un gisement tiré en ${cle(g)} tombe dans le pied du monde`);
    }
  }

  // 2 et 4. chacun dans son étage, et jamais sur un mur
  const compte = {};
  for (const g of carte.gisements) {
    const etage = etageDe(g.cy);
    if (!etage.matiere) { echec(`graine ${graine} : un gisement à l'étage ${etage.n}, qui ne donne rien`); continue; }
    if (g.item !== etage.matiere) {
      echec(`graine ${graine} : du ${g.item} à l'étage ${etage.n}, qui donne ${etage.matiere}`);
    }
    if (g.cy === rangeesDe(etage.n).mur) {
      echec(`graine ${graine} : un gisement en ${cle(g)}, sur la rangée du mur`);
    }
    compte[etage.n] = (compte[etage.n] || 0) + 1;
  }

  // 3. aucun étage pauvre
  for (const e of ETAGES) {
    if (!e.matiere) continue;
    const n = compte[e.n] || 0;
    pires[e.n] = Math.min(pires[e.n], n);
    if (n < MINIMUM_PAR_ETAGE) echec(`graine ${graine} : ${n} gisement(s) à l'étage ${e.n}`);
  }

  // 6. le premier contact garde ses cases
  for (const g of carte.gisements.slice(GISEMENTS.length)) {
    if (reserve.has(cle(g))) {
      echec(`graine ${graine} : un gisement en ${cle(g)}, sur une case du tutoriel`);
    }
  }

  // 5. la carte est saine
  const vues = new Set();
  for (const g of carte.gisements) {
    if (vues.has(cle(g))) echec(`graine ${graine} : deux gisements en ${cle(g)}`);
    vues.add(cle(g));
    if (g.cx < 0 || g.cy < 0 || g.cx >= COLONNES || g.cy >= LIGNES) {
      echec(`graine ${graine} : un gisement hors de la grille en ${cle(g)}`);
    }
  }

  // la même graine, la même carte
  const encore = creerCarte(graine);
  if (JSON.stringify(encore.gisements) !== JSON.stringify(carte.gisements)) {
    echec(`graine ${graine} : deux tirages, deux cartes`);
  }
}

console.log(
  COMBIEN + ' cartes',
  '— au pire par étage : ' + Object.entries(pires).map(([n, v]) => 'étage ' + n + ' ' + v).join(', '),
  `(plancher ${MINIMUM_PAR_ETAGE})`,
);
console.log(echecs === 0 ? '\n✓ toutes les cartes tiennent' : `\n✗ ${echecs} problème(s)`);
process.exit(echecs === 0 ? 0 : 1);
