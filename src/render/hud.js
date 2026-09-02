// HUD : le compteur des bonbons finis, la barre d'outils, le panneau d'un
// élément. Icônes et chiffres ; les seuls mots sont là pour l'adulte.

import {
  PALETTE, LARGEUR_LOGIQUE, GRILLE_Y, LIGNES, CELLULE, TEXTE_GRAND, TEXTE_PETIT,
  BULLE, PANNEAU, PANNEAU_TEXTE, OPTION, rectBouton, rectBulle, rectOption,
} from '../design.js';
import { ICONES, INTERFACE, spriteItem, TAILLE_ITEM } from './sprites.js';
import { ecrasement } from './bouton.js';

// Fonte bitmap 3 × 5, chiffres seuls.
const CHIFFRES = {
  0: ['111', '101', '101', '101', '111'],
  1: ['010', '110', '010', '010', '111'],
  2: ['111', '001', '111', '100', '111'],
  3: ['111', '001', '111', '001', '111'],
  4: ['101', '101', '111', '001', '001'],
  5: ['111', '100', '111', '001', '111'],
  6: ['111', '100', '111', '101', '111'],
  7: ['111', '001', '001', '001', '001'],
  8: ['111', '101', '111', '101', '111'],
  9: ['111', '101', '111', '001', '111'],
};

// Minuscules 3 × 5, avec une ligne de dépassement pour g, j, p, q, y. Pas de
// capitales tracées : le texte est un confort pour l'adulte, jamais un passage
// obligé pour l'enfant.
const LETTRES = {
  a: ['000', '111', '011', '101', '111'],
  b: ['100', '100', '110', '101', '110'],
  c: ['000', '011', '100', '100', '011'],
  d: ['001', '001', '011', '101', '011'],
  e: ['000', '010', '101', '110', '011'],
  f: ['001', '010', '111', '010', '010'],
  g: ['000', '011', '101', '011', '001', '110'],
  h: ['100', '100', '110', '101', '101'],
  i: ['010', '000', '010', '010', '010'],
  j: ['001', '000', '001', '001', '001', '110'],
  k: ['100', '101', '110', '110', '101'],
  l: ['110', '010', '010', '010', '011'],
  m: ['000', '110', '111', '101', '101'],
  n: ['000', '110', '101', '101', '101'],
  o: ['000', '010', '101', '101', '010'],
  p: ['000', '110', '101', '110', '100', '100'],
  q: ['000', '011', '101', '011', '001', '001'],
  r: ['000', '101', '110', '100', '100'],
  s: ['000', '011', '110', '011', '110'],
  t: ['010', '111', '010', '010', '011'],
  u: ['000', '101', '101', '101', '011'],
  v: ['000', '101', '101', '101', '010'],
  w: ['000', '101', '101', '111', '101'],
  x: ['000', '101', '010', '010', '101'],
  y: ['000', '101', '101', '011', '001', '110'],
  z: ['000', '111', '001', '010', '111'],
  "'": ['010', '010', '000', '000', '000'],
  ',': ['000', '000', '000', '000', '010', '100'],
  '.': ['000', '000', '000', '000', '010'],
  '-': ['000', '000', '111', '000', '000'],
  ' ': ['000', '000', '000', '000', '000'],
};

// Les accents se posent au-dessus de la lettre, sans changer sa forme.
const ACCENTS = {
  'é': ['e', '001'], 'è': ['e', '100'], 'ê': ['e', '010'], 'ë': ['e', '101'],
  'à': ['a', '100'], 'â': ['a', '010'], 'ô': ['o', '010'], 'î': ['i', '010'],
  'û': ['u', '010'], 'ù': ['u', '100'], 'ç': ['c', '000'],
};

export function largeurMot(texte, echelle) {
  return texte.length * 4 * echelle - echelle;
}

// Découpe un texte en lignes qui tiennent dans la largeur donnée.
export function decouperTexte(texte, largeur, echelle) {
  const lignes = [];
  let courante = '';
  for (const mot of texte.split(' ')) {
    const essai = courante ? courante + ' ' + mot : mot;
    if (largeurMot(essai, echelle) <= largeur) { courante = essai; continue; }
    if (courante) lignes.push(courante);
    courante = mot;
  }
  if (courante) lignes.push(courante);
  return lignes;
}

