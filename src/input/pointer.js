// Gestes unifiés (Pointer Events) : la souris produit exactement les mêmes
// gestes que le doigt. Un glissé d'une machine à l'autre crée le chemin entier.
//
// Appui court : la fonction principale de l'élément touché. Appui long : ses
// informations. Ce module tient aussi l'état de l'interface ; le rendu le lit,
// il ne le modifie jamais.

import {
  CELLULE, GRILLE_X, GRILLE_Y, LARGEUR_VUE, HAUTEUR_VUE, PANNEAU, MINICARTE,
  BOUTON_PAUSE, rectBouton, rectBulle, rectOption, rectMenu, dansRect,
} from '../design.js';
import { celluleMiniCarte } from '../render/minicarte.js';
import { OUTILS, CONSTRUCTIBLES, MACHINES_CONSTRUCTIBLES } from '../data/outils.js';
import { ITEMS } from '../data/items.js';
import { MACHINES } from '../data/machines.js';
import { ressort } from '../anim.js';
import { celluleDepuisPoint, adjacentes, coinCellule } from '../sim/grid.js';
import { DEPART } from '../data/depart.js';
import {
  machineEn, convoyeurEn, celluleLibre, poserConvoyeur, couperConvoyeur,
  prolongerConvoyeur, brancherConvoyeur, raccorderA, ajouterMachine, retirerMachine,
} from '../sim/scene.js';
import { gisementEn, poserExtracteur, retirerExtracteur } from '../sim/gisement.js';
import { camera, deplacerCamera, centrerCamera, versMonde } from '../camera.js';
import { aUneSortie, attendus, maxEntrees } from '../sim/machine.js';

const APPUI_LONG = 0.42 * 1000; // millisecondes
const SEUIL_GLISSE = 6;         // unités logiques au-delà desquelles c'est un tracé

