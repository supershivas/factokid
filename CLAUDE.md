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
- **Une mini-carte, toujours visible**, dans le voile du haut : le monde entier
  à une unité par cellule, avec le cadre de la fenêtre. La toucher y emmène
  la vue — un geste, pas deux. Elle en occupait deux quand le monde était
  quatre fois plus petit : la carte a grandi, la vignette non.
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
- **Il y a trois bonbons, pas un** : une papillote, un cœur, un berlingot. Ils
  se font des mêmes deux matières et se distinguent **par leur forme seule** —
  c'est la forme qui nomme une chose ici, et une collection de trois objets
  identiques n'en est pas une. **La plieuse choisit lequel elle emballe**,
  depuis son panneau, comme un trieur choisit sa matière : la même rangée de
  touches, et ce qu'on y montre est toujours la matière qui sortira. Les trois
  recettes ont les mêmes entrées, donc changer d'avis ne jette jamais un stock
  — un enfant peut changer d'avis. Ils ne coûtent pour l'instant pas plus l'un
  que l'autre : leur donner chacun son fruit demanderait un troisième tapis
  jusqu'à la plieuse, et donc de réécrire le tutoriel.
- **La livraison les reçoit tous les trois** et les compte séparément : c'est
  la vitrine. L'écran garde son unique compteur — la caisse — et c'est au livre
  des matières que le détail se lit, sous chaque chose qu'elle achète. Elle en accepte
  **quatre tapis** et non trois : une machine réserve un côté à sa sortie, et
  la livraison ne sort nulle part.
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
- **Ce qu'un tapis vise, il l'alimente**, quel que soit l'ordre des gestes :
  une machine posée au bout d'un tapis prend ce qui y arrive, et un tapis
  raccourci se raccorde à la machine qu'il vise désormais. C'est le pendant de
  la règle ci-dessus, et sans lui un tapis pouvait avoir l'air branché sans
  l'être — le rendu déduit la jonction de la géométrie, la simulation ne la
  posait qu'au moment du tracé. Un doigt qui dépasse, puis retire ses tuiles
  en trop, doit être branché : c'est ce qu'il voit. **Cela vaut aussi d'un
  tapis à un autre** : « venir buter dessus suffit » ne tenait qu'au tracé, et
  seulement quand le doigt atteignait la cellule de l'hôte — un doigt qui
  s'arrête une case avant, un hôte tracé après l'amont, un tapis raccourci
  jusqu'à buter donnaient trois images identiques à l'écran et trois tapis
  pleins et muets. Se raccorder tout seul ne détruit toujours rien : à une
  machine seulement s'il lui reste une place, à un tapis en le coupant au point
  de jonction — la coupure sépare, elle n'insère pas. Deux gardes, parce que la
  règle agit sans qu'on le lui demande : un tapis qui a déjà où aller n'est
  jamais détourné, et jamais un tapis ne se nourrit de lui-même.
- **Le héros n'existe plus.** On pose un extracteur sur un gisement et on le
  relie : c'est tout ce qu'il y a à y faire.
- **Tout bâtiment se met en pause**, depuis son panneau d'appui long. Il cesse
  de travailler et cesse de se signaler : c'est ainsi qu'on assume un bouchon
  au lieu de démonter la chaîne. Une machine en pause porte un petit carré
  crème à deux barres.
- **La destruction retire un élément à la fois.** Détruire une tuile de
  convoyeur n'enlève que celle-là : l'amont et l'aval restent posés. Rien ne
  disparaît tout seul de la grille, même un tapis que plus rien n'alimente.
- **Un seul compteur à l'écran** : la caisse. Il ne compte plus des bonbons
  mais ce qu'ils valent — la livraison achète aussi le caramel et la pastille.
  Le reste se lit sur la grille, dans les jauges des machines et dans ce qui
  circule.
- **La livraison achète, elle ne collectionne pas.** Elle prend le caramel (1),
  la pastille (3) et les trois bonbons (10). La plus petite chaîne qui
  rapportait quelque chose faisait quatre extracteurs et quatre machines : huit
  poses avant le premier retour. C'est maintenant extracteur → chaufferie →
  livraison, trois éléments, et ça rapporte. Le bonbon est ce qu'on fait pour
  gagner plus, pas le péage d'entrée. L'écart est franc — un, trois, dix —
  parce que c'est lui qui dit qu'il vaut mieux aller au bout de la chaîne :
  mesuré sur cinq minutes, le noyau rapporte 108. La chaîne complète rapportait
  1060, et ce chiffre-là attend les étages : elle demande quatre matières, donc
  quatre étages, et on ne peut plus la bâtir au pied du monde.
- **Le bonbon paie la construction.** On livre pour bâtir, et bâtir fait livrer
  plus : c'est la boucle du jeu. Une tuile de tapis coûte 1, un extracteur 3,
  un trieur 8, une scierie ou une chaufferie 10, une confiserie ou une plieuse
  20 (`data/outils.js`). Doubler une branche coûte une vingtaine de secondes de
  production au début, et de moins en moins ensuite.
  **Rien n'est jamais perdu** : détruire rembourse le prix entier — un enfant a
  le droit de se tromper de case. Un tracé qui dépasse la caisse ne s'annule
  pas non plus : il cesse de grandir sous le doigt, et ce qu'on a tiré reste.
  Une touche trop chère **s'éteint et porte son prix en rouge** : c'est le seul
  « non » du jeu, et il ne gronde pas. La carte nue commence avec 120 ; le
  tutoriel en coûte 51, et `outils/tutoriel.mjs` relit ce compte pour qu'une
  étape de plus reste payable. L'économie vit dans le geste, jamais dans la
  simulation : une machine ne sait pas ce qu'elle a coûté.
