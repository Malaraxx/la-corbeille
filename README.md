# La Corbeille

**50 ans de marchés en tour par tour.** Tu as 25 ans le 1er janvier 2000. Bulle internet, 11 septembre, 2008, dette grecque, Covid… puis un futur que personne n'a écrit, jusqu'en 2050. À chaque tour, l'actualité t'impose une décision. Ta vie perso aussi.

▶ **Jouer** : [version officielle sur Claude](https://claude.ai/artifact/GpZGGZupMd8fPAfZKjrozN) · [version GitHub Pages](https://malaraxx.github.io/la-corbeille/)

## Ce qu'il y a dedans

- **4 personnages** (l'héritier, l'ingénieure, l'infirmier, la fondatrice) et **6 objectifs de vie**, dont 2 à choisir : ils pèsent dans le score.
- **La vraie fiscalité française, époque par époque** : Livret A, compte-titres, **PEA** (5 ans), **assurance-vie** (8 ans), flat tax, prélèvements sociaux, plus-values immobilières avec abattements.
- **Immobilier** : T2 locatif, bureaux, résidence principale, crédit avec taux d'effort, vacance locative, impayés, renégociation.
- **Fiches analyste** (dette/EBITDA, PER…) pour juger si une chute est un rebond ou un couteau qui tombe, et **4 conseillers** dont la fiabilité est suivie : à toi de savoir qui écouter.
- **Vie perso** : humeur, couple, mariage, enfants, burn-out, ventes paniques, retraite ou indépendance financière.
- **Répartition par profil** en un clic, récap de chaque investissement avec son **TRI**, 14 succès, épilogue avec tes meilleurs et pires coups.
- **Chaque partie est différente** : les crises tombent aux vraies dates, mais gagnants et perdants sont redistribués.

## Développement

Tout le jeu tient dans un seul fichier : [`src/la-corbeille.html`](src/la-corbeille.html), sans framework ni dépendance.

```bash
npm run build      # génère index.html (GitHub Pages) depuis la source
npm test           # tests rapides : invariants, identité de caisse au centime, rééquilibrage, sauvegarde
npm run balance    # rapport d'équilibrage
npm run e2e        # partie complète dans Chromium (nécessite Playwright)
```

Le brief complet du projet (règles chiffrées, architecture, invariants, feuille de route) est dans [`CLAUDE.md`](CLAUDE.md). Le jeu est développé avec Claude et Claude Code.

## Licence

Tous droits réservés, sauf mention contraire.
