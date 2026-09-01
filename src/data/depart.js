// Disposition de départ. Table de données, aucune logique.
//
// Un téléporteur par carte. Celui de la sucrerie ne sort qu'une matière et va
// droit à la confiserie ; celui du verger en sort deux mélangées, et passe donc
// par un trieur. C'est ce qui apprend à quoi sert un trieur.

export const DEPART = {
  machines: [
    { type: 'teleporteur', cx: 0, cy: 0, carte: 0, stock: { sucre: 8 } },
    { type: 'teleporteur', cx: 6, cy: 0, carte: 1, stock: { fraise: 6, menthe: 6 } },
    { type: 'trieur', cx: 5, cy: 2 },
    { type: 'confiserie', cx: 3, cy: 6 },
    { type: 'livraison', cx: 3, cy: 9 },
  ],
  convoyeurs: [
    {
      source: 0,
      cible: 3,
      chemin: [
        { cx: 0, cy: 1 }, { cx: 0, cy: 2 }, { cx: 0, cy: 3 }, { cx: 0, cy: 4 },
        { cx: 0, cy: 5 }, { cx: 0, cy: 6 }, { cx: 1, cy: 6 }, { cx: 2, cy: 6 },
      ],
    },
    { source: 1, cible: 2, chemin: [{ cx: 6, cy: 1 }, { cx: 6, cy: 2 }] },
    {
      source: 2,
      cible: 3,
      chemin: [
        { cx: 5, cy: 3 }, { cx: 5, cy: 4 }, { cx: 5, cy: 5 }, { cx: 5, cy: 6 },
        { cx: 4, cy: 6 },
      ],
    },
    {
      source: 2,
      cible: 3,
      chemin: [
        { cx: 4, cy: 2 }, { cx: 3, cy: 2 }, { cx: 3, cy: 3 }, { cx: 3, cy: 4 },
        { cx: 3, cy: 5 },
      ],
    },
    { source: 3, cible: 4, chemin: [{ cx: 3, cy: 7 }, { cx: 3, cy: 8 }] },
  ],
};
