// Dispositions de départ. Table de données, aucune logique.
//
// Il y en a deux, et un scénario choisit la sienne (voir scenarios.js) :
// l'usine qui tourne déjà, et la carte nue. La livraison est posée dans les
// deux : elle n'est pas constructible, elle ne peut donc pas manquer.

// Une petite chaîne complète, posée au cœur du monde : quatre extracteurs sur
// les quatre gisements les plus proches, et de quoi faire un bonbon. Tout le
// reste du monde est à conquérir, un tapis à la fois.
export const DEPART = {
  // La fenêtre s'ouvre ici : la livraison est au milieu de l'écran.
  regard: { cx: 10, cy: 15 },

  extracteurs: [
    { cx: 2, cy: 12 },   // sucre
    { cx: 8, cy: 8 },    // fraise
    { cx: 14, cy: 14 },  // menthe
    { cx: 12, cy: 20 },  // bois
  ],

  machines: [
    { type: 'chaufferie', cx: 6, cy: 12 },
    { type: 'confiserie', cx: 8, cy: 14 },
    { type: 'plieuse', cx: 10, cy: 16 },
    { type: 'livraison', cx: 10, cy: 18 },
    // La scierie s'intercale entre l'arbre et la plieuse : le papier ne se
    // ramasse plus, il se débite.
    { type: 'scierie', cx: 11, cy: 17 },
  ],

  // `source` et `cible` : soit un index de machine, soit une cellule
  // d'extracteur, désignée par ses coordonnées.
  convoyeurs: [
    {
      extracteur: { cx: 2, cy: 12 },
      cible: 0,
      chemin: [{ cx: 3, cy: 12 }, { cx: 4, cy: 12 }, { cx: 5, cy: 12 }],
    },
    {
      source: 0,
      cible: 1,
      chemin: [{ cx: 6, cy: 13 }, { cx: 6, cy: 14 }, { cx: 7, cy: 14 }],
    },
    {
      extracteur: { cx: 8, cy: 8 },
      cible: 1,
      chemin: [
        { cx: 8, cy: 9 }, { cx: 8, cy: 10 }, { cx: 8, cy: 11 },
        { cx: 8, cy: 12 }, { cx: 8, cy: 13 },
      ],
    },
    {
      extracteur: { cx: 14, cy: 14 },
      cible: 1,
      chemin: [
        { cx: 13, cy: 14 }, { cx: 12, cy: 14 }, { cx: 11, cy: 14 },
        { cx: 10, cy: 14 }, { cx: 9, cy: 14 },
      ],
    },
    {
      source: 1,
      cible: 2,
      chemin: [{ cx: 8, cy: 15 }, { cx: 9, cy: 15 }, { cx: 9, cy: 16 }],
    },
    {
      extracteur: { cx: 12, cy: 20 },
      cible: 4,
      chemin: [{ cx: 12, cy: 19 }, { cx: 12, cy: 18 }, { cx: 12, cy: 17 }],
    },
    { source: 4, cible: 2, chemin: [{ cx: 11, cy: 16 }] },
    { source: 2, cible: 3, chemin: [{ cx: 10, cy: 17 }] },
  ],
};

// La carte nue : rien de construit, seule la livraison attend ses bonbons.
// C'est le départ du bac à sable et celui de la première partie ; le regard
// s'ouvre plus à l'ouest, du côté du premier gisement de sucre.
export const DEPART_NU = {
  regard: { cx: 5, cy: 13 },
  extracteurs: [],
  machines: [
    { type: 'livraison', cx: 10, cy: 18 },
  ],
  convoyeurs: [],
};
