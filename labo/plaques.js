// Huit façons de dire « ceci est un bouton », avec leur réponse à l'appui.
//
// Le problème : une plaque crème pleine, posée sur un fond sombre, se lit
// comme une étiquette autant que comme une touche. Il manque ce qui fait
// qu'un bouton appelle le doigt — une forme qui se distingue de tout le reste
// du jeu (rien n'est rond dans une usine carrée), et une épaisseur qui dit
// qu'il dépasse de l'écran et peut donc s'enfoncer.
//
// Tout est dessiné en pixels d'art, sur la grille de 24 du jeu, avec quatre
// rangées de rab sous le bouton pour ce qui dépasse. Ce qui est choisi ici se
// transporte tel quel.

import { PALETTE } from '../src/design.js';
import { INTERFACE } from '../src/render/sprites.js';
import { borne, ressortAmorti, sortieCubique } from './atelier.js';

// Le bouton est plus large que l'icône qu'il porte : une icône de 24 pixels
// d'art déborde d'un disque de 24 de diamètre — la croix et la main sortent
// par les coins. Le disque fait donc 28, l'icône reste à 24, centrée.
export const ART = 28;        // le bouton : 28 pixels d'art, soit 56 unités
export const ICONE = 24;      // l'icône, inchangée
export const SOUS = 4;        // rangées sous le bouton, pour l'élévation
const PIXEL = 2;              // unités logiques par pixel d'art, comme le jeu

// Une toile de 28 × 32 : le bouton, et la place de son ombre.
function toile(peindre) {
  const c = document.createElement('canvas');
  c.width = ART;
  c.height = ART + SOUS;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  // Un disque tramé au pixel : jamais d'arc, jamais d'anti-crénelage.
  const disque = (cx, cy, r, couleur) => {
    g.fillStyle = couleur;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < ART; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
      }
    }
  };
  // L'anneau : le même disque, évidé. C'est lui qui fait les traits ronds.
  const anneau = (cx, cy, r, epaisseur, couleur) => {
    g.fillStyle = couleur;
    for (let y = 0; y < c.height; y++) {
      for (let x = 0; x < ART; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const d = Math.hypot(dx, dy);
        if (d <= r && d > r - epaisseur) g.fillRect(x, y, 1, 1);
      }
    }
  };
  peindre({ rect, disque, anneau });
  return c;
}

const cache = new Map();
function plaque(cle, peindre) {
  if (!cache.has(cle)) cache.set(cle, toile(peindre));
  return cache.get(cle);
}

const R = 13.5;  // rayon du bouton rond, en pixels d'art
const CX = 14;
const CY = 14;

// --- les huit fonds -------------------------------------------------------
//
// Sauf la plaque carrée d'aujourd'hui, toutes gardent la même teinte claire :
// une touche en ardoise éteint les signes qu'elle porte — la croix rouge n'y
// tranche plus. La sélection se dit donc par l'enfoncement, jamais par la
// couleur, et c'est ce qui a été retenu.

