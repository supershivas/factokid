# Projet — jeu d'usine mobile

Jeu d'usine en pixel art, sur mobile, pour enfants. Chaînes de production,
convoyeurs, objets qui défilent, déblocages de plus en plus rapides.

Ce fichier fait autorité. Toute dérogation doit m'être signalée avant d'être
codée, pas après.

---

## 1. Décisions de design (arrêtées)

Ne pas rediscuter ces points sans me le demander explicitement.

- **Temps réel.** La simulation continue quand la fenêtre n'est pas visible :
  au retour, le temps écoulé est rattrapé, dans la limite de `RATTRAPAGE_MAX`.
  Rien ne progresse en revanche quand l'app est fermée : pas d'idle, pas de
  production hors ligne. **Seule exception : le menu pause**, où le temps
  s'arrête parce que le joueur l'a demandé.
- **Une mini-carte, toujours visible**, dans le bandeau haut : le monde entier
  à deux unités par cellule, avec le cadre de la fenêtre. La toucher y emmène
  la vue — un geste, pas deux.
- **Grille avec convoyeurs.** Les objets transportés sont discrets et visibles :
  ils défilent un par un et s'accumulent quand l'aval est saturé.
- **Tracé au doigt.** Un glissé d'une machine à l'autre crée le chemin entier.
  Le joueur ne pose jamais une cellule à la fois.
- **Séparation et fusion, jamais au milieu d'une file.** Un convoyeur peut se
  diviser : on part d'une de ses cellules pour en tracer une autre, et le bout
  distribue à tour de rôle entre ses branches. Il peut aussi se raccorder à
  n'importe quel niveau d'un autre : venir buter dessus suffit.
  Dans les deux cas, le tapis est **coupé au point de jonction** : ce qui
  précède devient un tapis, ce qui suit un autre qu'il alimente. Les files
  compressées restent donc intactes de part et d'autre — rien n'est jamais
  inséré ni extrait en plein milieu d'une file. C'est ce qui permet ces deux
  gestes sans renoncer à la contrainte de performance de la section 3.
- **Prestige.** L'état de la partie en cours et l'état permanent sont deux
  structures distinctes, sauvegardées séparément, dès le premier commit.
- **Les matières viennent du sol, pas de nulle part.** Il n'y a plus de machine
  qui produit à partir de rien : chaque matière brute a ses gisements, posés
  sur la grande grille. Un extracteur posé dessus le récolte ; un gisement
  repousse après un délai.
- **L'usine fabrique des bonbons.** La chaîne tient en quatre recettes : le
  bois se débite en papier ; le sucre fond en caramel ; caramel, fraise et
  menthe font la pastille ; la pastille et le papier font le bonbon. Les
  quatre matières brutes — sucre, bois, fraise, menthe — sortent de gisements
  posés sur la grande carte, et les gisements de bois sont des arbres.
- **Les trieurs et les transformateurs se construisent.** Trieur, chaufferie,
  confiserie et plieuse sont des éléments constructibles comme le convoyeur :
  on les pose sur une cellule libre, et l'outil destruction les retire. La
  livraison, elle, reste en place.
- **Le tri se fait dans une machine, jamais sur un tapis.** Un trieur a deux
  branches : la matière que le joueur a choisie, et tout le reste. Le premier
  convoyeur tracé prend la matière choisie, le second ramasse le reste. La
  matière se change à tout moment depuis le panneau du trieur.
- **Un bâtiment dit ce qu'il lui faut, en toutes lettres.** Son panneau porte
  sa description, et c'est elle qui donne la recette : « assemble la pastille
  avec du caramel, une fraise et de la menthe ». Un extracteur posé nomme la
  matière qu'il récolte, pas une matière en général. Les jetons de recette qui
  doublaient la phrase en images ont été retirés sur décision : l'enfant visé
  sait lire. Le reste du jeu — poser, tracer, détruire — se joue toujours sans
  un mot.
- **Ce qui s'explique est souligné.** Dans une description, les matières et les
  machines sont soulignées : les toucher ouvre une **surmodale** par-dessus le
  panneau, qui dit d'où la chose vient et où elle va — et qui se referme sans
  fermer ce qu'on regardait. Les mots y sont explicables à leur tour : on
  remonte toute la chaîne sans jamais perdre sa place. Ce qui est explicable
  se déclare dans la table, entre accolades : `débite le {bois} en {papier}`.
