# Prompt de démarrage pour Claude Code

Ouvre un terminal (PowerShell) dans le dossier `la-corbeille`, lance `claude`, puis colle le texte ci-dessous.

---

Tu travailles dans ce dossier : c'est mon jeu « La Corbeille ». Commence par lire CLAUDE.md en entier : il contient les règles du jeu, l'architecture, les invariants et la façon de travailler. Tu le respecteras dans toutes nos sessions.

Mission de cette première session : mettre le projet sur GitHub et le jeu en ligne.

1. Vérifie l'environnement : Node.js 18 ou plus, git, et GitHub CLI (`gh`). S'il manque quelque chose, installe-le avec winget (`winget install OpenJS.NodeJS.LTS`, `winget install Git.Git`, `winget install GitHub.cli`), puis vérifie `gh auth status`. Si je ne suis pas connecté, lance `gh auth login` et guide-moi pas à pas.
2. Lance `npm test`. Tout doit être vert. Sinon, arrête-toi et explique-moi le problème, sans rien pousser.
3. Initialise git sur la branche `main` et fais un premier commit : « La Corbeille : saison 2 ».
4. Crée le dépôt **public** `Malaraxx/la-corbeille` et pousse le code : `gh repo create Malaraxx/la-corbeille --public --source . --push --description "Simulateur de gestion de patrimoine au tour par tour, de 2000 à 2050"`.
5. Ajoute des sujets au dépôt : `gh repo edit Malaraxx/la-corbeille --add-topic game --add-topic finance --add-topic simulation --add-topic french`.
6. Active GitHub Pages sur la branche `main`, à la racine : `gh api -X POST repos/Malaraxx/la-corbeille/pages -f "source[branch]=main" -f "source[path]=/"`.
7. Attends la fin du déploiement (`gh api repos/Malaraxx/la-corbeille/pages/builds/latest`), puis vérifie que https://malaraxx.github.io/la-corbeille/ répond et affiche bien « Cinquante ans de marchés t'attendent ».
8. Optionnel, **demande-moi avant** : ajouter une carte « La Corbeille » vers le jeu dans mon hub portfolio (dépôt `Malaraxx/malaraxx.github.io`), dans le même style que les autres projets.
9. Termine par un résumé court : l'URL du dépôt, l'URL du jeu, le résultat des tests et ce que je dois vérifier.

Règle permanente : ne modifie jamais `index.html` à la main. Toute modification passe par `src/la-corbeille.html`, puis `npm run build` et `npm test`.

---

## Pour les sessions suivantes

Il suffit de décrire ce que tu veux, par exemple :

> Lis CLAUDE.md, puis attaque le point 1 de la feuille de route (classement entre amis). Propose-moi d'abord un mini-plan.

> Le bouton « Rééquilibrer » propose de vendre mon PEA alors que je viens de l'ouvrir : vérifie et corrige.

Claude Code relira CLAUDE.md, modifiera la source, lancera les tests et poussera sur GitHub. Pense ensuite à republier la version officielle sur Claude (voir CLAUDE.md, section 9).
