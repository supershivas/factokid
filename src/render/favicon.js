// L'icône de l'onglet, et celle de l'écran d'accueil. Ne modifie jamais l'état
// du jeu — elle ne fait que poser deux liens dans la page.
//
// Elle n'est pas un fichier du dépôt : c'est **le bonbon du jeu, peint par le
// code qui le peint**, agrandi d'un nombre entier de fois et posé sur le noir.
// Une image rangée à côté aurait été une seconde vérité, qui aurait dérivé le
// jour où le bonbon change de forme. Ici, il n'y en a qu'une.
//
// Le bonbon plutôt qu'une machine : c'est déjà l'emblème du jeu — la barre de
// chargement le montre, l'écran des essais aussi.

import { PALETTE } from '../design.js';
import { spriteItem } from './sprites.js';

// Deux tailles, deux usages. Trente-deux pour l'onglet ; cent quatre-vingts
// pour l'écran d'accueil d'un téléphone, et c'est exactement vingt fois les
// neuf pixels d'art du bonbon — l'agrandissement reste entier, comme partout.
const ONGLET = 32;
const ACCUEIL = 180;

function peindre(taille) {
  const bonbon = spriteItem('bonbon');
  if (!bonbon) return null;
  const c = document.createElement('canvas');
  c.width = taille;
  c.height = taille;
  const g = c.getContext('2d');
  g.imageSmoothingEnabled = false;
  g.fillStyle = PALETTE.noir;
  g.fillRect(0, 0, taille, taille);
  // Le plus grand agrandissement entier qui laisse une marge : un bonbon collé
  // aux bords se lit mal en seize pixels dans un onglet.
  const zoom = Math.max(1, Math.floor((taille * 0.84) / bonbon.width));
  const cote = bonbon.width * zoom;
  const marge = Math.round((taille - cote) / 2);
  g.drawImage(bonbon, marge, marge, cote, cote);
  return c;
}

function poser(rel, taille) {
  const image = peindre(taille);
  if (!image) return;
  const lien = document.createElement('link');
  lien.rel = rel;
  lien.type = 'image/png';
  lien.sizes = taille + 'x' + taille;
  lien.href = image.toDataURL('image/png');
  document.head.appendChild(lien);
}

export function poserFavicon() {
  poser('icon', ONGLET);
  // L'icône que garde un téléphone quand on ajoute le jeu à son écran
  // d'accueil. Safari la lit au moment où on l'ajoute, donc bien après le
  // chargement : la poser ici suffit.
  poser('apple-touch-icon', ACCUEIL);
}
