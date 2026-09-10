// Table du tutoriel : les gestes du premier contact, dans l'ordre. Aucune
// logique ici — `epreuve` nomme ce qu'il faut avoir fait, et src/tutoriel.js
// sait le reconnaître.
//
// **On vend au mur.** Il n'y a plus de livraison à poser : la seule adresse du
// jeu est la réception creusée au milieu du mur, et le tutoriel y mène. La
// deuxième moitié de chaque branche est donc une remontée vers le mur — c'est
// exactement ce que le jeu demandera à chaque étage, et ça s'apprend ici.
//
// Il se joue au pied du monde, à l'étage 1 : le monde du sucre. Il n'a plus à
// enseigner les quatre matières d'un coup — ce sont les murs qui les
// présentent une par une —, et il a rétréci d'autant : dix-sept étapes sont
// devenues treize, et la chaîne de sept machines une chaîne de deux.
//
// Ce qu'il montre tient en une phrase : **une branche, puis la même deux fois
// de plus.** Extracteur, chaufferie, réception — c'est le noyau qui rapporte,
// et le reste du jeu n'est que ça, en plus grand. Rien n'est à comprendre de
// neuf entre la première branche et la troisième, seulement à en vouloir
// davantage : c'est exactement ce qu'un mur demandera.
//
// Il bâtit exactement la chaîne de l'essai « usine qui tourne », case par
// case — ce qu'on obtient à la fin est ce que cet essai donne tout fait. Qui
// n'en veut pas le passe d'un bouton.
//
// Quatre épreuves, et pas une de plus :
//
//   `extracteur` — un extracteur est posé sur le gisement de `cible` ;
//   `machine`    — une machine de ce type occupe la case `cible` ;
//   `lien`       — des tapis mènent de la machine `de` à la machine `a`,
//                  branches comprises ;
//   `livre`      — la réception a acheté sa première pièce.
//
// `cibles` : les cellules que le halo montre — pour un lien, les deux machines
// qu'on relie et tout ce qui passe entre elles. `icone` : ce qu'il y a à
// poser, avec le dessin exact de sa bulle dans le menu de construction.

export const TUTORIEL = [
  // --- la première branche : c'est déjà une usine qui rapporte -------------
  {
    id: 'extracteur-sucre',
    nom: 'pose un extracteur sur le sucre',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 15, cy: 54 }],
    epreuve: 'extracteur',
    cible: { cx: 15, cy: 54 },
  },
  {
    id: 'chaufferie',
    nom: 'la chaufferie fond le sucre',
    icone: 'bulleChaufferie',
    cibles: [{ cx: 19, cy: 54 }],
    epreuve: 'machine',
    machine: 'chaufferie',
    cible: { cx: 19, cy: 54 },
  },
  {
    id: 'tapis-sucre',
    nom: 'glisse le doigt de l’un à l’autre',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 15, cy: 54 }, { cx: 16, cy: 54 }, { cx: 17, cy: 54 },
      { cx: 18, cy: 54 }, { cx: 19, cy: 54 },
    ],
    epreuve: 'lien',
    de: { cx: 15, cy: 54 },
    a: { cx: 19, cy: 54 },
  },
  {
    id: 'tapis-caramel',
    nom: 'monte le caramel jusqu’au mur',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 19, cy: 54 }, { cx: 19, cy: 53 }, { cx: 19, cy: 52 },
      { cx: 19, cy: 51 }, { cx: 19, cy: 50 }, { cx: 19, cy: 49 },
      { cx: 20, cy: 49 }, { cx: 20, cy: 48 },
    ],
    epreuve: 'lien',
    de: { cx: 19, cy: 54 },
    a: { cx: 20, cy: 48 },
  },
  {
    id: 'premier-caramel',
    nom: 'la réception t’achète ton caramel !',
    icone: 'caramel',
    cibles: [{ cx: 20, cy: 48 }, { cx: 21, cy: 48 }, { cx: 22, cy: 48 }],
    epreuve: 'livre',
  },

  // --- la deuxième : la même chose, en dessous -----------------------------
  {
    id: 'extracteur-sud',
    nom: 'il y a d’autre sucre par là',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 21, cy: 58 }],
    epreuve: 'extracteur',
    cible: { cx: 21, cy: 58 },
  },
  {
    id: 'chaufferie-sud',
    nom: 'une chaufferie pour lui aussi',
    icone: 'bulleChaufferie',
    cibles: [{ cx: 21, cy: 56 }],
    epreuve: 'machine',
    machine: 'chaufferie',
    cible: { cx: 21, cy: 56 },
  },
  {
    id: 'tapis-sucre-sud',
    nom: 'relie-les',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 21, cy: 58 }, { cx: 21, cy: 57 }, { cx: 21, cy: 56 }],
    epreuve: 'lien',
    de: { cx: 21, cy: 58 },
    a: { cx: 21, cy: 56 },
  },
  {
    id: 'tapis-caramel-sud',
    nom: 'et remonte le caramel au mur',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 21, cy: 56 }, { cx: 21, cy: 55 }, { cx: 21, cy: 54 },
      { cx: 21, cy: 53 }, { cx: 21, cy: 52 }, { cx: 21, cy: 51 },
      { cx: 21, cy: 50 }, { cx: 21, cy: 49 }, { cx: 21, cy: 48 },
    ],
    epreuve: 'lien',
    de: { cx: 21, cy: 56 },
    a: { cx: 21, cy: 48 },
  },

  // --- la troisième : plus loin, donc plus de tapis ------------------------
  {
    id: 'extracteur-est',
    nom: 'encore du sucre, plus loin',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 27, cy: 52 }],
    epreuve: 'extracteur',
    cible: { cx: 27, cy: 52 },
  },
  {
    id: 'chaufferie-est',
    nom: 'sa chaufferie, tout près',
    icone: 'bulleChaufferie',
    cibles: [{ cx: 25, cy: 52 }],
    epreuve: 'machine',
    machine: 'chaufferie',
    cible: { cx: 25, cy: 52 },
  },
  {
    id: 'tapis-sucre-est',
    nom: 'relie-les',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 27, cy: 52 }, { cx: 26, cy: 52 }, { cx: 25, cy: 52 }],
    epreuve: 'lien',
    de: { cx: 27, cy: 52 },
    a: { cx: 25, cy: 52 },
  },
  {
    id: 'tapis-caramel-est',
    nom: 'ton usine tourne !',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 25, cy: 52 }, { cx: 25, cy: 51 }, { cx: 25, cy: 50 },
      { cx: 25, cy: 49 }, { cx: 24, cy: 49 }, { cx: 23, cy: 49 },
      { cx: 22, cy: 49 }, { cx: 22, cy: 48 },
    ],
    epreuve: 'lien',
    de: { cx: 25, cy: 52 },
    a: { cx: 22, cy: 48 },
  },
];
