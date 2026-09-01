// Gestes unifiés (Pointer Events) : la souris produit exactement les mêmes
// gestes que le doigt. Un glissé d'une machine à l'autre crée le chemin entier.
//
// Appui court : la fonction principale de l'élément touché. Appui long : ses
// informations. Ce module tient aussi l'état de l'interface ; le rendu le lit,
// il ne le modifie jamais.

import {
  CELLULE, PANNEAU, rectBouton, rectBulle, rectOption, dansRect,
} from '../design.js';
import { OUTILS, CONSTRUCTIBLES, MACHINES_CONSTRUCTIBLES } from '../data/outils.js';
import { ITEMS } from '../data/items.js';
import { MACHINES } from '../data/machines.js';
import { ressort } from '../anim.js';
import { celluleDepuisPoint, adjacentes, coinCellule } from '../sim/grid.js';
import {
  machineEn, convoyeurEn, celluleLibre, poserConvoyeur, couperConvoyeur,
  prolongerConvoyeur, brancherConvoyeur, raccorderA, ajouterMachine, retirerMachine,
} from '../sim/scene.js';
import { sceneDe, gisementSurCarte } from '../sim/world.js';
import { poserExtracteur, retirerExtracteur } from '../sim/carte.js';
import { aUneSortie, attendus, maxEntrees } from '../sim/machine.js';

const APPUI_LONG = 0.42 * 1000; // millisecondes
const SEUIL_GLISSE = 6;         // unités logiques au-delà desquelles c'est un tracé

