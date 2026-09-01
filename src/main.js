// Point d'entrée : sélection du conteneur, câblage boucle / rendu / entrée.
// Une seule base de code, un seul canvas, deux cibles d'affichage.

import { PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from './design.js';
import { creerVue } from './render/canvas.js';
import { dessinerScene, dessinerCarte, bordureGrille } from './render/sprites.js';
import { dessinerHud } from './render/hud.js';
import { creerMonde, majMonde } from './sim/world.js';
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

demarrerBoucle(
  (dt) => majMonde(monde, dt),
  (fps) => {
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
    if (interfaceJeu.vue < 0) dessinerScene(ctx, monde, interfaceJeu.trace);
    else dessinerCarte(ctx, monde.cartes[interfaceJeu.vue]);
    bordureGrille(ctx);
    dessinerHud(ctx, monde, fps, interfaceJeu);
  },
);
