// Point d'entrée : sélection du conteneur, câblage boucle / rendu / entrée.
// Une seule base de code, un seul canvas, deux cibles d'affichage.

import { PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE } from './design.js';
import { creerVue } from './render/canvas.js';
import { dessinerScene } from './render/sprites.js';
import {
  majParticules, dessinerParticules, fumee, pose, destruction, vapeur,
} from './render/particules.js';
import { marquerPose, majPoses } from './render/pose.js';
import { marquerCout, majCouts, oublierCouts } from './render/cout.js';
import { presser, relacher, majAppuis } from './render/bouton.js';
import { majChevrons } from './render/chevron.js';
import { dessinerHud } from './render/hud.js';
import { oublierSol } from './render/biome.js';
import { oublierMiniCarte } from './render/minicarte.js';
import { dessinerRepereMur } from './render/mur.js';
import { dessinerChoix } from './render/choix.js';
import { dessinerHalo, dessinerBandeau } from './render/tutoriel.js';
import { creerDemarrage, avancerDemarrage, dessinerDemarrage } from './render/demarrage.js';
import { poserFavicon } from './render/favicon.js';
import { spriteItem } from './render/sprites.js';
import { creerMonde, majMonde } from './sim/world.js';
import { plafond } from './sim/mur.js';
import { creerTutoriel, majTutoriel, etapeCourante, avancement } from './tutoriel.js';
import { SCENARIOS } from './data/scenarios.js';
import {
  camera, centrerCamera, poserCamera, poserPlafond, fenetreSure, celluleVisible,
} from './camera.js';
import { CELLULE, GRILLE_X, GRILLE_Y } from './design.js';
import { brancherPointeur } from './input/pointer.js';
import { demarrerBoucle } from './loop.js';
import { creerVeille } from './maj.js';
import { VERSION } from './data/version.js';
import { lirePartie, ecrirePartie, effacerPartie } from './save/run.js';
import { majToast, dessinerToast, annoncer } from './render/toast.js';

const canvas = document.getElementById('jeu');
const vue = creerVue(canvas);

// L'icône de l'onglet est le bonbon du jeu, peint par le même code : il n'y a
// pas d'image rangée à côté qui pourrait dériver.
poserFavicon();

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
    jeu.monde = creerMonde(scenario.disposition, graine, scenario.etageOuvert);
    // Le sol se déduit de la rangée, mais il reste en cache : le rendu oublie
    // celui de la partie précédente.
    oublierSol();
    oublierMiniCarte();
    oublierCouts();
    jeu.tutoriel = scenario.tutoriel ? creerTutoriel() : null;
    // La caméra ne monte pas au-dessus du mur : c'est le monde qui dit
    // jusqu'où on peut regarder, elle ne le devine pas.
    poserPlafond(plafond(jeu.monde));
    centrerCamera(scenario.disposition.regard.cx, scenario.disposition.regard.cy);
    // L'écran des essais se referme, même quand l'essai est choisi d'ailleurs
    // que par le doigt — la sonde des outils de capture passe par ici aussi,
    // et l'entrée resterait sinon prise par un écran qu'on ne voit plus.
    if (interfaceJeu) interfaceJeu.choix = null;
  },
  // Reprendre la partie qui attendait : elle est relue telle qu'elle était,
  // regard compris. Ce n'est pas un scénario de plus — rien n'est bâti, tout
  // est retrouvé.
  reprendre() {
    if (!enAttente) return false;
    const { monde, camera: regard, tutoriel } = enAttente;
    enAttente = null;
    jeu.monde = monde;
    jeu.tutoriel = tutoriel;
    oublierSol();
    oublierMiniCarte();
    oublierCouts();
    poserPlafond(plafond(monde));
    poserCamera(regard);
    if (interfaceJeu) interfaceJeu.choix = null;
    return true;
  },
  // Revenir aux essais : la partie est abandonnée, pas mise de côté. Elle est
  // donc effacée pour de bon — sans quoi l'écran des essais proposerait de
  // reprendre ce que le joueur vient de quitter. L'état permanent est
  // ailleurs, et il ne porte encore rien.
  oublier() {
    jeu.monde = null;
    jeu.tutoriel = null;
    enAttente = null;
    effacerPartie();
  },
};

// La partie qui attendait au lancement. Trois réponses possibles et pas
// deux : rien, une partie, ou une sauvegarde qu'on ne sait pas relire — cette
// dernière est écartée, mise de côté sous une clé à part, et annoncée. Elle ne
// s'adresse pas à l'enfant, qui n'y peut rien, mais à l'adulte qui rapportera
// le problème.
const attendait = lirePartie();
let enAttente = attendait.etat === 'lue' ? attendait.partie : null;

const interfaceJeu = brancherPointeur(canvas, vue, jeu);
const ctx = vue.ctx;

if (attendait.etat === 'illisible') annoncer('partie illisible', 'orange');
// La touche de reprise passe en tête des essais : elle ne remplace rien, elle
// s'ajoute, et elle disparaît le jour où il n'y a plus rien à reprendre.
if (enAttente) {
  interfaceJeu.choix.unshift({
    id: 'reprendre', nom: 'reprendre', icone: 'menuReprise', couleur: 'vert',
  });
}

