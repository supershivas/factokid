// Vérification de la sauvegarde, sans navigateur : la simulation et la
// conversion sont du JS pur, on peut monter une partie, l'écrire, la relire et
// comparer.
//
//   node outils/sauvegarde.mjs [graine]
//
// Une sauvegarde ne se suppose pas plus qu'un convoyeur. Ce que cet outil
// exige d'une partie relue :
//
//   1. elle est saine — les mêmes invariants que l'originale, relus par le
//      même juge (outils/invariants.mjs) ;
//   2. elle est la même — une description faite des objets vivants, et non de
//      ce que la sauvegarde a écrit : ce qu'elle oublie se voit donc ici ;
//   3. elle se comporte pareil — on simule les deux dix secondes de plus, et
//      elles doivent encore être identiques. C'est la vraie preuve : une
//      partie qui se relit puis dérive n'est pas sauvegardée ;
//   4. une sauvegarde qu'on ne sait pas lire est refusée, jamais devinée.
//
// Et il mesure ce que ça coûte : le temps d'écriture et la taille du fichier,
// sur une usine qui grouille.

import { creerMonde, majMonde } from '../src/sim/world.js';
import { DEPART, DEPART_NU } from '../src/data/depart.js';
import {
  creerScene, ajouterMachine, poserConvoyeur, raccorderConvoyeur, raccorderA,
  brancherConvoyeur, couperConvoyeur, retirerMachine, majScene, celluleLibre,
} from '../src/sim/scene.js';
import { pousser, peutAccepter } from '../src/sim/belt.js';
import { choisirRecette } from '../src/sim/machine.js';
import { poserMur } from '../src/sim/mur.js';
import { rangeesDe } from '../src/sim/carte.js';
import { poserExtracteur } from '../src/sim/gisement.js';
import { lire } from '../src/sim/grid.js';
import { serialiserPartie, deserialiserPartie, FORMAT } from '../src/save/run.js';
import { problemes } from './invariants.mjs';

let echecs = 0;
const veut = (condition, quoi) => {
  if (condition) return true;
  echecs++;
  console.log('✗', quoi);
  return false;
};

function sain(scene, ou) {
  const pbs = problemes(scene);
  if (!pbs.length) return true;
  echecs++;
  console.log('✗', ou);
  for (const p of new Set(pbs)) console.log('   ', p);
  return false;
}

// --- la description : ce qu'on compare -------------------------------------
//
// Elle est faite des objets vivants, jamais de ce que la sauvegarde a écrit.
// C'est tout l'intérêt : un champ que la sauvegarde oublie manque ici, et la
// comparaison le dit. Une description tirée de la sérialisation ne prouverait
// que sa propre cohérence.

const cle = (c) => (c ? c.cx + ',' + c.cy : '-');

function decrireScene(scene) {
  const rangM = new Map(scene.machines.map((m, i) => [m, 'm' + i]));
  const rangC = new Map(scene.convoyeurs.map((c, i) => [c, 'c' + i]));
  const nom = (x) => rangM.get(x) || rangC.get(x) || '-';
  return {
    machines: scene.machines.map((m) => ({
      type: m.type,
      def: m.def.id,
      recette: m.recette ? m.recette.id : null,
      periode: m.periode,
      ou: cle(m),
      item: m.item ?? null,
      stocks: m.stocks,
      file: m.file,
      matiereTriee: m.matiereTriee ?? null,
      horloge: m.horloge,
      horlogeMine: m.horlogeMine ?? null,
      creuse: m.creuse ?? null,
      tour: m.tour,
      produits: m.produits,
      consommes: m.consommes,
      verse: m.verse,
      recus: m.recus,
      sorti: m.sorti ?? null,
      bloquee: m.bloquee,
      bloqueeDepuis: m.bloqueeDepuis,
      pause: m.pause,
      entrees: m.entrees.map(nom),
      sorties: m.sorties.map(nom),
    })),
    convoyeurs: scene.convoyeurs.map((c) => ({
      chemin: c.chemin.map(cle),
      // La géométrie déduite : elle doit se retrouver seule, à l'identique.
      entree: cle(c.celluleEntree),
      sortie: cle(c.celluleSortie),
      points: c.points.map((p) => p.x + ':' + p.y),
      longueur: c.longueur,
      items: c.items.map((it) => it.type + '@' + it.ecart + '/' + cle(it.entree)),
      queue: c.queue,
      role: c.role ?? null,
      tour: c.tour,
      bloque: c.bloque,
      source: nom(c.source),
      sources: c.sources.map(nom),
      cible: c.cible ? nom(c.cible) : null,
      sorties: c.sorties.map(nom),
    })),
    // La grille elle-même : à qui chaque case appartient. Une case oubliée
    // rend un tapis indestructible, et rien d'autre ne le dirait.
    grille: scene.grille.cellules.map((c) => {
      if (!c) return '.';
      return c.genre === 'machine' ? nom(c.machine) : nom(c.convoyeur);
    }).join(''),
  };
}

