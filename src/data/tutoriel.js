// Table du tutoriel : les gestes du premier contact, dans l'ordre. Aucune
// logique ici — `epreuve` nomme ce qu'il faut avoir fait, et src/tutoriel.js
// sait le reconnaître.
//
// Le tutoriel va jusqu'au bout : à la dernière étape, l'usine tourne et livre
// ses bonbons. Il bâtit exactement la chaîne de l'essai « usine qui tourne »,
// case par case — ce qu'on obtient à la fin est ce que cet essai donne tout
// fait. Qui n'en veut pas le passe d'un bouton.
//
// Quatre épreuves, et pas une de plus :
//
//   `extracteur` — un extracteur est posé sur le gisement de `cible` ;
//   `machine`    — une machine de ce type occupe la case `cible` ;
//   `lien`       — des tapis mènent de la machine `de` à la machine `a`,
//                  branches comprises ;
//   `livre`      — la livraison a reçu son premier bonbon.
//
// `cibles` : les cellules que le halo montre. `icone` : ce qu'il y a à poser,
// avec le dessin exact de sa bulle dans le menu de construction.

export const TUTORIEL = [
  {
    id: 'extracteur-sucre',
    nom: 'pose un extracteur sur le sucre',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 13, cy: 27 }],
    epreuve: 'extracteur',
    cible: { cx: 13, cy: 27 },
  },
  {
    id: 'chaufferie',
    nom: 'pose une chaufferie ici',
    icone: 'bulleChaufferie',
    cibles: [{ cx: 17, cy: 27 }],
    epreuve: 'machine',
    machine: 'chaufferie',
    cible: { cx: 17, cy: 27 },
  },
  {
    id: 'tapis-sucre',
    nom: 'glisse le doigt de l’un à l’autre',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 13, cy: 27 }, { cx: 14, cy: 27 }, { cx: 15, cy: 27 },
      { cx: 16, cy: 27 }, { cx: 17, cy: 27 },
    ],
    epreuve: 'lien',
    de: { cx: 13, cy: 27 },
    a: { cx: 17, cy: 27 },
  },
  {
    id: 'confiserie',
    nom: 'la confiserie va faire les pastilles',
    icone: 'bulleConfiserie',
    cibles: [{ cx: 19, cy: 29 }],
    epreuve: 'machine',
    machine: 'confiserie',
    cible: { cx: 19, cy: 29 },
  },
  {
    id: 'tapis-caramel',
    nom: 'porte le caramel à la confiserie',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 17, cy: 28 }, { cx: 17, cy: 29 }, { cx: 18, cy: 29 }, { cx: 19, cy: 29 }],
    epreuve: 'lien',
    de: { cx: 17, cy: 27 },
    a: { cx: 19, cy: 29 },
  },
  {
    id: 'extracteur-fraise',
    nom: 'il faut aussi des fraises',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 19, cy: 23 }],
    epreuve: 'extracteur',
    cible: { cx: 19, cy: 23 },
  },
  {
    id: 'tapis-fraise',
    nom: 'descends-les vers la confiserie',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 19, cy: 23 }, { cx: 19, cy: 24 }, { cx: 19, cy: 25 }, { cx: 19, cy: 26 },
      { cx: 19, cy: 27 }, { cx: 19, cy: 28 }, { cx: 19, cy: 29 },
    ],
    epreuve: 'lien',
    de: { cx: 19, cy: 23 },
    a: { cx: 19, cy: 29 },
  },
  {
    id: 'extracteur-menthe',
    nom: 'et de la menthe',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 25, cy: 29 }],
    epreuve: 'extracteur',
    cible: { cx: 25, cy: 29 },
  },
  {
    id: 'tapis-menthe',
    nom: 'ramène-la de l’autre côté',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 25, cy: 29 }, { cx: 24, cy: 29 }, { cx: 23, cy: 29 },
      { cx: 22, cy: 29 }, { cx: 21, cy: 29 }, { cx: 20, cy: 29 }, { cx: 19, cy: 29 },
    ],
    epreuve: 'lien',
    de: { cx: 25, cy: 29 },
    a: { cx: 19, cy: 29 },
  },
  {
    id: 'plieuse',
    nom: 'la plieuse emballe les bonbons',
    icone: 'bulliePlieuse',
    cibles: [{ cx: 21, cy: 31 }],
    epreuve: 'machine',
    machine: 'plieuse',
    cible: { cx: 21, cy: 31 },
  },
  {
    id: 'tapis-pastille',
    nom: 'porte les pastilles à la plieuse',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 19, cy: 30 }, { cx: 20, cy: 30 }, { cx: 20, cy: 31 }, { cx: 21, cy: 31 }],
    epreuve: 'lien',
    de: { cx: 19, cy: 29 },
    a: { cx: 21, cy: 31 },
  },
  {
    id: 'extracteur-bois',
    nom: 'abats cet arbre pour son bois',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 23, cy: 35 }],
    epreuve: 'extracteur',
    cible: { cx: 23, cy: 35 },
  },
  {
    id: 'scierie',
    nom: 'la scierie en fera du papier',
    icone: 'bulleScierie',
    cibles: [{ cx: 22, cy: 32 }],
    epreuve: 'machine',
    machine: 'scierie',
    cible: { cx: 22, cy: 32 },
  },
  {
    id: 'tapis-bois',
    nom: 'porte le bois à la scierie',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 23, cy: 35 }, { cx: 23, cy: 34 }, { cx: 23, cy: 33 },
      { cx: 23, cy: 32 }, { cx: 22, cy: 32 },
    ],
    epreuve: 'lien',
    de: { cx: 23, cy: 35 },
    a: { cx: 22, cy: 32 },
  },
  {
    id: 'tapis-papier',
    nom: 'et le papier à la plieuse',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 22, cy: 31 }, { cx: 21, cy: 31 }],
    epreuve: 'lien',
    de: { cx: 22, cy: 32 },
    a: { cx: 21, cy: 31 },
  },
  {
    id: 'tapis-livraison',
    nom: 'livre enfin tes bonbons',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 21, cy: 32 }, { cx: 21, cy: 33 }],
    epreuve: 'lien',
    de: { cx: 21, cy: 31 },
    a: { cx: 21, cy: 33 },
  },
  {
    id: 'bonbon',
    nom: 'ton usine tourne !',
    icone: 'bonbon',
    cibles: [{ cx: 21, cy: 33 }],
    epreuve: 'livre',
  },
];
