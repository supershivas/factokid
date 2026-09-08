// Le menu pause et la page des recettes. Ne modifie jamais l'état : l'entrée
// dit ce qui est ouvert, le rendu le dessine.
//
// Les boutons ont tous la même largeur : à cet âge, un bouton plus large se lit
// comme un bouton plus important, et aucun ne l'est plus qu'un autre.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, CELLULE, TEXTE_PETIT, TEXTE_GRAND,
  COLLECTION, rectMenu, rectCollection,
} from '../design.js';
import { RECETTES } from '../data/recipes.js';
import { ITEMS, BONBONS } from '../data/items.js';
import { MACHINES } from '../data/machines.js';
import { VERSION } from '../data/version.js';
import { ICONES, INTERFACE, spriteItem, spriteItemEteint, spriteNomme } from './sprites.js';
import { dessinerPilule, dessinerTouche, teinteDe, CLAIRE, SOMBRE, PART_ITEM } from './plaque.js';
import { enfoncement } from './bouton.js';
import { estSigne, dessinerSigne } from './signes.js';
import {
  dessinerMot, dessinerMotCentre, dessinerNombre, largeurNombre, largeurMot,
} from './texte.js';

// L'item est dessiné sur 9 pixels d'art : ×3 le porte à 27, échelle entière.
const ITEM_RECETTE = 27;

// Quelle machine fait quelle recette : la page des recettes le dit en montrant
// la machine elle-même, jamais son nom seul.
const MACHINE_DE = {};
for (const def of Object.values(MACHINES)) {
  // Une machine sait parfois plusieurs recettes : la plieuse en sait trois, et
  // c'est elle qui figure sur les trois lignes.
  for (const id of def.recettes || []) MACHINE_DE[id] = def.id;
  if (def.recette) MACHINE_DE[def.recette] = def.id;
}

function voile(ctx) {
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
}

// Un bouton large : la même touche que partout ailleurs, allongée pour porter
// un mot. Elle s'enfonce sur sa doublure comme les rondes.
function bouton(ctx, r, icone, nom, cle, couleur) {
  const teinte = couleur ? teinteDe(couleur) : CLAIRE;
  const dy = dessinerPilule(ctx, r, { teinte, enfonce: enfoncement(cle) });
  const taille = r.h - 16;
  // Une commande est une courbe, une chose du monde reste du pixel art : la
  // pilule des recettes porte un bonbon, les quatre autres un signe.
  if (estSigne(icone)) {
    dessinerSigne(ctx, icone, r.x + 12, r.y + dy + 8, taille, teinte.signe);
  } else {
    const sprite = spriteNomme(icone);
    if (sprite) ctx.drawImage(sprite, r.x + 12, r.y + dy + 8, taille, taille);
  }
  dessinerMotCentre(ctx, nom, r.x + r.h + 8, r.y + dy + r.h / 2, TEXTE_PETIT, teinte.signe);
}

// Le numéro de version, en bas du menu pause. En petit et en ardoise : il ne
// s'adresse pas à l'enfant qui joue mais à l'adulte qui rapporte un problème,
// et c'est la seule page où on peut aller le chercher sans rien interrompre.
function version(ctx) {
  const mot = 'v' + VERSION;
  dessinerMot(
    ctx, mot, Math.round((LARGEUR_LOGIQUE - largeurMot(mot, TEXTE_PETIT)) / 2),
    HAUTEUR_LOGIQUE - 40, TEXTE_PETIT, PALETTE.ardoise,
  );
}

export function dessinerMenu(ctx, monde, interfaceJeu) {
  if (!interfaceJeu.menuPause) return;
  voile(ctx);
  if (interfaceJeu.menuPause === 'recettes') { dessinerRecettes(ctx); return; }
  if (interfaceJeu.menuPause === 'collection') { dessinerCollection(ctx, monde); return; }
  for (let j = 0; j < interfaceJeu.boutonsMenu.length; j++) {
    const b = interfaceJeu.boutonsMenu[j];
    bouton(ctx, rectMenu(j), b.icone, b.nom, 'menu:' + j, b.couleur);
  }
  version(ctx);
}

