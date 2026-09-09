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
import { parcourirItems, pousser, peutAccepter, destinations } from '../src/sim/belt.js';
import { centreCellule } from '../src/sim/grid.js';
import { lire } from '../src/sim/grid.js';
import { CELLULE } from '../src/design.js';
import { problemes } from './invariants.mjs';

let echecs = 0;
const cle = (c) => c.cx + ',' + c.cy;
function verifier(scene, ou) {
  const pbs = problemes(scene);
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

// ————— 5. trois tapis nourrissent la même machine, et un seul en sort
//
// Une machine occupe une cellule et accepte un convoyeur par côté : quatre
// côtés, moins sa sortie, font trois entrées. C'était le nombre d'ingrédients
// de sa recette, et une scierie — qui n'en a qu'un — perdait son premier tapis
// dès qu'un second arrivait. Trois arbres éloignés ne pouvaient pas nourrir la
// même scie.
{
  const s = creerScene();
  const scie = ajouterMachine(s, 'scierie', 5, 5);
  const arbres = [
    { m: ajouterMachine(s, 'extracteur', 1, 5, { item: 'bois' }), chemin: ligne(2, 5, 3, 1, 0) },
    { m: ajouterMachine(s, 'extracteur', 5, 1, { item: 'bois' }), chemin: ligne(5, 2, 3, 0, 1) },
    { m: ajouterMachine(s, 'extracteur', 5, 9, { item: 'bois' }), chemin: ligne(5, 8, 3, 0, -1) },
  ];
  for (const a of arbres) poserConvoyeur(s, a.chemin, a.m, scie);
  verifier(s, 'trois tapis vers une scierie');
  veut(scie.entrees.length === 3, 'la scierie garde ses trois entrées');

  // Le quatrième côté est celui de la sortie : un tapis de plus chasse le
  // premier arrivé, il ne s'ajoute pas.
  const quatrieme = ajouterMachine(s, 'extracteur', 9, 5, { item: 'bois' });
  poserConvoyeur(s, ligne(8, 5, 3, -1, 0), quatrieme, scie);
  verifier(s, 'quatrième tapis vers une scierie');
  veut(scie.entrees.length === 3, 'la scierie n’en tient jamais plus de trois');

  // Ce qui arrive par les trois côtés arrive vraiment dans le stock.
  for (const c of s.convoyeurs) if (peutAccepter(c)) pousser(c, 'bois');
  for (let k = 0; k < 400; k++) majScene(s, 1 / 60);
  veut(scie.stocks.bois > 0 || scie.produits > 0, 'la scierie reçoit le bois de ses tapis');
  verifier(s, 'trois tapis qui livrent');

  // Une seule sortie, quoi qu'il arrive.
  const aval = ajouterMachine(s, 'plieuse', 5, 7);
  poserConvoyeur(s, ligne(5, 6, 1, 0, 1), scie, aval);
  veut(scie.sorties.length === 1, 'la scierie ne sort que par un tapis');
}

// ————— 6. un tapis raccourci se raccorde à ce qu'il vise
//
// Le tracé passe devant une machine sans s'y arrêter — un doigt qui a dépassé —
// puis on retire les tuiles en trop. Le bout se retrouve à viser la machine :
// le rendu dessine la jonction, puisqu'elle se déduit de la géométrie. Mais la
// coupe remettait la cible à zéro sans jamais regarder ce que le nouveau bout
// touchait, et le tapis ne livrait rien. Il avait l'air branché et ne l'était
// pas.
{
  const s = creerScene();
  const mine = ajouterMachine(s, 'extracteur', 1, 5, { item: 'sucre' });
  const four = ajouterMachine(s, 'chaufferie', 5, 5);
  // On descend au lieu d'entrer : le tapis longe la machine et continue.
  const t = poserConvoyeur(
    s,
    [{ cx: 2, cy: 5 }, { cx: 3, cy: 5 }, { cx: 4, cy: 5 }, { cx: 4, cy: 6 }, { cx: 4, cy: 7 }],
    mine, null,
  );
  veut(t.cible === null, 'le tapis dépassé ne vise rien');

  couperConvoyeur(s, t, 4, 7);
  couperConvoyeur(s, convoyeurEn(s, 4, 6), 4, 6);
  verifier(s, 'tapis raccourci devant une machine');

  const reste = convoyeurEn(s, 4, 5);
  veut(cle(reste.celluleSortie) === '5,5', 'le bout vise bien la machine');
  veut(reste.cible === four, 'le tapis raccourci se raccorde à la machine qu’il vise');

  // Et il livre pour de bon.
  if (peutAccepter(reste)) pousser(reste, 'sucre');
  for (let k = 0; k < 400; k++) majScene(s, 1 / 60);
  veut(four.stocks.sucre > 0 || four.produits > 0, 'le tapis raccourci livre vraiment');
}

// ————— 7. une machine posée au bout d'un tapis prend ce qui y arrive
//
// Le même défaut par l'autre bout : on trace d'abord, on pose la machine
// ensuite. Le tapis la visait déjà — le rendu dessinait la flèche — mais rien
// ne regardait, à la pose, ce qui pointait vers elle.
{
  const s = creerScene();
  const mine = ajouterMachine(s, 'extracteur', 1, 5, { item: 'sucre' });
  const t = poserConvoyeur(s, [{ cx: 2, cy: 5 }, { cx: 3, cy: 5 }, { cx: 4, cy: 5 }], mine, null);
  veut(t.cible === null && cle(t.celluleSortie) === '5,5', 'le tapis vise une case vide');

  const four = ajouterMachine(s, 'chaufferie', 5, 5);
  verifier(s, 'machine posée au bout d’un tapis');
  veut(t.cible === four, 'la machine posée prend le tapis qui la vise');

  if (peutAccepter(t)) pousser(t, 'sucre');
  for (let k = 0; k < 400; k++) majScene(s, 1 / 60);
  veut(four.stocks.sucre > 0 || four.produits > 0, 'et elle reçoit vraiment');

  // Ce qui ne la vise pas ne s'y raccorde pas : un tapis qui passe à côté
  // reste un tapis qui passe à côté.
  const autre = ajouterMachine(s, 'extracteur', 1, 8, { item: 'sucre' });
  const long = poserConvoyeur(
    s, [{ cx: 2, cy: 8 }, { cx: 3, cy: 8 }, { cx: 4, cy: 8 }, { cx: 5, cy: 8 }], autre, null,
  );
  ajouterMachine(s, 'confiserie', 5, 7);
  veut(long.cible === null, 'un tapis qui longe une machine ne s’y raccorde pas');
}

// ————— 8. un item entre par le côté d'où il vient
//
// Un tapis nourri des deux côtés — c'est ce que fait une fusion — n'a qu'une
// entrée dans sa géométrie. Les items poussés par l'autre source apparaissaient
// donc au bord d'à côté : ils sautaient d'un tapis à l'autre, d'un
// trois-quarts de cellule, sans jamais passer entre les deux.
{
  const s = creerScene();
  const a = ajouterMachine(s, 'extracteur', 1, 4, { item: 'sucre' });
  const b = ajouterMachine(s, 'extracteur', 5, 8, { item: 'sucre' });
  const bout = ajouterMachine(s, 'livraison', 9, 4);
  const hote = poserConvoyeur(s, ligne(2, 4, 7, 1, 0), a, bout);
  raccorderConvoyeur(s, ligne(5, 7, 3, 0, -1), b, hote, { cx: 5, cy: 4 });
  const suite = convoyeurEn(s, 5, 4);
  veut(suite.sources.length === 2, 'la suite est nourrie des deux côtés');

  const premiere = suite.chemin[0];
  for (const source of suite.sources) {
    suite.items.length = 0;
    suite.queue = 0;
    pousser(suite, 'sucre', source);
    let ou = null;
    parcourirItems(suite, (item, p) => { ou = p; });
    const dernier = source.chemin[source.chemin.length - 1];
    const ca = centreCellule(dernier.cx, dernier.cy);
    const cb = centreCellule(premiere.cx, premiere.cy);
    const ecart = Math.hypot(ou.x - (ca.x + cb.x) / 2, ou.y - (ca.y + cb.y) / 2);
    veut(ecart < 0.5, `l'item entre par ${cle(dernier)}, là d'où il vient`);
  }
}

// ————— 9. un tapis qui bute sur un autre se déverse dedans, dans les trois
// ordres de gestes
//
// « Venir buter dessus suffit » ne valait qu'au tracé, et seulement quand le
// doigt atteignait la cellule de l'hôte. Un doigt qui s'arrête une case avant,
// un hôte tracé après, un tapis raccourci jusqu'à buter : trois images
// identiques à l'écran, et trois tapis pleins et muets. C'est ce que montrait
// une usine où deux tapis restaient bloqués sans raison.
{
  const orientations = ['l’hôte d’abord', 'l’amont d’abord', 'raccourci jusqu’à buter'];
  for (const ordre of orientations) {
    const s = creerScene();
    const a = ajouterMachine(s, 'extracteur', 12, 5, { item: 'sucre' });
    const b = ajouterMachine(s, 'extracteur', 6, 1, { item: 'sucre' });
    const four = ajouterMachine(s, 'chaufferie', 6, 10);
    // L'hôte descend la colonne 6 jusqu'à la chaufferie ; l'amont vient de
    // l'est et s'arrête une case avant lui.
    const hote = () => poserConvoyeur(s, ligne(6, 2, 8, 0, 1), b, four);
    const amont = () => poserConvoyeur(s, ligne(11, 5, 5, -1, 0), a, null);
    if (ordre === 'l’hôte d’abord') { hote(); amont(); } else if (ordre === 'l’amont d’abord') { amont(); hote(); } else {
      hote();
      // Le doigt a dépassé : il a tourné vers le bas. On retire les deux
      // tuiles en trop, et le bout vient buter sur l'hôte.
      poserConvoyeur(
        s, [...ligne(11, 5, 5, -1, 0), { cx: 7, cy: 6 }, { cx: 7, cy: 7 }], a, null,
      );
      couperConvoyeur(s, convoyeurEn(s, 7, 7), 7, 7);
      couperConvoyeur(s, convoyeurEn(s, 7, 6), 7, 6);
    }
    verifier(s, 'tapis qui bute, ' + ordre);
    const venu = convoyeurEn(s, 8, 5);
    veut(destinations(venu).length > 0, 'le tapis qui bute a où aller — ' + ordre);

    // Et il livre pour de bon, de l'autre côté de la jonction.
    if (peutAccepter(venu)) pousser(venu, 'sucre');
    for (let k = 0; k < 900; k++) majScene(s, 1 / 60);
    veut(four.stocks.sucre > 0 || four.produits > 0, 'il livre vraiment — ' + ordre);
  }
}

// ————— 10. un tapis ne se raccorde pas à lui-même
//
// Le raccord automatique suit les sorties pour vérifier que l'aval ne revient
// pas : sans cela, un tapis qui boucle sur son propre amont tournerait sans
// fin et rien n'en sortirait.
{
  const s = creerScene();
  const a = ajouterMachine(s, 'extracteur', 1, 5, { item: 'sucre' });
  // Un U : on descend, on va à droite, on remonte, et le bout vise la
  // deuxième cellule de son propre tapis.
  const t = poserConvoyeur(s, [
    { cx: 2, cy: 5 }, { cx: 3, cy: 5 }, { cx: 3, cy: 6 }, { cx: 2, cy: 6 },
  ], a, null);
  verifier(s, 'tapis en U');
  veut(!t.sorties.includes(t), 'un tapis ne se déverse pas dans lui-même');
  for (const suite of t.sorties) veut(suite !== t, 'aucune sortie ne revient au tapis');
}

// ————— 11. une branche ne détruit jamais le tapis d'où elle part
//
// Tracer une branche vers une machine déjà pleine d'entrées lui fait de la
// place : elle retire la plus ancienne. Quand la plus ancienne était le tapis
// d'où part le tracé, la branche naissait alimentée par un tapis qui venait
// d'être détruit — dessinée, branchée pour l'œil, et vide pour toujours.
{
  const s = creerScene();
  const four = ajouterMachine(s, 'chaufferie', 6, 5);
  const ouest = ajouterMachine(s, 'extracteur', 1, 5, { item: 'sucre' });
  const est = ajouterMachine(s, 'extracteur', 10, 5, { item: 'sucre' });
  const sud = ajouterMachine(s, 'extracteur', 6, 10, { item: 'sucre' });
  const a = poserConvoyeur(s, ligne(2, 5, 4, 1, 0), ouest, four);
  poserConvoyeur(s, ligne(9, 5, 3, -1, 0), est, four);
  poserConvoyeur(s, ligne(6, 9, 4, 0, -1), sud, four);
  veut(four.entrees.length === 3, 'la chaufferie est pleine : trois entrées');

  // La quatrième arrive par le nord, et elle part du tapis de l'ouest.
  const branche = poserConvoyeur(s, [{ cx: 5, cy: 4 }, { cx: 6, cy: 4 }], a, four);
  verifier(s, 'branche vers une machine pleine');
  veut(s.convoyeurs.includes(a), 'le tapis d’où part la branche est toujours là');
  veut(branche && branche.source === a, 'la branche est alimentée par lui');
  veut(a.sorties.includes(branche), 'et il la connaît');
  veut(four.entrees.length === 3, 'la chaufferie en tient toujours trois');

  // Et la branche livre pour de bon : c'est tout ce qui manquait.
  const avant = four.stocks.sucre + four.produits;
  for (let k = 0; k < 900; k++) {
    if (peutAccepter(a)) pousser(a, 'sucre');
    majScene(s, 1 / 60);
  }
  veut(branche.items.length > 0 || four.stocks.sucre + four.produits > avant, 'la branche porte quelque chose');
}

// ————— 12. on ne se raccorde pas à un tapis qu'on vient de détruire
//
// Un extracteur n'a qu'une sortie : retracer depuis lui remplace le tapis qui
// en partait déjà. Quand le nouveau tracé venait buter sur ce même tapis, il
// se raccordait à un mort — un tapis retiré de la scène, que rien ne fait plus
// avancer et que rien ne dessine, mais qui restait la source du nouveau.
{
  const s = creerScene();
  const mine = ajouterMachine(s, 'extracteur', 1, 5, { item: 'sucre' });
  const four = ajouterMachine(s, 'chaufferie', 5, 5);
  const ancien = poserConvoyeur(s, ligne(2, 5, 3, 1, 0), mine, four);
  const neuf = raccorderConvoyeur(
    s, [{ cx: 1, cy: 6 }, { cx: 2, cy: 6 }], mine, ancien, { cx: 2, cy: 5 },
  );
  verifier(s, 'raccord sur un tapis que la pose a remplacé');
  veut(!s.convoyeurs.includes(ancien), 'l’extracteur n’a gardé qu’une sortie');
  veut(neuf && s.convoyeurs.includes(neuf), 'le nouveau tapis est bien posé');
  veut(neuf.sorties.length === 0, 'il ne se déverse pas dans un tapis détruit');
}

// ————— 13. martelage : on construit et on détruit au hasard, en vérifiant
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
