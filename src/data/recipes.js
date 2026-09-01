// Table des recettes. Aucune logique ici.
// Une recette : ce qu'il faut en entrée, ce qui sort, en combien de ticks.
// Une nouvelle fabrication est une entrée de plus, jamais du code en plus.

export const RECETTES = {
  bonbon: {
    id: 'bonbon',
    entrees: { sucre: 1, fraise: 1, menthe: 1 },
    sortie: 'bonbon',
    ticksParItem: 60,
  },
};
