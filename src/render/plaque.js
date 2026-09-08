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
// La touche est un bonbon : verni, bombé, posé sur son ombre — c'est la
// direction retenue au labo (labo/touches.html, direction 2). Le bombé est un
// dégradé, et un dégradé de pixel art est une pile de bandes : une clarté en
// haut, le corps au milieu, une ombre en bas. Aucune n'est calculée — ce sont
// trois couleurs de la palette, données par `FACES`.
//
// Appuyer retourne le bombé : la lumière passe dessous, le creux passe
// dessus. C'est ce qui fait qu'une touche enfoncée se lit enfoncée même
// immobile, et la sélection du jeu est justement une touche restée au fond.
//
// Tout est tramé au pixel d'art : jamais d'arc, jamais d'anti-crénelage. Les
// sprites sont peints une fois et gardés — un bouton ne se redessine pas
// soixante fois par seconde.

import { PALETTE, FACES, PIXEL, poserImage } from '../design.js';

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
  // Une tranche horizontale de disque : c'est ainsi qu'une bande de dégradé
  // se découpe sans jamais sortir du rond.
  const calotte = (cx, cy, r, y0, y1, couleur) => {
    g.fillStyle = couleur;
    for (let y = Math.max(0, Math.floor(y0)); y < Math.min(h, Math.ceil(y1)); y++) {
      for (let x = 0; x < l; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        if (dx * dx + dy * dy <= r * r) g.fillRect(x, y, 1, 1);
      }
    }
  };
  peindre({ rect, disque, anneau, calotte });
  return c;
}

function garder(cle, fabriquer) {
  if (!cache.has(cle)) cache.set(cle, fabriquer());
  return cache.get(cle);
}

// --- touche ronde ---------------------------------------------------------

// Une teinte n'est plus qu'une couleur : le reste du bonbon en découle.
//
// La claire porte des signes sombres — la main, le plus, la croix ; la sombre
// porte des images claires — les machines, les matières. Chacune garde le fond
// sur lequel ses signes se lisent.
//
// Les quatre outils, eux, ont chacun la sienne, et c'est la palette qui porte
// le sens : le convoyeur est bleu comme le tapis qu'il trace, la construction
// verte comme une validation, la destruction rouge comme un blocage. La main
// reste crème : c'est le repos, elle ne dit rien.
export function teinteDe(couleur, socle) {
  return { couleur, socle: socle || FACES[couleur].sombre };
}

export const CLAIRE = teinteDe('creme');

// La touche sombre garde un socle clair, et c'est la seule exception à
// « le socle est l'ombre du corps ». Un bonbon ardoise n'a pas d'ombre visible
// sur un fond noir : son ombre est le profond, qui ne s'en détache qu'à
// 1,54 : 1 — la touche perdait son épaisseur. La brume la lui rend.
export const SOMBRE = teinteDe('ardoise', 'brume');

// Le reflet du haut : le vernis du bonbon. C'est la clarté de la couleur, sauf
// quand la touche est déjà crème — une clarté plus claire que le crème
// n'existe pas, et le bombé s'y lit alors par sa seule ombre du bas.
function faces(teinte) {
  const f = FACES[teinte.couleur];
  return {
    clair: PALETTE[f.clair],
    corps: PALETTE[f.corps],
    sombre: PALETTE[f.sombre],
    socle: PALETTE[teinte.socle],
  };
}

// Où le dégradé change de bande, en part du diamètre. Deux couronnes minces,
// et le corps nu entre les deux : le vernis se lit sur le bord, pas au milieu.
//
// C'est étroit exprès. Le signe que la touche porte — la main, le plus, la
// croix — doit se lire sur une seule couleur, celle du corps : c'est elle que
// l'outil de lisibilité mesure, et deux bandes larges lui auraient donné trois
// fonds au lieu d'un.
const HAUT = 0.20;
const BAS = 0.84;

