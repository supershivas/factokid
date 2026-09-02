// Dix mains pour l'outil qui déplace le monde.
//
// La contrainte est rude : seize pixels de côté, un seul ton d'encre — du noir
// sur la plaque claire de la barre d'outils. À cette taille, ce qui se lit
// n'est pas le dessin mais la silhouette : les doigts ne se voient que par les
// vides qui les séparent.
//
// Chaque proposition est écrite en clair, un caractère par pixel : « # » pour
// l'encre, « . » pour rien. On juge donc la forme dans le code autant qu'à
// l'écran.

import { PALETTE,  BOUTON } from '../src/design.js';

// Dessinées sur la grille de seize, elles la gardent : ces pages disent ce
// qu'on a comparé ce jour-là, pas ce que le jeu fait aujourd'hui.
const TUILE_PX = 16;

export const FORMAT = { largeur: 64, hauteur: 64, echelle: 2 };

// Le contour d'une silhouette : les pixels d'encre qui touchent du vide. Sert
// à proposer la même main en creux, sans la redessiner.
function contour(lignes) {
  const plein = (x, y) => (lignes[y] && lignes[y][x] === '#');
  return lignes.map((ligne, y) => ligne.split('').map((c, x) => {
    if (c !== '#') return '.';
    const entoure = plein(x - 1, y) && plein(x + 1, y) && plein(x, y - 1) && plein(x, y + 1);
    return entoure ? '.' : '#';
  }).join(''));
}

function sprite(lignes) {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  g.fillStyle = PALETTE.noir;
  for (let y = 0; y < lignes.length; y++) {
    for (let x = 0; x < lignes[y].length; x++) {
      if (lignes[y][x] === '#') g.fillRect(x, y, 1, 1);
    }
  }
  return c;
}

const MAINS = [
  {
    titre: '1. Main ouverte',
    note: 'quatre doigts séparés par des vides, pouce à gauche',
    pixels: [
      '................',
      '......#.#.#.....',
      '......#.#.#.....',
      '...#..#.#.#.....',
      '..#.#.#.#.#.....',
      '..#.#######.....',
      '..#########.....',
      '..#########.....',
      '..#########.....',
      '...########.....',
      '...#######......',
      '....######......',
      '.....####.......',
      '................',
      '................',
      '................',
    ],
  },
  {
    titre: '2. Poing',
    note: 'la main fermée : les jointures bossellent le haut, le pouce sort à gauche',
    pixels: [
      '................',
      '................',
      '....##.##.##....',
      '...###########..',
      '..############..',
      '..############..',
      '.#############..',
      '###############.',
      '###############.',
      '.#############..',
      '..############..',
      '..############..',
      '...##########...',
      '....########....',
      '................',
      '................',
    ],
  },
  {
    titre: '3. Main de dessin animé',
    note: 'gant à manchette : la silhouette la plus franche des dix',
    pixels: [
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
    ],
  },
  {
    titre: '4. Index pointé',
    note: 'le doigt tendu est le premier, pas celui du milieu',
    pixels: [
      '................',
      '...##...........',
      '...##...........',
      '...##...........',
      '...##...........',
      '...##.###.......',
      '...##.#.#.##....',
      '...#######.##...',
      '...##########...',
      '...##########...',
      '...##########...',
      '....#########...',
      '....########....',
      '.....######.....',
      '................',
      '................',
    ],
  },
  {
    titre: '5. Mitaine',
    note: 'doigts serrés, pouce écarté : une seule masse, un seul vide',
    pixels: [
      '................',
      '................',
      '......#####.....',
      '.....#######....',
      '..#..#######....',
      '.#.#.#######....',
      '.#.#########....',
      '.###########....',
      '.###########....',
      '..##########....',
      '..##########....',
      '...#########....',
      '....########....',
      '.....######.....',
      '................',
      '................',
    ],
  },
  {
    titre: '6. Quatre flèches seules',
    note: 'pas de main du tout : le signe universel du déplacement',
    pixels: [
      '.......##.......',
      '......####......',
      '.....##.###.....',
      '.......##.......',
      '.......##.......',
      '..#....##....#..',
      '.##....##....##.',
      '###############.',
      '###############.',
      '.##....##....##.',
      '..#....##....#..',
      '.......##.......',
      '.......##.......',
      '.....###.##.....',
      '......####......',
      '.......##.......',
    ],
  },
  {
    titre: '7. Doigts écartés',
    note: 'cinq doigts ouverts en étoile : la silhouette la plus large',
    pixels: [
      '................',
      '.......##.......',
      '....##.##.##....',
      '....##.##.##....',
      '.##.##.##.##.##.',
      '.##.##.##.##.##.',
      '.##############.',
      '.##############.',
      '.##############.',
      '..############..',
      '..############..',
      '...##########...',
      '....########....',
      '.....######.....',
      '................',
      '................',
    ],
  },
  {
    titre: '8. Main à trois doigts',
    note: 'un doigt de moins, donc un vide de plus : plus lisible de loin',
    pixels: [
      '................',
      '.....#..#..#....',
      '.....#..#..#....',
      '..#..#..#..#....',
      '.#.#.#..#..#....',
      '.#.#.#..#..#....',
      '.#.#.########...',
      '.#.##########...',
      '.############...',
      '..###########...',
      '..###########...',
      '...##########...',
      '....########....',
      '.....######.....',
      '................',
      '................',
    ],
  },
  {
    titre: '9. Main qui tire',
    note: 'la même main, et trois traits derrière elle : le monde suit',
    pixels: [
      '................',
      '........#..#..#.',
      '........#..#..#.',
      '.....#..#..#..#.',
      '....#.#.#..#..#.',
      '##..#.#.#..#..#.',
      '....#.#########.',
      '##..###########.',
      '....###########.',
      '##...##########.',
      '.....##########.',
      '......#########.',
      '.......#######..',
      '........#####...',
      '................',
      '................',
    ],
  },
  {
    titre: '10. Main en contour',
    note: 'la même silhouette, creuse : sur une plaque claire, un liseré peut suffire',
    contourDe: 7,
  },
];

// Chaque main est posée sur la plaque de la barre d'outils, à sa taille réelle
// dans le jeu : c'est là qu'elle doit se lire, pas dans un cadre de labo.
export const VIGNETTES = MAINS.map((m) => {
  const pixels = m.contourDe === undefined ? m.pixels : contour(MAINS[m.contourDe].pixels);
  const image = sprite(pixels);
  return {
    titre: m.titre,
    note: m.note,
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
});
