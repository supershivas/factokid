// Table des outils et des éléments constructibles. Aucune logique ici.
// C'est là que la barre d'outils grossit : un nouvel élément posable est une
// entrée de plus dans CONSTRUCTIBLES.

export const OUTILS = [
  { id: 'construction', icone: 'outilConstruction' },
  { id: 'destruction', icone: 'outilDestruction' },
];

// `ou` dit où l'élément se pose : « partout », « usine » ou « carte ».
export const CONSTRUCTIBLES = [
  { id: 'convoyeur', icone: 'bulleConvoyeur', ou: 'partout' },
  { id: 'extracteur', icone: 'bulleExtracteur', ou: 'carte' },
];
