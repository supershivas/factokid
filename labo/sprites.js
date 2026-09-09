// Les sprites du jeu, montrés et exportés. Ne dessine rien de neuf : tout est
// pris au code qui peint le jeu, si bien qu'un sprite modifié là-bas change
// ici sans qu'on y touche.

import { planche, ICONES } from '../src/render/sprites.js';
import { tuileMur } from '../src/render/mur.js';
import { MATIERE_DE } from '../src/data/biomes.js';
import { PALETTE } from '../src/design.js';

// Le zoom d'affichage : un nombre entier, comme partout ailleurs. Une image de
// pixel art à ×5,5 n'a plus des pixels de même largeur.
const ZOOM = 5;

// Ce qui sort vraiment du sol : le reste des gisements est peint par le code
// pour toutes les matières, mais il n'y a pas de gisement de bonbon dans le
// jeu, et une planche qui en montrerait un mentirait.
const DU_SOL = new Set(Object.values(MATIERE_DE));

// L'ordre des sections dit ce que chaque chose est, et il vaut aussi pour la
// planche : c'est le seul plan qu'on ait pour s'y retrouver dedans. Les gardes
// sont exclusives et lues dans l'ordre — une image ne se montre pas deux fois.
const SECTIONS = [
  { titre: 'les machines', garde: (n) => n in ICONES },
  { titre: 'le mur', garde: (n) => n === 'mur' },
  { titre: 'le tapis', garde: (n) => n.startsWith('tapis-') || n.startsWith('chevron') },
  { titre: 'les gisements', garde: (n) => n.startsWith('gisement-') || n === 'arbre' },
  { titre: 'les matières', garde: (n) => n.startsWith('matiere-') },
  { titre: 'les bulles du menu', garde: (n) => n.startsWith('bulle-') },
  // Le filet : ce qu'aucune section ne réclame se montre quand même. Un sprite
  // ajouté au jeu apparaît ici sans qu'on ait à y penser, quitte à être mal
  // rangé — mieux vaut mal rangé qu'absent.
  { titre: 'le reste', garde: () => true },
];

const tout = {};
for (const [nom, image] of Object.entries({ ...planche(), mur: tuileMur })) {
  const matiere = nom.startsWith('gisement-') ? nom.slice('gisement-'.length) : null;
  if (matiere && matiere !== 'vide' && !DU_SOL.has(matiere)) continue;
  tout[nom] = image;
}

// Une toile agrandie d'un nombre entier de fois, sans lissage : c'est ce que
// le jeu fait, et c'est ce qu'on doit voir.
function agrandir(image, zoom) {
  const c = document.createElement('canvas');
  c.width = image.width * zoom;
  c.height = image.height * zoom;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.drawImage(image, 0, 0, c.width, c.height);
  return c;
}

function telecharger(nom, image) {
  const a = document.createElement('a');
  a.download = nom + '.png';
  a.href = image.toDataURL('image/png');
  a.click();
}

const sections = document.getElementById('sections');
const ordre = [];

const place = new Set();
for (const section of SECTIONS) {
  const noms = Object.keys(tout).filter((n) => !place.has(n) && section.garde(n)).sort();
  if (noms.length === 0) continue;
  for (const n of noms) place.add(n);
  const titre = document.createElement('h2');
  titre.textContent = section.titre;
  const grille = document.createElement('div');
  grille.className = 'grille';
  for (const nom of noms) {
    ordre.push(nom);
    const image = tout[nom];
    const carte = document.createElement('div');
    carte.className = 'carte';
    const damier = document.createElement('div');
    damier.className = 'damier';
    damier.appendChild(agrandir(image, ZOOM));
    const etiquette = document.createElement('div');
    etiquette.className = 'nom';
    etiquette.textContent = nom;
    const taille = document.createElement('div');
    taille.className = 'taille';
    taille.textContent = image.width + ' × ' + image.height;
    const lien = document.createElement('a');
    lien.className = 'telecharger';
    lien.textContent = 'png';
    lien.download = nom + '.png';
    lien.href = image.toDataURL('image/png');
    carte.append(damier, etiquette, taille, lien);
    grille.appendChild(carte);
  }
  sections.append(titre, grille);
}

// La planche : tout sur une image, à la taille native, sur une grille de
// vingt-quatre. Les matières font neuf : elles sont centrées dans leur case,
// pour que la grille reste lisible d'un bout à l'autre.
document.getElementById('planche').addEventListener('click', () => {
  const CASE = 24;
  const colonnes = 8;
  const lignes = Math.ceil(ordre.length / colonnes);
  const c = document.createElement('canvas');
  c.width = colonnes * CASE;
  c.height = lignes * CASE;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  ordre.forEach((nom, i) => {
    const image = tout[nom];
    const x = (i % colonnes) * CASE + Math.floor((CASE - image.width) / 2);
    const y = Math.floor(i / colonnes) * CASE + Math.floor((CASE - image.height) / 2);
    g.drawImage(image, x, y);
  });
  telecharger('planche-sprites', c);
});

document.getElementById('tout').addEventListener('click', () => {
  // Un par un, espacés : un navigateur refuse une rafale de téléchargements.
  ordre.forEach((nom, i) => {
    setTimeout(() => telecharger(nom, tout[nom]), i * 220);
  });
});

// --- la palette, pour l'éditeur ---------------------------------------------
//
// Un dessin fait avec d'autres couleurs que les seize se fait rapprocher des
// seize, et ce rapprochement est un hasard heureux au mieux. Le vrai remède
// est en amont : charger la palette dans l'éditeur, et n'y prendre que ce
// qu'elle donne. Deux formats, parce que les éditeurs ne lisent pas les mêmes.
//
// Elle n'est pas rangée dans un fichier du dépôt : elle est écrite depuis
// `design.js`, comme tout le reste. Une palette copiée à côté finirait par
// mentir le jour où une couleur change.
const SEIZE = [
  'noir', 'prune', 'rouge', 'orange', 'jaune', 'anis', 'vert', 'sarcelle',
  'nuit', 'outremer', 'bleu', 'cyan', 'creme', 'brume', 'ardoise', 'profond',
];

function telechargerTexte(nom, texte) {
  const a = document.createElement('a');
  a.download = nom;
  a.href = URL.createObjectURL(new Blob([texte], { type: 'text/plain' }));
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

document.getElementById('palette-hex').addEventListener('click', () => {
  telechargerTexte('sweetie16.hex', SEIZE.map((n) => PALETTE[n].slice(1).toUpperCase()).join('\n') + '\n');
});

document.getElementById('palette-gpl').addEventListener('click', () => {
  const lignes = ['GIMP Palette', 'Name: Sweetie 16', 'Columns: 8', '#'];
  for (const nom of SEIZE) {
    const hex = PALETTE[nom];
    const r = parseInt(hex.slice(1, 3), 16);
    const v = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    lignes.push(
      String(r).padStart(3) + ' ' + String(v).padStart(3) + ' ' + String(b).padStart(3) + '\t' + nom,
    );
  }
  telechargerTexte('sweetie16.gpl', lignes.join('\n') + '\n');
});
