// Boucle à pas fixe, découplée du rendu. Le débit ne dépend ni de la machine
// ni du taux de rafraîchissement.

import { TICKS_PAR_SECONDE } from './data/machines.js';

const PAS = 1 / TICKS_PAR_SECONDE;
const RETARD_MAX = 0.25; // au-delà, on abandonne le retard plutôt que spiraler

export function demarrerBoucle(maj, rendu) {
  let precedent = performance.now();
  let accumulateur = 0;
  let fps = 0;
  let images = 0;
  let compteurFps = 0;

  function image(maintenant) {
    let ecoule = (maintenant - precedent) / 1000;
    precedent = maintenant;
    if (ecoule > RETARD_MAX) ecoule = RETARD_MAX;

    accumulateur += ecoule;
    while (accumulateur >= PAS) {
      maj(PAS);
      accumulateur -= PAS;
    }

    images++;
    compteurFps += ecoule;
    if (compteurFps >= 0.5) {
      fps = Math.round(images / compteurFps);
      images = 0;
      compteurFps = 0;
    }

    rendu(fps);
    requestAnimationFrame(image);
  }

  requestAnimationFrame(image);
}
