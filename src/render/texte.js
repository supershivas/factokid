// La fonte bitmap 3 × 5 et son tracé. Le jeu doit se comprendre sans savoir
// lire : le texte est un confort pour l'adulte, jamais un passage obligé pour
// l'enfant.

import { PALETTE } from '../design.js';

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

