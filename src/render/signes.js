// Les signes de l'interface : la main, le plus, la croix, les chevrons du
// tapis, la pause, la lecture, la liste, le livre, les deux crans du zoom.
// Ne modifie jamais l'état.
//
// Ce sont des **courbes**, pas des pixels, et c'est la suite de ce qui a été
// fait pour les touches : une touche tracée à la résolution de l'écran qui
// porte un signe de vingt-quatre pixels agrandi deux fois se voit tout de
// suite — le rond est net, la main est un escalier. Les deux vont ensemble.
//
// La frontière ne bouge pas pour autant : **un signe d'interface est une
// courbe, une chose du monde reste du pixel art**. Une machine, une matière,
// un gisement se dessinent toujours pixel par pixel — ce sont des objets du
// jeu, pas des commandes. C'est ce qui distingue le bouton de ce qu'il montre.
//
// Les quatre premiers viennent tels quels du labo (labo/touches.html) : ce
// sont les mêmes chemins, à la virgule près.

import { PIXEL } from '../design.js';

// La boîte dans laquelle chaque signe est écrit. C'est celle des SVG du labo,
// et elle n'a rien à voir avec la tuile du jeu : un signe n'est pas une tuile.
const BOITE = 24;

// Un trait d'un chemin SVG, tracé tel qu'il est écrit. Path2D lit la même
// syntaxe que l'attribut « d » : le dessin du labo se transporte sans être
// retouché.
function chemin(g, d, epaisseur) {
  g.lineWidth = epaisseur;
  g.lineCap = 'round';
  g.lineJoin = 'round';
  g.stroke(new Path2D(d));
}

// Un carré aux coins arrondis, plein ou vide : c'est tout ce dont les signes
// de cases ont besoin — le livre des matières et les deux crans du zoom.
function carre(g, x, y, cote, plein, epaisseur = 2) {
  g.beginPath();
  g.roundRect(x, y, cote, cote, Math.max(1, cote / 5));
  if (plein) { g.fill(); return; }
  g.lineWidth = epaisseur;
  g.stroke();
}

// Une grille de carrés : n par n, qui remplit la boîte avec son écart.
function damier(g, n, plein = true) {
  const ecart = n > 3 ? 1.6 : 2.4;
  const cote = (BOITE - 5 - ecart * (n - 1)) / n;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      carre(g, 2.5 + j * (cote + ecart), 2.5 + i * (cote + ecart), cote, plein);
    }
  }
}

// La table. Chaque signe se dessine dans une boîte de 24, la couleur étant
// déjà posée : il ne la choisit pas, c'est la touche qui la lui donne.
export const SIGNES = {
  // La main du labo, à la virgule près : trois doigts repliés et le pouce.
  outilMain: (g) => {
    chemin(g, 'M8 12V5.6a1.6 1.6 0 0 1 3.2 0V11', 1.9);
    chemin(g, 'M11.2 11V4.8a1.6 1.6 0 0 1 3.2 0V11', 1.9);
    chemin(
      g,
      'M14.4 11.4V6.4a1.6 1.6 0 0 1 3.2 0V15c0 3.3-2.4 5.6-5.6 5.6-3 0-4.4-1.4-5.6-3.4'
      + 'l-2.2-3.7a1.6 1.6 0 0 1 2.6-1.9L8 13.4',
      1.9,
    );
  },
  // Le tapis vu de dessus : deux bords et deux chevrons qui disent le sens.
  outilConvoyeur: (g) => {
    chemin(g, 'M2.5 7.5h19M2.5 16.5h19', 1.9);
    chemin(g, 'M7 9.4 9.8 12 7 14.6M12.4 9.4 15.2 12l-2.8 2.6', 1.9);
  },
  outilConstruction: (g) => chemin(g, 'M12 5v14M5 12h14', 2.6),
  outilDestruction: (g) => chemin(g, 'M6.5 6.5l11 11M17.5 6.5l-11 11', 2.6),

  // La croix qui referme est la même, en plus fine : on ne détruit rien en
  // refermant une explication, et l'épaisseur le dit avant la couleur.
  menuFermer: (g) => chemin(g, 'M7 7l10 10M17 7l-10 10', 1.9),

  // Deux barres égales : la pause. Un triangle : la reprise.
  outilPause: (g) => chemin(g, 'M9 5.5v13M15 5.5v13', 3.4),
  menuReprise: (g) => {
    g.beginPath();
    g.moveTo(8.5, 5.2);
    g.lineTo(19, 12);
    g.lineTo(8.5, 18.8);
    g.closePath();
    g.lineWidth = 2.4;
    g.lineJoin = 'round';
    g.fill();
    g.stroke();
  },
  // Trois lignes : la liste des essais.
  menuEssais: (g) => chemin(g, 'M4.5 7h15M4.5 12h15M4.5 17h15', 2.2),

  // Le livre des matières : trois cases pleines et une qui manque. C'est la
  // collection elle-même — ce qu'on a, et ce qui reste à trouver.
  menuCollection: (g) => {
    const cote = 8.4;
    const ecart = 2.2;
    carre(g, 2.5, 2.5, cote, true);
    carre(g, 2.5 + cote + ecart, 2.5, cote, true);
    carre(g, 2.5, 2.5 + cote + ecart, cote, true);
    carre(g, 2.5 + cote + ecart, 2.5 + cote + ecart, cote, false, 1.9);
  },

  // Les deux crans du zoom. Rien de rond ici — une loupe est un cercle, et
  // dans ce jeu un cercle n'est jamais qu'un bouton. Ce sont donc des cases,
  // et elles montrent ce qu'on obtient en appuyant : quatre grosses pour
  // revenir bâtir, seize petites pour reculer et voir loin.
  zoomLoin: (g) => damier(g, 4),
  zoomPres: (g) => damier(g, 2),
};

export const estSigne = (nom) => Object.hasOwn(SIGNES, nom);

// Chaque signe est peint une fois, à la taille et à l'échelle où il sert, puis
// gardé : un bouton ne se retrace pas soixante fois par seconde.
const cache = new Map();

function toile(taille, k, peindre) {
  const c = document.createElement('canvas');
  c.width = Math.ceil(taille * k);
  c.height = Math.ceil(taille * k);
  const g = c.getContext('2d');
  g.scale((taille * k) / BOITE, (taille * k) / BOITE);
  peindre(g);
  return c;
}

export function spriteSigne(nom, taille, couleur, k) {
  const dessin = SIGNES[nom];
  if (!dessin) return null;
  const cle = nom + '@' + taille + 'x' + k + couleur;
  if (!cache.has(cle)) {
    cache.set(cle, toile(taille, k, (g) => {
      g.strokeStyle = couleur;
      g.fillStyle = couleur;
      dessin(g);
    }));
  }
  return cache.get(cle);
}

// Poser un signe quelque part hors d'une touche : le menu pause s'en sert pour
// l'icône de ses pilules.
export function dessinerSigne(ctx, nom, x, y, taille, couleur) {
  const k = ctx.getTransform().a || 1;
  const image = spriteSigne(nom, taille, couleur, k);
  if (image) ctx.drawImage(image, x, y, taille, taille);
}

// Ce qu'un signe vaut en unités logiques quand il remplace une tuile de
// vingt-quatre pixels d'art : exactement la même place.
export const TAILLE_SIGNE = BOITE * PIXEL;
