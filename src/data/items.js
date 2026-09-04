// Table des items. Aucune logique ici.
//
// Quatre matières sortent du sol — sucre, bois, fraise, menthe — et le papier
// n'en fait plus partie : il se fabrique, comme le caramel. C'est la scierie
// qui débite le bois des arbres.
// Chaque item doit être reconnaissable à sa forme seule, en niveaux de gris :
// la couleur ne fait que confirmer ce que la forme dit déjà. Deux items
// peuvent partager une couleur s'ils n'ont pas la même forme.
//
// Chaque matière porte ses deux articles, écrits en toutes lettres plutôt que
// déduits d'un genre : `le` pour la nommer, `du` pour en prendre. Sans eux, un
// extracteur de fraises annonçait qu'il récoltait « du fraise ». Une règle de
// grammaire serait un système de plus ; deux mots dans la table suffisent, et
// ils diront « l'orange » ou « de l'eau » le jour où il en faudra.

export const ITEMS = {
  sucre: { id: 'sucre', nom: 'sucre', forme: 'cube', couleur: 'creme', le: 'le', du: 'du' },
  bois: { id: 'bois', nom: 'bois', forme: 'buche', couleur: 'orange', le: 'le', du: 'du' },
  fraise: { id: 'fraise', nom: 'fraise', forme: 'fraise', couleur: 'rouge', le: 'la', du: 'de la' },
  menthe: { id: 'menthe', nom: 'menthe', forme: 'menthe', couleur: 'vert', le: 'la', du: 'de la' },
  papier: { id: 'papier', nom: 'papier', forme: 'papier', couleur: 'bleu', le: 'le', du: 'du' },
  caramel: { id: 'caramel', nom: 'caramel', forme: 'barre', couleur: 'jaune', le: 'le', du: 'du' },
  pastille: { id: 'pastille', nom: 'pastille', forme: 'rond', couleur: 'orange', le: 'la', du: 'de la' },
  bonbon: { id: 'bonbon', nom: 'bonbon', forme: 'bonbon', couleur: 'orange', le: 'le', du: 'du' },
};
