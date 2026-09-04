// Les touches du jeu : leur forme, leur socle, et la façon dont elles
// s'enfoncent. Ne modifie jamais l'état.
//
// Une plaque crème posée sur un fond sombre se lit comme une étiquette autant
// que comme un bouton. Deux choses le disent mieux :
//
//   la forme — rien n'est rond dans une usine faite de cases, donc un rond
//   n'est jamais qu'un bouton ;
//   le socle — un second cercle, plein, décalé sous le premier. Le socle ne
//   bouge jamais : c'est le sol du bouton. Seul le corps descend dessus, et
//   rebondit au-dessus quand le doigt le lâche (voir bouton.js).
//
// Tout est tramé au pixel d'art : jamais d'arc, jamais d'anti-crénelage. Les
// sprites sont peints une fois et gardés — un bouton ne se redessine pas
// soixante fois par seconde.

import { PALETTE, PIXEL, poserImage } from '../design.js';

// Hauteur du socle, en pixels d'art. C'est aussi la course de l'appui : le
// corps descend exactement jusqu'au sol.
export const SOCLE = 3;

// La part de la touche qu'une image occupe. Deux valeurs, parce que les deux
// familles d'images ne remplissent pas leur carré de la même façon : une icône
// d'interface s'arrête avant ses coins (le rond peut donc être plus serré),
// une matière remplit le sien jusqu'au bord et doit s'inscrire dans le cercle
// — d'où le rapport proche de 1/√2.
export const PART_ICONE = 6 / 7;
export const PART_ITEM = 0.72;

// Où poser l'image dans la touche : la règle est dans le design system, et
// l'outil de lisibilité la relit — c'est elle qui garantit qu'une matière
// reste centrée et nette dans son jeton.
function dessinerImage(ctx, image, r, dy, part) {
  const { taille, marge } = poserImage(r.l, image.width || 24, part);
  ctx.drawImage(image, r.x + marge, r.y + dy + marge, taille, taille);
}

const cache = new Map();

function toile(l, h, peindre) {
  const c = document.createElement('canvas');
  c.width = l;
  c.height = h;
  const g = c.getContext('2d');
  const rect = (x, y, w, hauteur, couleur) => {
    g.fillStyle = couleur;
    g.fillRect(x, y, w, hauteur);
  };
  const disque = (cx, cy, r, couleur) => {
    g.fillStyle = couleur;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < l; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
      }
    }
  };
  const anneau = (cx, cy, r, epaisseur, couleur) => {
    g.fillStyle = couleur;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < l; x++) {
        const d = Math.hypot(x + 0.5 - cx, y + 0.5 - cy);
        if (d <= r && d > r - epaisseur) g.fillRect(x, y, 1, 1);
      }
    }
  };
  peindre({ rect, disque, anneau });
  return c;
}

function garder(cle, fabriquer) {
  if (!cache.has(cle)) cache.set(cle, fabriquer());
  return cache.get(cle);
}

// --- touche ronde ---------------------------------------------------------

// Deux teintes de touche, et pas une de plus : la claire porte des signes
// sombres — la main, le plus, la croix ; la sombre porte des images claires —
// les machines, les matières. Chacune garde le fond sur lequel ses signes se
// lisent, et son socle prend l'autre valeur pour rester visible.
export const CLAIRE = { corps: PALETTE.creme, socle: PALETTE.ardoise };
export const SOMBRE = { corps: PALETTE.ardoise, socle: PALETTE.creme };

// Le socle et le corps sont deux sprites, et c'est tout le mécanisme : le
// socle reste posé, le corps voyage dessus. S'ils ne faisaient qu'une image,
// le socle descendrait avec lui et rien n'aurait l'air enfoncé.
//
// Le socle est un disque plein, cerné de noir comme le corps : c'est une
// pièce du bouton, pas son ombre. On n'en voit que le croissant du bas quand
// le bouton est au repos, et tout entier quand il décolle au rebond.
function socleRond(art, teinte) {
  return garder('socle' + art + teinte.socle, () => toile(art, art + SOCLE, ({ disque }) => {
    const c = art / 2;
    const r = art / 2 - 0.5;
    disque(c, c + SOCLE, r, PALETTE.noir);
    disque(c, c + SOCLE, r - 1, teinte.socle);
  }));
}

