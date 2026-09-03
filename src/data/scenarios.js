// Table des scénarios d'essai de la bêta. Aucune logique ici.
//
// À la première connexion, on choisit par quoi commencer : découvrir le jeu,
// éprouver une usine qui tourne déjà, ou bâtir sur une carte nue. Un scénario
// n'est qu'une disposition de départ, plus le tutoriel ou non.

import { DEPART, DEPART_NU } from './depart.js';

export const SCENARIOS = [
  {
    id: 'nouvelle',
    nom: 'nouvelle partie',
    icone: 'bulleExtracteur',
    disposition: DEPART_NU,
    tutoriel: true,
  },
  {
    id: 'usine',
    nom: 'usine qui tourne',
    icone: 'bulleConfiserie',
    disposition: DEPART,
    tutoriel: false,
  },
  {
    id: 'bac',
    nom: 'bac à sable',
    icone: 'bulleConvoyeur',
    disposition: DEPART_NU,
    tutoriel: false,
  },
];