- **Un extracteur garde sa récolte** dans son propre stock : il faut tracer un
  convoyeur de là jusqu'à ce qu'on veut nourrir.
- **Les machines n'ont pas d'orientation.** Elles acceptent un convoyeur par
  côté, quel qu'il soit. Un enfant relie sans avoir à penser au sens ; les
  flèches d'entrée et de sortie suffisent à dire ce qui se passe. Pas de
  rotation, donc.
- **Un extracteur posé devant un tapis s'y raccorde tout seul**, et un tapis
  tracé devant un extracteur au repos le prend au passage. Le tapis est coupé
  juste avant la cellule voisine : la machine déverse dans la suite, à côté de
  ce qui l'alimentait déjà. Rien n'est inséré au milieu d'une file.
- **Le héros n'existe plus.** On pose un extracteur sur un gisement et on le
  relie : c'est tout ce qu'il y a à y faire.
- **Tout bâtiment se met en pause**, depuis son panneau d'appui long. Il cesse
  de travailler et cesse de se signaler : c'est ainsi qu'on assume un bouchon
  au lieu de démonter la chaîne. Une machine en pause porte un petit carré
  crème à deux barres.
- **La destruction retire un élément à la fois.** Détruire une tuile de
  convoyeur n'enlève que celle-là : l'amont et l'aval restent posés. Rien ne
  disparaît tout seul de la grille, même un tapis que plus rien n'alimente.
- **Un seul compteur à l'écran** : les bonbons finis. Le reste se lit sur la
  grille, dans les jauges des machines et dans ce qui circule.
- **Appui court, appui long.** Un appui court fait la fonction principale de
  l'élément touché — un gisement propose son extracteur, un trieur ouvre son
  filtre. Un appui long ouvre les informations et les réglages. Le panneau
  montre en grand **ce dont il parle** : sur un gisement, c'est la matière,
  pas la machine qu'on propose d'y bâtir.
- **L'élément choisi le reste.** Poser une machine ne rend pas la main au
  convoyeur : on en pose dix d'affilée sans rouvrir le menu. C'est l'outil
  main, ou un autre élément, qui met fin au mode. Tant qu'une machine est
  choisie, le doigt ne trace rien — le tracé reste le geste du convoyeur.
- **La satisfaction vient du rythme des déblocages**, pas de la taille des
  nombres.
- **Cible : jouable au pouce par un enfant, sans lecture, sans urgence.**
- **La bêta s'ouvre sur trois essais.** Au lancement, on choisit par quoi
  commencer : *nouvelle partie* (carte nue, tutoriel), *usine qui tourne*
  (la chaîne complète déjà posée), *bac à sable* (carte nue, sans tutoriel).
  Un essai n'est qu'une disposition de départ plus le tutoriel ou non — c'est
  une entrée de `data/scenarios.js`. Le menu pause y ramène, le temps de la
  bêta.
- **Le tutoriel est un système de plus, assumé, ajouté sur demande.** Il ne
  sert qu'à la première partie et ne connaît que le résultat d'un geste, jamais
  le geste : cinq étapes dans `data/tutoriel.js`, un halo sur les cellules à
  toucher, et l'image de la bulle à poser. Une étape de plus y est une entrée
  de plus. Rien du reste du jeu ne le regarde.

### Une seule carte, plus grande que l'écran

Il n'y a plus d'écran d'usine ni de carte de minage : **une seule grille**, où
l'on mine et où l'on construit au même endroit. Elle fait neuf fenêtres —
21 × 30 cellules pour une fenêtre de 7 × 10 — et la caméra s'y promène.

C'est le seul système que la carte générale ajoute, et il ne touche pas à la
simulation : déplacer la vue ne change rien à ce qui circule. Tout le jeu
raisonne en cellules du monde ; seuls le rendu et l'entrée savent laquelle est
visible.

