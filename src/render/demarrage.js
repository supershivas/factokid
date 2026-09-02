// L'écran de démarrage : une barre qui se remplit pendant que le jeu se
// prépare. Pure présentation.
//
// Le jeu n'a rien de lourd à charger — pas d'image à télécharger, tout est
// peint au démarrage. La barre montre donc la préparation réelle (l'atlas des
// tuiles, puis le monde), et tient un minimum de temps à l'écran pour qu'on la
// voie : elle ne ment jamais sur la fin, elle attend seulement d'être vue.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, PIXEL,
} from '../design.js';

const DUREE_MINIMALE = 0.9; // secondes
const BARRE = { l: 216, h: 12 };

export function creerDemarrage(etapes) {
  return { etapes, faites: 0, age: 0, fini: false };
}

export function avancerDemarrage(demarrage, dt) {
  demarrage.age += dt;
  if (demarrage.faites >= demarrage.etapes && demarrage.age >= DUREE_MINIMALE) {
    demarrage.fini = true;
  }
  return demarrage.fini;
}

export function dessinerDemarrage(ctx, demarrage, bonbon) {
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);

  // Un bonbon au-dessus de la barre : c'est ce qu'on vient faire ici.
  const cx = LARGEUR_LOGIQUE / 2;
  // Le bonbon fait 9 pixels d'art : ×5 le porte à 45, échelle entière.
  ctx.drawImage(bonbon, Math.round(cx - 22), 260, 45, 45);

  // La barre avance au plus lent des deux : le travail réellement fait, et le
  // temps minimal d'affichage. Elle n'annonce donc jamais une fin qui n'est pas
  // là, et ne saute jamais d'un coup à plein.
  const part = Math.min(
    demarrage.faites / demarrage.etapes, demarrage.age / DUREE_MINIMALE, 1,
  );
  const x = Math.round((LARGEUR_LOGIQUE - BARRE.l) / 2);
  const y = 340;
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(x - 2, y - 2, BARRE.l + 4, BARRE.h + 4);
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(x, y, BARRE.l, BARRE.h);
  // La barre avance par pixels d'art entiers : elle ne bave jamais.
  const rempli = Math.round((BARRE.l * part) / PIXEL) * PIXEL;
  ctx.fillStyle = PALETTE.creme;
  ctx.fillRect(x, y, rempli, BARRE.h);
}
