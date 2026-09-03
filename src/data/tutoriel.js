// Table du tutoriel : les gestes du premier contact, dans l'ordre. Aucune
// logique ici — `epreuve` nomme ce qu'il faut avoir fait, et src/tutoriel.js
// sait le reconnaître.
//
// Le tutoriel n'apprend que les gestes du jeu : poser sur un gisement, poser
// une machine, tracer un tapis d'une machine à l'autre — et lui en tracer un
// pour ressortir, sans quoi elle garde tout et ne fabrique rien. Le reste
// s'apprend en jouant.
//
// `cibles` : les cellules à montrer. `icone` : ce qu'il y a à poser, avec le
// dessin exact de sa bulle dans le menu de construction — l'enfant reconnaît
// l'image, il n'a rien à lire.

export const TUTORIEL = [
  {
    id: 'extracteur',
    nom: 'pose un extracteur sur le sucre',
    icone: 'bulleExtracteur',
    cibles: [{ cx: 4, cy: 12 }],
    epreuve: 'extracteur',
  },
  {
    id: 'chaufferie',
    nom: 'pose une chaufferie ici',
    icone: 'bulleChaufferie',
    cibles: [{ cx: 6, cy: 12 }],
    epreuve: 'chaufferie',
  },
  {
    id: 'tapis',
    nom: "glisse le doigt de l'un à l'autre",
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 4, cy: 12 }, { cx: 5, cy: 12 }, { cx: 6, cy: 12 }],
    epreuve: 'tapis',
  },
  {
    id: 'sortie',
    nom: 'et un tapis pour ressortir',
    icone: 'bulleConvoyeur',
    cibles: [{ cx: 6, cy: 12 }, { cx: 7, cy: 12 }, { cx: 8, cy: 12 }],
    epreuve: 'sortie',
  },
  {
    id: 'caramel',
    nom: 'le sucre fond en caramel',
    icone: 'caramel',
    cibles: [{ cx: 7, cy: 12 }],
    epreuve: 'caramel',
  },
];
