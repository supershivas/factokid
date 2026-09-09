// Table du monde : ses gisements. Aucune logique ici.
//
// Il n'y a plus de carte spécialisée : une seule grande grille, où l'on mine
// et où l'on construit au même endroit. Les gisements proches nourrissent la
// première chaîne ; les autres sont loin, et c'est la distance qui fait la
// progression — un gisement à vingt cases coûte vingt convoyeurs.
//
// Cette table ne contient plus que les trois du pied du monde. Tous les autres
// sont engendrés étage par étage (voir sim/carte.js) : le monde fait
// trente-six fenêtres, et écrire ses cent gisements à la main serait les figer
// pour rien.
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

// Le pied du monde : le centre de l'étage 1, là où la partie commence. Rien
// n'est tiré autour, et les gisements ci-dessous y sont écrits — c'est ce qui
// permet au tutoriel de nommer des cellules précises et à l'usine de départ
// d'être posée d'avance.
//
// Il a remplacé la clairière du centre du monde, qui avait un peu de tout : on
// ne commence plus au milieu mais en bas, et l'étage 1 est le monde du sucre.
// Il n'y a donc qu'une matière ici, et c'est tout ce qu'il faut — sucre,
// chaufferie, livraison est déjà une usine qui rapporte.
export const PIED_DU_MONDE = { cx: 21, cy: 55 };

// Les gisements du départ. Ils sont à trois ou cinq cases de leurs machines :
// un tapis de deux cases se vide en une seconde, et l'usine de départ avait
// toujours l'air vide, quelle que soit la cadence. C'est la même règle que
// partout ailleurs — la distance est la ressource, et c'est elle qui remplit
// les tapis.
//
// Tous les autres sont engendrés (voir sim/carte.js), étage par étage.
export const GISEMENTS = [
  { cx: 15, cy: 54, item: 'sucre' },
  { cx: 27, cy: 52, item: 'sucre' },
  { cx: 21, cy: 58, item: 'sucre' },
];
