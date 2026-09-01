// Six façons d'animer les chevrons d'un convoyeur.
//
// Le tapis est dessiné ici sans ses pointillés : ce sont les chevrons qui
// disent le mouvement, et deux motifs qui bougent l'un sur l'autre se
// brouillent. Le chevron peut être bleu — c'est la couleur du convoyeur actif
// dans la palette.
//
// La règle commune aux six : la vitesse du motif est celle du tapis. Un tapis
// bloqué ne doit pas continuer à faire défiler ses chevrons, sinon l'enfant
// voit couler ce qui est arrêté. Chaque vignette montre donc la seconde
// moitié de sa boucle à l'arrêt.

import { PALETTE, CELLULE, TUILE_PX, PIXEL } from '../src/design.js';

const CASES = 3;
export const FORMAT = { largeur: CELLULE * CASES, hauteur: CELLULE, echelle: 2 };

// Le tapis, sans pointillés : deux bords noirs et la bande d'ardoise.
function tapis(ctx, largeur) {
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 3 * PIXEL, largeur, PIXEL);
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(0, 4 * PIXEL, largeur, 8 * PIXEL);
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 12 * PIXEL, largeur, PIXEL);
}

// Un chevron tourné vers l'est, dessiné en pixels d'art autour de son centre.
// « bras » donne sa taille : 3 pour le chevron plein, moins pour un chevron
// qui grandit.
function chevron(ctx, x, y, couleur, bras = 3, alpha = 1, epaisseur = 1) {
  ctx.globalAlpha = alpha;
  ctx.fillStyle = couleur;
  const p = (px, py) => ctx.fillRect(
    Math.round(x + px * PIXEL), Math.round(y + py * PIXEL), PIXEL * epaisseur, PIXEL,
  );
  for (let i = 0; i < bras; i++) {
    p(i - bras, i - bras);
    p(i - bras, bras - i - 1);
  }
  p(0, -1); p(0, 0);
  ctx.globalAlpha = 1;
}

// Le milieu de la bande, en unités logiques.
const MILIEU = 8 * PIXEL;

// Chaque vignette avance pendant la première moitié de sa boucle, puis
// s'arrête : c'est le tapis bloqué.
const marche = (t, duree) => (t < duree * 0.6 ? t : duree * 0.6);

function proposition(titre, note, duree, peindre) {
  return {
    titre,
    note,
    duree,
    format: FORMAT,
    dessiner(ctx, t, largeur) {
      tapis(ctx, largeur);
      peindre(ctx, marche(t, duree), largeur, t >= duree * 0.6);
      if (t >= duree * 0.6) {
        // Un liseré rouge en bas dit que, à partir d'ici, le tapis est bloqué.
        ctx.fillStyle = PALETTE.rouge;
        ctx.fillRect(0, CELLULE - PIXEL, largeur, PIXEL);
      }
    },
  };
}

export const CHEVRONS = [
  proposition(
    '1. Défilement',
    'les chevrons glissent d’un bout à l’autre, à la vitesse du tapis',
    2.4,
    (ctx, t, largeur) => {
      const pas = CELLULE / 2;
      const decalage = Math.round((t * 48) % pas);
      for (let x = -pas; x < largeur + pas; x += pas) {
        chevron(ctx, x + decalage, MILIEU, PALETTE.bleu);
      }
    },
  ),
  proposition(
    '2. Vague',
    'les chevrons restent en place ; c’est la lumière qui court sur eux',
    2.4,
    (ctx, t, largeur) => {
      const pas = CELLULE / 2;
      for (let i = 0; i * pas < largeur; i++) {
        const phase = (t * 1.6 - i * 0.16) % 1;
        const vif = phase > 0 && phase < 0.28;
        // Au repos le chevron est sombre, comme creusé dans la bande ; c'est
        // celui que la vague touche qui s'allume.
        chevron(ctx, i * pas + pas / 2, MILIEU, vif ? PALETTE.bleu : PALETTE.noir, 3, vif ? 1 : 0.55);
      }
    },
  ),
  proposition(
    '3. Battement',
    'tous ensemble : ils enflent et s’effacent, comme une respiration',
    2.4,
    (ctx, t, largeur) => {
      const pas = CELLULE / 2;
      const p = (Math.sin(t * 5) + 1) / 2;
      for (let i = 0; i * pas < largeur; i++) {
        chevron(ctx, i * pas + pas / 2, MILIEU, PALETTE.bleu, 2 + Math.round(p), 0.4 + p * 0.6);
      }
    },
  ),
  proposition(
    '4. Chenille',
    'un seul chevron parcourt le tapis ; les autres attendent en retrait',
    2.4,
    (ctx, t, largeur) => {
      const pas = CELLULE / 2;
      for (let i = 0; i * pas < largeur; i++) {
        chevron(ctx, i * pas + pas / 2, MILIEU, PALETTE.noir, 3, 0.5);
      }
      const x = Math.round((t * 60) % (largeur + pas)) - pas / 2;
      chevron(ctx, x, MILIEU, PALETTE.bleu);
    },
  ),
  proposition(
    '5. Éclosion',
    'chaque chevron naît en pointe, s’ouvre en grand, puis s’efface — décalés',
    2.4,
    (ctx, t, largeur) => {
      const pas = CELLULE / 2;
      for (let i = 0; i * pas < largeur; i++) {
        const phase = ((t * 1.4 - i * 0.2) % 1 + 1) % 1;
        const bras = 2 + Math.min(1, Math.floor(phase * 3));
        chevron(ctx, i * pas + pas / 2, MILIEU, PALETTE.bleu, bras, 1 - phase * 0.6);
      }
    },
  ),
  proposition(
    '6. Traits doublés',
    'deux traits fins glissent l’un derrière l’autre : le tapis file sans crier',
    2.4,
    (ctx, t, largeur) => {
      const pas = CELLULE / 2;
      const decalage = Math.round((t * 48) % pas);
      for (let x = -pas; x < largeur + pas; x += pas) {
        chevron(ctx, x + decalage, MILIEU, PALETTE.bleu, 3, 0.9);
        chevron(ctx, x + decalage - 3 * PIXEL, MILIEU, PALETTE.bleu, 3, 0.35);
      }
    },
  ),
];
