// Les six figures de vapeur, telles qu'elles ont été comparées au labo
// (labo/vapeur.js). Une machine qui réussit en tire deux au hasard et les
// souffle ensemble : deux bouffées ne se ressemblent jamais, et aucune n'est
// une figure pure — c'est le mélange qui fait la vapeur.
//
// Table pure : une figure ne sait que semer ses grains. Leur vie, leur
// freinage et leur dessin sont dans particules.js, et n'en bougent pas. Une
// figure de plus est une entrée de plus ici.
//
// `semer(grain, hauteur)` reçoit de quoi poser un grain :
//   grain(dx, dy, vx, vy, retard, duree, taille)
// où dx, dy sont relatifs au haut de la machine, vx, vy la vitesse de départ
// (le freinage fait le reste), et `retard` le temps avant que le grain naisse.
//
// Les vitesses sont des distances déguisées : sous un freinage de 6 par
// seconde, un grain lancé à v parcourt à peu près v / 6 unités avant de
// s'arrêter. C'est ainsi qu'on relit les nombres d'en dessous.

// Le freinage que particules.js applique à un grain de vapeur : il est ici
// parce que c'est lui qui traduit une distance en vitesse de départ.
export const FREIN = 6;
const loin = (distance) => distance * FREIN;

// Un hasard sans mémoire : chaque grain d'une même bouffée tire le sien.
const ecart = (amplitude) => (Math.random() - 0.5) * amplitude;

const SOUFFLE = 0.45; // durée de référence d'une bouffée

export const VAPEURS = [
  {
    id: 'jet',
    // Un seul souffle droit vers le haut, qui s'évase en montant : au départ
    // un trait, à la fin un nuage.
    semer(grain) {
      for (let i = 0; i < 7; i++) {
        grain(0, -4, ecart(loin(14)), -loin(34), i * 0.035, SOUFFLE, 5 + i);
      }
    },
  },
  {
    id: 'flancs',
    // La presse lâche par ses deux côtés : on voit ce qui appuie.
    semer(grain) {
      for (const cote of [-1, 1]) {
        for (let i = 0; i < 4; i++) {
          grain(cote * 14, 4 - i, cote * loin(26 - i * 3), -loin(5), i * 0.045, SOUFFLE + i * 0.04, 6 + i * 1.5);
        }
      }
    },
  },
  {
    id: 'ronde',
    // Une seule masse qui enfle et se dissipe : douce, presque un soupir.
    semer(grain) {
      for (let i = 0; i < 6; i++) {
        const angle = (i / 6) * Math.PI * 2;
        grain(0, -6, Math.cos(angle) * loin(16), -Math.sin(angle) * loin(16) * 0.6, 0, SOUFFLE + 0.2, 9);
      }
    },
  },
  {
    id: 'anneau',
    // Un rond qui s'ouvre et s'amincit : le souffle vu de face.
    semer(grain) {
      for (let i = 0; i < 10; i++) {
        const angle = (i / 10) * Math.PI * 2;
        grain(0, -10, Math.cos(angle) * loin(26), -Math.sin(angle) * loin(26) * 0.45, 0, SOUFFLE + 0.25, 6);
      }
    },
  },
  {
    id: 'champignon',
    // Un trait fin qui monte, puis s'ouvre en tête : la vapeur des cocottes.
    semer(grain) {
      for (let i = 0; i < 3; i++) {
        grain(0, -6, ecart(12), -loin(27) + i * 14, i * 0.03, 0.42, 5);
      }
      for (let i = 0; i < 5; i++) {
        const cote = i % 2 ? 1 : -1;
        grain(0, -24, cote * loin(6 + i * 3), -loin(5), 0.16 + i * 0.02, 0.6, 7 + i * 1.5);
      }
    },
  },
  {
    id: 'souffles',
    // Trois bouffées qui se suivent : la machine expire trois fois, puis se tait.
    semer(grain) {
      for (let s = 0; s < 3; s++) {
        for (let i = 0; i < 4; i++) {
          grain(0, -4, ecart(loin(14)), -loin(26), s * 0.22 + i * 0.03, SOUFFLE * 0.7, 6 + i);
        }
      }
    },
  },
];

// Deux figures différentes, tirées au sort. Jamais la même deux fois dans la
// même bouffée : sinon on ne verrait qu'une figure jouée deux fois plus fort.
export function deuxAuHasard() {
  const a = Math.floor(Math.random() * VAPEURS.length);
  const b = (a + 1 + Math.floor(Math.random() * (VAPEURS.length - 1))) % VAPEURS.length;
  return [VAPEURS[a], VAPEURS[b]];
}
