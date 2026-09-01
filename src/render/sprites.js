// Atlas de tuiles et dessin de la scène. Ne modifie jamais l'état.
// Toutes les tuiles sont peintes sur une grille de 16 × 16 pixels d'art,
// puis affichées à l'échelle entière PIXEL (3 unités logiques par pixel).

import {
  PALETTE, TUILE_PX, CELLULE, COLONNES, LIGNES, GRILLE_X, GRILLE_Y, ALERTE_DELAI,
} from '../design.js';
import { ITEMS } from '../data/items.js';
import { centreCellule, coinCellule } from '../sim/grid.js';
import { attendus } from '../sim/machine.js';
import { estDesigne } from '../sim/carte.js';
import { parcourirItems, celluleDe } from '../sim/belt.js';

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
  // Le caramel : une barre plate, silhouette qu'aucune autre matière n'a.
  barre: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(0, 1, 6, 1, n);
    rect(0, 2, 6, 2, couleur);
    rect(1, 2, 1, 1, PALETTE.creme);
    rect(0, 4, 6, 1, n);
  },
  bonbon: (rect, couleur) => {
    const n = PALETTE.noir;
    rect(2, 0, 2, 1, n);
    rect(1, 1, 1, 1, n); rect(2, 1, 2, 1, couleur); rect(4, 1, 1, 1, n);
    rect(0, 2, 6, 2, couleur);
    rect(1, 4, 1, 1, n); rect(2, 4, 2, 1, couleur); rect(4, 4, 1, 1, n);
    rect(2, 5, 2, 1, n);
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
// Les crans suivent exactement la même règle que sur la tuile droite : deux
// files à un et six pixels du bord intérieur de la bande, un cran de deux tous
// les quatre pixels. Les deux files se rejoignent dans l'angle.
const convoyeurVirage = toile(TUILE_PX, (rect) => {
  rect(0, 3, 13, 10, PALETTE.noir);
  rect(3, 3, 10, 13, PALETTE.noir);
  rect(0, 4, 12, 8, PALETTE.ardoise);
  rect(4, 4, 8, 12, PALETTE.ardoise);

  // Chaque file longe son propre bord de la bande. Celle du bord extérieur
  // fait le tour long et tourne en (10,5) ; celle du bord intérieur coupe au
  // plus court et tourne en (5,10). L'angle lui-même reste vide, sinon les
  // deux crans s'y superposent en L.
  // File extérieure : y = 5 jusqu'au coin, puis x = 10 vers le bas.
  rect(1, 5, 2, 1, PALETTE.bleu);
  rect(5, 5, 2, 1, PALETTE.bleu);
  rect(10, 8, 1, 2, PALETTE.bleu);
  rect(10, 12, 1, 2, PALETTE.bleu);

  // File intérieure : y = 10 jusqu'au coin, puis x = 5 vers le bas.
  rect(1, 10, 2, 1, PALETTE.bleu);
  rect(5, 13, 1, 2, PALETTE.bleu);
});

// Convoyeur en T : arrive par l'ouest, repart vers l'est et vers le sud. Les
// quatre rotations couvrent les quatre jonctions à trois branches.
const convoyeurT = toile(TUILE_PX, (rect) => {
  rect(0, 3, 16, 10, PALETTE.noir);
  rect(3, 3, 10, 13, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(4, 4, 8, 12, PALETTE.ardoise);
  for (let x = 1; x < 16; x += 4) {
    rect(x, 5, 2, 1, PALETTE.bleu);
    rect(x, 10, 2, 1, PALETTE.bleu);
  }
  rect(5, 13, 1, 2, PALETTE.bleu);
  rect(10, 13, 1, 2, PALETTE.bleu);
});

// Convoyeur en croix : les quatre bords sont reliés.
const convoyeurCroix = toile(TUILE_PX, (rect) => {
  rect(0, 3, 16, 10, PALETTE.noir);
  rect(3, 0, 10, 16, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(4, 0, 8, 16, PALETTE.ardoise);
  rect(1, 5, 2, 1, PALETTE.bleu);
  rect(13, 5, 2, 1, PALETTE.bleu);
  rect(1, 10, 2, 1, PALETTE.bleu);
  rect(13, 10, 2, 1, PALETTE.bleu);
  rect(5, 1, 1, 2, PALETTE.bleu);
  rect(10, 1, 1, 2, PALETTE.bleu);
  rect(5, 13, 1, 2, PALETTE.bleu);
  rect(10, 13, 1, 2, PALETTE.bleu);
});

// Le téléporteur : un anneau ouvert d'où sort la matière ramassée.
const teleporteur = toile(TUILE_PX, (rect, disque) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  disque(8, 7, 5.5, PALETTE.bleu);
  disque(8, 7, 4, PALETTE.noir);
  disque(8, 7, 2, PALETTE.creme);
  rect(3, 13, 10, 2, PALETTE.bleu);
});

// Le trieur : un flux qui entre, deux qui sortent.
const trieur = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(7, 2, 2, 4, PALETTE.creme);
  rect(4, 6, 8, 2, PALETTE.creme);
  rect(3, 8, 2, 5, PALETTE.creme);
  rect(11, 8, 2, 5, PALETTE.creme);
});

