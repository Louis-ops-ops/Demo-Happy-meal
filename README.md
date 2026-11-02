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

## Données

- **Aliments** : table de composition nutritionnelle **ANSES-Ciqual 2025** (version du 3 novembre 2025, [doi:10.57745/RDMHWY](https://doi.org/10.57745/RDMHWY)), Licence Ouverte / Etalab 2.0. `npm run data:ciqual` télécharge les fichiers XML officiels et régénère `public/data/aliments.json` (3 304 aliments, hors aliments infantiles). Les valeurs « traces » valent 0, « < x » vaut x / 2, et les valeurs manquantes valent 0.
- **Rayons et étiquettes** (viande, porc, poisson, œuf, lait, gluten, alcool) : déduits du groupe Ciqual et du nom de l'aliment. Pour le gluten, le lait et le porc, c'est une estimation : vérifie toujours l'étiquette du produit en cas d'allergie.
- **Recettes** : 45 recettes originales écrites pour le projet (`public/data/recettes.json`), sous licence CC0. Les valeurs nutritionnelles par portion sont toujours calculées à partir des ingrédients.
- `npm run data:validate` (lancé avant chaque build) vérifie les schémas zod, que chaque ingrédient existe, les kcal par créneau et la cohérence des protéines.

## UI Kit

Tous les composants sont visibles sur `/app/_kit` (tab bar sous 1024 px, sidebar au-dessus). Captures : `docs/captures/`.

## Licence

Code sous licence MIT (voir `LICENSE`).
Icônes d'interface : tracés [Lucide](https://lucide.dev) (licence ISC). Illustrations clay : créations du projet.