// La partie s'écrit toute seule, de temps en temps, et à chaque fois que
// l'onglet part à l'arrière-plan. Écrire coûte moins d'un dixième de
// milliseconde sur une usine de cinq minutes : la période n'est courte que
// pour que rien ne se perde, pas pour ménager la machine.
const PERIODE_SAUVEGARDE = 5; // secondes
let horlogeSauvegarde = 0;

function sauvegarder() {
  if (!jeu.monde) return;
  ecrirePartie({ monde: jeu.monde, camera, tutoriel: jeu.tutoriel });
}

// Cette écoute est posée avant celle de la veille, et l'ordre compte : quand
// l'onglet passe à l'arrière-plan, la mise à jour recharge la page, et la
// partie doit être écrite avant qu'elle le fasse.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'hidden') sauvegarder();
});
// Un téléphone ferme parfois l'onglet sans repasser par là.
window.addEventListener('pagehide', sauvegarder);

// La veille des mises à jour. Elle vit avec le rendu et non avec la
// simulation : elle doit continuer de regarder quand le jeu est en pause, et
// même quand aucun monde n'existe encore.
const majVeille = creerVeille(jeu);

// Sonde de test : laisse les outils lire l'état sans passer par le rendu.
// Rien dans le jeu ne la lit.
globalThis.sonde = {
  jeu,
  interface: interfaceJeu,
  choisir: (id) => jeu.choisir(id),
  version: () => VERSION,
  // Regarder tout de suite, sans attendre l'intervalle : c'est ainsi que
  // outils éprouve la mise à jour.
  veille: () => majVeille(1e9),
};

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
  for (const c of interfaceJeu.couts) marquerCout(c.cx, c.cy, c.montant);
  interfaceJeu.couts.length = 0;
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
    // Un mur est tombé : la vue monte d'un étage, et le bandeau le dit. La
    // simulation ne fait que le poser — c'est ici qu'on l'apprend.
    if (jeu.monde.murTombe) {
      poserPlafond(plafond(jeu.monde));
      annoncer('le mur s’ouvre !', 'vert');
      jeu.monde.murTombe = null;
    }
    const fetee = majTutoriel(jeu.tutoriel, jeu.monde, dt);
    // Une étape réussie se fête là où elle a eu lieu : le tutoriel ne dessine
    // rien, il dit seulement quelle case a bougé.
    if (fetee) {
      pose(GRILLE_X + fetee.cx * CELLULE + CELLULE / 2, GRILLE_Y + fetee.cy * CELLULE + CELLULE / 2);
      // L'étape suivante peut être hors de vue : on y emmène le regard, sinon
      // le halo battrait dans le vide. C'est la zone sûre qui compte, pas la
      // fenêtre — depuis que la carte prend tout l'écran, une cellule cachée
      // sous la barre d'outils est bel et bien à l'écran, et bel et bien
      // invisible. La caméra n'est que du rendu : la simulation ne sait pas ce
      // qu'on regarde.
      const suite = etapeCourante(jeu.tutoriel);
      const ou = suite && suite.cibles[0];
      if (ou && !celluleVisible(ou.cx, ou.cy, fenetreSure())) centrerCamera(ou.cx, ou.cy);
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
    majVeille(dt);
    majToast(dt);

    // On écrit entre deux images, jamais au milieu d'un pas de simulation :
    // la partie est alors dans un état que la relecture retrouvera tel quel.
    horlogeSauvegarde += dt;
    if (horlogeSauvegarde >= PERIODE_SAUVEGARDE) {
      horlogeSauvegarde = 0;
      sauvegarder();
    }

    // Pas encore d'essai choisi : l'écran des essais tient l'écran, et rien
    // d'autre n'existe.
    if (!jeu.monde) { dessinerChoix(ctx, interfaceJeu); dessinerToast(ctx); return; }

    vapeurDesMachines();
    fumeeDesMines(dt);
    majParticules(dt);
    majPoses(dt);
    majCouts(dt);
    // Les chevrons de la scène qu'on regarde : c'est du rendu, pas du jeu.
    majChevrons(jeu.monde.scene, dt);

    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
    dessinerScene(ctx, jeu.monde, interfaceJeu.trace, dessinerParticules);
    // Où porter ce que le mur réclame, quand sa réception est hors de vue.
    dessinerRepereMur(ctx, jeu.monde);
    const etape = etapeCourante(jeu.tutoriel);
    dessinerHalo(ctx, etape, jeu.tutoriel ? jeu.tutoriel.age : 0);
    dessinerBandeau(ctx, etape, avancement(jeu.tutoriel));
    dessinerHud(ctx, jeu.monde, fps, interfaceJeu);
    // Le bandeau passe au-dessus de tout, menu pause compris : c'est une
    // nouvelle, et elle ne se cache derrière rien.
    dessinerToast(ctx);
  },
);