// La confiserie : deux entonnoirs qui versent, et un bonbon sur la façade.
const confiserie = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 2, 3, 2, PALETTE.creme);
  rect(10, 2, 3, 2, PALETTE.creme);
  rect(4, 4, 8, 1, PALETTE.creme);
  rect(2, 10, 12, 4, PALETTE.noir);
  formes.bonbon(decale(rect, 5, 10), PALETTE.orange);
});

// La chaufferie : une cuve sur un feu, où le sucre fond en caramel.
const chaufferie = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 3, 10, 6, PALETTE.noir);
  rect(4, 5, 8, 3, PALETTE.jaune);
  rect(4, 4, 8, 1, PALETTE.creme);
  for (let i = 0; i < 3; i++) rect(4 + i * 3, 11, 2, 3, PALETTE.orange);
  rect(3, 14, 10, 1, PALETTE.rouge);
});

// La livraison : un bocal ouvert où tombent les bonbons.
const livraison = toile(TUILE_PX, (rect) => {
  rect(0, 0, 16, 16, PALETTE.noir);
  rect(1, 1, 14, 14, PALETTE.ardoise);
  rect(3, 2, 10, 2, PALETTE.creme);
  rect(4, 4, 8, 9, PALETTE.noir);
  rect(5, 5, 6, 7, PALETTE.vert);
  rect(5, 5, 6, 2, PALETTE.noir);
});

// --- cartes ---------------------------------------------------------------

// Sol des cartes : plus organique que la grille de l'usine, pour qu'on sache
// au premier coup d'œil qu'on n'est plus dans l'atelier.
const solCarte = toile(TUILE_PX, (rect) => {
  rect(0, 0, TUILE_PX, TUILE_PX, PALETTE.noir);
  rect(3, 4, 2, 1, PALETTE.ardoise);
  rect(10, 2, 1, 2, PALETTE.ardoise);
  rect(6, 11, 3, 1, PALETTE.ardoise);
  rect(12, 9, 1, 1, PALETTE.ardoise);
});

// Un gisement porte la forme de sa matière, posée sur un socle.
function gisement(item) {
  return toile(TUILE_PX, (rect) => {
    rect(2, 11, 12, 3, PALETTE.ardoise);
    rect(2, 14, 12, 1, PALETTE.noir);
    rect(4, 8, 8, 3, PALETTE.ardoise);
    formes[item.forme](decale(rect, 5, 2), PALETTE[item.couleur]);
  });
}

// Gisement ramassé : le socle reste, la matière repousse.
const gisementVide = toile(TUILE_PX, (rect) => {
  rect(2, 11, 12, 3, PALETTE.ardoise);
  rect(2, 14, 12, 1, PALETTE.noir);
});

