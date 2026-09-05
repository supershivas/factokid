// Table des recettes. Aucune logique ici.
// Une recette : ce qu'il faut en entrée, ce qui sort, en combien de ticks.
// Une nouvelle fabrication est une entrée de plus, jamais du code en plus.
//
// Toutes les cadences ont été divisées par deux : une usine doit grouiller,
// et à l'ancienne allure on regardait un tapis presque vide. Les rapports
// entre recettes n'ont pas bougé — c'est la chaîne entière qui va deux fois
// plus vite, pas une machine qui prend le pas sur une autre.

export const RECETTES = {
  // Le papier ne sort plus du sol : il vient des arbres, débités par la
  // scierie. C'est une matière de plus dans la chaîne, pas un système de plus.
  papier: {
    id: 'papier',
    entrees: { bois: 1 },
    sortie: 'papier',
    ticksParItem: 20, // 0,33 s
  },
  caramel: {
    id: 'caramel',
    entrees: { sucre: 1 },
    sortie: 'caramel',
    ticksParItem: 22, // 0,37 s
  },
  pastille: {
    id: 'pastille',
    entrees: { caramel: 1, fraise: 1, menthe: 1 },
    sortie: 'pastille',
    ticksParItem: 30, // 0,5 s
  },
  bonbon: {
    id: 'bonbon',
    entrees: { pastille: 1, papier: 1 },
    sortie: 'bonbon',
    ticksParItem: 22, // 0,37 s
  },
};
