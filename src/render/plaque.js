// Les touches du jeu : leur forme, leur relief, et la façon dont elles
// s'enfoncent. Ne modifie jamais l'état.
//
// La touche est un bonbon — c'est la direction retenue au labo
// (labo/touches.html, direction 2) : vernie, bombée, posée sur une ombre de sa
// propre couleur. Trois choses la disent, et ce sont celles du labo :
//
//   la forme — rien n'est rond dans une usine faite de cases, donc un rond
//   n'est jamais qu'un bouton ;
//   le bombé — une vraie rampe de la clarté à l'ombre, un reflet au sommet, un
//   creux au pied ;
//   l'ombre — portée, floue, de la couleur du bonbon. Elle se resserre quand
//   la touche descend, et c'est elle qui donne la hauteur.
//
// Ce qui change vraiment ici : **les touches ne sont plus du pixel art**.
// Elles étaient peintes sur une grille de vingt-huit pixels d'art puis
// agrandies, et c'est pourquoi elles ne ressemblaient pas au labo — un rond de
// vingt-huit pixels est un escalier, un dégradé de vingt-huit pixels est trois
// bandes, et une ombre floue n'y existe pas. Elles sont maintenant tracées en
// courbes, à la résolution de l'écran. C'est la dérogation assumée : le monde
// reste peint au pixel, les touches non. Les signes qu'elles portent — la
// main, le plus, la croix, les machines — restent du pixel art, et c'est ce
// qui les rattache au jeu.
//
// Rien n'est redessiné soixante fois par seconde pour autant : chaque touche
// est peinte une fois, à l'échelle de l'écran, et gardée.

import { PALETTE, FACES, signeSur, poserImage } from '../design.js';
import { spriteSigne } from './signes.js';

// La course de l'appui, en unités logiques : de combien le corps descend.
export const SOCLE = 6;

// La part de la touche qu'une image occupe. Deux valeurs, parce que les deux
// familles d'images ne remplissent pas leur carré de la même façon : une icône
// d'interface s'arrête avant ses coins (le rond peut donc être plus serré),
// une matière remplit le sien jusqu'au bord et doit s'inscrire dans le cercle
// — d'où le rapport proche de 1/√2.
export const PART_ICONE = 6 / 7;
export const PART_ITEM = 0.72;

// La marge que l'ombre demande autour du corps, en unités logiques. C'est du
// vide dans l'image : la touche, elle, reste à sa taille.
const MARGE = 12;

// L'ombre portée : ce qu'elle descend et de combien elle est floue, au repos
// puis au fond. Elle se resserre sous le doigt — c'est ce qui fait que la
// touche a l'air d'aller toucher le sol.
const OMBRE = {
  haut: { chute: 7, flou: 14, alpha: 0.38 },
  bas: { chute: 2, flou: 7, alpha: 0.32 },
};

// Où le dégradé passe d'une face à l'autre. Le corps occupe le milieu : c'est
// sur lui que le signe de la touche se lit, et c'est lui que l'outil de
// lisibilité mesure.
const RAMPE = [0, 0.5, 1];

// --- teintes ---------------------------------------------------------------

// Une teinte n'est plus qu'une couleur : le reste du bonbon en découle, par
// `FACES`, qui donne la clarté et l'ombre de chaque couleur de la palette.
//
// La claire porte des signes sombres — la main, le plus ; la sombre porte des
// images claires — les machines, les matières. Chacune garde le fond sur
// lequel ses signes se lisent.
export function teinteDe(couleur, ombre) {
  return { couleur, ombre: ombre || FACES[couleur].sombre, signe: signeSur(couleur) };
}

export const CLAIRE = teinteDe('creme');

// La touche sombre porte une ombre de brume, et c'est la seule exception à
// « l'ombre est celle du corps ». Un bonbon ardoise n'a pas d'ombre visible
// sur un fond noir : la sienne est le profond, qui ne s'en détache qu'à
// 1,54 : 1 — la touche perdait sa hauteur.
export const SOMBRE = teinteDe('ardoise', 'brume');

