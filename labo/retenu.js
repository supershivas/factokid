// Les deux propositions retenues, telles qu'elles tournent dans le jeu :
// ce fichier n'anime rien lui-même, il appelle le code de src/render/.

import { PALETTE } from '../src/design.js';
import { INTERFACE } from '../src/render/sprites.js';
import { marquerAppui, majAppuis, ecrasement } from '../src/render/bouton.js';
import { dessinerAlerte } from '../src/render/alerte.js';
import {
  pose, destruction, majParticules, dessinerParticules,
} from '../src/render/particules.js';

// Dessinées sur la grille de seize, elles la gardent : ces pages disent ce
// qu'on a comparé ce jour-là, pas ce que le jeu fait aujourd'hui.
const TUILE_PX = 16;

const CELLULE = 24;

const tuileConvoyeur = (() => {
  const c = document.createElement('canvas');
  c.width = TUILE_PX;
  c.height = TUILE_PX;
  const g = c.getContext('2d');
  const rect = (x, y, w, h, couleur) => { g.fillStyle = couleur; g.fillRect(x, y, w, h); };
  rect(0, 3, 16, 1, PALETTE.noir);
  rect(0, 4, 16, 8, PALETTE.ardoise);
  rect(0, 12, 16, 1, PALETTE.noir);
  for (let x = 1; x < 16; x += 4) { rect(x, 5, 2, 1, PALETTE.bleu); rect(x, 10, 2, 1, PALETTE.bleu); }
  return c;
})();

function machine(ctx, taille) {
  const c = taille / 2;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(c - 15, taille - 26, 30, 22);
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(c - 12, taille - 23, 24, 19);
  ctx.fillStyle = PALETTE.bleu;
  ctx.fillRect(c - 9, taille - 11, 18, 3);
}

// Les deux boutons d'outil, dessinés par le jeu lui-même, avec l'écrasement
// que joue la barre d'outils quand le doigt appuie.
const BOUTON = 32; // le bouton du jeu fait 48 ; réduit ici pour tenir à deux
function boutonJeu(ctx, x, y, icone, indice) {
  const e = ecrasement(indice);
  ctx.save();
  if (e) {
    ctx.translate(x + BOUTON / 2, y + BOUTON / 2);
    ctx.scale(e.x, e.y);
    ctx.translate(-x - BOUTON / 2, -y - BOUTON / 2);
  }
  ctx.drawImage(INTERFACE.bouton, x, y, BOUTON, BOUTON);
  ctx.drawImage(INTERFACE[icone], x, y, BOUTON, BOUTON);
  ctx.restore();
}

export const RETENUS = [
  {
    titre: 'Boutons retenus',
    note: 'trait fin centré au pixel près, croix crème à cœur rouge, écrasement élastique',
    duree: 2.4,
    dessiner(ctx, t, taille) {
      if (t < 0.02 && this.attend !== 'plus') { marquerAppui(0); this.attend = 'plus'; }
      if (t > 1.1 && t < 1.14 && this.attend !== 'croix') { marquerAppui(1); this.attend = 'croix'; }
      if (t > 1.5) this.attend = null;
      const y = (taille - BOUTON) / 2;
      boutonJeu(ctx, (taille - 2 * BOUTON - 4) / 2, y, 'outilConstruction', 0);
      boutonJeu(ctx, (taille - 2 * BOUTON - 4) / 2 + BOUTON + 4, y, 'outilDestruction', 1);
      majAppuis(1 / 60);
    },
  },
  {
    titre: 'Bulle retenue',
    note: 'jaillissement puis secousse, trois points de tailles et d’angles différents',
    duree: 3,
    dessiner(ctx, t, taille) {
      machine(ctx, taille);
      dessinerAlerte(ctx, taille / 2, taille - 15, t);
    },
  },
  {
    titre: 'Pose retenue',
    note: 'la tuile tombe, la poussière monte, les rayons claquent',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      // Le décor : deux voisines déjà posées.
      ctx.drawImage(tuileConvoyeur, 0, taille / 2 - CELLULE / 2, CELLULE, CELLULE);
      ctx.drawImage(tuileConvoyeur, taille - CELLULE, taille / 2 - CELLULE / 2, CELLULE, CELLULE);

      if (t < 0.02 && !this.lance) { this.lance = true; pose(taille / 2, taille / 2); }
      if (t > 0.5) this.lance = false;

      const chute = t < 0.22 ? -Math.round(16 * (1 - t / 0.22) ** 2) : 0;
      ctx.drawImage(
        tuileConvoyeur,
        taille / 2 - CELLULE / 2, taille / 2 - CELLULE / 2 + chute, CELLULE, CELLULE,
      );
      majParticules(1 / 60);
      dessinerParticules(ctx);
    },
  },
  {
    titre: 'Destruction retenue',
    note: 'éclats, poussière et rouille mêlés : le morceau part, la poussière reste',
    duree: 1.8,
    dessiner(ctx, t, taille) {
      ctx.drawImage(tuileConvoyeur, 0, taille / 2 - CELLULE / 2, CELLULE, CELLULE);
      ctx.drawImage(tuileConvoyeur, taille - CELLULE, taille / 2 - CELLULE / 2, CELLULE, CELLULE);

      if (t < 0.02 && !this.lance) { this.lance = true; destruction(taille / 2, taille / 2); }
      if (t > 0.5) this.lance = false;

      // La tuile disparaît à l'instant de l'éclat : c'est elle qui part en morceaux.
      if (t < 0.02) {
        ctx.drawImage(
          tuileConvoyeur,
          taille / 2 - CELLULE / 2, taille / 2 - CELLULE / 2, CELLULE, CELLULE,
        );
      }
      majParticules(1 / 60);
      dessinerParticules(ctx);
    },
  },
];
