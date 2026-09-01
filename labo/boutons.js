// Six façons de dessiner le plus et la croix de la barre d'outils, chacune
// avec l'animation qu'elle joue quand le doigt appuie dessus.
//
// Chaque vignette montre les deux boutons : le plus s'enfonce d'abord, la
// croix ensuite. Un clic sur la vignette rejoue la séquence.
//
// L'icône reste dessinée sur 16 × 16 pixels d'art, affichée ×2 : au repos,
// l'échelle est entière comme dans le jeu. Seule l'animation, le temps qu'elle
// dure, sort de la grille — c'est ce qui la rend vivante.

import { PALETTE } from '../src/design.js';
import { sortieCubique } from './atelier.js';

const N = PALETTE.noir;
const A = PALETTE.ardoise;
const C = PALETTE.creme;
const R = PALETTE.rouge;
const J = PALETTE.jaune;

const TUILE = 16;
const TAILLE = 32;      // l'icône affichée : 16 × 16 pixels d'art, ×2
const PLAQUE = 32;

function icone(peindre) {
  const c = document.createElement('canvas');
  c.width = TUILE;
  c.height = TUILE;
  const g = c.getContext('2d');
  peindre((x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); });
  return c;
}

// --- deux tracés, centrés au pixel près -----------------------------------
//
// La tuile fait 16 : son milieu tombe entre les colonnes 7 et 8. Un trait est
// donc centré si son épaisseur est paire et posée à (16 - épaisseur) / 2, et
// s'il commence et finit à la même distance des deux bords. Toutes les formes
// ci-dessous passent par ces deux fonctions : aucune n'est placée à la main,
// donc aucune ne peut être décalée d'un pixel.

// Un plus : deux traits d'épaisseur paire qui se croisent au milieu.
function plus(rect, couleur, marge = 2, epaisseur = 2) {
  const a = (TUILE - epaisseur) / 2;
  const l = TUILE - marge * 2;
  rect(a, marge, epaisseur, l, couleur);
  rect(marge, a, l, epaisseur, couleur);
}

// Une croix : les deux diagonales du carré. Le motif est décrit par une
// condition symétrique en x et en y, ce qui le rend centré par construction —
// « écart » donne la finesse du trait, 0 pour le plus fin.
function croix(rect, couleur, marge = 2, ecart = 0) {
  for (let y = marge; y < TUILE - marge; y++) {
    for (let x = marge; x < TUILE - marge; x++) {
      const surLaPremiere = Math.abs(x - y) <= ecart;
      const surLaSeconde = Math.abs(x + y - (TUILE - 1)) <= ecart;
      if (surLaPremiere || surLaSeconde) rect(x, y, 1, 1, couleur);
    }
  }
}

// Le même tracé, évidé : on peint le contour puis on regarde ce qui reste.
// Sert aux styles creusé et double trait.
function contour(rect, dessin, couleur, remplissage) {
  const plein = new Set();
  dessin((x, y) => plein.add(x + ',' + y));
  for (const cle of plein) {
    const [x, y] = cle.split(',').map(Number);
    const entoure = [[1, 0], [-1, 0], [0, 1], [0, -1]]
      .every(([dx, dy]) => plein.has((x + dx) + ',' + (y + dy)));
    const teinte = entoure ? remplissage : couleur;
    if (teinte) rect(x, y, 1, 1, teinte);
  }
}

// Les deux tracés sous forme de semis de pixels, pour `contour`.
const semisPlus = (marge, epaisseur) => (pixel) => {
  const a = (TUILE - epaisseur) / 2;
  for (let i = marge; i < TUILE - marge; i++) {
    for (let e = 0; e < epaisseur; e++) { pixel(a + e, i); pixel(i, a + e); }
  }
};

const semisCroix = (marge, ecart) => (pixel) => {
  for (let y = marge; y < TUILE - marge; y++) {
    for (let x = marge; x < TUILE - marge; x++) {
      if (Math.abs(x - y) <= ecart || Math.abs(x + y - (TUILE - 1)) <= ecart) pixel(x, y);
    }
  }
};

// --- 1. trait fin ---------------------------------------------------------
// Rien que le signe : deux pixels d'épaisseur, douze de long.

const plusFin = icone((rect) => plus(rect, C));

// Le rouge et l'ardoise du bouton ont la même clarté (1,05 : 1) : posé seul,
// le rouge ne tient que par la teinte. La croix est donc tracée en crème, qui
// tranche (4,9 : 1), avec le rouge en cœur du trait.
const croixFine = icone((rect) => { croix(rect, C, 2, 1); croix(rect, R, 2, 0); });

// --- 2. contour -----------------------------------------------------------
// Le trait est cerné de noir : il tient sur n'importe quel fond, et le signe
// garde exactement la même emprise.

