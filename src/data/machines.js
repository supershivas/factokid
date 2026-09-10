import { LIVRABLES } from './items.js';

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
//
// `capacite` a doublé : une machine tient maintenant huit pièces au lieu de
// quatre, et le trieur douze au lieu de six. Une chaîne encaisse donc un
// à-coup deux fois plus long avant de se signaler — et les jauges sont
// devenues des barres, qui ne se comptent plus une par une.

export const MACHINES = {
  trieur: {
    id: 'trieur',
    description: 'range une matière, le reste à part',
    nom: 'trieur',
    a: 'au ',
    tri: true,          // deux sorties : la matière choisie, et tout le reste
    triables: ['sucre', 'bois', 'fraise', 'menthe'],
    triDefaut: 'sucre',
    capacite: 12,       // file d'attente mélangée
    ticksParItem: 15,
  },
  confiserie: {
    id: 'confiserie',
    description: 'assemble la {pastille} avec du {caramel}, une {fraise} et de la {menthe}',
    nom: 'confiserie',
    a: 'à la ',
    recette: 'pastille',
    vapeur: true,       // souffle en sortant sa pastille
    capacite: 8,
  },
  plieuse: {
    id: 'plieuse',
    description: 'plie le {papier} autour de la {pastille}',
    nom: 'plieuse',
    a: 'à la ',
    // Elle sait faire trois bonbons des mêmes deux matières, et c'est le
    // joueur qui choisit lequel, depuis son panneau — comme un trieur choisit
    // sa matière. Les trois recettes ont les mêmes entrées : changer d'avis ne
    // jette donc jamais un stock.
    recettes: ['bonbon', 'coeur', 'berlingot'],
    recette: 'bonbon',  // celle qu'elle emballe au sortir de sa caisse
    vapeur: true,       // souffle en sortant son bonbon
    capacite: 8,
  },
  // La réception du mur : trois cases au milieu de sa rangée. Elle ne se
  // construit pas et ne se détruit pas — elle appartient au mur, elle arrive
  // et repart avec lui.
  //
  // **C'est elle qui achète, maintenant.** Il y avait deux endroits où porter
  // ce qu'on produisait — la livraison, qui payait, et la réception, qui
  // comptait pour le mur — et un enfant devait choisir entre les deux sans
  // qu'on lui ait jamais dit pourquoi. Il n'y a plus qu'une adresse : elle
  // paie ce qu'elle prend, et ce qui intéresse le mur monte sa jauge au
  // passage. Un seul geste, deux effets.
  //
  // Elle prend donc tout ce que la table des livrables nomme, plus ce que son
  // mur réclame quand ce n'est pas de la même famille — une fraise ne se vend
  // pas, mais un mur peut en vouloir.
  recepteur: {
    id: 'recepteur',
    description: 'achète le {caramel}, la {pastille} et les {bonbon|bonbons}',
    nom: 'réception',
    a: 'à la ',
    recepteur: true,
    largeur: 3,        // en cellules, à cheval sur le milieu du mur
    entrees: Object.keys(LIVRABLES),
    capacite: 8,
    ticksParItem: 6,   // elle avale vite : ce n'est pas elle le goulot
  },
  scierie: {
    id: 'scierie',
    description: 'débite le {bois} en {papier}',
    nom: 'scierie',
    a: 'à la ',
    recette: 'papier',
    vapeur: true,       // souffle sa sciure en sortant sa feuille
    capacite: 8,
  },
  chaufferie: {
    id: 'chaufferie',
    description: 'fait fondre le {sucre} en {caramel}',
    nom: 'chaufferie',
    a: 'à la ',
    recette: 'caramel',   // le sucre y fond
    capacite: 8,
  },
  extracteur: {
    id: 'extracteur',
    description: 'récolte {matiere} de son gisement, tout seul',
    nom: 'extracteur',
    a: 'à l’',
    mine: true,           // se remplit du gisement qu'il occupe
    capacite: 8,
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
