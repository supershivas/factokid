// Table des machines et du convoyeur. Aucune logique ici.
// Toute constante de gameplay vit dans ce dossier.

export const MACHINES = {
  producteur: {
    id: 'producteur',
    ticksParItem: 30,   // un item toutes les 30 ticks (0,5 s à 60 Hz)
                        // reste sous le débit du convoyeur (2,25 items/s)
    sortie: 'boulon',
  },
  consommateur: {
    id: 'consommateur',
    ticksParItem: 60,   // moitié du producteur : le convoyeur sature
    entree: 'boulon',
    capacite: 4,
  },
  convoyeur: {
    id: 'convoyeur',
    vitesse: 36,        // unités logiques par seconde
    espacement: 16,     // distance minimale entre deux items
  },
};

export const TICKS_PAR_SECONDE = 60;