- **Le livre des matières.** Une page du menu pause montre les dix matières —
  les quatre brutes, le papier, le caramel, la pastille et les trois bonbons :
  celles qu'on a tenues une fois sont en couleur, les autres gardent leur
  silhouette éteinte — on voit qu'il y a quelque chose là sans savoir encore
  quoi, et le jour où on l'obtient c'est la couleur qui arrive. Un compte dit
  combien sur combien. Chacune est une touche : la toucher ouvre la surmodale
  qui existe déjà, par-dessus le livre et sans le refermer. Une matière entre
  au livre au moment où une machine la verse, ou au moment où un extracteur la
  tire du sol. C'est de l'état de partie : une nouvelle partie repart d'un
  livre vide.
- **Appui court, appui long.** Un appui court fait la fonction principale de
  l'élément touché — un gisement propose son extracteur, un trieur ouvre son
  filtre. Un appui long ouvre les informations et les réglages. Le panneau
  montre en grand **ce dont il parle** : sur un gisement, c'est la matière,
  pas la machine qu'on propose d'y bâtir.
- **Un bâtiment posé rend la main.** C'est l'inverse de ce qui était décidé —
  « l'élément choisi le reste », pour en poser dix d'affilée — et c'est une
  décision qui a changé : on pose un bâtiment, puis on tire ses tapis, et
  rester en mode « pose » faisait bâtir une confiserie au premier doigt posé
  sur la carte. **Le convoyeur, lui, ne rend pas la main** : on en trace dix de
  suite, c'est tout l'intérêt du geste. Tant qu'un bâtiment est choisi, le
  doigt ne trace rien — le tracé reste le geste du convoyeur.
- **Le jeu se met à jour tout seul.** Il porte un numéro de version —
  majeur.mineur.correctif, à partir de 1.0.0 — qui se lit en bas du menu pause,
  en petit : il ne s'adresse pas à l'enfant qui joue mais à l'adulte qui
  rapporte un problème. Une veille regarde le serveur toutes les quatre-vingt-
  dix secondes et à chaque retour sur l'onglet, et un bandeau annonce ce qui
  change. C'est un système de plus, assumé : sans lui, un téléphone qui a
  ouvert la page une fois garde la version d'hier.
  **Jamais sous les doigts du joueur** : la mise à jour ne s'applique que quand
  personne ne joue — sur l'écran des essais, ou dès que l'onglet passe à
  l'arrière-plan, la partie étant alors écrite juste avant. Cette prudence
  datait de l'époque où rien n'était sauvegardé ; **la sauvegarde existe
  maintenant, et la lever est une décision qui reste à prendre.** Rien ne
  change tant qu'elle ne l'est pas.
- **La partie se sauvegarde toute seule.** Elle s'écrit toutes les cinq
  secondes et à chaque fois que l'onglet part à l'arrière-plan ; au lancement,
  l'écran des essais gagne une quatrième touche en tête, *reprendre*, quand une
  partie attend. Rien n'est demandé à l'enfant : il n'y a ni bouton
  « sauvegarder », ni emplacements, ni question à la fermeture. Ce qui est
  écrit, c'est la partie en cours (`save/run.js`) ; l'état permanent est une
  autre structure, sauvegardée à part (`save/meta.js`), et il ne porte encore
  rien.
  **Les files compressées sont écrites telles quelles** : des écarts, pas des
  positions, et un tapis relu est le tapis d'avant, jamais un tapis retracé qui
  lui ressemble. La carte, elle, est écrite en clair — ses gisements — et non
  rejouée depuis sa graine : une partie doit survivre au jour où le tirage
  changera. Le sol, lui, ne s'écrit pas : il se déduit de la rangée.
  **Une sauvegarde porte un numéro de format**, et ce qui ne porte pas le bon
  est illisible. Une sauvegarde illisible est **écartée** : mise de côté sous
  une clé à part plutôt qu'écrasée, et annoncée par le bandeau — ce message-là
  s'adresse à l'adulte, pas à l'enfant. On ne devine jamais une partie à
  moitié.
  **Changer d'essai efface la partie** : elle est abandonnée, pas mise de côté.
- **La satisfaction vient du rythme des déblocages**, pas de la taille des
  nombres.
- **Cible : jouable au pouce par un enfant, sans lecture, sans urgence.**
- **La bêta s'ouvre sur trois essais.** Au lancement, on choisit par quoi
  commencer : *nouvelle partie* (carte nue, tutoriel), *usine qui tourne*
  (la chaîne complète déjà posée), *bac à sable* (carte nue, sans tutoriel).
  Un essai n'est qu'une disposition de départ plus le tutoriel ou non — c'est
  une entrée de `data/scenarios.js`. Le menu pause y ramène, le temps de la
  bêta.
  **Une quatrième touche s'y ajoute, en tête, quand une partie attend** :
  *reprendre*. Ce n'est pas un essai de plus — elle ne bâtit rien, elle
  retrouve — et elle n'est pas là quand il n'y a rien à reprendre. L'écran
  s'ouvre donc toujours sur ses trois essais, et reprendre reste un geste
  demandé : commencer un essai efface la partie en cours, et l'enfant l'a
  voulu.
  **Le bac à sable ouvre tous les étages** : c'est ce qu'un bac à sable veut
  dire, et on n'y fait pas attendre pour essayer une plieuse. C'est une entrée
  de `data/scenarios.js`, pas une exception dans le code.
