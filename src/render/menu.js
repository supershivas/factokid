// Le menu pause et la page des recettes. Ne modifie jamais l'état : l'entrée
// dit ce qui est ouvert, le rendu le dessine.
//
// Les boutons ont tous la même largeur : à cet âge, un bouton plus large se lit
// comme un bouton plus important, et aucun ne l'est plus qu'un autre.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, CELLULE, TEXTE_PETIT, rectMenu,
} from '../design.js';
import { RECETTES } from '../data/recipes.js';
import { ITEMS } from '../data/items.js';
import { MACHINES } from '../data/machines.js';
import { ICONES, INTERFACE, spriteItem } from './sprites.js';
import { dessinerMot } from './texte.js';

// L'item est dessiné sur 6 pixels d'art : ×4 le porte à 24, échelle entière.
const ITEM_RECETTE = 24;

// Quelle machine fait quelle recette : la page des recettes le dit en montrant
// la machine elle-même, jamais son nom seul.
const MACHINE_DE = {};
for (const def of Object.values(MACHINES)) {
  if (def.recette) MACHINE_DE[def.recette] = def.id;
}

function voile(ctx) {
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
}

function bouton(ctx, r, icone, nom) {
  ctx.fillStyle = PALETTE.creme;
  ctx.fillRect(r.x, r.y, r.l, r.h);
  const sprite = INTERFACE[icone] || ICONES[icone] || spriteItem(icone);
  if (sprite) ctx.drawImage(sprite, r.x + 8, r.y + 4, r.h - 8, r.h - 8);
  dessinerMot(ctx, nom, r.x + r.h + 8, r.y + r.h / 2 - 5, TEXTE_PETIT, PALETTE.noir);
}

export function dessinerMenu(ctx, interfaceJeu) {
  if (!interfaceJeu.menuPause) return;
  voile(ctx);
  if (interfaceJeu.menuPause === 'recettes') { dessinerRecettes(ctx); return; }
  for (let j = 0; j < interfaceJeu.boutonsMenu.length; j++) {
    const b = interfaceJeu.boutonsMenu[j];
    bouton(ctx, rectMenu(j), b.icone, b.nom);
  }
}

// Une recette par ligne : ce qui entre, la machine qui la fait, ce qui sort.
// Rien à lire pour comprendre — les formes suffisent.
function dessinerRecettes(ctx) {
  const recettes = Object.values(RECETTES);
  const hauteur = 96;
  const y0 = (HAUTEUR_LOGIQUE - recettes.length * hauteur) / 2;

  for (let i = 0; i < recettes.length; i++) {
    const r = recettes[i];
    const y = y0 + i * hauteur;
    const entrees = Object.keys(r.entrees);

    let x = 24;
    for (let k = 0; k < entrees.length; k++) {
      if (k > 0) { plus(ctx, x + 2, y + 20); x += 20; }
      // Pas de nom sous les ingrédients : à trois par ligne, ils se
      // chevauchent, et c'est la forme qui doit parler de toute façon.
      ctx.drawImage(spriteItem(entrees[k]), x, y + 12, ITEM_RECETTE, ITEM_RECETTE);
      x += ITEM_RECETTE + 8;
    }

    fleche(ctx, x + 6, y + 20);
    x += 30;

    const machine = MACHINE_DE[r.id];
    if (machine) ctx.drawImage(ICONES[machine], x, y + 4, CELLULE, CELLULE);
    dessinerMot(
      ctx, MACHINES[machine].nom, x - 4, y + 56, TEXTE_PETIT, PALETTE.ardoise,
    );
    x += CELLULE + 8;

    fleche(ctx, x, y + 20);
    x += 30;

    ctx.drawImage(spriteItem(r.sortie), x, y + 12, ITEM_RECETTE, ITEM_RECETTE);
    dessinerMot(ctx, ITEMS[r.sortie].nom, x - 6, y + 40, TEXTE_PETIT, PALETTE.creme);
  }
}

function fleche(ctx, x, y) {
  ctx.fillStyle = PALETTE.creme;
  ctx.fillRect(x, y + 4, 12, 3);
  for (let i = 0; i < 4; i++) ctx.fillRect(x + 9 + i, y + 1 + i, 3, 3 - i + 2);
}

function plus(ctx, x, y) {
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(x + 5, y, 3, 11);
  ctx.fillRect(x + 1, y + 4, 11, 3);
}
