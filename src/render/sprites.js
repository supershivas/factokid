// Atlas de tuiles et dessin de la scène. Ne modifie jamais l'état.
// Toutes les tuiles sont peintes sur une grille de 16 × 16 pixels d'art,
// puis affichées à l'échelle entière PIXEL (3 unités logiques par pixel).

import {
  PALETTE, TUILE_PX, CELLULE, COLONNES, LIGNES, GRILLE_X, GRILLE_Y,
} from '../design.js';
import { ITEMS } from '../data/items.js';
import { centreCellule, coinCellule } from '../sim/grid.js';
import { attendus } from '../sim/machine.js';
import { parcourirItems } from '../sim/belt.js';

const TAILLE_ITEM_PX = 6;
const TAILLE_ITEM = TAILLE_ITEM_PX * (CELLULE / TUILE_PX); // 18 unités logiques

function toile(taille, peindre) {
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  const disque = (cx, cy, r, couleur) => {
    g.fillStyle = couleur;
    for (let y = 0; y < taille; y++) {
      for (let x = 0; x < taille; x++) {
        const dx = x + 0.5 - cx, dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
      }
    }
  };
  peindre(rect, disque, g);
  return c;
}

// --- formes des items -----------------------------------------------------
// Définies avant les tuiles : les machines s'en servent pour porter la forme
// de ce qu'elles produisent.

// Décale un peintre de rectangles : sert à poser une forme d'item ailleurs
// que dans son propre coin, par exemple sur la façade d'une mine.
function decale(rect, ox, oy) {
  return (x, y, w, h, couleur) => rect(x + ox, y + oy, w, h, couleur);
}

const formes = {
  carre: (rect, couleur) => {
    rect(0, 0, 6, 6, PALETTE.noir);
    rect(1, 1, 4, 4, couleur);
    rect(1, 1, 1, 1, PALETTE.creme);
  },
  triangle: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(2, 0, 2, 1, n);
    rect(1, 1, 1, 1, n); rect(2, 1, 2, 1, couleur); rect(4, 1, 1, 1, n);
    rect(1, 2, 1, 1, n); rect(2, 2, 2, 1, couleur); rect(4, 2, 1, 1, n);
    rect(0, 3, 1, 1, n); rect(1, 3, 4, 1, couleur); rect(5, 3, 1, 1, n);
    rect(0, 4, 1, 1, n); rect(1, 4, 4, 1, couleur); rect(5, 4, 1, 1, n);
    rect(0, 5, 6, 1, n);
  },
  rond: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(2, 0, 2, 1, n);
    rect(1, 1, 1, 1, n); rect(2, 1, 2, 1, couleur); rect(4, 1, 1, 1, n);
    rect(0, 2, 1, 2, n); rect(1, 2, 4, 2, couleur); rect(5, 2, 1, 2, n);
    rect(1, 4, 1, 1, n); rect(2, 4, 2, 1, couleur); rect(4, 4, 1, 1, n);
    rect(2, 5, 2, 1, n);
    rect(2, 1, 1, 1, PALETTE.creme);
  },
};


// --- tuiles ---------------------------------------------------------------

const sol = toile(TUILE_PX, (rect) => {
  rect(0, 0, TUILE_PX, TUILE_PX, PALETTE.noir);
  // Coins de cellule marqués : la grille se lit sans lignes pleines.
  const a = PALETTE.ardoise;
  rect(0, 0, 3, 1, a);   rect(0, 0, 1, 3, a);
  rect(13, 0, 3, 1, a);  rect(15, 0, 1, 3, a);
  rect(0, 15, 3, 1, a);  rect(0, 13, 1, 3, a);
  rect(13, 15, 3, 1, a); rect(15, 13, 1, 3, a);
});

