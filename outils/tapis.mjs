// Vérification des convoyeurs, sans navigateur : la simulation est du JS pur,
// on peut la monter à la main et regarder ce qui s'y passe.
//
//   node outils/tapis.mjs [graine]
//
// Quelques scènes montées à la main pour les cas qui ont déjà mordu, puis un
// martelage : des milliers de gestes au hasard, et après chacun on relit toute
// la scène. Les invariants sont ceux dont dépendent le rendu et la
// simulation — chemin continu, sortie qui touche le bout, files cohérentes.
// Les convoyeurs sont la mécanique de base : elle se vérifie, elle ne se
// suppose pas.
import {
  creerScene, ajouterMachine, poserConvoyeur, raccorderConvoyeur, raccorderA,
  brancherConvoyeur, couperConvoyeur, prolongerConvoyeur, retirerConvoyeur,
  retirerMachine, majScene, convoyeurEn,
} from '../src/sim/scene.js';
import { pointA, parcourirItems, pousser, peutAccepter, destinations } from '../src/sim/belt.js';
import { lire } from '../src/sim/grid.js';
import { CELLULE } from '../src/design.js';
import { MACHINES } from '../src/data/machines.js';

const ESPACEMENT = MACHINES.convoyeur.espacement;
let echecs = 0;
const cle = (c) => c.cx + ',' + c.cy;
const adj = (a, b) => Math.abs(a.cx - b.cx) + Math.abs(a.cy - b.cy) === 1;
function verifier(scene, ou) {
  const pbs = [];
  const vues = new Map();
  scene.convoyeurs.forEach((c, n) => {
    const q = 'tapis#' + n + '[' + c.chemin.map(cle).join(' ') + ']';
    if (!c.chemin.length) { pbs.push('chemin vide ' + q); return; }
    for (let i = 1; i < c.chemin.length; i++) if (!adj(c.chemin[i - 1], c.chemin[i])) pbs.push('chemin discontinu ' + q);
    for (const p of c.chemin) {
      if (vues.has(cle(p))) pbs.push('cellule partagée ' + cle(p) + ' ' + q);
      vues.set(cle(p), c);
      const g = lire(scene.grille, p.cx, p.cy);
      if (!g || g.genre !== 'convoyeur' || g.convoyeur !== c) pbs.push('grille désaccordée ' + cle(p) + ' ' + q);
    }
    const bout = c.chemin[c.chemin.length - 1];
    if (!adj(bout, c.celluleSortie)) pbs.push('sortie non adjacente ' + q + ' -> ' + cle(c.celluleSortie));
    if (!adj(c.chemin[0], c.celluleEntree)) pbs.push('entrée non adjacente ' + q);
    for (const d of destinations(c)) {
      const e = d.chemin ? d.chemin[0] : d;
      if (!adj(bout, e)) pbs.push('destination hors de portée ' + q + ' -> ' + cle(e));
    }
    if (c.longueur !== c.chemin.length * CELLULE) pbs.push('longueur fausse ' + q);
    if (c.points.length !== c.chemin.length + 2) pbs.push('polyligne fausse ' + q);
    for (const s of c.sorties) {
      if (!scene.convoyeurs.includes(s)) pbs.push('branche retirée ' + q);
      else if (!s.sources.includes(c)) pbs.push('branche non réciproque ' + q);
    }
    for (const s of c.sources) if (!(s.sorties || []).includes(c)) pbs.push('source non réciproque ' + q);
    if (c.cible && !c.cible.entrees.includes(c)) pbs.push('cible sans entrée ' + q);
    let somme = 0;
    for (const it of c.items) somme += it.ecart;
    if (Math.abs(somme - c.queue) > 1e-6) pbs.push('queue fausse ' + q);
    for (let i = 1; i < c.items.length; i++) if (c.items[i].ecart < ESPACEMENT - 1e-6) pbs.push('items trop serrés ' + q);
    if (c.items.length && c.items[0].ecart < -1e-6) pbs.push('tête au-delà de la sortie ' + q);
    if (somme > c.longueur + 1e-6) pbs.push('file plus longue que le tapis ' + q);
  });
  for (const m of scene.machines) {
    for (const s of m.sorties) if (!scene.convoyeurs.includes(s)) pbs.push('machine tient un tapis retiré');
    for (const e of m.entrees) if (!scene.convoyeurs.includes(e)) pbs.push('machine tient une entrée retirée');
  }
  if (pbs.length) { echecs++; console.log('✗', ou); for (const p of new Set(pbs)) console.log('   ', p); }
  return pbs.length === 0;
}
function veut(condition, quoi) {
  if (condition) return true;
  echecs++; console.log('✗', quoi); return false;
}
const ligne = (cx, cy, n, dx, dy) => Array.from({ length: n }, (_, i) => ({ cx: cx + i * dx, cy: cy + i * dy }));

