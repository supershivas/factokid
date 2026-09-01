// La bulle d'alerte : blanche, en éclats, avec ses trois points d'exclamation.
//
// Les trois points n'ont ni la même taille ni la même inclinaison — c'est ce
// qui les fait lire comme un cri plutôt que comme un pictogramme. Ils vibrent
// en permanence, chacun sur son propre rythme.
//
// L'arrivée : la bulle jaillit de la case, puis se secoue.

import { PALETTE, TUILE_PX, CELLULE } from '../design.js';

const TAILLE = Math.round(CELLULE * 0.95);
const MONTEE = 0.30;   // secondes : le temps du jaillissement
const SECOUSSE = 0.55; // secondes : la secousse qui suit

// Trois points, trois tailles, trois inclinaisons.
const POINTS = [
  { x: 5.0, taille: 0.82, angle: -0.34 },
  { x: 7.9, taille: 1.25, angle: 0.11 },
  { x: 10.8, taille: 0.95, angle: 0.40 },
];

function toile(l, h, peindre) {
  const c = document.createElement('canvas');
  c.width = l;
  c.height = h;
  const g = c.getContext('2d');
  peindre((x, y, w, ht, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, ht); });
  return c;
}

// La bulle en éclats : un disque dont le rayon bat au rythme de huit pointes.
const bulle = toile(TUILE_PX, TUILE_PX, (rect) => {
  const c = 7.5;
  for (let y = 0; y < TUILE_PX; y++) {
    for (let x = 0; x < TUILE_PX; x++) {
      const dx = x + 0.5 - c;
      const dy = y + 0.5 - c;
      const r = Math.hypot(dx, dy);
      const seuil = 6.2 + 1.7 * Math.cos(8 * Math.atan2(dy, dx));
      if (r <= seuil) rect(x, y, 1, 1, PALETTE.creme);
      else if (r <= seuil + 1.1) rect(x, y, 1, 1, PALETTE.noir);
    }
  }
});

// Un point d'exclamation, dessiné à part pour pouvoir tourner tout seul.
const point = toile(2, 8, (rect) => {
  rect(0, 0, 2, 5, PALETTE.rouge);
  rect(0, 6, 2, 2, PALETTE.rouge);
});

// Un tremblement reproductible : pas de hasard, donc pas de scintillement.
function tremble(t, graine) {
  return Math.sin(t * 41.3 + graine * 5.1) * Math.sin(t * 27.9 + graine * 11.7);
}

const sortieCubique = (p) => 1 - (1 - Math.max(0, Math.min(1, p))) ** 3;

// `t` est le temps écoulé depuis l'apparition, en secondes. (x, y) est le
// centre de la case bloquée : la bulle en sort et monte au-dessus.
export function dessinerAlerte(ctx, x, y, t) {
  const montee = sortieCubique(t / MONTEE);
  const taille = TAILLE * (0.35 + 0.65 * montee);
  const hauteur = y - CELLULE * 0.72 * montee;

  // La secousse prend le relais du jaillissement, et s'éteint.
  const depuis = Math.max(0, t - MONTEE);
  const secousse = depuis < SECOUSSE
    ? Math.exp(-depuis * 7) * Math.sin(depuis * 46) * 6
    : 0;

  const cx = Math.round(x + secousse);
  const cy = Math.round(hauteur);
  const s = Math.round(taille);
  ctx.drawImage(bulle, cx - s / 2, cy - s / 2, s, s);

  // Les points arrivent avec la bulle, et vibrent une fois posés.
  const unite = s / TUILE_PX;
  for (let i = 0; i < POINTS.length; i++) {
    const p = POINTS[i];
    const vibx = tremble(t, i) * 1.2 * montee;
    const viby = tremble(t + 4, i) * 1.2 * montee;
    const vibAngle = tremble(t + 9, i) * 0.07 * montee;
    ctx.save();
    ctx.translate(cx - s / 2 + p.x * unite + vibx, cy - s / 2 + 7.5 * unite + viby);
    ctx.rotate(p.angle + vibAngle);
    // Un point occupe environ la moitié du disque : au-delà il le déborde.
    const l = Math.max(1, Math.round(1.5 * unite * p.taille));
    const h = Math.max(2, Math.round(6 * unite * p.taille));
    ctx.drawImage(point, -l / 2, -h / 2, l, h);
    ctx.restore();
  }
}

export const DUREE_APPARITION = MONTEE + SECOUSSE;