function decrire(partie) {
  const { monde, camera, tutoriel } = partie;
  return JSON.stringify({
    graine: monde.graine,
    caisse: monde.caisse,
    etageOuvert: monde.etageOuvert,
    decouvertes: monde.decouvertes,
    gisements: monde.gisements.map((g) => ({
      ou: cle(g), item: g.item, present: g.present, horloge: g.horloge,
      // L'extracteur retrouvé par sa case : un gisement qui perd le sien
      // continue de repousser sans que personne le récolte.
      extracteur: g.extracteur ? cle(g.extracteur) : null,
    })),
    scene: decrireScene(monde.scene),
    camera,
    tutoriel,
  });
}

// Écrire, relire, comparer. Puis simuler les deux et comparer encore.
function eprouver(partie, ou, secondes = 10) {
  // La scène d'origine d'abord : une scène déjà malade ne prouve rien de la
  // sauvegarde, et il faut savoir laquelle des deux est en cause.
  sain(partie.monde.scene, ou + ' — la scène d’origine');
  const brut = JSON.stringify(serialiserPartie(partie));
  let relue = null;
  try {
    relue = deserialiserPartie(JSON.parse(brut));
  } catch (e) {
    echecs++;
    console.log('✗', ou, '— relecture refusée :', String(e.message || e));
    return null;
  }
  sain(relue.monde.scene, ou + ' — la scène relue');
  veut(decrire(relue) === decrire(partie), ou + ' — la partie relue est la même');

  // Elle se comporte pareil : c'est ce qui distingue une sauvegarde d'une
  // photographie.
  const pas = 1 / 60;
  for (let k = 0; k < secondes * 60; k++) {
    majMonde(partie.monde, pas);
    majMonde(relue.monde, pas);
  }
  sain(relue.monde.scene, ou + ' — la scène relue, ' + secondes + ' s plus tard');
  veut(
    decrire(relue) === decrire(partie),
    ou + ' — les deux parties tournent pareil ' + secondes + ' s plus tard',
  );
  return { brut, relue };
}

const partieDe = (monde, camera, tutoriel) => ({
  monde,
  camera: camera || { x: 640, y: 1200, niveau: 0 },
  tutoriel: tutoriel || null,
});

// ————— 1. l'usine qui tourne, en pleine production
{
  const monde = creerMonde(DEPART, 1);
  // On la laisse vivre : les tapis se remplissent, les machines s'arrêtent en
  // milieu de cycle, les gisements repoussent. C'est cet état-là qu'il faut
  // savoir écrire — une usine à l'arrêt ne prouverait rien.
  for (let k = 0; k < 120 * 60; k++) majMonde(monde, 1 / 60);
  const items = monde.scene.convoyeurs.reduce((n, c) => n + c.items.length, 0);
  veut(items > 0, 'l’usine a de quoi remplir ses tapis (' + items + ' items)');
  veut(monde.caisse > 0, 'l’usine a livré (caisse ' + monde.caisse + ')');
  const r = eprouver(partieDe(monde), 'usine qui tourne');
  if (r) {
    console.log(
      '  usine qui tourne :', (r.brut.length / 1024).toFixed(1), 'ko,',
      monde.scene.convoyeurs.length, 'tapis,', items, 'items,',
      monde.gisements.length, 'gisements',
    );
  }
}