export function dessinerMot(ctx, texte, x, y, echelle, couleur) {
  ctx.fillStyle = couleur;
  let ox = x;
  for (const caractere of texte.toLowerCase()) {
    const accent = ACCENTS[caractere];
    const glyphe = LETTRES[accent ? accent[0] : caractere];
    if (glyphe) {
      for (let ly = 0; ly < glyphe.length; ly++) {
        for (let lx = 0; lx < 3; lx++) {
          if (glyphe[ly][lx] === '1') ctx.fillRect(ox + lx * echelle, y + ly * echelle, echelle, echelle);
        }
      }
      if (accent) {
        for (let lx = 0; lx < 3; lx++) {
          if (accent[1][lx] === '1') ctx.fillRect(ox + lx * echelle, y - 2 * echelle, echelle, echelle);
        }
      }
    }
    ox += 4 * echelle;
  }
}

export function largeurNombre(valeur, echelle) {
  return String(valeur).length * 4 * echelle - echelle;
}

export function dessinerNombre(ctx, valeur, x, y, echelle, couleur) {
  ctx.fillStyle = couleur;
  let ox = x;
  for (const c of String(valeur)) {
    const glyphe = CHIFFRES[c];
    if (glyphe) {
      for (let ly = 0; ly < 5; ly++) {
        for (let lx = 0; lx < 3; lx++) {
          if (glyphe[ly][lx] === '1') ctx.fillRect(ox + lx * echelle, y + ly * echelle, echelle, echelle);
        }
      }
    }
    ox += 4 * echelle;
  }
}

export function dessinerHud(ctx, monde, fps, interfaceJeu) {
  const livraison = monde.usine.machines.find((m) => m.def.entree);

  // Un seul compteur : les bonbons finis. Tout le reste se lit sur la grille,
  // dans les jauges des machines et dans ce qui circule.
  ctx.drawImage(spriteItem('bonbon'), 12, 24, TAILLE_ITEM, TAILLE_ITEM);
  dessinerNombre(
    ctx, livraison ? livraison.consommes : 0,
    12 + TAILLE_ITEM + 9, 21, TEXTE_GRAND, PALETTE.creme,
  );

  dessinerOutils(ctx, interfaceJeu);
  dessinerPanneau(ctx, interfaceJeu);

  // Séparations discrètes des bandeaux.
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(12, GRILLE_Y - 10, LARGEUR_LOGIQUE - 24, 1);
  ctx.fillRect(12, GRILLE_Y + LIGNES * CELLULE + 10, LARGEUR_LOGIQUE - 24, 1);
}