- **Le tutoriel mène jusqu'à une usine qui tourne.** C'est un système de plus,
  assumé : il ne sert qu'à la première partie et ne connaît que le résultat
  d'un geste, jamais le geste. Treize étapes dans `data/tutoriel.js`, un halo
  sur les cellules à toucher, l'image de ce qu'il y a à poser, et une barre qui
  dit ce qu'il en reste. Ce qu'on obtient au bout est exactement la chaîne de
  l'essai « usine qui tourne ». La fenêtre suit l'étape quand elle sort du
  cadre.
  **Il se joue au pied du monde**, à l'étage 1 : il n'a plus à enseigner les
  quatre matières d'un coup — ce sont les murs qui les présentent une par une —
  et il a rétréci d'autant. Ce qu'il montre tient en une phrase : *une branche,
  puis la même deux fois de plus.* Extracteur, chaufferie, livraison, et le
  premier caramel vendu à la cinquième étape ; le reste du jeu n'est que ça, en
  plus grand.
  Quatre épreuves seulement — un extracteur posé, une machine à sa case, des
  tapis qui relient deux machines, un bonbon livré — et une étape de plus est
  une entrée de plus. **Un bouton le passe** : on ne guide plus, et rien n'est
  posé à la place du joueur.

### Une seule carte, plus grande que l'écran

Il n'y a plus d'écran d'usine ni de carte de minage : **une seule grille**, où
l'on mine et où l'on construit au même endroit. Elle fait **42 × 60 cellules**
— vingt-cinq fenêtres pleines, la fenêtre en montrant 7,5 × 13,3 — et la caméra
s'y promène. Elle en faisait neuf : la distance est la ressource, et neuf
fenêtres se traversent trop vite pour que ce soit vrai longtemps.

Le monde est donc **plus haut que large**, dans un rapport de un à un et demi.

C'est le seul système que la carte générale ajoute, et il ne touche pas à la
simulation : déplacer la vue ne change rien à ce qui circule. Tout le jeu
raisonne en cellules du monde ; seuls le rendu et l'entrée savent laquelle est
visible.

**La carte prend tout l'écran, et le reste vient par-dessus.** Il n'y a plus de
bandeau haut ni de bandeau bas : le sol va d'un bord à l'autre, et le compteur,
les touches, la mini-carte, le bandeau du tutoriel et les panneaux s'y posent
en incrustation. Ce qu'on voit passe de 7 × 10 cellules à sept et demie sur
treize et un tiers — le compte n'est plus rond, et c'est sans importance : la
caméra est continue, seul le monde se compte en cellules.

**Le HUD a son fond : deux voiles**, un en haut, un en bas. Ce sont des voiles
et non des bandeaux — du noir posé sur la carte, qui continue en dessous et se
voit à travers. Chacun porte, du côté qui donne sur le jeu, la même arête
d'ardoise que la mini-carte : c'est elle qui dit où l'incrustation s'arrête.
Sans ce fond, un chiffre crème se perdait sur ce qui passait dessous — un
morceau de sucre est exactement de sa couleur.

**La zone sûre**, c'est la fenêtre moins ce que les deux voiles recouvrent.
Une cellule qui tombe dessous est visible pour la géométrie et cachée pour
l'œil : c'est à cette zone-là que le tutoriel amène son étape, pas à la
fenêtre. Une cellule n'y est sûre que si elle y tient tout entière — à moitié
sous un voile, elle est à moitié cachée, et c'est déjà trop pour un halo qui
dit « touche ici ». Le rendu, lui, dessine toute la fenêtre : c'est le regard
qu'on cadre, pas le dessin.

**La caméra déborde du monde**, en haut et en bas, exactement de la hauteur
des voiles. Sans ce débord elle bute sur le bord du monde avant d'en avoir
sorti sa première et sa dernière rangée : cent soixante-huit cellules
restaient à l'écran sans jamais se laisser regarder. Pas un pouce de plus — le
vide autour du monde n'est pas un endroit où aller. `outils/lisibilite.mjs`
tient la règle : toute cellule **ouverte** doit pouvoir venir dans la zone
sûre, à chacun des cinq étages, la rangée du mur comprise — c'est en la
regardant qu'on voit ce qu'il réclame.

**Le sol dit ce qu'il donne.** La carte est faite de biomes — plaines de sucre,
terre, champs de fraises, champs de menthe — et chaque gisement porte la
matière de son biome. On sait donc où aller chercher quoi rien qu'à la couleur
du sol, de loin, sans savoir lire.

**Le biome d'une cellule est donné par sa rangée** : le monde se lit en étages
(voir la section suivante), et chacun porte un biome et une matière. Il n'y a
plus de régions tirées au hasard dans le plan, plus de garanties par matière,
plus de plancher de rattrapage : il ne peut pas manquer de sucre dans le monde
du sucre. Le sol est donc une fonction de la cellule, et rien de plus — le
rendu n'a rien à recevoir, seulement un cache à oublier quand une partie
commence.

**Ce que la carte invente encore, c'est où tombent les gisements.** Ils sont
semés à la graine (`sim/carte.js`) par **bouquets** — un arbre seul n'est pas
une forêt, et c'est un bosquet qu'on veut trouver au bout d'un tapis —, chacun
dans l'étage où il naît, et il en porte donc la matière.