// Le héros : de dos, il tient un panier. Assez petit pour ne jamais cacher un
// gisement, assez contrasté pour qu'on le suive des yeux.
const heros = toile(TUILE_PX, (rect) => {
  rect(5, 2, 6, 4, PALETTE.noir);
  rect(6, 3, 4, 2, PALETTE.creme);
  rect(5, 6, 6, 6, PALETTE.bleu);
  rect(4, 7, 1, 4, PALETTE.creme);
  rect(11, 7, 1, 4, PALETTE.creme);
  rect(5, 12, 2, 3, PALETTE.noir);
  rect(9, 12, 2, 3, PALETTE.noir);
});

// Une mine : un chevalet posé sur le gisement, qui le récolte tout seul.
const mine = toile(TUILE_PX, (rect) => {
  rect(2, 12, 12, 3, PALETTE.ardoise);
  rect(2, 15, 12, 1, PALETTE.noir);
  rect(7, 3, 2, 9, PALETTE.creme);
  rect(4, 6, 8, 2, PALETTE.noir);
  rect(4, 6, 8, 1, PALETTE.jaune);
  rect(3, 3, 3, 2, PALETTE.jaune);
});

export const ICONES = {
  teleporteur, trieur, confiserie, livraison, chaufferie, mine, sortieCarte: teleporteur,
};

const spritesGisements = {};
for (const item of Object.values(ITEMS)) spritesGisements[item.id] = gisement(item);

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

// Flèche de retour : on revient à l'usine.
const outilRetour = toile(TUILE_PX, (rect) => {
  rect(4, 7, 9, 3, PALETTE.creme);
  for (let i = 0; i < 4; i++) rect(3 + i, 8 - i - 1, 2, 1, PALETTE.creme);
  for (let i = 0; i < 4; i++) rect(3 + i, 9 + i, 2, 1, PALETTE.creme);
});

const outilDestruction = toile(TUILE_PX, (rect) => {
  for (let i = 0; i < 10; i++) {
    rect(3 + i, 3 + i, 3, 2, PALETTE.rouge);
    rect(12 - i, 3 + i, 3, 2, PALETTE.rouge);
  }
});

const bulleMine = toile(TUILE_PX, (rect) => {
  rect(2, 11, 12, 3, PALETTE.ardoise);
  rect(7, 3, 2, 8, PALETTE.creme);
  rect(4, 6, 8, 1, PALETTE.jaune);
  rect(3, 3, 3, 2, PALETTE.jaune);
});

const bulleConvoyeur = toile(TUILE_PX, (rect) => {
  rect(2, 5, 12, 1, PALETTE.noir);
  rect(2, 6, 12, 5, PALETTE.ardoise);
  rect(2, 11, 12, 1, PALETTE.noir);
  for (let x = 3; x < 14; x += 4) rect(x, 8, 2, 1, PALETTE.bleu);
});

// Une bulle de carte porte la forme de ce qu'on y ramasse : deux cartes ne se
// distinguent jamais par la seule couleur.
function bulleCarte(item) {
  return toile(TUILE_PX, (rect) => {
    rect(3, 3, 10, 10, PALETTE.vert);
    rect(3, 3, 10, 1, PALETTE.creme);
    formes[item.forme](decale(rect, 5, 5), PALETTE[item.couleur]);
  });
}

// Bulle d'alerte : une bulle de bande dessinée en éclats, avec ses « !!! ».
// Elle sort de l'endroit bloqué et ne dit qu'une chose : ça ne passe plus.
const bulleAlerte = toile(TUILE_PX, (rect) => {
  const cx = 7.5;
  const cy = 6.5;
  for (let y = 0; y < TUILE_PX; y++) {
    for (let x = 0; x < TUILE_PX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const r = Math.hypot(dx, dy);
      // Huit pointes : le rayon varie avec l'angle.
      const seuil = 5.1 + 1.7 * Math.cos(8 * Math.atan2(dy, dx));
      if (r <= seuil) rect(x, y, 1, 1, PALETTE.creme);
      else if (r <= seuil + 1.1) rect(x, y, 1, 1, PALETTE.noir);
    }
  }
  // La queue, qui désigne l'endroit bloqué.
  rect(6, 12, 3, 1, PALETTE.noir);
  rect(6, 13, 2, 1, PALETTE.creme);
  rect(6, 14, 2, 1, PALETTE.noir);
  // Les trois points d'exclamation.
  for (const x of [4, 7, 10]) {
    rect(x, 3, 2, 4, PALETTE.rouge);
    rect(x, 8, 2, 2, PALETTE.rouge);
  }
});