export function brancherPointeur(canvas, vue, monde) {
  const etat = {
    vue: -1,                     // -1 = l'usine, sinon l'index d'une carte
    outil: 'construction',
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
  let animMenu = null;
  let animPanneau = null;

  const scene = () => sceneDe(monde, etat.vue);
  const carte = () => (etat.vue < 0 ? null : monde.cartes[etat.vue]);

  function viser(cle, vers, courante) {
    if (courante) courante.stop();
    return ressort(etat[cle], vers, (v) => { etat[cle] = v; });
  }

  // --- interface ----------------------------------------------------------

  function majBoutons() {
    const outils = OUTILS.map((o) => ({
      icone: o.icone,
      actif: o.id === etat.outil,
      action: () => {
        etat.outil = o.id;
        if (o.id === 'construction') {
          // Le convoyeur est ce qu'on pose le plus souvent : il est prêt.
          etat.constructible = 'convoyeur';
          ouvrirMenu(bullesConstructibles(), rectBouton(etat.vue < 0 ? 0 : 1));
        } else fermerMenu();
        majBoutons();
      },
    }));
    if (etat.vue >= 0) {
      outils.unshift({
        icone: 'outilRetour',
        actif: false,
        action: () => quitterCarte(),
      });
    }
    etat.boutons = outils.map((o) => ({ icone: o.icone, actif: o.actif }));
    actionsBoutons = outils.map((o) => o.action);
  }

  function ouvrirMenu(contenu, ancre) {
    etat.menuOuvert = true;
    etat.ancre = ancre;
    etat.bulles = contenu.map((c) => ({ icone: c.icone, grise: c.grise, choisie: c.choisie }));
    actionsBulles = contenu.map((c) => c.action);
    animMenu = viser('menu', 1, animMenu);
  }

  function fermerMenu() {
    if (!etat.menuOuvert) return;
    etat.menuOuvert = false;
    animMenu = viser('menu', 0, animMenu);
  }

  // Le menu montre tous les éléments constructibles. Ceux qui ne se posent pas
  // sur l'écran courant sont grisés plutôt que cachés : l'enfant voit ce qui
  // existe, et où il faut aller pour s'en servir.
  function bullesConstructibles() {
    const ici = etat.vue < 0 ? 'usine' : 'carte';
    return CONSTRUCTIBLES.map((c) => ({
      icone: c.icone,
      grise: c.ou !== 'partout' && c.ou !== ici,
      choisie: c.id === etat.constructible,
      action: () => {
        if (c.ou !== 'partout' && c.ou !== ici) return;
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

  function optionsMachine(machine) {
    // Un téléporteur mène à sa carte.
    if (machine.carte && machine.def.source) {
      return [{
        icone: 'bulleCarte_' + machine.carte.items[0],
        action: () => allerCarte(monde.cartes.indexOf(machine.carte)),
      }];
    }
    // Un trieur laisse choisir la matière qu'il range.
    if (machine.def.tri) {
      return machine.def.triables.map((item) => ({
        item,
        choisie: item === machine.matiereTriee,
        action: () => { machine.matiereTriee = item; ouvrirPanneau(machine, null); },
      }));
    }
    return [];
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

  function interfaceTouchee(p) {
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

  function allerCarte(i) {
    etat.vue = i;
    etat.panneau = null;
    fermerMenu();
    majBoutons();
  }

  function quitterCarte() {
    etat.vue = -1;
    etat.panneau = null;
    fermerMenu();
    majBoutons();
  }

  // --- tracé --------------------------------------------------------------

  function point(e) { return vue.versLogique(e.clientX, e.clientY); }

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
    if (c.cx === avant.cx && c.cy === avant.cy) return;
    const avantAvant = trace.chemin.length >= 2 ? trace.chemin[trace.chemin.length - 2] : trace.source;
    if (c.cx === avantAvant.cx && c.cy === avantAvant.cy) { trace.chemin.pop(); return; }
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
    const g = gisementSurCarte(monde, etat.vue, c.cx, c.cy);
    if (!g || g.extracteur || !poserExtracteur(carte(), c.cx, c.cy)) return false;
    marquerConstruit([c]);
    etat.constructible = 'convoyeur';
    etat.panneau = null;
    return true;
  }

  // Pose une machine sur une cellule libre de l'usine, puis rend la main au
  // convoyeur : on ne reste jamais coincé dans un mode.
  function batirMachine(c, type) {
    if (etat.vue >= 0 || !celluleLibre(scene(), c.cx, c.cy)) return false;
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
    const g = carte() && gisementSurCarte(monde, etat.vue, c.cx, c.cy);
    if (g && g.extracteur) { retirerExtracteur(carte(), c.cx, c.cy); marquerDetruit([c]); }
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
    clearTimeout(minuterie);
    minuterie = null;
  }

  function debut(e) {
    const p = point(e);
    e.preventDefault();
    appuiLongFait = false;
    if (panneauTouche(p)) { relacher(); return; }
    if (interfaceTouchee(p)) { relacher(); return; }

    const c = celluleDepuisPoint(p.x, p.y);
    if (!c) return;
    if (pointeur !== null) return;
    pointeur = e.pointerId;
    canvas.setPointerCapture(pointeur);
    departCellule = c;
    departPoint = p;

    // L'appui long montre les informations sans rien annuler : si le doigt
    // repart, le panneau se referme et le tracé continue. Un enfant qui hésite
    // avant de tirer son convoyeur ne doit rien perdre.
    minuterie = setTimeout(() => {
      appuiLongFait = true;
      ouvrirPanneau(machineEn(scene(), c.cx, c.cy), convoyeurEn(scene(), c.cx, c.cy));
    }, APPUI_LONG);

    if (etat.outil === 'destruction') { detruire(c); return; }

    // Poser un extracteur, sur une carte, sur un gisement.
    if (etat.vue >= 0 && etat.outil === 'construction' && etat.constructible === 'extracteur') {
      if (batirExtracteur(c)) return;
    }

    // Poser une machine, dans l'usine, sur une cellule libre.
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
        trace.origine = null;
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
    const c = celluleDepuisPoint(point(e).x, point(e).y);
    if (!c) return;
    // Le moindre déplacement fait d'un appui un tracé : on annule l'attente,
    // et on referme le panneau s'il avait déjà eu le temps de sortir.
    const p = point(e);
    if (departPoint && Math.hypot(p.x - departPoint.x, p.y - departPoint.y) > SEUIL_GLISSE) {
      clearTimeout(minuterie);
      minuterie = null;
      if (appuiLongFait) { etat.panneau = null; appuiLongFait = false; }
    }
    if (etat.outil === 'destruction') { detruire(c); return; }
    if (trace.actif && !machineEn(scene(), c.cx, c.cy)) relier(c);
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
      const c = celluleDepuisPoint(point(e).x, point(e).y);
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
    if (etat.vue >= 0) {
      const carteCourante = carte();
      if (c.cx === carteCourante.teleporteur.cx && c.cy === carteCourante.teleporteur.cy) {
        quitterCarte();
        return;
      }
      const g = gisementSurCarte(monde, etat.vue, c.cx, c.cy);
      if (g && !g.extracteur) { proposerExtracteur(c, g); return; }
      return;
    }
    const machine = machineEn(monde.usine, c.cx, c.cy);
    if (!machine) {
      // Un appui court sur une branche de trieur ouvre aussi son filtre.
      const convoyeur = convoyeurEn(monde.usine, c.cx, c.cy);
      if (convoyeur && convoyeur.role) ouvrirPanneau(null, convoyeur);
      return;
    }
    if (machine.carte && machine.def.source) {
      allerCarte(monde.cartes.indexOf(machine.carte));
      return;
    }
    // Le trieur : un appui court ouvre le choix de la matière rangée.
    if (machine.def.tri) ouvrirPanneau(machine, null);
  }

  majBoutons();
  canvas.addEventListener('pointerdown', debut);
  canvas.addEventListener('pointermove', deplacement);
  canvas.addEventListener('pointerup', fin);
  canvas.addEventListener('pointercancel', fin);
  canvas.addEventListener('lostpointercapture', relacher);
  canvas.addEventListener('contextmenu', (e) => e.preventDefault());

  return etat;
}
