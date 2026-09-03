// HUD : le compteur des bonbons finis, la barre d'outils, le panneau d'un
// élément. Icônes et chiffres ; les seuls mots sont là pour l'adulte.

import {
  PALETTE, LARGEUR_LOGIQUE, GRILLE_Y, HAUTEUR_VUE, CELLULE, TEXTE_GRAND, TEXTE_PETIT,
  BULLE, PANNEAU, PANNEAU_TEXTE, OPTION, BOUTON_PAUSE, rectBouton, rectRangee, rectOption,
} from '../design.js';
import { INTERFACE, spriteItem, spriteNomme, TAILLE_ITEM } from './sprites.js';
import { ecrasement } from './bouton.js';
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
  ctx.drawImage(INTERFACE.bouton, BOUTON_PAUSE.x, BOUTON_PAUSE.y, BOUTON_PAUSE.l, BOUTON_PAUSE.h);
  ctx.drawImage(INTERFACE.outilPause, BOUTON_PAUSE.x, BOUTON_PAUSE.y, BOUTON_PAUSE.l, BOUTON_PAUSE.h);
  dessinerMiniCarte(ctx, monde);

  dessinerOutils(ctx, interfaceJeu);
  dessinerPanneau(ctx, interfaceJeu);

  // Séparations discrètes des bandeaux.
  ctx.fillStyle = PALETTE.ardoise;
  ctx.fillRect(12, GRILLE_Y - 10, LARGEUR_LOGIQUE - 24, 1);
  ctx.fillRect(12, GRILLE_Y + HAUTEUR_VUE + 10, LARGEUR_LOGIQUE - 24, 1);

  // Le menu pause passe par-dessus tout, y compris la barre d'outils.
  dessinerMenu(ctx, interfaceJeu);
}

// Barre d'outils, et bulles des éléments constructibles qui en sortent.
function dessinerOutils(ctx, interfaceJeu) {
  for (let i = 0; i < interfaceJeu.boutons.length; i++) {
    const r = rectBouton(i);
    const b = interfaceJeu.boutons[i];
    // Un bouton qu'on vient de toucher s'aplatit puis rebondit : l'appui ne
    // peut pas sembler ignoré.
    const e = ecrasement(i);
    ctx.save();
    if (e) {
      ctx.translate(r.x + r.l / 2, r.y + r.h / 2);
      ctx.scale(e.x, e.y);
      ctx.translate(-r.x - r.l / 2, -r.y - r.h / 2);
    }
    // L'outil en cours est à pleine intensité, l'autre s'efface : la
    // différence se voit sans cadre ni contour.
    ctx.globalAlpha = b.actif ? 1 : 0.45;
    ctx.drawImage(INTERFACE.bouton, r.x, r.y, r.l, r.h);
    ctx.drawImage(INTERFACE[b.icone], r.x, r.y, r.l, r.h);
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  if (interfaceJeu.menu <= 0 || !interfaceJeu.ancre) return;

  // Le plateau s'assombrit : les bulles se lisent comme un choix posé
  // par-dessus le jeu, pas comme une pièce de plus sur la grille.
  ctx.globalAlpha = 0.55 * interfaceJeu.menu;
  ctx.fillStyle = PALETTE.noir;
  ctx.fillRect(0, 0, LARGEUR_LOGIQUE, GRILLE_Y + HAUTEUR_VUE);
  ctx.globalAlpha = 1;

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

    ctx.globalAlpha = Math.min(1, r.p) * (bulle.grise ? 0.35 : 1);
    // La plaque de la rangée : le nom s'écrit dessus, jamais sur le jeu.
    // C'est elle qui tient la rangée ensemble, et c'est elle qu'on touche.
    ctx.fillStyle = PALETTE.noir;
    ctx.fillRect(x, y, r.l, r.h);
    ctx.drawImage(INTERFACE.bulleFond, x, y, BULLE, BULLE);
    ctx.drawImage(INTERFACE[bulle.icone], x, y, BULLE, BULLE);
    // Le nom à côté de l'image : l'enfant reconnaît la forme, l'adulte lit.
    if (bulle.nom) {
      dessinerMotCentre(
        ctx, bulle.nom, x + BULLE + 10, y + BULLE / 2, TEXTE_PETIT,
        bulle.choisie ? PALETTE.creme : PALETTE.ardoise,
      );
    }
    ctx.globalAlpha = 1;
    if (bulle.choisie) encadrer(ctx, x, y, r.l, r.h);
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
    const r = rectOption(j);
    ctx.drawImage(INTERFACE.plaqueOption, r.x, r.y, r.l, r.h);
    const option = p.options[j];
    const sprite = option.item ? spriteItem(option.item) : INTERFACE[option.icone];
    // Ce qui est choisi est entouré ; le reste est simplement en retrait.
    ctx.globalAlpha = option.choisie === false ? 0.45 : 1;
    if (sprite) ctx.drawImage(sprite, r.x + 8, r.y + 8, OPTION - 16, OPTION - 16);
    ctx.globalAlpha = 1;
    if (option.choisie) encadrer(ctx, r.x, r.y, r.l);
  }
  ctx.restore();
}

// Le cadre qui dit « c'est celui-ci ».
function encadrer(ctx, x, y, l, h = l) {
  ctx.strokeStyle = PALETTE.creme;
  ctx.lineWidth = 2;
  ctx.strokeRect(x + 1, y + 1, l - 2, h - 2);
}
