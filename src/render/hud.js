// HUD : le compteur des bonbons finis, la barre d'outils, le panneau d'un
// élément. Icônes et chiffres ; les seuls mots sont là pour l'adulte.

import {
  PALETTE, LARGEUR_LOGIQUE, HAUTEUR_LOGIQUE, GRILLE_Y, HAUTEUR_VUE, CELLULE,
  TEXTE_GRAND, TEXTE_PETIT, BULLE, PANNEAU, PANNEAU_TEXTE, BOUTON_PAUSE,
  rectBouton, rectRangee, rectOption,
} from '../design.js';
import { INTERFACE, spriteItem, spriteNomme, TAILLE_ITEM } from './sprites.js';
import { enfoncement } from './bouton.js';
import { dessinerTouche, dessinerPilule, SOMBRE } from './plaque.js';
import { dessinerMiniCarte } from './minicarte.js';
import { dessinerMenu } from './menu.js';
import { dessinerMotCentre, dessinerNombre, decouperTexte, hauteurTexte } from './texte.js';

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

  // Le menu pause passe par-dessus tout, y compris la barre d'outils.
  dessinerMenu(ctx, interfaceJeu);
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
      enfonce: Math.max(enfoncement('outil:' + i), b.actif ? 1 : 0),
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
    const enfonce = Math.max(enfoncement('rangee:' + j), bulle.choisie ? 1 : 0);
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
  ctx.save();
  ctx.translate(PANNEAU.x + PANNEAU.l / 2, PANNEAU.y + PANNEAU.h / 2);
  ctx.scale(echelle, echelle);
  ctx.translate(-(PANNEAU.x + PANNEAU.l / 2), -(PANNEAU.y + PANNEAU.h / 2));

  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(PANNEAU.x, PANNEAU.y, PANNEAU.l, PANNEAU.h);
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(PANNEAU.x + 1, PANNEAU.y + 1, PANNEAU.l - 2, PANNEAU.h - 2);

  const image = spriteNomme(p.icone);
  if (image) ctx.drawImage(image, PANNEAU.x + 12, PANNEAU.y + 12, CELLULE, CELLULE);
  dessinerMotCentre(
    ctx, p.nom, PANNEAU.x + 12 + CELLULE + 12, PANNEAU.y + 12 + CELLULE / 2,
    TEXTE_PETIT, PALETTE.creme,
  );

  // Une ligne qui dit à quoi sert l'élément : le nom seul ne suffit pas.
  const lignes = decouperTexte(p.description || '', PANNEAU.l - 24, TEXTE_PETIT);
  const interligne = hauteurTexte(TEXTE_PETIT) + 4;
  for (let i = 0; i < lignes.length; i++) {
    dessinerMotCentre(
      ctx, lignes[i], PANNEAU.x + PANNEAU_TEXTE.x, PANNEAU.y + PANNEAU_TEXTE.y + i * interligne,
      TEXTE_PETIT, PALETTE.ardoise,
    );
  }

  for (let j = 0; j < p.options.length; j++) {
    const option = p.options[j];
    const sprite = option.item ? spriteItem(option.item) : INTERFACE[option.icone];
    // Ce qui est choisi est la touche allumée ; le reste attend en ardoise.
    // Une option qui ne se choisit pas — la pause — est toujours allumée.
    dessinerTouche(ctx, rectOption(j), sprite, {
      teinte: SOMBRE,
      enfonce: Math.max(enfoncement('option:' + j), option.choisie ? 1 : 0),
    });
  }
  ctx.restore();
}
