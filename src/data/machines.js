// Table des machines et du convoyeur. Aucune logique ici.
// Toute constante de gameplay vit dans ce dossier.
//
// Ce qui est entre accolades dans une description est *explicable* : le mot
// s'affiche souligné dans le panneau, et le toucher ouvre ce qu'il nomme.
// `{sucre}` affiche le nom de la matière, `{bonbon|bonbons}` affiche autre
// chose — un pluriel, un accord. `{matiere}` est la matière de la machine
// elle-même : ce que cet extracteur-là récolte.
//
// `a` est ce qui précède son nom quand on y envoie quelque chose — « à la »
// confiserie, « au » trieur —, écrit en toutes lettres comme les articles des
// matières : la phrase le prend tel quel plutôt que de deviner un genre.


export const MACHINES = {
  trieur: {
    id: 'trieur',
    description: 'range une matière, le reste à part',
    nom: 'trieur',
    a: 'au ',
    tri: true,          // deux sorties : la matière choisie, et tout le reste
    triables: ['sucre', 'bois', 'fraise', 'menthe'],
    triDefaut: 'sucre',
    capacite: 6,        // file d'attente mélangée
    ticksParItem: 15,
  },
  confiserie: {
    id: 'confiserie',
    description: 'assemble la {pastille} avec du {caramel}, une {fraise} et de la {menthe}',
    nom: 'confiserie',
    a: 'à la ',
    recette: 'pastille',
    vapeur: true,       // souffle en sortant sa pastille
    capacite: 4,
  },
  plieuse: {
    id: 'plieuse',
    description: 'plie le {papier} autour de la {pastille}',
    nom: 'plieuse',
    a: 'à la ',
    recette: 'bonbon',
    vapeur: true,       // souffle en sortant son bonbon
    capacite: 4,
  },
  livraison: {
    id: 'livraison',
    description: 'reçoit les {bonbon|bonbons} finis',
    nom: 'livraison',
    a: 'à la ',
    entree: 'bonbon',
    ticksParItem: 60,
    capacite: 4,
  },
  scierie: {
    id: 'scierie',
    description: 'débite le {bois} en {papier}',
    nom: 'scierie',
    a: 'à la ',
    recette: 'papier',
    vapeur: true,       // souffle sa sciure en sortant sa feuille
    capacite: 4,
  },
  chaufferie: {
    id: 'chaufferie',
    description: 'fait fondre le {sucre} en {caramel}',
    nom: 'chaufferie',
    a: 'à la ',
    recette: 'caramel',   // le sucre y fond
    capacite: 4,
  },
  extracteur: {
    id: 'extracteur',
    description: 'récolte {matiere} de son gisement, tout seul',
    nom: 'extracteur',
    a: 'à l’',
    mine: true,           // se remplit du gisement qu'il occupe
    capacite: 4,
    ticksParItem: 20,     // cadence à laquelle il verse sur le tapis
  },
  convoyeur: {
    id: 'convoyeur',
    description: 'transporte les matières',
    nom: 'convoyeur',
    a: 'au ',
    vitesse: 96,        // unités logiques par seconde, soit 2 cellules/s
    espacement: 27,     // distance minimale entre deux items : un demi-item de
                        // vide entre deux, la file reste lisible une par une
  },
};

export const TICKS_PAR_SECONDE = 60;

// La simulation continue quand la fenêtre n'est pas visible. Au retour, on
// rattrape au plus ce temps-là d'un coup : au-delà, on abandonne le retard
// plutôt que de figer l'écran pour rattraper une absence d'une heure.
export const RATTRAPAGE_MAX = 60;      // secondes
export const PERIODE_HORS_ECRAN = 250; // millisecondes entre deux pas hors écran