export function brancherPointeur(canvas, vue, monde) {
  const etat = {
    // La main est l'outil du repos : on regarde le monde avant de le changer.
    outil: 'main',
    constructible: CONSTRUCTIBLES[0].id,
    menuOuvert: false,
    menu: 0,
    ancre: null,
    bulles: [],
    boutons: [],
    panneau: null,
    panneauAnim: 0,
    trace: {
      actif: false, source: null, chemin: [], reprise: null, branche: null,
      origine: null, contact: null,
    },
    menuPause: null,             // null, 'menu' ou 'recettes'
    boutonsMenu: [],
    effets: [],                  // cellules qui viennent d'être construites
    debris: [],                  // cellules qui viennent d'être détruites
    appuis: [],                  // boutons d'outil qui viennent d'être touchés
  };
  const trace = etat.trace;
  let pointeur = null;
  let actionsBulles = [];
  let actionsBoutons = [];
  let departCellule = null;
  let departPoint = null;
  let minuterie = null;
  let appuiLongFait = false;
  let dernierPoint = null;
  let actionsMenu = [];
  let animMenu = null;
  let animPanneau = null;

  const scene = () => monde.scene;

  function viser(cle, vers, courante) {
    if (courante) courante.stop();
    return ressort(etat[cle], vers, (v) => { etat[cle] = v; });
  }

  // --- interface ----------------------------------------------------------

  const indexOutil = (id) => OUTILS.findIndex((o) => o.id === id);

  function majBoutons() {
    const outils = OUTILS.map((o) => ({
      icone: o.icone,
      actif: o.id === etat.outil,
      action: () => {
        // Un second appui sur « construction » referme la liste : le bouton
        // ouvre et ferme, le doigt n'a pas à chercher ailleurs.
        if (o.id === 'construction' && etat.outil === 'construction' && etat.menuOuvert) {
          fermerMenu();
          majBoutons();
          return;
        }
        etat.outil = o.id;
        if (o.id === 'construction') {
          // Le convoyeur est ce qu'on pose le plus souvent : il est prêt.
          etat.constructible = 'convoyeur';
          // Les bulles sortent du bouton qu'on vient de toucher, pas du
          // premier de la barre : depuis que la main s'est ajoutée devant,
          // « construction » n'est plus à la place zéro.
          ouvrirMenu(bullesConstructibles(), rectBouton(indexOutil(o.id)));
        } else fermerMenu();
        majBoutons();
      },
    }));
    // Pas de bouton retour sur une carte : on revient en touchant son
    // téléporteur, comme on y est venu. Un geste, pas deux chemins.
    etat.boutons = outils.map((o) => ({ icone: o.icone, actif: o.actif }));
    actionsBoutons = outils.map((o) => o.action);
  }

  function ouvrirMenu(contenu, ancre) {
    etat.menuOuvert = true;
    etat.ancre = ancre;
    etat.bulles = contenu.map((c) => ({
      icone: c.icone, nom: c.nom, grise: c.grise, choisie: c.choisie,
    }));
    actionsBulles = contenu.map((c) => c.action);
    animMenu = viser('menu', 1, animMenu);
  }

  function fermerMenu() {
    if (!etat.menuOuvert) return;
    etat.menuOuvert = false;
    animMenu = viser('menu', 0, animMenu);
  }

  // Le menu montre tous les éléments constructibles. Depuis qu'il n'y a plus
  // qu'une carte, tout se pose partout : plus rien n'est grisé. L'extracteur
  // demande seulement un gisement sous lui.
  function bullesConstructibles() {
    return CONSTRUCTIBLES.map((c) => ({
      icone: c.icone,
      nom: MACHINES[c.id].nom,
      choisie: c.id === etat.constructible,
      action: () => {
        etat.constructible = c.id;
        etat.outil = 'construction';
        fermerMenu();
        majBoutons();
      },
    }));
  }

  function surgirPanneau() {
    etat.panneauAnim = 0;
    animPanneau = viser('panneauAnim', 1, animPanneau);
  }

  function ouvrirPanneau(machine, convoyeur) {
    if (machine) {
      etat.panneau = {
        nom: machine.def.nom,
        description: machine.def.description,
        icone: machine.type,
        options: optionsMachine(machine),
      };
    } else if (convoyeur) {
      const role = convoyeur.role;
      const trieur = convoyeur.source && convoyeur.source.def && convoyeur.source.def.tri
        ? convoyeur.source : null;
      etat.panneau = {
        nom: role === 'triee' && trieur ? ITEMS[trieur.matiereTriee].nom
          : role === 'reste' ? 'le reste' : 'convoyeur',
        description: role === 'triee' ? 'emporte la matière que le trieur range'
          : role === 'reste' ? 'emporte tout ce que le trieur ne range pas'
            : MACHINES.convoyeur.description,
        icone: 'bulleConvoyeur',
        options: trieur ? optionsMachine(trieur) : [],
      };
    } else return;
    surgirPanneau();
  }

  // Toucher un gisement propose d'y bâtir : c'est la seule chose à y faire.
  function proposerExtracteur(c, g) {
    etat.panneau = {
      nom: ITEMS[g.item].nom,
      description: 'pose un extracteur pour le récolter',
      icone: 'bulleExtracteur',
      options: [{ icone: 'bulleExtracteur', action: () => batirExtracteur(c) }],
    };
    surgirPanneau();
  }

  // Toute machine se met en pause depuis son panneau : elle cesse de
  // travailler, et cesse donc de signaler un bouchon qu'on assume.
  function optionPause(machine) {
    return {
      icone: machine.pause ? 'bulleReprise' : 'bullePause',
      action: () => { machine.pause = !machine.pause; ouvrirPanneau(machine, null); },
    };
  }

  function optionsMachine(machine) {
    // Le téléporteur n'a pas de bouton vers sa carte : un appui court y mène
    // déjà. Deux chemins pour un même geste, c'est un de trop.
    //
    // Un trieur laisse choisir la matière qu'il range.
    if (machine.def.tri) {
      return machine.def.triables.map((item) => ({
        item,
        choisie: item === machine.matiereTriee,
        action: () => { machine.matiereTriee = item; ouvrirPanneau(machine, null); },
      })).concat(optionPause(machine));
    }
    return [optionPause(machine)];
  }

  function panneauTouche(p) {
    if (!etat.panneau) return false;
    for (let j = 0; j < etat.panneau.options.length; j++) {
      if (dansRect(rectOption(j), p.x, p.y)) { etat.panneau.options[j].action(); return true; }
    }
    if (dansRect(PANNEAU, p.x, p.y)) return true;
    etat.panneau = null;
    return false;
  }

  // Le menu pause arrête le jeu : c'est une dérogation assumée au temps réel,
  // et le seul endroit où le temps s'arrête.
  function ouvrirMenuPause() {
    etat.menuPause = 'menu';
    etat.panneau = null;
    fermerMenu();
    majMenuPause();
  }

  function majMenuPause() {
    const boutons = [
      { icone: 'menuReprise', nom: 'reprendre', action: () => { etat.menuPause = null; } },
      { icone: 'bonbon', nom: 'recettes', action: () => { etat.menuPause = 'recettes'; } },
      {
        icone: 'outilPause',
        nom: toutEnPause() ? 'tout relancer' : 'tout arrêter',
        action: () => {
          const pause = !toutEnPause();
          for (const m of monde.scene.machines) m.pause = pause;
          majMenuPause();
        },
      },
    ];
    etat.boutonsMenu = boutons.map((b) => ({ icone: b.icone, nom: b.nom }));
    actionsMenu = boutons.map((b) => b.action);
  }

  function toutEnPause() {
    return monde.scene.machines.length > 0 && monde.scene.machines.every((m) => m.pause);
  }

  // Le menu avale tout : rien du jeu ne se touche tant qu'il est ouvert.
  function menuPauseTouche(p) {
    if (!etat.menuPause) return false;
    if (etat.menuPause === 'recettes') { etat.menuPause = 'menu'; return true; }
    for (let j = 0; j < etat.boutonsMenu.length; j++) {
      if (dansRect(rectMenu(j), p.x, p.y)) { actionsMenu[j](); return true; }
    }
    return true;
  }

  function interfaceTouchee(p) {
    if (dansRect(BOUTON_PAUSE, p.x, p.y)) { ouvrirMenuPause(); return true; }
    // Un doigt sur la mini-carte y emmène la fenêtre : un geste, pas deux.
    if (dansRect(MINICARTE, p.x, p.y)) {
      const c = celluleMiniCarte(p);
      centrerCamera(c.cx, c.cy);
      return true;
    }
    if (etat.menu > 0 && etat.ancre) {
      for (let j = 0; j < etat.bulles.length; j++) {
        if (dansRect(rectBulle(etat.ancre, j, etat.menu), p.x, p.y)) { actionsBulles[j](); return true; }
      }
    }
    for (let i = 0; i < etat.boutons.length; i++) {
      if (!dansRect(rectBouton(i), p.x, p.y)) continue;
      etat.appuis.push(i);
      actionsBoutons[i]();
      return true;
    }
    if (etat.menuOuvert) { fermerMenu(); return true; }
    return false;
  }

  // --- tracé --------------------------------------------------------------

  function point(e) { return vue.versLogique(e.clientX, e.clientY); }

  // L'écran ne montre qu'un morceau du monde : toute cellule se demande à
  // travers la caméra, jamais directement.
  function cellule(p) {
    const m = versMonde(p);
    return celluleDepuisPoint(m.x, m.y);
  }

  function base() { return trace.reprise ? trace.reprise.chemin : []; }

  function derniere() {
    if (trace.chemin.length > 0) return trace.chemin[trace.chemin.length - 1];
    const posees = base();
    if (posees.length > 0) return posees[posees.length - 1];
    // Une branche part d'une cellule de convoyeur, qui n'est pas une machine :
    // c'est elle l'origine du chemin.
    return trace.origine || trace.source;
  }

  function dejaTracee(c) {
    return trace.chemin.some((x) => x.cx === c.cx && x.cy === c.cy)
      || base().some((x) => x.cx === c.cx && x.cy === c.cy);
  }

  function ajouter(c) {
    const avant = derniere();
    // Un tapis dont la source a été détruite n'a plus de cellule d'origine :
    // il n'y a alors rien à prolonger, et surtout rien à déréférencer.
    if (!avant) return;
    if (c.cx === avant.cx && c.cy === avant.cy) return;
    const avantAvant = trace.chemin.length >= 2 ? trace.chemin[trace.chemin.length - 2] : trace.source;
    if (avantAvant && c.cx === avantAvant.cx && c.cy === avantAvant.cy) {
      // Revenir sur ses pas défait aussi le raccord retenu : le bout du tracé
      // ne touche plus la cellule où l'on avait buté.
      trace.chemin.pop();
      trace.contact = null;
      return;
    }
    if (!adjacentes(avant, c) || dejaTracee(c)) return;
    if (!celluleLibre(scene(), c.cx, c.cy)) {
      // Buter sur un convoyeur, c'est vouloir s'y raccorder : on retient le
      // point de contact, le doigt n'a pas besoin de viser plus juste.
      const hote = convoyeurEn(scene(), c.cx, c.cy);
      if (hote && hote !== trace.reprise && hote !== trace.source) {
        trace.contact = { hote, cellule: c };
      }
      return;
    }
    trace.contact = null;
    trace.chemin.push(c);
  }

  // Le doigt va plus vite que les cellules : on comble en L pour que le chemin
  // reste continu.
  function relier(c) {
    for (let garde = 0; garde < 64; garde++) {
      const avant = derniere();
      if (!avant) return;
      if (avant.cx === c.cx && avant.cy === c.cy) return;
      const pas = avant.cx !== c.cx
        ? { cx: avant.cx + Math.sign(c.cx - avant.cx), cy: avant.cy }
        : { cx: avant.cx, cy: avant.cy + Math.sign(c.cy - avant.cy) };
      const longueur = trace.chemin.length;
      ajouter(pas);
      if (trace.chemin.length === longueur) return;
    }
  }

  function marquerConstruit(cellules) {
    for (const c of cellules) etat.effets.push({ cx: c.cx, cy: c.cy });
  }

  function marquerDetruit(cellules) {
    for (const c of cellules) etat.debris.push({ cx: c.cx, cy: c.cy });
  }

  // Pose un extracteur sur le gisement, et rend la main au convoyeur : on ne
  // reste jamais coincé dans un mode.
  function batirExtracteur(c) {
    const g = gisementEn(monde, c.cx, c.cy);
    if (!g || g.extracteur || !poserExtracteur(monde, c.cx, c.cy)) return false;
    marquerConstruit([c]);
    etat.constructible = 'convoyeur';
    etat.panneau = null;
    return true;
  }

  // Pose une machine sur une cellule libre de l'usine, puis rend la main au
  // convoyeur : on ne reste jamais coincé dans un mode.
  function batirMachine(c, type) {
    if (!celluleLibre(scene(), c.cx, c.cy)) return false;
    ajouterMachine(scene(), type, c.cx, c.cy, {});
    marquerConstruit([c]);
    etat.constructible = 'convoyeur';
    etat.panneau = null;
    return true;
  }

  function detruire(c) {
    const convoyeur = convoyeurEn(scene(), c.cx, c.cy);
    if (convoyeur) {
      couperConvoyeur(scene(), convoyeur, c.cx, c.cy);
      marquerDetruit([c]);
      return;
    }
    const machine = machineEn(scene(), c.cx, c.cy);
    // Seules les machines qu'on peut poser peuvent être retirées : le
    // téléporteur et la livraison restent en place quoi qu'il arrive.
    if (machine && MACHINES_CONSTRUCTIBLES.includes(machine.def.id)) {
      retirerMachine(scene(), machine);
      marquerDetruit([c]);
      return;
    }
    const g = gisementEn(monde, c.cx, c.cy);
    if (g && g.extracteur) { retirerExtracteur(monde, c.cx, c.cy); marquerDetruit([c]); }
  }

  // --- gestes -------------------------------------------------------------

  function relacher() {
    if (pointeur !== null && canvas.hasPointerCapture(pointeur)) canvas.releasePointerCapture(pointeur);
    pointeur = null;
    trace.actif = false;
    trace.chemin = [];
    trace.reprise = null;
    trace.branche = null;
    trace.origine = null;
    trace.contact = null;
    departCellule = null;
    departPoint = null;
    dernierPoint = null;
    clearTimeout(minuterie);
    minuterie = null;
  }

  function debut(e) {
    const p = point(e);
    e.preventDefault();
    appuiLongFait = false;
    if (menuPauseTouche(p)) { relacher(); return; }
    if (panneauTouche(p)) { relacher(); return; }
    if (interfaceTouchee(p)) { relacher(); return; }

    const c = cellule(p);
    if (!c) return;
    if (pointeur !== null) return;
    pointeur = e.pointerId;
    canvas.setPointerCapture(pointeur);
    departCellule = c;
    departPoint = p;
    dernierPoint = p;

    // L'appui long montre les informations sans rien annuler : si le doigt
    // repart, le panneau se referme et le tracé continue. Un enfant qui hésite
    // avant de tirer son convoyeur ne doit rien perdre.
    minuterie = setTimeout(() => {
      appuiLongFait = true;
      ouvrirPanneau(machineEn(scene(), c.cx, c.cy), convoyeurEn(scene(), c.cx, c.cy));
    }, APPUI_LONG);

    if (etat.outil === 'destruction') { detruire(c); return; }

    // Poser un extracteur, sur un gisement.
    if (etat.outil === 'construction' && etat.constructible === 'extracteur') {
      if (batirExtracteur(c)) return;
    }

    // Poser une machine, sur une cellule libre.
    if (etat.outil === 'construction') {
      const choisi = CONSTRUCTIBLES.find((x) => x.id === etat.constructible);
      if (choisi && choisi.machine && batirMachine(c, choisi.machine)) return;
    }

    const convoyeur = convoyeurEn(scene(), c.cx, c.cy);
    if (convoyeur) {
      const bout = convoyeur.chemin[convoyeur.chemin.length - 1];
      const auBout = bout.cx === c.cx && bout.cy === c.cy;
      // Au bout d'un tapis inachevé : on reprend le tracé là où il s'est
      // arrêté. Sur un tapis qui distribue déjà, ou en plein milieu : on en
      // fait partir une branche de plus.
      if (auBout && !convoyeur.cible && convoyeur.sorties.length === 0) {
        trace.actif = true;
        trace.source = convoyeur.source;
        trace.chemin = [];
        trace.reprise = convoyeur;
        trace.branche = null;
        // Le bout du tapis sert d'origine : sa source a pu être détruite, et
        // c'est de la cellule qu'on repart, pas de la machine.
        trace.origine = bout;
        return;
      }
      if (!auBout || convoyeur.sorties.length > 0) {
        trace.actif = true;
        trace.source = convoyeur;
        trace.chemin = [];
        trace.reprise = null;
        trace.branche = { tronc: convoyeur, cellule: c };
        trace.origine = c;
        return;
      }
      return;
    }

    const machine = machineEn(scene(), c.cx, c.cy);
    if (!machine || !aUneSortie(machine)) return;
    trace.actif = true;
    trace.source = machine;
    trace.chemin = [];
    trace.reprise = null;
    trace.branche = null;
    trace.origine = null;
    trace.contact = null;
  }

  function deplacement(e) {
    if (e.pointerId !== pointeur) return;
    e.preventDefault();
    const p = point(e);

    // Le moindre déplacement fait d'un appui un tracé : on annule l'attente,
    // et on referme le panneau s'il avait déjà eu le temps de sortir.
    if (departPoint && Math.hypot(p.x - departPoint.x, p.y - departPoint.y) > SEUIL_GLISSE) {
      clearTimeout(minuterie);
      minuterie = null;
      if (appuiLongFait) { etat.panneau = null; appuiLongFait = false; }
    }

    // La main : le monde suit le doigt, exactement, sans inertie.
    if (etat.outil === 'main') {
      if (dernierPoint) deplacerCamera(dernierPoint.x - p.x, dernierPoint.y - p.y);
      dernierPoint = p;
      return;
    }
    dernierPoint = p;

    // En tracé, arriver au bord fait défiler : un convoyeur peut traverser
    // deux écrans sans que le doigt se lève.
    if (trace.actif) defilementAuBord(p);

    const c = cellule(p);
    if (!c) return;
    if (etat.outil === 'destruction') { detruire(c); return; }
    if (trace.actif && !machineEn(scene(), c.cx, c.cy)) relier(c);
  }

  // Le doigt à moins d'une demi-cellule d'un bord pousse la fenêtre.
  const MARGE_BORD = CELLULE / 2;
  const PAS_BORD = 6; // unités logiques par déplacement de doigt

  function defilementAuBord(p) {
    const gauche = p.x - GRILLE_X;
    const droite = GRILLE_X + LARGEUR_VUE - p.x;
    const haut = p.y - GRILLE_Y;
    const bas = GRILLE_Y + HAUTEUR_VUE - p.y;
    let dx = 0;
    let dy = 0;
    if (gauche < MARGE_BORD) dx = -PAS_BORD;
    if (droite < MARGE_BORD) dx = PAS_BORD;
    if (haut < MARGE_BORD) dy = -PAS_BORD;
    if (bas < MARGE_BORD) dy = PAS_BORD;
    if (dx || dy) deplacerCamera(dx, dy);
  }

  // Un convoyeur lâché en cours de route reste construit : on ne recommence
  // jamais du début.
  function fin(e) {
    if (e.pointerId !== pointeur) return;
    e.preventDefault();
    clearTimeout(minuterie);
    minuterie = null;
    if (appuiLongFait) { relacher(); return; }

    if (trace.actif && trace.chemin.length > 0) {
      const c = cellule(point(e));
      const machine = c ? machineEn(scene(), c.cx, c.cy) : null;
      const cible = machine && machine !== trace.source && maxEntrees(machine) > 0
        && adjacentes(derniere(), machine)
        ? machine
        : null;
      // Lâché sur un convoyeur, ou venu buter dessus : on s'y raccorde, à
      // n'importe quel niveau.
      const surPlace = !cible && c ? convoyeurEn(scene(), c.cx, c.cy) : null;
      const raccord = surPlace && surPlace !== trace.reprise && surPlace !== trace.source
        && adjacentes(derniere(), c)
        ? { hote: surPlace, cellule: c }
        : trace.contact;
      etat.panneau = null;
      marquerConstruit(trace.chemin);
      let pose;
      if (trace.branche) {
        pose = brancherConvoyeur(scene(), trace.branche.tronc, trace.branche.cellule, trace.chemin, cible);
      } else if (trace.reprise) {
        prolongerConvoyeur(scene(), trace.reprise, trace.chemin, cible);
        pose = trace.reprise;
      } else {
        pose = poserConvoyeur(scene(), trace.chemin, trace.source, cible);
      }
      // Le tapis posé vient buter sur un autre : il s'y déverse.
      if (raccord && !cible) raccorderA(scene(), pose, raccord.hote, raccord.cellule);
      relacher();
      return;
    }

    if (departCellule) actionPrincipale(departCellule);
    relacher();
  }

  // Appui court : ce que l'élément fait de plus évident.
  function actionPrincipale(c) {
    const machine = machineEn(scene(), c.cx, c.cy);
    if (!machine) {
      // Un gisement nu propose d'y bâtir : c'est la seule chose à y faire.
      const g = gisementEn(monde, c.cx, c.cy);
      if (g && !g.extracteur) { proposerExtracteur(c, g); return; }
      // Un appui court sur une branche de trieur ouvre aussi son filtre.
      const convoyeur = convoyeurEn(scene(), c.cx, c.cy);
      if (convoyeur && convoyeur.role) ouvrirPanneau(null, convoyeur);
      return;
    }
    // Le trieur : un appui court ouvre le choix de la matière rangée.
    if (machine.def.tri) ouvrirPanneau(machine, null);
  }

  centrerCamera(DEPART.regard.cx, DEPART.regard.cy);
  majBoutons();
  majMenuPause();
  canvas.addEventListener('pointerdown', debut);
  canvas.addEventListener('pointermove', deplacement);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  canvas.addEventListener('lostpointercapture', relacher);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return etat;
}
