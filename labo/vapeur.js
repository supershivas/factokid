// Six vapeurs pour la confiserie : ce qui sort de la machine à l'instant où
// les trois matières sont arrivées et où la pastille se fait.
//
// C'est de la vapeur sous pression, pas de la fumée : elle part vite, elle
// ralentit, elle enfle en s'effaçant. Une fumée monte doucement et traîne ; une
// vapeur claque et disparaît. Toute la différence tient dans la décélération.
//
// Elle est blanche — crème pleine —, alors que la fumée des extracteurs est
// ardoise : à l'écran, l'une dit « ça travaille » et l'autre « ça vient de
// réussir ». Deux gris auraient dit la même chose deux fois.

import { PALETTE, CELLULE, PIXEL } from '../src/design.js';
import { ICONES } from '../src/render/sprites.js';

export const FORMAT = { largeur: 96, hauteur: 96, echelle: 2 };

const CYCLE = 1.6;          // la machine produit toutes les 1,6 s dans le labo
const SOUFFLE = 0.45;       // durée d'une bouffée

// Un hasard fixe : deux images de la même vignette doivent être identiques.
function alea(i, k) {
  const v = Math.sin(i * 12.9898 + k * 78.233) * 43758.5453;
  return v - Math.floor(v);
}

// Une bouffée : trois carrés décalés plutôt qu'un seul. Un carré isolé reste un
// carré ; trois qui se chevauchent font un nuage, et c'est la seule façon d'en
// faire un à cette taille. Tout est arrondi au pixel d'art.
const GRAINS = [[0, 0, 1], [-0.45, -0.3, 0.62], [0.42, 0.28, 0.55]];

function bouffee(ctx, x, y, part, taille, couleur = PALETTE.creme) {
  if (part < 0 || part > 1) return;
  const enfle = taille * (0.45 + part * 1.1);
  ctx.globalAlpha = part < 0.15 ? part / 0.15 : 1 - (part - 0.15) / 0.85;
  ctx.fillStyle = couleur;
  for (const [dx, dy, k] of GRAINS) {
    const cote = Math.max(PIXEL, Math.round((enfle * k) / PIXEL) * PIXEL);
    ctx.fillRect(
      Math.round((x + dx * enfle - cote / 2) / PIXEL) * PIXEL,
      Math.round((y + dy * enfle - cote / 2) / PIXEL) * PIXEL,
      cote, cote,
    );
  }
  ctx.globalAlpha = 1;
}

// La course d'une particule sous pression : vite au départ, presque arrêtée à
// la fin. C'est cette courbe qui fait la différence avec de la fumée.
const freinage = (p) => 1 - (1 - p) ** 3;

// Le décor : la confiserie posée au milieu, telle qu'elle est dans le jeu.
function machine(ctx, largeur, hauteur) {
  const x = Math.round((largeur - CELLULE) / 2);
  const y = hauteur - CELLULE - 8;
  ctx.drawImage(ICONES.confiserie, x, y, CELLULE, CELLULE);
  return { x, y, cx: x + CELLULE / 2, haut: y };
}

function proposition(titre, note, peindre) {
  return {
    titre,
    note,
    duree: CYCLE,
    format: FORMAT,
    dessiner(ctx, t, largeur, hauteur) {
      const m = machine(ctx, largeur, hauteur);
      peindre(ctx, t, m);
    },
  };
}

export const VAPEURS = [
  proposition(
    '1. Jet unique',
    'un seul souffle droit vers le haut : le plus simple, et le plus net',
    (ctx, t, m) => {
      // Le jet s'évase en montant : au départ c'est un trait, à la fin un nuage.
      for (let i = 0; i < 7; i++) {
        const part = (t - i * 0.035) / SOUFFLE;
        const avance = freinage(part);
        const ecart = (alea(i, 1) - 0.5) * avance * 14;
        bouffee(ctx, m.cx + ecart, m.haut - 4 - avance * 34, part, 5 + i);
      }
    },
  ),
  proposition(
    '2. Deux jets de côté',
    'la presse lâche par ses deux flancs : on voit ce qui appuie',
    (ctx, t, m) => {
      for (const cote of [-1, 1]) {
        for (let i = 0; i < 5; i++) {
          const part = (t - i * 0.045) / SOUFFLE;
          const avance = freinage(part);
          bouffee(
            ctx, m.cx + cote * (10 + avance * 26), m.haut + 10 - avance * 10, part, 6 + i,
          );
        }
      }
    },
  ),
  proposition(
    '3. Bouffée ronde',
    'une seule masse qui enfle et se dissipe : douce, presque un soupir',
    (ctx, t, m) => {
      for (let i = 0; i < 6; i++) {
        const part = t / (SOUFFLE + 0.2);
        const angle = (i / 6) * Math.PI * 2;
        const rayon = freinage(part) * 16;
        bouffee(
          ctx, m.cx + Math.cos(angle) * rayon, m.haut - 6 - Math.sin(angle) * rayon * 0.6,
          part, 9,
        );
      }
    },
  ),
  proposition(
    '4. Anneau',
    'un rond qui s’ouvre et s’amincit : le souffle vu de face',
    (ctx, t, m) => {
      const part = t / (SOUFFLE + 0.25);
      const rayon = freinage(part) * 26;
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        bouffee(
          ctx, m.cx + Math.cos(angle) * rayon, m.haut - 10 - Math.sin(angle) * rayon * 0.45,
          part, 6,
        );
      }
    },
  ),
  proposition(
    '5. Champignon',
    'un trait fin qui monte, puis s’ouvre en tête : la vapeur des cocottes',
    (ctx, t, m) => {
      for (let i = 0; i < 4; i++) {
        const part = (t - i * 0.03) / SOUFFLE;
        bouffee(ctx, m.cx, m.haut - 2 - freinage(part) * 16, part, 5);
      }
      for (let i = 0; i < 5; i++) {
        const part = (t - 0.18 - i * 0.02) / SOUFFLE;
        const avance = freinage(part);
        const cote = i % 2 ? 1 : -1;
        bouffee(
          ctx, m.cx + cote * avance * (6 + i * 3), m.haut - 22 - avance * 8, part, 7 + i,
        );
      }
    },
  ),
  proposition(
    '6. Trois souffles',
    'trois bouffées qui se suivent : la machine expire trois fois, puis se tait',
    (ctx, t, m) => {
      for (let s = 0; s < 3; s++) {
        for (let i = 0; i < 4; i++) {
          const part = (t - s * 0.22 - i * 0.03) / (SOUFFLE * 0.7);
          const derive = (alea(s * 7 + i, 3) - 0.5) * 14;
          bouffee(
            ctx, m.cx + derive * freinage(part), m.haut - 4 - freinage(part) * 26, part, 6 + i,
          );
        }
      }
    },
  ),
];
