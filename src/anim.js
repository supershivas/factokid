// Animations d'interface, confiées à Motion — le cœur de Framer Motion, sans
// React ni bundler, rangé dans vendor/.
//
// Elles ne touchent que la présentation. La simulation garde son pas fixe :
// aucune valeur animée ici n'entre dans le débit du jeu.

import { animate } from '../vendor/framer-motion-dom.js';

const RESSORT = { type: 'spring', stiffness: 420, damping: 26, restDelta: 0.001 };

// Anime une valeur et la rend à chaque image. Renvoie de quoi l'interrompre.
export function ressort(depuis, vers, appliquer) {
  return animate(depuis, vers, { ...RESSORT, onUpdate: appliquer });
}