**Le pied du monde, lui, ne change jamais** : le centre de l'étage 1, ses trois
gisements de sucre écrits dans `data/monde.js`, et rien de tiré dans son rayon.
C'est ce qui permet au tutoriel de nommer des cellules précises et à l'usine de
départ d'être posée d'avance — la carte change autour d'eux, jamais sous eux.
Un scénario porte sa graine : fixe pour le tutoriel et l'usine qui tourne,
tirée pour le bac à sable.

Un biome est une **couleur posée sur le noir à une transparence basse**, en
trois nuances — de seize à vingt-huit pour cent. Elles ont doublé : à huit pour
cent le sol était presque noir, on voyait les biomes de loin sans voir leur
couleur. Les six directions comparées sont dans `labo/sols.html`. Le passage d'un biome à l'autre n'est que le mélange des deux
teintes, sur deux cellules : il n'existe aucune tuile de raccord, et la largeur
du fondu est un réglage. Les textures sont minimales — un point d'un pixel, ou
un trait d'un pixel d'épaisseur et de deux à trois de long.

**Rien de régulier dans le sol.** Trois choses le faisaient ressembler à du
carrelage, et toutes les trois sont parties : un semis unique par biome, qui
répétait les mêmes points dans chaque case à quarante-huit unités d'intervalle
(chaque cellule choisit maintenant le sien parmi douze) ; un pixel d'angle en
ardoise, pleine couleur sur un sol à dix pour cent, qui dessinait un
quadrillage de points brillants (il est passé à la teinte de la texture) ; et
une formule de nuance qui faisait des rayures en diagonale (c'est un bruit doux
à trois échelles). La frontière entre deux étages ondule au lieu de suivre une
droite. Rien n'est tiré au moment de dessiner : tout est fonction de la
cellule, sinon le sol scintillerait d'une image à l'autre.

**La distance est la ressource.** Le gisement à trois cases coûte trois
convoyeurs, celui à vingt en coûte vingt : la progression sort de la
géographie, pas d'un multiplicateur. C'est ce que le téléporteur annulait, et
c'est pourquoi il a disparu. Il pourra revenir bien plus tard, en déblocage de
fin, pour relier deux points éloignés.

**Quatre touches dans la barre : main, convoyeur, construction, destruction.**
La main est celle du repos — on regarde le monde avant de le changer, et le
doigt y tire le monde. **Le convoyeur a la sienne**, au premier rang : c'est
neuf gestes sur dix, et il coûtait aussi cher qu'une plieuse — ouvrir le menu,
viser sa rangée, la toucher. Les six bâtiments restent derrière
« construction », qui n'ouvre plus un menu que pour eux.

**Le tracé est le geste du convoyeur, et de lui seul.** En main on regarde, en
construction on pose : ni l'un ni l'autre ne tire un tapis. Pendant un tracé,
arriver au bord de la fenêtre fait défiler tout seul, pour qu'un convoyeur
traverse deux écrans sans que le doigt se lève.

**Un cran de recul, et un seul.** Une touche du second rang, à côté de la
mini-carte, éloigne la vue : la cellule passe de 48 à 24 et la fenêtre montre
15 × 26,7 cellules au lieu de 7,5 × 13,3. On recule autour de ce qu'on
regardait, et un second appui revient. Le zoom sert à voir de **loin, jamais
de près** : le niveau où l'on bâtit est déjà le plus gros.

**La pince y mène aussi** : écarter les doigts rapproche, les rapprocher
éloigne. Elle ne fait que choisir l'un des deux crans — il n'y a rien entre
les deux, donc rien à suivre en continu : on attend que l'écart ait changé
d'un quart, et on y va d'un coup. Deux doigts règlent ce qu'on regarde et
jamais le monde : un tracé commencé à un doigt est défait quand le second se
pose. Sans ce geste c'est le navigateur qui répondait — iOS ignore
`user-scalable=no` depuis dix ans, et une pince y faisait grossir la page.

Il n'y a rien entre les deux, rien en dessous, et ce n'est pas un réglage :
une image de pixel art ne se met à l'échelle qu'en nombre entier de fois. À
48, un pixel d'art vaut deux unités logiques ; à 24, il en vaut une, et il n'y
a rien sous une unité. C'est aussi pourquoi reculer ne coûte aucune finesse et
ne cache rien : c'est l'art à sa résolution native, pas une réduction.

**La simulation n'en sait rien.** La cellule vaut 48 pour elle quoi qu'il
arrive, et un tapis avance toujours à 96 unités par seconde : le débit ne
dépend jamais de ce qu'on regarde. Un seul endroit du rendu connaît l'échelle,
`cadrerMonde()` dans `camera.js` ; tout le reste dessine en unités du monde.

### Les étages, et les murs qui les séparent

**Écrit, et jouable sur deux étages.** La forme est arrêtée depuis longtemps ;
elle est maintenant dans le code — `data/zones.js`, `sim/mur.js`,
`render/mur.js`. **Deux étages sont jouables**, le temps de voir si la
mécanique tient : le monde du sucre et celui des fraises. Les trois du dessus
existent — le monde fait toujours soixante rangées, et son sol se peint jusqu'en
haut — mais leur mur ne s'ouvre pas, et ce qu'ils contiennent reste à décider.
Ce qui manque encore est dit en fin de section.

**On ne progresse que vers le haut.** Le monde se lit en **étages**, des bandes
horizontales de douze rangées sur les quarante-deux de large. Cinq étages
tiennent dans les soixante rangées du monde, et un étage fait presque un écran
de haut : quand on est à son pied, on voit le mur qui le ferme.

