// Table des étages : ce que chaque bande du monde porte, et ce que son mur
// demande. Aucune logique ici — `sim/carte.js` en tire les rangées.
//
// Le monde se lit en étages, du bas vers le haut : cinq bandes de douze
// rangées sur les soixante du monde. On ne progresse que vers le haut, et un
// mur ferme chaque étage tant qu'on ne lui a pas livré assez de ce que cet
// étage sait faire.
//
// Un étage, un biome, une matière. C'est ce qui rend le mur nécessaire et non
// décoratif : l'étage du dessus ne peut rien faire de neuf sans ce que produit
// celui du dessous, et l'usine d'en bas continue de tourner pour toujours.
//
//   `biome`   — la couleur de son sol, une entrée de data/biomes.js ;
//   `matiere` — ce que ses gisements portent ; nulle veut dire aucun gisement ;
//   `ouvre`   — ce que son ouverture rend constructible, en plus de ce que les
//               étages du dessous ont déjà donné ;
//   `mur`     — ce qu'il faut lui livrer pour l'ouvrir. Nul veut dire un mur
//               qui ne s'ouvre pas encore : l'étage au-dessus est écrit, mais
//               le jeu s'arrête là.
//
// **Deux étages seulement sont jouables pour l'instant**, le temps de voir si
// la mécanique tient. Les trois du dessus existent — le monde fait toujours
// soixante rangées, et son sol se peint jusqu'en haut — mais leur mur ne
// s'ouvre pas, et leur contenu reste à décider. Le cinquième, en particulier,
// n'a pas encore d'identité : il n'y a que quatre matières.

// Un étage fait presque un écran de haut : quand on est à son pied, on voit le
// mur qui le ferme.
export const HAUTEUR_ETAGE = 12; // rangées

export const ETAGES = [
  {
    n: 1,
    biome: 'sucre',
    matiere: 'sucre',
    // De quoi faire tourner le noyau à trois éléments : un extracteur sur le
    // sucre, une chaufferie qui le fond, la livraison qui l'achète.
    ouvre: ['extracteur', 'chaufferie'],
    // Le mur demande le produit de l'étage qu'il ferme. Le caramel vaut 1 à la
    // livraison : le total livré au mur, lui, ne se dépense pas.
    mur: { item: 'caramel', combien: 40 },
  },
  {
    n: 2,
    biome: 'fraise',
    matiere: 'fraise',
    // Deux matières sur la carte, donc une raison d'avoir un trieur : c'est la
    // mécanique de cet étage, pas seulement sa matière.
    ouvre: ['trieur'],
    // À décider : la fraise seule ne fabrique rien — la pastille demande aussi
    // la menthe. Le mur du dessus attendra qu'on sache quoi lui réclamer.
    mur: null,
  },
  { n: 3, biome: 'menthe', matiere: 'menthe', ouvre: ['confiserie'], mur: null },
  { n: 4, biome: 'terre', matiere: 'bois', ouvre: ['scierie', 'plieuse'], mur: null },
  // Le sommet : pas de matière neuve. Ce qu'il devient reste à décider.
  { n: 5, biome: 'terre', matiere: null, ouvre: [], mur: null },
];

// Ce qui est là dès le premier instant, avant tout mur : le convoyeur et la
// livraison. Le tapis est le geste du jeu, et la livraison n'est pas
// constructible — elle ne peut donc pas manquer.
export const OUVERT_AU_DEPART = ['convoyeur'];