// Barre d'outils, et bulles des éléments constructibles qui en sortent.
function dessinerOutils(ctx, interfaceJeu) {
  for (let i = 0; i < interfaceJeu.boutons.length; i++) {
    const r = rectBouton(i);
    const b = interfaceJeu.boutons[i];
    // Un bouton qu'on vient de toucher s'aplatit puis rebondit : l'appui ne
    // peut pas sembler ignoré.
    const e = ecrasement(i);
    ctx.save();
    if (e) {
      ctx.translate(r.x + r.l / 2, r.y + r.h / 2);
      ctx.scale(e.x, e.y);
      ctx.translate(-r.x - r.l / 2, -r.y - r.h / 2);
    }
    // L'outil en cours est à pleine intensité, l'autre s'efface : la
    // différence se voit sans cadre ni contour.
    ctx.globalAlpha = b.actif ? 1 : 0.45;
    ctx.drawImage(INTERFACE.bouton, r.x, r.y, r.l, r.h);
    ctx.drawImage(INTERFACE[b.icone], r.x, r.y, r.l, r.h);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (interfaceJeu.menu <= 0 || !interfaceJeu.ancre) return;

  // Le plateau s'assombrit : les bulles se lisent comme un choix posé
  // par-dessus le jeu, pas comme une pièce de plus sur la grille.
  ctx.globalAlpha = 0.55 * interfaceJeu.menu;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, GRILLE_Y + LIGNES * CELLULE);
  ctx.globalAlpha = 1;

  // La progression vient d'un ressort : elle dépasse un peu, puis se pose.
  const p = interfaceJeu.menu;
  for (let j = 0; j < interfaceJeu.bulles.length; j++) {
    const r = rectBulle(interfaceJeu.ancre, j, p);
    const taille = Math.round(BULLE * p);
    const dx = Math.round(r.x + (BULLE - taille) / 2);
    const dy = Math.round(r.y + (BULLE - taille) / 2);
    const bulle = interfaceJeu.bulles[j];
    ctx.globalAlpha = bulle.grise ? 0.35 : 1;
    ctx.drawImage(INTERFACE.bulleFond, dx, dy, taille, taille);
    ctx.drawImage(INTERFACE[bulle.icone], dx, dy, taille, taille);
    // Le nom à côté de l'image : l'enfant reconnaît la forme, l'adulte lit.
    if (bulle.nom) {
      dessinerMot(
        ctx, bulle.nom, dx + BULLE + 10, dy + BULLE / 2 - 5, TEXTE_PETIT,
        bulle.choisie ? PALETTE.creme : PALETTE.ardoise,
      );
    }
    ctx.globalAlpha = 1;
    if (bulle.choisie) encadrer(ctx, dx, dy, taille);
  }
}

// Panneau d'un élément construit : ce que c'est, et ce qu'on peut y régler.
function dessinerPanneau(ctx, interfaceJeu) {
  const p = interfaceJeu.panneau;
  if (!p) return;

  // Le panneau surgit de son propre centre.
  const echelle = interfaceJeu.panneauAnim;
  ctx.save();
  ctx.translate(PANNEAU.x + PANNEAU.l / 2, PANNEAU.y + PANNEAU.h / 2);
  ctx.scale(echelle, echelle);
  ctx.translate(-(PANNEAU.x + PANNEAU.l / 2), -(PANNEAU.y + PANNEAU.h / 2));

  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(PANNEAU.x, PANNEAU.y, PANNEAU.l, PANNEAU.h);
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(PANNEAU.x + 1, PANNEAU.y + 1, PANNEAU.l - 2, PANNEAU.h - 2);

  ctx.drawImage(INTERFACE[p.icone] || ICONES[p.icone], PANNEAU.x + 12, PANNEAU.y + 12, CELLULE, CELLULE);
  dessinerMot(ctx, p.nom, PANNEAU.x + 12 + CELLULE + 12, PANNEAU.y + 26, TEXTE_PETIT, PALETTE.creme);

  // Une ligne qui dit à quoi sert l'élément : le nom seul ne suffit pas.
  const lignes = decouperTexte(p.description || '', PANNEAU.l - 24, TEXTE_PETIT);
  for (let i = 0; i < lignes.length; i++) {
    dessinerMot(
      ctx, lignes[i], PANNEAU.x + PANNEAU_TEXTE.x, PANNEAU.y + PANNEAU_TEXTE.y + i * 14,
      TEXTE_PETIT, PALETTE.ardoise,
    );
  }

  for (let j = 0; j < p.options.length; j++) {
    const r = rectOption(j);
    ctx.drawImage(INTERFACE.bouton, r.x, r.y, r.l, r.h);
    const option = p.options[j];
    const sprite = option.item ? spriteItem(option.item) : INTERFACE[option.icone];
    // Ce qui est choisi est entouré ; le reste est simplement en retrait.
    ctx.globalAlpha = option.choisie === false ? 0.45 : 1;
    if (sprite) ctx.drawImage(sprite, r.x + 8, r.y + 8, OPTION - 16, OPTION - 16);
    ctx.globalAlpha = 1;
    if (option.choisie) encadrer(ctx, r.x, r.y, r.l);
  }
  ctx.restore();
}

// Le cadre qui dit « c'est celui-ci ».
function encadrer(ctx, x, y, taille) {
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, taille - 2, taille - 2);
}
