// Disposition de départ. Table de données, aucune logique.
//
// Les chemins sont pré-tracés : le jeu bouge dès la première seconde, et
// l'enfant voit ce qu'un convoyeur fait avant d'avoir à en dessiner un.
// La chaîne complète est montée : deux mines, un assembleur, une livraison.

export const DEPART = {
  machines: [
    { type: 'mineBoulons', cx: 0, cy: 0 },
    { type: 'minePlaques', cx: 6, cy: 0 },
    { type: 'assembleur', cx: 3, cy: 5 },
    { type: 'consommateur', cx: 3, cy: 9 },
  ],
  convoyeurs: [
    {
      source: 0,
      cible: 2,
      chemin: [
        { cx: 0, cy: 1 }, { cx: 0, cy: 2 }, { cx: 0, cy: 3 }, { cx: 0, cy: 4 },
        { cx: 0, cy: 5 }, { cx: 1, cy: 5 }, { cx: 2, cy: 5 },
      ],
    },
    {
      source: 1,
      cible: 2,
      chemin: [
        { cx: 6, cy: 1 }, { cx: 6, cy: 2 }, { cx: 6, cy: 3 }, { cx: 6, cy: 4 },
        { cx: 6, cy: 5 }, { cx: 5, cy: 5 }, { cx: 4, cy: 5 },
      ],
    },
    {
      source: 2,
      cible: 3,
      chemin: [
        { cx: 3, cy: 6 }, { cx: 3, cy: 7 }, { cx: 3, cy: 8 },
      ],
    },
  ],
};