// Peint le bombé dans un disque déjà posé : deux calottes, l'une claire,
// l'autre sombre, découpées par le disque lui-même.
//
// `retourne` inverse les deux : c'est l'état enfoncé. Rien d'autre ne change,
// et il n'y a donc qu'un dégradé à comprendre, vu des deux côtés.
function bomber(g, cx, cy, r, f, retourne) {
  const dessus = retourne ? f.sombre : f.clair;
  const dessous = retourne ? f.clair : f.sombre;
  g.calotte(cx, cy, r, cy - r, cy - r + 2 * r * HAUT, dessus);
  g.calotte(cx, cy, r, cy - r + 2 * r * BAS, cy + r, dessous);
}

// Le socle et le corps sont deux sprites, et c'est tout le mécanisme : le
// socle reste posé, le corps voyage dessus. S'ils ne faisaient qu'une image,
// le socle descendrait avec lui et rien n'aurait l'air enfoncé.
//
// Le socle est un disque plein, cerné de noir comme le corps : c'est une
// pièce du bouton, pas son ombre. On n'en voit que le croissant du bas quand
// le bouton est au repos, et tout entier quand il décolle au rebond.
// Le socle prend l'ombre de la couleur : c'est le bonbon posé sur sa propre
// ombre, et non sur une pièce d'une autre teinte. Il ne se bombe pas — on n'en
// voit qu'un croissant, et un dégradé sur un croissant ne se lit pas.
function socleRond(art, teinte) {
  return garder('socle' + art + teinte.couleur + teinte.socle, () => toile(art, art + SOCLE, (g) => {
    const f = faces(teinte);
    const c = art / 2;
    const r = art / 2 - 0.5;
    g.disque(c, c + SOCLE, r, PALETTE.noir);
    g.disque(c, c + SOCLE, r - 1, f.socle);
  }));
}

function corpsRond(art, teinte, retourne) {
  return garder('rond' + art + teinte.couleur + (retourne ? '!' : ''), () => toile(art, art, (g) => {
    const f = faces(teinte);
    const c = art / 2;
    const r = art / 2 - 0.5;
    g.disque(c, c, r, PALETTE.noir);
    g.disque(c, c, r - 1, f.corps);
    bomber(g, c, c, r - 1, f, retourne);
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
  // Au fond, le bombé se retourne : la lumière passe dessous. Une touche
  // enfoncée se lit donc enfoncée même arrêtée — et c'est ce qui marque la
  // sélection.
  ctx.drawImage(corpsRond(art, teinte, enfonce >= 0.5), r.x, r.y + dy, r.l, r.l);
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
function corpsPilule(g, l, h, dy, couleur, retrait, y0, y1) {
  const r = h / 2;
  const haut = y0 === undefined ? dy + retrait : Math.max(dy + retrait, y0);
  const bas = y1 === undefined ? dy + h - retrait : Math.min(dy + h - retrait, y1);
  if (bas <= haut) return;
  g.calotte(r, r + dy, r - retrait, haut, bas, couleur);
  g.calotte(l - r, r + dy, r - retrait, haut, bas, couleur);
  g.rect(r, haut, l - h, bas - haut, couleur);
}

function soclePilule(l, h, teinte) {
  return garder('soclePilule' + l + 'x' + h + teinte.couleur + teinte.socle, () => toile(l, h + SOCLE, (g) => {
    const f = faces(teinte);
    corpsPilule(g, l, h, SOCLE, PALETTE.noir, 0);
    corpsPilule(g, l, h, SOCLE, f.socle, 1);
  }));
}

// La pilule se bombe comme le rond, et par les mêmes bandes : elle n'a pas de
// dégradé à elle. Ce sont les mêmes hauteurs, prises sur sa hauteur.
function spritePilule(l, h, teinte, retourne) {
  const cle = 'pilule' + l + 'x' + h + teinte.couleur + (retourne ? '!' : '');
  return garder(cle, () => toile(l, h, (g) => {
    const f = faces(teinte);
    corpsPilule(g, l, h, 0, PALETTE.noir, 0);
    corpsPilule(g, l, h, 0, f.corps, 1);
    corpsPilule(g, l, h, 0, retourne ? f.sombre : f.clair, 1, 0, h * HAUT);
    corpsPilule(g, l, h, 0, retourne ? f.clair : f.sombre, 1, h * BAS, h);
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
  ctx.drawImage(spritePilule(l, h, teinte, enfonce >= 0.5), r.x, r.y + dy, r.l, r.h);
  ctx.restore();
  return dy;
}
