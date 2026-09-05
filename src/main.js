// Point d'entrée : sélection du conteneur, câblage boucle / rendu / entrée.
// Une seule base de code, un seul canvas, deux cibles d'affichage.

import { PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from './design.js';
import { creerVue } from './render/canvas.js';
import { dessinerScene } from './render/sprites.js';
import {
  majParticules, dessinerParticules, fumee, pose, destruction, vapeur,
} from './render/particules.js';
import { marquerPose, majPoses } from './render/pose.js';
import { presser, relacher, majAppuis } from './render/bouton.js';
import { majChevrons } from './render/chevron.js';
import { dessinerHud } from './render/hud.js';
import { poserRegions } from './render/biome.js';
import { oublierMiniCarte } from './render/minicarte.js';
import { dessinerChoix } from './render/choix.js';
import { dessinerHalo, dessinerBandeau } from './render/tutoriel.js';
import { creerDemarrage, avancerDemarrage, dessinerDemarrage } from './render/demarrage.js';
import { spriteItem } from './render/sprites.js';
import { creerMonde, majMonde } from './sim/world.js';
import { creerTutoriel, majTutoriel, etapeCourante, avancement } from './tutoriel.js';
import { SCENARIOS } from './data/scenarios.js';
import { centrerCamera, fenetre, celluleVisible } from './camera.js';
import { CELLULE, GRILLE_X, GRILLE_Y } from './design.js';
import { brancherPointeur } from './input/pointer.js';
import { demarrerBoucle } from './loop.js';

const canvas = document.getElementById('jeu');
const vue = creerVue(canvas);

// Une seule préparation : l'atlas des tuiles, déjà peint à l'import de
// sprites.js. Le monde, lui, attend qu'un essai soit choisi.
const demarrage = creerDemarrage(1);
demarrage.faites = 1;

// La partie en cours. Tant qu'aucun essai n'est choisi, il n'y a pas de monde :
// l'écran des essais tient l'écran, et le pointeur le sait.
const jeu = {
  monde: null,
  tutoriel: null,
  choisir(id) {
    const scenario = SCENARIOS.find((s) => s.id === id) || SCENARIOS[0];
    // Une graine nulle veut dire « tire-la » : le bac à sable a une carte
    // neuve à chaque fois, les deux autres gardent la leur.
    const graine = scenario.graine === null ? (Date.now() & 0x7fffffff) : scenario.graine;
    jeu.monde = creerMonde(scenario.disposition, graine);
    // Le sol appartient à la partie qui commence : le rendu oublie celui de la
    // précédente et repeint à partir de ses régions.
    poserRegions(jeu.monde.regions);
    oublierMiniCarte();
    jeu.tutoriel = scenario.tutoriel ? creerTutoriel() : null;
    centrerCamera(scenario.disposition.regard.cx, scenario.disposition.regard.cy);
    // L'écran des essais se referme, même quand l'essai est choisi d'ailleurs
    // que par le doigt — la sonde des outils de capture passe par ici aussi,
    // et l'entrée resterait sinon prise par un écran qu'on ne voit plus.
    if (interfaceJeu) interfaceJeu.choix = null;
  },
  // Revenir aux essais : la partie est abandonnée, pas mise de côté. Rien ici
  // n'est censé survivre — l'état permanent est ailleurs, et il n'existe pas
  // encore.
  oublier() { jeu.monde = null; jeu.tutoriel = null; },
};

const interfaceJeu = brancherPointeur(canvas, vue, jeu);
const ctx = vue.ctx;

// Sonde de test : laisse les outils lire l'état sans passer par le rendu.
// Rien dans le jeu ne la lit.
globalThis.sonde = { jeu, interface: interfaceJeu, choisir: (id) => jeu.choisir(id) };

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
  for (const cle of interfaceJeu.appuis) presser(cle);
  interfaceJeu.appuis.length = 0;
  for (const cle of interfaceJeu.relaches) relacher(cle);
  interfaceJeu.relaches.length = 0;
}