// ————— 2. la carte nue, avec son tutoriel et sa caisse
{
  const monde = creerMonde(DEPART_NU, 1);
  for (let k = 0; k < 60; k++) majMonde(monde, 1 / 60);
  eprouver(
    partieDe(monde, { x: 300, y: 900, niveau: 1 }, { etape: 4, age: 1.5, fini: false, salut: 0 }),
    'carte nue, tutoriel en cours',
  );
}

// ————— 2 bis. un mur ouvert, ses connecteurs, et une chaîne qui les traverse
//
// Les connecteurs sont des tapis comme les autres, et ils s'écrivent comme
// eux. Ce qu'on vérifie ici, c'est qu'une partie relue n'en pose pas un second
// par-dessus : ils appartiennent au mur, et le mur les repose au chargement.
{
  const monde = creerMonde(DEPART_NU, 1, 2);
  const mur = rangeesDe(1).mur;
  const connecteurs = monde.scene.convoyeurs.filter((c) => c.connecteur);
  veut(connecteurs.length === 3, 'le mur ouvert a ses trois connecteurs');

  // Un extracteur en dessous, branché par-dessous sur le connecteur du milieu.
  const g = monde.gisements.find((x) => x.cy > mur + 1 && x.cy < mur + 4);
  if (g) {
    poserExtracteur(monde, g.cx, g.cy);
    const milieu = connecteurs[1].chemin[0];
    const chemin = [];
    for (let cy = g.cy - 1; cy >= mur + 1; cy--) chemin.push({ cx: g.cx, cy });
    const pas = Math.sign(milieu.cx - g.cx);
    for (let cx = g.cx + pas; pas !== 0 && cx !== milieu.cx + pas; cx += pas) {
      chemin.push({ cx, cy: mur + 1 });
    }
    if (chemin.every((c) => celluleLibre(monde.scene, c.cx, c.cy))) {
      const tapis = poserConvoyeur(monde.scene, chemin, g.extracteur, null);
      raccorderA(monde.scene, tapis, connecteurs[1], milieu);
      veut(connecteurs[1].sources.includes(tapis), 'un tapis se branche sur un connecteur');
    }
  }
  for (let k = 0; k < 60 * 60; k++) majMonde(monde, 1 / 60);
  const relu = eprouver(partieDe(monde), 'mur ouvert, connecteurs branchés');
  if (relu) {
    const apres = relu.relue.monde.scene.convoyeurs.filter((c) => c.connecteur);
    veut(apres.length === 3, 'la partie relue garde trois connecteurs, pas six');
    veut(apres.every((c) => c.sens && c.sens.dy === -1), 'et ils montent toujours');
  }
}

// ————— 3. ce qu'un joueur a réglé : la recette d'une plieuse, la matière d'un
// trieur, une machine en pause. Trois réglages qui ne se déduisent de rien —
// s'ils ne sont pas écrits, ils sont perdus, et rien d'autre ne le dirait.
{
  const monde = creerMonde(DEPART, 1);
  // L'usine de départ est celle de l'étage 1 : elle n'a ni plieuse ni trieur.
  // On les pose à côté, hors de sa chaîne — ce qu'on éprouve ici, ce sont les
  // trois réglages, pas la chaîne qui les porte.
  const plieuse = ajouterMachine(monde.scene, 'plieuse', 30, 50);
  choisirRecette(plieuse, 'berlingot');
  const trieur = ajouterMachine(monde.scene, 'trieur', 30, 53);
  trieur.matiereTriee = 'menthe';
  trieur.file.push('menthe', 'sucre', 'bois');
  monde.scene.machines.find((m) => m.type === 'chaufferie').pause = true;
  for (let k = 0; k < 30 * 60; k++) majMonde(monde, 1 / 60);

  const r = eprouver(partieDe(monde), 'réglages du joueur');
  if (r) {
    const p = r.relue.monde.scene.machines.find((m) => m.type === 'plieuse');
    const t = r.relue.monde.scene.machines.find((m) => m.type === 'trieur');
    const c = r.relue.monde.scene.machines.find((m) => m.type === 'chaufferie');
    veut(p.recette.id === 'berlingot', 'la plieuse emballe toujours son berlingot');
    veut(t.matiereTriee === 'menthe' && t.file.length > 0, 'le trieur garde sa matière et sa file');
    veut(c.pause === true, 'la machine en pause le reste');
  }
}

