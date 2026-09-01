// Table des outils et des éléments constructibles. Aucune logique ici.
// C'est là que la barre d'outils grossit : un nouvel élément posable est une
// entrée de plus dans CONSTRUCTIBLES.

export const OUTILS = [
  { id: 'construction', icone: 'outilConstruction' },
  { id: 'destruction', icone: 'outilDestruction' },
];

// `ou` dit où l'élément se pose : « partout », « usine » ou « carte ».
// `machine` nomme l'entrée de MACHINES à poser sur une cellule libre.
export const CONSTRUCTIBLES = [
  { id: 'convoyeur', icone: 'bulleConvoyeur', ou: 'partout' },
  { id: 'extracteur', icone: 'bulleExtracteur', ou: 'carte' },
  { id: 'trieur', icone: 'bulleTrieur', ou: 'usine', machine: 'trieur' },
  { id: 'chaufferie', icone: 'bulleChaufferie', ou: 'usine', machine: 'chaufferie' },
  { id: 'confiserie', icone: 'bulleConfiserie', ou: 'usine', machine: 'confiserie' },
  { id: 'plieuse', icone: 'bulliePlieuse', ou: 'usine', machine: 'plieuse' },
];

// Les machines qu'on peut poser sont aussi les seules qu'on peut détruire :
// un téléporteur ou la livraison restent en place.
export const MACHINES_CONSTRUCTIBLES = CONSTRUCTIBLES
  .filter((c) => c.machine)
  .map((c) => c.machine);
