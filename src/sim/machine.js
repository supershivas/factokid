// Machines : production, consommation, stocks. Ne dessine rien.
//
// Quatre rôles, tous décrits par une entrée de data/machines.js :
//   `mine`    — l'extracteur : se remplit du gisement qu'il occupe ;
//   `tri`     — le trieur : reçoit mélangé, range, une sortie par matière ;
//   `recette` — l'assembleur : plusieurs ingrédients, un produit ;
//   `entree`  — la livraison : consomme et fait disparaître.

import { MACHINES, TICKS_PAR_SECONDE } from '../data/machines.js';
import { RECETTES } from '../data/recipes.js';
import { pousser, peutAccepter } from './belt.js';

// `item` dit la matière du gisement qu'un extracteur occupe : c'est ce qu'il
// stocke.
export function creerMachine(type, cx, cy, { item } = {}) {
  const def = MACHINES[type];
  const recette = def.recette ? RECETTES[def.recette] : null;
  const ticks = recette ? recette.ticksParItem : def.ticksParItem;
  const machine = {
    type,
    def,
    recette,
    cx,
    cy,
    periode: ticks ? ticks / TICKS_PAR_SECONDE : 0,
    horloge: 0,
    item,           // pour une mine : la matière du gisement occupé
    stocks: {},
    file: [],       // pour un trieur : ce qui attend d'être rangé, mélangé
    matiereTriee: def.triDefaut || null,
    sorties: [],   // convoyeurs qui partent de la machine
    entrees: [],   // convoyeurs qui arrivent sur la machine
    tour: 0,       // pour verser à tour de rôle
    produits: 0,
    consommes: 0,
    bloquee: false,
    bloqueeDepuis: 0,
    pause: false,   // une machine en pause ne travaille plus, et ne crie plus
  };
  for (const { item } of jauges(machine)) machine.stocks[item] = 0;
  return machine;
}

// Ce que la machine accepte depuis un tapis, et jusqu'à combien.
export function attendus(machine) {
  const { def, recette } = machine;
  if (recette) return Object.keys(recette.entrees).map((item) => ({ item, capacite: def.capacite }));
  if (def.tri) return []; // un trieur prend tout : voir accepte()
  if (def.entree) return [{ item: def.entree, capacite: def.capacite }];
  return [];
}

// Les quatre côtés d'une cellule : c'est tout ce qu'une machine peut relier.
const COTES = 4;

// Combien de convoyeurs peuvent arriver sur cette machine. Ce n'était pas la
// bonne question : c'était le nombre d'ingrédients de sa recette, et une
// scierie ne pouvait donc être nourrie que par un seul tapis. Deux arbres
// éloignés, et le second détruisait le premier.
//
// Le nombre juste, c'est la géométrie qui le donne : une machine occupe une
// cellule, accepte un convoyeur par côté, et n'a pas d'orientation. Quatre
// côtés, moins ce qui en sort — trois entrées pour une usine de
// transformation, deux pour un trieur qui a deux sorties. Rien n'est choisi
// ici, tout est déduit.
//
// Ce qu'une machine attend reste ce que dit sa recette : trois tapis de bois
// nourrissent la même scierie, et une confiserie prend ses trois matières par
// trois côtés comme avant.
export function maxEntrees(machine) {
  // Ce qui n'accepte rien — un extracteur — n'a pas d'entrée du tout.
  if (!machine.def.tri && attendus(machine).length === 0) return 0;
  return COTES - maxSorties(machine);
}

// Ce que la machine stocke, donc ce que le rendu doit montrer.
export function jauges(machine) {
  if (machine.def.tri) return [];
  if (machine.def.mine) return [{ item: machine.item, capacite: machine.def.capacite }];
  return attendus(machine);
}

export function aUneSortie(machine) {
  return Boolean(machine.def.tri || machine.def.mine || machine.recette);
}

// Combien de convoyeurs peuvent partir de cette machine.
export function maxSorties(machine) {
  return machine.def.tri ? 2 : 1; // la matière triée, et le reste
}

export function accepte(machine, type) {
  // Un trieur prend tout ce qui se présente, dans la limite de sa file.
  if (machine.def.tri) return machine.file.length < machine.def.capacite;
  const place = attendus(machine).find((e) => e.item === type);
  return Boolean(place) && machine.stocks[type] < place.capacite;
}

export function deposer(machine, type) {
  if (!accepte(machine, type)) return false;
  if (machine.def.tri) { machine.file.push(type); return true; }
  machine.stocks[type]++;
  return true;
}

