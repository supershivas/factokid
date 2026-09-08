// La veille : le jeu regarde de temps en temps si le serveur en porte une
// version plus récente, et se recharge tout seul.
//
// C'est un système de plus, et il est assumé : sans lui, un téléphone qui a
// ouvert la page une fois la garde telle quelle jusqu'à ce qu'on pense à la
// rafraîchir — et pendant une bêta, c'est la version d'hier qu'on essaie.
//
// Il n'y a pas de fichier de version à part : la veille relit
// `data/version.js`, qui est la seule source. Un second fichier à tenir en
// accord avec le premier finit toujours par diverger.
//
// **Jamais sous les doigts du joueur.** Il n'y a pas encore de sauvegarde :
// recharger en pleine partie perdrait l'usine. La mise à jour s'applique donc
// quand personne ne joue — sur l'écran des essais, ou dès que l'onglet passe
// à l'arrière-plan. Entre les deux, on se contente de l'annoncer. Le jour où
// la partie se sauvegarde, cette prudence n'aura plus lieu d'être.

import { VERSION } from './data/version.js';
import { annoncer } from './render/toast.js';

const INTERVALLE = 90;        // secondes entre deux regards
const APRES_ECHEC = 900;      // secondes : on a rechargé pour rien, on attend
const CLE_VUE = 'factokid.version';   // la version qu'on avait la fois d'avant
const CLE_MAJ = 'factokid.maj';       // la version pour laquelle on a rechargé

const SOURCE = new URL('./data/version.js', import.meta.url);

// Le stockage peut être refusé — navigation privée, réglage du navigateur.
// Rien ici n'est essentiel : on se passe de mémoire plutôt que d'échouer.
function lire(cle, ou) {
  try { return ou.getItem(cle); } catch { return null; }
}
function ecrire(cle, valeur, ou) {
  try { ou.setItem(cle, valeur); } catch { /* tant pis */ }
}

// Le numéro que porte le fichier du serveur. On le lit dans le texte : c'est
// une table d'une seule ligne, et la relire ainsi évite d'avoir à la doubler.
async function versionDistante() {
  const url = new URL(SOURCE);
  url.searchParams.set('t', Date.now());
  const reponse = await fetch(url, { cache: 'no-store' });
  if (!reponse.ok) return null;
  const trouve = (await reponse.text()).match(/VERSION\s*=\s*'([^']+)'/);
  return trouve ? trouve[1] : null;
}

export function creerVeille(jeu) {
  let horloge = 0;
  let attente = INTERVALLE;
  let trouvee = null;      // la version que le serveur porte et que nous n'avons pas
  let enCours = false;

  // Au démarrage : dire ce qui a changé, si quelque chose a changé. La toute
  // première ouverture ne dit rien — on n'annonce pas une mise à jour à qui
  // n'avait rien avant.
  const avant = lire(CLE_VUE, localStorage);
  if (avant && avant !== VERSION) annoncer('mis à jour  v' + VERSION, 'vert');
  ecrire(CLE_VUE, VERSION, localStorage);

  // On a rechargé pour une version qu'on n'a toujours pas : les fichiers
  // servis étaient encore ceux d'avant. On ne recharge pas en boucle — on
  // laisse le cache du serveur expirer et on regardera plus tard.
  const vise = lire(CLE_MAJ, sessionStorage);
  if (vise && vise !== VERSION) attente = APRES_ECHEC;
  else ecrire(CLE_MAJ, '', sessionStorage);

  function appliquer() {
    ecrire(CLE_MAJ, trouvee, sessionStorage);
    location.reload();
  }

  // Le moment est bon si personne ne joue : l'écran des essais tient l'écran,
  // ou l'onglet n'est plus regardé.
  function momentSur() {
    return !jeu.monde || document.visibilityState === 'hidden';
  }

  async function regarder() {
    if (enCours || trouvee) return;
    enCours = true;
    try {
      const distante = await versionDistante();
      if (distante && distante !== VERSION) {
        trouvee = distante;
        annoncer('nouvelle version  v' + distante, 'jaune');
        if (momentSur()) appliquer();
      }
    } catch { /* hors ligne : on regardera plus tard */ } finally {
      enCours = false;
    }
  }

  // Revenir sur l'onglet est le bon moment pour regarder ; le quitter est le
  // bon moment pour appliquer.
  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (trouvee) appliquer();
    } else {
      horloge = attente;
    }
  });

  return function majVeille(dt) {
    if (trouvee) {
      // La nouvelle est connue : il ne reste qu'à attendre que le joueur pose
      // le téléphone, ou qu'il revienne aux essais.
      if (momentSur()) appliquer();
      return;
    }
    horloge += dt;
    if (horloge < attente) return;
    horloge = 0;
    attente = INTERVALLE;
    regarder();
  };
}
