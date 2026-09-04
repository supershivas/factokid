// Les matières, en pixels d'art. Table pure : aucun canvas, aucun DOM — c'est
// ce qui permet à outils/lisibilite.mjs de la relire hors du navigateur pour
// vérifier que deux matières ne se ressemblent pas.

import { PALETTE } from '../design.js';

// Chaque item est une matrice de 9 × 9 pixels d'art : « n » le contour noir,
// « c » la couleur de la matière, « b » l'éclat crème, « . » le vide. La
// silhouette *colorée* est la forme elle-même — un rond est rond en couleur,
// pas seulement en contour. C'est ce qui manquait : sur un sol sombre, le
// contour noir disparaît, et la matière n'était plus lue que par sa couleur,
// qui dessinait une croix là où on attendait une bille.
export const MOTIFS = {
  // Le sucre : un petit cube, plus petit que les autres matières — c'est un
  // morceau, pas une plaque. Une face d'ombre en ardoise avait été essayée :
  // elle disparaît sur la bande du tapis, qui est de la même couleur.
  cube: [
    '.........',
    '.nnnnnnn.',
    '.ncccccn.',
    '.ncccccn.',
    '.ncccccn.',
    '.ncccccn.',
    '.ncccccn.',
    '.nnnnnnn.',
    '.........',
  ],
  // La bille : un disque tracé au compas, éclat en haut à gauche. La pastille
  // s'en sert aussi — c'est la même chose, en orange.
  rond: [
    '..nnnnn..',
    '.nncccnn.',
    'nncccccnn',
    'ncbcccccn',
    'ncccccccn',
    'ncccccccn',
    'nncccccnn',
    '.nncccnn.',
    '..nnnnn..',
  ],
  // La fraise : épaules larges, pointe en bas, couronne verte et graines
  // claires. C'est la silhouette qu'un enfant dessine quand on lui dit
  // « fraise ». La couronne est cernée comme le reste — trois pointes posées
  // à même le sol auraient flotté sur un fond sombre.
  fraise: [
    '..nnnnn..',
    '.nvvvvvn.',
    'ncccccccn',
    'ncbcccbcn',
    'ncccccccn',
    '.ncbcbcn.',
    '.ncccccn.',
    '..ncccn..',
    '...nnn...',
  ],
  // La menthe : une feuille et sa nervure, pointue aux deux bouts. Une plante,
  // plus un triangle — on ne confond pas une feuille avec un bonbon.
  menthe: [
    '...nnn...',
    '..ncccn..',
    '.nccbccn.',
    'ncccbcccn',
    'ncccbcccn',
    'ncccbcccn',
    '.nccbccn.',
    '..ncbcn..',
    '...nnn...',
  ],
  // Le caramel : une barre plate, silhouette qu'aucune autre matière n'a.
  barre: [
    '.........',
    '.........',
    'nnnnnnnnn',
    'ncbcccccn',
    'ncccccccn',
    'ncccccccn',
    'nnnnnnnnn',
    '.........',
    '.........',
  ],
  // Le bois : un rondin debout, ses deux tranches claires. Couché, il avait la
  // silhouette du bonbon à un pixel près — en niveaux de gris on ne les
  // distinguait plus. Debout, il est le seul item plus haut que large.
  buche: [
    '..nnnnn..',
    '..nbbbn..',
    '..nbbbn..',
    '..ncccn..',
    '..ncccn..',
    '..ncccn..',
    '..nbbbn..',
    '..nbbbn..',
    '..nnnnn..',
  ],
  // Le papier : une feuille dont le coin est corné. Même en gris, on ne la
  // confond pas avec le sucre.
  papier: [
    'nnnnnnn..',
    'ncccccnn.',
    'ncbcccccn',
    'ncccccccn',
    'ncccccccn',
    'ncccccccn',
    'ncccccccn',
    'ncccccccn',
    'nnnnnnnnn',
  ],
  // Le bonbon : un cœur et ses deux papillotes, pincées aux quatre coins. Les
  // pinces sont des encoches dans la couleur, pas des traits posés dessus :
  // c'est ce qui les garde visibles sur un sol sombre.
  bonbon: [
    '.........',
    '.nnnnnnn.',
    'ncncccncn',
    'ncccccccn',
    'ncccccccn',
    'ncccccccn',
    'ncncccncn',
    '.nnnnnnn.',
    '.........',
  ],
};

// Un motif devient un peintre : la couleur de la matière est le seul réglage.
function peindreMotif(motif) {
  return (rect, couleur) => {
    for (let y = 0; y < motif.length; y++) {
      for (let x = 0; x < motif[y].length; x++) {
        const signe = motif[y][x];
        if (signe === 'n') rect(x, y, 1, 1, PALETTE.noir);
        else if (signe === 'c') rect(x, y, 1, 1, couleur);
        else if (signe === 'b') rect(x, y, 1, 1, PALETTE.creme);
        // Un signe de plus, pour ce qu'une matière porte en propre : le
        // calice vert d'une fraise.
        else if (signe === 'v') rect(x, y, 1, 1, PALETTE.vert);
      }
    }
  };
}

export const FORMES = {};
for (const nom of Object.keys(MOTIFS)) FORMES[nom] = peindreMotif(MOTIFS[nom]);
