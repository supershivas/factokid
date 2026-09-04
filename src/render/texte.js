// La fonte bitmap 5 × 7 et son tracé. Le jeu doit se comprendre sans savoir
// lire : le texte est un confort pour l'adulte, jamais un passage obligé pour
// l'enfant.
//
// Elle était en 3 × 5, grossie ×2 : trois pixels de large ne suffisent ni à
// une panse ni à une jambe, et les lettres se ressemblaient toutes une fois
// épaissies. En 5 × 7 dessinée à l'échelle 1, la même place à l'écran porte
// deux fois plus de forme — c'est la finesse qui manquait, pas la taille.
//
// La grille : les rangées 0 et 1 portent les hampes et les accents, les
// rangées 2 à 6 le corps des minuscules, les rangées 7 et 8 les jambages qui
// descendent. Un glyphe s'arrête où il n'a plus rien à dire.

export const LARGEUR = 5;  // pixels de fonte
export const HAUTEUR = 7;  // rangées jusqu'au bas du corps, hors jambage
export const AVANCE = 6;   // largeur d'un caractère, son blanc compris

const _ = '.....';

// Chiffres : ils occupent toute la hauteur, hampes comprises. Ce sont eux
// qu'on lit de loin — le compteur des bonbons est le seul nombre du jeu.
const CHIFFRES = {
  0: ['.111.', '1...1', '1...1', '1...1', '1...1', '1...1', '.111.'],
  1: ['..1..', '.11..', '..1..', '..1..', '..1..', '..1..', '.111.'],
  2: ['.111.', '1...1', '....1', '...1.', '..1..', '.1...', '11111'],
  3: ['11111', '...1.', '..11.', '....1', '....1', '1...1', '.111.'],
  4: ['...1.', '..11.', '.1.1.', '1..1.', '11111', '...1.', '...1.'],
  5: ['11111', '1....', '1111.', '....1', '....1', '1...1', '.111.'],
  6: ['..11.', '.1...', '1....', '1111.', '1...1', '1...1', '.111.'],
  7: ['11111', '....1', '...1.', '..1..', '.1...', '.1...', '.1...'],
  8: ['.111.', '1...1', '1...1', '.111.', '1...1', '1...1', '.111.'],
  9: ['.111.', '1...1', '1...1', '.1111', '....1', '...1.', '.11..'],
};

// Minuscules seules : pas de capitales tracées. Une lettre à hampe part de la
// rangée 0, une lettre à jambage descend jusqu'à la rangée 8.
const LETTRES = {
  a: [_, _, '.111.', '....1', '.1111', '1...1', '.1111'],
  b: ['1....', '1....', '1111.', '1...1', '1...1', '1...1', '1111.'],
  c: [_, _, '.111.', '1...1', '1....', '1...1', '.111.'],
  d: ['....1', '....1', '.1111', '1...1', '1...1', '1...1', '.1111'],
  e: [_, _, '.111.', '1...1', '11111', '1....', '.111.'],
  f: ['..111', '.1...', '11111', '.1...', '.1...', '.1...', '.1...'],
  g: [_, _, '.1111', '1...1', '1...1', '.1111', '....1', '1...1', '.111.'],
  h: ['1....', '1....', '1111.', '1...1', '1...1', '1...1', '1...1'],
  i: ['..1..', _, '.11..', '..1..', '..1..', '..1..', '.111.'],
  j: ['...1.', _, '..11.', '...1.', '...1.', '...1.', '...1.', '1..1.', '.11..'],
  k: ['1....', '1....', '1..1.', '1.1..', '111..', '1..1.', '1...1'],
  l: ['.11..', '..1..', '..1..', '..1..', '..1..', '..1..', '..111'],
  m: [_, _, '11111', '1.1.1', '1.1.1', '1.1.1', '1.1.1'],
  n: [_, _, '1111.', '1...1', '1...1', '1...1', '1...1'],
  o: [_, _, '.111.', '1...1', '1...1', '1...1', '.111.'],
  p: [_, _, '1111.', '1...1', '1...1', '1...1', '1111.', '1....', '1....'],
  q: [_, _, '.1111', '1...1', '1...1', '1...1', '.1111', '....1', '....1'],
  r: [_, _, '1.111', '11...', '1....', '1....', '1....'],
  s: [_, _, '.1111', '1....', '.111.', '....1', '1111.'],
  t: ['.1...', '.1...', '11111', '.1...', '.1...', '.1..1', '..11.'],
  u: [_, _, '1...1', '1...1', '1...1', '1...1', '.1111'],
  v: [_, _, '1...1', '1...1', '1...1', '.1.1.', '..1..'],
  w: [_, _, '1...1', '1...1', '1.1.1', '1.1.1', '.1.1.'],
  x: [_, _, '1...1', '.1.1.', '..1..', '.1.1.', '1...1'],
  y: [_, _, '1...1', '1...1', '1...1', '.1111', '....1', '1...1', '.111.'],
  z: [_, _, '11111', '...1.', '..1..', '.1...', '11111'],
  // La cédille descend sous le c : elle fait partie de la lettre, pas des
  // accents posés au-dessus.
  'ç': [_, _, '.111.', '1...1', '1....', '1...1', '.111.', '..1..', '.11..'],
  "'": ['..1..', '..1..', _, _, _, _, _],
  ',': [_, _, _, _, _, _, '..1..', '.1...'],
  '.': [_, _, _, _, _, _, '..1..'],
  '-': [_, _, _, _, '.111.', _, _],
  '!': [_, _, '..1..', '..1..', '..1..', _, '..1..'],
  '?': [_, _, '.111.', '1...1', '...1.', _, '..1..'],
  ' ': [_],
};

