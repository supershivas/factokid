// Table du monde : ses gisements. Aucune logique ici.
//
// Il n'y a plus de carte spécialisée : une seule grande grille, où l'on mine
// et où l'on construit au même endroit. Les gisements proches nourrissent la
// première chaîne ; les autres sont loin, et c'est la distance qui fait la
// progression — un gisement à vingt cases coûte vingt convoyeurs.
//
// Les dimensions du monde vivent dans le design system, avec la fenêtre.

export const EXTRACTEUR = {
  ticksParItem: 150, // 2,5 s par matière
};

export const REPOUSSE_TICKS = 180; // 3 s à 60 Hz

// Le cœur du monde est autour de (10, 15) : c'est là que la livraison se
// trouve et que les quatre premiers gisements sont à portée de tapis.
export const GISEMENTS = [
  // Les quatre du départ, à une ou deux cases de leur machine.
  { cx: 4, cy: 12, item: 'sucre' },
  { cx: 8, cy: 11, item: 'fraise' },
  { cx: 11, cy: 14, item: 'menthe' },
  { cx: 12, cy: 16, item: 'papier' },

  // Le deuxième cercle : quelques cases de plus, encore facile.
  { cx: 3, cy: 16, item: 'sucre' },
  { cx: 13, cy: 11, item: 'fraise' },
  { cx: 6, cy: 19, item: 'menthe' },
  { cx: 15, cy: 18, item: 'papier' },
  { cx: 9, cy: 8, item: 'sucre' },
  { cx: 16, cy: 14, item: 'sucre' },

  // Le troisième : il faut déjà traverser un écran.
  { cx: 2, cy: 6, item: 'sucre' },
  { cx: 6, cy: 4, item: 'fraise' },
  { cx: 14, cy: 5, item: 'menthe' },
  { cx: 18, cy: 8, item: 'papier' },
  { cx: 1, cy: 22, item: 'fraise' },
  { cx: 5, cy: 26, item: 'sucre' },
  { cx: 10, cy: 24, item: 'papier' },
  { cx: 16, cy: 23, item: 'menthe' },
  { cx: 19, cy: 27, item: 'fraise' },
  { cx: 12, cy: 28, item: 'sucre' },

  // Les lointains, aux quatre coins.
  { cx: 0, cy: 1, item: 'menthe' },
  { cx: 19, cy: 1, item: 'sucre' },
  { cx: 1, cy: 29, item: 'papier' },
  { cx: 20, cy: 20, item: 'fraise' },
  { cx: 17, cy: 29, item: 'menthe' },
];
