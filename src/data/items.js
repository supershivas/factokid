// Table des items. Aucune logique ici.
//
// Quatre matières sortent du sol — sucre, bois, fraise, menthe — et le papier
// n'en fait plus partie : il se fabrique, comme le caramel. C'est la scierie
// qui débite le bois des arbres.
// Chaque item doit être reconnaissable à sa forme seule, en niveaux de gris :
// la couleur ne fait que confirmer ce que la forme dit déjà. Deux items
// peuvent partager une couleur s'ils n'ont pas la même forme.

export const ITEMS = {
  sucre: { id: 'sucre', nom: 'sucre', forme: 'cube', couleur: 'creme' },
  bois: { id: 'bois', nom: 'bois', forme: 'buche', couleur: 'orange' },
  fraise: { id: 'fraise', nom: 'fraise', forme: 'fraise', couleur: 'rouge' },
  menthe: { id: 'menthe', nom: 'menthe', forme: 'menthe', couleur: 'vert' },
  papier: { id: 'papier', nom: 'papier', forme: 'papier', couleur: 'bleu' },
  caramel: { id: 'caramel', nom: 'caramel', forme: 'barre', couleur: 'jaune' },
  pastille: { id: 'pastille', nom: 'pastille', forme: 'rond', couleur: 'orange' },
  bonbon: { id: 'bonbon', nom: 'bonbon', forme: 'bonbon', couleur: 'orange' },
};