**Le sol dit ce qu'il donne.** La carte est faite de biomes — plaines de sucre,
terre, champs de fraises, champs de menthe — et chaque gisement porte la
matière de son biome. On sait donc où aller chercher quoi rien qu'à la couleur
du sol, de loin, sans savoir lire. Seule la clairière de départ a un peu de
tout : c'est ce qui permet de faire un bonbon avant d'avoir traversé quoi que
ce soit.

Un biome est une **couleur posée sur le noir à une transparence très basse**,
en trois nuances. Le passage d'un biome à l'autre n'est que le mélange des deux
teintes, sur deux cellules : il n'existe aucune tuile de raccord, et la largeur
du fondu est un réglage. Les textures sont minimales — un point d'un pixel, ou
un trait d'un pixel d'épaisseur et de deux à trois de long.

**La distance est la ressource.** Le gisement à trois cases coûte trois
convoyeurs, celui à vingt en coûte vingt : la progression sort de la
géographie, pas d'un multiplicateur. C'est ce que le téléporteur annulait, et
c'est pourquoi il a disparu. Il pourra revenir bien plus tard, en déblocage de
fin, pour relier deux points éloignés.

**La main déplace, le doigt construit.** Un troisième outil dans la barre, et
c'est celui du repos : on regarde le monde avant de le changer. En main, le
doigt tire le monde ; en construction, il trace. Pendant un tracé,
arriver au bord de la fenêtre fait défiler tout seul, pour qu'un convoyeur
traverse deux écrans sans que le doigt se lève.

### Règle de croissance

Le jeu grossit par **ajout de données**, jamais par ajout de systèmes. Une
nouvelle machine, une nouvelle recette, un nouveau palier doivent être une
entrée dans une table. Si une idée demande un nouveau système, elle est
suspecte : la signaler avant de l'implémenter.

---

## 2. Design system

### Espace logique

Toute la logique et tout le rendu travaillent dans un espace de coordonnées
**fixe**. Aucune valeur en pixels d'écran ne doit apparaître dans la logique de
jeu. La mise à l'échelle vers le conteneur se fait en un seul endroit, au rendu.

| Valeur | Réglage |
|---|---|
| Résolution logique | 360 × 640 |
| Pixel art natif | 24 × 24 par tuile |
| Cellule de grille | 48 unités logiques |
| Fenêtre | 7 × 10 cellules |
| Monde | 21 × 30 cellules, soit neuf fenêtres |
| Cible tactile minimale | 48 unités logiques |
| Mise à l'échelle | entière uniquement (×1, ×2, ×3), jamais fractionnaire |
| Rendu | `image-rendering: pixelated`, pas d'interpolation |

La cible tactile de 48 est volontairement supérieure à la recommandation adulte
habituelle. C'est un choix lié au public, pas une approximation.

### Palette

Huit couleurs, pas neuf. Une couleur par famille de ressource, deux neutres.
Ajouter une couleur demande mon accord.

| Nom | Hex | Usage |
|---|---|---|
| `--noir` | `#1a1c2c` | fond, contours |
| `--ardoise` | `#566c86` | grille, machines inertes |
| `--creme` | `#f4f4f4` | texte, surbrillance |
| `--rouge` | `#b13e53` | ressource A, état bloqué |
| `--orange` | `#ef7d57` | ressource B |
| `--jaune` | `#ffcd75` | ressource C, énergie |
| `--vert` | `#38b764` | ressource D, validation |
| `--bleu` | `#41a6f6` | ressource E, convoyeur actif |

Chaque type d'item doit être identifiable **par sa forme seule**, en niveaux de
gris. La couleur est une confirmation, jamais l'unique porteuse d'information.

C'est la **silhouette colorée** qui porte la forme, pas le contour : sur un sol
sombre, le noir du contour disparaît, et il ne reste que la couleur. Un rond
dont seul le contour est rond se lit comme une croix. Les items sont donc des
matrices de 9 × 9 pixels d'art (`MOTIFS` dans `render/sprites.js`), où la
couleur remplit la forme et le noir la cerne.

**Dérogation validée : les sols des biomes.** Composer une couleur de la
palette sur le noir crée des teintes qui n'y figurent pas. Elles restent très
basses — de 8 % à 14 % — et ne servent qu'au sol, jamais à un élément. Les huit
couleurs deviennent donc huit familles, et rien d'autre n'y a droit.

