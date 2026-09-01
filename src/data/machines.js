// Table des machines et du convoyeur. Aucune logique ici.
// Toute constante de gameplay vit dans ce dossier.

export const MACHINES = {
  teleporteur: {
    id: 'teleporteur',
    nom: 'téléporteur',
    source: true,       // rempli par sa carte, jamais par un tapis
    capacite: 8,
    ticksParItem: 20,   // cadence à laquelle il verse sur le tapis
  },
  trieur: {
    id: 'trieur',
    nom: 'trieur',
    tri: true,          // deux sorties : la matière choisie, et tout le reste
    triables: ['sucre', 'caramel', 'fraise', 'menthe'],
    triDefaut: 'fraise',
    capacite: 6,        // file d'attente mélangée
    ticksParItem: 15,
  },
  confiserie: {
    id: 'confiserie',
    nom: 'confiserie',
    recette: 'bonbon',
    capacite: 4,
  },
  livraison: {
    id: 'livraison',
    nom: 'livraison',
    entree: 'bonbon',
    ticksParItem: 60,
    capacite: 4,
  },
  chaufferie: {
    id: 'chaufferie',
    nom: 'chaufferie',
    recette: 'caramel',   // le sucre y fond
    capacite: 4,
  },
  mine: {
    id: 'mine',
    nom: 'mine',
    mine: true,           // se remplit du gisement qu'elle occupe
    capacite: 4,
    ticksParItem: 20,     // cadence à laquelle elle verse sur le tapis
  },
  sortieCarte: {
    id: 'sortieCarte',
    nom: 'téléporteur',
    accepteTout: true,    // tout ce qu'on lui apporte part vers l'usine
    capacite: 8,
  },
  convoyeur: {
    id: 'convoyeur',
    nom: 'convoyeur',
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