// ————— 1. un tapis droit, d'une machine à l'autre
{
  const s = creerScene();
  const mine = ajouterMachine(s, 'extracteur', 2, 5, { item: 'sucre' });
  const bout = ajouterMachine(s, 'livraison', 8, 5);
  const t = poserConvoyeur(s, ligne(3, 5, 5, 1, 0), mine, bout);
  verifier(s, 'tapis droit');
  veut(t.longueur === 5 * CELLULE, 'longueur du tapis droit');
  veut(cle(t.celluleEntree) === '2,5' && cle(t.celluleSortie) === '8,5', 'entrée et sortie du tapis droit');
}

// ————— 2. un tapis qui monte et vient buter sur un tapis existant
{
  const s = creerScene();
  const a = ajouterMachine(s, 'extracteur', 1, 4, { item: 'sucre' });
  const b = ajouterMachine(s, 'extracteur', 5, 8, { item: 'sucre' });
  const bout = ajouterMachine(s, 'livraison', 9, 4);
  const hote = poserConvoyeur(s, ligne(2, 4, 7, 1, 0), a, bout);
  // le second monte : 5,7 -> 5,5, et bute sur la cellule 5,4 de l'hôte
  const montant = raccorderConvoyeur(s, ligne(5, 7, 3, 0, -1), b, hote, { cx: 5, cy: 4 });
  verifier(s, 'raccord par le bas');
  const suite = convoyeurEn(s, 5, 4);
  veut(suite !== hote, 'l’hôte est coupé à la jonction');
  veut(cle(suite.chemin[0]) === '5,4', 'la jonction ouvre la suite');
  veut(montant.sorties.includes(suite), 'le montant déverse dans la suite');
  veut(hote.sorties.includes(suite), 'l’amont déverse aussi dans la suite');
  veut(cle(montant.celluleSortie) === '5,4', 'le montant vise la jonction');

  // un item du montant traverse la jonction sans sauter de case
  pousser(montant, 'sucre');
  let precedent = null;
  let saut = 0;
  for (let i = 0; i < 400; i++) {
    majScene(s, 1 / 60);
    const p = [];
    parcourirItems(montant, (it, q) => p.push(q));
    parcourirItems(suite, (it, q) => p.push(q));
    if (p.length !== 1) { precedent = null; continue; }
    if (precedent) saut = Math.max(saut, Math.hypot(p[0].x - precedent.x, p[0].y - precedent.y));
    precedent = p[0];
  }
  // À la jonction, l'item passe d'un bord de la case à l'autre : une file
  // compressée n'a qu'un point d'entrée. Ce qu'on exige, c'est qu'il reste
  // dans la case de jonction — jamais qu'il en saute une.
  veut(saut < CELLULE, 'l’item reste dans la case de jonction (bond max ' + saut.toFixed(1) + ')');
}

// ————— 3. détruire la dernière tuile d'un tapis qui se divise
{
  const s = creerScene();
  const a = ajouterMachine(s, 'extracteur', 1, 4, { item: 'sucre' });
  const tronc = poserConvoyeur(s, ligne(2, 4, 4, 1, 0), a, null);
  brancherConvoyeur(s, tronc, { cx: 5, cy: 4 }, ligne(5, 5, 3, 0, 1), null);
  const dernier = convoyeurEn(s, 5, 4);
  couperConvoyeur(s, dernier, 5, 4);
  verifier(s, 'destruction de la tuile qui distribue');
}

// ————— 4. une branche partant du bout d'un tapis qui nourrit déjà une machine
{
  const s = creerScene();
  const a = ajouterMachine(s, 'extracteur', 1, 4, { item: 'sucre' });
  const four = ajouterMachine(s, 'chaufferie', 6, 4);
  const t = poserConvoyeur(s, ligne(2, 4, 4, 1, 0), a, four);
  const branche = poserConvoyeur(s, ligne(5, 5, 3, 0, 1), t, null);
  verifier(s, 'branche depuis le bout');
  let versMachine = 0;
  const recu = four.stocks;
  for (let i = 0; i < 900; i++) {
    if (peutAccepter(t)) pousser(t, 'sucre');
    const avant = recu.sucre + four.consommes;
    majScene(s, 1 / 60);
    if (recu.sucre + four.consommes > avant) versMachine++;
  }
  veut(versMachine > 0, 'la machine est servie');
  veut(branche.items.length > 0, 'la branche reçoit sa part');
}

