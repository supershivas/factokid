// Disposition de départ. Table de données, aucune logique.
//
// Une petite chaîne complète, posée au cœur du monde : quatre extracteurs sur
// les quatre gisements les plus proches, et de quoi faire un bonbon. Tout le
// reste du monde est à conquérir, un tapis à la fois.

export const DEPART = {
  // La fenêtre s'ouvre ici : la livraison est au milieu de l'écran.
  regard: { cx: 10, cy: 15 },

  extracteurs: [
    { cx: 4, cy: 12 },   // sucre
    { cx: 8, cy: 11 },   // fraise
    { cx: 11, cy: 14 },  // menthe
    { cx: 12, cy: 16 },  // papier
  ],

  machines: [
    { type: 'chaufferie', cx: 6, cy: 12 },
    { type: 'confiserie', cx: 8, cy: 14 },
    { type: 'plieuse', cx: 10, cy: 16 },
    { type: 'livraison', cx: 10, cy: 18 },
  ],

  // `source` et `cible` : soit un index de machine, soit une cellule
  // d'extracteur, désignée par ses coordonnées.
  convoyeurs: [
    { extracteur: { cx: 4, cy: 12 }, cible: 0, chemin: [{ cx: 5, cy: 12 }] },
    {
      source: 0,
      cible: 1,
      chemin: [{ cx: 6, cy: 13 }, { cx: 6, cy: 14 }, { cx: 7, cy: 14 }],
    },
    {
      extracteur: { cx: 8, cy: 11 },
      cible: 1,
      chemin: [{ cx: 8, cy: 12 }, { cx: 8, cy: 13 }],
    },
    {
      extracteur: { cx: 11, cy: 14 },
      cible: 1,
      chemin: [{ cx: 10, cy: 14 }, { cx: 9, cy: 14 }],
    },
    {
      source: 1,
      cible: 2,
      chemin: [{ cx: 8, cy: 15 }, { cx: 9, cy: 15 }, { cx: 9, cy: 16 }],
    },
    { extracteur: { cx: 12, cy: 16 }, cible: 2, chemin: [{ cx: 11, cy: 16 }] },
    { source: 2, cible: 3, chemin: [{ cx: 10, cy: 17 }] },
  ],
};