// Convoyeur droit : flux vers l'est.
const convoyeurDroit = toile(TUILE_PX, (rect) => {
  rect(0, 3, 16, 1, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(0, 12, 16, 1, PALETTE.noir);
  for (let x = 1; x < 16; x += 4) {
    rect(x, 5, 2, 1, PALETTE.bleu);
    rect(x, 10, 2, 1, PALETTE.bleu);
  }
});

// Convoyeur en virage : entre par l'ouest, sort par le sud.
// Les crans suivent le coude, comme sur la tuile droite : deux files de
// pointillés qui longent chacun des deux bords du virage.
const convoyeurVirage = toile(TUILE_PX, (rect) => {
  rect(0, 3, 13, 10, PALETTE.noir);
  rect(3, 3, 10, 13, PALETTE.noir);
  rect(0, 4, 12, 8, PALETTE.ardoise);
  rect(4, 4, 8, 12, PALETTE.ardoise);
  // File intérieure : longe le bord court (nord puis ouest).
  rect(1, 5, 2, 1, PALETTE.bleu);
  rect(5, 5, 1, 1, PALETTE.bleu);
  rect(5, 7, 1, 2, PALETTE.bleu);
  rect(5, 11, 1, 2, PALETTE.bleu);
  // File extérieure : longe le bord long (sud puis est).
  rect(1, 10, 2, 1, PALETTE.bleu);
  rect(5, 10, 2, 1, PALETTE.bleu);
  rect(9, 10, 1, 1, PALETTE.bleu);
  rect(10, 12, 1, 2, PALETTE.bleu);
});

// Une mine : entonnoir qui verse. La couleur du bandeau dit ce qu'elle sort,
// la forme dit que c'est une source.
// Une mine porte la forme de ce qu'elle sort : deux mines ne se distinguent
// jamais par la seule couleur.
function mine(item) {
  return toile(TUILE_PX, (rect) => {
    rect(0, 0, 16, 16, PALETTE.noir);
    rect(1, 1, 14, 14, PALETTE.ardoise);
    rect(2, 2, 12, 6, PALETTE.noir);
    formes[item.forme](decale(rect, 5, 3), PALETTE[item.couleur]);
    for (let i = 0; i < 4; i++) rect(4 + i, 9 + i, 8 - 2 * i, 1, PALETTE.creme);
    rect(2, 14, 3, 2, PALETTE.noir);
    rect(11, 14, 3, 2, PALETTE.noir);
  });
}

// Un assembleur : deux blocs qui entrent en haut, un seul qui sort en bas.
const assembleur = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 2, 3, 3, PALETTE.creme);
  rect(10, 2, 3, 3, PALETTE.creme);
  rect(5, 5, 2, 2, PALETTE.creme);
  rect(9, 5, 2, 2, PALETTE.creme);
  rect(6, 7, 4, 2, PALETTE.creme);
  rect(4, 9, 8, 3, PALETTE.jaune);
});

const consommateur = toile(TUILE_PX, (rect, disque) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  disque(8, 8, 5.2, PALETTE.creme);
  disque(8, 8, 4.2, PALETTE.noir);
  // La bande du bas est laissée vide : c'est la jauge de stock, dessinée par
  // la scène puisqu'elle dépend de l'état.
  rect(2, 13, 12, 2, PALETTE.noir);
});

export const ICONES = {
  mineBoulons: mine(ITEMS.boulon),
  minePlaques: mine(ITEMS.plaque),
  assembleur,
  consommateur,
};

// --- interface ------------------------------------------------------------

const bouton = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
});

const boutonActif = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.creme);
  rect(1, 1, 14, 14, PALETTE.ardoise);
});

const bulleFond = toile(TUILE_PX, (rect, disque) => {
  disque(8, 8, 8, PALETTE.noir);
  disque(8, 8, 7, PALETTE.creme);
  disque(8, 8, 5.5, PALETTE.ardoise);
});

// Un plus pour construire, une croix pour détruire : deux formes qui se
// distinguent en niveaux de gris, la couleur ne fait que confirmer.
const outilConstruction = toile(TUILE_PX, (rect) => {
  rect(6, 3, 4, 10, PALETTE.creme);
  rect(3, 6, 10, 4, PALETTE.creme);
});

const outilDestruction = toile(TUILE_PX, (rect) => {
  for (let i = 0; i < 10; i++) {
    rect(3 + i, 3 + i, 3, 2, PALETTE.rouge);
    rect(12 - i, 3 + i, 3, 2, PALETTE.rouge);
  }
});

const bulleConvoyeur = toile(TUILE_PX, (rect) => {
  rect(2, 5, 12, 1, PALETTE.noir);
  rect(2, 6, 12, 5, PALETTE.ardoise);
  rect(2, 11, 12, 1, PALETTE.noir);
  for (let x = 3; x < 14; x += 4) rect(x, 8, 2, 1, PALETTE.bleu);
});

export const INTERFACE = {
  bouton, boutonActif, bulleFond, outilConstruction, outilDestruction, bulleConvoyeur,
};

// --- items ----------------------------------------------------------------

const spritesItems = {};
for (const item of Object.values(ITEMS)) {
  spritesItems[item.id] = toile(TAILLE_ITEM_PX, (rect) => {
    formes[item.forme](rect, PALETTE[item.couleur]);
  });
}
export function spriteItem(id) { return spritesItems[id]; }
export { TAILLE_ITEM };

// --- orientation des convoyeurs ------------------------------------------

const EST = { dx: 1, dy: 0 };
const OUEST = { dx: -1, dy: 0 };
const SUD = { dx: 0, dy: 1 };

function tourner(v, quarts) {
  let { dx, dy } = v;
  for (let i = 0; i < quarts; i++) { const t = dx; dx = -dy; dy = t; }
  return { dx, dy };
}

function memeSens(a, b) { return a.dx === b.dx && a.dy === b.dy; }
function oppose(v) { return { dx: -v.dx, dy: -v.dy }; }

function memesBords(a, b) {
  return (memeSens(a[0], b[0]) && memeSens(a[1], b[1]))
      || (memeSens(a[0], b[1]) && memeSens(a[1], b[0]));
}