**Un étage, un biome, une matière.** Le monde du sucre, celui des fraises,
celui de la menthe, la forêt. C'est ce qui rend le mur *nécessaire* et non
décoratif : l'étage du dessus ne peut rien faire de neuf sans ce que produit
celui du dessous. La chaîne doit donc **traverser le mur**, et l'usine d'en bas
continue de tourner pour toujours. On ne recommence jamais : on rallonge.

**L'étage 1 est le monde du sucre, et son sucre entre dans toutes les
recettes, jusqu'au dernier étage.** Il ne devient donc jamais un souvenir : à
chaque mur ouvert, la demande sur lui augmente. C'est la boucle du jeu —
ouvrir un mur, voir l'étage 1 étouffer, redescendre l'élargir. Redescendre
n'est pas une corvée de réparation, c'est le jeu.

C'est le sucre et non la fraise parce qu'il y a du sucre dans tous les bonbons,
qu'un enfant le sait, et que `sucre → chaufferie → livraison` est exactement le
noyau à trois machines qui existe déjà : l'étage 1 ne coûte pas une donnée.

**Un mur demande le produit de l'étage qu'il ferme** — du caramel pour le
premier, le bonbon à la fraise pour le deuxième. On ne réclame jamais ce qu'on
ne sait pas encore faire, et le but est toujours « fais ce que tu viens
d'apprendre, en plus grand ». Le total livré au mur ne se dépense pas : il
monte pendant que la caisse, elle, se dépense. Deux nombres, deux rôles, aucun
arbitrage à expliquer.

**Un mur ouvert redevient du sol ordinaire.** Pas de porte, pas de goulot d'une
case où les tapis s'étranglent : ouvert veut dire franchi, on n'y pense plus.

**Ce qu'un mur montre, et pas un mot** : une rangée de blocs en ardoise, ce
qu'il y a derrière éteint, et sur lui une plaque qui porte la matière réclamée
et une jauge qui se remplit. La plaque suit le milieu de l'écran — le mur fait
quarante-deux cases et la fenêtre en montre sept, une jauge posée une fois pour
toutes serait hors de vue neuf fois sur dix.

**Le premier mur demande cent caramels**, et c'est mesuré (`node
outils/mur.mjs`) : l'usine des trois branches que le tutoriel bâtit l'ouvre en
une minute quarante, une branche seule en près de cinq. L'écart est le
message — on n'attend pas, on agrandit. À quarante, il tombait en
quarante-trois secondes sans qu'on ait rien à faire.

**Ce que le mur coûte vraiment**, et c'est peu : une rangée où l'on ne peut pas
bâtir, un plafond sur les bornes de la caméra qui remonte quand il tombe, et un
seuil. Le monde ne grandit pas — il fait toujours 42 × 60 — c'est ce qu'on peut
atteindre qui grandit, et le scroll s'allonge tout seul.

**Chaque étage apporte une mécanique**, pas seulement une matière : l'étage 1
ouvre l'extracteur et la chaufferie, l'étage 2 le trieur — deux matières sur la
carte, donc une raison d'en avoir un. C'est ce qui donne à un mur une
récompense au-delà de « une case de plus à récolter », et c'est là que le jeu
grossira sans grossir en systèmes — un étage est une entrée de table.

**Ce qui n'est pas ouvert n'est pas montré.** Le menu de construction ne porte
que ce que les murs ont donné : au pied du monde, un extracteur et une
chaufferie, et c'est tout ce qu'il y a à comprendre. Une touche éteinte dirait
qu'il y a autre chose, et c'est déjà ce que dit le mur — il n'y a pas deux
façons de dire la même chose à un enfant.

**La mini-carte montre les étages fermés en éteint**, comme le livre des
matières montre les silhouettes de ce qu'on n'a pas trouvé : on voit qu'il y a
quelque chose là sans savoir encore quoi. Elle devient la barre de progression
du jeu entier.

**Ce que cela a retiré.** La clairière du centre : son rôle — un peu de tout au
milieu, pour faire un bonbon sans traverser quoi que ce soit — est repris par
l'étage 1, qui se suffit à lui-même. Le tutoriel a rétréci d'autant, de
dix-sept étapes à treize.

**Ce que cela a simplifié.** `sim/carte.js` tirait vingt-six régions au hasard
dans le plan, avec des garanties par matière et un plancher de rattrapage. Des
bandes d'une matière chacune, c'est moins : le biome est donné par la rangée,
les bouquets se sèment dedans, et le plancher a disparu.

**Deux chiffres mesurés, qui disent que ça tient.** Un tapis porte au plus
3,56 items par seconde, un extracteur en sort 0,36 : **un seul tapis monte donc
la récolte de dix extracteurs**. Le sucre de l'étage 1 n'aura pas besoin de
quatre tapis parallèles sur quarante rangées — un suffit très longtemps, et le
goulot reste les gisements, c'est-à-dire la géographie.

**La sauvegarde venait avant.** Perdre quatre étages à un rechargement de page
est intolérable. Elle est faite : la partie s'écrit et se reprend (section 1,
`save/run.js`), et l'étage ouvert en fait partie.

### Ce qui manque encore aux étages

À décider, et rien n'est codé dans ce sens :

- **ce que réclame le mur de l'étage 2.** La fraise seule ne fabrique rien — la
  pastille demande aussi la menthe —, et on ne réclame jamais ce qu'on ne sait
  pas encore faire. Son mur ne s'ouvre donc pas : le jeu s'arrête là.
- **ce qu'est le cinquième étage.** Il y a quatre matières et cinq bandes. La
  cinquième porte pour l'instant le biome de terre et aucun gisement.
- **les trois bonbons et le papier**, qui demandent la forêt et la menthe :
  l'étage 3 ouvre la confiserie et l'étage 4 la scierie et la plieuse, mais
  aucun des deux murs n'a de seuil.

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
| Niveaux de zoom | cellule à 48 (bâtir) ou 24 (regarder), rien d'autre |
| Fenêtre | l'écran entier : 7,5 × 13,3 cellules, 15 × 26,7 en reculant |
| Monde | 42 × 60 cellules, soit trente-six fenêtres |
| Cible tactile minimale | 48 unités logiques |
| Mise à l'échelle | entière uniquement (×1, ×2, ×3), jamais fractionnaire |
| Rendu | `image-rendering: pixelated`, pas d'interpolation |

La cible tactile de 48 est volontairement supérieure à la recommandation adulte
habituelle. C'est un choix lié au public, pas une approximation.

### Palette

**Seize couleurs, pas dix-sept.** Elle en portait huit, et ces huit-là
n'étaient pas huit couleurs choisies : c'étaient huit des seize de **Sweetie
16**, prises une sur deux. Les huit autres existaient donc déjà en creux et
s'accordent par construction — deux nuits pour les ombres, deux clartés pour
les reflets, trois teintes de plus pour varier. Passer à seize n'a fait entrer
aucune couleur étrangère. Ajouter une dix-septième demande mon accord.

| Nom | Hex | Usage |
|---|---|---|
| `--noir` | `#1a1c2c` | fond, contours |
| `--prune` | `#5d275d` | ombre du rouge |
| `--rouge` | `#b13e53` | ressource A, état bloqué, destruction |
| `--orange` | `#ef7d57` | ressource B, refermer |
| `--jaune` | `#ffcd75` | ressource C, énergie, pause |
| `--anis` | `#a7f070` | clarté du vert |
| `--vert` | `#38b764` | ressource D, validation, construction |
| `--sarcelle` | `#257179` | ombre du vert, le recul |
| `--nuit` | `#29366f` | chevrons du tapis |
| `--outremer` | `#3b5dc9` | ombre du bleu |
| `--bleu` | `#41a6f6` | ressource E, la bande du tapis |
| `--cyan` | `#73eff7` | clarté du bleu, crans du tapis |
| `--creme` | `#f4f4f4` | texte, surbrillance, le repos |
| `--brume` | `#94b0c2` | ombre du crème |
| `--ardoise` | `#566c86` | grille, machines inertes |
| `--profond` | `#333c57` | ombre de l'ardoise |