### Typographie

Le jeu doit être compréhensible sans savoir lire. Le texte est un confort pour
l'adulte, jamais un passage obligé pour l'enfant.

- Une seule famille : la fonte bitmap **5 × 7** de `render/texte.js`. Elle
  était en 3 × 5 grossie ×2 — trois pixels de large ne suffisent ni à une
  panse ni à une jambe, et les lettres se ressemblaient toutes une fois
  épaissies. À la même place à l'écran, 5 × 7 à l'échelle 1 porte deux fois
  plus de forme : c'est la finesse qui manquait, pas la taille.
- Deux tailles seulement : nombre (`TEXTE_GRAND`, ×3) et étiquette
  (`TEXTE_PETIT`, ×1).
- Les hampes et les accents tiennent sur les deux rangées du haut, les
  jambages descendent sur deux rangées de plus.
- Pas de capitales tracées, pas de texte dans les boutons d'action — icônes.
- **Le soulignement est le seul ornement de texte du jeu**, et il ne veut dire
  qu'une chose : touche-moi. Un mot souligné est en crème, le reste de la
  phrase en ardoise.

### Boutons

Une plaque claire posée sur un fond sombre se lit comme une étiquette autant
que comme une touche. Deux choses disent mieux le bouton, et elles sont dans
`render/plaque.js` — aucun autre module ne dessine de touche :

- **La forme.** Rien n'est rond dans une usine faite de cases : un rond n'est
  donc jamais qu'un bouton. La touche fait **56 unités** et porte une icône de
  48 — le rond s'est élargi pour l'accueillir, sinon la croix et la main
  sortaient par les coins. Les boutons larges, qui portent un mot, sont des
  **pilules** de même facture.
- **Le socle.** Un second cercle, plein, cerné de noir comme le corps, décalé
  de trois pixels d'art sous lui. Le socle **ne bouge jamais** : c'est le sol
  du bouton, et on n'en voit que le croissant du bas — tout entier quand le
  corps décolle. Seul le corps voyage : il descend au fond tant que le doigt
  le tient, puis part sur un ressort quand il se lève, dépassant le repos
  avant de s'y poser. C'est la seule animation de touche du jeu.

**Deux rangs de boutons.** Le premier agit sur le monde : les outils, les
éléments à poser, les choix d'un écran. Il est clair, large — 56 unités — et
porte une icône de 48. Le second règle ce qu'on regarde sans rien changer au
monde : la pause d'une machine, le bouton qui passe le tutoriel. Il est plus
petit — 40 unités —, sombre, et se pose **à droite du titre** de ce qu'il
règle, jamais dans la rangée des actions.

**La sélection est un enfoncement, jamais un cadre.** L'outil en cours, la
matière triée, l'élément choisi dans le menu : tous sont la touche restée au
fond. Il n'y a plus aucun cadre de sélection dans le jeu.

**Deux teintes, pas une de plus.** La touche claire porte des signes sombres —
la main, le plus, la croix ; la touche sombre porte des images claires — les
machines, les matières. Chacune garde le fond sur lequel ses signes se lisent,
et sa doublure prend l'autre valeur pour rester visible. Une touche éteinte en
ardoise avait été essayée : elle tue la croix rouge, qui n'y tranche plus.

Les huit propositions comparées ce jour-là sont dans le labo, avec leurs
animations d'appui : `labo/boutons.html`.

### Lisibilité : elle se vérifie, elle ne se suppose pas

`node outils/lisibilite.mjs` relit le design system hors du navigateur et
échoue si quelque chose ne se lit plus. Il tourne avant toute livraison
visuelle, comme `outils/tapis.mjs` avant toute livraison de convoyeurs. Ce
qu'il tient :

- **Le contraste** de chaque paire de couleurs qu'on pose l'une sur l'autre,
  au rapport WCAG : 4,5 pour du texte, 3 pour un signe. Les paires sont
  déclarées dans l'outil — une nouvelle s'y ajoute le jour où on la dessine.
  Ce qui détache une matière du tapis n'est pas sa couleur (quatre des huit ne
  peuvent pas y trancher sans sortir de la palette) mais **le noir qui la
  cerne** : c'est lui qui est mesuré.
