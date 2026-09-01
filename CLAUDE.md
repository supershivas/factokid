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
  production hors ligne.
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
- **Les matières viennent des cartes, pas de nulle part.** Il n'y a plus de
  machine qui produit à partir de rien : chaque matière brute a sa carte. Le
  joueur touche un gisement, le héros le ramasse, la matière arrive au
  téléporteur. Un gisement repousse après un délai.
- **Un téléporteur par carte**, posé sur la grille de l'usine, et le même en
  bas de la carte. Il accepte un convoyeur par côté : plusieurs mines peuvent
  l'alimenter. Une carte peut porter plusieurs matières : son téléporteur
  les sort mélangées sur un seul convoyeur. Le toucher côté usine ouvre son
  panneau et mène à sa carte ; le toucher côté carte ramène à l'usine.
- **Le héros ramasse, la mine automatise.** On désigne des gisements, le héros
  les fait dans l'ordre et rapporte au téléporteur. Une mine posée sur un
  gisement le récolte seule, plus lentement qu'un joueur attentif.
- **L'usine fabrique des bonbons.** La chaîne tient en trois recettes : le
  sucre fond en caramel ; caramel, fraise et menthe font la pastille ; la
  pastille et le papier font le bonbon. Deux cartes fournissent les quatre
  matières brutes, mélangées deux par deux.
- **Les trieurs et les transformateurs se construisent.** Trieur, chaufferie,
  confiserie et plieuse sont des éléments constructibles comme le convoyeur :
  on les pose sur une cellule libre de l'usine, et l'outil destruction les
  retire. Le téléporteur et la livraison, eux, restent en place.
- **Le tri se fait dans une machine, jamais sur un tapis.** Un trieur a deux
  branches : la matière que le joueur a choisie, et tout le reste. Le premier
  convoyeur tracé prend la matière choisie, le second ramasse le reste. La
  matière se change à tout moment depuis le panneau du trieur.
- **Les mines se relient au téléporteur.** Une mine garde sa récolte dans son
  propre stock ; il faut tracer un convoyeur jusqu'au téléporteur de la carte.
  Même grille, même geste que dans l'usine.
- **Les machines n'ont pas d'orientation.** Elles acceptent un convoyeur par
  côté, quel qu'il soit. Un enfant relie sans avoir à penser au sens ; les
  flèches d'entrée et de sortie suffisent à dire ce qui se passe. Pas de
  rotation, donc.
- **Un extracteur posé devant un tapis s'y raccorde tout seul**, et un tapis
  tracé devant un extracteur au repos le prend au passage. Le tapis est coupé
  juste avant la cellule voisine : la machine déverse dans la suite, à côté de
  ce qui l'alimentait déjà. Rien n'est inséré au milieu d'une file.
- **Le héros n'existe plus.** Sur une carte, on pose un extracteur sur un
  gisement et on le relie au téléporteur : c'est tout ce qu'il y a à y faire.
- **Appui court, appui long.** Un appui court fait la fonction principale de
  l'élément touché — un téléporteur mène à sa carte, un gisement se désigne.
  Un appui long ouvre ses informations et ses réglages.
- **La satisfaction vient du rythme des déblocages**, pas de la taille des
  nombres.
- **Cible : jouable au pouce par un enfant, sans lecture, sans urgence.**

### Deux écrans, une seule grille

L'usine et les cartes partagent la même grille logique, le même canvas et le
même geste. Une carte n'est pas un niveau : c'est la même surface, remplie de
gisements au lieu de machines. Changer d'écran ne change ni l'échelle, ni la
mise en page, ni le code de rendu.

La simulation de l'usine continue pendant qu'on est sur une carte.

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
| Pixel art natif | 16 × 16 par tuile |
| Cellule de grille | 48 unités logiques |
| Grille de départ | 7 × 10 cellules |
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

### Typographie

Le jeu doit être compréhensible sans savoir lire. Le texte est un confort pour
l'adulte, jamais un passage obligé pour l'enfant.

- Une seule famille, bitmap ou pixel, taille fixe.
- Deux tailles seulement : nombre (grand) et étiquette (petit).
- Pas de capitales tracées, pas de texte dans les boutons d'action — icônes.

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

Les événements pointeur sont unifiés (Pointer Events) : la souris produit
exactement les mêmes gestes que le doigt, tracé de convoyeur compris.

Toute vérification visuelle produit **les deux captures, systématiquement** :
la cible mobile et l'aperçu desktop. Jamais l'une sans l'autre. `outils/captures.mjs`
les génère toutes les deux.

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
  loop.js           boucle à pas fixe
  anim.js           ressorts d'interface (Motion)
  sim/
    grid.js         grille, occupation des cellules
    scene.js        une grille, ses machines, ses convoyeurs
    belt.js         files compressées, déplacement des items
    machine.js      production, consommation, stocks
    carte.js        gisements, ramassage, repousse
    world.js        état de la partie en cours
  data/
    items.js        table des items
    machines.js     table des machines
    cartes.js       cartes et gisements
    depart.js       disposition de départ, chemin pré-tracé
    outils.js       outils et éléments constructibles
    recipes.js      table des recettes
    progression.js  paliers de déblocage, courbe
  render/
    canvas.js       mise à l'échelle, culling
    particules.js   fumée et étoiles
    sprites.js      atlas, dessin des tuiles
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
(a + b = c), cartes, téléporteur et trieur, puis la chaîne complète du bonbon
et la construction des trieurs et des transformateurs. Ces ajouts sont décrits
en section 1.

**Critère de validation : 200 items à l'écran à 60 fps sur téléphone.**
Mesuré à 208 items, 60 fps, image médiane 16,7 ms — avant que l'espacement ne
passe à 27, qui plafonne désormais un long convoyeur à 121 items. Le chiffre
de 200 est donc à revoir ou à atteindre autrement.

Tant que ce chiffre n'est pas mesuré, aucune recette, aucun déblocage, aucune
courbe, aucun prestige. Si le critère n'est pas tenu, on bascule sur un débit
abstrait plutôt que des items discrets — et il vaut mieux le savoir la première
semaine.