// ————— 4. martelage : des scènes bâties au hasard, écrites et relues.
//
// Une usine bien rangée ne prouve rien : ce sont les scènes tordues qui
// mordent — un tapis qui boucle, une branche coupée, une machine retirée sous
// ses tapis. On en tire des dizaines et on les fait toutes passer par la
// sauvegarde.
{
  let graine = Number(process.argv[2] || 7);
  const suivant = () => {
    graine = (graine + 0x6d2b79f5) >>> 0;
    let t = Math.imul(graine ^ (graine >>> 15), 1 | graine);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  const alea = (n) => Math.floor(suivant() * n);
  const DIRS = [{ dx: 1, dy: 0 }, { dx: -1, dy: 0 }, { dx: 0, dy: 1 }, { dx: 0, dy: -1 }];

  let pires = 0;
  for (let essai = 0; essai < 40; essai++) {
    const scene = creerScene();
    ajouterMachine(scene, 'extracteur', 4, 4, { item: 'sucre' });
    for (let n = 0; n < 200; n++) {
      const geste = alea(16);
      if (geste === 0) {
        const cx = 1 + alea(14); const cy = 1 + alea(20);
        if (lire(scene.grille, cx, cy) || scene.machines.length > 10) continue;
        ajouterMachine(scene, ['chaufferie', 'trieur', 'recepteur', 'confiserie'][alea(4)], cx, cy);
      } else if (geste <= 3) {
        if (alea(2) && scene.convoyeurs.length) {
          const c = scene.convoyeurs[alea(scene.convoyeurs.length)];
          const t = c.chemin[alea(c.chemin.length)];
          couperConvoyeur(scene, c, t.cx, t.cy);
        } else if (scene.machines.length > 6) {
          retirerMachine(scene, scene.machines[alea(scene.machines.length)]);
        }
      } else {
        const depuis = [...scene.machines, ...scene.convoyeurs];
        const source = depuis[alea(depuis.length)];
        const bout = source.chemin ? source.chemin[alea(source.chemin.length)] : source;
        const branche = Boolean(source.chemin);
        let d = DIRS[alea(4)];
        let c = { cx: bout.cx + d.dx, cy: bout.cy + d.dy };
        const chemin = [];
        let hote = null; let jonction = null; let cible = null;
        for (let k = 0; k < 1 + alea(6); k++) {
          if (c.cx < 0 || c.cy < 0 || c.cx > 20 || c.cy > 29) break;
          const occupe = lire(scene.grille, c.cx, c.cy);
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
          const pose = brancherConvoyeur(scene, source, bout, chemin, cible);
          if (pose && hote) raccorderA(scene, pose, hote, jonction);
        } else if (hote) {
          raccorderConvoyeur(scene, chemin, source, hote, jonction);
        } else {
          poserConvoyeur(scene, chemin, source, cible);
        }
      }
      for (let k = 0; k < 4; k++) majScene(scene, 1 / 60);
      for (const c of scene.convoyeurs) if (alea(4) === 0 && peutAccepter(c)) pousser(c, 'sucre');
    }
    // Une scène martelée n'est pas un monde : on lui en donne juste assez pour
    // passer par la sauvegarde entière, gisements compris.
    const monde = {
      graine: 1,
      scene,
      decouvertes: { sucre: true },
      caisse: 42,
      etageOuvert: 1,
      gisements: [{ cx: 21, cy: 58, item: 'sucre', present: true, horloge: 0, extracteur: null }],
    };
    // Un monde monté à la main n'a pas posé son mur : la relecture, elle, le
    // pose toujours. Sans ça les deux grilles diffèrent, et c'est l'outil qui
    // ment, pas la sauvegarde.
    poserMur(monde);
    pires = Math.max(pires, scene.convoyeurs.length);
    if (!eprouver(partieDe(monde), 'martelage #' + essai, 2)) break;
  }
  console.log('  martelage : 40 scènes écrites et relues, jusqu’à', pires, 'tapis');
}

// ————— 5. ce qu'on ne sait pas lire est refusé, jamais deviné
{
  const monde = creerMonde(DEPART_NU, 1);
  const bonne = serialiserPartie(partieDe(monde));
  const casser = (quoi, transformer) => {
    const copie = JSON.parse(JSON.stringify(bonne));
    transformer(copie);
    let passe = false;
    try { deserialiserPartie(copie); passe = true; } catch { passe = false; }
    veut(!passe, 'refusée : ' + quoi);
  };

  veut(bonne.format === FORMAT, 'une sauvegarde porte son numéro de format');
  casser('un format d’un autre âge', (p) => { p.format = FORMAT + 1; });
  casser('pas de format du tout', (p) => { delete p.format; });
  casser('un monde absent', (p) => { delete p.monde; });
  casser('une carte sans gisements', (p) => { p.monde.gisements = []; });
  casser('un étage ouvert absent', (p) => { delete p.monde.etageOuvert; });
  casser('une machine inconnue', (p) => { p.monde.scene.machines[0].type = 'téléporteur'; });
  casser('une machine hors de la grille', (p) => { p.monde.scene.machines[0].cx = 999; });
  casser('une caisse absente', (p) => { delete p.monde.caisse; });
  casser('un tapis sans chemin', (p) => {
    p.monde.scene.convoyeurs.push({
      chemin: [], items: [], queue: 0, tour: 0, role: null, bloque: 0,
      source: null, sources: [], cible: null, sorties: [],
    });
  });
  casser('un lien vers une machine qui n’existe pas', (p) => {
    p.monde.scene.machines[0].sorties = [7];
  });

  let passe = false;
  try { deserialiserPartie(JSON.parse('{"format":1,"monde":')); passe = true; } catch { passe = false; }
  veut(!passe, 'refusée : un fichier tronqué');
}

// ————— 6. ce que la sauvegarde coûte
{
  const monde = creerMonde(DEPART, 1);
  for (let k = 0; k < 300 * 60; k++) majMonde(monde, 1 / 60);
  const partie = partieDe(monde);
  const debut = performance.now();
  let taille = 0;
  for (let k = 0; k < 50; k++) taille = JSON.stringify(serialiserPartie(partie)).length;
  const ecriture = (performance.now() - debut) / 50;
  const relecture = (() => {
    const brut = JSON.stringify(serialiserPartie(partie));
    const t = performance.now();
    for (let k = 0; k < 50; k++) deserialiserPartie(JSON.parse(brut));
    return (performance.now() - t) / 50;
  })();
  console.log(
    '  coût, usine de cinq minutes :', (taille / 1024).toFixed(1), 'ko,',
    'écriture', ecriture.toFixed(2), 'ms,', 'relecture', relecture.toFixed(2), 'ms',
  );
  // Une sauvegarde qui coûte une image entière se verrait : le jeu doit
  // pouvoir l'écrire sans que le doigt sente quoi que ce soit.
  veut(ecriture < 8, 'écrire la partie tient largement dans une image (' + ecriture.toFixed(2) + ' ms)');
}

console.log(echecs === 0 ? '✓ tout est en ordre' : '✗ ' + echecs + ' vérification(s) en échec');
process.exit(echecs === 0 ? 0 : 1);
