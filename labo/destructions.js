// Dix façons de détruire un élément.
// Chaque vignette retire la même tuile de convoyeur, entre deux voisines.

import { PALETTE } from '../src/design.js';

// Dessinées sur la grille de seize, elles la gardent : ces pages disent ce
// qu'on a comparé ce jour-là, pas ce que le jeu fait aujourd'hui.
const TUILE_PX = 16;
import { borne, sortieCubique, entreeCubique, tremble } from './atelier.js';

const CELLULE = 24;

const tuile = (() => {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  rect(0, 3, 16, 1, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(0, 12, 16, 1, PALETTE.noir);
  for (let x = 1; x < 16; x += 4) { rect(x, 5, 2, 1, PALETTE.bleu); rect(x, 10, 2, 1, PALETTE.bleu); }
  return c;
})();

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

const centre = (taille) => ({ x: taille / 2, y: taille / 2 });

function poser(ctx, taille, { echelle = 1, echelleY = null, dy = 0, alpha = 1, rotation = 0 }) {
  if (alpha <= 0 || echelle <= 0) return;
  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.translate(taille / 2, taille / 2 + dy);
  ctx.rotate(rotation);
  ctx.scale(echelle, echelleY === null ? echelle : echelleY);
  ctx.drawImage(tuile, -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
  ctx.restore();
}

export const DESTRUCTIONS = [
  {
    titre: '1. Éclats',
    note: 'la tuile part en morceaux',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const c = centre(taille);
      const p = borne(t / 0.5);
      if (p >= 1) return;
      for (let i = 0; i < 9; i++) {
        const cx = i % 3;
        const cy = Math.floor(i / 3);
        const dx = (cx - 1) * 70;
        const dy = (cy - 1) * 50 - 30;
        ctx.globalAlpha = 1 - p;
        ctx.drawImage(
          tuile, (cx * TUILE_PX) / 3, (cy * TUILE_PX) / 3, TUILE_PX / 3, TUILE_PX / 3,
          Math.round(c.x - CELLULE / 2 + (cx * CELLULE) / 3 + dx * p),
          Math.round(c.y - CELLULE / 2 + (cy * CELLULE) / 3 + dy * p + 130 * p * p),
          CELLULE / 3, CELLULE / 3,
        );
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '2. Écrasement',
    note: 'la tuile s’aplatit et disparaît',
    duree: 1.4,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const p = borne(t / 0.26);
      poser(ctx, taille, { echelle: 1 + 0.4 * p, echelleY: 1 - p, alpha: 1 - p * 0.6 });
      if (p >= 1) return;
      ctx.globalAlpha = 1 - p;
      ctx.fillStyle = PALETTE.ardoise;
      const r = 12 + p * 22;
      const c = centre(taille);
      ctx.fillRect(Math.round(c.x - r), Math.round(c.y + 8), Math.round(r * 2), 2);
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '3. Poussière',
    note: 'elle se dissout en poussière',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const p = borne(t / 0.4);
      poser(ctx, taille, { alpha: 1 - p });
      const c = centre(taille);
      for (let i = 0; i < 10; i++) {
        const age = t - i * 0.02;
        if (age <= 0 || age > 0.7) continue;
        ctx.globalAlpha = (1 - age / 0.7) * 0.7;
        ctx.fillStyle = PALETTE.ardoise;
        const s = Math.round(2 + age * 4);
        ctx.fillRect(
          Math.round(c.x + tremble(i, i) * 16),
          Math.round(c.y + 6 - age * 34 + tremble(i + 3, i) * 6), s, s,
        );
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '4. Aspiration',
    note: 'elle rétrécit et s’en va',
    duree: 1.4,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const p = borne(t / 0.3);
      poser(ctx, taille, { echelle: 1 - sortieCubique(p), rotation: p * 1.2 });
    },
  },
  {
    titre: '5. Éclair rouge',
    note: 'un flash rouge, et plus rien',
    duree: 1.4,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const p = borne(t / 0.22);
      if (p < 1) poser(ctx, taille, { alpha: 1 });
      if (t < 0.24) {
        ctx.globalAlpha = 1 - t / 0.24;
        ctx.fillStyle = PALETTE.rouge;
        const r = 12 + t * 150;
        const c = centre(taille);
        ctx.fillRect(Math.round(c.x - r), Math.round(c.y - r), Math.round(r * 2), Math.round(r * 2));
        ctx.globalAlpha = 1;
      }
    },
  },
  {
    titre: '6. Chute',
    note: 'elle tombe hors de la grille',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const p = borne(t / 0.6);
      poser(ctx, taille, { dy: entreeCubique(p) * 90, rotation: p * 0.9, alpha: 1 - p * 0.3 });
    },
  },
  {
    titre: '7. Effacement par bandes',
    note: 'elle s’efface tranche par tranche',
    duree: 1.5,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const c = centre(taille);
      const n = 8;
      for (let i = 0; i < n; i++) {
        const p = borne((t - i * 0.03) / 0.18);
        if (p >= 1) continue;
        const largeur = CELLULE / n;
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.beginPath();
        ctx.rect(c.x - CELLULE / 2 + i * largeur, c.y - CELLULE / 2, largeur, CELLULE);
        ctx.clip();
        ctx.drawImage(tuile, c.x - CELLULE / 2, c.y - CELLULE / 2, CELLULE, CELLULE);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '8. Secousse puis rupture',
    note: 'elle tremble avant de céder',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      if (t < 0.3) {
        ctx.save();
        ctx.translate(Math.round(tremble(t * 3, 1) * 3), 0);
        poser(ctx, taille, {});
        ctx.restore();
        return;
      }
      const p = borne((t - 0.3) / 0.4);
      const c = centre(taille);
      for (const cote of [-1, 1]) {
        ctx.save();
        ctx.globalAlpha = 1 - p;
        ctx.translate(c.x + cote * p * 34, c.y + p * p * 60);
        ctx.rotate(cote * p * 0.8);
        ctx.beginPath();
        ctx.rect(cote < 0 ? -CELLULE / 2 : 0, -CELLULE / 2, CELLULE / 2, CELLULE);
        ctx.clip();
        ctx.drawImage(tuile, -CELLULE / 2, -CELLULE / 2, CELLULE, CELLULE);
        ctx.restore();
      }
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '9. Croix rouge',
    note: 'une croix marque, puis efface',
    duree: 1.6,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const p = borne(t / 0.34);
      poser(ctx, taille, { alpha: 1 - borne((t - 0.2) / 0.3) });
      if (t > 0.5) return;
      const c = centre(taille);
      ctx.strokeStyle = PALETTE.rouge;
      ctx.lineWidth = 3;
      ctx.globalAlpha = borne(1 - (t - 0.34) / 0.16);
      const r = 11 * sortieCubique(p);
      ctx.beginPath();
      ctx.moveTo(c.x - r, c.y - r); ctx.lineTo(c.x + r, c.y + r);
      ctx.moveTo(c.x + r, c.y - r); ctx.lineTo(c.x - r, c.y + r);
      ctx.stroke();
      ctx.globalAlpha = 1;
    },
  },
  {
    titre: '10. Rouille',
    note: 'elle rougit puis s’émiette',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      decor(ctx, taille);
      const rouge = borne(t / 0.25);
      const p = borne((t - 0.25) / 0.45);
      const c = centre(taille);
      if (p < 1) {
        poser(ctx, taille, { alpha: 1 - p });
        ctx.globalAlpha = rouge * (1 - p) * 0.7;
        ctx.fillStyle = PALETTE.rouge;
        ctx.fillRect(c.x - CELLULE / 2, c.y - CELLULE / 2, CELLULE, CELLULE);
        ctx.globalAlpha = 1;
      }
      for (let i = 0; i < 12; i++) {
        const age = t - 0.25 - i * 0.015;
        if (age <= 0 || age > 0.8) continue;
        ctx.globalAlpha = 1 - age / 0.8;
        ctx.fillStyle = PALETTE.rouge;
        ctx.fillRect(
          Math.round(c.x + tremble(i, i) * 12),
          Math.round(c.y + tremble(i + 5, i) * 8 + age * 70), 2, 2,
        );
      }
      ctx.globalAlpha = 1;
    },
  },
];