- **Les silhouettes** : deux matières ne peuvent pas avoir la même forme en
  niveaux de gris, et aucune ne peut être peinte à même le sol — chaque pixel
  de couleur doit toucher du noir ou de la couleur, jamais le vide.
- **La pose des images** : une image de pixel art ne se met à l'échelle qu'en
  **nombre entier de fois**. À ×1,4 ses pixels n'ont plus tous la même largeur
  et son centre tombe entre deux — c'est ce qui décentrait les matières dans
  leurs jetons. `poserImage()` (dans `design.js`) donne la taille et la marge ;
  l'outil vérifie chaque couple touche / image employé dans le jeu.

### Retour visuel

Toute action produit un retour dans la même frame : surbrillance de la cellule,
déformation courte de l'icône, ou changement de couleur. Aucune action ne doit
pouvoir sembler ignorée.

Un bouchon qui dure se signale par une bulle de bande dessinée en éclats,
avec ses « !!! », qui sort de l'endroit bloqué. Une seule par bouchon, à
l'endroit d'où il part : ce qui est bloqué en amont se tait.

---

## 3. Stack

- Vanilla JS, modules ES. Pas de framework, pas de bundler.
- **Une seule dépendance : Motion** (le cœur de Framer Motion, sans React),
  rangée dans `vendor/` et servie par le dépôt — aucun CDN au chargement. Elle
  n'anime que l'interface. Aucune valeur animée par elle n'entre dans la
  simulation, qui garde son pas fixe.
- Rendu canvas 2D.
- Déploiement GitHub Pages depuis `main`.
- **Boucle de simulation à pas fixe, découplée du rendu.** Le débit ne doit pas
  varier selon la machine ni selon le taux de rafraîchissement.
- **Les convoyeurs sont des files compressées** : on stocke des espacements, pas
  une position par item. Seul l'item de tête se déplace réellement, les autres
  suivent. C'est une contrainte de performance, pas une suggestion. Elle donne
  aussi gratuitement le bon comportement d'accumulation.

---

## 4. Deux cibles d'affichage, toujours

Deux versions maintenues en parallèle, à partir d'**une seule base de code et
d'un seul canvas** :

1. **mobile** — plein écran, viewport réel du téléphone.
2. **aperçu desktop** — le même jeu rendu dans un cadre de téléphone centré dans
   la page, aux mêmes dimensions logiques.

La seule différence entre les deux est le conteneur et le facteur d'échelle.
Jamais deux mises en page distinctes, jamais deux chemins de code.

Le cadre de l'aperçu **épouse le jeu** : une fois l'échelle entière choisie, il
prend exactement la taille du canvas (`data-epouse` sur le conteneur). Sans
ça, le téléphone dessiné restait grand ouvert autour d'un jeu qui n'en
remplissait qu'un tiers. L'échelle, elle, reste entière : sur un écran qui ne
tient pas deux fois 640 de haut, l'aperçu est un vrai téléphone de 360 × 640.

Les événements pointeur sont unifiés (Pointer Events) : la souris produit
exactement les mêmes gestes que le doigt, tracé de convoyeur compris.

Toute vérification visuelle passe d'abord par `node outils/lisibilite.mjs`,
puis produit **les deux captures, systématiquement** :
la cible mobile et l'aperçu desktop. Jamais l'une sans l'autre. `outils/captures.mjs`
les génère toutes les deux ; il choisit l'essai « usine qui tourne » par la
sonde, sinon il ne montrerait que l'écran des essais (`ESSAI=choix` pour le
voir, `ESSAI=nouvelle` pour le tutoriel).

Toute livraison fournit aussi **les deux URL à essayer**, jamais les captures
seules :

- mobile — <https://supershivas.github.io/factokid/>
- aperçu desktop — <https://supershivas.github.io/factokid/preview.html>

Elles sont publiées par `.github/workflows/pages.yml`.

---

## 5. Structure des modules

