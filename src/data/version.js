// Le numéro de version du jeu. Table pure : une seule valeur, et c'est la
// seule qui existe — la veille (src/maj.js) relit ce fichier même pour
// savoir si le serveur en porte un autre.
//
// Convention : majeur.mineur.correctif, en partant de 1.0.0.
//
//   correctif — un bogue corrigé, un réglage, rien de neuf à comprendre ;
//   mineur    — quelque chose de plus à faire ou à voir dans le jeu ;
//   majeur    — la partie d'avant ne se joue plus comme celle d'après.
//
// Il monte à chaque livraison. C'est ce que le joueur voit dans le menu pause,
// et ce que le bandeau de mise à jour annonce.
export const VERSION = '1.1.0';
