// La sauvegarde de la partie en cours.
//
// Deux structures distinctes, sauvegardées séparément : celle-ci et l'état
// permanent (save/meta.js). C'est une décision du premier jour, et elle tient
// même tant que le permanent est vide — les mêler une fois, c'est ne plus
// jamais pouvoir les séparer.
//
// **On sauvegarde les files compressées telles quelles.** Un convoyeur ne
// stocke pas une position par item mais un écart par item ; c'est une
// contrainte de performance, et la sauvegarde ne la contourne pas : elle
// écrit les écarts, elle ne les recalcule pas. Rien ici ne reconstruit une
// scène en rejouant des gestes — un tapis relu est le tapis d'avant, avec sa
// file au pixel près, pas un tapis retracé qui lui ressemble.
//
// Le module se coupe en deux : la conversion, qui est du JS pur et que les
// outils éprouvent hors du navigateur, et le rangement, qui touche au
// stockage du navigateur et n'est appelé que par le jeu.

import { VERSION } from '../data/version.js';
import { creerScene } from '../sim/scene.js';
import { creerConvoyeur, majGeometrie } from '../sim/belt.js';
import { creerMachine, choisirRecette } from '../sim/machine.js';
import { poser, dansGrille } from '../sim/grid.js';
import { MACHINES } from '../data/machines.js';

// Le numéro de format de la sauvegarde. Il monte quand ce fichier écrit
// autrement ; une sauvegarde qui n'en porte pas le numéro courant est
// illisible, et une sauvegarde illisible est écartée — mise de côté sous une
// clé à part, jamais écrasée tout de suite, et annoncée par le bandeau.
//
// 2 : le monde se lit en étages. Le sol n'appartient plus à la partie — le
// biome d'une cellule est donné par sa rangée —, les régions ont donc disparu
// de ce qu'on écrit. Les parties du format 1 se jouaient sur un autre monde :
// elles ne sont pas migrables, et elles sont écartées.
export const FORMAT = 2;

const CLE = 'factokid.partie';
const CLE_ECARTEE = 'factokid.partie.ecartee';

// --- conversion -----------------------------------------------------------

const cellule = (c) => [c.cx, c.cy];
const depuisCellule = (t) => ({ cx: t[0], cy: t[1] });

// Ce qu'une machine porte et que la table ne redonne pas. Tout le reste — sa
// définition, sa cadence — se relit dans data/machines.js à partir du type.
function serialiserMachine(machine, indice) {
  return {
    type: machine.type,
    cx: machine.cx,
    cy: machine.cy,
    item: machine.item ?? null,
    recette: machine.recette ? machine.recette.id : null,
    stocks: { ...machine.stocks },
    file: [...machine.file],
    matiereTriee: machine.matiereTriee ?? null,
    horloge: machine.horloge,
    horlogeMine: machine.horlogeMine ?? null,
    // Un extracteur qui creuse fume : c'est le rendu qui le lit, et il le lit
    // avant le premier tick d'une partie relue.
    creuse: machine.creuse ?? null,
    tour: machine.tour,
    produits: machine.produits,
    consommes: machine.consommes,
    verse: machine.verse,
    recus: { ...machine.recus },
    sorti: machine.sorti ?? null,
    bloquee: machine.bloquee,
    bloqueeDepuis: machine.bloqueeDepuis,
    pause: machine.pause,
    entrees: machine.entrees.map(indice),
    sorties: machine.sorties.map(indice),
  };
}

// Un convoyeur : son chemin, sa file d'écarts, et à qui il tient. Les liens
// sont des indices — une scène relue doit retrouver le même graphe, pas des
// objets qui se ressemblent.
function serialiserConvoyeur(convoyeur, indiceM, indiceC) {
  return {
    chemin: convoyeur.chemin.map(cellule),
    items: convoyeur.items.map((it) => ({
      type: it.type,
      ecart: it.ecart,
      entree: it.entree ? cellule(it.entree) : null,
    })),
    queue: convoyeur.queue,
    tour: convoyeur.tour,
    role: convoyeur.role ?? null,
    bloque: convoyeur.bloque,
    source: convoyeur.source ? reference(convoyeur.source, indiceM, indiceC) : null,
    sources: convoyeur.sources.map((s) => reference(s, indiceM, indiceC)),
    cible: convoyeur.cible ? indiceM(convoyeur.cible) : null,
    sorties: convoyeur.sorties.map(indiceC),
  };
}

