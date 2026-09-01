// Machines : production, consommation, stocks. Ne dessine rien.
//
// Trois rôles, tous décrits par une entrée de data/machines.js :
//   - une machine qui a `sortie` produit toute seule ;
//   - une machine qui a `recette` consomme plusieurs ingrédients et en sort un ;
//   - une machine qui a `entree` consomme et fait disparaître.

import { MACHINES, TICKS_PAR_SECONDE } from '../data/machines.js';
import { RECETTES } from '../data/recipes.js';
import { pousser, peutAccepter } from './belt.js';

export function creerMachine(type, cx, cy) {
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
    stocks: {},          // items en attente, par type
    sortie: null,        // convoyeur qui part de la machine
    entrees: [],         // convoyeurs qui arrivent sur la machine
    produits: 0,
    consommes: 0,
    bloquee: false,
  };
  for (const { item } of attendus(machine)) machine.stocks[item] = 0;
  return machine;
}

// Ce que la machine accepte, et jusqu'à combien. Le rendu s'en sert pour la
// jauge, la simulation pour les stocks.
export function attendus(machine) {
  const { def, recette } = machine;
  if (recette) {
    return Object.keys(recette.entrees).map((item) => ({ item, capacite: def.capacite }));
  }
  if (def.entree) return [{ item: def.entree, capacite: def.capacite }];
  return [];
}

export function aUneSortie(machine) {
  return Boolean(machine.def.sortie || machine.recette);
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

function sortieLibre(machine) {
  return machine.sortie !== null && peutAccepter(machine.sortie);
}

export function majMachine(machine, dt) {
  // Machine qui produit à partir de rien.
  if (machine.def.sortie) {
    machine.horloge += dt;
    const pret = machine.horloge >= machine.periode;
    machine.bloquee = pret && !sortieLibre(machine);
    if (!pret) return;
    if (machine.bloquee) {
      machine.horloge = machine.periode; // prêt, en attente de place
      return;
    }
    pousser(machine.sortie, machine.def.sortie);
    machine.produits++;
    machine.horloge -= machine.periode;
    return;
  }

  // Machine qui assemble : a + b = c.
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
    machine.bloquee = pret && !sortieLibre(machine);
    if (!pret || machine.bloquee) {
      if (pret) machine.horloge = machine.periode;
      return;
    }
    for (const [item, n] of Object.entries(machine.recette.entrees)) machine.stocks[item] -= n;
    pousser(machine.sortie, machine.recette.sortie);
    machine.produits++;
    machine.consommes++;
    machine.horloge -= machine.periode;
    return;
  }

  // Machine qui consomme et fait disparaître.
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