**Une couleur a trois faces** — sa clarté, son corps, son ombre — et rien n'y
est calculé : Sweetie 16 est faite de rampes, et une couleur y a presque
toujours sa voisine plus claire et sa voisine plus sombre. Un dégradé du jeu
n'est donc jamais un mélange, mais trois couleurs déclarées (`FACES` dans
`design.js`).

**Le tapis est bleu électrique** : bande en plein bleu, crans de cyan,
chevrons au nuit. Il était ardoise, de la couleur des machines inertes, alors
que c'est ce qu'on trace neuf fois sur dix. Le bleu plutôt que l'outremer est
mesuré, pas choisi : ce qui détache une matière du tapis n'est pas sa couleur
mais le noir qui la cerne, et ce noir tranche à 6,43 : 1 sur le bleu contre
2,88 : 1 sur l'outremer. Cinq matières sur dix n'y tiennent plus que par leur
contour, et c'est le prix assumé d'une bande vive — leur forme les nomme.

Chaque type d'item doit être identifiable **par sa forme seule**, en niveaux de
gris. La couleur est une confirmation, jamais l'unique porteuse d'information.

C'est la **silhouette colorée** qui porte la forme, pas le contour : sur un sol
sombre, le noir du contour disparaît, et il ne reste que la couleur. Un rond
dont seul le contour est rond se lit comme une croix. Les items sont donc des
matrices de 9 × 9 pixels d'art (`MOTIFS` dans `render/motifs.js`, table pure
que l'outil de lisibilité relit hors du navigateur), où la
couleur remplit la forme et le noir la cerne.

**Dérogation validée : les sols des biomes.** Composer une couleur de la
palette sur le noir crée des teintes qui n'y figurent pas. Elles restent basses
— de 16 % à 28 % — et ne servent qu'au sol, jamais à un élément. Les seize
couleurs deviennent donc seize familles, et rien d'autre n'y a droit.

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

**La touche est un bonbon** : vernie, bombée, posée sur une ombre de sa propre
couleur. C'est la direction retenue au labo (`labo/touches.html`, direction 2).
Tout est dans `render/plaque.js` — aucun autre module ne dessine de touche :

- **La forme.** Rien n'est rond dans une usine faite de cases : un rond n'est
  donc jamais qu'un bouton. La touche fait **56 unités** et porte une icône de
  48 — le rond s'est élargi pour l'accueillir, sinon la croix et la main
  sortaient par les coins. Les boutons larges, qui portent un mot, sont des
  **pilules** de même facture.
- **Le bombé.** Une rampe verticale de la clarté à l'ombre en passant par le
  corps, un reflet au sommet, un creux au pied. Le corps occupe le milieu :
  c'est sur lui que le signe se lit, et c'est lui que l'outil de lisibilité
  mesure.
- **L'ombre.** Portée, floue, de la couleur du bonbon — elle a remplacé le
  socle. Elle se resserre quand la touche descend, et c'est elle qui donne la
  hauteur. Une exception mesurée : la touche ardoise porte une ombre de brume,
  parce que la sienne est le profond, qui ne se détache du noir qu'à 1,54 : 1.
