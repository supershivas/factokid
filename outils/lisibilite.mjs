// Vérification de lisibilité, sans navigateur : la simulation est du JS pur,
// et le design system aussi. Ce qui se voit à l'œil se mesure ici.
//
//   node outils/lisibilite.mjs
//
// Trois familles de contrôles, celles qui ont déjà mordu :
//
//   1. le contraste des couleurs qu'on pose l'une sur l'autre — une croix
//      rouge sur une touche ardoise s'éteint, un vert sur un gris disparaît ;
//   2. la silhouette des matières — chacune doit être reconnaissable en
//      niveaux de gris, donc aucune ne doit avoir la forme d'une autre ;
//   3. la pose des images dans les touches — une image de pixel art mise à
//      l'échelle d'un facteur qui n'est pas entier se décentre et se brouille.
//
// Chaque paire de couleurs est déclarée ici avec ce qu'elle doit tenir : c'est
// une table, elle grossit avec le jeu.

import { PALETTE, PIXEL, TUILE_PX, poserImage } from '../src/design.js';
import { MOTIFS } from '../src/render/motifs.js';
import { ITEMS } from '../src/data/items.js';

let echecs = 0;
const echec = (m) => { echecs++; console.log('  ✗ ' + m); };
const ok = (m) => console.log('  · ' + m);

// --- contraste -------------------------------------------------------------

