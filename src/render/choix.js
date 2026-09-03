// L'écran des essais de la bêta : par quoi commencer. Ne modifie jamais
// l'état — l'entrée dit ce qui est proposé, le rendu le dessine.
//
// Trois plaques de même largeur, une image chacune : on choisit à l'image, le
// mot n'est là que pour l'adulte.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, CELLULE, TEXTE_PETIT, rectChoix,
} from '../design.js';
import { spriteItem, dessinerPastille } from './sprites.js';
import { dessinerMot, largeurMot } from './texte.js';

export function dessinerChoix(ctx, interfaceJeu) {
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);

  // Le bonbon en haut : c'est ce qu'on vient faire ici, essai ou pas.
  ctx.drawImage(spriteItem('bonbon'), Math.round(LARGEUR_LOGIQUE / 2 - 27), 140, 54, 54);
  const titre = 'choisis un essai';
  dessinerMot(
    ctx, titre, Math.round((LARGEUR_LOGIQUE - largeurMot(titre, TEXTE_PETIT)) / 2), 212,
    TEXTE_PETIT, PALETTE.ardoise,
  );

  for (let j = 0; j < interfaceJeu.choix.length; j++) {
    const r = rectChoix(j);
    const c = interfaceJeu.choix[j];
    ctx.fillStyle = PALETTE.creme;
    ctx.fillRect(r.x, r.y, r.l, r.h);
    dessinerPastille(ctx, c.icone, r.x + 12, r.y + (r.h - CELLULE) / 2, CELLULE);
    dessinerMot(
      ctx, c.nom, r.x + 12 + CELLULE + 12, r.y + r.h / 2 - 5, TEXTE_PETIT, PALETTE.noir,
    );
  }
}