// Rotation de la tuile de base pour une entrée et une sortie données.
function orientation(entree, sortie) {
  if (memeSens(entree, sortie)) {
    for (let q = 0; q < 4; q++) {
      if (memeSens(tourner(EST, q), sortie)) return { sprite: convoyeurDroit, quarts: q };
    }
  }
  // Un virage ne relie que deux bords de la cellule. Le sens de circulation ne
  // change pas la tuile : seul le couple de bords compte. Les quatre rotations
  // de la tuile de base (ouest + sud) couvrent les quatre couples possibles,
  // virages à gauche compris.
  const bords = [oppose(entree), sortie];
  for (let q = 0; q < 4; q++) {
    if (memesBords([tourner(OUEST, q), tourner(SUD, q)], bords)) {
      return { sprite: convoyeurVirage, quarts: q };
    }
  }
  return { sprite: convoyeurDroit, quarts: 0 };
}

function sens(depuis, vers) {
  return { dx: Math.sign(vers.cx - depuis.cx), dy: Math.sign(vers.cy - depuis.cy) };
}

// --- scène ----------------------------------------------------------------

function tuile(ctx, sprite, cx, cy, quarts) {
  const c = centreCellule(cx, cy);
  if (quarts === 0) {
    ctx.drawImage(sprite, c.x - CELLULE / 2, c.y - CELLULE / 2, CELLULE, CELLULE);
    return;
  }
  ctx.save();
  ctx.translate(c.x, c.y);
  ctx.rotate((Math.PI / 2) * quarts);
  ctx.drawImage(sprite, -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
  ctx.restore();
}

export function dessinerScene(ctx, monde, trace) {
  for (let cy = 0; cy < LIGNES; cy++) {
    for (let cx = 0; cx < COLONNES; cx++) tuile(ctx, sol, cx, cy, 0);
  }

  for (const convoyeur of monde.convoyeurs) {
    const chemin = convoyeur.chemin;
    for (let i = 0; i < chemin.length; i++) {
      const avant = i === 0 ? convoyeur.source : chemin[i - 1];
      const apres = i === chemin.length - 1 ? convoyeur.celluleSortie : chemin[i + 1];
      const o = orientation(sens(avant, chemin[i]), sens(chemin[i], apres));
      tuile(ctx, o.sprite, chemin[i].cx, chemin[i].cy, o.quarts);
    }
  }

  for (const convoyeur of monde.convoyeurs) {
    parcourirItems(convoyeur, (item, p) => {
      ctx.drawImage(
        spritesItems[item.type],
        Math.round(p.x - TAILLE_ITEM / 2), Math.round(p.y - TAILLE_ITEM / 2),
        TAILLE_ITEM, TAILLE_ITEM,
      );
    });
  }

  for (const machine of monde.machines) {
    tuile(ctx, ICONES[machine.type], machine.cx, machine.cy, 0);
    const coin = coinCellule(machine.cx, machine.cy);
    dessinerStock(ctx, machine, coin);
    if (machine.bloquee) {
      ctx.fillStyle = PALETTE.rouge;
      ctx.fillRect(coin.x + CELLULE - 12, coin.y + 3, 9, 9);
    }
  }

  if (trace && trace.actif) dessinerTrace(ctx, trace);
}

// Jauge de stock : une rangée de pastilles par ingrédient attendu, à la
// couleur de l'item. Le bouchon se voit sur la machine, pas seulement sur le
// convoyeur.
const PASTILLE = 6;
const PAS_PASTILLE = 10;

function dessinerStock(ctx, machine, coin) {
  const rangees = attendus(machine);
  for (let r = 0; r < rangees.length; r++) {
    const { item, capacite } = rangees[r];
    const largeur = capacite * PASTILLE + (capacite - 1) * (PAS_PASTILLE - PASTILLE);
    const x = coin.x + Math.round((CELLULE - largeur) / 2);
    const y = coin.y + CELLULE - 9 - r * (PASTILLE + 3);
    // Fond sombre derrière la rangée : les places vides doivent se voir autant
    // que les pleines, sinon on ne lit pas combien il en reste.
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(x - 2, y - 2, largeur + 4, PASTILLE + 4);
    for (let i = 0; i < capacite; i++) {
      ctx.fillStyle = i < machine.stocks[item] ? PALETTE[ITEMS[item].couleur] : PALETTE.ardoise;
      ctx.fillRect(x + i * PAS_PASTILLE, y, PASTILLE, PASTILLE);
    }
  }
}

function dessinerTrace(ctx, trace) {
  ctx.fillStyle = PALETTE.creme;
  const depart = coinCellule(trace.source.cx, trace.source.cy);
  ctx.globalAlpha = 0.35;
  ctx.fillRect(depart.x, depart.y, CELLULE, CELLULE);
  for (const c of trace.chemin) {
    const coin = coinCellule(c.cx, c.cy);
    ctx.fillRect(coin.x + 6, coin.y + 6, CELLULE - 12, CELLULE - 12);
  }
  ctx.globalAlpha = 1;
}

export function bordureGrille(ctx) {
  ctx.strokeStyle = PALETTE.ardoise;
  ctx.lineWidth = 1;
  ctx.strokeRect(GRILLE_X - 0.5, GRILLE_Y - 0.5, COLONNES * CELLULE + 1, LIGNES * CELLULE + 1);
}
