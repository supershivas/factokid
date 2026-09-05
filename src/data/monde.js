// Table du monde : ses gisements. Aucune logique ici.
//
// Il n'y a plus de carte spécialisée : une seule grande grille, où l'on mine
// et où l'on construit au même endroit. Les gisements proches nourrissent la
// première chaîne ; les autres sont loin, et c'est la distance qui fait la
// progression — un gisement à vingt cases coûte vingt convoyeurs.
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
// Le cœur du monde est autour de (10, 15) : c'est là que la livraison se
// trouve et que les quatre premiers gisements sont à portée de tapis.
// Chaque gisement porte la matière de son biome : le sucre est dans les
// plaines de sucre, la menthe dans les champs de menthe. La carte se lit donc
// de loin — on sait où aller chercher quoi rien qu'à la couleur du sol.
//
// Les quatre premiers font exception : ils sont dans la clairière de départ,
// qui a un peu de tout. C'est ce qui permet de fabriquer un bonbon avant
// d'avoir traversé quoi que ce soit.
export const GISEMENTS = [
{ cx: 4, cy: 12, item: 'sucre' },
  { cx: 8, cy: 11, item: 'fraise' },
  { cx: 11, cy: 14, item: 'menthe' },
  { cx: 12, cy: 16, item: 'bois' },
  { cx: 3, cy: 16, item: 'sucre' },
  { cx: 13, cy: 11, item: 'bois' },
  { cx: 6, cy: 19, item: 'bois' },
  { cx: 15, cy: 18, item: 'menthe' },
  { cx: 9, cy: 8, item: 'fraise' },
  { cx: 16, cy: 14, item: 'menthe' },
  { cx: 2, cy: 6, item: 'sucre' },
  { cx: 6, cy: 4, item: 'sucre' },
  { cx: 14, cy: 5, item: 'fraise' },
  { cx: 18, cy: 8, item: 'fraise' },
  { cx: 1, cy: 22, item: 'sucre' },
  { cx: 5, cy: 26, item: 'sucre' },
  { cx: 10, cy: 24, item: 'menthe' },
  { cx: 16, cy: 23, item: 'bois' },
  { cx: 19, cy: 27, item: 'bois' },
  { cx: 12, cy: 28, item: 'menthe' },
  { cx: 0, cy: 1, item: 'sucre' },
  { cx: 19, cy: 1, item: 'fraise' },
  { cx: 1, cy: 29, item: 'sucre' },
  { cx: 20, cy: 20, item: 'menthe' },
  { cx: 17, cy: 29, item: 'bois' },
];
