// Dix effets pour la pose d'un élément.
// Chaque vignette pose la même tuile de convoyeur, au même endroit : seule la
// façon dont elle arrive change.

import { PALETTE } from '../src/design.js';

// Dessinées sur la grille de seize, elles la gardent : ces pages disent ce
// qu'on a comparé ce jour-là, pas ce que le jeu fait aujourd'hui.
const TUILE_PX = 16;
import { borne, ressortAmorti, sortieCubique, entreeCubique, tremble } from './atelier.js';

const CELLULE = 24; // une cellule de jeu, à l'échelle de la vignette

// La tuile posée : un bout de convoyeur, dessiné comme dans le jeu.
const tuile = (() => {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  rect(0, 3, 16, 1, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(0, 12, 16, 1, PALETTE.noir);
  for (let x = 1; x < 16; x += 4) {
    rect(x, 5, 2, 1, PALETTE.bleu);
    rect(x, 10, 2, 1, PALETTE.bleu);
  }
  return c;
})();

// Le décor : la grille, et les voisines déjà posées.
function decor(ctx, taille) {
  ctx.fillStyle = PALETTE.ardoise;
  for (let y = 12; y < taille; y += CELLULE) {
    for (let x = 12; x < taille; x += CELLULE) {
      ctx.fillRect(x - 1, y - 4, 2, 1);
      ctx.fillRect(x - 4, y - 1, 1, 2);
    }
  }
  ctx.drawImage(tuile, 0, taille / 2 - CELLULE / 2, CELLULE, CELLULE);
  ctx.drawImage(tuile, taille - CELLULE, taille / 2 - CELLULE / 2, CELLULE, CELLULE);
}

function poserTuile(ctx, taille, { echelle = 1, dy = 0, alpha = 1, rotation = 0, echelleY = null }) {
  if (alpha <= 0 || echelle <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(taille / 2, taille / 2 + dy);
  ctx.rotate(rotation);
  ctx.scale(echelle, echelleY === null ? echelle : echelleY);
  ctx.drawImage(tuile, -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
  ctx.restore();
}

const centre = (taille) => ({ x: taille / 2, y: taille / 2 });

export const POSES = [
  {
    titre: '1. Étoiles',
    note: 'une gerbe d’étoiles part de la case',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: borne(t / 0.08) });
      const c = centre(taille);
      for (let i = 0; i < 10; i++) {
        const age = t;
        if (age > 0.7) break;
        const a = (i / 10) * Math.PI * 2 + 0.3;
        const d = age * 90;
        const reste = 1 - age / 0.7;
        ctx.fillStyle = i % 2 ? PALETTE.jaune : PALETTE.creme;
        const s = Math.max(1, Math.round(reste * 3));
        ctx.fillRect(Math.round(c.x + Math.cos(a) * d), Math.round(c.y + Math.sin(a) * d + age * age * 60), s, s);
      }
    },
  },
  {
    titre: '2. Onde carrée',
    note: 'un cadre s’élargit et s’efface',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: borne(ressortAmorti(t * 4), 0, 1.1) });
      const p = borne(t / 0.45);
      if (p >= 1) return;
      const r = CELLULE / 2 + sortieCubique(p) * 22;
      ctx.globalAlpha = 1 - p;
      ctx.strokeStyle = PALETTE.creme;
      ctx.lineWidth = 2;
      const c = centre(taille);
      ctx.strokeRect(Math.round(c.x - r), Math.round(c.y - r), Math.round(r * 2), Math.round(r * 2));
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '3. Poussière',
    note: 'la tuile se pose, la poussière monte',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: 1, dy: -sortieCubique(1 - borne(t / 0.18)) * 14 });
      const c = centre(taille);
      for (let i = 0; i < 8; i++) {
        const age = t - 0.14 - i * 0.02;
        if (age <= 0 || age > 0.8) continue;
        const cote = i % 2 ? 1 : -1;
        ctx.globalAlpha = (1 - age / 0.8) * 0.6;
        ctx.fillStyle = PALETTE.ardoise;
        const s = Math.round(2 + age * 4);
        ctx.fillRect(
          Math.round(c.x + cote * (10 + age * 26) + tremble(i, i) * 3),
          Math.round(c.y + 8 - age * 26), s, s,
        );
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '4. Éclat blanc',
    note: 'la tuile naît blanche puis se colore',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: borne(ressortAmorti(t * 5), 0, 1.1) });
      const p = borne(t / 0.3);
      if (p >= 1) return;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = PALETTE.creme;
      const c = centre(taille);
      ctx.fillRect(c.x - CELLULE / 2, c.y - CELLULE / 2, CELLULE, CELLULE);
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '5. Tampon',
    note: 'tombe de haut, s’écrase, rebondit',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const chute = borne(t / 0.2);
      const dy = -34 * (1 - entreeCubique(chute));
      const impact = borne((t - 0.2) / 0.3);
      const ecrase = t < 0.2 ? 1 : 1 - 0.35 * Math.exp(-(t - 0.2) * 12) * Math.cos((t - 0.2) * 30);
      poserTuile(ctx, taille, { echelle: 1 / ecrase, echelleY: ecrase, dy });
      if (t > 0.2 && impact < 1) {
        ctx.globalAlpha = 1 - impact;
        ctx.fillStyle = PALETTE.ardoise;
        const r = 12 + impact * 22;
        const c = centre(taille);
        ctx.fillRect(Math.round(c.x - r), Math.round(c.y + 9), Math.round(r * 2), 2);
        ctx.globalAlpha = 1;
      }
    },
  },
  {
    titre: '6. Vague',
    note: 'les cases s’allument l’une après l’autre',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const c = centre(taille);
      for (let i = -1; i <= 1; i++) {
        const p = borne((t - (i + 1) * 0.11) / 0.22);
        if (p <= 0) continue;
        ctx.save();
        ctx.translate(c.x + i * CELLULE, c.y);
        const e = borne(ressortAmorti(p * 3), 0, 1.15);
        ctx.scale(e, e);
        ctx.drawImage(tuile, -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
        ctx.restore();
      }
    },
  },
  {
    titre: '7. Confettis',
    note: 'des bouts colorés retombent',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: borne(t / 0.1) });
      const couleurs = [PALETTE.jaune, PALETTE.vert, PALETTE.bleu, PALETTE.orange];
      const c = centre(taille);
      for (let i = 0; i < 12; i++) {
        if (t > 1.1) break;
        const a = (i / 12) * Math.PI * 2;
        const v = 60 + (i % 3) * 22;
        ctx.fillStyle = couleurs[i % 4];
        ctx.globalAlpha = borne(1 - t / 1.1);
        ctx.fillRect(
          Math.round(c.x + Math.cos(a) * v * t),
          Math.round(c.y + Math.sin(a) * v * t + 120 * t * t),
          3, 3,
        );
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '8. Ressort',
    note: 'grandit d’un coup et dépasse',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: borne(ressortAmorti(t * 2.6), 0, 1.35) });
    },
  },
  {
    titre: '9. Rayons',
    note: 'quatre traits partent en croix',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      poserTuile(ctx, taille, { echelle: borne(ressortAmorti(t * 4.5), 0, 1.1) });
      const p = borne(t / 0.36);
      if (p >= 1) return;
      const c = centre(taille);
      ctx.fillStyle = PALETTE.jaune;
      ctx.globalAlpha = 1 - p;
      const d = 12 + sortieCubique(p) * 20;
      const l = Math.round(8 * (1 - p) + 2);
      ctx.fillRect(Math.round(c.x - 1), Math.round(c.y - d - l), 2, l);
      ctx.fillRect(Math.round(c.x - 1), Math.round(c.y + d), 2, l);
      ctx.fillRect(Math.round(c.x - d - l), Math.round(c.y - 1), l, 2);
      ctx.fillRect(Math.round(c.x + d), Math.round(c.y - 1), l, 2);
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '10. Pixels qui tombent',
    note: 'la tuile se reconstitue morceau par morceau',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const c = centre(taille);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const p = borne((t - i * 0.035) / 0.3);
        if (p <= 0) continue;
        const largeur = CELLULE / n;
        ctx.save();
        ctx.beginPath();
        ctx.rect(c.x - CELLULE / 2 + i * largeur, c.y - CELLULE / 2, largeur, CELLULE);
        ctx.clip();
        ctx.globalAlpha = p;
        ctx.drawImage(
          tuile,
          c.x - CELLULE / 2, c.y - CELLULE / 2 - (1 - sortieCubique(p)) * 20,
          CELLULE, CELLULE,
        );
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  },
];
