# Happy meal

Appli de traque de calories, plan alimentaire personnalisé et suivi de poids. 100 % local, open source, non commerciale.

> Projet en cours de construction. Le README complet (captures, licences des données, roadmap) arrive à l'étape 9.

## Lancer le projet

```bash
npm install
npm run dev            # web : portfolio sur /, appli sur /app
npm run dev:desktop    # cible desktop (HashRouter, sans portfolio ni démo)
npm run build          # build web -> dist/
npm run build:desktop  # build desktop -> dist-desktop/
npm run lint
npm test
```

## Stack

Vite, React 18, TypeScript strict, Tailwind CSS 4 branché sur `src/styles/tokens.css`, React Router, vite-plugin-pwa, Vitest.
Les écarts entre la cible web et la cible desktop (Electron) passent tous par `src/platform.ts`.

## UI Kit

Tous les composants sont visibles sur `/app/_kit` (tab bar sous 1024 px, sidebar au-dessus). Captures : `docs/captures/`.

## Licence

Code sous licence MIT (voir `LICENSE`).
Icônes d'interface : tracés [Lucide](https://lucide.dev) (licence ISC). Illustrations clay : créations du projet.