export const ALERTE = bulleAlerte;

export const INTERFACE = {
  bouton, boutonActif, bulleFond, bulleConvoyeur, bulleMine,
  outilConstruction, outilDestruction, outilRetour,
};
for (const item of Object.values(ITEMS)) INTERFACE['bulleCarte_' + item.id] = bulleCarte(item);

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

// Une jonction relie trois bords, parfois quatre : la tuile se choisit sur
// l'ensemble des bords occupés, pas sur un sens de circulation.
function memeEnsemble(a, b) {
  if (a.length !== b.length) return false;
  return a.every((v) => b.some((w) => memeSens(v, w)));
}

const BASE_T = [OUEST, EST, SUD];

function orientationJonction(bords) {
  if (bords.length >= 4) return { sprite: convoyeurCroix, quarts: 0 };
  for (let q = 0; q < 4; q++) {
    if (memeEnsemble(BASE_T.map((v) => tourner(v, q)), bords)) {
      return { sprite: convoyeurT, quarts: q };
    }
  }
  return { sprite: convoyeurCroix, quarts: 0 };
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

// Dessine une scène : ses convoyeurs, ce qui circule dessus, ses machines.
// L'usine et les cartes passent par ici, seul le sol change.
export function dessinerScene(ctx, scene, trace, solTuile = sol) {
  for (let cy = 0; cy < LIGNES; cy++) {
    for (let cx = 0; cx < COLONNES; cx++) tuile(ctx, solTuile, cx, cy, 0);
  }
  dessinerConvoyeurs(ctx, scene);
  for (const machine of scene.machines) dessinerMachine(ctx, machine);
  dessinerAlertes(ctx, scene);
  if (trace && trace.actif) dessinerTrace(ctx, trace);
}

// Les convoyeurs d'une scène, puis ce qui roule dessus.
export function dessinerConvoyeurs(ctx, scene) {
  for (const convoyeur of scene.convoyeurs) {
    const chemin = convoyeur.chemin;
    for (let i = 0; i < chemin.length; i++) {
      const avant = i === 0 ? convoyeur.celluleEntree : chemin[i - 1];
      // Première cellule d'un tapis alimenté par plusieurs : c'est une fusion.
      if (i === 0 && convoyeur.sources.length >= 2) {
        const bords = convoyeur.sources
          .map((amont) => celluleDe(amont))
          .filter(Boolean)
          .map((cellule) => sens(chemin[0], cellule));
        bords.push(sens(chemin[0], chemin[1] || convoyeur.celluleSortie));
        const j = orientationJonction(bords);
        tuile(ctx, j.sprite, chemin[0].cx, chemin[0].cy, j.quarts);
        continue;
      }
      // Dernière cellule d'un tapis qui se divise : c'est une jonction.
      if (i === chemin.length - 1 && convoyeur.sorties.length >= 2) {
        const bords = [sens(chemin[i], avant)];
        for (const branche of convoyeur.sorties) bords.push(sens(chemin[i], branche.chemin[0]));
        const j = orientationJonction(bords);
        tuile(ctx, j.sprite, chemin[i].cx, chemin[i].cy, j.quarts);
        continue;
      }
      const apres = i === chemin.length - 1 ? convoyeur.celluleSortie : chemin[i + 1];
      const o = orientation(sens(avant, chemin[i]), sens(chemin[i], apres));
      tuile(ctx, o.sprite, chemin[i].cx, chemin[i].cy, o.quarts);
    }
  }
  for (const convoyeur of scene.convoyeurs) {
    parcourirItems(convoyeur, (item, p) => {
      ctx.drawImage(
        spritesItems[item.type],
        Math.round(p.x - TAILLE_ITEM / 2), Math.round(p.y - TAILLE_ITEM / 2),
        TAILLE_ITEM, TAILLE_ITEM,
      );
    });
  }
}

function dessinerMachine(ctx, machine) {
  tuile(ctx, ICONES[machine.type], machine.cx, machine.cy, 0);
  const coin = coinCellule(machine.cx, machine.cy);
  contenuMine(ctx, machine, coin);
  dessinerStock(ctx, machine, coin);
  fileTrieur(ctx, machine, coin);
  dessinerFleches(ctx, machine);
}

// Les bulles passent au-dessus de tout : elles se dessinent en dernier.
// Une seule par bouchon, à l'endroit d'où il part : un tapis bloqué parce que
// ce qu'il alimente est lui-même bloqué ne dit rien, c'est l'autre qui parle.
function dessinerAlertes(ctx, scene) {
  for (const machine of scene.machines) {
    if (machine.bloqueeDepuis > ALERTE_DELAI) alerte(ctx, machine.cx, machine.cy);
  }
  for (const convoyeur of scene.convoyeurs) {
    if (convoyeur.bloque <= ALERTE_DELAI) continue;
    if (convoyeur.cible && convoyeur.cible.bloqueeDepuis > ALERTE_DELAI) continue;
    if (convoyeur.sorties.some((suite) => suite.bloque > ALERTE_DELAI)) continue;
    const bout = convoyeur.chemin[convoyeur.chemin.length - 1];
    alerte(ctx, bout.cx, bout.cy);
  }
}

// La bulle sort de la case et palpite, pour attraper l'œil sans clignoter.
function alerte(ctx, cx, cy) {
  const coin = coinCellule(cx, cy);
  const battement = 1 + 0.06 * Math.sin(performance.now() / 130);
  const taille = Math.round(CELLULE * battement);
  const x = Math.round(coin.x + (CELLULE - taille) / 2);
  // La bulle sort vers le haut, sauf tout en haut de la grille où elle
  // descend : elle ne doit jamais quitter le plateau.
  const dessus = coin.y - CELLULE * 0.7;
  const y = Math.round(dessus < GRILLE_Y ? coin.y + CELLULE * 0.55 : dessus);
  ctx.drawImage(bulleAlerte, x, y, taille, taille);
}

// Une mine montre ce qu'elle a extrait : on voit ce qu'il y a dedans.
function contenuMine(ctx, machine, coin) {
  if (!machine.def.mine) return;
  const n = machine.stocks[machine.item] || 0;
  if (n === 0) return;
  ctx.drawImage(spritesItems[machine.item], coin.x + 15, coin.y + 24, TAILLE_ITEM, TAILLE_ITEM);
}

// La file d'un trieur, telle quelle : on voit le mélange qui attend.
function fileTrieur(ctx, machine, coin) {
  if (!machine.def.tri) return;
  const n = machine.def.capacite;
  for (let i = 0; i < n; i++) {
    const x = coin.x + 4 + (i % 3) * 14;
    const y = coin.y + CELLULE - 15 + Math.floor(i / 3) * 7;
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(x - 1, y - 1, 14, 7);
    ctx.fillStyle = i < machine.file.length ? PALETTE[ITEMS[machine.file[i]].couleur] : PALETTE.ardoise;
    ctx.fillRect(x, y, 12, 5);
  }
}

// Flèches d'entrée et de sortie : par où ça rentre, par où ça sort.
const FLECHE = 12;

function fleche(ctx, machine, direction, versLInterieur, couleur) {
  const coin = coinCellule(machine.cx, machine.cy);
  const cx = coin.x + CELLULE / 2;
  const cy = coin.y + CELLULE / 2;
  const bord = CELLULE / 2 - 3;
  // Pointe posée sur le bord concerné, base à l'intérieur.
  const sensPointe = versLInterieur ? -1 : 1;
  const px = cx + direction.dx * bord * (versLInterieur ? 1 : 1);
  const py = cy + direction.dy * bord;
  ctx.fillStyle = couleur;
  ctx.beginPath();
  const ux = direction.dx * sensPointe;
  const uy = direction.dy * sensPointe;
  ctx.moveTo(px + ux * (FLECHE / 2), py + uy * (FLECHE / 2));
  ctx.lineTo(px - ux * (FLECHE / 2) + uy * (FLECHE / 2), py - uy * (FLECHE / 2) + ux * (FLECHE / 2));
  ctx.lineTo(px - ux * (FLECHE / 2) - uy * (FLECHE / 2), py - uy * (FLECHE / 2) - ux * (FLECHE / 2));
  ctx.closePath();
  ctx.fill();
}

function dessinerFleches(ctx, machine) {
  for (const convoyeur of machine.entrees) {
    const derniere = convoyeur.chemin[convoyeur.chemin.length - 1];
    fleche(ctx, machine, sens(derniere, machine), true, PALETTE.bleu);
  }
  for (const convoyeur of machine.sorties) {
    fleche(ctx, machine, sens(machine, convoyeur.chemin[0]), false, PALETTE.creme);
  }
}

// Dessine une carte : même grille, même échelle, gisements et mines.
export function dessinerCarte(ctx, carte, trace) {
  for (let cy = 0; cy < LIGNES; cy++) {
    for (let cx = 0; cx < COLONNES; cx++) tuile(ctx, solCarte, cx, cy, 0);
  }

  for (const g of carte.gisements) {
    const coin = coinCellule(g.cx, g.cy);
    if (g.present) {
      if (estDesigne(carte, g)) {
        ctx.strokeStyle = PALETTE.creme;
        ctx.lineWidth = 3;
        ctx.strokeRect(coin.x + 4.5, coin.y + 4.5, CELLULE - 9, CELLULE - 9);
      }
      tuile(ctx, spritesGisements[g.item], g.cx, g.cy, 0);
      continue;
    }
    tuile(ctx, gisementVide, g.cx, g.cy, 0);
    const part = Math.min(1, g.horloge / carte.repousse);
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(coin.x + 6, coin.y + 24, 36, 6);
    ctx.fillStyle = PALETTE.vert;
    ctx.fillRect(coin.x + 6, coin.y + 24, Math.round(36 * part), 6);
  }

  dessinerConvoyeurs(ctx, carte.scene);
  for (const machine of carte.scene.machines) dessinerMachine(ctx, machine);
  dessinerAlertes(ctx, carte.scene);
  dessinerHeros(ctx, carte);
  if (trace && trace.actif) dessinerTrace(ctx, trace);
}

function dessinerHeros(ctx, carte) {
  const h = carte.heros;
  const x = Math.round(h.x - CELLULE / 2);
  const y = Math.round(h.y - CELLULE / 2);
  ctx.drawImage(heros, x, y, CELLULE, CELLULE);
  // Ce qu'il porte, au-dessus de sa tête.
  for (let i = 0; i < h.sac.length; i++) {
    ctx.drawImage(
      spritesItems[h.sac[i]],
      x + 6 + i * (TAILLE_ITEM - 6), y - 6, TAILLE_ITEM, TAILLE_ITEM,
    );
  }
}

// Jauge de stock : une rangée de pastilles par ingrédient attendu, à la
// couleur de l'item. Le bouchon se voit sur la machine, pas seulement sur le
// convoyeur.
const PASTILLE = 4;
const PAS_PASTILLE = 6;

function dessinerStock(ctx, machine, coin) {
  const rangees = attendus(machine);
  for (let r = 0; r < rangees.length; r++) {
    const { item, capacite } = rangees[r];
    const largeur = capacite * PASTILLE + (capacite - 1) * (PAS_PASTILLE - PASTILLE);
    const x = coin.x + Math.round((CELLULE - largeur) / 2);
    const y = coin.y + CELLULE - 7 - r * (PASTILLE + 2);
    // Fond sombre derrière la rangée : les places vides doivent se voir autant
    // que les pleines, sinon on ne lit pas combien il en reste.
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(x - 2, y - 1, largeur + 4, PASTILLE + 2);
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
