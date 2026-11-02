# Happy meal — CLAUDE.md

> Brief de projet pour Claude Code. Lis tout avant d'écrire du code. Langue de l'UI et des commentaires utilisateur : **français**. Code et noms de variables : anglais.

## 1. Le projet en 30 secondes

**Happy meal** : appli de **traque de calories + plan alimentaire personnalisé + suivi de performance**.
L'utilisateur renseigne ses métriques → l'appli calcule son déficit calorique → génère un plan 7 ou 14 jours (recettes) → liste de courses → journal alimentaire et courbe de poids.
Angle distinctif : à la génération d'un plan, on peut cocher **« Ce que j'ai déjà »** (aliments déjà chez soi) pour que le plan les privilégie. Il n'y a **pas de stock permanent** : cette sélection est éphémère.

**Contexte** : projet perso / portfolio de Louis (étudiant UI/UX), **open source, non commercial**. Trois livrables, **un seul code source, deux builds** :
1. une **page portfolio / case study** (route `/`) — build web uniquement ;
2. la **PWA démo** (route `/app`), avec un bouton « Tester l'appli » pour les recruteurs — build web ;
3. une **appli Electron pour l'usage personnel de Louis** sur son desktop (Windows) — build desktop : s'ouvre directement sur l'appli, sans page portfolio ni mode démo.

## 2. Décisions techniques (à respecter)

| Sujet | Choix |
|---|---|
| Plateforme | **Un seul code React, deux cibles** via `VITE_TARGET=web\|desktop`. **Web** = PWA démo + portfolio (Vercel). **Desktop** = Electron (dossier `desktop/`, `electron-builder`, installeur Windows) qui charge le build `desktop`. Electron emballe l'appli web, ce n'est pas un second code |
| Différences par cible | `web` : BrowserRouter, service worker PWA actif, page portfolio, mode démo. `desktop` : **HashRouter** (chargement `file://`), `base: './'`, service worker désactivé, pas de portfolio ni de démo, route `/` = Aujourd'hui. Les écarts passent par un module `src/platform.ts`, jamais de `if` dispersés |
| Electron | `contextIsolation: true`, `nodeIntegration: false`, pas d'API Node exposée au renderer (rien n'est nécessaire en MVP : IndexedDB fonctionne tel quel). Fenêtre par défaut **1280×820** (layout desktop, voir §3.2), redimensionnable, minimum 960×640, fenêtre état mémorisé. Données dans le profil Electron de Louis ; la sauvegarde = export / import JSON déjà prévu |
| Build | Vite + React 18 + TypeScript (strict) |
| Routing | React Router. Web : `/` = portfolio, `/app/*` = appli. Desktop : tout est sous HashRouter, accueil = Aujourd'hui |
| Style | CSS variables pour les tokens + Tailwind CSS (thème branché sur les tokens). Aucune couleur / taille en dur dans les composants |
| État | Zustand |
| Stockage | **100 % local** : IndexedDB via Dexie pour les données utilisateur. Données de référence (aliments, recettes) en JSON statique chargé et indexé en mémoire. Pas de backend |
| PWA | `vite-plugin-pwa` (manifest, service worker, offline) |
| Graphiques | SVG maison ou Recharts (courbe de poids, jauges) |
| Tests | Vitest — **obligatoires sur `src/domain/`** (calculs nutrition) |
| Déploiement | Vercel |
| Licence code | MIT (fichier `LICENSE`) |

Garder la stack simple. Ne pas ajouter de dépendance lourde sans raison. **Pas de LLM / RAG / backend dans le MVP.**

## 3. Design : source de vérité = Figma