- **L'appui.** Le corps descend tant que le doigt le tient, puis part sur un
  ressort quand il se lève, dépassant le repos avant de s'y poser. C'est la
  seule animation de touche du jeu. Au fond, **le bombé se retourne** : la
  lumière passe dessous, et une touche enfoncée se lit enfoncée même arrêtée.

**L'interface n'est pas du pixel art**, et c'est la seule dérogation à la
règle. Les touches étaient peintes sur une grille de vingt-huit pixels d'art
puis agrandies : un rond de vingt-huit pixels est un escalier, un dégradé de
vingt-huit pixels est trois bandes, et une ombre floue n'y existe pas. Elles
sont tracées en courbes, à la résolution de l'écran — et **les signes qu'elles
portent aussi** : la main, le plus, la croix, la pause, les crans du zoom
(`render/signes.js`, repris du labo au chemin près). Une touche nette qui porte
un signe crénelé se voit tout de suite ; les deux allaient ensemble.

**Le monde, lui, reste peint au pixel.** Une machine, une matière, un gisement
se dessinent toujours pixel par pixel : ce sont des objets du jeu, pas des
commandes, et c'est là que passe la frontière. Un bouton est une courbe, ce
qu'il montre est un pixel.

**La couleur d'une touche dit la famille de son action**, jamais son
importance. Cinq familles : crème pour le repos et la lecture, bleu pour le
convoyeur, vert pour bâtir et repartir, rouge pour détruire, jaune pour
suspendre et pour ce qui règle la vue plutôt que le monde. Une touche qui porte
l'image d'une chose du monde — une machine, une matière — reste sombre : ces
images sont déjà en couleur, et une matière rouge sur un bonbon rouge n'existe
pas.

**Deux rangs de boutons.** Le premier agit sur le monde : les outils, les
éléments à poser, les choix d'un écran. Il est clair, large — 56 unités — et
porte une icône de 48. Le second règle ce qu'on regarde sans rien changer au
monde : la pause d'une machine, le bouton qui passe le tutoriel. Il est plus
petit — 40 unités —, sombre, et se pose **à droite du titre** de ce qu'il
règle, jamais dans la rangée des actions.

**La sélection est un enfoncement, jamais un cadre.** L'outil en cours, la
matière triée, l'élément choisi dans le menu : tous sont la touche restée au
fond. Il n'y a plus aucun cadre de sélection dans le jeu.

**Chaque touche porte le signe qui tranche sur son corps**, et cela ne se
choisit plus : `signeSur()` prend le noir ou le crème, celui des deux qui
tranche. La règle existait déjà et s'appliquait sprite par sprite — la croix de
destruction avait dû être repeinte le jour où sa touche est devenue rouge.
Elle se calcule.

Les huit premières propositions, en pixels, sont dans `labo/boutons.html` ; les
dix suivantes, hors du pixel art, dans `labo/touches.html`.

### Lisibilité : elle se vérifie, elle ne se suppose pas

`node outils/lisibilite.mjs` relit le design system hors du navigateur et
échoue si quelque chose ne se lit plus. Il tourne avant toute livraison
visuelle, comme `outils/tapis.mjs` avant toute livraison de convoyeurs. Ce
qu'il tient :

- **Le contraste** de chaque paire de couleurs qu'on pose l'une sur l'autre,
  au rapport WCAG : 4,5 pour du texte, 3 pour un signe. Les paires sont
  déclarées dans l'outil — une nouvelle s'y ajoute le jour où on la dessine.
  Ce qui détache une matière du tapis n'est pas sa couleur — depuis que la
  bande est bleue, cinq matières sur dix ne tranchent plus dessus — mais **le
  noir qui la cerne** : c'est lui qui est mesuré, et l'outil nomme celles qui
  ne tiennent que par là.
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
avec ses « !!! », qui sort de l'endroit bloqué. **Une bulle ne sort que là où
la chaîne s'arrête pour de bon** — tout le reste se tait :

- le bouchon est en aval ? on se tait. C'était la règle pour un tapis ; elle
  vaut aussi pour une machine dont tous les tapis de sortie sont bouchés,
  sinon le cri remonte la chaîne au lieu d'en montrer le bout ;
- rien où aller ? on se tait. Un tapis qu'on vient de tracer et qui ne débouche
  sur rien n'est pas bouché, il est inachevé, et le joueur le sait. Un
  extracteur ou un trieur qu'aucun tapis ne quitte encore, pareil ;
- une seule bulle par machine. Deux tapis pleins qui butent sur la même
  confiserie affamée disaient deux fois la même chose.

Le délai est de **4 s** et non de 1,2 : une usine qui vit a des à-coups tout
le temps, et 1,2 s en attrapait la plupart. Sur une scène de débutant — un
extracteur non relié, un tapis tracé dans le vide, une machine nourrie de la
mauvaise matière — on passe de quatre bulles à une, et c'est la bonne.

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

Six outils gardent le jeu, et ils tournent avant toute livraison :
`outils/tapis.mjs` pour les convoyeurs, `outils/lisibilite.mjs` pour ce qui se
lit, `outils/tutoriel.mjs` qui joue les treize étapes du premier contact,
vérifie qu'au bout l'usine livre, que le tutoriel reste payable avec la mise de
départ et qu'aucune étape ne demande une machine que l'étage ouvert ne donne
pas, `outils/carte.mjs` qui tire trois cents cartes et relit ce qu'elles
promettent — pied du monde intact, chaque gisement dans son étage, aucun sur
une rangée de mur —, `outils/mur.mjs` qui bâtit l'usine de l'étage 1 et regarde
le mur tomber, et `outils/sauvegarde.mjs`, qui écrit des parties et les relit.