const plusContour = icone((rect) => {
  plus(rect, N, 1, 4);
  plus(rect, C, 2, 2);
});

const croixContour = icone((rect) => {
  croix(rect, N, 1, 1);
  croix(rect, R, 2, 0);
});

// --- 3. briques -----------------------------------------------------------
// Le trait est coupé en segments : le signe dit le métier, on assemble et on
// démonte. Les coupures tombent aux rangs 6 et 9, à égale distance du milieu,
// donc le motif reste symétrique.

const seam = (i) => i !== 6 && i !== 9;

const plusBrique = icone((rect) => {
  for (let i = 2; i < 14; i++) {
    if (!seam(i)) continue;
    rect(7, i, 2, 1, C);
    rect(i, 7, 1, 2, C);
  }
});

const croixBrique = icone((rect) => {
  for (let i = 2; i < 14; i++) {
    if (!seam(i)) continue;
    rect(i, i, 1, 1, R);
    rect(TUILE - 1 - i, i, 1, 1, R);
  }
});

// --- 4. long et fin -------------------------------------------------------
// Le même trait de deux pixels, mais mené jusqu'aux bords : le signe respire,
// et il se voit de plus loin sans peser davantage.

const plusLong = icone((rect) => plus(rect, C, 1, 2));
const croixLongue = icone((rect) => croix(rect, R, 1, 0));

// --- 5. creusé ------------------------------------------------------------
// Le signe est gravé dans la plaque au lieu d'être posé dessus. Au clic, il se
// remplit de couleur depuis le centre.

const plusCreux = icone((rect) => plus(rect, N, 2, 4));
const plusRempli = icone((rect) => { plus(rect, N, 2, 4); plus(rect, C, 3, 2); });
const croixCreuse = icone((rect) => croix(rect, N, 2, 1));
const croixRemplie = icone((rect) => { croix(rect, N, 2, 1); croix(rect, R, 3, 0); });

// --- 6. double trait ------------------------------------------------------
// Le signe n'est plus qu'un liseré : le trait le plus fin possible, creux au
// milieu.

const plusDouble = icone((rect) => contour(rect, semisPlus(2, 4), C, null));
const croixDouble = icone((rect) => contour(rect, semisCroix(2, 2), R, null));

// --- la plaque et le rendu d'un bouton ------------------------------------

// Le cadre passe au crème quand la touche est enfoncée : exactement ce que
// fait déjà la barre d'outils du jeu, aucune couleur de plus.
function plaque(ctx, x, y, enfoncee) {
  ctx.fillStyle = enfoncee ? C : N;
  ctx.fillRect(x, y, PLAQUE, PLAQUE);
  ctx.fillStyle = A;
  ctx.fillRect(x + 2, y + 2, PLAQUE - 4, PLAQUE - 4);
}

// Dessine une icône centrée dans son bouton, à travers la transformation que
// la proposition applique.
function poser(ctx, x, y, sprite, transformer, t) {
  ctx.save();
  ctx.translate(x + PLAQUE / 2, y + PLAQUE / 2);
  if (transformer) transformer(ctx, t, sprite);
  else ctx.drawImage(sprite, -TAILLE / 2, -TAILLE / 2, TAILLE, TAILLE);
  ctx.restore();
}

// Une secousse de ressort qui part à 1 et s'éteint.
const ressort = (t, vitesse = 24, freinage = 9) =>
  (t < 0 ? 0 : Math.exp(-freinage * t) * Math.cos(vitesse * t));

// Quatre rayons courts qui claquent, comme à la pose d'un élément.
function rayons(ctx, t) {
  if (t < 0 || t > 0.3) return;
  const reste = 1 - t / 0.3;
  ctx.globalAlpha = reste;
  ctx.fillStyle = J;
  for (const [dx, dy] of [[0, -1], [0, 1], [-1, 0], [1, 0]]) {
    const d = 16 + (1 - reste ** 2) * 8;
    const l = Math.max(1, Math.round(reste * 5));
    ctx.fillRect(
      Math.round(dx * d - (dx ? l : 1) / 2),
      Math.round(dy * d - (dy ? l : 1) / 2),
      dx ? l : 1, dy ? l : 1,
    );
  }
  ctx.globalAlpha = 1;
}

// --- les propositions -----------------------------------------------------

function proposition(titre, note, plus, croix, animation) {
  return {
    titre,
    note,
    plus,          // les deux sprites, pour les vérifier et les reprendre tels quels
    croix,
    duree: 2.4,
    dessiner(ctx, t, taille) {
      // Le plus s'enfonce à 0,15 s, la croix à 1,25 s.
      const tp = t - 0.15;
      const tc = t - 1.25;
      const marge = (taille - 2 * PLAQUE - 6) / 2;
      const y = (taille - PLAQUE) / 2;
      animation(ctx, marge, y, plus, tp, 'construction');
      animation(ctx, marge + PLAQUE + 6, y, croix, tc, 'destruction');
    },
  };
}

