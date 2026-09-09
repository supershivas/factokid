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

// Les trois nuances, en transparence sur le noir.
//
// Elles ont doublé : à huit pour cent le sol était presque noir, on voyait les
// biomes de loin sans voir leur couleur. C'est la direction « deux fois plus »
// du labo (labo/sols.html), et c'est bien un simple réglage — la recette est la
// même, les nombres seuls changent.
//
// Elles restent basses malgré tout : le sol ne monte jamais au niveau des
// items, qui sont saturés. La pire paire mesurée reste la fraise dans les
// plaines de sucre, qui tient par sa couleur.
export const NUANCES = [0.16, 0.22, 0.28];

// Ce que la texture monte au-dessus de la nuance la plus claire : assez pour
// se voir, pas assez pour tirer l'œil au-dessus des items.
export const TEXTURE = 0.10;

// Largeur du fondu entre deux biomes, en cellules. « Fondu court » : on sent le
// changement sans le heurter.
export const FONDU = 2;

// La frontière entre deux régions ondule au lieu de suivre une droite : on
// fausse la distance d'un bruit doux, d'au plus `ONDULATION` cellules, sur une
// maille de `PAS_ONDULATION`. Sans ça le passage d'un biome à l'autre se voit
// à la règle, et le sol a l'air découpé.
export const ONDULATION = 3;
export const PAS_ONDULATION = 6;

// --- les bandes ------------------------------------------------------------

// Le biome d'une cellule est donné par sa rangée : le monde se lit en étages,
// et c'est `data/zones.js` qui dit lequel porte quoi. Il n'y a plus de régions
// tirées au hasard dans le plan, plus de garanties par matière, plus de
// plancher de rattrapage — il ne peut pas manquer de sucre dans le monde du
// sucre.

// Autour du départ, à l'étage 1, on ne tire rien : les gisements écrits dans
// data/monde.js doivent rester les plus proches, sinon le premier écran ne
// raconte plus rien.
export const RAYON_DEPART = 7; // en cellules

// Les gisements ne sont pas semés un par un mais par bouquets : un arbre seul
// au milieu de rien n'est pas une forêt, et c'est un bosquet qu'on veut
// trouver au bout d'un tapis. Un bouquet tient dans son rayon, ne sort jamais
// de son étage, et porte la matière de celui-ci.
//
// Douze bouquets par étage font une trentaine de gisements sur ses cinq cents
// cases — soit, à l'étage 1, de quoi nourrir bien plus d'extracteurs qu'un
// tapis n'en peut porter. Ce n'est pas le nombre qui limite, c'est la
// distance, et c'est ce qu'on veut.
//
// Neuf suffisaient partout ailleurs, mais pas à l'étage 1 : un bouquet qui
// tombe dans le rayon du départ est perdu tout entier, et sur trois cents
// graines le pire étage 1 descendait à douze gisements quand les autres en
// gardaient vingt. À douze bouquets, le pire remonte à dix-neuf.
export const BOUQUETS_PAR_ETAGE = 12;
export const PAR_BOUQUET = [2, 5];  // combien de gisements, bornes comprises
export const RAYON_BOUQUET = 2;     // en cellules