function faces(teinte) {
  const f = FACES[teinte.couleur];
  return {
    clair: PALETTE[f.clair],
    corps: PALETTE[f.corps],
    sombre: PALETTE[f.sombre],
    ombre: PALETTE[teinte.ombre],
  };
}

// --- peinture --------------------------------------------------------------

const cache = new Map();

// Une image peinte en unités logiques, à la résolution de l'écran. C'est le
// facteur du contexte qui la donne : le canvas est déjà à l'échelle entière de
// l'appareil, donc une courbe tracée ici est une courbe, pas un escalier.
function toile(l, h, k, peindre) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(l * k);
  c.height = Math.ceil(h * k);
  const g = c.getContext('2d');
  g.scale(k, k);
  peindre(g);
  return c;
}

function garder(cle, fabriquer) {
  if (!cache.has(cle)) cache.set(cle, fabriquer());
  return cache.get(cle);
}

// Le vernis : une rampe verticale de la clarté à l'ombre, en passant par le
// corps. Retournée, c'est l'état enfoncé — la lumière passe dessous.
function vernis(g, y0, y1, f, retourne) {
  const d = g.createLinearGradient(0, y0, 0, y1);
  const suite = retourne ? [f.sombre, f.corps, f.clair] : [f.clair, f.corps, f.sombre];
  for (let i = 0; i < RAMPE.length; i++) d.addColorStop(RAMPE[i], suite[i]);
  return d;
}

// L'ombre portée, posée avant le corps : on peint la forme une première fois
// pour l'ombre seule, puis on la repeint par-dessus.
function porterOmbre(g, tracer, f, enfonce) {
  const o = enfonce ? OMBRE.bas : OMBRE.haut;
  g.save();
  g.shadowColor = f.ombre;
  g.globalAlpha = o.alpha;
  g.shadowBlur = o.flou;
  g.shadowOffsetY = o.chute;
  tracer();
  g.fillStyle = f.ombre;
  g.fill();
  g.restore();
}

// Le reflet du sommet et le creux du pied : deux arcs, et rien de plus. C'est
// ce que les deux ombres internes du labo faisaient en CSS.
function lustrer(g, tracer, cx, cy, r, f, retourne) {
  g.save();
  tracer();
  g.clip();
  g.lineWidth = 2.5;
  g.globalAlpha = 0.7;
  g.strokeStyle = retourne ? f.sombre : f.clair;
  g.beginPath();
  g.arc(cx, cy, r - 1, Math.PI * 1.12, Math.PI * 1.88);
  g.stroke();
  g.globalAlpha = 0.5;
  g.strokeStyle = retourne ? f.clair : f.sombre;
  g.beginPath();
  g.arc(cx, cy, r - 1, Math.PI * 0.12, Math.PI * 0.88);
  g.stroke();
  g.restore();
}

// --- touche ronde ---------------------------------------------------------

function spriteRond(l, teinte, retourne, k) {
  const cle = 'rond' + l + teinte.couleur + teinte.ombre + (retourne ? '!' : '') + '@' + k;
  return garder(cle, () => toile(l + MARGE * 2, l + MARGE * 2, k, (g) => {
    const f = faces(teinte);
    const c = MARGE + l / 2;
    const r = l / 2;
    const tracer = () => {
      g.beginPath();
      g.arc(c, c, r, 0, Math.PI * 2);
    };
    porterOmbre(g, tracer, f, retourne);
    tracer();
    g.fillStyle = vernis(g, c - r, c + r, f, retourne);
    g.fill();
    lustrer(g, tracer, c, c, r, f, retourne);
  }));
}

