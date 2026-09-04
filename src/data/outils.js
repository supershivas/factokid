// Table des outils et des éléments constructibles. Aucune logique ici.
// C'est là que la barre d'outils grossit : un nouvel élément posable est une
// entrée de plus dans CONSTRUCTIBLES.

export const OUTILS = [
  { id: 'main', icone: 'outilMain' },
  { id: 'construction', icone: 'outilConstruction' },
  { id: 'destruction', icone: 'outilDestruction' },
];

// Tout se pose partout : il n'y a plus qu'une carte. `machine` nomme l'entrée
// de MACHINES à poser sur une cellule libre ; l'extracteur, lui, demande un
// gisement sous lui.
export const CONSTRUCTIBLES = [
  { id: 'convoyeur', icone: 'bulleConvoyeur' },
  { id: 'extracteur', icone: 'bulleExtracteur' },
  { id: 'trieur', icone: 'bulleTrieur', machine: 'trieur' },
  { id: 'scierie', icone: 'bulleScierie', machine: 'scierie' },
  { id: 'chaufferie', icone: 'bulleChaufferie', machine: 'chaufferie' },
  { id: 'confiserie', icone: 'bulleConfiserie', machine: 'confiserie' },
  { id: 'plieuse', icone: 'bulliePlieuse', machine: 'plieuse' },
];

// Les machines qu'on peut poser sont aussi les seules qu'on peut détruire :
// un téléporteur ou la livraison restent en place.
export const MACHINES_CONSTRUCTIBLES = CONSTRUCTIBLES
  .filter((c) => c.machine)
  .map((c) => c.machine);
