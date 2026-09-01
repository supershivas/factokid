// L'écrasement élastique d'un bouton d'outil qu'on vient de toucher. Pure
// présentation : la simulation n'en sait rien, et le rendu ne fait que lire.

const DUREE = 0.7;
const appuis = new Map();

export function marquerAppui(i) {
  appuis.set(i, 0);
}

export function majAppuis(dt) {
  for (const [i, age] of appuis) {
    const suivant = age + dt;
    if (suivant >= DUREE) appuis.delete(i);
    else appuis.set(i, suivant);
  }
}

// Facteurs d'échelle du bouton : il s'aplatit d'un coup, puis rebondit sur un
// ressort qui s'éteint. Largeur et hauteur varient à l'inverse l'une de
// l'autre : la touche garde son volume.
export function ecrasement(i) {
  const age = appuis.get(i);
  if (age === undefined) return null;
  const k = Math.exp(-9 * age) * Math.cos(24 * age);
  return { x: 1 + 0.3 * k, y: 1 - 0.3 * k };
}
