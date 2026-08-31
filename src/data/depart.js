// Disposition de départ. Table de données, aucune logique.
//
// Le chemin est pré-tracé : le jeu bouge dès la première seconde, et l'enfant
// voit ce qu'un convoyeur fait avant d'avoir à en dessiner un.

export const DEPART = {
  machines: [
    { type: 'producteur', cx: 0, cy: 0 },
    { type: 'consommateur', cx: 6, cy: 9 },
  ],
  convoyeur: {
    source: 0,
    cible: 1,
    chemin: [
      { cx: 0, cy: 1 }, { cx: 0, cy: 2 }, { cx: 0, cy: 3 }, { cx: 0, cy: 4 },
      { cx: 0, cy: 5 }, { cx: 0, cy: 6 }, { cx: 0, cy: 7 }, { cx: 0, cy: 8 },
      { cx: 0, cy: 9 }, { cx: 1, cy: 9 }, { cx: 2, cy: 9 }, { cx: 3, cy: 9 },
      { cx: 4, cy: 9 }, { cx: 5, cy: 9 },
    ],
  },
};
