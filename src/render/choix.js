// L'écran des essais de la bêta : par quoi commencer. Ne modifie jamais
// l'état — l'entrée dit ce qui est proposé, le rendu le dessine.
//
// Des plaques de même largeur, une image chacune : on choisit à l'image, le
// mot n'est là que pour l'adulte. Trois essais, et une quatrième touche en
// tête quand une partie attend d'être reprise — celle-là porte un signe et
// non une bulle : reprendre est une commande, pas une chose du monde.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, CELLULE, TEXTE_PETIT, rectChoix,
} from '../design.js';
import { spriteItem, dessinerPastille } from './sprites.js';
import { estSigne, dessinerSigne } from './signes.js';
import { dessinerPilule, teinteDe } from './plaque.js';
import { enfoncement } from './bouton.js';
import { dessinerMot, dessinerMotCentre, largeurMot } from './texte.js';

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
    const teinte = teinteDe(c.couleur);
    const dy = dessinerPilule(ctx, r, { teinte, enfonce: enfoncement('essai:' + j) });
    const y = r.y + dy + (r.h - CELLULE) / 2;
    // Une commande est une courbe, une chose du monde reste du pixel art :
    // c'est la même frontière que partout ailleurs.
    if (estSigne(c.icone)) dessinerSigne(ctx, c.icone, r.x + 14, y, CELLULE, teinte.signe);
    else dessinerPastille(ctx, c.icone, r.x + 14, y, CELLULE);
    dessinerMotCentre(
      ctx, c.nom, r.x + 14 + CELLULE + 14, r.y + dy + r.h / 2, TEXTE_PETIT, teinte.signe,
    );
  }
}
