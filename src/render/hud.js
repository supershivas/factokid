// HUD : le compteur des bonbons finis, la barre d'outils, le panneau d'un
// élément. Icônes et chiffres ; les seuls mots sont là pour l'adulte.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, GRILLE_Y, HAUTEUR_VUE, CELLULE,
  TEXTE_GRAND, TEXTE_PETIT, TUILE_PX, BULLE, PANNEAU_TEXTE, PANNEAU_MARGE, BOUTON_PAUSE,
  poserImage,
  SURMODALE_TEXTE, BOUTON_ZOOM, rectBouton, rectRangee, rectOption, rectFermer, rectSecondaire,
} from '../design.js';
import { INTERFACE, spriteItem, spriteNomme, TAILLE_ITEM } from './sprites.js';
import { enfoncement } from './bouton.js';
import { dessinerTouche, dessinerPilule, SOMBRE, PART_ITEM } from './plaque.js';
import { dessinerMiniCarte } from './minicarte.js';
import { auPlusLoin } from '../camera.js';
import { dessinerMenu } from './menu.js';
import { dessinerMotCentre, dessinerMots, dessinerNombre } from './texte.js';

// L'image en grand d'une modale : ce dont elle parle. Elle se pose comme dans
// une touche, à l'échelle entière — une matière de neuf pixels d'art étirée
// sur quarante-huit n'est plus qu'une tache blanche, et c'est ce qu'on voyait
// sur le panneau du sucre.
const PART_VIGNETTE = 0.8;

function dessinerVignette(ctx, icone, x, y) {
  const image = spriteNomme(icone);
  if (!image) return;
  const natif = image.width || TUILE_PX;
  const { taille, marge } = poserImage(CELLULE, natif, natif === TUILE_PX ? 1 : PART_VIGNETTE);
  ctx.drawImage(image, x + marge, y + marge, taille, taille);
}

export function dessinerHud(ctx, monde, fps, interfaceJeu) {
  const livraison = monde.scene.machines.find((m) => m.def.entree);

  // Un seul compteur : les bonbons finis. Tout le reste se lit sur la grille,
  // dans les jauges des machines et dans ce qui circule.
  ctx.drawImage(spriteItem('bonbon'), 12, 24, TAILLE_ITEM, TAILLE_ITEM);
  dessinerNombre(
    ctx, livraison ? livraison.consommes : 0,
    12 + TAILLE_ITEM + 9, 21, TEXTE_GRAND, PALETTE.creme,
  );

  // Le bouton pause, puis la carte du monde : où l'on est, et où l'on va.
  dessinerTouche(ctx, BOUTON_PAUSE, INTERFACE.outilPause, { enfonce: enfoncement('pause') });
  // Le recul, au second rang : il règle ce qu'on regarde, pas le monde. Son
  // signe montre ce qu'on obtient en appuyant — quatre grosses cases pour
  // revenir bâtir, seize petites pour voir loin.
  dessinerTouche(ctx, BOUTON_ZOOM, INTERFACE[auPlusLoin() ? 'zoomPres' : 'zoomLoin'], {
    teinte: SOMBRE,
    enfonce: enfoncement('zoom'),
  });
  dessinerMiniCarte(ctx, monde);

  dessinerOutils(ctx, interfaceJeu);

  // Séparations discrètes des bandeaux.
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(12, GRILLE_Y - 10, LARGEUR_LOGIQUE - 24, 1);
  ctx.fillRect(12, GRILLE_Y + HAUTEUR_VUE + 10, LARGEUR_LOGIQUE - 24, 1);

  // Le menu de construction passe au-dessus de la barre et du bandeau : rien
  // ne doit rester allumé derrière un choix ouvert.
  dessinerRangees(ctx, interfaceJeu);
  dessinerPanneau(ctx, interfaceJeu);
  dessinerSurmodale(ctx, interfaceJeu);

  // Le menu pause passe par-dessus tout, y compris la barre d'outils.
  dessinerMenu(ctx, interfaceJeu);
}

// La surmodale : ce qu'un mot souligné explique. Elle se pose au-dessus du
// panneau sans le fermer — la croix la referme, et on retrouve ce qu'on
// regardait. Un doigt posé à côté la referme aussi.
function dessinerSurmodale(ctx, interfaceJeu) {
  const s = interfaceJeu.surmodale;
  if (!s) return;
  const echelle = interfaceJeu.surmodaleAnim;
  // La boîte a été mesurée à l'ouverture, sur le texte qu'elle porte : le
  // rendu la lit, il ne la recalcule pas.
  const b = s.boite;

  ctx.save();
  ctx.translate(b.x + b.l / 2, b.y + b.h / 2);
  ctx.scale(echelle, echelle);
  ctx.translate(-(b.x + b.l / 2), -(b.y + b.h / 2));

  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(b.x, b.y, b.l, b.h);
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 1, b.y + 1, b.l - 2, b.h - 2);

  dessinerVignette(ctx, s.icone, b.x + PANNEAU_MARGE, b.y + PANNEAU_MARGE);
  dessinerMotCentre(
    ctx, s.nom, b.x + PANNEAU_MARGE + CELLULE + 12, b.y + PANNEAU_MARGE + CELLULE / 2,
    TEXTE_PETIT, PALETTE.creme,
  );
  dessinerMots(
    ctx, s.mots || [], b.x + SURMODALE_TEXTE.x, b.y + SURMODALE_TEXTE.y,
    TEXTE_PETIT, PALETTE.ardoise, PALETTE.creme,
  );

  dessinerTouche(ctx, rectFermer(b), INTERFACE.menuFermer, { enfonce: enfoncement('fermer') });
  ctx.restore();
}

