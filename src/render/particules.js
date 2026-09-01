// Particules : fumée et étoiles. Pure présentation, alimentée par le rendu.
// Rien ici n'entre dans la simulation.

import { PALETTE, PIXEL } from '../design.js';

const MAX = 240;
const particules = [];

function emettre(x, y, genre, couleur) {
  if (particules.length >= MAX) particules.shift();
  particules.push({
    x,
    y,
    vx: (Math.random() - 0.5) * (genre === 'etoile' ? 90 : 24),
    vy: genre === 'etoile' ? (Math.random() - 0.5) * 90 : -18 - Math.random() * 14,
    vie: 0,
    duree: genre === 'etoile' ? 0.5 + Math.random() * 0.3 : 0.9 + Math.random() * 0.5,
    genre,
    couleur,
  });
}

// Une bouffée de fumée : la machine travaille.
export function fumee(x, y, n = 1) {
  for (let i = 0; i < n; i++) emettre(x + (Math.random() - 0.5) * 10, y, 'fumee', PALETTE.ardoise);
}

// Quatre rayons en croix, qui partent du point posé et se rétractent.
export function rayons(x, y) {
  const directions = [[0, -1], [0, 1], [-1, 0], [1, 0]];
  for (const [dx, dy] of directions) {
    if (particules.length >= MAX) particules.shift();
    particules.push({
      x, y, dx, dy, vie: 0, duree: 0.34, genre: 'rayon', couleur: PALETTE.jaune,
      vx: 0, vy: 0,
    });
  }
}

// La pose d'un élément : la poussière que soulève la tuile, et les rayons qui
// disent que c'est fait. Les deux ensemble — l'une pèse, les autres claquent.
export function pose(x, y) {
  for (let i = 0; i < 6; i++) {
    const cote = i % 2 ? 1 : -1;
    if (particules.length >= MAX) particules.shift();
    particules.push({
      x: x + cote * (5 + i * 2),
      y: y + 8,
      vx: cote * (26 + i * 6),
      vy: -16 - i * 3,
      vie: 0,
      duree: 0.55 + i * 0.05,
      genre: 'fumee',
      couleur: PALETTE.ardoise,
    });
  }
  rayons(x, y);
}

export function majParticules(dt) {
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.vie += dt;
    if (p.vie >= p.duree) { particules.splice(i, 1); continue; }
    if (p.genre === 'rayon') continue; // un rayon ne se déplace pas, il s'étire
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.genre === 'etoile') p.vy += 220 * dt; // les étoiles retombent
  }
}

export function dessinerParticules(ctx) {
  for (const p of particules) {
    const reste = 1 - p.vie / p.duree;
    if (p.genre === 'rayon') {
      // Le rayon s'éloigne du centre en raccourcissant : un claquement bref.
      const avance = (1 - reste ** 2) * 26;
      const longueur = Math.max(PIXEL, Math.round(reste * 9 / PIXEL) * PIXEL);
      ctx.globalAlpha = reste;
      ctx.fillStyle = p.couleur;
      const l = p.dx ? longueur : PIXEL;
      const h = p.dy ? longueur : PIXEL;
      ctx.fillRect(
        Math.round(p.x + p.dx * (10 + avance) - l / 2),
        Math.round(p.y + p.dy * (10 + avance) - h / 2),
        l, h,
      );
      continue;
    }
    const taille = p.genre === 'etoile'
      ? Math.max(PIXEL, Math.round(reste * 2) * PIXEL)
      : Math.round(1 + (1 - reste) * 2) * PIXEL;
    ctx.globalAlpha = p.genre === 'etoile' ? 1 : 0.15 + reste * 0.45;
    ctx.fillStyle = p.couleur;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), taille, taille);
  }
  ctx.globalAlpha = 1;
}
