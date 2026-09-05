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
  regard: { cx: 21, cy: 30 },

  extracteurs: [
    { cx: 13, cy: 27 },   // sucre
    { cx: 19, cy: 23 },    // fraise
    { cx: 25, cy: 29 },  // menthe
    { cx: 23, cy: 35 },  // bois
  ],

  machines: [
    { type: 'chaufferie', cx: 17, cy: 27 },
    { type: 'confiserie', cx: 19, cy: 29 },
    { type: 'plieuse', cx: 21, cy: 31 },
    { type: 'livraison', cx: 21, cy: 33 },
    // La scierie s'intercale entre l'arbre et la plieuse : le papier ne se
    // ramasse plus, il se débite.
    { type: 'scierie', cx: 22, cy: 32 },
  ],

  // `source` et `cible` : soit un index de machine, soit une cellule
  // d'extracteur, désignée par ses coordonnées.
  convoyeurs: [
    {
      extracteur: { cx: 13, cy: 27 },
      cible: 0,
      chemin: [{ cx: 14, cy: 27 }, { cx: 15, cy: 27 }, { cx: 16, cy: 27 }],
    },
    {
      source: 0,
      cible: 1,
      chemin: [{ cx: 17, cy: 28 }, { cx: 17, cy: 29 }, { cx: 18, cy: 29 }],
    },
    {
      extracteur: { cx: 19, cy: 23 },
      cible: 1,
      chemin: [
        { cx: 19, cy: 24 }, { cx: 19, cy: 25 }, { cx: 19, cy: 26 },
        { cx: 19, cy: 27 }, { cx: 19, cy: 28 },
      ],
    },
    {
      extracteur: { cx: 25, cy: 29 },
      cible: 1,
      chemin: [
        { cx: 24, cy: 29 }, { cx: 23, cy: 29 }, { cx: 22, cy: 29 },
        { cx: 21, cy: 29 }, { cx: 20, cy: 29 },
      ],
    },
    {
      source: 1,
      cible: 2,
      chemin: [{ cx: 19, cy: 30 }, { cx: 20, cy: 30 }, { cx: 20, cy: 31 }],
    },
    {
      extracteur: { cx: 23, cy: 35 },
      cible: 4,
      chemin: [{ cx: 23, cy: 34 }, { cx: 23, cy: 33 }, { cx: 23, cy: 32 }],
    },
    { source: 4, cible: 2, chemin: [{ cx: 22, cy: 31 }] },
    { source: 2, cible: 3, chemin: [{ cx: 21, cy: 32 }] },
  ],
};

// La carte nue : rien de construit, seule la livraison attend ses bonbons.
// C'est le départ du bac à sable et celui de la première partie ; le regard
// s'ouvre plus à l'ouest, du côté du premier gisement de sucre.
export const DEPART_NU = {
  regard: { cx: 16, cy: 28 },
  extracteurs: [],
  machines: [
    { type: 'livraison', cx: 21, cy: 33 },
  ],
  convoyeurs: [],
};