// Ce qui alimente un tapis est soit une machine, soit un autre tapis : la
// référence dit lequel des deux.
function reference(x, indiceM, indiceC) {
  const m = indiceM(x);
  return m === null ? { c: indiceC(x) } : { m };
}

function serialiserScene(scene) {
  const rangM = new Map(scene.machines.map((m, i) => [m, i]));
  const rangC = new Map(scene.convoyeurs.map((c, i) => [c, i]));
  const indiceM = (x) => (rangM.has(x) ? rangM.get(x) : null);
  const indiceC = (x) => (rangC.has(x) ? rangC.get(x) : null);
  return {
    machines: scene.machines.map((m) => serialiserMachine(m, indiceC)),
    convoyeurs: scene.convoyeurs.map((c) => serialiserConvoyeur(c, indiceM, indiceC)),
  };
}

// La partie entière : le monde, ce qu'on regarde, et où en est le premier
// contact. La carte n'est pas rejouée depuis sa graine — ses gisements sont
// écrits tels quels, pour qu'une partie survive au jour où le tirage changera.
export function serialiserPartie({ monde, camera, tutoriel }) {
  return {
    format: FORMAT,
    version: VERSION,
    quand: Date.now(),
    monde: {
      graine: monde.graine,
      caisse: monde.caisse,
      decouvertes: { ...monde.decouvertes },
      gisements: monde.gisements.map((g) => ({
        cx: g.cx, cy: g.cy, item: g.item, present: g.present, horloge: g.horloge,
      })),
      scene: serialiserScene(monde.scene),
    },
    camera: { x: camera.x, y: camera.y, niveau: camera.niveau },
    tutoriel: tutoriel
      ? { etape: tutoriel.etape, age: tutoriel.age, fini: tutoriel.fini, salut: tutoriel.salut }
      : null,
  };
}

// Ce qui rend une sauvegarde illisible. On ne devine pas : au premier doute,
// on refuse tout le fichier plutôt que d'ouvrir une partie à moitié vraie.
function exiger(condition, quoi) {
  if (!condition) throw new Error('sauvegarde illisible : ' + quoi);
}

function relireScene(brut) {
  const scene = creerScene();

  for (const m of brut.machines) {
    exiger(MACHINES[m.type], 'machine inconnue ' + m.type);
    exiger(dansGrille(m.cx, m.cy), 'machine hors de la grille');
    const machine = creerMachine(m.type, m.cx, m.cy, { item: m.item ?? undefined });
    if (m.recette) choisirRecette(machine, m.recette);
    machine.stocks = { ...m.stocks };
    machine.file = [...m.file];
    machine.matiereTriee = m.matiereTriee;
    machine.horloge = m.horloge;
    if (m.horlogeMine !== null) machine.horlogeMine = m.horlogeMine;
    if (m.creuse !== null) machine.creuse = m.creuse;
    machine.tour = m.tour;
    machine.produits = m.produits;
    machine.consommes = m.consommes;
    machine.verse = m.verse;
    machine.recus = { ...m.recus };
    machine.sorti = m.sorti;
    machine.bloquee = m.bloquee;
    machine.bloqueeDepuis = m.bloqueeDepuis;
    machine.pause = m.pause;
    scene.machines.push(machine);
    poser(scene.grille, m.cx, m.cy, { genre: 'machine', machine });
  }

  // Les tapis d'abord, sans leurs liens : un lien ne peut se nouer qu'une fois
  // les deux bouts posés.
  for (const c of brut.convoyeurs) {
    exiger(Array.isArray(c.chemin) && c.chemin.length > 0, 'tapis sans chemin');
    const chemin = c.chemin.map(depuisCellule);
    for (const p of chemin) exiger(dansGrille(p.cx, p.cy), 'tapis hors de la grille');
    const convoyeur = creerConvoyeur(chemin, null, null);
    scene.convoyeurs.push(convoyeur);
    for (const p of chemin) poser(scene.grille, p.cx, p.cy, { genre: 'convoyeur', convoyeur });
  }

  const machineDe = (i) => { exiger(scene.machines[i], 'machine absente'); return scene.machines[i]; };
  const convoyeurDe = (i) => { exiger(scene.convoyeurs[i], 'tapis absent'); return scene.convoyeurs[i]; };
  const objetDe = (r) => (r.m === undefined ? convoyeurDe(r.c) : machineDe(r.m));

  brut.machines.forEach((m, i) => {
    scene.machines[i].entrees = m.entrees.map(convoyeurDe);
    scene.machines[i].sorties = m.sorties.map(convoyeurDe);
  });

  brut.convoyeurs.forEach((c, i) => {
    const convoyeur = scene.convoyeurs[i];
    convoyeur.source = c.source ? objetDe(c.source) : null;
    convoyeur.sources = c.sources.map(objetDe);
    convoyeur.cible = c.cible === null ? null : machineDe(c.cible);
    convoyeur.sorties = c.sorties.map(convoyeurDe);
    convoyeur.role = c.role;
    convoyeur.tour = c.tour;
    convoyeur.bloque = c.bloque;
    // La file compressée, telle qu'elle était : des écarts, pas des positions.
    convoyeur.items = c.items.map((it) => ({
      type: it.type,
      ecart: it.ecart,
      entree: it.entree ? depuisCellule(it.entree) : null,
    }));
    convoyeur.queue = c.queue;
  });

  // La géométrie se recalcule en dernier : elle dépend des sources et des
  // branches, qui n'existaient pas encore quand les tapis ont été posés.
  for (const convoyeur of scene.convoyeurs) majGeometrie(convoyeur);
  return scene;
}

