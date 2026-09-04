// Le tutoriel : où en est le premier contact. Lit le monde, ne le change
// jamais, et ne dessine rien — render/tutoriel.js s'en charge.
//
// C'est un système de plus, assumé : il n'existe que pour la première partie,
// et il grossit par la table data/tutoriel.js, jamais par du code. Une étape
// de plus y est une entrée de plus.
//
// Il mène jusqu'à l'usine qui tourne : la dernière étape est le premier bonbon
// livré. Qui n'en veut pas le passe — `passer()` — et se retrouve devant une
// carte nue, libre.

import { TUTORIEL } from './data/tutoriel.js';
import { machineEn } from './sim/scene.js';

// Ce que chaque épreuve reconnaît dans le monde. Une épreuve ne regarde jamais
// le geste, seulement son résultat : l'enfant qui arrive au but autrement a
// gagné pareil.
const EPREUVES = {
  extracteur: (monde, etape) => {
    const m = machineEn(monde.scene, etape.cible.cx, etape.cible.cy);
    return Boolean(m && m.def.mine);
  },
  machine: (monde, etape) => {
    const m = machineEn(monde.scene, etape.cible.cx, etape.cible.cy);
    return Boolean(m && m.type === etape.machine);
  },
  lien: (monde, etape) => relie(monde, etape.de, etape.a),
  livre: (monde) => monde.scene.machines.some((m) => m.def.entree && m.consommes > 0),
};

// Des tapis mènent-ils d'une machine à l'autre ? On part de ses sorties et on
// suit ce qu'elles alimentent, branches comprises : peu importe le chemin
// choisi, seul compte que la matière puisse arriver.
function relie(monde, de, a) {
  const source = machineEn(monde.scene, de.cx, de.cy);
  const cible = machineEn(monde.scene, a.cx, a.cy);
  if (!source || !cible) return false;
  const vus = new Set();
  const pile = [...source.sorties];
  while (pile.length > 0) {
    const convoyeur = pile.pop();
    if (vus.has(convoyeur)) continue;
    vus.add(convoyeur);
    if (convoyeur.cible === cible) return true;
    for (const suite of convoyeur.sorties) pile.push(suite);
  }
  return false;
}

// Le temps que la dernière étape reste affichée, une fois réussie : de quoi
// voir que c'était ça, avant que le bandeau s'efface.
const SALUT = 3; // secondes

export function creerTutoriel() {
  return { etape: 0, age: 0, fini: false, salut: 0 };
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
  if (!etape || !EPREUVES[etape.epreuve](monde, etape)) return null;

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

// Où l'on en est, de 0 à 1 : la barre du bandeau, et rien d'autre.
export function avancement(tutoriel) {
  if (!tutoriel) return 0;
  return Math.min(1, tutoriel.etape / TUTORIEL.length);
}

// Passer : on ne guide plus, et la partie continue telle qu'elle est. Rien
// n'est posé à la place du joueur — il reste maître de sa carte.
export function passerTutoriel(tutoriel) {
  if (!tutoriel) return;
  tutoriel.fini = true;
}

export function tutorielReussi(tutoriel) {
  return Boolean(tutoriel) && tutoriel.etape >= TUTORIEL.length;
}