// Les accents se posent sur les deux rangées du haut, sans toucher à la forme
// de la lettre : une seule table pour toutes les lettres accentuées.
const ACCENTS = {
  'é': ['e', ['...1.', '..1..']],
  'è': ['e', ['.1...', '..1..']],
  'ê': ['e', ['..1..', '.1.1.']],
  'ë': ['e', ['.1.1.', _]],
  'à': ['a', ['.1...', '..1..']],
  'â': ['a', ['..1..', '.1.1.']],
  'ä': ['a', ['.1.1.', _]],
  'ô': ['o', ['..1..', '.1.1.']],
  'ö': ['o', ['.1.1.', _]],
  'î': ['i', ['..1..', '.1.1.']],
  'ï': ['i', ['.1.1.', _]],
  'û': ['u', ['..1..', '.1.1.']],
  'ù': ['u', ['.1...', '..1..']],
};

// Une lettre accentuée occupe les rangées du haut : la lettre elle-même doit
// donc s'y taire. Toutes les minuscules accentuées sont sans hampe, la
// question ne se pose pas.
function glyphe(caractere) {
  const accent = ACCENTS[caractere];
  if (!accent) return { rangees: LETTRES[caractere], accent: null };
  return { rangees: LETTRES[accent[0]], accent: accent[1] };
}

export function largeurMot(texte, echelle) {
  return texte.length * AVANCE * echelle - echelle;
}

export function largeurNombre(valeur, echelle) {
  return String(valeur).length * AVANCE * echelle - echelle;
}

export function hauteurTexte(echelle) {
  return HAUTEUR * echelle;
}

// --- texte explicable ------------------------------------------------------
//
// Une description peut nommer une matière ou une machine : « débite le {bois}
// en {papier} ». Ce qui est entre accolades est *explicable* — on peut le
// toucher, et il s'explique. La syntaxe reste une table : `{id}` affiche le
// nom qu'on lui donne, `{id|mot}` affiche autre chose (un pluriel, un
// accord).
//
// Le texte se découpe ensuite en mots placés, parce qu'un mot explicable doit
// se toucher : le rendu et l'entrée lisent la même disposition.

