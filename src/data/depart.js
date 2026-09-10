// Dispositions de départ. Table de données, aucune logique.
//
// Il y en a deux, et un scénario choisit la sienne (voir scenarios.js) :
// l'usine qui tourne déjà, et la carte nue.
//
// Tout se passe au **pied du monde**, à l'étage 1 : le monde du sucre. On ne
// commence plus au centre de la carte mais en bas, et on ne progresse que vers
// le haut. Il n'y a donc qu'une matière ici — sucre, chaufferie, réception est
// déjà une usine qui rapporte, et c'est tout ce qu'il faut pour comprendre le
// jeu.
//
// **Il n'y a plus de livraison à poser.** On vend au mur, et le mur est déjà
// là : `cible: 'recepteur'` désigne sa réception, la seule adresse du jeu.

// L'usine de référence : ce que le tutoriel bâtit, case par case, et ce que
// les outils jouent pour éprouver le mur, la sauvegarde et les tapis. Elle
// n'est plus un essai du menu — la bêta n'en propose que deux — mais elle
// reste la mesure du jeu : tout chiffre de l'économie sort d'elle.
//
// Trois branches identiques qui montent au mur : c'est la même chose faite
// trois fois, et c'est exactement ce que le jeu demandera de faire en plus
// grand à chaque mur ouvert. Rien n'est à comprendre de neuf entre la première
// et la troisième — seulement à en vouloir davantage.
export const DEPART = {
  // La fenêtre s'ouvre au milieu de la chaîne : les gisements sont en bas de
  // l'écran, le mur et sa réception en haut.
  regard: { cx: 21, cy: 53 },

  // La caisse de départ. L'usine qui tourne n'en a pas besoin : elle produit
  // déjà, et sa première vente arrive avant qu'on ait eu le temps de vouloir
  // bâtir.
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
  ],

  // `source` : soit un index de machine, soit une cellule d'extracteur.
  // `cible` : un index de machine, ou `'recepteur'` — la réception du mur.
  convoyeurs: [
    {
      extracteur: { cx: 15, cy: 54 },
      cible: 0,
      chemin: [{ cx: 16, cy: 54 }, { cx: 17, cy: 54 }, { cx: 18, cy: 54 }],
    },
    {
      source: 0,
      cible: 'recepteur',
      chemin: [
        { cx: 19, cy: 53 }, { cx: 19, cy: 52 }, { cx: 19, cy: 51 },
        { cx: 19, cy: 50 }, { cx: 19, cy: 49 }, { cx: 20, cy: 49 },
      ],
    },
    {
      extracteur: { cx: 27, cy: 52 },
      cible: 1,
      chemin: [{ cx: 26, cy: 52 }],
    },
    {
      source: 1,
      cible: 'recepteur',
      chemin: [
        { cx: 25, cy: 51 }, { cx: 25, cy: 50 }, { cx: 25, cy: 49 },
        { cx: 24, cy: 49 }, { cx: 23, cy: 49 }, { cx: 22, cy: 49 },
      ],
    },
    {
      extracteur: { cx: 21, cy: 58 },
      cible: 2,
      chemin: [{ cx: 21, cy: 57 }],
    },
    {
      source: 2,
      cible: 'recepteur',
      chemin: [
        { cx: 21, cy: 55 }, { cx: 21, cy: 54 }, { cx: 21, cy: 53 },
        { cx: 21, cy: 52 }, { cx: 21, cy: 51 }, { cx: 21, cy: 50 },
        { cx: 21, cy: 49 },
      ],
    },
  ],
};

// La carte nue : rien de construit. La réception du mur est la seule chose
// posée, et c'est le mur qui l'apporte — pas cette table.
export const DEPART_NU = {
  regard: { cx: 21, cy: 53 },

  // La mise de départ : de quoi bâtir la première chaîne sans rien avoir
  // vendu. `outils/tutoriel.mjs` relit ce compte à chaque fois — une étape de
  // plus dans la table doit rester payable.
  //
  // La marge est volontairement large. On ne bloque jamais un enfant devant
  // une touche éteinte pendant qu'on lui montre quoi faire.
  caisse: 120,

  extracteurs: [],
  machines: [],
  convoyeurs: [],
};

// Le jeu ouvert : la même carte nue, mais tous les étages franchis et de quoi
// bâtir sans compter. C'est l'ancien jeu, celui d'avant les murs — on essaie
// une plieuse sans avoir à la mériter.
//
// La mise est large parce que la seule réception y est celle du mur du sommet,
// tout en haut du monde : on peut y vendre, mais on n'y va pas pour ça.
export const DEPART_LIBRE = {
  ...DEPART_NU,
  caisse: 500,
};
