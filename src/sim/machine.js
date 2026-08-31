// Machines : production, consommation, stocks. Ne dessine rien.

import { MACHINES, TICKS_PAR_SECONDE } from '../data/machines.js';
import { pousser, peutAccepter } from './belt.js';

export function creerMachine(type, cx, cy) {
  const def = MACHINES[type];
  return {
    type,
    def,
    cx,
    cy,
    periode: def.ticksParItem / TICKS_PAR_SECONDE, // en secondes
    horloge: 0,
    stock: 0,       // consommateur : items en attente
    sortie: null,   // convoyeur partant de la machine
    entree: null,   // convoyeur arrivant sur la machine
    produits: 0,
    consommes: 0,
    bloquee: false,
  };
}

export function accepte(machine, type) {
  if (machine.type !== 'consommateur') return false;
  if (machine.def.entree !== type) return false;
  return machine.stock < machine.def.capacite;
}

export function deposer(machine, type) {
  if (!accepte(machine, type)) return false;
  machine.stock++;
  return true;
}

export function majMachine(machine, dt) {
  if (machine.type === 'producteur') {
    machine.horloge += dt;
    // Bloquée = un item est prêt mais l'aval ne le prend pas.
    const pret = machine.horloge >= machine.periode;
    machine.bloquee = pret && (!machine.sortie || !peutAccepter(machine.sortie));
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

  if (machine.type === 'consommateur') {
    machine.bloquee = machine.stock >= machine.def.capacite;
    if (machine.stock === 0) {
      machine.horloge = Math.min(machine.horloge, machine.periode);
      return;
    }
    machine.horloge += dt;
    if (machine.horloge < machine.periode) return;
    machine.stock--;
    machine.consommes++;
    machine.horloge -= machine.periode;
  }
}