Louis a le design system et la DA dans Figma, et le MCP Figma est connecté.
- **Fichier Figma** : https://www.figma.com/design/ZgR6EwfCJNerWmYlT5xjoF/Happy-meal — `fileKey = ZgR6EwfCJNerWmYlT5xjoF`.
- Workflow : `create_session` avec ce fileKey → charger la skill `figma-design-to-code` → `get_design_context` par écran/composant → **adapter** le résultat (c'est une référence, pas du code final) en réutilisant nos tokens et composants.
- Si Figma et ce document divergent sur un écran, **Figma gagne**. Sur les tokens, voir ci-dessous.

### 3.0 Contenu du fichier Figma (état au 02/11/2026)

**Direction artistique : néomorphisme sur fonds clairs** (ombres douces claires/sombres, relief des cartes, puces et tab bar, icônes « clay » pour les aliments). Reproduire fidèlement ce rendu en CSS (double `box-shadow` clair/sombre, rayons des tokens). Page `Design system` → section « Neumorphisme — fonds clairs » = référence des ombres par fond (lightgreen-100, darkgreen-100, creme-p, orange-100).

Pages : `Design system` (1:2) · `Design` (1:3, écrans) · `Product design` (0:1) · `Archives` · `Test`.
`Design system` contient : tokens (Spacing, Typo, Dark green, Light Green, Orange, Primary), « UI Kit — Composants » et **« Bibliothèque de composants »** : Actions · Saisie et sélection · Navigation · Listes et cartes · Données et statuts · Icônes · Illustrations clay (+ « Mode d'emploi » 42:532, à lire en premier).

**Écrans existants (page `Design`, 390×844) — conçus pour la v1 « garde-manger »** :
- *Cuisiner & Recette pas à pas* : 01 Cuisiner (accueil) 32:3184 · 02 Cuisiner avec… 32:3313 · 03 Fiche recette 32:3434 · 04 Début de recette 32:3527 · 05 Étape 3/6 32:3596 · 06 Fin de recette 32:3649 · 07 Confirmation 32:3710
- *Onboarding* : O1 Splash 33:3915 · O2 Explication 33:3929 · O3 Régime et allergies 33:3990 · O4 Foyer 33:4038 · O5 Aliments courants 33:4086 · O6 Recettes disponibles 33:4182
- *Stock* : S1 Inventaire 72:2064 · S3 Scan 72:2111 · S4 Recherche 33:4834 · S5 Vérification 72:2130 · S6 Fiche aliment 72:2141 · S7/S8 Retirer 72:2278 / 72:2425 · pop-up d'ajout 72:2163
- *Historique* : H1 Journée 33:5496 · H2 Détail du repas 33:5587
- *Profil* : P1 Profil de cuisine 33:5650 · P2 Mes données 33:5776 · P3 Importer 33:5825

**Réutilisation pour la v2 (pivot)**
| À reprendre tel quel / adapter peu | Écran Figma |
|---|---|
| Recette pas à pas (sans décrément de stock) | 04 → 07 |
| Fiche recette (garder kcal/macros/portions) | 03 |
| Splash, explication, régimes | O1, O2, O3 |
| Profil, export / import | P1, P2, P3 |
| Journal (ex-Historique) | H1, H2 → devient le « journal » |
| Recherche d'aliment | S4 (saisie hors plan) |
| « Cuisiner avec… » (puces + icônes clay) | 02 → devient l'étape **« Ce que j'ai déjà »** de la génération du plan |

**Écrans v2 qui N'EXISTENT PAS dans Figma** (à concevoir en suivant le système, puis à pousser dans Figma si Louis le demande) : onboarding Métriques · Objectif et rythme · Récap calculé (BMR / TDEE / kcal / macros) · Durée du plan · **Aujourd'hui** (jauge kcal, repas du jour) · **Plan** (aperçu jour par jour + swap) · **Courses** · **Suivi** (courbe de poids lissée, stats) · ajout rapide hors plan. Les écrans Stock (S1, S3, S5–S8) sont **obsolètes** : ne pas les implémenter (le stock permanent est supprimé).
Tab bar v2 : Aujourd'hui · Plan · Courses · Suivi · Profil (le Figma montre encore Cuisiner · Stock · Historique · Profil). Pour les nouveaux écrans, **demander à Louis une validation visuelle** (capture) avant d'enchaîner.

### 3.2 Responsive : mobile (Figma) + desktop (à concevoir)

**Le Figma est mobile-only (390×844).** Il n'existe aucune maquette desktop. L'appli doit pourtant avoir un **vrai layout desktop**, pensé comme des dashboards, pas un écran mobile étiré. Cela concerne la PWA démo (les recruteurs sont souvent sur ordinateur) et surtout l'appli Electron de Louis.

**Breakpoints** (mobile-first, `min-width`) : base < 768 px = mobile · `md` ≥ 768 px = tablette · `lg` ≥ 1024 px = **desktop** · `xl` ≥ 1440 px = grand écran (contenu centré, largeur max 1280 px).

**Navigation** : < 1024 px = tab bar du Figma (basse, néomorphique). ≥ 1024 px = **sidebar gauche fixe** (logo, 5 entrées Aujourd'hui · Plan · Courses · Suivi · Profil, résumé kcal du jour en bas), mêmes icônes et mêmes tokens. Un composant `AppShell` choisit l'un ou l'autre.

**Layouts desktop par écran** (grille 12 colonnes, gouttière `spacing-05` 24 px, marges `spacing-06` 32 px) :
| Écran | Mobile (Figma) | Desktop ≥ 1024 px |
|---|---|---|
| Aujourd'hui | liste verticale | **Dashboard** : colonne gauche = repas du jour (cartes) ; colonne droite = jauge kcal, 3 jauges macros, mini courbe de poids, bouton « Pas d'idée ? » |
| Plan | aperçu jour par jour (liste) | **Vue semaine en grille** (jours en colonnes, créneaux en lignes), swap en panneau latéral au clic ; plan 14 j = 2 lignes de 7 |
| Courses | liste par rayon | rayons en **colonnes (masonry)**, total d'articles et progression en en-tête |
| Suivi | courbe + stats empilées | **Dashboard analytique** : grande courbe de poids (brute + lissée) à gauche, cartes de stats (kcal moyenne, % de respect du plan, tendance, date d'objectif) à droite, histogramme kcal sur 7 / 30 jours en dessous |
| Profil | liste de réglages | deux colonnes : sections à gauche, contenu à droite |
| Onboarding | plein écran | **carte centrée** (max 520 px) sur fond de DA, mêmes étapes ; récap calculé en 2 colonnes |
| Recette pas à pas | plein écran | recette en 2 colonnes (ingrédients à gauche, étape courante grande à droite), taille de texte augmentée pour la cuisine |
| Fiche recette / modales | plein écran / bottom sheet | **modale centrée** ou panneau latéral droit (pas de bottom sheet) |

**Règles desktop**
- Pas de pleine largeur illimitée : conteneur `max-w-[1280px]` centré, texte courant ≤ 70 caractères par ligne.
- Mêmes tokens (couleurs, rayons, Lexend) ; **on ne crée pas de nouvelle échelle typo** : réutiliser display / title-1 pour les chiffres clés des dashboards. Ajouter des tokens seulement si indispensable, et le signaler à Louis.
- **Néomorphisme** conservé sur les cartes et jauges, mais avec parcimonie sur de grandes surfaces (limiter le nombre de cartes en relief par vue pour éviter l'effet « bouillie » et garder la lisibilité).
- Interactions desktop : survol (hover) et focus clavier visibles, raccourcis simples (`←/→` jour précédent / suivant, `N` nouveau repas, `/` recherche), tooltips sur les graphiques, zones cliquables ≥ 32 px (≥ 44 px sur tactile).
- Graphiques responsives (SVG avec `viewBox`), lisibles de 320 px à 1440 px.
- Tester à 390, 768, 1024, 1280 et 1440 px (captures dans la PR / le README).
- **Ordre de travail** : mobile d'abord (fidèle au Figma), puis le layout desktop de chaque écran dans la **même étape**. Pour chaque écran desktop, montrer une capture à Louis avant de passer au suivant ; si Louis le demande, pousser ces écrans dans Figma (frames 1440×900).

### 3.1 Tokens (extraits des PDF du projet)

**Couleurs principales**
| Token | Valeur |
|---|---|
| `darkgreen-p` | `#2E3A2F` |
| `lightgreen-p` | `#6B7F5B` |
| `lightbrown-p` | `#D9C9B2` |
| `orange-p` | `#C96F4F` |
| `creme-p` | `#F8F6EE` |

**Déclinaisons**
| | 100 | 200 | 300 | 400 | 500 | p |
|---|---|---|---|---|---|---|
| darkgreen | `#F9FAFA` | `#E3E8E3` | `#CFD8CF` | `#9AAC9A` | `#677D67` | `#2E3A2F` |
| lightgreen | `#F7F8F5` | `#ECF0E8` | `#D8E0D2` | `#B9C7AE` | `#92A583` | `#6B7F5B` ⚠️ |
| orange | `#FBF5F1` | `#F6E8DE` | `#EBCFBD` | `#DFAE92` | `#D18666` | `#C96F4F` |

✅ Le libellé « Principale » de `Light Green` affiche `#2E3A2F` (coquille, aussi dans Figma), mais la pastille Figma est bien verte : on utilise `#6B7F5B` (vérifié le 02/11/2026).

**Espacement** (`$spacing-01…06`) : 4, 8, 12, 16, 24, 32 px.
**Rayons** : `radius-01` 12 · `radius-02` 16 · `radius-03` 24 · `radius-04` 999 (full).

**Typographie — Lexend** (taille / interligne / graisse / letter-spacing)
| Token | Taille | LH | Graisse | LS |
|---|---|---|---|---|
| display | 32 | 38 | 600 | -0.64 |
| title-1 | 26 | 32 | 600 | -0.39 |
| title-2 | 21 | 28 | 600 | -0.21 |
| title-3 | 18 | 24 | 500 | 0 |
| body-lg | 17 | 26 | 400 | 0 |
| body | 15 | 22 | 400 | 0 |
| body-sm | 13 | 18 | 400 | 0 |
| label | 15 | 20 | 500 | 0.15 |
| caption | 12 | 16 | 400 | 0.12 |
| overline | 12 | 16 | 400 | 0.48 (+ majuscules) |

Convention : fond = `creme-p`, texte = `darkgreen-p`, action principale = `orange-p`, accents = `lightgreen-p`.
⚠️ **Accessibilité** : blanc sur `orange-p` ≈ 3.6:1 (échoue AA en texte normal). Réserver aux textes ≥ 18 px / 14 px gras, sinon utiliser `darkgreen-p` sur orange clair. Vérifier les contrastes des nouveaux couples.

Composants du UI Kit existants : bouton « Générer une recette », champ de recherche « Rechercher un aliment », puces d'aliments, carte recette (« Curry de lentilles corail · 25 min · 420 kcal »), écran d'accueil « Que cuisiner ce soir ? ». Le reste (jauge kcal, courbe, onglets…) est à construire dans le même style, en vérifiant Figma d'abord.

## 4. Fonctionnalités MVP

**Navigation (tab bar)** : Aujourd'hui · Plan · Courses · Suivi · Profil

1. **Onboarding** (passable partout sauf métriques) : splash → explication → métriques (sexe, âge, taille, poids, activité) → objectif (poids cible + rythme doux / modéré / soutenu) → récap calculé (BMR, TDEE, kcal cible, macros, durée estimée) → régimes / allergies / exclusions / nb de personnes → durée du plan → génération.
2. **Plan** : durée 7 / 14 jours, 2 à 5 repas/jour, étape optionnelle « Ce que j'ai déjà » (recherche + puces), aperçu jour par jour, **swap** d'une recette (alternatives à kcal équivalentes), validation.
3. **Aujourd'hui** : repas du jour du plan (cocher « mangé », portion ajustable), « j'ai mangé autre chose » (recherche aliment/recette, quantité en g — **saisie < 10 s**), jauge kcal + macros vs cible, recette pas à pas avec minuteur.
4. **Courses** : liste agrégée sur tout le plan par rayon, cochable, option « déjà à la maison » par ligne, régénérée après un swap.
5. **Suivi** : pesée optionnelle (manuelle), courbe + **moyenne lissée 7 jours**, kcal vs cible (jour/semaine), % de respect du plan, recalcul proposé tous les 14 jours.
6. **Profil** : tous les réglages, export / import JSON des données.
7. **Mode démo** (pour recruteurs) : bouton « Tester l'appli » → choix entre « Parcours complet » (onboarding) et « Profil de démo » (profil + plan + 10 jours d'historique et de pesées pré-remplis). Bouton « Réinitialiser la démo » visible dans Profil.

**Hors MVP (roadmap README)** : plans 28 j+, scan code-barres, recettes à la demande par RAG/LLM, mesures corporelles, photos de progression, version mobile native.

## 5. Calculs — `src/domain/` (fonctions pures, 100 % testées)

- **BMR (Mifflin-St Jeor)** : homme `10·kg + 6.25·cm − 5·âge + 5` ; femme `… − 161`.
- **TDEE = BMR × activité** : sédentaire 1.2 · léger 1.375 · modéré 1.55 · très actif 1.725 · extrême 1.9.
- **Déficit/jour = (kg par semaine × 7700) / 7**. Rythmes : doux 0.25 → ~275 kcal ; modéré 0.5 → ~550 ; soutenu 0.75 → ~825.
- **Garde-fous (obligatoires, testés)** : kcal cible jamais < **1500 (H) / 1200 (F)** ni < BMR ; perte max ≈ 1 % du poids/semaine (sinon plafonner et l'expliquer) ; refuser < 18 ans ; refuser un objectif avec IMC cible < 18.5. Afficher « Estimation indicative, ne remplace pas un avis médical ».
- **Macros par défaut** : protéines 1.6–2.0 g/kg, lipides ~25–30 % des kcal, glucides = reste.
- **Nutrition d'une recette** = Σ (valeur pour 100 g × quantité_g / 100) ÷ portions. Toujours recalculée par le code, jamais saisie à la main.
- **Plan** (algorithme déterministe) : répartition kcal par repas (ex. 25/35/10/30 %) → filtre recettes (régimes, exclusions) → par créneau, recette à ±10 % de la cible, portion ajustable 0.75–1.5× → pas de répétition < 3 jours, variété de protéines → bonus de score si la recette utilise « Ce que j'ai déjà » → total jour à ±5 %.
- **Courbe de poids** : moyenne mobile 7 jours ; date d'atteinte de l'objectif recalculée sur la tendance réelle.

## 6. Données

- **Aliments** : [Ciqual (ANSES)](https://ciqual.anses.fr), Licence Ouverte Etalab → script d'import dans `scripts/` qui produit `public/data/aliments.json` (id, nom, kcal/prot/gluc/lip/fibres/sel pour 100 g, rayon, tags régime). Citer ANSES-Ciqual (et la version) dans le README et sur la page « À propos ». Open Food Facts ([ODbL](https://opendatacommons.org/licenses/odbl/)) uniquement en V1.1 via leur API, sans copie de la base dans le dépôt.
- **Recettes** : **30 à 50 recettes originales**, écrites à la main en JSON (`public/data/recettes.json`) : id, titre, temps, portions, ingrédients (aliment_id + quantité_g), étapes (avec minuteur optionnel), matériel, tags régime. **Ne rien copier** depuis Marmiton / blogs (protégé). Licence des recettes : CC0 ou CC-BY.
- Valider les JSON avec un schéma (zod) au build ; un test vérifie que chaque `aliment_id` d'une recette existe.

### Modèle IndexedDB (Dexie)
`profil` (1 ligne : sexe, naissance, taille, activité, régimes[], exclusions[], foyer_nb, objectif_poids, rythme, kcal_cible, macros_cible) · `pesee` (date, kg) · `plan` (id, debut, duree_j, repas_par_jour, aliments_favoris[]) · `plan_repas` (plan_id, jour, créneau, recette_id, portions) · `journal` (date, créneau, recette_id | aliment_id, quantité, kcal, prot, gluc, lip, plan_repas_id?) · `courses_item` (plan_id, aliment_id, quantité_g, rayon, coché, deja_chez_moi).

## 7. Structure du dépôt

```
happy-meal/
├─ CLAUDE.md  README.md  LICENSE
├─ desktop/               Electron (main.ts, preload.ts, electron-builder.yml)
├─ public/data/           aliments.json, recettes.json, icônes PWA
├─ scripts/               import Ciqual, validation des données
├─ src/
│  ├─ styles/             tokens.css (variables), tailwind config
│  ├─ domain/             calculs purs + tests (bmr, deficit, nutrition, plan, courses)
│  ├─ data/               accès JSON de référence, Dexie (db.ts)
│  ├─ store/              Zustand
│  ├─ components/         UI Kit (Button, Chip, SearchField, RecipeCard, Gauge…)
│  ├─ features/           onboarding, plan, today, courses, suivi, profil, demo
│  ├─ portfolio/          page case study (route /)
│  └─ routes/
└─ docs/                  blueprint v1 et v2 (référence)
```

## 8. Page portfolio (route `/`, build web uniquement)

Page case study courte, dans la même DA : hero (« Happy meal — plan alimentaire à partir de ton frigo et de ton déficit »), bouton principal **« Tester l'appli »** (→ `/app`, mode démo), problème → recherche → parcours (flows) → design system (tokens, UI Kit) → écrans clés → ce que j'ai appris / roadmap, liens GitHub et Figma. Responsive, rapide, accessible. Les visuels de process viennent de Figma (`get_screenshot`).

## 9. Plan de travail (une étape = un commit propre, vérifiée avant la suivante)

1. **Socle** : Vite + React + TS, Tailwind, `tokens.css`, polices Lexend, `src/platform.ts` (cibles web / desktop), PWA de base, déploiement Vercel.
2. **UI Kit + AppShell** : composants de la « Bibliothèque de composants » Figma (néomorphisme inclus) + jauge + onglets, `AppShell` (tab bar < 1024 px / sidebar ≥ 1024 px), grille et conteneur desktop, avec une page `/app/_kit` pour les voir tous aux deux formats.
3. **Domain** : BMR / TDEE / déficit / garde-fous / nutrition + tests Vitest.
4. **Données** : script Ciqual, schéma zod, 30–50 recettes, test d'intégrité.
5. **Onboarding** complet avec récap calculé.
6. **Plan** : génération, aperçu, swap, « Ce que j'ai déjà ».
7. **Aujourd'hui + journal**, puis **Courses**, puis **Suivi** (courbe lissée).
8. **Mode démo** (seed) + export / import JSON.
9. **Page portfolio**, README (captures / GIF, stack, lancement, licences, roadmap), audit Lighthouse (PWA ≥ 90, a11y ≥ 95).
10. **Electron (usage perso)** : dossier `desktop/`, `main.ts` + `preload.ts` minimal, scripts `npm run desktop:dev` et `npm run desktop:build` (installeur Windows via `electron-builder`), vérifier que IndexedDB persiste après redémarrage, que le HashRouter fonctionne et que l'export / import JSON marche. Icône d'appli à partir du logo du splash.

## 10. Règles de travail

- Commencer par proposer le plan d'étape 1 en quelques lignes, puis coder. Une étape à la fois ; lancer `npm run build`, `npm run lint` et `npm test` avant de dire « terminé ».
- Aucune valeur de couleur / espacement / rayon / typo en dur : uniquement les tokens.
- Copywriting en français, tutoiement, ton simple et bienveillant. **Jamais de culpabilisation** (pas d'écran rouge pour un écart calorique) : le sujet est sensible.
- Accessibilité : cibles tactiles ≥ 44 px, focus visibles, `aria-label` sur les icônes, contrastes vérifiés, `prefers-reduced-motion` respecté.
- Mobile-first (390 px) **et** layout desktop soigné (dashboards, sidebar) : voir §3.2. Aucun écran n'est terminé tant qu'il n'est pas bon aux deux formats.
- En cas de doute produit, poser une question à Louis plutôt que d'inventer. Ne jamais copier de contenu protégé.
- Les décisions ouvertes (repas/jour par défaut, rappel de pesée, objectifs autres que perte de poids) : MVP = 3 repas + 1 collation modifiables, pesée 100 % libre, perte de poids uniquement.
