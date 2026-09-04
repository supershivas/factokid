// Le socle du bouton, et ce que fait son corps quand on appuie dessus.
//
// La forme est arrêtée : un rond, parce que rien n'est rond dans une usine
// faite de cases. Restent deux questions, et ce sont elles qu'on compare ici :
// de quoi le socle a l'air — c'est la pièce qui ne bouge jamais, le sol du
// bouton — et ce que le corps fait en remontant quand le doigt le lâche.
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

// --- les socles -----------------------------------------------------------
//
// Le socle est ce qui reste au sol. Le corps du bouton, lui, est le même
// partout : un disque clair cerné de noir, dessiné plus bas.
//
// Toutes les touches gardent la même teinte claire : une touche en ardoise
// éteint les signes qu'elle porte — la croix rouge n'y tranche plus. La
// sélection se dit par l'enfoncement, jamais par la couleur.

const FONDS = {
  // Pas de socle du tout : le cercle nu, tel qu'il était avant. Il sert à
  // comparer l'écrasement d'hier à l'enfoncement d'aujourd'hui.
  cercle: () => {},

  // Le socle : un second cercle, plein, cerné de noir comme le corps. C'est
  // une pièce du bouton, pas son ombre — et il ne bouge jamais.
  double: ({ disque }) => {
    disque(CX, CY + 3, R, PALETTE.noir);
    disque(CX, CY + 3, R - 1, PALETTE.ardoise);
  },

  // Un socle en trait seul : plus léger, mais le bouton semble flotter plutôt
  // que reposer.
  trait: ({ anneau }) => {
    anneau(CX, CY + 3, R, 1.2, PALETTE.ardoise);
  },

  // Un socle deux fois plus haut : la course est plus longue, le bouton plus
  // haut sur pattes.
  haut: ({ disque }) => {
    disque(CX, CY + 5, R, PALETTE.noir);
    disque(CX, CY + 5, R - 1, PALETTE.ardoise);
  },
};

// --- les réponses à l'appui -----------------------------------------------
//
// Le socle ne bouge dans aucune : c'est le sol du bouton. Ce qui change d'une
// proposition à l'autre, c'est la façon dont le corps descend dessus et,
// surtout, ce qu'il fait en remontant quand le doigt le lâche.
//
// Chaque réponse prend le temps écoulé et l'instant du relâchement, et rend le
// déplacement du corps — en pixels d'art, vers le bas — plus son étirement.

// Le ressort du jeu : il remonte du fond, dépasse le repos, et se pose. Le
// dépassement vaut exp(-λπ/ω).
function ressort(t, amorti, pulsation) {
  return Math.exp(-amorti * t)
    * (Math.cos(pulsation * t) + (amorti / pulsation) * Math.sin(pulsation * t));
}

const APPUIS = {
  // Ce qui est retenu : au fond tant que le doigt tient, puis un rebond franc
  // qui décolle le bouton de son socle avant qu'il s'y repose.
  rebond: (t, leve) => ({ dy: 3 * (t < leve ? 1 : ressort(t - leve, 4.5, 26)) }),

  // Le même, sans rien au-dessus du repos : il remonte et s'arrête net.
  sansRebond: (t, leve) => ({
    dy: 3 * (t < leve ? 1 : 1 - sortieCubique((t - leve) / 0.16)),
  }),

  // Un rebond plus long, qui oscille deux fois de plus avant de se poser.
  mou: (t, leve) => ({ dy: 3 * (t < leve ? 1 : ressort(t - leve, 2.4, 20)) }),

  // Un rebond haut : le bouton saute presque une hauteur de socle au-dessus
  // du repos. Vif, mais il quitte sa place.
  saut: (t, leve) => ({ dy: 3 * (t < leve ? 1 : ressort(t - leve, 1.8, 30)) }),

  // Le rebond retenu, plus l'étirement : le corps s'allonge en montant et
  // s'écrase en retombant, comme une balle.
  etire: (t, leve) => {
    const u = t < leve ? 1 : ressort(t - leve, 4.5, 26);
    // La vitesse du corps donne l'étirement : il s'allonge quand il monte.
    const v = t < leve ? 0 : (ressort(t - leve, 4.5, 26) - ressort(t - leve + 0.016, 4.5, 26));
    return { dy: 3 * u, x: 1 - v * 0.5, y: 1 + v * 0.5 };
  },

  // L'écrasement d'avant les socles, pour mémoire : la touche se déforme au
  // lieu de descendre.
  ecrase: (t, leve) => {
    if (t < leve) return { dy: 0, x: 1.2, y: 0.8 };
    const k = Math.exp(-9 * (t - leve)) * Math.cos(24 * (t - leve));
    return { dy: 0, x: 1 + 0.2 * k, y: 1 - 0.2 * k };
  },
};

// --- rendu d'une vignette -------------------------------------------------

// Le corps du bouton : le disque clair et son contour. Il est le même partout
// — c'est le socle qui change d'une proposition à l'autre, et la façon dont le
// corps voyage dessus.
const corps = plaque('corps', ({ disque }) => {
  disque(CX, CY, R, PALETTE.noir);
  disque(CX, CY, R - 1, PALETTE.creme);
});

// L'instant où le doigt lâche la touche, dans la boucle de la vignette.
const LEVE = 0.4;