function corpsRond(art, teinte) {
  return garder('rond' + art + teinte.corps, () => toile(art, art, ({ disque }) => {
    const c = art / 2;
    const r = art / 2 - 0.5;
    disque(c, c, r, PALETTE.noir);
    disque(c, c, r - 1, teinte.corps);
  }));
}

// Dessine une touche ronde et l'icône qu'elle porte. `enfonce` va de 0 à 1 :
// à 1, le bouton est au fond, posé sur sa doublure — qui disparaît alors,
// puisqu'elle est dessous.
//
// C'est là toute la marque de sélection du jeu : l'outil en cours est une
// touche restée enfoncée. Pas de cadre, pas de couleur en plus — le signe est
// celui qu'ont toutes les touches du monde.
export function dessinerTouche(
  ctx, r, image, { teinte = CLAIRE, enfonce = 0, alpha = 1, part = PART_ICONE } = {},
) {
  const art = Math.round(r.l / PIXEL);
  const dy = Math.round(enfonce * SOCLE) * PIXEL;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(socleRond(art, teinte), r.x, r.y, r.l, (art + SOCLE) * PIXEL);
  ctx.drawImage(corpsRond(art, teinte), r.x, r.y + dy, r.l, r.l);
  // L'image est centrée dans le rond : c'est le rond qui s'est élargi pour
  // l'accueillir, pas l'image qui a rétréci.
  if (image) dessinerImage(ctx, image, r, dy, part);
  ctx.restore();
}

// --- pilule ---------------------------------------------------------------

// Les boutons larges — le menu pause, l'écran des essais — ne peuvent pas être
// ronds : ils portent un mot. Ils gardent la même épaisseur et les mêmes bouts
// arrondis, à la hauteur d'un rond coupé en deux.
// Le corps d'une pilule : deux demi-disques et un rectangle entre eux.
function corpsPilule(g, l, h, dy, couleur, retrait) {
  const r = h / 2;
  g.disque(r, r + dy, r - retrait, couleur);
  g.disque(l - r, r + dy, r - retrait, couleur);
  g.rect(r, dy + retrait, l - h, h - retrait * 2, couleur);
}

function soclePilule(l, h, teinte) {
  return garder('soclePilule' + l + 'x' + h + teinte.socle, () => toile(l, h + SOCLE, (g) => {
    corpsPilule(g, l, h, SOCLE, PALETTE.noir, 0);
    corpsPilule(g, l, h, SOCLE, teinte.socle, 1);
  }));
}

function spritePilule(l, h, teinte) {
  return garder('pilule' + l + 'x' + h + teinte.corps, () => toile(l, h, (g) => {
    corpsPilule(g, l, h, 0, PALETTE.noir, 0);
    corpsPilule(g, l, h, 0, teinte.corps, 1);
  }));
}

// Rend le décalage qu'a pris le corps : ce qu'on pose dessus — une icône, un
// mot — doit descendre avec lui.
export function dessinerPilule(ctx, r, { teinte = CLAIRE, enfonce = 0, alpha = 1 } = {}) {
  const l = Math.round(r.l / PIXEL);
  const h = Math.round(r.h / PIXEL);
  const dy = Math.round(enfonce * SOCLE) * PIXEL;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(soclePilule(l, h, teinte), r.x, r.y, r.l, (h + SOCLE) * PIXEL);
  ctx.drawImage(spritePilule(l, h, teinte), r.x, r.y + dy, r.l, r.h);
  ctx.restore();
  return dy;
}
