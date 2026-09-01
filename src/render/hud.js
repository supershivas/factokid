// HUD : compteurs. Icônes et chiffres uniquement, aucun mot à lire.

import {
  PALETTE, LARGEUR_LOGIQUE, GRILLE_Y, LIGNES, CELLULE, TEXTE_GRAND, TEXTE_PETIT,
  BOUTON, BULLE, rectBouton, rectBulle,
} from '../design.js';
import { ICONES, INTERFACE, spriteItem, TAILLE_ITEM } from './sprites.js';

import { nombreItems } from '../sim/world.js';

// Fonte bitmap 3 × 5, chiffres seuls.
const CHIFFRES = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '001', '001', '001'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
};

export function largeurNombre(valeur, echelle) {
  return String(valeur).length * 4 * echelle - echelle;
}

export function dessinerNombre(ctx, valeur, x, y, echelle, couleur) {
  ctx.fillStyle = couleur;
  let ox = x;
  for (const c of String(valeur)) {
    const glyphe = CHIFFRES[c];
    if (glyphe) {
      for (let ly = 0; ly < 5; ly++) {
        for (let lx = 0; lx < 3; lx++) {
          if (glyphe[ly][lx] === '1') ctx.fillRect(ox + lx * echelle, y + ly * echelle, echelle, echelle);
        }
      }
    }
    ox += 4 * echelle;
  }
}

export function dessinerHud(ctx, monde, fps, interfaceJeu) {
  const assembleur = monde.machines.find((m) => m.recette);
  const consommateur = monde.machines.find((m) => m.def.entree);

  // Bandeau haut : items en circulation, et fréquence d'images.
  ctx.drawImage(spriteItem('moteur'), 12, 24, TAILLE_ITEM, TAILLE_ITEM);
  dessinerNombre(ctx, nombreItems(monde), 12 + TAILLE_ITEM + 9, 21, TEXTE_GRAND, PALETTE.creme);

  const largeurFps = largeurNombre(fps, TEXTE_PETIT);
  ctx.fillStyle = fps >= 55 ? PALETTE.vert : PALETTE.rouge;
  ctx.fillRect(LARGEUR_LOGIQUE - 12 - largeurFps - 14, 26, 8, 8);
  dessinerNombre(ctx, fps, LARGEUR_LOGIQUE - 12 - largeurFps, 24, TEXTE_PETIT, PALETTE.creme);

  // Bandeau bas : la barre d'outils à gauche, les compteurs à droite.
  const basY = GRILLE_Y + LIGNES * CELLULE + 24;
  ctx.drawImage(ICONES.assembleur, 140, basY - 8, 32, 32);
  dessinerNombre(ctx, assembleur.produits, 180, basY, TEXTE_PETIT, PALETTE.jaune);

  const largeurC = largeurNombre(consommateur.consommes, TEXTE_PETIT);
  ctx.drawImage(ICONES.consommateur, LARGEUR_LOGIQUE - 44, basY - 8, 32, 32);
  dessinerNombre(ctx, consommateur.consommes, LARGEUR_LOGIQUE - 52 - largeurC, basY, TEXTE_PETIT, PALETTE.vert);

  dessinerOutils(ctx, interfaceJeu);

  // Séparations discrètes des bandeaux.
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(12, GRILLE_Y - 10, LARGEUR_LOGIQUE - 24, 1);
  ctx.fillRect(12, GRILLE_Y + LIGNES * CELLULE + 10, LARGEUR_LOGIQUE - 24, 1);
}

// Barre d'outils, et bulles des éléments constructibles qui en sortent.
function dessinerOutils(ctx, interfaceJeu) {
  for (let i = 0; i < interfaceJeu.boutons.length; i++) {
    const r = rectBouton(i);
    const b = interfaceJeu.boutons[i];
    ctx.drawImage(b.actif ? INTERFACE.boutonActif : INTERFACE.bouton, r.x, r.y, r.l, r.h);
    ctx.drawImage(INTERFACE[b.icone], r.x, r.y, r.l, r.h);
  }

  if (interfaceJeu.menu <= 0 || !interfaceJeu.ancre) return;

  // Le plateau s'assombrit : les bulles se lisent comme un choix posé
  // par-dessus le jeu, pas comme une pièce de plus sur la grille.
  ctx.globalAlpha = 0.55 * interfaceJeu.menu;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, GRILLE_Y + LIGNES * CELLULE);
  ctx.globalAlpha = 1;

  // Ease in : la bulle part lentement du bouton et finit vite à sa place.
  const p = interfaceJeu.menu * interfaceJeu.menu;
  for (let j = 0; j < interfaceJeu.bulles.length; j++) {
    const r = rectBulle(interfaceJeu.ancre, j, p);
    const taille = Math.round(BULLE * p);
    const dx = Math.round(r.x + (BULLE - taille) / 2);
    const dy = Math.round(r.y + (BULLE - taille) / 2);
    ctx.drawImage(INTERFACE.bulleFond, dx, dy, taille, taille);
    ctx.drawImage(INTERFACE[interfaceJeu.bulles[j].icone], dx, dy, taille, taille);
  }
}
