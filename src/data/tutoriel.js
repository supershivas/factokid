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
    cibles: [{ cx: 2, cy: 12 }],
    epreuve: 'extracteur',
    cible: { cx: 2, cy: 12 },
  },
  {
    id: 'chaufferie',
    nom: 'pose une chaufferie ici',
    icone: 'bulleChaufferie',
    cibles: [{ cx: 6, cy: 12 }],
    epreuve: 'machine',
    machine: 'chaufferie',
    cible: { cx: 6, cy: 12 },
  },
  {
    id: 'tapis-sucre',
    nom: 'glisse le doigt de l’un à l’autre',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 2, cy: 12 }, { cx: 3, cy: 12 }, { cx: 4, cy: 12 },
      { cx: 5, cy: 12 }, { cx: 6, cy: 12 },
    ],
    epreuve: 'lien',
    de: { cx: 2, cy: 12 },
    a: { cx: 6, cy: 12 },
  },
  {
    id: 'confiserie',
    nom: 'la confiserie va faire les pastilles',
    icone: 'bulleConfiserie',
    cibles: [{ cx: 8, cy: 14 }],
    epreuve: 'machine',
    machine: 'confiserie',
    cible: { cx: 8, cy: 14 },
  },
  {
    id: 'tapis-caramel',
    nom: 'porte le caramel à la confiserie',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 6, cy: 13 }, { cx: 6, cy: 14 }, { cx: 7, cy: 14 }, { cx: 8, cy: 14 }],
    epreuve: 'lien',
    de: { cx: 6, cy: 12 },
    a: { cx: 8, cy: 14 },
  },
  {
    id: 'extracteur-fraise',
    nom: 'il faut aussi des fraises',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 8, cy: 8 }],
    epreuve: 'extracteur',
    cible: { cx: 8, cy: 8 },
  },
  {
    id: 'tapis-fraise',
    nom: 'descends-les vers la confiserie',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 8, cy: 8 }, { cx: 8, cy: 9 }, { cx: 8, cy: 10 }, { cx: 8, cy: 11 },
      { cx: 8, cy: 12 }, { cx: 8, cy: 13 }, { cx: 8, cy: 14 },
    ],
    epreuve: 'lien',
    de: { cx: 8, cy: 8 },
    a: { cx: 8, cy: 14 },
  },
  {
    id: 'extracteur-menthe',
    nom: 'et de la menthe',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 14, cy: 14 }],
    epreuve: 'extracteur',
    cible: { cx: 14, cy: 14 },
  },
  {
    id: 'tapis-menthe',
    nom: 'ramène-la de l’autre côté',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 14, cy: 14 }, { cx: 13, cy: 14 }, { cx: 12, cy: 14 },
      { cx: 11, cy: 14 }, { cx: 10, cy: 14 }, { cx: 9, cy: 14 }, { cx: 8, cy: 14 },
    ],
    epreuve: 'lien',
    de: { cx: 14, cy: 14 },
    a: { cx: 8, cy: 14 },
  },
  {
    id: 'plieuse',
    nom: 'la plieuse emballe les bonbons',
    icone: 'bulliePlieuse',
    cibles: [{ cx: 10, cy: 16 }],
    epreuve: 'machine',
    machine: 'plieuse',
    cible: { cx: 10, cy: 16 },
  },
  {
    id: 'tapis-pastille',
    nom: 'porte les pastilles à la plieuse',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 8, cy: 15 }, { cx: 9, cy: 15 }, { cx: 9, cy: 16 }, { cx: 10, cy: 16 }],
    epreuve: 'lien',
    de: { cx: 8, cy: 14 },
    a: { cx: 10, cy: 16 },
  },
  {
    id: 'extracteur-bois',
    nom: 'abats cet arbre pour son bois',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 12, cy: 20 }],
    epreuve: 'extracteur',
    cible: { cx: 12, cy: 20 },
  },
  {
    id: 'scierie',
    nom: 'la scierie en fera du papier',
    icone: 'bulleScierie',
    cibles: [{ cx: 11, cy: 17 }],
    epreuve: 'machine',
    machine: 'scierie',
    cible: { cx: 11, cy: 17 },
  },
  {
    id: 'tapis-bois',
    nom: 'porte le bois à la scierie',
    icone: 'bulleConvoyeur',
    cibles: [
      { cx: 12, cy: 20 }, { cx: 12, cy: 19 }, { cx: 12, cy: 18 },
      { cx: 12, cy: 17 }, { cx: 11, cy: 17 },
    ],
    epreuve: 'lien',
    de: { cx: 12, cy: 20 },
    a: { cx: 11, cy: 17 },
  },
  {
    id: 'tapis-papier',
    nom: 'et le papier à la plieuse',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 11, cy: 16 }, { cx: 10, cy: 16 }],
    epreuve: 'lien',
    de: { cx: 11, cy: 17 },
    a: { cx: 10, cy: 16 },
  },
  {
    id: 'tapis-livraison',
    nom: 'livre enfin tes bonbons',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 10, cy: 17 }, { cx: 10, cy: 18 }],
    epreuve: 'lien',
    de: { cx: 10, cy: 16 },
    a: { cx: 10, cy: 18 },
  },
  {
    id: 'bonbon',
    nom: 'ton usine tourne !',
    icone: 'bonbon',
    cibles: [{ cx: 10, cy: 18 }],
    epreuve: 'livre',
  },
];
