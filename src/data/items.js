// Table des items. Aucune logique ici.
// Chaque item doit être reconnaissable à sa forme seule, en niveaux de gris :
// la couleur ne fait que confirmer ce que la forme dit déjà. Deux items
// peuvent partager une couleur s'ils n'ont pas la même forme.

export const ITEMS = {
  sucre: { id: 'sucre', nom: 'sucre', forme: 'carre', couleur: 'creme' },
  papier: { id: 'papier', nom: 'papier', forme: 'feuille', couleur: 'bleu' },
  fraise: { id: 'fraise', nom: 'fraise', forme: 'rond', couleur: 'rouge' },
  menthe: { id: 'menthe', nom: 'menthe', forme: 'triangle', couleur: 'vert' },
  caramel: { id: 'caramel', nom: 'caramel', forme: 'barre', couleur: 'jaune' },
  pastille: { id: 'pastille', nom: 'pastille', forme: 'rond', couleur: 'orange' },
  bonbon: { id: 'bonbon', nom: 'bonbon', forme: 'bonbon', couleur: 'orange' },
};
