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
  // Trois bonbons, pas un. Ils se fabriquent des mêmes matières et se
  // distinguent par leur forme seule — une papillote, une sucette, un
  // berlingot — parce que c'est la forme qui nomme une chose dans ce jeu, et
  // qu'une collection de trois objets identiques n'en est pas une.
  coeur: { id: 'coeur', nom: 'cœur', forme: 'coeur', couleur: 'rouge', le: 'le', du: 'du' },
  berlingot: { id: 'berlingot', nom: 'berlingot', forme: 'berlingot', couleur: 'vert', le: 'le', du: 'du' },
};

// Les trois bonbons : c'est ce que la vitrine compte à part, et ce que la
// plieuse sait emballer.
export const BONBONS = ['bonbon', 'coeur', 'berlingot'];

// Ce que la livraison accepte, et ce que ça vaut.
//
// Elle ne prenait que les bonbons finis, et la plus petite chaîne qui
// rapportait quelque chose faisait donc quatre extracteurs et quatre machines :
// huit poses avant le premier retour. Elle prend maintenant le caramel et la
// pastille aussi, pour bien moins. Extracteur → chaufferie → livraison : trois
// éléments, et ça rapporte. C'est le noyau du jeu, et le bonbon devient ce
// qu'on fait pour gagner plus, pas le péage d'entrée.
//
// L'écart est franc — un contre trois contre dix — parce que c'est lui qui dit
// qu'il vaut mieux aller au bout de la chaîne. Deux caramels de plus ne
// remplaceront jamais un bonbon.
export const LIVRABLES = {
  caramel: 1,
  pastille: 3,
  bonbon: 10,
  coeur: 10,
  berlingot: 10,
};
