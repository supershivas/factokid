// Table des machines et du convoyeur. Aucune logique ici.
// Toute constante de gameplay vit dans ce dossier.

export const MACHINES = {
  teleporteur: {
    id: 'teleporteur',
    nom: 'téléporteur',
    source: ['boulon', 'plaque'], // rempli par les cartes, jamais par un tapis
    capacite: 8,
    ticksParItem: 20,             // cadence à laquelle il verse sur le tapis
  },
  trieur: {
    id: 'trieur',
    nom: 'trieur',
    tri: ['boulon', 'plaque'],    // une sortie par matière rangée
    capacite: 4,
    ticksParItem: 15,
  },
  assembleur: {
    id: 'assembleur',
    nom: 'assembleur',
    recette: 'moteur',  // a + b = c
    capacite: 4,
  },
  consommateur: {
    id: 'consommateur',
    nom: 'livraison',
    entree: 'moteur',
    ticksParItem: 60,
    capacite: 4,
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