// Dessine une touche ronde et l'icône qu'elle porte. `enfonce` va de 0 à 1 :
// à 1, le bouton est au fond de sa course.
//
// C'est là toute la marque de sélection du jeu : l'outil en cours est une
// touche restée enfoncée — descendue, son vernis retourné, son ombre resserrée.
// Pas de cadre, pas de couleur en plus.
export function dessinerTouche(
  ctx, r, image, { teinte = CLAIRE, enfonce = 0, alpha = 1, part = PART_ICONE } = {},
) {
  const k = ctx.getTransform().a || 1;
  const dy = enfonce * SOCLE;

  ctx.save();
  ctx.globalAlpha = alpha;
  const sprite = spriteRond(r.l, teinte, enfonce >= 0.5, k);
  ctx.drawImage(sprite, r.x - MARGE, r.y + dy - MARGE, r.l + MARGE * 2, r.l + MARGE * 2);
  // L'image est centrée dans le rond : c'est le rond qui s'est élargi pour
  // l'accueillir, pas l'image qui a rétréci.
  //
  // Deux sortes de signes : un nom, et c'est une courbe tracée à la
  // résolution de l'écran ; une image, et c'est du pixel art — une machine,
  // une matière. Les commandes sont des courbes, les choses du monde des
  // pixels, et la frontière passe exactement là.
  if (typeof image === 'string') {
    const { taille, marge } = poserImage(r.l, 24, part);
    const signe = spriteSigne(image, taille, teinte.signe, k);
    if (signe) ctx.drawImage(signe, r.x + marge, r.y + dy + marge, taille, taille);
  } else if (image) {
    const { taille, marge } = poserImage(r.l, image.width || 24, part);
    ctx.drawImage(image, r.x + marge, r.y + dy + marge, taille, taille);
  }
  ctx.restore();
}

// --- pilule ---------------------------------------------------------------

// Les boutons larges — le menu pause, l'écran des essais — ne peuvent pas être
// ronds : ils portent un mot. Ils gardent le même vernis et la même ombre, aux
// bouts arrondis à la hauteur d'un rond coupé en deux.
function spritePilule(l, h, teinte, retourne, k) {
  const cle = 'pilule' + l + 'x' + h + teinte.couleur + teinte.ombre + (retourne ? '!' : '') + '@' + k;
  return garder(cle, () => toile(l + MARGE * 2, h + MARGE * 2, k, (g) => {
    const f = faces(teinte);
    const tracer = () => {
      g.beginPath();
      g.roundRect(MARGE, MARGE, l, h, h / 2);
    };
    porterOmbre(g, tracer, f, retourne);
    tracer();
    g.fillStyle = vernis(g, MARGE, MARGE + h, f, retourne);
    g.fill();
    // Le reflet d'une pilule est une bande, pas un arc : elle est trop longue
    // pour qu'un arc en fasse le tour.
    g.save();
    tracer();
    g.clip();
    g.globalAlpha = 0.55;
    g.fillStyle = retourne ? f.sombre : f.clair;
    g.fillRect(MARGE, MARGE + 1, l, 2);
    g.globalAlpha = 0.4;
    g.fillStyle = retourne ? f.clair : f.sombre;
    g.fillRect(MARGE, MARGE + h - 3, l, 2);
    g.restore();
  }));
}

// Rend le décalage qu'a pris le corps : ce qu'on pose dessus — une icône, un
// mot — doit descendre avec lui.
export function dessinerPilule(ctx, r, { teinte = CLAIRE, enfonce = 0, alpha = 1 } = {}) {
  const k = ctx.getTransform().a || 1;
  const dy = enfonce * SOCLE;

  ctx.save();
  ctx.globalAlpha = alpha;
  const sprite = spritePilule(r.l, r.h, teinte, enfonce >= 0.5, k);
  ctx.drawImage(sprite, r.x - MARGE, r.y + dy - MARGE, r.l + MARGE * 2, r.h + MARGE * 2);
  ctx.restore();
  return dy;
}