const FONDS = {
  // Ce que le jeu fait aujourd'hui : une plaque pleine, carrée.
  carre: ({ rect }, actif) => {
    rect(0, 0, ART, ART, actif ? PALETTE.creme : PALETTE.ardoise);
  },

  // Le cercle nu : rien d'autre n'est rond dans le jeu.
  cercle: ({ disque }, actif) => {
    disque(CX, CY, R, PALETTE.noir);
    disque(CX, CY, R - 1, PALETTE.creme);
  },

  // Le cercle et sa doublure : un second cercle, en trait seul, décalé vers le
  // bas. C'est l'épaisseur du bouton qu'on voit par en dessous.
  double: ({ disque, anneau }, actif) => {
    anneau(CX, CY + 3, R, 1.6, PALETTE.ardoise);
    disque(CX, CY, R, PALETTE.noir);
    disque(CX, CY, R - 1, PALETTE.creme);
  },

  // La même doublure, pleine : le bouton est posé sur sa tranche.
  tranche: ({ disque }, actif) => {
    disque(CX, CY + 3, R, PALETTE.noir);
    disque(CX, CY + 3, R - 1, PALETTE.ardoise);
    disque(CX, CY, R, PALETTE.noir);
    disque(CX, CY, R - 1, PALETTE.creme);
  },

  // Le jeton biseauté : une lèvre claire en haut, une ombre en bas, dans le
  // disque lui-même.
  jeton: ({ disque, rect }, actif) => {
    disque(CX, CY, R, PALETTE.noir);
    disque(CX, CY, R - 1, PALETTE.ardoise);
    disque(CX, CY - 1, R - 2, PALETTE.creme);
    rect(0, 0, 0, 0, PALETTE.noir);
  },

  // L'anneau seul : le bouton est un contour, son cœur est le fond du jeu.
  anneau: ({ anneau, disque }, actif) => {
    disque(CX, CY, R, PALETTE.noir);
    anneau(CX, CY, R, 2.5, PALETTE.creme);
  },

  // Le cercle sur son socle carré : la cible tactile reste un carré plein,
  // mais ce qu'on voit est rond.
  socle: ({ rect, disque }) => {
    rect(2, 2, ART - 4, ART - 2, PALETTE.noir);
    disque(CX, CY, R - 1, PALETTE.creme);
  },

  // Le cercle et son ombre portée, décalée en biais : l'élévation vient de la
  // lumière, pas de la tranche.
  ombre: ({ disque }, actif) => {
    disque(CX + 1, CY + 3, R, PALETTE.noir);
    disque(CX, CY, R, PALETTE.noir);
    disque(CX, CY, R - 1, PALETTE.creme);
  },
};

// --- les réponses à l'appui -----------------------------------------------
// Chacune rend le déplacement et l'échelle du bouton, et ce qu'il advient de
// sa doublure.

const APPUIS = {
  // L'écrasement élastique d'aujourd'hui : la touche garde son volume.
  ecrase: (t) => {
    const k = Math.exp(-9 * t) * Math.cos(24 * t);
    return { x: 1 + 0.3 * k, y: 1 - 0.3 * k, dy: 0 };
  },
  // Le bouton descend sur sa doublure, puis remonte : c'est le geste d'une
  // vraie touche, et il n'a de sens qu'avec une élévation dessous.
  enfonce: (t) => {
    const rendu = ressortAmorti(Math.max(0, t - 0.12), 190, 24);
    const descente = t < 0.12 ? 1 : 1 - borne(rendu);
    return { x: 1, y: 1, dy: 3 * descente, doublure: 1 - descente };
  },
  // L'enfoncement sec, sans ressort : il tombe et remonte tout droit.
  net: (t) => {
    const descente = t < 0.1 ? 1 : 1 - sortieCubique((t - 0.1) / 0.18);
    return { x: 1, y: 1, dy: 3 * descente, doublure: 1 - descente };
  },
  // Le bouton rentre en lui-même : il rapetisse, puis rebondit.
  rentre: (t) => {
    const k = 1 - 0.18 * Math.exp(-8 * t) * Math.cos(18 * t);
    return { x: k, y: k, dy: 0 };
  },
};

// --- rendu d'une vignette -------------------------------------------------

// Le bouton, à sa taille de jeu : 24 pixels d'art affichés sur 48 unités.
function bouton(ctx, fond, icone, x, y, actif, mouvement) {
  const image = plaque(fond + (actif ? '+' : '-'), (peintre) => FONDS[fond](peintre, actif));
  const l = ART * PIXEL;
  const h = (ART + SOUS) * PIXEL;
  const m = mouvement || { x: 1, y: 1, dy: 0 };

  const marge = (ART - ICONE) / 2 * PIXEL;

  ctx.save();
  ctx.translate(x + l / 2, y + l / 2 + (m.dy || 0) * PIXEL);
  ctx.scale(m.x, m.y);
  ctx.translate(-l / 2, -l / 2);
  ctx.drawImage(image, 0, 0, l, h);
  ctx.drawImage(INTERFACE[icone], marge, marge, ICONE * PIXEL, ICONE * PIXEL);
  ctx.restore();
}