// Rend la partie écrite, ou lève. Ce qui lève est illisible, et c'est tout ce
// que l'appelant a besoin de savoir.
export function deserialiserPartie(brut) {
  exiger(brut && typeof brut === 'object', 'ce n’est pas une partie');
  exiger(brut.format === FORMAT, 'format ' + brut.format + ', attendu ' + FORMAT);
  exiger(brut.monde && brut.monde.scene, 'monde absent');
  const m = brut.monde;
  exiger(Array.isArray(m.gisements) && m.gisements.length > 0, 'carte sans gisements');
  exiger(Array.isArray(m.scene.machines) && Array.isArray(m.scene.convoyeurs), 'scène absente');

  const monde = {
    graine: m.graine,
    scene: relireScene(m.scene),
    decouvertes: { ...m.decouvertes },
    caisse: m.caisse,
    gisements: m.gisements.map((g) => ({
      cx: g.cx, cy: g.cy, item: g.item, present: g.present, horloge: g.horloge, extracteur: null,
    })),
  };
  exiger(Number.isFinite(monde.caisse), 'caisse absente');

  // Un gisement retrouve son extracteur par sa case : c'est la machine posée
  // dessus, et il n'y en a jamais deux.
  for (const g of monde.gisements) {
    const dessus = monde.scene.machines.find((x) => x.def.mine && x.cx === g.cx && x.cy === g.cy);
    if (dessus) g.extracteur = dessus;
  }

  const camera = brut.camera || { x: 0, y: 0, niveau: 0 };
  exiger(Number.isFinite(camera.x) && Number.isFinite(camera.y), 'regard absent');
  return { monde, camera, tutoriel: brut.tutoriel ? { ...brut.tutoriel } : null };
}

// --- rangement ------------------------------------------------------------
//
// Le stockage peut être refusé — navigation privée, réglage du navigateur, ou
// simplement plein. Rien ici n'est essentiel au fait de jouer : on se passe de
// mémoire plutôt que d'échouer.

function texte(cle) {
  try { return localStorage.getItem(cle); } catch { return null; }
}

export function ecrirePartie(partie) {
  try {
    localStorage.setItem(CLE, JSON.stringify(serialiserPartie(partie)));
    return true;
  } catch { return false; }
}

export function effacerPartie() {
  try { localStorage.removeItem(CLE); } catch { /* tant pis */ }
}

// Met de côté une sauvegarde qu'on ne sait pas relire, au lieu de l'écraser.
// Elle ne sert plus au jeu, mais elle reste là pour l'adulte qui rapporte le
// problème — et la partie suivante ne l'emportera pas avec elle.
function ecarter(brut) {
  try {
    localStorage.setItem(CLE_ECARTEE, brut);
    localStorage.removeItem(CLE);
  } catch { /* tant pis */ }
}

// Ce qui attend au lancement : rien, une partie, ou une sauvegarde illisible.
// Trois réponses et pas deux — une partie illisible n'est pas une absence de
// partie, et le bandeau le dit.
export function lirePartie() {
  const brut = texte(CLE);
  if (!brut) return { etat: 'vide' };
  try {
    return { etat: 'lue', partie: deserialiserPartie(JSON.parse(brut)) };
  } catch (e) {
    ecarter(brut);
    return { etat: 'illisible', pourquoi: String(e.message || e) };
  }
}
