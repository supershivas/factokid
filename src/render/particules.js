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

// La vapeur d'une machine qui vient de réussir : deux jets par les flancs, et
// un champignon au-dessus. Elle est blanche là où la fumée d'un extracteur est
// ardoise — l'une dit « ça travaille », l'autre « ça vient de sortir ».
//
// C'est de la vapeur sous pression : elle part vite et se freine, au lieu de
// monter doucement comme une fumée. Ce freinage est tout ce qui les distingue.
export function vapeur(x, y) {
  // Les deux flancs, à mi-hauteur de la machine.
  for (const cote of [-1, 1]) {
    for (let i = 0; i < 4; i++) {
      ajouter({
        x: x + cote * 14,
        y: y + 4 - i,
        vx: cote * (150 - i * 18),
        vy: -30 - i * 6,
        vie: -i * 0.045,
        duree: 0.5 + i * 0.04,
        genre: 'vapeur',
        taille: 6 + i * 1.5,
        couleur: PALETTE.creme,
      });
    }
  }
  // Le pied du champignon : un trait fin qui monte vite.
  for (let i = 0; i < 3; i++) {
    ajouter({
      x, y: y - 6, vx: (Math.random() - 0.5) * 12, vy: -170 + i * 14,
      vie: -i * 0.03, duree: 0.42, genre: 'vapeur', taille: 5, couleur: PALETTE.creme,
    });
  }
  // Sa tête : elle s'ouvre plus haut, et plus tard.
  for (let i = 0; i < 5; i++) {
    const cote = i % 2 ? 1 : -1;
    ajouter({
      x, y: y - 24,
      vx: cote * (40 + i * 16), vy: -34,
      vie: -0.16 - i * 0.02, duree: 0.6, genre: 'vapeur', taille: 7 + i * 1.5,
      couleur: PALETTE.creme,
    });
  }
}

export function majParticules(dt) {
  for (let i = particules.length - 1; i >= 0; i--) {
    const p = particules[i];
    p.vie += dt;
    if (p.vie >= p.duree) { particules.splice(i, 1); continue; }
    if (p.vie < 0) continue; // pas encore née : c'est ainsi qu'un souffle s'étale
    if (p.genre === 'rayon') continue; // un rayon ne se déplace pas, il s'étire
    p.x += p.vx * dt;
    p.y += p.vy * dt;
    if (p.genre === 'etoile') p.vy += 220 * dt; // les étoiles retombent
    if (p.genre === 'eclat') p.vy += 260 * dt;  // l'éclat retombe, il pèse
    if (p.genre === 'rouille') {
      p.vy += 150 * dt;                          // l'écaille tombe plus mollement
      p.vx *= 1 - 1.6 * dt;                      // et se freine dans l'air
    }
    if (p.genre === 'vapeur') {
      // Sous pression : le souffle part vite et se freine fort. Sans ce
      // freinage, ce serait de la fumée.
      const frein = 1 - 6 * dt;
      p.vx *= frein;
      p.vy *= frein;
    }
  }
}

// Trois carrés décalés font un nuage ; un seul resterait un carré.
const GRAINS = [[0, 0, 1], [-0.45, -0.3, 0.62], [0.42, 0.28, 0.55]];

export function dessinerParticules(ctx) {
  for (const p of particules) {
    if (p.vie < 0) continue;
    const reste = 1 - p.vie / p.duree;
    if (p.genre === 'vapeur') {
      const part = p.vie / p.duree;
      const enfle = p.taille * (0.5 + part * 1.2);
      ctx.globalAlpha = part < 0.12 ? part / 0.12 : reste;
      ctx.fillStyle = p.couleur;
      for (const [dx, dy, k] of GRAINS) {
        const cote = Math.max(PIXEL, Math.round((enfle * k) / PIXEL) * PIXEL);
        ctx.fillRect(
          Math.round((p.x + dx * enfle - cote / 2) / PIXEL) * PIXEL,
          Math.round((p.y + dy * enfle - cote / 2) / PIXEL) * PIXEL,
          cote, cote,
        );
      }
      continue;
    }
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