// Dépôt venu du sol : ignore les règles de tapis, respecte la capacité.
export function deposerBrut(machine, type) {
  if (!(type in machine.stocks)) return false;
  if (machine.stocks[type] >= machine.def.capacite) return false;
  machine.stocks[type]++;
  return true;
}

function verser(machine, item) {
  for (const convoyeur of machine.sorties) {
    if (convoyeur.matiere && convoyeur.matiere !== item) continue;
    if (!peutAccepter(convoyeur)) continue;
    pousser(convoyeur, item);
    return true;
  }
  return false;
}

// Verse à tour de rôle, pour qu'une matière n'affame pas les autres.
function verserAuTour(machine, dt) {
  machine.horloge += dt;
  const items = Object.keys(machine.stocks);
  const pret = machine.horloge >= machine.periode;
  const enAttente = items.some((i) => machine.stocks[i] > 0);
  machine.bloquee = pret && enAttente && !items.some((i) => machine.stocks[i] > 0 && peutVerser(machine, i));
  if (!pret) return;
  if (!enAttente) { machine.horloge = machine.periode; return; }
  for (let n = 0; n < items.length; n++) {
    const item = items[(machine.tour + n) % items.length];
    if (machine.stocks[item] <= 0) continue;
    if (!verser(machine, item)) continue;
    machine.stocks[item]--;
    machine.tour = (machine.tour + n + 1) % items.length;
    machine.produits++;
    machine.horloge -= machine.periode;
    return;
  }
  machine.horloge = machine.periode; // rien n'a pu sortir
}

function peutVerser(machine, item) {
  return machine.sorties.some((c) => (!c.matiere || c.matiere === item) && peutAccepter(c));
}

// Le temps passé bloqué, pour ne signaler que les vrais bouchons.
function majBlocage(machine, dt) {
  machine.bloqueeDepuis = machine.bloquee ? machine.bloqueeDepuis + dt : 0;
}

// Un trieur range une seule matière : celle que le joueur a choisie part par
// la branche « triée », tout le reste par l'autre. Le premier convoyeur tracé
// prend la matière choisie, le second ramasse le reste.
function majTrieur(machine, dt) {
  machine.horloge += dt;
  const pret = machine.horloge >= machine.periode;
  const item = machine.file[0];
  if (item === undefined) { machine.bloquee = false; machine.horloge = Math.min(machine.horloge, machine.periode); return; }
  const role = item === machine.matiereTriee ? 'triee' : 'reste';
  const sortie = machine.sorties.find((c) => c.role === role);
  const libre = sortie && peutAccepter(sortie);
  machine.bloquee = pret && !libre;
  if (!pret) return;
  if (!libre) { machine.horloge = machine.periode; return; }
  pousser(sortie, machine.file.shift());
  machine.produits++;
  machine.horloge -= machine.periode;
}

export function majMachine(machine, dt) {
  // Une machine en pause ne produit plus, ne consomme plus, et surtout ne se
  // signale plus : c'est à ça qu'elle sert, faire taire un bouchon qu'on
  // assume plutôt que de démonter la chaîne.
  if (machine.pause) {
    machine.bloquee = false;
    machine.bloqueeDepuis = 0;
    return;
  }
  majBlocage(machine, dt);
  if (machine.def.tri) { majTrieur(machine, dt); return; }
  if (machine.def.mine) { verserAuTour(machine, dt); return; }

  if (machine.recette) {
    const complet = Object.entries(machine.recette.entrees)
      .every(([item, n]) => machine.stocks[item] >= n);
    if (!complet) {
      machine.bloquee = false;
      machine.horloge = Math.min(machine.horloge, machine.periode);
      return;
    }
    machine.horloge += dt;
    const pret = machine.horloge >= machine.periode;
    const libre = machine.sorties.length > 0 && peutAccepter(machine.sorties[0]);
    machine.bloquee = pret && !libre;
    if (!pret || machine.bloquee) {
      if (pret) machine.horloge = machine.periode;
      return;
    }
    for (const [item, n] of Object.entries(machine.recette.entrees)) machine.stocks[item] -= n;
    pousser(machine.sorties[0], machine.recette.sortie);
    machine.produits++;
    machine.consommes++;
    machine.horloge -= machine.periode;
    return;
  }

  if (machine.def.entree) {
    const stock = machine.stocks[machine.def.entree];
    machine.bloquee = stock >= machine.def.capacite;
    if (stock === 0) {
      machine.horloge = Math.min(machine.horloge, machine.periode);
      return;
    }
    machine.horloge += dt;
    if (machine.horloge < machine.periode) return;
    machine.stocks[machine.def.entree]--;
    machine.consommes++;
    machine.horloge -= machine.periode;
  }
}
