// Table des recettes. Aucune logique ici.
// Une recette : ce qu'il faut en entrée, ce qui sort, en combien de ticks.
// Une nouvelle fabrication est une entrée de plus, jamais du code en plus.

export const RECETTES = {
  moteur: {
    id: 'moteur',
    entrees: { boulon: 1, plaque: 1 },
    sortie: 'moteur',
    ticksParItem: 60,
  },
};
