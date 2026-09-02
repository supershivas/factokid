// Combien de détail peut-on mettre dans une icône ? La question n'est pas de
// dessiner mieux, elle est de savoir sur combien de pixels on dessine.
//
// Le bouton fait 48 unités logiques — c'est la cible tactile, elle ne bouge
// pas. Pour que la mise à l'échelle reste entière, la grille de dessin doit
// donc diviser 48 : on a le choix entre 16 pixels d'art (×3, ce qu'on fait
// aujourd'hui), 24 (×2), ou 48 (×1). Rien entre les deux : 32 pixels
// donneraient ×1,5 et floueraient tout.
//
// Cette page montre la même main aux trois résolutions, à la taille qu'elle
// aura vraiment dans la barre d'outils.

import { PALETTE, BOUTON } from '../src/design.js';

export const FORMAT = { largeur: 64, hauteur: 64, echelle: 2 };

// « # » l'encre noire, « + » l'ardoise qui remplit, « . » la plaque nue.
const ENCRE = { '#': PALETTE.noir, '+': PALETTE.ardoise };

function sprite(lignes) {
  const taille = lignes.length;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const g = c.getContext('2d');
  for (let y = 0; y < taille; y++) {
    for (let x = 0; x < taille; x++) {
      const couleur = ENCRE[lignes[y][x]];
      if (!couleur) continue;
      g.fillStyle = couleur;
      g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

// --- 16 pixels : ce qu'on sait faire aujourd'hui --------------------------

const MAIN_16 = [
  '................',
  '.....#.#.#......',
  '....##.#.##.....',
  '....##.#.##.....',
  '.##.#######.....',
  '.####.######....',
  '.###########....',
  '.###########....',
  '..##########....',
  '..##########....',
  '...#########....',
  '....########....',
  '....########....',
  '...##########...',
  '................',
  '................',
];

// --- 24 pixels : deux fois plus de matière, un contour et un remplissage ---

const OUVERTE_24 = [
  '........................',
  '........................',
  '..........###...........',
  '..........#+#.###.......',
  '......###.#+#.#+#.......',
  '......#+#.#+#.#+#.......',
  '......#+#.#+#.#+#.###...',
  '......#+#.#+#.#+#.#+#...',
  '......#+#.#+#.#+#.#+#...',
  '......#+#.#+#.#+#.#+#...',
  '..###.#+#.#+#.#+#.#+#...',
  '.#++#.#+###+###+###+#...',
  '.#++##+++++++++++++++#..',
  '.#+++++++++++++++++++#..',
  '..#++++++++++++++++++#..',
  '..#++++++++++++++++++#..',
  '...#+++++++++++++++++#..',
  '....#++++++++++++++++#..',
  '.....#+++++++++++++++#..',
  '......#+++++++++++++#...',
  '.......#############....',
  '........................',
  '........................',
  '........................',
];

const POING_24 = [
  '........................',
  '........................',
  '........................',
  '.......##..##..##..##...',
  '......#++##++##++##++#..',
  '.....#++++++++++++++++#.',
  '....#+++++++++++++++++#.',
  '...#++#++#++#++#++++++#.',
  '..#+++++++++++++++++++#.',
  '.###++++++++++++++++++#.',
  '#+++#+++++++++++++++++#.',
  '#++++#++++++++++++++++#.',
  '#+++++++++++++++++++++#.',
  '.#++++++++++++++++++++#.',
  '.#+++++++++++++++++++#..',
  '..#+++++++++++++++++#...',
  '...#+++++++++++++++#....',
  '....###############.....',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
  '........................',
];

const GANT_24 = [
  '........................',
  '........................',
  '.........###.###........',
  '........#+#.#+#.........',
  '......###+#.#+###.......',
  '.....#+#+#+#+#+#+#......',
  '.###.#+#+#+#+#+#+#......',
  '#+++#+#+#+#+#+#+#+#.....',
  '#++++#+++++++++++++#....',
  '#++++++++++++++++++#....',
  '.#+++++++++++++++++#....',
  '.#+++++++++++++++++#....',
  '..#++++++++++++++++#....',
  '..#++++++++++++++++#....',
  '...#+++++++++++++++#....',
  '...#+++++++++++++++#....',
  '....#++++++++++++++#....',
  '....################....',
  '...#++++++++++++++++#...',
  '...#++++++++++++++++#...',
  '...##################...',
  '........................',
  '........................',
  '........................',
];

const TROIS_QUARTS_24 = [
  '........................',
  '........................',
  '..........####..........',
  '.........#++++#.........',
  '......####++++####......',
  '.....#++#++++#++++#.....',
  '.....#++#++++#++++#.....',
  '..####++#++++#++++#.....',
  '.#++++++#++++#++++#.....',
  '.#++++++++++++++++#.....',
  '.#+++++++++++++++++#....',
  '.#++++++++++++++++++#...',
  '.#+++++++++++++++++++#..',
  '..#++++++++++++++++++#..',
  '..#++++++++++++++++++#..',
  '...#+++++++++++++++++#..',
  '....#++++++++++++++++#..',
  '.....#+++++++++++++++#..',
  '......#+++++++++++++#...',
  '.......#############....',
  '........................',
  '........................',
  '........................',
  '........................',
];

// --- 48 pixels : une unité logique par pixel, plus de grille du tout -------
//
// À cette finesse on ne dessine plus des pixels mais des formes : doigts
// arrondis, ombre sous la paume, entailles des jointures. C'est joli, et c'est
// un autre jeu — le monde, lui, reste à 16.

function main48() {
  const c = document.createElement('canvas');
  c.width = 48;
  c.height = 48;
  const g = c.getContext('2d');

  const plein = (x, y, l, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, l, h); };
  // Un doigt : le fond ardoise, le contour noir, et le bout arrondi.
  const doigt = (x, y, l, h) => {
    plein(x, y + 2, l, h - 2, PALETTE.noir);
    plein(x + 1, y + 1, l - 2, 2, PALETTE.noir);
    plein(x + 1, y + 3, l - 2, h - 4, PALETTE.ardoise);
    plein(x + 2, y + 2, l - 4, 2, PALETTE.ardoise);
  };

  doigt(13, 6, 6, 22);   // index
  doigt(20, 3, 6, 25);   // majeur
  doigt(27, 5, 6, 23);   // annulaire
  doigt(34, 10, 6, 18);  // auriculaire
  doigt(4, 16, 7, 16);   // pouce

  // La paume : un bloc arrondi, contour noir et remplissage ardoise.
  plein(9, 24, 32, 14, PALETTE.noir);
  plein(11, 22, 28, 4, PALETTE.noir);
  plein(11, 38, 28, 3, PALETTE.noir);
  plein(10, 25, 30, 13, PALETTE.ardoise);
  plein(12, 23, 26, 4, PALETTE.ardoise);
  plein(12, 38, 26, 2, PALETTE.ardoise);

  // Les entailles des jointures, et l'ombre sous la paume.
  for (let i = 0; i < 4; i++) plein(14 + i * 7, 26, 3, 1, PALETTE.noir);
  plein(13, 36, 24, 1, PALETTE.noir);
  return c;
}

// --- vignettes -------------------------------------------------------------

function vignette(titre, note, image) {
  return {
    titre,
    note,
    duree: 3,
    format: FORMAT,
    dessiner(ctx, t, largeur, hauteur) {
      const x = Math.round((largeur - BOUTON) / 2);
      const y = Math.round((hauteur - BOUTON) / 2);
      ctx.fillStyle = PALETTE.creme;
      ctx.fillRect(x, y, BOUTON, BOUTON);
      ctx.drawImage(image, x, y, BOUTON, BOUTON);
    },
  };
}

export const RESOLUTIONS = [
  vignette('16 pixels — aujourd’hui', 'la grille du jeu : ×3 dans le bouton', sprite(MAIN_16)),
  vignette('24 — main ouverte', 'contour noir, remplissage ardoise, quatre doigts et un pouce', sprite(OUVERTE_24)),
  vignette('24 — poing', 'les jointures se creusent, le pouce se replie', sprite(POING_24)),
  vignette('24 — gant à manchette', 'la manchette tient, les doigts se comptent', sprite(GANT_24)),
  vignette('24 — trois quarts', 'la main vue de biais : la paume s’ouvre vers nous', sprite(TROIS_QUARTS_24)),
  vignette('48 — dessinée en formes', 'doigts arrondis, ombre sous la paume : ce n’est plus du pixel art', main48()),
];
