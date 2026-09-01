// Disposition de départ. Table de données, aucune logique.
//
// La chaîne complète en un écran : la sucrerie envoie sucre et papier
// mélangés, le trieur les sépare — le sucre part fondre à la chaufferie, le
// papier descend jusqu'à la plieuse. Le verger envoie fraise et menthe
// mélangées, que la confiserie prend telles quelles. Caramel, fraise et
// menthe font la pastille ; la pastille et le papier font le bonbon.

export const DEPART = {
  machines: [
    { type: 'teleporteur', cx: 0, cy: 0, carte: 0, stock: { sucre: 5, papier: 5 } },
    { type: 'teleporteur', cx: 6, cy: 0, carte: 1, stock: { fraise: 6, menthe: 6 } },
    { type: 'trieur', cx: 0, cy: 2 },
    { type: 'chaufferie', cx: 2, cy: 2 },
    { type: 'confiserie', cx: 4, cy: 5 },
    { type: 'plieuse', cx: 1, cy: 8 },
    { type: 'livraison', cx: 3, cy: 9 },
  ],
  convoyeurs: [
    { source: 0, cible: 2, chemin: [{ cx: 0, cy: 1 }] },
    // Première branche du trieur : la matière choisie, ici le sucre.
    { source: 2, cible: 3, chemin: [{ cx: 1, cy: 2 }] },
    // Seconde branche : tout le reste, ici le papier.
    {
      source: 2,
      cible: 5,
      chemin: [
        { cx: 0, cy: 3 }, { cx: 0, cy: 4 }, { cx: 0, cy: 5 }, { cx: 0, cy: 6 },
        { cx: 0, cy: 7 }, { cx: 0, cy: 8 },
      ],
    },
    {
      source: 3,
      cible: 4,
      chemin: [
        { cx: 2, cy: 3 }, { cx: 2, cy: 4 }, { cx: 2, cy: 5 }, { cx: 3, cy: 5 },
      ],
    },
    {
      source: 1,
      cible: 4,
      chemin: [
        { cx: 6, cy: 1 }, { cx: 6, cy: 2 }, { cx: 6, cy: 3 }, { cx: 6, cy: 4 },
        { cx: 5, cy: 4 }, { cx: 4, cy: 4 },
      ],
    },
    {
      source: 4,
      cible: 5,
      chemin: [
        { cx: 4, cy: 6 }, { cx: 4, cy: 7 }, { cx: 3, cy: 7 }, { cx: 2, cy: 7 },
        { cx: 2, cy: 8 },
      ],
    },
    { source: 5, cible: 6, chemin: [{ cx: 1, cy: 9 }, { cx: 2, cy: 9 }] },
  ],
};
