// L'état permanent : ce qui survit à une partie.
//
// Il est vide, et c'est voulu. Rien de permanent n'existe encore — le prestige
// n'est pas écrit — mais l'état de la partie et l'état permanent sont deux
// structures distinctes, sauvegardées séparément, et c'est une décision du
// premier jour. Les mêler une fois, c'est ne plus jamais pouvoir les séparer :
// une sauvegarde de partie qui traîne un compteur permanent le perd à chaque
// nouvelle partie, et on ne s'en aperçoit que le jour où il compte.
//
// Ce module existe donc pour tenir la séparation, pas pour porter quelque
// chose. Le jour où le prestige arrive, c'est ici qu'il s'écrit, et la
// sauvegarde de partie n'a pas à changer d'une ligne.

export const FORMAT_PERMANENT = 1;

const CLE = 'factokid.permanent';

export function creerPermanent() {
  return { format: FORMAT_PERMANENT };
}

export function lirePermanent() {
  try {
    const brut = localStorage.getItem(CLE);
    if (!brut) return creerPermanent();
    const lu = JSON.parse(brut);
    // Un permanent illisible se remplace en silence : il ne porte rien, et
    // rien n'est donc perdu. Le jour où il portera quelque chose, il méritera
    // le même égard que la partie — écarté, mis de côté, annoncé.
    return lu && lu.format === FORMAT_PERMANENT ? lu : creerPermanent();
  } catch { return creerPermanent(); }
}

export function ecrirePermanent(permanent) {
  try {
    localStorage.setItem(CLE, JSON.stringify(permanent));
    return true;
  } catch { return false; }
}
