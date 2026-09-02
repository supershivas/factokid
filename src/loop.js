// Boucle à pas fixe, découplée du rendu. Le débit ne dépend ni de la machine
// ni du taux de rafraîchissement.
//
// La simulation continue quand la fenêtre n'est pas visible : requestAnimationFrame
// s'arrête alors, un pas grossier prend le relais, et le temps qu'aucun des deux
// n'a couvert (onglet gelé) est rattrapé au retour.

import { TICKS_PAR_SECONDE, RATTRAPAGE_MAX, PERIODE_HORS_ECRAN } from './data/machines.js';

const PAS = 1 / TICKS_PAR_SECONDE;

// Retard maximal rattrapé en une image. Sans ce plafond, une image longue —
// une destruction en rafale, un ramasse-miettes — fait grossir l'accumulateur,
// l'image suivante simule davantage, donc dure plus longtemps encore : la
// boucle s'emballe et ne revient jamais. Le retard au-delà est abandonné.
const PLAFOND_IMAGE = 0.25; // secondes, soit quinze pas

export function demarrerBoucle(maj, rendu) {
  let precedent = performance.now();
  let accumulateur = 0;
  let horsEcran = null;
  let fps = 0;
  let images = 0;
  let compteurFps = 0;

  function avancer(maintenant, plafond) {
    const ecoule = Math.min((maintenant - precedent) / 1000, plafond);
    precedent = maintenant;
    accumulateur += ecoule;
    while (accumulateur >= PAS) {
      maj(PAS);
      accumulateur -= PAS;
    }
    return ecoule;
  }

  function image(maintenant) {
    const ecoule = avancer(maintenant, PLAFOND_IMAGE);

    images++;
    compteurFps += ecoule;
    if (compteurFps >= 0.5) {
      fps = Math.round(images / compteurFps);
      images = 0;
      compteurFps = 0;
    }

    rendu(fps, ecoule);
    if (!document.hidden) requestAnimationFrame(image);
  }

  function visibilite() {
    if (document.hidden) {
      // Plus rien à dessiner : on simule seulement, à pas grossier.
      if (horsEcran === null) {
        horsEcran = setInterval(
          () => avancer(performance.now(), RATTRAPAGE_MAX), PERIODE_HORS_ECRAN,
        );
      }
      return;
    }
    clearInterval(horsEcran);
    horsEcran = null;
    // Retour à l'écran : le temps qu'aucun des deux n'a couvert se rattrape
    // ici, en une fois, dans la limite prévue.
    avancer(performance.now(), RATTRAPAGE_MAX);
    images = 0;
    compteurFps = 0;
    requestAnimationFrame(image);
  }

  document.addEventListener('visibilitychange', visibilite);
  visibilite();
}
