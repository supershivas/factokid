// L'appui d'une touche : elle s'enfonce sur sa doublure, puis remonte. Pure
// présentation — la simulation n'en sait rien, et le rendu ne fait que lire.
//
// C'était un écrasement élastique, du temps des plaques carrées : une plaque
// sans dessous ne peut que se déformer. Une touche ronde posée sur sa doublure
// a une course, et c'est cette course qu'on joue — le bouton descend d'un
// coup, comme sous le doigt, puis remonte sur un ressort qui dépasse un peu.
//
// Les touches se désignent par une clé quelconque : « outil:1 », « menu:2 »,
// « option:0 ». Un seul système d'appui pour tous les boutons du jeu.

const DUREE = 0.5;      // secondes, le temps que dure la réponse
const DESCENTE = 0.06;  // secondes au fond, avant de remonter

const appuis = new Map();

export function marquerAppui(cle) {
  appuis.set(cle, 0);
}

export function majAppuis(dt) {
  for (const [cle, age] of appuis) {
    const suivant = age + dt;
    if (suivant >= DUREE) appuis.delete(cle);
    else appuis.set(cle, suivant);
  }
}

// De 1 (au fond, posée sur sa doublure) à 0 (au repos). La remontée passe
// brièvement sous zéro : la touche dépasse d'un pixel avant de se poser.
export function enfoncement(cle) {
  const age = appuis.get(cle);
  if (age === undefined) return 0;
  if (age < DESCENTE) return 1;
  const t = age - DESCENTE;
  return Math.exp(-13 * t) * Math.cos(19 * t);
}
