// Point d'entrée : sélection du conteneur, câblage boucle / rendu / entrée.
// Une seule base de code, un seul canvas, deux cibles d'affichage.

import { PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from './design.js';
import { creerVue } from './render/canvas.js';
import { dessinerScene, dessinerCarte, bordureGrille } from './render/sprites.js';
import { majParticules, dessinerParticules, fumee, etoiles } from './render/particules.js';
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

// Ce qui vient d'être construit lance sa gerbe d'étoiles. Le geste est dans
// l'entrée, la récompense dans le rendu : main.js fait le lien.
function effetsDeConstruction() {
  for (const c of interfaceJeu.effets) {
    etoiles(GRILLE_X + c.cx * CELLULE + CELLULE / 2, GRILLE_Y + c.cy * CELLULE + CELLULE / 2);
  }
  interfaceJeu.effets.length = 0;
}

// Une mine qui creuse fume.
let horlogeFumee = 0;
function fumeeDesMines(dt) {
  if (interfaceJeu.vue < 0) return;
  horlogeFumee += dt;
  if (horlogeFumee < 0.18) return;
  horlogeFumee = 0;
  for (const machine of monde.cartes[interfaceJeu.vue].scene.machines) {
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

    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
    if (interfaceJeu.vue < 0) dessinerScene(ctx, monde.usine, interfaceJeu.trace);
    else dessinerCarte(ctx, monde.cartes[interfaceJeu.vue], interfaceJeu.trace);
    dessinerParticules(ctx);
    bordureGrille(ctx);
    dessinerHud(ctx, monde, fps, interfaceJeu);
  },
);
