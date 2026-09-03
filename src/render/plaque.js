// Les touches du jeu : leur forme, leur épaisseur, et la façon dont elles
// s'enfoncent. Ne modifie jamais l'état.
//
// Une plaque crème posée sur un fond sombre se lit comme une étiquette autant
// que comme un bouton. Deux choses le disent mieux :
//
//   la forme — rien n'est rond dans une usine faite de cases, donc un rond
//   n'est jamais qu'un bouton ;
//   l'épaisseur — un second cercle, en trait seul, décalé sous le premier. Le
//   bouton a un dessous, donc il peut descendre dessus. C'est ce que fait
//   l'appui (voir bouton.js).
//
// Tout est tramé au pixel d'art : jamais d'arc, jamais d'anti-crénelage. Les
// sprites sont peints une fois et gardés — un bouton ne se redessine pas
// soixante fois par seconde.

import { PALETTE, PIXEL } from '../design.js';

// Décalage de la doublure, en pixels d'art. C'est aussi la course de l'appui :
// le bouton s'enfonce exactement jusqu'à elle.
export const DOUBLURE = 3;

// La part de la touche que l'icône occupe : le rond fait 28 pixels d'art,
// l'icône 24. Le rapport tombe juste aux deux tailles employées — 56 unités
// portent une icône de 48, 28 en portent une de 24.
const PART_ICONE = 6 / 7;

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
// lisent, et sa doublure prend l'autre valeur pour rester visible.
export const CLAIRE = { corps: PALETTE.creme, doublure: PALETTE.ardoise };
export const SOMBRE = { corps: PALETTE.ardoise, doublure: PALETTE.creme };

// La doublure et le corps sont deux sprites, et c'est tout le mécanisme : la
// doublure reste au sol, le corps descend dessus. S'ils ne faisaient qu'une
// image, elle descendrait avec lui et le bouton n'aurait jamais l'air enfoncé.
function doublureRonde(art, teinte) {
  return garder('doublure' + art + teinte.doublure, () => toile(art, art + DOUBLURE, ({ anneau }) => {
    anneau(art / 2, art / 2 + DOUBLURE, art / 2 - 0.5, 1.2, teinte.doublure);
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
export function dessinerTouche(ctx, r, image, { teinte = CLAIRE, enfonce = 0, alpha = 1 } = {}) {
  const art = Math.round(r.l / PIXEL);
  const dy = Math.round(enfonce * DOUBLURE) * PIXEL;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(doublureRonde(art, teinte), r.x, r.y, r.l, (art + DOUBLURE) * PIXEL);
  ctx.drawImage(corpsRond(art, teinte), r.x, r.y + dy, r.l, r.l);
  if (image) {
    // L'icône est centrée dans le rond : c'est le rond qui s'est élargi pour
    // l'accueillir, pas l'icône qui a rétréci.
    const taille = Math.round(r.l * PART_ICONE);
    const marge = (r.l - taille) / 2;
    ctx.drawImage(image, r.x + marge, r.y + dy + marge, taille, taille);
  }
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

function doublurePilule(l, h, teinte) {
  return garder('doublurePilule' + l + 'x' + h + teinte.doublure, () => toile(l, h + DOUBLURE, (g) => {
    corpsPilule(g, l, h, DOUBLURE, teinte.doublure, 0);
    corpsPilule(g, l, h, DOUBLURE, PALETTE.noir, 1.2);
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
  const dy = Math.round(enfonce * DOUBLURE) * PIXEL;

  ctx.save();
  ctx.globalAlpha = alpha;
  ctx.drawImage(doublurePilule(l, h, teinte), r.x, r.y, r.l, (h + DOUBLURE) * PIXEL);
  ctx.drawImage(spritePilule(l, h, teinte), r.x, r.y + dy, r.l, r.h);
  ctx.restore();
  return dy;
}
