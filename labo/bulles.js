// Dix apparitions pour la bulle d'alerte.
// La bulle est blanche, ses points sont rouges et vibrent. Ce qui change d'une
// proposition à l'autre, c'est la façon dont elle arrive.

import { PALETTE, TUILE_PX } from '../src/design.js';
import { borne, ressortAmorti, sortieCubique, tremble } from './atelier.js';

const PIXEL = 3; // le sprite fait 16 × 16, dessiné sur 48 unités logiques

// Bulle en éclats, dessinée à la volée : l'amplitude des pointes est un
// paramètre, ce qui permet de les faire pousser.
const cache = new Map();

function spriteBulle(pointes) {
  const cle = Math.round(pointes * 10);
  if (cache.has(cle)) return cache.get(cle);
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  const cx = 7.5;
  const cy = 7.5;
  for (let y = 0; y < TUILE_PX; y++) {
    for (let x = 0; x < TUILE_PX; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      const r = Math.hypot(dx, dy);
      const seuil = 6.2 + pointes * Math.cos(8 * Math.atan2(dy, dx));
      if (r <= seuil) { g.fillStyle = PALETTE.creme; g.fillRect(x, y, 1, 1); }
      else if (r <= seuil + 1.1) { g.fillStyle = PALETTE.noir; g.fillRect(x, y, 1, 1); }
    }
  }
  cache.set(cle, c);
  return c;
}

// Les trois points, dessinés à part pour pouvoir vibrer tout seuls.
function points(ctx, x, y, taille, decalages) {
  ctx.fillStyle = PALETTE.rouge;
  const p = taille / TUILE_PX;
  for (let i = 0; i < 3; i++) {
    const dx = decalages ? decalages[i].dx : 0;
    const dy = decalages ? decalages[i].dy : 0;
    const cx = x + (5 + i * 3) * p + dx;
    ctx.fillRect(Math.round(cx), Math.round(y + 4 * p + dy), Math.round(p), Math.round(4 * p));
    ctx.fillRect(Math.round(cx), Math.round(y + 9 * p + dy), Math.round(p), Math.round(p));
  }
}

// La vibration commune : les points tremblent d'un pixel, jamais la bulle.
function vibration(t) {
  return [0, 1, 2].map((i) => ({
    dx: Math.round(tremble(t, i) * 1.4) * PIXEL / 3,
    dy: Math.round(tremble(t + 3, i) * 1.4) * PIXEL / 3,
  }));
}

