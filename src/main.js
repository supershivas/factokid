// Point d'entrée : sélection du conteneur, câblage boucle / rendu / entrée.
// Une seule base de code, un seul canvas, deux cibles d'affichage.

import { PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from './design.js';
import { creerVue } from './render/canvas.js';
import { dessinerScene, bordureGrille } from './render/sprites.js';
import {
  majParticules, dessinerParticules, fumee, pose, destruction,
} from './render/particules.js';
import { marquerPose, majPoses } from './render/pose.js';
import { marquerAppui, majAppuis } from './render/bouton.js';
import { majChevrons } from './render/chevron.js';
import { dessinerHud } from './render/hud.js';
import { creerMonde, majMonde } from './sim/world.js';
import { CELLULE, GRILLE_X, GRILLE_Y } from './design.js';
import { brancherPointeur } from './input/pointer.js';
import { demarrerBoucle } from './loop.js';

const canvas = document.getElementById('jeu');
const vue = creerVue(canvas);
const monde = creerMonde();
const interfaceJeu = brancherPointeur(canvas, vue, monde);
const ctx = vue.ctx;

// Sonde de test : laisse les outils lire l'état sans passer par le rendu.
// Rien dans le jeu ne la lit.
globalThis.sonde = { monde, interface: interfaceJeu };

// Ce qui vient d'être construit lance sa gerbe d'étoiles, ce qui vient d'être
// détruit part en éclats. Le geste est dans
// l'entrée, la récompense dans le rendu : main.js fait le lien.
function effetsDeConstruction() {
  for (const c of interfaceJeu.effets) {
    marquerPose(c.cx, c.cy);
    pose(GRILLE_X + c.cx * CELLULE + CELLULE / 2, GRILLE_Y + c.cy * CELLULE + CELLULE / 2);
  }
  interfaceJeu.effets.length = 0;
  for (const c of interfaceJeu.debris) {
    destruction(GRILLE_X + c.cx * CELLULE + CELLULE / 2, GRILLE_Y + c.cy * CELLULE + CELLULE / 2);
  }
  interfaceJeu.debris.length = 0;
  for (const i of interfaceJeu.appuis) marquerAppui(i);
  interfaceJeu.appuis.length = 0;
}

// Un extracteur qui creuse fume. La fumée est posée en coordonnées du monde :
// c'est le rendu qui la décale avec le reste.
let horlogeFumee = 0;
function fumeeDesMines(dt) {
  horlogeFumee += dt;
  if (horlogeFumee < 0.18) return;
  horlogeFumee = 0;
  for (const machine of monde.scene.machines) {
    if (!machine.def.mine || machine.creuse === false) continue;
    fumee(GRILLE_X + machine.cx * CELLULE + CELLULE / 2, GRILLE_Y + machine.cy * CELLULE + 10);
  }
}

demarrerBoucle(
  (dt) => majMonde(monde, dt),
  (fps, dt) => {
    effetsDeConstruction();
    fumeeDesMines(dt);
    majParticules(dt);
    majPoses(dt);
    majAppuis(dt);
    // Les chevrons de la scène qu'on regarde : c'est du rendu, pas du jeu.
    majChevrons(monde.scene, dt);

    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
    dessinerScene(ctx, monde, interfaceJeu.trace, dessinerParticules);
    bordureGrille(ctx);
    dessinerHud(ctx, monde, fps, interfaceJeu);
  },
);
