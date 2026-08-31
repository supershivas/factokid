# Usine

Jeu d'usine en pixel art, pour mobile. Voir `CLAUDE.md` pour les décisions de
design, le design system et le lot en cours.

## Lancer

Modules ES : il faut un serveur, pas un `file://`.

```
npx http-server -p 8000 .
```

- `index.html` — cible mobile, plein écran.
- `preview.html` — aperçu desktop, même jeu dans un cadre de téléphone.

## Jouer

Glisser le doigt (ou la souris) depuis la machine jaune jusqu'à la machine verte :
le convoyeur entier se trace. Un nouveau tracé remplace le précédent.
