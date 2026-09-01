// Les cellules qui viennent d'être posées tombent en place. Pure présentation :
// la simulation ne sait rien de cette animation.

const DUREE = 0.22;
const posees = new Map();

export function marquerPose(cx, cy) {
  posees.set(cx + ',' + cy, 0);
}

export function majPoses(dt) {
  for (const [cle, age] of posees) {
    const suivant = age + dt;
    if (suivant >= DUREE) posees.delete(cle);
    else posees.set(cle, suivant);
  }
}

// Décalage vertical d'une tuile qui vient d'être posée : elle arrive de haut.
export function chutePose(cx, cy) {
  const age = posees.get(cx + ',' + cy);
  if (age === undefined) return 0;
  const p = age / DUREE;
  return -Math.round(16 * (1 - p) ** 2);
}