// Luminance relative, puis rapport de contraste : la formule de WCAG. Les
// seuils : 4,5 pour du texte, 3 pour un signe ou une forme.
function luminance(hex) {
  const canal = (v) => {
    const c = v / 255;
    return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  const n = parseInt(hex.slice(1), 16);
  return 0.2126 * canal((n >> 16) & 255)
    + 0.7152 * canal((n >> 8) & 255)
    + 0.0722 * canal(n & 255);
}

function contraste(a, b) {
  const la = luminance(a);
  const lb = luminance(b);
  return (Math.max(la, lb) + 0.05) / (Math.min(la, lb) + 0.05);
}

// Ce que le jeu pose réellement l'un sur l'autre. Une paire qui n'est plus
// employée se retire d'ici ; une nouvelle s'y ajoute le jour où on la dessine.
const PAIRES = [
  { quoi: 'texte crème sur le fond noir', devant: 'creme', derriere: 'noir', seuil: 4.5 },
  { quoi: 'texte ardoise sur le fond noir', devant: 'ardoise', derriere: 'noir', seuil: 3 },
  { quoi: 'texte noir sur une touche claire', devant: 'noir', derriere: 'creme', seuil: 4.5 },
  { quoi: 'texte crème sur une touche sombre', devant: 'creme', derriere: 'ardoise', seuil: 4.5 },
  { quoi: 'la croix de destruction sur sa touche', devant: 'rouge', derriere: 'creme', seuil: 3 },
  { quoi: 'le socle ardoise sous une touche claire', devant: 'ardoise', derriere: 'noir', seuil: 3 },
  { quoi: 'le socle crème sous une touche sombre', devant: 'creme', derriere: 'ardoise', seuil: 3 },
  { quoi: 'le contour noir d’une touche sur le fond', devant: 'noir', derriere: 'ardoise', seuil: 3 },
  // Ce qui détache une matière du tapis, ce n'est pas sa couleur — quatre des
  // huit ne peuvent pas trancher sur l'ardoise sans sortir de la palette —
  // mais le noir qui la cerne. C'est donc lui qu'on mesure ici, et la section
  // suivante dit lesquelles ne tiennent que par là.
  { quoi: 'le contour d’une matière sur la bande du tapis', devant: 'noir', derriere: 'ardoise', seuil: 3 },
  { quoi: 'le contour d’une matière sur le sol le plus clair', devant: 'noir', derriere: 'creme', seuil: 3 },
];

console.log('contraste des couleurs employées');
for (const p of PAIRES) {
  const r = contraste(PALETTE[p.devant], PALETTE[p.derriere]);
  const dit = `${p.quoi} — ${r.toFixed(2)} : 1 (seuil ${p.seuil})`;
  if (r < p.seuil) echec(dit);
  else ok(dit);
}

// Ce que chaque matière doit au tapis. Le rouge et le vert ne peuvent pas
// trancher sur l'ardoise sans sortir de la palette : c'est le contour noir qui
// les détache, et leur forme qui les nomme. On mesure donc, et on dit celles
// qui ne tiennent que par leur contour — ce n'est pas une faute, c'est une
// chose à savoir quand on redessine.
console.log('\nles matières sur la bande du tapis');
for (const item of Object.values(ITEMS)) {
  const r = contraste(PALETTE[item.couleur], PALETTE.ardoise);
  const dit = `${item.nom} (${item.couleur}) — ${r.toFixed(2)} : 1`;
  if (r < 1.5) console.log('  ! ' + dit + ' — ne tient que par son contour');
  else ok(dit);
}

// --- silhouettes -----------------------------------------------------------

// La règle du design system : chaque matière doit être identifiable par sa
// forme seule, en niveaux de gris. On compare donc les masques — plein ou
// vide — et non les couleurs.
function masque(motif) {
  return motif.map((rangee) => [...rangee].map((s) => (s === '.' ? 0 : 1)).join('')).join('/');
}

// Combien de pixels deux masques ont en commun, en proportion.
function ressemblance(a, b) {
  const A = a.replace(/\//g, '');
  const B = b.replace(/\//g, '');
  const n = Math.max(A.length, B.length);
  let pareils = 0;
  for (let i = 0; i < n; i++) if ((A[i] || '0') === (B[i] || '0')) pareils++;
  return pareils / n;
}

console.log('\nsilhouettes des matières, en niveaux de gris');
const noms = Object.keys(MOTIFS);
const masques = {};
for (const nom of noms) masques[nom] = masque(MOTIFS[nom]);
for (let i = 0; i < noms.length; i++) {
  for (let j = i + 1; j < noms.length; j++) {
    const r = ressemblance(masques[noms[i]], masques[noms[j]]);
    const dit = `${noms[i]} / ${noms[j]} — ${(r * 100).toFixed(0)} % de pixels communs`;
    // Deux formes identiques sont interdites ; au-delà de 92 % on ne les
    // distingue plus d'un coup d'œil, à 18 unités sur un tapis qui défile.
    if (r >= 0.92) echec(dit + ' — trop semblables');
  }
}
if (echecs === 0) ok('aucune paire de matières ne se ressemble');

// Une matière doit aussi porter sa forme *en couleur* : sur un sol sombre, le
// contour noir disparaît et il ne reste que ce qui est peint.
console.log('\npart peinte dans chaque silhouette');
for (const nom of noms) {
  const signes = [...MOTIFS[nom].join('')];
  const pleins = signes.filter((s) => s !== '.').length;
  const peints = signes.filter((s) => s !== '.' && s !== 'n').length;
  const part = peints / pleins;
  const dit = `${nom} — ${(part * 100).toFixed(0)} % de la silhouette est peinte`;
  if (part < 0.45) echec(dit + ' — la forme ne tiendrait qu’au contour');
  else ok(dit);
}

// Le contour, justement : aucune couleur ne doit toucher le vide. C'est la
// faute qui avait rendu les matières illisibles — une forme peinte à même le
// sol se confond avec lui dès que le sol est sombre.
console.log('\nchaque matière est cernée');
for (const nom of noms) {
  const motif = MOTIFS[nom];
  let nu = 0;
  for (let y = 0; y < motif.length; y++) {
    for (let x = 0; x < motif[y].length; x++) {
      if (motif[y][x] === '.' || motif[y][x] === 'n') continue;
      const autour = [[0, -1], [1, 0], [0, 1], [-1, 0]];
      for (const [dx, dy] of autour) {
        const ligne = motif[y + dy];
        const voisin = ligne === undefined ? '.' : (ligne[x + dx] === undefined ? '.' : ligne[x + dx]);
        if (voisin === '.') nu++;
      }
    }
  }
  if (nu > 0) echec(`${nom} — ${nu} pixel(s) peint(s) touchent le vide`);
  else ok(`${nom} — cernée de noir partout`);
}

// --- pose des images dans les touches --------------------------------------

// Toutes les tailles de touche employées, et ce qu'elles portent. Une image
// posée à une échelle qui n'est pas entière se brouille et se décentre.
const POSES = [
  { quoi: 'barre d’outils', cible: 56, natif: TUILE_PX, part: 6 / 7 },
  { quoi: 'bouton pause', cible: 56, natif: TUILE_PX, part: 6 / 7 },
  { quoi: 'option de panneau, icône', cible: 56, natif: TUILE_PX, part: 6 / 7 },
  { quoi: 'option de panneau, matière', cible: 56, natif: 9, part: 0.72 },
  { quoi: 'jeton de recette', cible: 52, natif: 9, part: 0.72 },
  { quoi: 'touche du labo', cible: 28, natif: TUILE_PX, part: 6 / 7 },
];

console.log('\npose des images dans les touches');
for (const p of POSES) {
  const { taille, marge, facteur } = poserImage(p.cible, p.natif, p.part);
  const dit = `${p.quoi} — ${p.natif} px d’art ×${facteur} = ${taille}, marge ${marge}`;
  if (taille % p.natif !== 0) echec(dit + ' — échelle non entière');
  else if ((p.cible - taille) / 2 !== marge) echec(dit + ' — image décentrée');
  else if (marge % PIXEL !== 0) echec(dit + ' — marge hors de la grille');
  else if (taille > p.cible) echec(dit + ' — l’image déborde de la touche');
  else ok(dit);
}

// Une matière remplit son carré jusqu'aux bords : ses coins doivent tenir dans
// le cercle de la touche, sinon ils en sortent.
console.log('\nles matières tiennent dans leur rond');
for (const p of POSES.filter((x) => x.natif === 9)) {
  const { taille } = poserImage(p.cible, p.natif, p.part);
  const coin = Math.hypot(taille / 2, taille / 2);
  const rayon = p.cible / 2;
  const dit = `${p.quoi} — coin à ${coin.toFixed(1)}, rayon ${rayon}`;
  if (coin > rayon) echec(dit + ' — la matière sort du rond');
  else ok(dit);
}

console.log(echecs === 0 ? '\n✓ tout se lit' : `\n✗ ${echecs} problème(s) de lisibilité`);
process.exit(echecs === 0 ? 0 : 1);