```
index.html          page mobile
preview.html        aperçu desktop (même bundle, cadre différent)
vendor/             Motion, rangé tel quel, jamais modifié
src/
  main.js           point d'entrée, sélection du conteneur
  camera.js         quelle partie du monde la fenêtre montre
  tutoriel.js       où en est le premier contact
  loop.js           boucle à pas fixe
  anim.js           ressorts d'interface (Motion)
  sim/
    grid.js         grille, occupation des cellules
    scene.js        une grille, ses machines, ses convoyeurs
    belt.js         files compressées, déplacement des items
    machine.js      production, consommation, stocks
    gisement.js     gisements, extraction, repousse
    world.js        état de la partie en cours
  data/
    items.js        table des items
    machines.js     table des machines
    monde.js        gisements du monde
    biomes.js       biomes, régions, fondu
    depart.js       dispositions de départ : usine qui tourne, carte nue
    scenarios.js    les trois essais de la bêta
    tutoriel.js     étapes du premier contact
    outils.js       outils et éléments constructibles
    recipes.js      table des recettes
    progression.js  paliers de déblocage, courbe
  render/
    canvas.js       mise à l'échelle
    biome.js        la teinte de chaque cellule
    minicarte.js    le monde entier dans le bandeau haut
    choix.js        l'écran des essais
    tutoriel.js     halo des cellules à toucher, bandeau de l'étape
    menu.js         menu pause et page des recettes
    texte.js        fonte bitmap 5 × 7, texte explicable
    motifs.js       les matières en pixels d'art, table pure
    plaque.js       les touches : forme, épaisseur, enfoncement
    demarrage.js    barre de chargement
    particules.js   fumée et étoiles
    sprites.js      atlas, dessin des tuiles
    bouton.js       l'appui d'une touche, par clé
    hud.js          compteurs, boutons
  input/
    pointer.js      gestes unifiés, tracé
  save/
    run.js          état de la partie en cours
    meta.js         état permanent (prestige)
```

`data/` ne contient que des tables. Aucune logique. C'est là que le jeu grossit.

---

## 6. Conventions

- Noms de fichiers et de modules en anglais, en minuscules.
- Commentaires et messages de commit en français.
- Pas de nombre magique dans la logique : toute constante de gameplay vit dans
  `data/`, toute constante visuelle dans le design system.
- Un module, une responsabilité. `sim/` ne dessine jamais, `render/` ne modifie
  jamais l'état.

---

## 7. Workflow git

- Chaque version fonctionnelle est commitée et poussée sur `main`.
- Pas de branche ni de PR sauf demande explicite.
- **Préviens-moi avant de pousser** si un changement casse la sauvegarde ou
  touche à la séparation partie / permanent.
- Un commit = un changement compréhensible. Pas de commit fourre-tout.

---

## 8. Lot minimal (à faire avant tout le reste)

Rien d'autre que ceci tant que ce n'est pas validé :

1. Grille affichée, aux deux cibles d'affichage.
2. Convoyeur traçable au doigt d'une machine à l'autre.
3. Une machine productrice : un item toutes les N ticks.
4. Une machine consommatrice.
5. Items visibles qui circulent et **s'accumulent quand le consommateur est
   saturé**.
6. Deux outils : construction et destruction. Toucher « construction » fait
   sortir les éléments constructibles en bulles. Un convoyeur lâché en cours
   de tracé reste construit et ne débouche sur rien.

Depuis, le lot a grossi sur décision : deuxième matière et première recette
(a + b = c), gisements et trieur, la chaîne complète du bonbon, la
construction des trieurs et des transformateurs, puis la carte générale — une
seule grille de neuf fenêtres, où l'on mine et où l'on construit au même
endroit. La bêta y ajoute ses trois essais et le tutoriel du premier contact.
Ces ajouts sont décrits en section 1.

**Critère de validation : 200 items à l'écran à 60 fps sur téléphone.**
Mesuré à 208 items, 60 fps, image médiane 16,7 ms — avant que l'espacement ne
passe à 27, qui plafonne désormais un long convoyeur à 121 items. Le chiffre
de 200 est donc à revoir ou à atteindre autrement.

Tant que ce chiffre n'est pas mesuré, aucune recette, aucun déblocage, aucune
courbe, aucun prestige. Si le critère n'est pas tenu, on bascule sur un débit
abstrait plutôt que des items discrets — et il vaut mieux le savoir la première
semaine.
