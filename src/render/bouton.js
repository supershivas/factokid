// L'appui d'une touche : elle descend sur son socle, y reste tant que le doigt
// la tient, puis rebondit quand il la lâche. Pure présentation — la simulation
// n'en sait rien, et le rendu ne fait que lire.
//
// Le socle, lui, ne bouge jamais : c'est le sol du bouton. Seul le corps
// voyage, et c'est ce qui rend l'enfoncement lisible (voir plaque.js).
//
// Les touches se désignent par une clé quelconque : « outil:1 », « menu:2 »,
// « option:0 ». Un seul système d'appui pour tous les boutons du jeu.

// Le ressort du relâchement : il remonte, dépasse le repos, et se pose. Les
// deux réglages sont l'amortissement et la pulsation — le dépassement vaut
// exp(-λπ/ω), soit un peu moins des deux tiers de la course ici.
const AMORTI = 4.5;
const PULSATION = 26;

const DUREE = 1;        // secondes : au-delà, le ressort est éteint
const MAINTIEN_MAX = 2; // un doigt perdu ne laisse pas une touche au fond

const touches = new Map();

// Le doigt se pose : la touche descend d'un coup et y reste.
export function presser(cle) {
  touches.set(cle, { phase: 'bas', age: 0 });
}

// Le doigt se lève : le ressort part du fond.
export function relacher(cle) {
  const t = touches.get(cle);
  if (!t || t.phase !== 'bas') return;
  t.phase = 'rebond';
  t.age = 0;
}

export function majAppuis(dt) {
  for (const [cle, t] of touches) {
    t.age += dt;
    // Un appui qu'on n'a jamais vu se lever — capture de pointeur volée,
    // doigt sorti de l'écran — remonte quand même : rien ne doit rester
    // enfoncé pour toujours.
    if (t.phase === 'bas' && t.age > MAINTIEN_MAX) { t.phase = 'rebond'; t.age = 0; }
    if (t.phase === 'rebond' && t.age >= DUREE) touches.delete(cle);
  }
}

// De 1 (au fond, posée sur son socle) à 0 (au repos). Le rebond passe dans les
// négatifs : la touche décolle de son socle avant de s'y reposer.
export function enfoncement(cle) {
  const t = touches.get(cle);
  if (!t) return 0;
  if (t.phase === 'bas') return 1;
  const a = t.age;
  return Math.exp(-AMORTI * a)
    * (Math.cos(PULSATION * a) + (AMORTI / PULSATION) * Math.sin(PULSATION * a));
}