export function analyserTexte(chaine, nommer) {
  const morceaux = [];
  const motif = /\{([^}|]+)(?:\|([^}]+))?\}/g;
  let curseur = 0;
  let trouve = motif.exec(chaine);
  while (trouve) {
    if (trouve.index > curseur) morceaux.push({ texte: chaine.slice(curseur, trouve.index) });
    morceaux.push({ texte: trouve[2] || nommer(trouve[1]), cle: trouve[1] });
    curseur = trouve.index + trouve[0].length;
    trouve = motif.exec(chaine);
  }
  if (curseur < chaine.length) morceaux.push({ texte: chaine.slice(curseur) });
  return morceaux;
}

// Place les mots en lignes, dans la largeur donnée. Chaque mot rend sa boîte :
// c'est elle que le rendu souligne et que le doigt touche.
export function disposerMots(morceaux, largeur, echelle) {
  const mots = [];
  const interligne = HAUTEUR * echelle + 5;
  let x = 0;
  let ligne = 0;
  for (const morceau of morceaux) {
    // Un morceau qui ne commence pas par une espace se colle à ce qui précède :
    // c'est ce qui garde le point contre le mot souligné plutôt qu'à distance.
    let colle = mots.length > 0 && !/^\s/.test(morceau.texte);
    // On coupe sur les espaces, en les gardant collés au mot qui précède :
    // sinon un mot explicable emporterait l'espace dans son soulignement.
    for (const brut of morceau.texte.split(/(\s+)/)) {
      if (brut === '') continue;
      if (/^\s+$/.test(brut)) { x += AVANCE * echelle; colle = false; continue; }
      if (colle) { x -= AVANCE * echelle; colle = false; }
      const l = largeurMot(brut, echelle);
      if (x > 0 && x + l > largeur) { ligne++; x = 0; }
      mots.push({ texte: brut, cle: morceau.cle, x, y: ligne * interligne, l, h: HAUTEUR * echelle });
      x += l + AVANCE * echelle;
    }
  }
  return { mots, lignes: ligne + 1, interligne };
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

function peindre(ctx, rangees, x, y, echelle) {
  for (let ly = 0; ly < rangees.length; ly++) {
    const rangee = rangees[ly];
    for (let lx = 0; lx < LARGEUR; lx++) {
      if (rangee[lx] === '1') ctx.fillRect(x + lx * echelle, y + ly * echelle, echelle, echelle);
    }
  }
}

export function dessinerMot(ctx, texte, x, y, echelle, couleur) {
  ctx.fillStyle = couleur;
  let ox = Math.round(x);
  const oy = Math.round(y);
  for (const caractere of texte.toLowerCase()) {
    const { rangees, accent } = glyphe(caractere);
    if (rangees) peindre(ctx, rangees, ox, oy, echelle);
    if (accent) peindre(ctx, accent, ox, oy, echelle);
    ox += AVANCE * echelle;
  }
}

// Le même tracé, centré sur une hauteur : la fonte change de taille sans que
// chaque module ait à recalculer où poser son texte.
export function dessinerMotCentre(ctx, texte, x, milieu, echelle, couleur) {
  dessinerMot(ctx, texte, x, milieu - hauteurTexte(echelle) / 2, echelle, couleur);
}

// Écrit des mots placés. Ce qui s'explique est souligné : c'est le seul
// ornement de texte du jeu, et il ne veut dire que « touche-moi ».
export function dessinerMots(ctx, mots, x, y, echelle, couleur, couleurExplicable) {
  for (const mot of mots) {
    const teinte = mot.cle ? couleurExplicable : couleur;
    dessinerMot(ctx, mot.texte, x + mot.x, y + mot.y, echelle, teinte);
    if (!mot.cle) continue;
    ctx.fillStyle = teinte;
    ctx.fillRect(x + mot.x, y + mot.y + mot.h + echelle, mot.l, echelle);
  }
}

export function dessinerNombre(ctx, valeur, x, y, echelle, couleur) {
  ctx.fillStyle = couleur;
  let ox = Math.round(x);
  const oy = Math.round(y);
  for (const c of String(valeur)) {
    const rangees = CHIFFRES[c];
    if (rangees) peindre(ctx, rangees, ox, oy, echelle);
    ox += AVANCE * echelle;
  }
}
