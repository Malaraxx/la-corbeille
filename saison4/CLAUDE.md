# La Corbeille · Saison 4 : brief pour Claude Code

Ce fichier est lu au début de chaque session qui touche à `saison4/`. **La référence des règles et des chiffres est le cahier des charges v3** (`saison4/CAHIER_DES_CHARGES_SAISON4_V3.md`, 13 novembre 2026 : la gestion d'entreprise au trimestre). Il remplace la v2 (`docs/saison4/CAHIER_DES_CHARGES_SAISON4_V2.md`) partout où les deux diffèrent ; ce que la v3 ne dit pas reste valable dans la v2, puis dans la v1 (`docs/saison4/CAHIER_DES_CHARGES_SAISON4.md`). Le prototype (`docs/saison4/prototype-saison4.html`) montre l'esprit et la mise en page. En cas de contradiction, le cahier des charges gagne. Les chiffres marqués « à vérifier » sont vérifiés sur une source officielle ou professionnelle avant d'être codés, source en commentaire ; sinon une valeur prudente avec `TODO`. Pour tout le reste (Flo, ton, commits, publication), le `CLAUDE.md` de la racine s'applique.

La version 3 reste intacte et jouable à la racine (`src/la-corbeille.html`). On n'y touche pas, sauf le lien « Essayer la Saison 4 » de l'écran de départ.

---

## 1. Le jeu

Un jeu de création et de gestion d'entreprise, avec la vie perso et le patrimoine autour. On démarre à 20 ans en janvier 2026 (génération 2006) et on joue une année par tour jusqu'à la retraite, à 64 ans en 2070. **Les études sont obligatoires** (2 à 5 ans, elles servent de tutoriel) ; **à la sortie, on crée son entreprise** (société, ou activité libérale à son compte). Il n'y a plus de salariat à vie ni de carrière de fonctionnaire : seuls restent le job étudiant, l'apprentissage et un **CDD de transition** de 2 ans au plus après une faillite ou une fin d'activité. Une faillite n'est pas la fin : chômage, reconversion, puis nouveau projet. Tout chiffre dit d'où il vient.

**Boucle d'une année** : la Une (actualité et dénouement des dossiers) → la décision obligatoire (versus ou pari au curseur) → gestion libre → « Clôturer » → récap en trois blocs (vie pro, patrimoine, vie perso) et maintien → bilan animé → année suivante.

Publié sur GitHub Pages : `https://malaraxx.github.io/la-corbeille/saison4/`.

---

## 2. Fichiers et commandes

```
saison4/src/la-corbeille-s4.html  ← LA source (format artifact : commence par <title>, pas de squelette)
saison4/index.html                ← généré, ne jamais éditer
saison4/tools/build.mjs           ← ajoute le squelette (marqueur : <main class="app" id="app">)
saison4/tests/run.mjs             ← tests du moteur dans node:vm (sans DOM), --balance pour l'équilibrage
saison4/tests/balance.mjs         ← stratégies et rapport de la section 14 du cahier des charges
saison4/tests/e2e.mjs             ← parties complètes Playwright, mobile 390×844 et desktop 1440×900, captures
saison4/tests/peek.mjs            ← déroule une partie et affiche l'essentiel (node saison4/tests/peek.mjs travail/vente/lille 7)
docs/saison4/                     ← cahier des charges et prototype de Flo
```

| Commande | Rôle |
|---|---|
| `npm run build:s4` | régénère `saison4/index.html` |
| `npm run test:s4` | vérifie que l'index est à jour, puis les tests du moteur (quelques secondes) |
| `npm run balance:s4` | rapport d'équilibrage (500 parties par profil ; `-- --n=100` pour aller vite) |
| `npm run e2e:s4` | partie complète mobile et desktop (≈ 7 min) ; `node saison4/tests/e2e.mjs --years=4` pour un tour rapide |

Playwright s'installe sans l'enregistrer : `npm i --no-save playwright@1.49.1 && npx playwright install chromium`.

---

## 3. Architecture du fichier source

Un seul `<script>`, en deux parties balisées :
- **`/* ===== MOTEUR : … ===== */`** au niveau global : outils, hasard, paramètres officiels, données, placements, état, fiscalité, budget, création, économie, carrière, société, vie perso, clôture, Une, événements, dossiers, succès, sauvegarde. Aucune référence au DOM : `tests/run.mjs` le charge dans `node:vm`.
- **`/* ===== UI : … ===== */`** dans `if (typeof document!=='undefined'&&document.getElementById('app')) (function(){ … })();` : effets, écrans, création, hub et onglets (`VIEWS.home`, `VIEWS.budget`…), récap, bilan, fin, conseils.

**Hasard** : `rnd()` (mulberry32) lit et écrit `ST.rs`, rangé dans la sauvegarde. Une partie rechargée continue exactement pareil. `Math.random` est interdit dans le moteur (le bac à sable des tests lève une erreur s'il est appelé) ; l'UI ne s'en sert que pour les trajectoires des billets et la graine d'une nouvelle partie.

**Vues pures** : `budget()`, `net()`, `tipsFor()`, `yearNews()`, `where100()`, `profName()`, `payslip()` ne consomment jamais de hasard (testé).

**Argent** : tout mouvement du compte courant passe par `cash(montant, catégorie)`, qui tient `ST.flow`. Invariant testé : `ST.cash = Σ ST.flow` au centime. Les montants sont en euros courants ; `ST.cpi` est l'indice des prix (1 en 2026). `real(x) = x / ST.cpi` donne des euros de 2026 (rang final, record, équilibrage).

### État `ST` (sauvegardé sous la clé `la-corbeille-s4`, champ `v` = 2)

| Champ | Contenu |
|---|---|
| `seed`, `rs` | graine et état du hasard |
| `sexe`, `pseudo`, `city`, `path`, `dk` | identité, ville, chemin de départ et domaine (clé dans `DOMS`) |
| `prof` | `etudiant`, `apprenti`, `salarie` (CDD de transition seulement, `job.cdd` = année de fin), `independant`, `chef`, `chomage`, `pause` (entre deux projets, après une revente), `retraite` |
| `year`, `age`, `cpi`, `eco` | date, indice des prix, économie (`infl`, `rate`, `livA`, `mort`, `m`, `crash`, `ci` = indice immobilier par ville) |
| `cash`, `livret`, `env{pea,cto,av,pee}` | compte courant, Livret A, enveloppes (`open` = année d'ouverture, `hold{id:{v,b}}` = valeur et prix de revient) |
| `props`, `debts`, `doss` | biens immobiliers, dettes (`stu`, `stu2`, `honneur`, `conso`), dossiers en cours |
| `job`, `study`, `indep`, `biz`, `cho` | l'espace du profil en cours (un seul non nul, sauf `study` pour l'apprenti) |
| `stu`, `surend` | financement des études (`h` heures de job par semaine, `loan` prêt garanti) ; plan de surendettement en cours (`{y, until}`) ou `null` |
| `hum`, `couple`, `partner`, `pInc`, `married`, `kids`, `rep`, `home` | vie perso, réputation pro, logement en location |
| `ev`, `evDone`, `evY`, `une`, `yr`, `flags` | décision en cours, dernière année de chaque événement (jamais deux fois en 5 ans), la Une, compteurs de l'année |
| `xp`, `ach`, `hist`, `log`, `humH`, `over` | niveau, succès, patrimoine par année (nominal et réel), journal, humeur par année, fin de partie |

**Migrations** : `migrate()` dans la section sauvegarde. Tout nouveau champ de `ST` y reçoit sa valeur par défaut, et `SAVE_V` augmente. v1 → v2 : `fund` devient `stu` (parents → 10 h de job), un·e salarié·e ou fonctionnaire passe en CDD de 2 ans.

---

## 4. Chiffres officiels (vérifiés, sources en commentaire dans le code)

| Paramètre | Valeur | Source |
|---|---|---|
| Âge légal de départ, génération 2006 | 64 ans (`RETIRE_AGE`) | service-public.fr F14043, vérifiée le 14 août 2026 : 64 ans pour les personnes nées à partir de 1969. La suspension de la réforme (LFSS 2026) ne touche que les générations plus anciennes. |
| Barème de l'impôt 2026 (revenus 2025), par part | 0 % jusqu'à 11 600 €, 11 % jusqu'à 29 579 €, 30 % jusqu'à 84 577 €, 41 % jusqu'à 181 917 €, 45 % au-delà ; plafond de 1 807 € par demi-part | service-public.fr F1419, vérifiée le 15 avril 2026. Le barème du jeu est indexé sur les prix. |
| PTZ | règles des offres émises depuis le 1er avril 2025, toujours en vigueur : en zone A et A bis (nos cinq villes), neuf collectif seulement ; plafonds de revenus 49 000 € (1 personne) à 161 700 € ; coût retenu 150 000 € à 360 000 € ; quotité 50/40/40/20 % selon la tranche | service-public.fr F10871, vérifiée le 15 septembre 2026 |
| SMIC brut 2026 | 1 823,03 € | cahier des charges |
| Prélèvements sociaux | 18,6 % (CTO, PEA, PEE, dividendes) ; 17,2 % (assurance vie, loyers, plus-values immobilières) | décision de Flo du 8 novembre 2026 (comme la v3) |
| Flat tax | 31,4 % (12,8 + 18,6) ; assurance vie avant 8 ans : 30 % | idem |
| Impôt sur les sociétés | 15 % jusqu'à 42 500 € de bénéfice, 25 % au-delà | cahier des charges |
| Apprentissage | 43/51/67 % du SMIC (18-20 ans), 53/61/78 % (21-25 ans), 100 % ensuite | cahier des charges |
| Bourse CROUS 2026 | 1 454 € (0 bis) à 6 335 € (échelon 7) par an | cahier des charges |
| Livret A | 1,5 % au 1er février 2026, puis (inflation + taux de la BCE) / 2 arrondi au dixième, plancher 0,5 % ; plafond 22 950 € | cahier des charges, formule simplifiée |

---

## 5. Règles du moteur (valeurs de référence)

- **Économie** (`drawEco`) : inflation autour de 2 % (persistance 0,6, choc +2,5 points une année sur 20) ; marché actions : krach une année sur 8 (−25 % ± 7), sinon +11,5 % ± 12 (moyenne ≈ 7 %, volatilité ≈ 16 %) ; taux de la BCE qui suit l'inflation ; crédit immobilier sur 20 ans = taux BCE + 1,3 point.
- **Placements** : rendement d'un support = `mu + b × (marché − 7 %) + i × bruit` (`ASSETS`), fonds euros = taux BCE + 0,5 point.
- **Immobilier** : indice par ville = inflation + 0,4 % ± 3,5 %, −5 % si les taux montent de plus de 0,8 point.
- **Budget du mois** (`budget()`) : revenus du travail (`workLines`), du patrimoine (`patLines`), charges fixes (`fixedLines` : logement, vie courante, transports, téléphone, assurances, enfants 200 €, abonnements, frais de scolarité, impôt à la source, impôt sur les loyers), crédits (`credLines`). Vie courante = 380 € (160 € chez les parents, 200 € pour un·e étudiant·e) + 25 % des revenus au-delà de 1 200 €, × 0,85 en couple. Tout est indexé sur `ST.cpi`. En couple, le loyer est partagé.
- **Études** : financement combinable, jamais par les parents (`ST.stu` : `h` heures de job étudiant par semaine de 0 à 20, payées au SMIC horaire net `SMIC_H_NET` ; `loan` prêt garanti par l'État jusqu'à 20 000 € `PGE_MAX`, débloqué chaque mois, plafonné par `study.lent`), bourse CROUS selon l'échelon tiré au départ, APL si on loue (apprenti·es compris). Réussite aux examens (`examOk`) = 0,86 + (humeur − 60)/300 + (réputation − 50)/400 − 0,6 point par heure de job, bornée 60-97 % (apprenti·e : 96 %) ; un job lourd coûte de l'humeur (− h/5 par an). La création propose d'office le budget équilibré (`bal` : heures puis prêt). L'école de commerce (10 000 €/an) ne s'équilibre que chez les parents avec 20 h de job : c'est voulu, l'étape « Études » ajoutera le Bachelor en 3 ans et l'alternance.
- **Découvert** à la clôture (`cover`) : Livret A, puis ventes forcées des placements (`forceSell`, impôt de chaque enveloppe), puis crédit plafonné : prêt étudiant bancaire à 3 % différé (études, 25 000 € de 2026 au plus, `STU2_MAX`) ou crédit de trésorerie à 6,5 % sur 5 ans (au plus 6 mois de revenus du travail, 3 000 € au minimum : `creditCap`). Au-delà : **surendettement** (`startSurend`) : plan de 7 ans à 0 %, plus aucun crédit, le reste de l'année se finance en se serrant la ceinture (humeur −6), et ce qui reste dû à la fin du plan est effacé (`endSurend`). Jamais de dette sans limite : pire moment mesuré ≈ −45 000 € réels.
- **Sortie des études** (`graduate`, provisoire jusqu'à l'étape « Création ») : chaque filière démarre seule, au palier 1 du §4.5 de la v2 (`DOMS.etudes[].out` → `INDEP`) : consultant·e marketing (commerce), ingénieur·e conseil (ingénieur), infirmier·ère libéral·e, avocat·e collaborateur·rice, développeur·se freelance, artisan·e. La société se crée ensuite par « Créer ma boîte » (`bridgeBiz` → `createBiz` : mise, prêt d'honneur, salaire de départ du secteur complété si l'épargne ne couvre pas un an de budget, prêt de création à 5,5 % sur 5 ans qui finance un an de ce salaire).
- **CDD de transition** (`takeJob`, retour à l'emploi, fin de reconversion) : 2 ans (`job.cdd`), puis chômage indemnisé (`cddEnd`), le temps de lancer un nouveau projet. Après une revente : `pause` (entre deux projets).
- **Carrière** (`careerYear`) : salarié·e : inflation × 0,95 + progression par tranche d'âge (`g` du domaine), santé de l'entreprise tirée chaque année (intéressement, plan social) ; fonctionnaire : grille `GRID.inf`, échelon tous les 1 à 4 ans, point d'indice = inflation × 0,85 ; étudiant·e : partiels réussis selon l'humeur, la réputation et le job (un redoublement au plus) ; chômage : ARE = 57 % du brut pendant 18 mois (27 après 55 ans), puis RSA ; retour à l'emploi selon la réputation.
- **Société** (`bizYear`, moteur de la v1, remplacé à l'étape « Création ») : chiffre d'affaires qui croît (`grow`, amorti avec l'âge), bruit (`vol`), mauvaise année (`risk`), plafond par salarié ; charges = CA × (1 − marge) + fixes + salariés (38 000 €) + salaire du président × 1,8 ; IS ; trésorerie. Trésorerie négative : renflouement automatique si moins de la moitié de ton compte courant, sinon un an de découvert toléré (`B.neg`) ; faillite à la deuxième année dans le rouge ou si le trou dépasse un quart du CA (10 000 € au moins). Le message dit toujours pourquoi, même quand le résultat est positif (remboursement du prêt). Mesuré : ce moteur fait faillite dans 90 à 100 % des créations, c'est la priorité de l'étape 3.

---

## 6. Invariants (testés par `npm run test:s4`)

1. `ST.cash = Σ ST.flow` au centime, chaque année de chaque partie.
2. Aucune valeur non finie dans `ST`, aucune position, dette ou Livret A négatifs, jauges entre 0 et 100.
3. Les vues ne consomment pas de hasard ; même graine, même partie ; une partie sauvegardée puis rechargée continue à l'identique.
4. Un événement ne revient jamais avant 5 ans.
5. Chaque domaine de chaque ville démarre avec un budget fini et une décision, et chaque partie finit à la retraite.
6. Sur mobile (390×844), rien ne déborde, aucune cible de moins de 40 px, les boutons « maintenir » restent atteignables (`e2e.mjs`).
7. Dettes plafonnées : la banque ne prête jamais au-delà du plafond appliqué (`flags.capUsed`), le patrimoine ne passe jamais sous −50 000 € réels.
8. Faillite cohérente : un message de faillite dit toujours sa raison.
9. Les messages éphémères (`.toast`) s'affichent en bas, ne captent pas les touchers et ne recouvrent jamais le pseudo (`e2e.mjs`).

---

## 7. Équilibrage (cahier des charges v2, §8)

`npm run balance:s4` (`tests/balance.mjs`) : 500 parties par filière (`-- --n=100` pour aller vite), mondes appariés entre stratégies. Trois joueurs : **raisonnable** (budget étudiant équilibré, reste à son compte, rebondit après une faillite), **créateur** (pareil, puis crée une société voisine de sa filière à 32 ans avec deux fois la mise, prend la moitié des bénéfices en dividendes), **tout en salaire** (créateur qui se verse le salaire maximum, jamais de dividende).

Point de départ (10 novembre 2026, 100 parties par filière, après l'étape 0) :

| Mesure | Cible | Valeur |
|---|---|---|
| Patrimoine médian à 64 ans, euros de 2026 | 400 à 900 k€ | 563 k€ (OK) |
| Écart entre filières | ≤ ×1,6 | ×1,88 (droit 406 k€, ingénieur 764 k€) |
| Faillite au moins une fois (créateurs) | 25 à 45 % | 95 % : moteur de société de la v1 |
| Tout en salaire / créateur | < ×0,5 | ×1,9 |
| Palier 4 | 3 à 10 % | étape 4 |
| Pire moment | ≥ −50 k€ | −43 k€ (OK) |
| Millionnaires | 10 à 20 % | 1 % |

---

## 8. Avancement

Plan de la v2 (section 9 du cahier des charges v2) :

| Étape | Contenu | État |
|---|---|---|
| Socle (v1) | structure, build, tests, moteur (budget avec inflation, marchés, année), création, en-tête, Accueil, Budget, récap, bilan | fait (`702f3e2`) |
| Réorientation | l'étape 2 de la v1 gardée pour ce qui sert la v2 (chef d'entreprise, chômage et reconversion, CDD de transition, financement participatif, fiche de paie) ; salariat à vie et fonctionnaire retirés ; études obligatoires puis création automatique selon la filière (provisoire) | fait |
| 0. Corrections | dette sans limite, faillite incohérente, Carrière vide pour le demandeur d'emploi, déficit étudiant, agent immobilier, `balance.mjs`, messages sur le pseudo | fait |
| 1. Interactions | appui simple, confirmation en deux temps, « Passer des années », règles sur les parents, taxe foncière, quitter ses parents | à faire |
| 2. Études et tutoriel | 7 filières, financement combinable, examens, redoublement, mention, mentor | à faire |
| 3. Création et moteur d'entreprise | offres, statuts, financement, tableau de bord, leviers, salaire ou dividendes, alertes, faillite et rebond | à faire |
| 4. Croissance | 4 paliers par secteur, rachats, levées, cession | à faire |
| 5. Vie et patrimoine | déménagement, 80 dilemmes, dossiers à 2-3 ans, fin de partie, équilibrage, passe mobile finale | à faire |
| Patrimoine (v1, étape 3) | Placer, Immobilier et dossier de crédit, Shopping : à intégrer dans les étapes 1 et 5 | à faire |