// Dessine la bulle complète avec une transformation.
function bulle(ctx, { x, y, taille, echelleX = 1, echelleY = 1, rotation = 0, alpha = 1, pointes = 1.7, t = 0, sansPoints = false }) {
  if (alpha <= 0 || taille <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(x, y);
  ctx.rotate(rotation);
  ctx.scale(echelleX, echelleY);
  const s = Math.round(taille);
  ctx.drawImage(spriteBulle(pointes), -s / 2, -s / 2, s, s);
  if (!sansPoints) points(ctx, -s / 2, -s / 2, s, vibration(t));
  ctx.restore();
}

// Le décor de chaque vignette : la machine bloquée d'où sort la bulle.
function machine(ctx, taille) {
  const c = taille / 2;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(c - 15, taille - 24, 30, 21);
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(c - 12, taille - 21, 24, 18);
  ctx.fillStyle = PALETTE.bleu;
  ctx.fillRect(c - 9, taille - 9, 18, 3);
}

const HAUT = 26; // hauteur où la bulle se pose
const TAILLE = 46;

export const BULLES = [
  {
    titre: '1. Ressort',
    note: 'grandit et dépasse, puis se pose',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const p = borne(ressortAmorti(t * 2.6), 0, 1.25);
      bulle(ctx, { x: taille / 2, y: HAUT, taille: TAILLE * p, t });
    },
  },
  {
    titre: '2. Éclair puis bulle',
    note: 'un flash blanc annonce, la bulle suit',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      if (t < 0.16) {
        ctx.globalAlpha = 1 - t / 0.16;
        ctx.fillStyle = PALETTE.creme;
        const r = 6 + t * 260;
        ctx.fillRect(taille / 2 - r / 2, HAUT - r / 2, r, r);
        ctx.globalAlpha = 1;
        return;
      }
      const p = borne(ressortAmorti((t - 0.16) * 3.2), 0, 1.2);
      bulle(ctx, { x: taille / 2, y: HAUT, taille: TAILLE * p, t });
    },
  },
  {
    titre: '3. Jaillissement',
    note: 'sort de la machine et monte à sa place',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const p = borne(t / 0.34);
      const y = taille - 20 + (HAUT - (taille - 20)) * sortieCubique(p);
      bulle(ctx, { x: taille / 2, y, taille: TAILLE * (0.4 + 0.6 * sortieCubique(p)), t });
    },
  },
  {
    titre: '4. Éclosion',
    note: 'un disque, puis les pointes poussent',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const disque = borne(t / 0.16);
      const pointes = borne((t - 0.16) / 0.24);
      bulle(ctx, {
        x: taille / 2, y: HAUT, taille: TAILLE * sortieCubique(disque),
        pointes: 0.1 + 1.6 * sortieCubique(pointes), t,
      });
    },
  },
  {
    titre: '5. Coup de tampon',
    note: 'arrive trop grande et s’écrase',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const p = borne(t / 0.22);
      const e = 2.2 - 1.2 * sortieCubique(p);
      const rebond = t > 0.22 ? 1 + 0.12 * Math.exp(-(t - 0.22) * 9) * Math.cos((t - 0.22) * 34) : 1;
      bulle(ctx, {
        x: taille / 2, y: HAUT, taille: TAILLE,
        echelleX: e * rebond, echelleY: e / rebond, t,
      });
    },
  },
  {
    titre: '6. Vissage',
    note: 'apparaît en tournant d’un quart de tour',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const p = borne(ressortAmorti(t * 2.4), 0, 1.15);
      bulle(ctx, {
        x: taille / 2, y: HAUT, taille: TAILLE * p,
        rotation: (1 - p) * Math.PI / 2, t,
      });
    },
  },
  {
    titre: '7. Alarme',
    note: 'clignote trois fois avant de rester',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const clignote = t < 0.7 ? (Math.floor(t / 0.117) % 2 === 0 ? 1 : 0.12) : 1;
      bulle(ctx, { x: taille / 2, y: HAUT, taille: TAILLE, alpha: clignote, t });
    },
  },
  {
    titre: '8. Secousse',
    note: 'arrive d’un coup et se secoue',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const secousse = Math.exp(-t * 6) * Math.sin(t * 44) * 7;
      bulle(ctx, { x: taille / 2 + secousse, y: HAUT, taille: TAILLE, t });
    },
  },
  {
    titre: '9. Gonflement',
    note: 's’étire en largeur puis en hauteur',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      // D'abord une barre plate qui s'étire, puis elle se gonfle en hauteur.
      const a = borne(t / 0.14);
      const b = borne((t - 0.12) / 0.24);
      bulle(ctx, {
        x: taille / 2, y: HAUT, taille: TAILLE,
        echelleX: sortieCubique(a),
        echelleY: 0.18 + 0.82 * sortieCubique(b) * (1 + 0.12 * Math.exp(-t * 6) * Math.sin(t * 30)),
        t,
      });
    },
  },
  {
    titre: '10. Points qui tombent',
    note: 'la bulle d’abord, les points un à un',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      const p = borne(ressortAmorti(t * 3), 0, 1.2);
      bulle(ctx, { x: taille / 2, y: HAUT, taille: TAILLE * p, t, sansPoints: true });
      const s = Math.round(TAILLE * p);
      const vib = vibration(t);
      ctx.fillStyle = PALETTE.rouge;
      const u = s / TUILE_PX;
      for (let i = 0; i < 3; i++) {
        const arrive = borne((t - 0.18 - i * 0.09) / 0.16);
        if (arrive <= 0) continue;
        const chute = (1 - sortieCubique(arrive)) * -26;
        const x = taille / 2 - s / 2 + (5 + i * 3) * u + vib[i].dx * arrive;
        const y = HAUT - s / 2 + 4 * u + chute + vib[i].dy * arrive;
        ctx.fillRect(Math.round(x), Math.round(y), Math.round(u), Math.round(4 * u));
        ctx.fillRect(Math.round(x), Math.round(y + 5 * u), Math.round(u), Math.round(u));
      }
    },
  },
];
