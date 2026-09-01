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

// Une croix diagonale réglable : épaisseur et décalage servent à poser un
// contour sous la couleur.
function diagonale(rect, couleur, epaisseur, decalage = 0) {
  for (let i = 0; i < 10; i++) {
    rect(3 + i + decalage, 3 + i + decalage, epaisseur, epaisseur, couleur);
    rect(12 - i - decalage, 3 + i + decalage, epaisseur, epaisseur, couleur);
  }
}

// --- 1. biseau ------------------------------------------------------------
// Contour noir, face claire, ombre portée en bas à droite : le signe a du
// relief sans une seule couleur de plus.

const plusBiseau = icone((rect) => {
  rect(5, 1, 6, 14, N); rect(1, 5, 14, 6, N);
  rect(6, 2, 4, 12, C); rect(2, 6, 12, 4, C);
  rect(9, 2, 1, 12, A); rect(2, 9, 12, 1, A);
});

const croixBiseau = icone((rect) => {
  diagonale(rect, N, 4, -1);
  diagonale(rect, R, 2);
  diagonale(rect, A, 1, 1);
});

// --- 2. coins coupés ------------------------------------------------------
// Les bras sont épais et leurs angles rabattus : rien ne pique, la forme reste
// franche au pouce.

const plusCoupe = icone((rect) => {
  rect(7, 2, 2, 1, C); rect(6, 3, 4, 10, C); rect(7, 13, 2, 1, C);
  rect(2, 7, 1, 2, C); rect(3, 6, 10, 4, C); rect(13, 7, 1, 2, C);
});

const croixCoupe = icone((rect) => {
  diagonale(rect, R, 3);
  rect(3, 3, 1, 1, N); rect(12, 3, 1, 1, N);
  rect(3, 12, 1, 1, N); rect(12, 12, 1, 1, N);
});

// --- 3. briques -----------------------------------------------------------
// Chaque bras est fait de deux blocs séparés d'un pixel : le signe dit le
// métier — on assemble, on démonte.

const plusBrique = icone((rect) => {
  rect(6, 2, 4, 4, C); rect(6, 10, 4, 4, C);
  rect(2, 6, 4, 4, C); rect(10, 6, 4, 4, C);
  rect(6, 6, 4, 4, C);
});

const croixBrique = icone((rect) => {
  rect(2, 2, 4, 4, R); rect(10, 2, 4, 4, R);
  rect(2, 10, 4, 4, R); rect(10, 10, 4, 4, R);
  rect(6, 6, 4, 4, R);
});

// --- 4. gros et doux ------------------------------------------------------
// Bras courts, très épais, bouts arrondis d'un pixel : la forme d'un jouet.

const plusDoux = icone((rect) => {
  rect(6, 3, 4, 10, C); rect(3, 6, 10, 4, C);
  rect(7, 2, 2, 1, C); rect(7, 13, 2, 1, C);
  rect(2, 7, 1, 2, C); rect(13, 7, 1, 2, C);
});

const croixDoux = icone((rect) => {
  diagonale(rect, R, 3);
  rect(4, 4, 2, 2, R); rect(10, 4, 2, 2, R);
  rect(4, 10, 2, 2, R); rect(10, 10, 2, 2, R);
});

// --- 5. creusé ------------------------------------------------------------
// Le signe est gravé dans la plaque au lieu d'être posé dessus. Au clic, il
// se remplit de couleur depuis le centre.

const plusCreux = icone((rect) => {
  rect(6, 2, 4, 12, N); rect(2, 6, 12, 4, N);
});

const plusRempli = icone((rect) => {
  rect(6, 2, 4, 12, N); rect(2, 6, 12, 4, N);
  rect(7, 3, 2, 10, C); rect(3, 7, 10, 2, C);
});

const croixCreuse = icone((rect) => diagonale(rect, N, 4, -1));

const croixRemplie = icone((rect) => {
  diagonale(rect, N, 4, -1);
  diagonale(rect, R, 2);
});

// --- 6. éclat -------------------------------------------------------------
// Le plus a quatre pointes, la croix a les bouts ébréchés : deux signes qui se
// distinguent même du coin de l'œil.

const plusEclat = icone((rect) => {
  rect(6, 3, 4, 10, C); rect(3, 6, 10, 4, C);
  rect(7, 1, 2, 2, C); rect(7, 13, 2, 2, C);
  rect(1, 7, 2, 2, C); rect(13, 7, 2, 2, C);
  rect(7, 7, 2, 2, J);
});

const croixEclat = icone((rect) => {
  diagonale(rect, R, 2);
  rect(1, 1, 2, 2, R); rect(13, 1, 2, 2, R);
  rect(1, 13, 2, 2, R); rect(13, 13, 2, 2, R);
});

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
    '1. Biseau — écrasement élastique',
    'le signe s’aplatit puis rebondit, comme une touche qui cède',
    plusBiseau, croixBiseau,
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
    '2. Coins coupés — quart de tour',
    'le plus pivote et devient croix le temps d’un clin d’œil : les deux signes sont le même',
    plusCoupe, croixCoupe,
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
    'la touche s’enfonce, l’ombre se pince, tout remonte d’un coup',
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
    '4. Gros et doux — éclat',
    'le signe grossit d’un cran et quatre rayons claquent, comme à la pose',
    plusDoux, croixDoux,
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
    (ctx, x, y, sprite, t, role) => {
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
    '6. Éclat — rebond',
    'le signe saute, retombe et s’écrase une fois : le clic a du poids',
    plusEclat, croixEclat,
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