// Une machine qui vient de sortir sa pièce souffle un coup de vapeur. Le
// rendu compte les pièces produites d'une image à l'autre : la simulation n'a
// pas à savoir qu'un effet existe.
const produitesAvant = new Map();
function vapeurDesMachines() {
  for (const machine of jeu.monde.scene.machines) {
    if (!machine.def.vapeur) continue;
    const avant = produitesAvant.get(machine);
    produitesAvant.set(machine, machine.produits);
    if (avant === undefined || machine.produits <= avant) continue;
    // Le souffle sort du haut de la machine, pas de son milieu : sinon il naît
    // sous elle et on ne voit que la fin.
    vapeur(
      GRILLE_X + machine.cx * CELLULE + CELLULE / 2,
      GRILLE_Y + machine.cy * CELLULE,
    );
  }
}

// Un extracteur qui creuse fume. La fumée est posée en coordonnées du monde :
// c'est le rendu qui la décale avec le reste.
let horlogeFumee = 0;
function fumeeDesMines(dt) {
  horlogeFumee += dt;
  if (horlogeFumee < 0.18) return;
  horlogeFumee = 0;
  for (const machine of jeu.monde.scene.machines) {
    if (!machine.def.mine || machine.creuse === false) continue;
    fumee(GRILLE_X + machine.cx * CELLULE + CELLULE / 2, GRILLE_Y + machine.cy * CELLULE + 10);
  }
}

demarrerBoucle(
  (dt) => {
    // Le menu pause arrête le temps : c'est le seul endroit où la simulation
    // s'interrompt, et c'est le joueur qui le demande. L'écran des essais ne
    // l'arrête pas : il n'y a rien à arrêter tant qu'aucun monde n'existe.
    if (interfaceJeu.menuPause || !demarrage.fini || !jeu.monde) return;
    majMonde(jeu.monde, dt);
    const fetee = majTutoriel(jeu.tutoriel, jeu.monde, dt);
    // Une étape réussie se fête là où elle a eu lieu : le tutoriel ne dessine
    // rien, il dit seulement quelle case a bougé.
    if (fetee) {
      pose(GRILLE_X + fetee.cx * CELLULE + CELLULE / 2, GRILLE_Y + fetee.cy * CELLULE + CELLULE / 2);
      // L'étape suivante peut être hors de la fenêtre : on y emmène le regard,
      // sinon le halo battrait dans le vide. La caméra n'est que du rendu — la
      // simulation ne sait pas ce qu'on regarde.
      const suite = etapeCourante(jeu.tutoriel);
      const ou = suite && suite.cibles[0];
      if (ou && !celluleVisible(ou.cx, ou.cy, fenetre())) centrerCamera(ou.cx, ou.cy);
    }
  },
  (fps, dt) => {
    if (!avancerDemarrage(demarrage, dt)) {
      dessinerDemarrage(ctx, demarrage, spriteItem('bonbon'));
      return;
    }
    // Les touches vivent avant tout le reste : l'écran des essais en a, lui
    // aussi, et elles restaient immobiles tant que la suite n'était atteinte
    // qu'une fois le monde bâti.
    effetsDeConstruction();
    majAppuis(dt);

    // Pas encore d'essai choisi : l'écran des essais tient l'écran, et rien
    // d'autre n'existe.
    if (!jeu.monde) { dessinerChoix(ctx, interfaceJeu); return; }

    vapeurDesMachines();
    fumeeDesMines(dt);
    majParticules(dt);
    majPoses(dt);
    // Les chevrons de la scène qu'on regarde : c'est du rendu, pas du jeu.
    majChevrons(jeu.monde.scene, dt);

    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
    dessinerScene(ctx, jeu.monde, interfaceJeu.trace, dessinerParticules);
    const etape = etapeCourante(jeu.tutoriel);
    dessinerHalo(ctx, etape, jeu.tutoriel ? jeu.tutoriel.age : 0);
    dessinerBandeau(ctx, etape, avancement(jeu.tutoriel));
    dessinerHud(ctx, jeu.monde, fps, interfaceJeu);
  },
);
