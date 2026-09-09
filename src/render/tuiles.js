// Les machines, en pixels d'art. Table pure : aucun canvas, aucun DOM — c'est
// la même discipline que `render/motifs.js` pour les matières, et pour la même
// raison : une table se relit hors du navigateur, et se reprend dans un
// éditeur de pixel art.
//
// **Une lettre par couleur de la palette**, et rien d'autre. Les seize
// couleurs de Sweetie 16 ont chacune la sienne, mnémonique : la minuscule
// porte le corps de la couleur, la majuscule sa parente — n/N noir et nuit,
// b/B bleu et brume, c/C cyan et crème, a/A anis et ardoise, o/O orange et
// outremer, p/P prune et profond. Les quatre qui n'ont pas de parente gardent
// leur initiale seule. Le point est le vide, où le sol passe.
//
// C'est l'alphabet que l'atelier des sprites produit : on exporte un sprite en
// PNG (`labo/sprites.html`), on le redessine, on le rend, et ce qui revient
// est une table de cette forme. Rien ne se peint plus à la main en rectangles.

import { PALETTE } from '../design.js';

export const LETTRES = {
  n: 'noir', p: 'prune', r: 'rouge', o: 'orange', j: 'jaune', a: 'anis',
  v: 'vert', s: 'sarcelle', N: 'nuit', O: 'outremer', b: 'bleu', c: 'cyan',
  C: 'creme', B: 'brume', A: 'ardoise', P: 'profond',
};

export const TUILES = {
  // La chaufferie : une cuve où le sucre fond, sa flamme derrière une vitre, et
  // le tableau de bord en dessous. Dessinée à la main dans Pixel Studio, et
  // ramenée aux seize couleurs — c'est le premier sprite du jeu qui ne soit pas
  // écrit en rectangles.
  chaufferie: [
    '........................',
    '.CCCCCCCCCCCCCCCCCCCCCC.',
    '.BBBBBBBBBBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBBBBBBBBBB.',
    '.BABBBBBBBBBBBBBBBBBBAB.',
    '.BBBBNNNNNNNNNNNNNNBBBB.',
    '.BBBBNNNbbbbbbbbNNNBBBB.',
    '.BBBBNNbbbbbbbbbbNNBBBB.',
    '.BBBBNbboooooooobbNBBBB.',
    '.BBBBNboooojjoooobNBBBB.',
    '.BBBANooojjjjjjoooNABBB.',
    '.BBBANoojjjjjjjjooNABBB.',
    '.BBBANoojjjCCjjjjoNABBB.',
    '.BBBANNNNNNNNNNNNNNABBB.',
    '.BBBAAAAAAAAAAAAAAAABBB.',
    '.BBBBBBBBBBBBBBBBBBBBBB.',
    '.BBBBBBBBBBBBBBBBBBBBBB.',
    '.BBBNNNNNNNNNNNNNNNNBBB.',
    '.BBBNNjNjNjjjjNjNjNNBBB.',
    '.BBBNNNNNNNNNNNNNNNNBBB.',
    '.BABBBBBBBBBBBBBBBBBBAB.',
    '.BBBBBBBBBBBBBBBBBBBBBB.',
    '.AAAAAAAAAAAAAAAAAAAAAA.',
    '........................',
  ],
};

// Peint une table sur un rectangleur, pixel d'art par pixel d'art. Le vide
// reste vide : c'est le sol qui passe dessous.
export function peindreTuile(table) {
  return (rect) => {
    for (let y = 0; y < table.length; y++) {
      for (let x = 0; x < table[y].length; x++) {
        const lettre = table[y][x];
        if (lettre === '.') continue;
        rect(x, y, 1, 1, PALETTE[LETTRES[lettre]]);
      }
    }
  };
}