// ————— 5. martelage : on construit et on détruit au hasard, en vérifiant
// tous les invariants après chaque geste.
{
  // Un générateur reproductible et correctement mélangé : les bits de poids
  // faible d'un LCG naïf ne le sont pas, et le martelage n'explorerait rien.
  let graine = Number(process.argv[2] || 7);
  const suivant = () => {
    graine = (graine + 0x6d2b79f5) >>> 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const alea = (n) => Math.floor(suivant() * n);
  const s = creerScene();
  const DIRS = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];
  ajouterMachine(s, 'extracteur', 4, 4, { item: 'sucre' });
  let gestes = 0;
  for (let n = 0; n < 4000; n++) {
    try {
      const geste = alea(16);
      if (geste === 0) {
        // poser une machine sur une case libre
        const cx = 1 + alea(14); const cy = 1 + alea(20);
        if (lire(s.grille, cx, cy) || s.machines.length > 10) continue;
        ajouterMachine(s, ['chaufferie', 'trieur', 'livraison', 'confiserie'][alea(4)], cx, cy);
      } else if (geste <= 3) {
        // détruire un élément au hasard
        if (alea(2) && s.convoyeurs.length) {
          const c = s.convoyeurs[alea(s.convoyeurs.length)];
          const t = c.chemin[alea(c.chemin.length)];
          couperConvoyeur(s, c, t.cx, t.cy);
        } else if (s.machines.length > 6) {
          retirerMachine(s, s.machines[alea(s.machines.length)]);
        }
      } else {
        // tracer depuis un élément existant, en tournant au hasard
        const depuis = [...s.machines, ...s.convoyeurs];
        const source = depuis[alea(depuis.length)];
        const bout = source.chemin ? source.chemin[alea(source.chemin.length)] : source;
        const branche = Boolean(source.chemin);
        let d = DIRS[alea(4)];
        let c = { cx: bout.cx + d.dx, cy: bout.cy + d.dy };
        const chemin = [];
        let hote = null; let jonction = null; let cible = null;
        for (let k = 0; k < 1 + alea(6); k++) {
          const occupe = lire(s.grille, c.cx, c.cy);
          if (c.cx < 0 || c.cy < 0 || c.cx > 20 || c.cy > 29) break;
          if (occupe) {
            if (!chemin.length) break;
            if (occupe.genre === 'convoyeur' && occupe.convoyeur !== source) {
              hote = occupe.convoyeur; jonction = c;
            } else if (occupe.genre === 'machine') cible = occupe.machine;
            break;
          }
          chemin.push(c);
          if (alea(3) === 0) d = DIRS[alea(4)];
          c = { cx: c.cx + d.dx, cy: c.cy + d.dy };
        }
        if (!chemin.length) continue;
        if (branche && source.chemin.length > 1 && bout !== source.chemin[source.chemin.length - 1]) {
          const pose = brancherConvoyeur(s, source, bout, chemin, cible);
          if (pose && hote) raccorderA(s, pose, hote, jonction);
        } else if (hote) {
          raccorderConvoyeur(s, chemin, source, hote, jonction);
        } else {
          poserConvoyeur(s, chemin, source, cible);
        }
      }
      gestes++;
      for (let k = 0; k < 4; k++) majScene(s, 1 / 60);
      for (const c of s.convoyeurs) if (alea(4) === 0 && peutAccepter(c)) pousser(c, 'sucre');
    } catch (e) {
      echecs++; console.log('✗ exception au geste', n, String(e.stack).split('\n').slice(0, 3).join(' | ')); break;
    }
    if (!verifier(s, 'martelage, geste ' + n)) break;
  }
  console.log('martelage :', gestes, 'gestes utiles,', s.convoyeurs.length, 'tapis,', s.machines.length, 'machines');
}

console.log(echecs === 0 ? '✓ tout est en ordre' : '✗ ' + echecs + ' vérification(s) en échec');
process.exit(echecs === 0 ? 0 : 1);