// Le livre des matières : les huit, dans l'ordre de la table. Celles qu'on a
// tenues une fois sont en couleur, les autres gardent leur silhouette éteinte.
// On reconnaît qu'il y a quelque chose là sans savoir encore quoi, et le jour
// où on l'obtient c'est la couleur qui arrive.
//
// Chacune est une touche : la toucher explique d'où la matière vient et où
// elle va, par-dessus le livre, sans le refermer.
function dessinerCollection(ctx, monde) {
  const items = Object.values(ITEMS);
  const trouvees = items.filter((i) => monde && monde.decouvertes[i.id]).length;
  compte(ctx, trouvees, items.length);

  // La vitrine : ce que la livraison a reçu, bonbon par bonbon. Il n'y a
  // qu'un compteur à l'écran — le total des bonbons finis — et c'est ici, au
  // livre, que le détail se lit.
  const livraison = monde && monde.scene.machines.find((m) => m.def.entrees);
  const recus = (livraison && livraison.recus) || {};

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const connue = Boolean(monde && monde.decouvertes[item.id]);
    const r = rectCollection(i);
    dessinerTouche(ctx, r, connue ? spriteItem(item.id) : spriteItemEteint(item.id), {
      teinte: SOMBRE,
      // Toutes au repos : l'enfoncement ne veut dire qu'une chose dans ce
      // jeu, et c'est « choisi ». Ce qui distingue une matière trouvée d'une
      // autre, c'est sa couleur — comme partout ailleurs.
      enfonce: enfoncement('collection:' + i),
      part: PART_ITEM,
      // Ce qu'on n'a pas trouvé s'efface un peu : la rangée reste lisible en
      // entier, et ce qu'on a se détache.
      alpha: connue ? 1 : 0.45,
    });
    // Un bonbon livré porte son compte à la place de son nom : c'est ce qu'on
    // vient voir, et le nom est juste au-dessus, sur sa forme.
    const n = recus[item.id];
    if (BONBONS.includes(item.id) && n > 0) {
      dessinerNombre(
        ctx, n, r.x + (r.l - largeurNombre(n, TEXTE_PETIT)) / 2,
        r.y + r.h + BAS_DU_NOM - 4, TEXTE_PETIT, PALETTE.jaune,
      );
      continue;
    }
    dessinerMotCentre(
      ctx, item.nom, r.x + (r.l - largeurMotSimple(item.nom)) / 2,
      r.y + r.h + BAS_DU_NOM, TEXTE_PETIT, connue ? PALETTE.creme : PALETTE.ardoise,
    );
  }
}

// Le nom tient sous la touche : on le pose au pixel, centré à la main, parce
// que `dessinerMotCentre` centre en hauteur et non en largeur.
const AVANCE_LETTRE = 6;
const BAS_DU_NOM = 16;
const largeurMotSimple = (mot) => mot.length * AVANCE_LETTRE - 1;

// Combien sur combien. Le nombre trouvé est en crème, le total en ardoise :
// c'est la seule façon de dire « il t'en manque » sans une phrase.
function compte(ctx, trouvees, total) {
  const barre = 10;
  const l = largeurNombre(trouvees, TEXTE_GRAND) + barre + largeurNombre(total, TEXTE_GRAND);
  const x = (LARGEUR_LOGIQUE - l) / 2;
  const y = COLLECTION.y - 72;
  dessinerNombre(ctx, trouvees, x, y, TEXTE_GRAND, PALETTE.creme);
  ctx.fillStyle = PALETTE.ardoise;
  for (let i = 0; i < 7; i++) {
    ctx.fillRect(x + largeurNombre(trouvees, TEXTE_GRAND) + 5 - i, y + 3 + i * 3, 3, 3);
  }
  dessinerNombre(
    ctx, total, x + largeurNombre(trouvees, TEXTE_GRAND) + barre, y,
    TEXTE_GRAND, PALETTE.ardoise,
  );
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
