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

// Une gerbe d'étoiles : quelque chose vient d'être posé.
export function etoiles(x, y, n = 8) {
  for (let i = 0; i < n; i++) {
    emettre(x, y, 'etoile', i % 2 ? PALETTE.jaune : PALETTE.creme);
  }
}

export function majParticules(dt) {
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.vie += dt;
    if (p.vie >= p.duree) { particules.splice(i, 1); continue; }
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.genre === 'etoile') p.vy += 220 * dt; // les étoiles retombent
  }
}

export function dessinerParticules(ctx) {
  for (const p of particules) {
    const reste = 1 - p.vie / p.duree;
    const taille = p.genre === 'etoile'
      ? Math.max(PIXEL, Math.round(reste * 2) * PIXEL)
      : Math.round(1 + (1 - reste) * 2) * PIXEL;
    ctx.globalAlpha = p.genre === 'etoile' ? 1 : 0.15 + reste * 0.45;
    ctx.fillStyle = p.couleur;
    ctx.fillRect(Math.round(p.x), Math.round(p.y), taille, taille);
  }
  ctx.globalAlpha = 1;
}
