// Table des scénarios d'essai de la bêta. Aucune logique ici.
//
// **Deux essais, et pas trois.** À la première connexion, on choisit entre le
// jeu — celui des murs, avec son premier contact — et l'ancien jeu ouvert, où
// tout est déjà franchi. Un scénario n'est qu'une disposition de départ, plus
// le tutoriel ou non, plus la graine de sa carte.
//
// L'usine qui tourne n'est plus un essai : elle est exactement ce que le
// tutoriel bâtit, et la proposer toute faite à côté de lui offrait deux portes
// pour la même pièce. Elle reste dans `data/depart.js`, où les outils la
// jouent — c'est la mesure de l'économie.
//
// **`graine` est nulle partout : la carte de chaque étage est tirée à chaque
// partie.** La nouvelle partie en portait une, fixe, du temps où l'on
// vérifiait à la main que le tirage laissait le tutoriel tranquille. Ce n'est
// plus nécessaire : `sim/carte.js` refuse de semer sur les cases du premier
// contact, et le pied du monde ne change jamais — ses trois gisements sont
// écrits. Deux parties ne se ressemblent donc plus, et un mur qu'on ouvre
// donne un étage qu'on n'a jamais vu.
//
// Les outils, eux, passent leur graine à `creerMonde` : ce qu'ils mesurent
// reste reproductible.
//
// `etageOuvert` dit jusqu'où les murs sont déjà tombés. On commence en bas —
// c'est le jeu — sauf au jeu ouvert, qui ouvre tout.

import { DEPART_NU, DEPART_LIBRE } from './depart.js';

export const SCENARIOS = [
  {
    id: 'nouvelle',
    nom: 'nouvelle partie',
    icone: 'bulleExtracteur',
    couleur: 'vert',
    disposition: DEPART_NU,
    tutoriel: true,
    graine: null, // une carte neuve à chaque partie
    etageOuvert: 1,
  },
  {
    id: 'ouvert',
    nom: 'jeu ouvert',
    icone: 'bulleConvoyeur',
    couleur: 'bleu',
    disposition: DEPART_LIBRE,
    tutoriel: false,
    graine: null,
    etageOuvert: 5, // tout est franchi : c'est l'ancien jeu
  },
];
