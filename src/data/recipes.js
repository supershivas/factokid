// Table des recettes. Aucune logique ici.
// Une recette : ce qu'il faut en entrée, ce qui sort, en combien de ticks.
// Une nouvelle fabrication est une entrée de plus, jamais du code en plus.

export const RECETTES = {
  // Le papier ne sort plus du sol : il vient des arbres, débités par la
  // scierie. C'est une matière de plus dans la chaîne, pas un système de plus.
  papier: {
    id: 'papier',
    entrees: { bois: 1 },
    sortie: 'papier',
    ticksParItem: 40,
  },
  caramel: {
    id: 'caramel',
    entrees: { sucre: 1 },
    sortie: 'caramel',
    ticksParItem: 45,
  },
  pastille: {
    id: 'pastille',
    entrees: { caramel: 1, fraise: 1, menthe: 1 },
    sortie: 'pastille',
    ticksParItem: 60,
  },
  bonbon: {
    id: 'bonbon',
    entrees: { pastille: 1, papier: 1 },
    sortie: 'bonbon',
    ticksParItem: 45,
  },
};