Ce dernier exige trois choses d'une partie relue : qu'elle soit **saine** — les
mêmes invariants que l'originale, relus par le même juge (`outils/invariants.mjs`,
partagé avec `outils/tapis.mjs` : deux listes d'invariants finissent toujours
par diverger) ; qu'elle soit **la même** — la comparaison porte sur les objets
vivants et non sur ce que la sauvegarde a écrit, si bien qu'un champ oublié se
voit ; et qu'elle **se comporte pareil** — les deux parties tournent dix
secondes de plus et doivent encore être identiques. C'est la vraie preuve :
une partie qui se relit puis dérive n'est pas sauvegardée.

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
  camera.js         quelle partie du monde la fenêtre montre, et à quelle échelle
  tutoriel.js       où en est le premier contact
  maj.js            la veille : le jeu se recharge quand le serveur a mieux
  loop.js           boucle à pas fixe
  anim.js           ressorts d'interface (Motion)
  sim/
    grid.js         grille, occupation des cellules
    scene.js        une grille, ses machines, ses convoyeurs
    belt.js         files compressées, déplacement des items
    machine.js      production, consommation, stocks
    gisement.js     gisements, extraction, repousse
    carte.js        les étages, et les gisements tirés à la graine
    mur.js          ce qui ferme un étage, et ce qu'il faut lui livrer
    world.js        état de la partie en cours
  save/
    run.js          la partie en cours, écrite et relue
    meta.js         l'état permanent, séparé — et vide
  data/
    items.js        table des items
    machines.js     table des machines
    monde.js        les gisements du pied du monde, cadences d'extraction
    biomes.js       biomes, bouquets, fondu
    zones.js        les étages : biome, matière, ce qu'ils ouvrent, leur mur
    depart.js       dispositions de départ : usine qui tourne, carte nue
    scenarios.js    les trois essais de la bêta
    tutoriel.js     étapes du premier contact
    version.js      le numéro de version, et rien d'autre
    outils.js       outils, éléments constructibles, et ce qu'ils coûtent
    recipes.js      table des recettes
  render/
    canvas.js       mise à l'échelle
    biome.js        la teinte de chaque cellule
    minicarte.js    le monde entier, dans le voile du haut
    mur.js          la rangée du mur, ce qu'il demande, et ce qu'il cache
    choix.js        l'écran des essais
    tutoriel.js     halo des cellules à toucher, bandeau de l'étape
    menu.js         menu pause et page des recettes
    toast.js        le bandeau qui annonce et s'en va
    texte.js        fonte bitmap 5 × 7, texte explicable
    motifs.js       les matières en pixels d'art, table pure
    signes.js       les signes de l'interface, en courbes
    plaque.js       les touches : forme, ombre, enfoncement
    demarrage.js    barre de chargement
    particules.js   fumée et étoiles
    vapeurs.js      les souffles des machines, table de formes
    pose.js         la cellule qu'on vient de poser, et son éclat
    chevron.js      les chevrons qui défilent le long d'un tapis
    alerte.js       la bulle « !!! » d'un bouchon qui dure
    sprites.js      atlas, dessin des tuiles
    bouton.js       l'appui d'une touche, par clé
    hud.js          compteurs, boutons
  input/
    pointer.js      gestes unifiés, tracé, et la caisse
```

`data/` ne contient que des tables. Aucune logique. C'est là que le jeu grossit.

**Ce qui n'existe pas encore, et qu'on ne prétend pas avoir.** Ce fichier a
longtemps décrit trois modules qui n'ont jamais été écrits — `save/run.js`,
`save/meta.js`, `data/zones.js`. Ils le sont tous les trois, et la liste est
vide. `data/progression.js` n'a plus lieu d'être : un palier *est* un mur.

Rien de ce qui n'existe pas ne doit être décrit ailleurs dans ce fichier comme
s'il existait. C'est arrivé pendant des semaines : trois modules fantômes y
étaient documentés au présent.

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
seule grille de 42 × 60 cellules, où l'on mine et où l'on construit au même
endroit. La bêta y ajoute ses trois essais et le tutoriel du premier contact,
et l'économie ses prix : la livraison achète, et bâtir coûte. Ces ajouts sont
décrits en section 1.

**Critère de validation : 200 items à l'écran à 60 fps sur téléphone.**
Remesuré depuis, avec l'espacement à 27, le cran de recul et la carte qui
prend tout l'écran : dix-neuf longs tapis remplis, 200 items à l'échelle où
l'on bâtit et 400 en reculant, image médiane 16,7 ms dans les deux cas —
60 fps, et la pire image à 25,2 ms. Le recul ne coûte rien alors qu'il double
ce qui est à l'écran, et le plein écran non plus, alors qu'il ajoute un tiers
de cellules à dessiner.

C'est mesuré dans un Chromium sans fenêtre, pas sur un téléphone : le chiffre
est bon, la cible ne l'est pas encore. Il reste à le refaire sur l'appareil.

Tant que ce chiffre n'est pas mesuré, aucune recette, aucun déblocage, aucune
courbe, aucun prestige. Si le critère n'est pas tenu, on bascule sur un débit
abstrait plutôt que des items discrets — et il vaut mieux le savoir la première
semaine.
