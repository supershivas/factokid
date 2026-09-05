// Table des scénarios d'essai de la bêta. Aucune logique ici.
//
// À la première connexion, on choisit par quoi commencer : découvrir le jeu,
// éprouver une usine qui tourne déjà, ou bâtir sur une carte nue. Un scénario
// n'est qu'une disposition de départ, plus le tutoriel ou non, plus la graine
// de sa carte.
//
// `graine` nulle veut dire « tire-la » : le bac à sable a une carte différente
// à chaque fois. Les deux autres en portent une, fixe — le tutoriel montre des
// cellules précises, et l'usine de départ y est posée d'avance. La clairière
// du milieu, elle, ne change jamais, quelle que soit la graine.

import { DEPART, DEPART_NU } from './depart.js';

export const SCENARIOS = [
  {
    id: 'nouvelle',
    nom: 'nouvelle partie',
    icone: 'bulleExtracteur',
    disposition: DEPART_NU,
    tutoriel: true,
    graine: 1,
  },
  {
    id: 'usine',
    nom: 'usine qui tourne',
    icone: 'bulleConfiserie',
    disposition: DEPART,
    tutoriel: false,
    graine: 1,
  },
  {
    id: 'bac',
    nom: 'bac à sable',
    icone: 'bulleConvoyeur',
    disposition: DEPART_NU,
    tutoriel: false,
    graine: null, // une carte neuve à chaque essai
  },
];
