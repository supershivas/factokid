// Table des cartes. Aucune logique ici.
// Une carte = une matière brute, et les positions de ses gisements sur la même
// grille que l'usine. Ajouter une matière au jeu, c'est ajouter une carte.

export const CARTES = [
  {
    id: 'carriere',
    item: 'boulon',
    repousseTicks: 180, // 3 s à 60 Hz
    gisements: [
      { cx: 1, cy: 2 }, { cx: 4, cy: 1 }, { cx: 2, cy: 4 }, { cx: 5, cy: 3 },
      { cx: 0, cy: 6 }, { cx: 3, cy: 7 }, { cx: 6, cy: 6 }, { cx: 1, cy: 8 },
      { cx: 4, cy: 9 },
    ],
  },
  {
    id: 'foret',
    item: 'plaque',
    repousseTicks: 180,
    gisements: [
      { cx: 2, cy: 1 }, { cx: 5, cy: 2 }, { cx: 0, cy: 3 }, { cx: 3, cy: 4 },
      { cx: 6, cy: 4 }, { cx: 1, cy: 6 }, { cx: 4, cy: 7 }, { cx: 2, cy: 9 },
      { cx: 6, cy: 8 },
    ],
  },
];
