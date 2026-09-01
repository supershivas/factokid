// Machines : production, consommation, stocks. Ne dessine rien.
//
// Quatre rôles, tous décrits par une entrée de data/machines.js :
//   `source`  — le téléporteur : rempli par les cartes, verse sur un tapis ;
//   `tri`     — le trieur : reçoit mélangé, range, une sortie par matière ;
//   `recette` — l'assembleur : plusieurs ingrédients, un produit ;
//   `entree`  — la livraison : consomme et fait disparaître.

import { MACHINES, TICKS_PAR_SECONDE } from '../data/machines.js';
import { RECETTES } from '../data/recipes.js';
import { pousser, peutAccepter } from './belt.js';

// `carte` n'est donné que pour un téléporteur : c'est elle qui dit quelles
// matières il stocke.
export function creerMachine(type, cx, cy, carte) {
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
    carte,          // pour un téléporteur : la carte dont il est la sortie
    stocks: {},
    sorties: [],   // convoyeurs qui partent de la machine
    entrees: [],   // convoyeurs qui arrivent sur la machine
    tour: 0,       // pour verser à tour de rôle
    produits: 0,
    consommes: 0,
    bloquee: false,
  };
  for (const { item } of jauges(machine)) machine.stocks[item] = 0;
  return machine;
}

// Ce que la machine accepte depuis un tapis, et jusqu'à combien.
export function attendus(machine) {
  const { def, recette } = machine;
  if (recette) return Object.keys(recette.entrees).map((item) => ({ item, capacite: def.capacite }));
  if (def.tri) return def.tri.map((item) => ({ item, capacite: def.capacite }));
  if (def.entree) return [{ item: def.entree, capacite: def.capacite }];
  return [];
}

// Ce que la machine stocke, donc ce que le rendu doit montrer. Le téléporteur
// stocke sans rien accepter d'un tapis : il est rempli par les cartes.
export function jauges(machine) {
  if (machine.def.source) {
    return machine.carte.items.map((item) => ({ item, capacite: machine.def.capacite }));
  }
  return attendus(machine);
}

export function aUneSortie(machine) {
  return Boolean(machine.def.source || machine.def.tri || machine.recette);
}

// Combien de convoyeurs peuvent partir de cette machine.
export function maxSorties(machine) {
  return machine.def.tri ? machine.def.tri.length : 1;
}

export function accepte(machine, type) {
  const place = attendus(machine).find((e) => e.item === type);
  return Boolean(place) && machine.stocks[type] < place.capacite;
}

export function deposer(machine, type) {
  if (!accepte(machine, type)) return false;
  machine.stocks[type]++;
  return true;
}

// Dépôt venu d'une carte : ignore les règles de tapis, respecte la capacité.
export function deposerDepuisCarte(machine, type) {
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

export function majMachine(machine, dt) {
  if (machine.def.source || machine.def.tri) { verserAuTour(machine, dt); return; }

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
