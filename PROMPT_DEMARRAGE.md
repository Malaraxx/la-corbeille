# Prompt de démarrage pour Claude Code

Le dépôt `Malaraxx/la-corbeille` existe déjà et le jeu est en ligne :
- dépôt : https://github.com/Malaraxx/la-corbeille ;
- version GitHub Pages : https://malaraxx.github.io/la-corbeille/ ;
- version officielle : https://claude.ai/artifact/GpZGGZupMd8fPAfZKjrozN.

La Corbeille se joue aujourd'hui de 2026 à 2076, dans un monde inventé à chaque partie, comme une vie en cinq chapitres avec des personnages récurrents (version 3.7 et suivantes).

## Reprendre le projet sur un nouvel ordinateur

Ouvre un terminal (PowerShell), lance `claude`, puis colle le texte ci-dessous.

---

Clone le dépôt `Malaraxx/la-corbeille` (ou ouvre-le s'il est déjà là), puis lis CLAUDE.md en entier : il contient les règles du jeu, l'architecture, les invariants et la façon de travailler. Tu le respecteras dans toutes nos sessions.

1. Vérifie l'environnement : Node.js 18 ou plus, git et GitHub CLI (`gh`). S'il manque quelque chose, installe-le avec winget (`winget install OpenJS.NodeJS.LTS`, `winget install Git.Git`, `winget install GitHub.cli`), puis vérifie `gh auth status`. Si je ne suis pas connecté, lance `gh auth login` et guide-moi pas à pas.
2. Lance `npm test`. Tout doit être vert. Sinon, arrête-toi et explique-moi le problème, sans rien pousser.
3. Installe une fois l'outil de test dans le navigateur, sans l'enregistrer dans `package.json` : `npm i --no-save playwright@1.49.1 && npx playwright install chromium`. Puis lance `npm run e2e` et regarde les captures dans `tests/screenshots/`.
4. Vérifie que https://malaraxx.github.io/la-corbeille/ répond et affiche l'écran « Crée ton profil ».
5. Ne touche pas à mon hub portfolio (dépôt `Malaraxx/malaraxx.github.io`) sans me demander.
6. Termine par un résumé court : la version en ligne (voir `CHANGELOG.md`), le résultat des tests et ce que je dois vérifier.

---

Règle permanente : ne modifie jamais `index.html` à la main. Toute modification passe par `src/la-corbeille.html`, puis `npm run build` et `npm test`.

## Pour les sessions suivantes

Il suffit de décrire ce que tu veux, par exemple :

> Lis CLAUDE.md, puis attaque le point 1 de la feuille de route (classement entre amis). Propose-moi d'abord un mini-plan.

> Le bouton « Rééquilibrer » propose de vendre mon PEA alors que je viens de l'ouvrir : vérifie et corrige.

Claude Code relira CLAUDE.md, modifiera la source, lancera les tests et poussera sur GitHub. Pense ensuite à republier la version officielle sur Claude (voir CLAUDE.md, section 9).