function vignette(fond, appui) {
  return (ctx, t, largeur, hauteur) => {
    const taille = ART * PIXEL;
    const y = Math.round(hauteur / 2 - taille / 2) - 4;
    const x0 = Math.round((largeur - (taille * 2 + 16)) / 2);
    // À gauche, la touche qu'on appuie ; à droite, l'outil en cours, resté
    // enfoncé sur sa doublure — c'est ainsi que le jeu dit la sélection.
    bouton(ctx, fond, 'outilConstruction', x0, y, true, APPUIS[appui](Math.max(0, t - 0.35)));
    bouton(ctx, fond, 'outilDestruction', x0 + taille + 16, y, true, { x: 1, y: 1, dy: 3 });
  };
}

export const PLAQUES = [
  {
    titre: 'plaque carrée — aujourd’hui',
    note: 'la touche est un carré plein qui s’écrase à l’appui',
    duree: 1.5,
    dessiner: vignette('carre', 'ecrase'),
  },
  {
    titre: 'cercle et doublure — retenu',
    note: 'un second cercle en trait seul, dessous : le bouton descend dessus puis remonte',
    duree: 1.5,
    dessiner: vignette('double', 'enfonce'),
  },
  {
    titre: 'cercle nu',
    note: 'la forme suffit à dire la touche ; l’appui l’écrase',
    duree: 1.5,
    dessiner: vignette('cercle', 'ecrase'),
  },
  {
    titre: 'cercle sur sa tranche',
    note: 'la doublure est pleine : le bouton a une épaisseur, pas un trait',
    duree: 1.5,
    dessiner: vignette('tranche', 'enfonce'),
  },
  {
    titre: 'jeton biseauté',
    note: 'le relief est dans le disque : lèvre claire en haut, ombre en bas',
    duree: 1.5,
    dessiner: vignette('jeton', 'rentre'),
  },
  {
    titre: 'anneau',
    note: 'le bouton n’est qu’un contour — léger, mais il perd sa plaque de lecture',
    duree: 1.5,
    dessiner: vignette('anneau', 'rentre'),
  },
  {
    titre: 'cercle sur socle',
    note: 'la cible tactile reste carrée, le signe est rond',
    duree: 1.5,
    dessiner: vignette('socle', 'net'),
  },
  {
    titre: 'ombre portée',
    note: 'l’élévation vient de la lumière, en biais : le bouton flotte',
    duree: 1.5,
    dessiner: vignette('ombre', 'net'),
  },
];

// --- la barre d'outils entière -------------------------------------------
// Trois touches alignées, comme en bas de l'écran : la main, la construction,
// la destruction. C'est le seul endroit où l'on juge vraiment si l'outil en
// cours se distingue sans cadre ni mot.

const OUTILS = ['outilMain', 'outilConstruction', 'outilDestruction'];

function barre(fond, appui) {
  return (ctx, t, largeur, hauteur) => {
    const y = Math.round(hauteur / 2 - ART * PIXEL / 2) - 4;
    const pas = ART * PIXEL + 8;
    const x0 = Math.round((largeur - (pas * OUTILS.length - 8)) / 2);
    for (let i = 0; i < OUTILS.length; i++) {
      // Celle du milieu est l'outil en cours : elle reste au fond. C'est sur
      // elle que l'appui se joue.
      const enCours = i === 1;
      const m = enCours ? APPUIS[appui](Math.max(0, t - 0.35)) : null;
      bouton(ctx, fond, OUTILS[i], x0 + i * pas, y, true, enCours && !m ? { x: 1, y: 1, dy: 3 } : m);
    }
  };
}

export const BARRES = [
  {
    titre: 'plaque carrée — aujourd’hui',
    note: 'trois carrés jointifs : la barre se lit comme un bandeau, pas comme trois touches',
    duree: 1.5,
    dessiner: barre('carre', 'ecrase'),
  },
  {
    titre: 'cercle et doublure — retenu',
    note: 'trois jetons posés, l’un enfoncé : la barre se compte à l’œil',
    duree: 1.5,
    dessiner: barre('double', 'enfonce'),
  },
  {
    titre: 'cercle sur sa tranche',
    note: 'plus épais, plus lourd : la barre gagne en présence, et en encombrement',
    duree: 1.5,
    dessiner: barre('tranche', 'enfonce'),
  },
  {
    titre: 'ombre portée',
    note: 'la lumière vient d’en haut à gauche pour toute la barre',
    duree: 1.5,
    dessiner: barre('ombre', 'net'),
  },
];
