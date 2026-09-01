// Disposition de départ. Table de données, aucune logique.
//
// Un téléporteur par carte. La sucrerie n'envoie qu'une matière : elle va
// droit à la chaufferie, qui fond le sucre en caramel. Le verger en envoie
// deux mélangées, et doit donc passer par un trieur. La différence entre les
// deux chemins explique à quoi sert un trieur sans un mot.

export const DEPART = {
  machines: [
    { type: 'teleporteur', cx: 0, cy: 0, carte: 0, stock: { sucre: 8 } },
    { type: 'teleporteur', cx: 6, cy: 0, carte: 1, stock: { fraise: 6, menthe: 6 } },
    { type: 'chaufferie', cx: 0, cy: 4 },
    { type: 'trieur', cx: 6, cy: 3 },
    { type: 'confiserie', cx: 3, cy: 7 },
    { type: 'livraison', cx: 3, cy: 9 },
  ],
  convoyeurs: [
    { source: 0, cible: 2, chemin: [{ cx: 0, cy: 1 }, { cx: 0, cy: 2 }, { cx: 0, cy: 3 }] },
    {
      source: 2,
      cible: 4,
      chemin: [
        { cx: 0, cy: 5 }, { cx: 0, cy: 6 }, { cx: 0, cy: 7 }, { cx: 1, cy: 7 },
        { cx: 2, cy: 7 },
      ],
    },
    { source: 1, cible: 3, chemin: [{ cx: 6, cy: 1 }, { cx: 6, cy: 2 }] },
    {
      source: 3,
      cible: 4,
      chemin: [
        { cx: 6, cy: 4 }, { cx: 6, cy: 5 }, { cx: 6, cy: 6 }, { cx: 6, cy: 7 },
        { cx: 5, cy: 7 }, { cx: 4, cy: 7 },
      ],
    },
    {
      source: 3,
      cible: 4,
      chemin: [
        { cx: 5, cy: 3 }, { cx: 4, cy: 3 }, { cx: 4, cy: 4 }, { cx: 4, cy: 5 },
        { cx: 3, cy: 5 }, { cx: 3, cy: 6 },
      ],
    },
    { source: 4, cible: 5, chemin: [{ cx: 3, cy: 8 }] },
  ],
};
