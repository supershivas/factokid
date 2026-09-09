// Dispositions de départ. Table de données, aucune logique.
//
// Il y en a deux, et un scénario choisit la sienne (voir scenarios.js) :
// l'usine qui tourne déjà, et la carte nue. La livraison est posée dans les
// deux : elle n'est pas constructible, elle ne peut donc pas manquer.
//
// Tout se passe au **pied du monde**, à l'étage 1 : le monde du sucre. On ne
// commence plus au centre de la carte mais en bas, et on ne progresse que vers
// le haut. Il n'y a donc qu'une matière ici — sucre, chaufferie, livraison est
// déjà une usine qui rapporte, et c'est tout ce qu'il faut pour comprendre le
// jeu.

// Trois branches identiques autour d'une seule livraison : c'est la même chose
// faite trois fois, et c'est exactement ce que le jeu demandera de faire en
// plus grand à chaque mur ouvert. Rien n'est à comprendre de neuf entre la
// première et la troisième — seulement à en vouloir davantage.
export const DEPART = {
  // La fenêtre s'ouvre ici : la livraison est au milieu de l'écran, et le mur
  // de l'étage se voit en haut.
  regard: { cx: 21, cy: 54 },

  // La caisse de départ. L'usine qui tourne n'en a pas besoin : elle produit
  // déjà, et sa première livraison arrive avant qu'on ait eu le temps de
  // vouloir bâtir.
  caisse: 0,

  extracteurs: [
    { cx: 15, cy: 54 },
    { cx: 27, cy: 52 },
    { cx: 21, cy: 58 },
  ],

  machines: [
    { type: 'chaufferie', cx: 19, cy: 54 },
    { type: 'chaufferie', cx: 25, cy: 52 },
    { type: 'chaufferie', cx: 21, cy: 56 },
    { type: 'livraison', cx: 21, cy: 54 },
  ],

  // `source` et `cible` : soit un index de machine, soit une cellule
  // d'extracteur, désignée par ses coordonnées.
  convoyeurs: [
    {
      extracteur: { cx: 15, cy: 54 },
      cible: 0,
      chemin: [{ cx: 16, cy: 54 }, { cx: 17, cy: 54 }, { cx: 18, cy: 54 }],
    },
    { source: 0, cible: 3, chemin: [{ cx: 20, cy: 54 }] },
    {
      extracteur: { cx: 27, cy: 52 },
      cible: 1,
      chemin: [{ cx: 26, cy: 52 }],
    },
    {
      source: 1,
      cible: 3,
      chemin: [
        { cx: 25, cy: 53 }, { cx: 24, cy: 53 }, { cx: 23, cy: 53 },
        { cx: 22, cy: 53 }, { cx: 22, cy: 54 },
      ],
    },
    {
      extracteur: { cx: 21, cy: 58 },
      cible: 2,
      chemin: [{ cx: 21, cy: 57 }],
    },
    { source: 2, cible: 3, chemin: [{ cx: 21, cy: 55 }] },
  ],
};

// La carte nue : rien de construit, seule la livraison attend son caramel.
// C'est le départ du bac à sable et celui de la première partie.
export const DEPART_NU = {
  regard: { cx: 21, cy: 54 },

  // La mise de départ : de quoi bâtir la première chaîne sans rien avoir
  // livré. Le tutoriel coûte 51 — trois extracteurs, trois chaufferies et une
  // douzaine de tuiles — et `outils/tutoriel.mjs` relit ce compte à chaque
  // fois : une étape de plus dans la table doit rester payable.
  //
  // La marge est volontairement large. On ne bloque jamais un enfant devant
  // une touche éteinte pendant qu'on lui montre quoi faire.
  caisse: 120,

  extracteurs: [],
  machines: [
    { type: 'livraison', cx: 21, cy: 54 },
  ],
  convoyeurs: [],
};
