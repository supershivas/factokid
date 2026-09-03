// Six ouvertures pour le menu de construction.
//
// Ce que la barre d'outils fait quand le doigt touche « construire » : la
// liste des éléments posables sort du bouton. Ce fichier n'invente aucun
// dessin — il appelle les plaques et les bulles du jeu, et ne fait varier que
// la façon dont elles arrivent. La proposition retenue est la première ; le
// jeu la joue avec le même décalage.

import { PALETTE, BULLE, BULLE_ECART, RANGEE_L, progressionRangee } from '../src/design.js';
import { INTERFACE } from '../src/render/sprites.js';
import { CONSTRUCTIBLES } from '../src/data/outils.js';
import { borne, ressortAmorti, sortieCubique } from './atelier.js';

const RANGEES = 4;                    // de quoi voir le décalage sans tout dessiner
const PAS = BULLE + BULLE_ECART;      // ce qui sépare deux rangées, comme dans le jeu
const MARGE = 8;

// La barre d'outils, en bas de la vignette : c'est de là que tout sort.
function bouton(ctx, x, y, actif) {
  ctx.globalAlpha = actif ? 1 : 0.45;
  ctx.drawImage(INTERFACE.bouton, x, y, BULLE, BULLE);
  ctx.drawImage(INTERFACE.outilConstruction, x, y, BULLE, BULLE);
  ctx.globalAlpha = 1;
}

// Une rangée du menu : la plaque, la bulle, et la barre grise qui tient lieu
// de nom — ce qui compte ici est le mouvement, pas le mot.
function rangee(ctx, x, y, j, alpha, echelle = 1) {
  ctx.save();
  ctx.globalAlpha = borne(alpha);
  if (echelle !== 1) {
    ctx.translate(x + RANGEE_L / 2, y + BULLE / 2);
    ctx.scale(echelle, echelle);
    ctx.translate(-x - RANGEE_L / 2, -y - BULLE / 2);
  }
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(x, y, RANGEE_L, BULLE);
  ctx.drawImage(INTERFACE.bulleFond, x, y, BULLE, BULLE);
  ctx.drawImage(INTERFACE[CONSTRUCTIBLES[j].icone], x, y, BULLE, BULLE);
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(x + BULLE + 10, y + BULLE / 2 - 3, RANGEE_L - BULLE - 24, 6);
  ctx.restore();
}

// Chaque proposition n'est qu'une façon de répondre à « où en est la rangée j
// au temps t ». `x` déplace la rangée, `echelle` la fait grossir.
function vignette(placer, duree = 1.6) {
  return (ctx, t, largeur, hauteur) => {
    // Le plateau assombri du jeu : sans lui, la plaque noire des rangées se
    // confondrait avec le fond de la vignette.
    ctx.fillStyle = PALETTE.ardoise;
    ctx.globalAlpha = 0.22;
    ctx.fillRect(0, 0, largeur, hauteur);
    ctx.globalAlpha = 1;
    const x = MARGE;
    const bas = hauteur - MARGE - BULLE;
    // Une pause au début et à la fin : on voit l'état de départ et l'état posé.
    const temps = borne((t - 0.25) / (duree - 0.25), 0, 1) * duree;
    for (let j = RANGEES - 1; j >= 0; j--) {
      const etat = placer(temps, j);
      if (etat.p <= 0) continue;
      rangee(
        ctx, x + (etat.dx || 0), bas - (j + 1) * PAS * etat.p, j,
        etat.alpha === undefined ? etat.p : etat.alpha, etat.echelle || 1,
      );
    }
    bouton(ctx, x, bas, temps > 0);
  };
}

// Le ressort du jeu, approché par sa réponse à un échelon : il dépasse, puis
// se pose.
const ressort = (t) => ressortAmorti(t, 170, 26);

export const OUVERTURES = [
  {
    titre: 'décalé — retenu',
    note: 'un ressort commun, chaque rangée part 9 % après la précédente',
    duree: 1.6,
    dessiner: vignette((t, j) => ({ p: progressionRangee(ressort(t), j) })),
  },
  {
    titre: "d'un bloc",
    note: "la liste entière sur le même ressort : c'est ce qu'on faisait",
    duree: 1.6,
    dessiner: vignette((t) => ({ p: ressort(t) })),
  },
  {
    titre: 'sans dépassement',
    note: 'la même montée, posée net : rien ne rebondit',
    duree: 1.6,
    dessiner: vignette((t, j) => ({ p: sortieCubique((t - j * 0.06) / 0.32) })),
  },
  {
    titre: 'décalage long',
    note: 'deux fois plus d’attente entre deux rangées : la liste se déroule',
    duree: 1.9,
    dessiner: vignette((t, j) => ({ p: progressionRangee(ressort(t), j * 2) }), 1.9),
  },
  {
    titre: 'en éventail',
    note: 'chaque rangée glisse aussi de côté, et se range en arrivant',
    duree: 1.6,
    dessiner: vignette((t, j) => {
      const p = progressionRangee(ressort(t), j);
      return { p, dx: (1 - borne(p)) * 26 };
    }),
  },
  {
    titre: 'chacune éclot',
    note: 'la rangée grossit sur place au lieu de monter : la place est prise d’avance',
    duree: 1.6,
    dessiner: vignette((t, j) => {
      const p = borne(ressort((t - j * 0.07) * 1.1));
      return { p: 1, alpha: p, echelle: 0.5 + 0.5 * p };
    }),
  },
];
