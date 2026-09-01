// Disposition de départ. Table de données, aucune logique.
//
// Les chemins sont pré-tracés : le jeu bouge dès la première seconde, et
// l'enfant voit ce qu'un convoyeur fait avant d'avoir à en dessiner un.
// La chaîne complète est montée : téléporteur, trieur, assembleur, livraison.

export const DEPART = {
  machines: [
    // Stock de départ : l'usine tourne dès la première seconde, puis se tarit.
    // C'est en tombant en panne que l'enfant découvre qu'il faut aller ramasser.
    { type: 'teleporteur', cx: 3, cy: 0, stock: { boulon: 8, plaque: 8 } },
    { type: 'trieur', cx: 3, cy: 3 },
    { type: 'assembleur', cx: 3, cy: 6 },
    { type: 'consommateur', cx: 3, cy: 9 },
  ],
  convoyeurs: [
    { source: 0, cible: 1, chemin: [{ cx: 3, cy: 1 }, { cx: 3, cy: 2 }] },
    {
      source: 1,
      cible: 2,
      chemin: [
        { cx: 2, cy: 3 }, { cx: 1, cy: 3 }, { cx: 1, cy: 4 }, { cx: 1, cy: 5 },
        { cx: 1, cy: 6 }, { cx: 2, cy: 6 },
      ],
    },
    {
      source: 1,
      cible: 2,
      chemin: [
        { cx: 4, cy: 3 }, { cx: 5, cy: 3 }, { cx: 5, cy: 4 }, { cx: 5, cy: 5 },
        { cx: 5, cy: 6 }, { cx: 4, cy: 6 },
      ],
    },
    { source: 2, cible: 3, chemin: [{ cx: 3, cy: 7 }, { cx: 3, cy: 8 }] },
  ],
};