export const BOUTONS = [
  proposition(
    '1. Trait fin — écrasement élastique  ✔ retenu',
    'crème pour la clarté, rouge en cœur ; au clic le signe s’aplatit puis rebondit',
    plusFin, croixFine,
    (ctx, x, y, sprite, t) => {
      const k = t >= 0 && t < 0.7 ? ressort(t) : 0;
      plaque(ctx, x, y, k > 0.5);
      poser(ctx, x, y, sprite, (g) => {
        g.scale(1 + 0.3 * k, 1 - 0.3 * k);
        g.drawImage(sprite, -TAILLE / 2, -TAILLE / 2, TAILLE, TAILLE);
      }, t);
    },
  ),
  proposition(
    '2. Contour — quart de tour',
    'le trait est cerné de noir ; au clic il pivote de 45° : les deux signes sont le même',
    plusContour, croixContour,
    (ctx, x, y, sprite, t) => {
      const p = t >= 0 && t < 0.6 ? Math.sin(Math.PI * (t / 0.6)) : 0;
      plaque(ctx, x, y, p > 0.5);
      poser(ctx, x, y, sprite, (g) => {
        g.rotate((Math.PI / 4) * p);
        g.drawImage(sprite, -TAILLE / 2, -TAILLE / 2, TAILLE, TAILLE);
      }, t);
    },
  ),
  proposition(
    '3. Briques — enfoncement',
    'le trait est coupé en segments ; la touche s’enfonce, l’ombre se pince, tout remonte',
    plusBrique, croixBrique,
    (ctx, x, y, sprite, t) => {
      const k = t >= 0 && t < 0.6 ? Math.exp(-9 * t) : 0;
      const chute = Math.round(k * 3);
      plaque(ctx, x, y, k > 0.3);
      ctx.globalAlpha = 0.35 * (1 - k);
      ctx.fillStyle = N;
      ctx.fillRect(x + 4, y + PLAQUE - 5, PLAQUE - 8, 3);
      ctx.globalAlpha = 1;
      poser(ctx, x, y + chute, sprite, null, t);
    },
  ),
  proposition(
    '4. Long et fin — éclat',
    'le même trait mené jusqu’aux bords ; au clic il grossit d’un cran et quatre rayons claquent',
    plusLong, croixLongue,
    (ctx, x, y, sprite, t) => {
      const k = t >= 0 && t < 0.7 ? ressort(t, 20, 8) : 0;
      plaque(ctx, x, y, k > 0.5);
      poser(ctx, x, y, sprite, (g) => {
        g.scale(1 + 0.22 * k, 1 + 0.22 * k);
        g.drawImage(sprite, -TAILLE / 2, -TAILLE / 2, TAILLE, TAILLE);
      }, t);
      ctx.save();
      ctx.translate(x + PLAQUE / 2, y + PLAQUE / 2);
      rayons(ctx, t);
      ctx.restore();
    },
  ),
  proposition(
    '5. Creusé — remplissage',
    'le signe est gravé ; au clic, la couleur le remplit depuis le centre',
    plusCreux, croixCreuse,
    (ctx, x, y, sprite, t) => {
      plaque(ctx, x, y, false);
      poser(ctx, x, y, sprite, null, t);
      if (t < 0 || t > 0.9) return;
      const plein = sprite === plusCreux ? plusRempli : croixRemplie;
      const rayon = sortieCubique(t / 0.35) * 24 * (t > 0.7 ? 1 - (t - 0.7) / 0.2 : 1);
      ctx.save();
      ctx.translate(x + PLAQUE / 2, y + PLAQUE / 2);
      ctx.beginPath();
      ctx.arc(0, 0, Math.max(0, rayon), 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(plein, -TAILLE / 2, -TAILLE / 2, TAILLE, TAILLE);
      ctx.restore();
    },
  ),
  proposition(
    '6. Double trait — rebond',
    'un simple liseré, creux au milieu ; au clic il saute, retombe et s’écrase une fois',
    plusDouble, croixDouble,
    (ctx, x, y, sprite, t) => {
      const saut = t >= 0 && t < 0.34 ? Math.sin(Math.PI * (t / 0.34)) : 0;
      const pose = t >= 0.34 && t < 0.8 ? ressort(t - 0.34, 26, 11) : 0;
      plaque(ctx, x, y, saut > 0.5);
      poser(ctx, x, y - Math.round(saut * 6), sprite, (g) => {
        g.scale(1 + 0.25 * pose, 1 - 0.25 * pose);
        g.drawImage(sprite, -TAILLE / 2, -TAILLE / 2, TAILLE, TAILLE);
      }, t);
    },
  ),
];
