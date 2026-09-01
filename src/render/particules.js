// Particules : fumée, étoiles, éclats et rouille. Pure présentation, alimentée
// par le rendu. Rien ici n'entre dans la simulation.

import { PALETTE, PIXEL } from '../design.js';

const MAX = 240;
const particules = [];

function ajouter(p) {
  if (particules.length >= MAX) particules.shift();
  particules.push(p);
}

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

// La destruction : trois matières mêlées. L'éclat part vite et retombe, la
// poussière reste au sol et s'étale, la rouille tombe en écailles qui tournent.
// Aucune des trois ne suffit seule : l'éclat sans poussière est sec, la
// poussière sans éclat est molle.
export function destruction(x, y) {
  for (let i = 0; i < 10; i++) {
    const angle = (Math.PI * 2 * i) / 10 + (Math.random() - 0.5) * 0.5;
    const vitesse = 80 + Math.random() * 70;
    ajouter({
      x, y,
      vx: Math.cos(angle) * vitesse,
      vy: Math.sin(angle) * vitesse - 40,
      vie: 0,
      duree: 0.34 + Math.random() * 0.18,
      genre: 'eclat',
      couleur: i % 3 === 0 ? PALETTE.creme : PALETTE.ardoise,
    });
  }
  for (let i = 0; i < 8; i++) {
    const cote = i % 2 ? 1 : -1;
    ajouter({
      x: x + cote * (3 + i * 2),
      y: y + 10,
      vx: cote * (18 + i * 5),
      vy: -8 - Math.random() * 8,
      vie: 0,
      duree: 0.7 + i * 0.05,
      genre: 'fumee',
      couleur: PALETTE.ardoise,
    });
  }
  for (let i = 0; i < 7; i++) {
    ajouter({
      x: x + (Math.random() - 0.5) * 18,
      y: y + (Math.random() - 0.5) * 12,
      vx: (Math.random() - 0.5) * 40,
      vy: -20 - Math.random() * 30,
      vie: 0,
      duree: 0.6 + Math.random() * 0.3,
      genre: 'rouille',
      couleur: i % 2 ? PALETTE.orange : PALETTE.rouge,
    });
  }
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
    if (p.genre === 'eclat') p.vy += 260 * dt;  // l'éclat retombe, il pèse
    if (p.genre === 'rouille') {
      p.vy += 150 * dt;                          // l'écaille tombe plus mollement
      p.vx *= 1 - 1.6 * dt;                      // et se freine dans l'air
    }
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
    if (p.genre === 'eclat') {
      // Un éclat garde sa taille et s'éteint d'un coup : un morceau, pas un nuage.
      ctx.globalAlpha = reste > 0.2 ? 1 : reste / 0.2;
      ctx.fillStyle = p.couleur;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), PIXEL, PIXEL);
      continue;
    }
    if (p.genre === 'rouille') {
      // L'écaille tourne : elle s'aplatit puis se redresse, sans jamais tourner
      // vraiment — deux rectangles suffisent à le faire croire.
      const tour = Math.abs(Math.cos(p.vie * 14));
      const l = Math.max(PIXEL, Math.round(tour * 2) * PIXEL);
      ctx.globalAlpha = reste;
      ctx.fillStyle = p.couleur;
      ctx.fillRect(Math.round(p.x), Math.round(p.y), l, PIXEL);
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
