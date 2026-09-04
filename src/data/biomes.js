// Table des biomes : de quoi le sol est fait, et où chacun règne. Aucune
// logique ici.
//
// Un biome n'est pas une texture de plus : c'est la couleur du sol, posée sur
// le noir à une transparence très basse. Trois nuances par biome, et le
// passage de l'un à l'autre n'est qu'un mélange des deux teintes — il n'existe
// aucune tuile de raccord.
//
// `couleur` nomme une entrée de la palette, `motif` la texture minimale qui
// s'y pose : un point d'un pixel, ou un trait d'un pixel d'épaisseur.

export const BIOMES = {
  sucre: { id: 'sucre', nom: 'plaines de sucre', couleur: 'creme', motif: 'point' },
  terre: { id: 'terre', nom: 'terre', couleur: 'orange', motif: 'couche' },
  fraise: { id: 'fraise', nom: 'champs de fraises', couleur: 'rouge', motif: 'rang' },
  menthe: { id: 'menthe', nom: 'champs de menthe', couleur: 'vert', motif: 'debout' },
};

// Ce que chaque biome donne : c'est là que ses gisements sont abondants.
export const MATIERE_DE = {
  sucre: 'sucre', terre: 'bois', fraise: 'fraise', menthe: 'menthe',
};

// Les trois nuances, en transparence sur le noir. Elles restent basses : le sol
// ne doit jamais monter au niveau des items, qui sont saturés.
export const NUANCES = [0.08, 0.11, 0.14];

// Largeur du fondu entre deux biomes, en cellules. « Fondu court » : on sent le
// changement sans le heurter.
export const FONDU = 2;

// Chaque région tire le sol à elle : une cellule appartient à la région la plus
// proche, et se teinte des deux plus proches quand elles se disputent.
// Ajouter une région, c'est ajouter une entrée ici — rien d'autre.
export const REGIONS = [
  { cx: 10, cy: 15, biome: 'terre' },   // la clairière où l'usine commence
  { cx: 3, cy: 6, biome: 'sucre' },
  { cx: 10, cy: 5, biome: 'fraise' },
  { cx: 17, cy: 7, biome: 'fraise' },
  { cx: 19, cy: 15, biome: 'menthe' },
  { cx: 17, cy: 24, biome: 'terre' },
  { cx: 10, cy: 26, biome: 'menthe' },
  { cx: 3, cy: 24, biome: 'sucre' },
  { cx: 1, cy: 15, biome: 'sucre' },
];
