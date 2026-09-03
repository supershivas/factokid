// Le tutoriel : où en est le premier contact. Lit le monde, ne le change
// jamais, et ne dessine rien — render/tutoriel.js s'en charge.
//
// C'est un système de plus, assumé : il n'existe que pour la première partie,
// et il grossit par la table data/tutoriel.js, jamais par du code. Une étape
// de plus y est une entrée de plus.

import { TUTORIEL } from './data/tutoriel.js';

// Ce que chaque épreuve reconnaît dans le monde. Une épreuve ne regarde jamais
// le geste, seulement son résultat : l'enfant qui arrive au but autrement a
// gagné pareil.
const EPREUVES = {
  extracteur: (monde) => monde.scene.machines.some((m) => m.def.mine),
  chaufferie: (monde) => monde.scene.machines.some((m) => m.type === 'chaufferie'),
  tapis: (monde) => monde.scene.convoyeurs.length > 0,
  // Une machine garde tout tant que rien ne la vide : c'est la leçon de
  // l'étape, et c'est le tapis de sortie qui la donne.
  sortie: (monde) => monde.scene.machines.some(
    (m) => m.type === 'chaufferie' && m.sorties.length > 0,
  ),
  caramel: (monde) => monde.scene.machines.some(
    (m) => m.recette && m.recette.sortie === 'caramel' && m.produits > 0,
  ),
};

// Le temps que la dernière étape reste affichée, une fois réussie : de quoi
// voir que c'était ça, avant que le bandeau s'efface.
const SALUT = 2.5; // secondes

export function creerTutoriel() {
  return { etape: 0, age: 0, fini: false, salut: 0, celebre: null };
}

// Avance d'une étape dès qu'elle est réussie. Rend la cellule à fêter, s'il y
// en a une : le rendu y jette ses étoiles, la simulation n'en sait rien.
export function majTutoriel(tutoriel, monde, dt) {
  if (!tutoriel || tutoriel.fini) return null;
  tutoriel.age += dt;

  if (tutoriel.salut > 0) {
    tutoriel.salut -= dt;
    if (tutoriel.salut <= 0) tutoriel.fini = true;
    return null;
  }

  const etape = TUTORIEL[tutoriel.etape];
  if (!etape || !EPREUVES[etape.epreuve](monde)) return null;

  const fetee = etape.cibles[etape.cibles.length - 1];
  tutoriel.etape++;
  tutoriel.age = 0;
  if (tutoriel.etape >= TUTORIEL.length) tutoriel.salut = SALUT;
  return fetee;
}

// L'étape en cours, ou null quand tout est appris.
export function etapeCourante(tutoriel) {
  if (!tutoriel || tutoriel.fini) return null;
  return TUTORIEL[Math.min(tutoriel.etape, TUTORIEL.length - 1)];
}

export function tutorielReussi(tutoriel) {
  return Boolean(tutoriel) && tutoriel.etape >= TUTORIEL.length;
}
