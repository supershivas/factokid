// Table des biomes : de quoi le sol est fait, et où chacun règne. Aucune
// logique ici.
//
// Un biome n'est pas une texture de plus : c'est la couleur du sol, posée sur
// le noir à une transparence très basse. Trois nuances par biome, et le
// passage de l'un à l'autre n'est qu'un mélange des deux teintes — il n'existe
// aucune tuile de raccord.
//
// `couleur` nomme une entrée de la palette, `motif` la texture minimale qui
// s'y pose : un point d'un pixel, ou un trait d'un pixel d'épaisseur.

// `ou` est le complément de lieu, tout fait : « dans les plaines de sucre »,
// « sur la terre ». L'article est dans la table, pas dans une règle de
// grammaire qu'il faudrait écrire.
export const BIOMES = {
  sucre: {
    id: 'sucre', nom: 'plaines de sucre', ou: 'dans les plaines de sucre',
    couleur: 'creme', motif: 'point',
  },
  terre: {
    id: 'terre', nom: 'terre', ou: 'sur la terre',
    couleur: 'orange', motif: 'couche',
  },
  fraise: {
    id: 'fraise', nom: 'champs de fraises', ou: 'dans les champs de fraises',
    couleur: 'rouge', motif: 'rang',
  },
  menthe: {
    id: 'menthe', nom: 'champs de menthe', ou: 'dans les champs de menthe',
    couleur: 'vert', motif: 'debout',
  },
};

// Ce que chaque biome donne : c'est là que ses gisements sont abondants.
export const MATIERE_DE = {
  sucre: 'sucre', terre: 'bois', fraise: 'fraise', menthe: 'menthe',
};

// Les trois nuances, en transparence sur le noir. Elles restent basses : le sol
// ne doit jamais monter au niveau des items, qui sont saturés.
export const NUANCES = [0.08, 0.11, 0.14];

// Largeur du fondu entre deux biomes, en cellules. « Fondu court » : on sent le
// changement sans le heurter.
export const FONDU = 2;

// La frontière entre deux régions ondule au lieu de suivre une droite : on
// fausse la distance d'un bruit doux, d'au plus `ONDULATION` cellules, sur une
// maille de `PAS_ONDULATION`. Sans ça le passage d'un biome à l'autre se voit
// à la règle, et le sol a l'air découpé.
export const ONDULATION = 3;
export const PAS_ONDULATION = 6;

// Chaque région tire le sol à elle : une cellule appartient à la région la
// plus proche, et se teinte des deux plus proches quand elles se disputent.
//
// Les régions ne sont plus écrites une par une : le monde fait trente-six
// fenêtres, et les poser à la main revenait à dessiner la même carte pour
// tout le monde, à jamais. Elles sont tirées au sort à la création de la
// partie (voir sim/carte.js) — sauf celle du milieu, qui ne bouge pas.
//
// La clairière est la seule chose que la carte n'invente pas : c'est là que le
// tutoriel se joue et que l'usine de départ est posée. Elle est de terre, elle
// est au centre, et ses quatre gisements sont dans data/monde.js.
export const REGION_CENTRALE = { biome: 'terre' };

// Combien de régions sont tirées, et à quelle distance minimale les unes des
// autres. Trop serrées, les biomes se hachent et le sol ne dit plus rien de
// loin ; trop lâches, on marche dix écrans dans la même couleur.
export const REGIONS_TIREES = 26;
export const ECART_REGIONS = 6; // en cellules

// Combien de régions chaque biome reçoit d'office avant que le tirage soit
// libre. Leur place, elle, reste tirée.
export const REGIONS_GARANTIES = 2;

// Autour de la clairière, on ne tire rien : ses quatre gisements doivent
// rester les plus proches, sinon le premier écran ne raconte plus rien.
export const RAYON_CLAIRIERE = 7; // en cellules

// Les gisements ne sont pas semés un par un mais par bouquets : un arbre seul
// au milieu de rien n'est pas une forêt, et c'est un bosquet qu'on veut
// trouver au bout d'un tapis. Un bouquet tient dans son rayon, et porte la
// matière du biome où tombe son cœur.
// Le plancher qui compte vraiment : combien de gisements de chaque matière une
// carte doit porter au minimum. Garantir des régions ne suffit pas — un
// bouquet tombe où il tombe, et une graine sur cent donnait une carte à un
// seul arbre. La partie n'y était pas perdue, les gisements de la clairière
// repoussent, mais elle devenait une chasse au trésor : ce n'est pas le jeu.
// On complète donc au pied d'une région du bon biome.
export const MINIMUM_PAR_MATIERE = 12;

export const BOUQUETS = 46;
export const PAR_BOUQUET = [2, 5];  // combien de gisements, bornes comprises
export const RAYON_BOUQUET = 2;     // en cellules
