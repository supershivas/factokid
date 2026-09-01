// Table des cartes. Aucune logique ici.
// Une carte porte une ou plusieurs matières brutes, et son propre téléporteur.
// Ajouter une matière au jeu, c'est ajouter une entrée ici.

// Le héros : il va chercher ce qu'on lui désigne et le rapporte au
// téléporteur. Il ne se dirige pas, on lui montre.
export const HEROS = {
  vitesse: 150,       // unités logiques par seconde
  capacite: 4,        // ce qu'il porte avant de devoir rentrer
  ticksRamassage: 18, // le temps de se baisser
};

// Une mine posée sur un gisement le récolte toute seule.
export const MINE = {
  nom: 'mine',
  ticksParItem: 150,  // 2,5 s : bien plus lent qu'un héros attentif
};

export const CARTES = [
  {
    id: 'sucrerie',
    nom: 'sucrerie',
    items: ['sucre'],
    repousseTicks: 180,             // 3 s à 60 Hz
    teleporteur: { cx: 3, cy: 9 },  // en bas : on le touche pour rentrer
    gisements: [
      { cx: 1, cy: 1, item: 'sucre' }, { cx: 4, cy: 0, item: 'sucre' },
      { cx: 2, cy: 3, item: 'sucre' }, { cx: 5, cy: 2, item: 'sucre' },
      { cx: 0, cy: 5, item: 'sucre' }, { cx: 3, cy: 6, item: 'sucre' },
      { cx: 6, cy: 5, item: 'sucre' }, { cx: 1, cy: 7, item: 'sucre' },
      { cx: 5, cy: 7, item: 'sucre' },
    ],
  },
  {
    id: 'verger',
    nom: 'verger',
    items: ['fraise', 'menthe'],
    repousseTicks: 180,
    teleporteur: { cx: 3, cy: 9 },
    gisements: [
      { cx: 2, cy: 0, item: 'fraise' }, { cx: 5, cy: 1, item: 'menthe' },
      { cx: 0, cy: 2, item: 'fraise' }, { cx: 3, cy: 3, item: 'menthe' },
      { cx: 6, cy: 3, item: 'fraise' }, { cx: 1, cy: 5, item: 'menthe' },
      { cx: 4, cy: 6, item: 'fraise' }, { cx: 2, cy: 7, item: 'menthe' },
      { cx: 6, cy: 7, item: 'fraise' },
    ],
  },
];