function bouton(ctx, fond, icone, x, y, mouvement) {
  const image = plaque(fond, (peintre) => FONDS[fond](peintre));
  const l = ART * PIXEL;
  const h = (ART + SOUS) * PIXEL;
  const m = mouvement || { dy: 0 };
  const marge = (ART - ICONE) / 2 * PIXEL;

  // Le socle, à sa place, toujours. Il ne bouge dans aucune proposition.
  ctx.drawImage(image, x, y, l, h);

  ctx.save();
  ctx.translate(x + l / 2, y + l / 2 + (m.dy || 0) * PIXEL);
  ctx.scale(m.x || 1, m.y || 1);
  ctx.translate(-l / 2, -l / 2);
  ctx.drawImage(corps, 0, 0, l, l);
  ctx.drawImage(INTERFACE[icone], marge, marge, ICONE * PIXEL, ICONE * PIXEL);
  ctx.restore();
}

function vignette(fond, appui) {
  return (ctx, t, largeur, hauteur) => {
    const taille = ART * PIXEL;
    const y = Math.round(hauteur / 2 - taille / 2) - 6;
    const x0 = Math.round((largeur - (taille * 2 + 16)) / 2);
    // À gauche, la touche qu'on appuie : le doigt la tient un moment, puis la
    // lâche. À droite, l'outil en cours, resté au fond — c'est ainsi que le
    // jeu dit la sélection.
    bouton(ctx, fond, 'outilConstruction', x0, y, APPUIS[appui](t, LEVE));
    bouton(ctx, fond, 'outilDestruction', x0 + taille + 16, y, { dy: 3 });
  };
}

export const PLAQUES = [
  {
    titre: 'socle plein, rebond — retenu',
    note: 'au fond tant que le doigt tient, puis un rebond qui décolle le corps de son socle',
    duree: 1.6,
    dessiner: vignette('double', 'rebond'),
  },
  {
    titre: 'sans rebond',
    note: 'il remonte et s’arrête net : correct, mais rien ne récompense le doigt',
    duree: 1.6,
    dessiner: vignette('double', 'sansRebond'),
  },
  {
    titre: 'rebond mou',
    note: 'deux oscillations de plus : la touche a l’air molle',
    duree: 1.6,
    dessiner: vignette('double', 'mou'),
  },
  {
    titre: 'rebond haut',
    note: 'il saute presque une hauteur de socle : vif, mais il quitte sa place',
    duree: 1.6,
    dessiner: vignette('double', 'saut'),
  },
  {
    titre: 'rebond et étirement',
    note: 'le corps s’allonge en montant, s’écrase en retombant — une balle',
    duree: 1.6,
    dessiner: vignette('double', 'etire'),
  },
  {
    titre: 'socle en trait seul',
    note: 'le socle d’hier : plus léger, mais le bouton flotte au lieu de reposer',
    duree: 1.6,
    dessiner: vignette('trait', 'rebond'),
  },
  {
    titre: 'socle deux fois plus haut',
    note: 'course plus longue, bouton sur pattes : l’appui se voit de loin',
    duree: 1.6,
    dessiner: vignette('haut', 'rebond'),
  },
  {
    titre: 'écrasement — avant les socles',
    note: 'la touche se déforme au lieu de descendre : pour mémoire',
    duree: 1.6,
    dessiner: vignette('cercle', 'ecrase'),
  },
];

// --- la barre d'outils entière -------------------------------------------
// Trois touches alignées, comme en bas de l'écran : la main, la construction,
// la destruction. C'est le seul endroit où l'on juge vraiment si l'outil en
// cours se distingue sans cadre ni mot.

const OUTILS = ['outilMain', 'outilConstruction', 'outilDestruction'];

function barre(fond, appui) {
  return (ctx, t, largeur, hauteur) => {
    const taille = ART * PIXEL;
    const y = Math.round(hauteur / 2 - taille / 2) - 6;
    const pas = taille + 8;
    const x0 = Math.round((largeur - (pas * OUTILS.length - 8)) / 2);
    for (let i = 0; i < OUTILS.length; i++) {
      // Celle du milieu est l'outil en cours : elle reste au fond. C'est sur
      // la première que l'appui se joue.
      const m = i === 0 ? APPUIS[appui](t, LEVE) : { dy: i === 1 ? 3 : 0 };
      bouton(ctx, fond, OUTILS[i], x0 + i * pas, y, m);
    }
  };
}

export const BARRES = [
  {
    titre: 'socle plein, rebond — retenu',
    note: 'la première rebondit, celle du milieu est l’outil en cours, la dernière attend',
    duree: 1.6,
    dessiner: barre('double', 'rebond'),
  },
  {
    titre: 'socle en trait seul',
    note: 'la barre s’allège, mais les touches semblent posées sur rien',
    duree: 1.6,
    dessiner: barre('trait', 'rebond'),
  },
  {
    titre: 'socle deux fois plus haut',
    note: 'trois jetons sur pattes : la barre gagne en présence, et en encombrement',
    duree: 1.6,
    dessiner: barre('haut', 'rebond'),
  },
  {
    titre: 'écrasement — avant les socles',
    note: 'pour comparer : rien ne descend, tout se déforme',
    duree: 1.6,
    dessiner: barre('cercle', 'ecrase'),
  },
];