// Barre d'outils : trois touches rondes. L'outil en cours est en pleine
// lumière, les autres attendent en ardoise — la différence se voit sans cadre
// ni contour, et c'est la seule marque de sélection du jeu.
function dessinerOutils(ctx, interfaceJeu) {
  for (let i = 0; i < interfaceJeu.boutons.length; i++) {
    const b = interfaceJeu.boutons[i];
    // L'outil en cours est la touche restée enfoncée : c'est toute la marque
    // de sélection, et elle se lit comme une touche enclenchée.
    dessinerTouche(ctx, rectBouton(i), INTERFACE[b.icone], {
      enfonce: enfoncement('outil:' + i, b.actif ? 1 : 0),
    });
  }
}

// Les rangées du menu de construction, quand il est ouvert.
function dessinerRangees(ctx, interfaceJeu) {
  if (interfaceJeu.menu <= 0 || !interfaceJeu.ancre) return;

  // Le voile couvre tout l'écran, barre d'outils comprise : tant qu'un choix
  // est ouvert, rien d'autre ne s'allume — c'est le bouton qui a ouvert la
  // liste qu'on redessine par-dessus, et lui seul.
  ctx.globalAlpha = 0.6 * Math.min(1, interfaceJeu.menu);
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE);
  ctx.globalAlpha = 1;
  dessinerTouche(ctx, interfaceJeu.ancre, INTERFACE.outilConstruction, { enfonce: 1 });

  // La progression vient d'un ressort : elle dépasse un peu, puis se pose.
  // Chaque rangée part un peu après la précédente : la liste se déplie, elle
  // n'apparaît pas d'un bloc.
  const p = interfaceJeu.menu;
  for (let j = 0; j < interfaceJeu.bulles.length; j++) {
    const r = rectRangee(interfaceJeu.ancre, j, p);
    if (r.p <= 0) continue;
    const bulle = interfaceJeu.bulles[j];
    const x = Math.round(r.x);
    const y = Math.round(r.y);
    const alpha = Math.min(1, r.p);
    // La rangée entière est une touche : une pilule sombre, qui porte l'image
    // de l'élément et son nom. Celle qui est choisie reste enfoncée — le même
    // signe que dans la barre d'outils.
    const enfonce = enfoncement('rangee:' + j, bulle.choisie ? 1 : 0);
    const dy = dessinerPilule(ctx, { x, y, l: r.l, h: r.h }, { teinte: SOMBRE, enfonce, alpha });

    ctx.globalAlpha = alpha * (bulle.choisie ? 1 : 0.75);
    ctx.drawImage(INTERFACE[bulle.icone], x + 4, y + dy + 4, BULLE - 8, BULLE - 8);
    ctx.globalAlpha = 1;
    if (bulle.nom) {
      ctx.globalAlpha = alpha;
      dessinerMotCentre(
        ctx, bulle.nom, x + BULLE + 6, y + dy + r.h / 2, TEXTE_PETIT, PALETTE.creme,
      );
      ctx.globalAlpha = 1;
    }
  }
}

// Panneau d'un élément construit : ce que c'est, et ce qu'on peut y régler.
function dessinerPanneau(ctx, interfaceJeu) {
  const p = interfaceJeu.panneau;
  if (!p) return;

  // Le panneau surgit de son propre centre.
  const echelle = interfaceJeu.panneauAnim;
  // Sa hauteur vient de son contenu : elle a été mesurée à l'ouverture, et
  // c'est le bas qui reste posé — le panneau pousse vers le haut.
  const b = p.boite;
  ctx.save();
  ctx.translate(b.x + b.l / 2, b.y + b.h / 2);
  ctx.scale(echelle, echelle);
  ctx.translate(-(b.x + b.l / 2), -(b.y + b.h / 2));

  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(b.x, b.y, b.l, b.h);
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(b.x + 1, b.y + 1, b.l - 2, b.h - 2);

  dessinerVignette(ctx, p.icone, b.x + PANNEAU_MARGE, b.y + PANNEAU_MARGE);
  dessinerMotCentre(
    ctx, p.nom, b.x + PANNEAU_MARGE + CELLULE + 12, b.y + PANNEAU_MARGE + CELLULE / 2,
    TEXTE_PETIT, PALETTE.creme,
  );

  // Le bouton secondaire, à droite du nom : ce qui règle l'élément qu'on
  // regarde, plus petit et plus sombre que ce qui agit sur le monde.
  if (p.secondaire) {
    dessinerTouche(ctx, rectSecondaire(b), spriteNomme(p.secondaire.icone), {
      teinte: SOMBRE,
      enfonce: enfoncement('secondaire'),
    });
  }

  // Ce que l'élément fait, en toutes lettres. Les matières et les machines
  // qu'on y nomme sont soulignées : les toucher les explique, par-dessus.
  dessinerMots(
    ctx, p.mots || [], b.x + PANNEAU_TEXTE.x, b.y + PANNEAU_TEXTE.y,
    TEXTE_PETIT, PALETTE.ardoise, PALETTE.creme,
  );

  for (let j = 0; j < p.options.length; j++) {
    const option = p.options[j];
    const sprite = option.item ? spriteItem(option.item) : spriteNomme(option.icone);
    // Ce qui est choisi est la touche allumée ; le reste attend en ardoise.
    // Une option qui ne se choisit pas — la pause — est toujours allumée.
    dessinerTouche(ctx, rectOption(j, b), sprite, {
      teinte: SOMBRE,
      enfonce: enfoncement('option:' + j, option.choisie ? 1 : 0),
      part: option.item ? PART_ITEM : undefined,
    });
  }
  ctx.restore();
}
