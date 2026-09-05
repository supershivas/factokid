// Table du monde : ses gisements. Aucune logique ici.
//
// Il n'y a plus de carte spécialisée : une seule grande grille, où l'on mine
// et où l'on construit au même endroit. Les gisements proches nourrissent la
// première chaîne ; les autres sont loin, et c'est la distance qui fait la
// progression — un gisement à vingt cases coûte vingt convoyeurs.
//
// Cette table ne contient plus que les quatre de la clairière. Tous les autres
// sont engendrés (voir sim/carte.js) : le monde fait trente-six fenêtres, et
// écrire ses cent gisements à la main serait les figer pour rien.
//
// Les dimensions du monde vivent dans le design system, avec la fenêtre.

// Un extracteur creuse, le gisement disparaît, il repousse : ce qui sort du
// sol tient donc aux deux durées ensemble, et non à la seule extraction. Elles
// ont été divisées par deux — une matière toutes les 2,75 s au lieu de 5,5 —
// pour que ça grouille sur les tapis. Ne diviser que l'extraction n'aurait
// gagné qu'un cinquième : c'est l'attente qui pesait le plus.
export const EXTRACTEUR = {
  ticksParItem: 75, // 1,25 s par matière
};

export const REPOUSSE_TICKS = 90; // 1,5 s à 60 Hz

// Le papier ne se ramasse plus : ce sont des arbres qui poussent là, et la
// scierie en fait du papier.
//
// Le cœur du monde est son centre : c'est là que la livraison se trouve et que
// les quatre premiers gisements sont à portée de tapis.
// Ailleurs, chaque gisement porte la matière de son biome : le sucre est dans
// les plaines de sucre, la menthe dans les champs de menthe. La carte se lit
// donc de loin — on sait où aller chercher quoi rien qu'à la couleur du sol.
//
// Les quatre premiers font exception : ils sont dans la clairière de départ,
// qui a un peu de tout. C'est ce qui permet de fabriquer un bonbon avant
// d'avoir traversé quoi que ce soit.
//
// Ils ont été écartés de leurs machines : ils étaient à une ou deux cases, et
// un tapis de deux cases se vide en une seconde — l'usine de départ avait
// toujours l'air vide, quelle que soit la cadence. Ils sont maintenant à trois
// ou cinq, et ce sont seize cases de tapis qui portent la matière brute au
// lieu de six. C'est la même règle que partout ailleurs : la distance est la
// ressource, et c'est elle qui remplit les tapis.
export const GISEMENTS = [
  { cx: 13, cy: 27, item: 'sucre' },
  { cx: 19, cy: 23, item: 'fraise' },
  { cx: 25, cy: 29, item: 'menthe' },
  { cx: 23, cy: 35, item: 'bois' },
];
