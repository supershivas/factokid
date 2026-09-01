// Dix couples d'icônes pour construire et détruire.
// Chaque proposition doit se lire au pouce, en niveaux de gris, sans mot.

import { PALETTE, TUILE_PX } from '../src/design.js';

const C = PALETTE.creme;
const R = PALETTE.rouge;
const J = PALETTE.jaune;
const B = PALETTE.bleu;
const A = PALETTE.ardoise;

function icone(peindre) {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  peindre((x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); });
  return c;
}

// Une croix en diagonale, réglable : sert à plusieurs propositions.
function croix(rect, couleur, epaisseur = 2) {
  for (let i = 0; i < 10; i++) {
    rect(3 + i, 3 + i, epaisseur, epaisseur, couleur);
    rect(12 - i, 3 + i, epaisseur, epaisseur, couleur);
  }
}

export const ICONES_OUTILS = [
  {
    titre: '1. Plus et croix',
    note: 'les deux signes les plus universels',
    construire: icone((rect) => { rect(6, 3, 4, 10, C); rect(3, 6, 10, 4, C); }),
    detruire: icone((rect) => croix(rect, R)),
  },
  {
    titre: '2. Marteau et pioche',
    note: 'les outils du métier',
    construire: icone((rect) => {
      rect(3, 3, 9, 4, C); rect(6, 7, 3, 8, A); rect(6, 7, 3, 1, PALETTE.noir);
    }),
    detruire: icone((rect) => {
      rect(3, 4, 3, 3, R); rect(10, 4, 3, 3, R); rect(6, 6, 4, 2, R);
      rect(7, 8, 2, 7, A);
    }),
  },
  {
    titre: '3. Tapis et gomme',
    note: 'ce qu’on pose, ce qui l’efface',
    construire: icone((rect) => {
      rect(2, 5, 12, 1, PALETTE.noir); rect(2, 6, 12, 5, A); rect(2, 11, 12, 1, PALETTE.noir);
      for (let x = 3; x < 14; x += 4) rect(x, 8, 2, 1, B);
    }),
    detruire: icone((rect) => {
      rect(3, 8, 10, 5, C); rect(3, 8, 10, 1, A);
      rect(5, 5, 8, 4, R);
    }),
  },
  {
    titre: '4. Équerre et croix',
    note: 'tracer, puis barrer',
    construire: icone((rect) => { rect(3, 3, 3, 10, C); rect(3, 10, 10, 3, C); }),
    detruire: icone((rect) => croix(rect, R)),
  },
  {
    titre: '5. Bloc plein, bloc brisé',
    note: 'la même forme, entière ou cassée',
    construire: icone((rect) => { rect(3, 3, 10, 10, C); rect(5, 5, 6, 6, A); }),
    detruire: icone((rect) => {
      rect(3, 3, 4, 4, R); rect(9, 3, 4, 4, R); rect(3, 9, 4, 4, R); rect(9, 9, 4, 4, R);
    }),
  },
  {
    titre: '6. Truelle et explosion',
    note: 'poser doucement, retirer d’un coup',
    construire: icone((rect) => {
      rect(7, 2, 2, 6, A); rect(4, 8, 8, 3, C); rect(5, 11, 6, 2, C); rect(6, 13, 4, 1, C);
    }),
    detruire: icone((rect) => {
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2;
        rect(Math.round(8 + Math.cos(a) * 5), Math.round(8 + Math.sin(a) * 5), 2, 2, R);
      }
      rect(6, 6, 4, 4, J);
    }),
  },
  {
    titre: '7. Flèche qui pose, flèche qui prend',
    note: 'le geste plutôt que l’outil',
    construire: icone((rect) => {
      rect(7, 2, 2, 7, C);
      for (let i = 0; i < 4; i++) rect(5 + i, 9 - i, 6 - 2 * i, 1, C);
      rect(3, 13, 10, 2, A);
    }),
    detruire: icone((rect) => {
      rect(7, 7, 2, 7, R);
      for (let i = 0; i < 4; i++) rect(5 + i, 6 - i, 6 - 2 * i, 1, R);
      rect(3, 1, 10, 2, A);
    }),
  },
  {
    titre: '8. Case pleine, case vide',
    note: 'l’état de la cellule, rien d’autre',
    construire: icone((rect) => {
      rect(2, 2, 12, 12, PALETTE.noir); rect(3, 3, 10, 10, C);
    }),
    detruire: icone((rect) => {
      rect(2, 2, 12, 12, PALETTE.noir); rect(3, 3, 10, 10, A);
      for (let i = 0; i < 5; i++) rect(4 + i * 2, 4 + i * 2, 2, 2, R);
    }),
  },
  {
    titre: '9. Étoile et poubelle',
    note: 'la récompense, et le rebut',
    construire: icone((rect) => {
      rect(7, 2, 2, 12, J); rect(2, 7, 12, 2, J);
      rect(5, 5, 2, 2, J); rect(9, 5, 2, 2, J); rect(5, 9, 2, 2, J); rect(9, 9, 2, 2, J);
    }),
    detruire: icone((rect) => {
      rect(4, 3, 8, 2, R); rect(6, 1, 4, 2, R);
      rect(4, 5, 8, 9, A); rect(6, 7, 1, 5, PALETTE.noir); rect(9, 7, 1, 5, PALETTE.noir);
    }),
  },
  {
    titre: '10. Deux tuiles',
    note: 'la tuile qu’on ajoute, celle qu’on retire',
    construire: icone((rect) => {
      rect(2, 6, 8, 8, A); rect(2, 6, 8, 1, C);
      rect(9, 2, 2, 6, C); rect(7, 4, 6, 2, C);
    }),
    detruire: icone((rect) => {
      rect(2, 6, 8, 8, A); rect(2, 6, 8, 1, C);
      rect(8, 2, 6, 6, PALETTE.noir);
      for (let i = 0; i < 5; i++) { rect(9 + i, 3 + i, 1, 1, R); rect(13 - i, 3 + i, 1, 1, R); }
    }),
  },
];
