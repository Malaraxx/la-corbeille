# La Corbeille

**50 ans de marchés en tour par tour, dans un monde inventé à chaque partie.** Tu as 25 ans le 1er janvier 2026. Cycles, krachs, bulles, présidentielles, révolutions technologiques : rien n'est écrit d'avance, mais tout obéit aux règles de l'économie réelle. Chaque année, ta famille, ton budget et les marchés te posent des choix, et Sophie, ta cousine, t'aide à décider.

▶ **Jouer** : [version officielle sur Claude](https://claude.ai/artifact/GpZGGZupMd8fPAfZKjrozN) · [version GitHub Pages](https://malaraxx.github.io/la-corbeille/)

## Ce qu'il y a dedans

- **Un monde généré à chaque partie** : cinq phases du cycle (expansion, surchauffe, récession, crise, reprise), une banque centrale qui suit l'inflation, des taux longs qui dépendent de la dette publique, un PER qui dit si la Bourse est chère. Les crises naissent des excès : crédit qui gonfle, valorisations délirantes, courbe des taux inversée. Impossible de jouer de mémoire.
- **Ton profil sur mesure** : ville, salaire, épargne de départ, en couple ou non. Puis ton logement : louer ou acheter selon tes moyens, avec l'avis de Sophie, ta cousine.
- **Un écran clair** : ton argent toujours visible en haut, et quatre onglets (Profil, Portefeuille, Immobilier avec dossier de crédit, Patrimoine).
- **Un budget réel** : loyer ou crédit, voiture, enfants, imprévus. Et de quoi se faire du bien : sorties, vacances, cadeaux.
- **Des présidentielles tous les cinq ans**, avec des candidats fictifs dont les programmes changent la flat tax, le plafond du PEA, le Livret A, l'âge de la retraite et la réaction des marchés.
- **Des vagues d'innovation** (IA, fusion, robotique, longévité…) qui naissent en rumeur, lancent leur fonds, gonflent en bulle ou échouent.
- **La vraie fiscalité française** : Livret A, compte-titres, **PEA** (5 ans), **assurance-vie** (8 ans), flat tax, prélèvements sociaux, plus-values immobilières avec abattements.
- **ETF Monde** avec effet euro/dollar, Tracker Paris 40, six actions fictives, or, OAT, jetons numériques et produits douteux.
- **Immobilier à Lille, Lyon et Paris** : studio, T2, T3, bureaux, résidence principale, crédit avec taux d'effort, vacance locative, impayés, renégociation.
- **6 objectifs de vie**, **4 conseillers** dont la fiabilité est suivie, fiches analyste, licenciement en crise, retraite, indépendance financière, **15 succès**, épilogue avec tes meilleurs et pires coups.

## Développement

Tout le jeu tient dans un seul fichier : [`src/la-corbeille.html`](src/la-corbeille.html), sans framework ni dépendance.

```bash
npm run build                 # génère index.html (GitHub Pages) depuis la source
npm test                      # tests rapides : monde réaliste, onglets, création du profil, immobilier, invariants, identité de caisse au centime, sauvegarde
npm run balance               # rapport d'équilibrage
npm run monde -- --seed=42    # raconte un monde généré, année par année
npm run e2e                   # partie complète dans Chromium (nécessite Playwright)
```

Le brief complet du projet (règles chiffrées, architecture, invariants, feuille de route) est dans [`CLAUDE.md`](CLAUDE.md). Le jeu est développé avec Claude et Claude Code.

## Licence

Tous droits réservés, sauf mention contraire.
