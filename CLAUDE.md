# La Corbeille : brief pour Claude Code

Ce fichier est lu au début de chaque session. Il décrit le jeu, son architecture, ses règles chiffrées, ce qui ne doit jamais casser et la façon de travailler. **Lis-le en entier avant toute modification**, puis relis la section concernée avant de toucher au code.

Le propriétaire du projet est Flo (GitHub : `Malaraxx`), un professionnel du risque de crédit, à l'aise avec la finance mais qui ne code pas lui-même : il pilote via Claude. Réponds-lui en français, de façon directe et concise, et dis-lui franchement quand une idée est mauvaise. **Vérifie tout avant de lui montrer un résultat.**

---

## 1. Le jeu en une page

La Corbeille est un simulateur de gestion de patrimoine **au tour par tour**, en français, de janvier 2000 (le joueur a 25 ans) au 31 décembre 2050 (75 ans).

- **Un tour = 1 à 3 ans.** Chaque tour s'ouvre sur **une Une** : un événement de marché avec une **décision obligatoire**, comme investir dans une valeur qui s'effondre, souscrire un produit douteux ou acheter un appartement. Il y a parfois en plus **un dilemme de vie perso**, lui aussi obligatoire.
- Le joueur gère ensuite librement son patrimoine : Livret A, compte-titres, PEA, assurance-vie et immobilier. Il clôt le tour, l'**animation** fait défiler les années, puis vient **un bilan unique** pour la période.
- **De 2000 à 2025**, les crises tombent aux vraies dates (bulle internet, 11 septembre, 2008, dette grecque, pétrole 2014, Covid en mars 2020, inflation 2022, IA 2025). Les sociétés sont fictives, et chaque partie redistribue gagnants et perdants pour qu'on ne puisse pas jouer de mémoire. **Après 2025**, marchés et événements sont générés aléatoirement.
- **Fin de partie** : un titre (« Légende de la Corbeille »…), un score, un épilogue narratif, les meilleurs et pires coups, les succès, le récap de chaque investissement avec son TRI, et le journal des décisions. Un bouton permet de copier son résultat pour défier ses amis.

**Public** : Flo et ses amis, souvent eux aussi de la finance. Le jeu doit être **crédible pour un financier**, avec une fiscalité française réaliste et des ordres de grandeur justes, et **amusant pour un non-financier**.

**Les deux versions du jeu** :
- **La version officielle** est un artifact sur claude.ai, partagé par lien, où vivra le futur classement entre amis.
- **La version GitHub Pages** (`https://malaraxx.github.io/la-corbeille/`) sert de vitrine et de sauvegarde.
- Les deux viennent du même fichier source.

---

## 2. Contraintes techniques (non négociables)

1. **Un seul fichier source, autonome** : `src/la-corbeille.html`. HTML, CSS et JS sont en ligne, sans framework, sans dépendance et sans étape de compilation, hormis l'ajout du squelette HTML. La seule ressource externe autorisée : Google Fonts (Bodoni Moda, IBM Plex Sans, IBM Plex Mono), avec des polices de repli.
2. **Le format de la source est celui d'un artifact Claude** : pas de `<!doctype>`, `<html>`, `<head>` ni `<body>`. Le fichier commence par `<title>`. `tools/build.mjs` l'enveloppe dans un squelette complet pour produire `index.html` (GitHub Pages). **Ne modifie jamais `index.html` à la main** : `npm test` échoue s'il n'est pas à jour.
3. **Les règles de l'artifact Claude s'appliquent aussi** (la source y est republiée telle quelle) :
   - pas d'`alert`, de `confirm` ni de `prompt` : les confirmations se font dans la page, en deux clics ;
   - pas de téléchargement de fichier, pas de `window.open`, pas d'iframe ;
   - scripts externes seulement depuis cdnjs, jsdelivr ou unpkg, avec une version exacte (aujourd'hui, aucun n'est utilisé) ;
   - `localStorage` est réservé à la sauvegarde de la partie, toujours dans un `try/catch` ;
   - le hook `window.claude?.hot` sert à la mise à jour à chaud : garde-le.
4. **Thème clair et sombre** : toutes les couleurs sont des variables CSS définies sur `:root`, redéfinies sous `@media (prefers-color-scheme: dark)` avec la garde `:root:not([data-theme="light"])`, puis sous `:root[data-theme="dark"]`. Aucune couleur en dur dans les composants. Seule exception : l'overlay d'animation (`.anim`), volontairement nocturne dans les deux thèmes.
5. **Mobile d'abord** : tout doit fonctionner à 390 px de large, sans défilement horizontal de la page. Les tableaux larges défilent dans leur propre conteneur, ou passent en fiches sur mobile (voir `table.inv`).
6. **Accessibilité** : focus visible, `aria-pressed` sur les boutons à bascule, `role="status"` pour les notifications, respect de `prefers-reduced-motion` (l'animation des années est alors sautée).

---

## 3. Arborescence du dépôt

```
src/la-corbeille.html   ← LA source. Tout se modifie ici.
index.html              ← généré par « npm run build » (GitHub Pages). Ne pas éditer.
tools/build.mjs         ← ajoute le squelette HTML + balises de partage (Open Graph).
tests/run.mjs           ← tests sans dépendance (moteur chargé dans un bac à sable vm).
tests/e2e.mjs           ← partie complète dans Chromium via Playwright (optionnel).
CLAUDE.md               ← ce fichier.
README.md, CHANGELOG.md, PROMPT_DEMARRAGE.md
```

Commandes :

| Commande | Rôle | Durée |
|---|---|---|
| `npm run build` | régénère `index.html` | instantané |
| `npm test` | vérifie que `index.html` est à jour + tests rapides | ≈ 20 s |
| `npm run test:full` | mêmes tests sur 600 parties | ≈ 2 min |
| `npm run balance` | rapport d'équilibrage (OK / WARN) | ≈ 1 min |
| `npm run e2e` | partie complète desktop clair + mobile sombre, captures dans `tests/screenshots/` | ≈ 1 min |
| `node tests/run.mjs --seed=42` | rejoue exactement la même série de parties | |

`npm run e2e` exige une installation unique : `npm i -D playwright && npx playwright install chromium`. N'ajoute pas Playwright aux dépendances commitées sans l'accord de Flo.

---

## 4. Architecture du fichier source

Le script est découpé en sections balisées par `/* ===== NOM ===== */`. Dans l'ordre :

| Section | Contenu clé |
|---|---|
| **Données historiques** | `H` (rendements réels 2000-2025 en %, dividendes inclus : tracker, telecom, luxe, banque, petro, aero, pharma, or, oat), `M` (Livret A, fonds euros, taux de crédit, inflation, prix logement/bureaux), `PRE` (krach de mars 2020 appliqué en début de tour), `BETA`, `STORY`, `SP`, `DIVY`, `META` (nom et catégorie de chaque actif), `ENVS` (actifs éligibles par enveloppe), `PX0`, `PNAME`, `ARCH`, `GOALS`, `ADV`, `ACH`, `HIST_YEARS`, `PNAMES` |
| **Outils** | `S` (état global), formats `fmt` `fmtPx` `pct` `rate` `pc0` `f1`, `rnd`/`gauss` (PRNG mulberry32 graine dans `S.rng`), `nm`, `hr`, `P()` (partenaire), `age(y)` |
| **Fiscalité** | `psRate(y)`, `ctoRate(y)`, `ctoRateLbl`, `peaCap`, `livretCap`, `envYears` |
| **État** | `genHistory()` (déformation de l'histoire par partie), `newGame(arch, goals)`, accesseurs (`net`, `envTotal`, `hv`, `ev`…), `epargneYear`, `mood`, `unlock` (succès), `ext` (flux externes), registre `lg*` + `irr` |
| **Ordres** | `buyIn`, `sellIn`, `livIn`/`livOut`, `wdCalc`/`withdraw` (retraits d'enveloppe), `raiseCash` (ventes forcées si le compte est dans le rouge), `spend` |
| **Immobilier** | `effort`, `propQuote`, `buyProp`, `pvImmoTax`, `propSaleCalc`, `sellProp`, `canReneg`/`reneg` |
| **Chocs** | `shock(map)`, `setPending(y,k,%)` (issue future imposée), `sellEverywhere` |
| **Répartition** | `alloc`, `eqShare`, `placeIdle(p)` (placer l'argent qui dort sans vendre), `rebalance(p)`, `dry(fn)` (aperçu sur une copie de l'état) |
| **Fiches analyste** | `peekR(k,y)` (rendement futur déjà connu du moteur), `fwdScore(a)` ∈ [−1, 1], `makeFiche(a,s)` |
| **Événements historiques** | `HIST[année]` : `{view, start?, act?, fiche?, crash?, month?}` |
| **Événements futurs** | `FUT[id]` : `{w (poids), make(y), view(p), act?, can?, fiche?, crash?}` |
| **Vie perso** | `LIFE[id]` : `{view, act, can?}` + `retireOpts`. Ids : burnout, rupture, weekend, panique, diner, promo, vacances, mariage, enfant, sport, ami, rencontre, maison, fire, retraite |
| **Tours** | `pickFut`, `pickLife(crash)`, `startTurn(y)` (choc, événement, pré-génération des années futures, fiche, conseillers, vie perso), `answerEvent`, `answerLife`, `turnReady` |
| **Simulation** | `genYear(y)` (années > 2025), `yearReturns(y)`, `simulateYear(y)` (le cœur : rendements, impôts, loyers, épargne/retraite, repères, ventes forcées, humeur, succès), `endTurn`, `nextBilan`, `finalScore` |
| **Sauvegarde** | `KEY='la-corbeille-v2'`, `save`/`load`/`wipe` |
| **Interface** | `U` (état d'interface non sauvegardé), `statusBar`, `uneCard`, `ficheHtml`, `advHtml`, `lifeCard`, `allocSec`, `book`/`bookRow`/`envHead`, `spark`, `desk`, `invSec`/`invData`/`invTable`, `turnView`, `chart`, `bilanView`, `animHtml`/`runAnim`, `endView`/`epilogue`/`coups`/`shareText`, `introView`, `render` |
| **Événements DOM** | délégation unique : `onClick` lit `data-act` (et `data-key`, `data-env`…), `onInput` pour les champs. `boot()` charge la sauvegarde **et applique les migrations** |

**Rendu** : `render()` reconstruit tout le HTML via `innerHTML` à chaque action. Les vues sont des fonctions pures de `S` et `U`. Ne garde aucun état dans le DOM, sauf la valeur en cours de saisie des champs (mise à jour en direct dans `onInput`, sans re-rendu).

### Modèle de données `S` (sauvegardé)

```
v:2, rng, phase:'turn'|'bilan'|'end', year, month, clk:{t,y}   // horloge du registre (t = année décimale)
arch, goals[2], start (capital initial), ach{id:année}, achNew[], advRec{conseiller:{n,ok}}, flair
cash (compte courant), liv (Livret A)
acc.cto.hold{id:{v,b}}                       // v = valeur, b = prix de revient
acc.pea / acc.av : {hold, cash, vers (versements nets), open (année)}
px{id}, ph{id:[prix fin d'année…]} (courbes 10 ans), pxPrev (prix au dernier tour), lastR
hr{actif:[26 rendements]} (histoire déformée), fut{année:{r,mac}} (années > 2025 pré-générées)
props[{uid,type:'logement'|'bureaux'|'maison',buyYear,cost,loan:{p,r,n,ann}|null,rentMult,vacantUntil,noRent,mode,flows[]}]
idx{logement|bureaux|maison:{price,rent}}
macro{infl,rate,credit,livret,euros}, mNow (taux affichés pendant le tour)
lossCarry, pfu, pfuNext, flags{…}, pending{année:{actif:%}}, mods{année:{bias}}, jeton{name,alive,born}, avAb
revenu, tauxEp, defl (indice des prix), bench{liv,trk}, yearExt, extTot
hist[{x,net,liv,trk}], bilans[], event{src,id,p,answered,result,fiche?,adv?}, life{id,v,answered,result,name?}, nextY
usedFut[], usedLife[], uid, log[{y,t,r}], turnShock, lock, well{sum,n}, profile
lg{lines{clé:{env,id,label,first,lastSell,flows[{t,y,a}]}}, env{pea[],av[]}, props[]}
me{humeur,relation,partner,first,exes[],marie,enfants,ruptures,burnouts,retireYear,gap,besoin,pension,early,pension62,ruined}
```

**Tout nouveau champ de `S` exige une migration dans `boot()`.** Les amis de Flo ont des parties en cours dans leur navigateur : on ne casse jamais une sauvegarde, et on ne change pas `KEY` sans migrer.

---

## 5. Règles du jeu (valeurs de référence)

### Personnages (`ARCH`)
| Id | Capital | Salaire | Épargne | Situation | Particularité | Coefficient de score |
|---|---|---|---|---|---|---|
| heritier | 100 000 € | 30 000 € | 20 % | en couple (Camille) | | ×1 |
| ingenieure | 15 000 € | 42 000 € | 25 % | célibataire | carrière +2,5 %/an réel avant 45 ans | ×0,6 |
| infirmier | 25 000 € | 24 000 € | 15 % | en couple (Léa) | humeur +1/an (`trait:'zen'`) | ×2,3 |
| fondatrice | 50 000 € | 32 000 € | 20 % | célibataire | épargne × max(0, 1 + N(0 ; 0,7)) chaque année | ×1 |

Les coefficients égalisent les scores médians (contrôlés par `npm run balance` : rapport compris entre 0,75 et 1,33 face à l'héritier).

### Objectifs de vie (`GOALS`, 2 au choix, bonus additifs)
rp35 : résidence principale achetée au plus tard en 2010 (+20 %) · fire : plus de travail au plus tard en 2030 et jamais ruiné (+40 %) · million : ≥ 1 M€ en euros de 2000 en 2050 (+40 %) · famille : finir en couple avec au moins 2 enfants (+30 %) · serein : aucune vente panique, aucun burn-out, jamais une humeur sous 40 en fin d'année (+10 %) · rentier : deux biens locatifs en même temps (+25 %). Chaque objectif a une fonction `st(fin)` qui renvoie 1 (atteint), 0 (en cours) ou −1 (raté).

### Score
`score = patrimoine net en k€ de 2000 × (0,4 + 1,2 × bien-être/100) × (1 + Σ bonus des objectifs atteints) × coefficient du personnage`

Le bien-être moyen est calculé chaque année : 0,6 × humeur + 0,4 × couple (30 si célibataire). Le titre combine le niveau financier (patrimoine face au repère « mêmes versements, tout sur le Tracker » : ≥ 1,05 / ≥ 0,75) et le niveau de vie (bien-être ≥ 62 / ≥ 48), selon une grille 3×3 dans `finalScore`.

### Marchés
- **2000-2025** (`genHistory`) :
  - Tracker = réel + N(0 ; 4 %).
  - Chaque action reçoit un bêta tiré au hasard (bêta de référence × e^N(0 ; 0,35), borné entre 0,4 et 1,8).
  - Son résidu propre ne garde que 12 % de l'histoire réelle (85 % pour les années « racontées » par la Une, voir `STORY`), plus du bruit et une dérive de ±5 %/an propre à la partie.
  - Or = 25 % réel + 75 % moyenne + N(0 ; 12 %). OAT = réel + N(0 ; 1,5 %).
  - Objectif : connaître l'histoire ne doit pas rapporter plus de ×2,6 face à un joueur passif.
- **Après 2025** (`genYear`) : marché = 8 % + N(0 ; 15 %) + biais post-krach, avec 4 %/an de risque de choc de −25 %. Actions = d + 1,5 % + β × (marché − 8 %) + N(0 ; vol). L'inflation revient vers 2 %, et les taux, le Livret A et le fonds euros suivent.
- **Issues imposées** (`setPending`) :
  - banque en 2009 : +80 % (75 %) ou −50 % ;
  - Grèce 2012 : −65 % (75 %) ou +45 % ;
  - LivrOClic 2021 : ×12 (10 %), +50 % (30 %) ou perte totale ;
  - géant en chute : +70 % (55 %) ou −55 % ;
  - bulle : −50 % (50 %) ou +30 % ;
  - fonds IA 2025 : +45 % ou −30 %.
- **Jetons numériques** : risque de disparition de 5 % par an les 2 premières années, puis 12 %. Hausse annuelle = e^(0,1 + N(0 ; 0,9)) − 1, plafonnée à ×20. Ce n'est jamais « le bitcoin ».

### Fiscalité française (simplifiée mais datée)
- **Prélèvements sociaux** : 10 % (< 2005), 11 %, 12,1 % (2009-10), 13,5 % (2011), 15,5 % (2012-17), puis 17,2 %.
- **Compte-titres** : plus-values à 16 % + PS jusqu'en 2012, ≈ 30,5 % de 2013 à 2017, flat tax 30 % ensuite. L'événement `fisc` peut la faire passer à 36 %. Les dividendes sont taxés chaque année au même taux (rendement `DIVY`) et les moins-values sont reportables.
- **PEA** : actions françaises et Tracker. Plafond 132 000 € avant 2014, 150 000 € ensuite. Avant 5 ans, tout retrait clôture le PEA et les gains sont taxés comme au compte-titres. Après 5 ans, seuls les PS s'appliquent. Vendre une ligne garde l'argent dans l'enveloppe.
- **Assurance-vie** : fonds euros (PS prélevés chaque année sur les intérêts), Tracker, OAT et fonds IA. Avant 8 ans, gains taxés comme au compte-titres. Après 8 ans, abattement de 4 600 € (9 200 € en couple marié) puis 7,5 % + PS.
- **Livret A** : exonéré, plafond 15 300 € puis 22 950 € (2013).
- **Immobilier locatif** : revenus (loyer − charges − intérêts) taxés à 30 % + PS. Plus-value à 19 % + PS, avec abattements pour durée de détention (exonération d'impôt à 22 ans, de PS à 30 ans). La résidence principale est exonérée.

### Immobilier
- **Achat** : apport de 20 % + 7,5 % de frais de notaire, crédit sur 20 ans au taux de l'année. Taux d'effort ≤ 35 %, calculé sur les revenus du foyer (salaire × 1,6 en couple) + 70 % des loyers. Pas de crédit à la retraite.
- **Biens disponibles** : T2 à Lille (70 000 € en 2000), bureaux à Euralille (250 000 €, plus risqués après 2020 avec le télétravail) et maison en résidence principale (120 000 €). La maison rapporte le loyer qu'on ne paie plus et coûte 15 % de charges.
- **Vacance locative** : 12 %/an pour le logement, 18 % pour les bureaux (30 % après 2020).
- **Revente** : 5 % de frais, indemnité de remboursement anticipé de 3 %. Renégociation du crédit possible si les taux baissent d'au moins 0,7 point (frais : 1 % du capital restant).

### Épargne, carrière, retraite
- **Épargne annuelle** = salaire × taux d'épargne × couple (1,15, ou 1,25 marié) × 0,82^enfants × humeur (× 0,7 sous 30, × 1,05 au-dessus de 70). Elle arrive sur le compte courant en fin d'année. Le bandeau « argent qui dort » pousse à la placer.
- **Salaire** : suit l'inflation, plus la progression de carrière du personnage (avant et après 45 ans). Une promotion donne +25 %, le dîner d'affaires +8 %.
- **Retraite** : proposée à partir de 2037, à 62, 65 ou 67 ans. Le joueur prélève alors 30, 26, 22 ou 17 % de son dernier salaire par an, et la pension vaut 60 % du salaire.
- **Indépendance financière** (`fire`) : proposée entre 2018 et 2036 si les placements financiers valent au moins 25 × (50 % du salaire). Le prélèvement est alors de 50 % du salaire, divisé par deux à 62 ans.
- **Ruine** : si le patrimoine ne suffit plus à la retraite, ce n'est pas une faillite (pas de dette). Le joueur se serre la ceinture (humeur −15) et `S.me.ruined` passe à vrai.
- **Faillite** : uniquement si le compte est dans le rouge **avant** la retraite et qu'il ne reste rien à vendre.

### Vie perso
- **Humeur et couple** vont de 0 à 100. Effets par an :
  - en couple : humeur +3 si la relation est ≥ 60, −3 si elle est < 30 ;
  - célibataire : humeur −2 ;
  - enfants : +1 ; retraite : +2 ;
  - patrimoine en chute de plus de 20 % : −10 ; en hausse de plus de 15 % : +4 ;
  - la relation s'use de −2 par an (−1 si marié).
- **Dilemmes forcés** :
  - humeur ≤ 18 → burn-out ;
  - relation ≤ 10 → rupture (partage du patrimoine si mariés) ;
  - krach avec humeur < 35 → panique (vente de toutes les actions) ;
  - krach en couple → week-end (70 % des cas), qui bloque le portefeuille pour le tour ;
  - célibataire → rencontre (50 %).
- **Autres dilemmes** : tirés dans environ 65 % des tours restants, au plus 2 fois chacun (5 pour les enfants), avec un poids renforcé pour le mariage, les enfants et la maison.

### Conseillers (`ADV`)
Sur les événements où l'on peut investir, deux conseillers donnent leur avis si |`fwdScore`| ≥ 0,15. Pour chacun, `a` = probabilité de dire « achète » quand c'est une bonne affaire, `b` = la même probabilité quand c'est une mauvaise :

| Conseiller | a | b | Fiabilité mesurée |
|---|---|---|---|
| Gérard (le banquier) | 0,55 | 0,45 | ≈ 54 %, et il pousse toujours le fonds subprime de 2007 |
| Kévin (le collègue) | 0,9 | 0,75 | ≈ 51 % |
| Mamie Odette | 0,15 | 0,05 | ≈ 63 % |
| Sophie (l'analyste) | 0,8 | 0,2 | ≈ 80 % |

Le verdict « bien vu / raté » est donné au bilan, et l'historique de chacun est affiché dans la Une. Qu'Odette ait raison 63 % du temps est voulu : ne rien faire est souvent le bon choix.

### Fiches analyste
Chaque indicateur est « sain » avec une probabilité de 0,5 + 0,4 × `fwdScore`, bornée entre 0,08 et 0,92. Les indicateurs : dette nette/EBITDA, couverture des intérêts, PER, croissance (ou CET1 et créances douteuses pour la banque), plus un consensus des analystes **volontairement non informatif**. Un joueur qui lit les fiches doit faire au moins 1,15 fois mieux qu'un acheteur naïf de paniques.

### Succès (`ACH`, 14)
diamant (≥ 50 000 € d'actions fin 2008) · panique (investir ≥ 10 % du patrimoine pendant un krach) · sommet (vendre une bulle juste avant qu'elle éclate) · couteau (acheter une chute qui continue, mise ≥ 5 000 €) · flair (3 achats à contre-courant réussis) · lune (jeton ×10) · rekt (perdre ≥ 5 000 € sur un jeton) · angel (LivrOClic racheté) · proprio (résidence principale) · empire (3 biens) · million (1 M€ avant fin 2024) · libre (plus de travail avant 60 ans) · fidele (marié·e à son premier amour, sans rupture) · patient (PEA de 20 ans valant plus d'un million). Aucun succès ne doit être obtenu par plus de 60 % des joueurs aléatoires.

---

## 6. Invariants : ce qui ne doit jamais casser

`npm test` les vérifie tous. S'il échoue, tu n'as pas fini.

1. **Identité de caisse** : `cash = capital initial + Σ flux externes (ext) + Σ flux du registre`, au centime, dans toutes les parties sans divorce. Conséquence : tout mouvement d'argent hors investissement (épargne, dépenses de vie, héritage, retraite) passe par `ext()`. Tout mouvement d'investissement passe par `buyIn`, `sellIn`, `livIn`, `livOut`, `withdraw` ou `lgProp`. Ne modifie jamais `S.cash` directement pour de l'argent qui entre ou sort.
2. **Le rééquilibrage ne crée ni ne détruit d'argent** : `net() + impôt` est inchangé. `dry()` ne modifie pas l'état, et l'aperçu donne le même résultat que l'exécution.
3. **Aucune valeur non finie (NaN, Infinity)** et **aucune position négative** dans `S`. Le plafond du PEA est respecté.
4. **Pas de fausse faillite** : une faillite n'est déclarée que s'il ne reste rien à vendre.
5. **Déterminisme** : à graine égale (`--seed`), le résultat est identique. Le jeu tire tout son hasard de `rnd()`. Les fonctions `view()` doivent être **pures** : jamais de `rnd()` dedans, car elles sont appelées plusieurs fois par tour. Le hasard va dans `make()`, `start()`, `act()` ou au moment du tirage, dans `startTurn`.
6. **Sauvegardes compatibles** : un aller-retour JSON en cours de partie redonne le même état. Les anciennes sauvegardes sont migrées dans `boot()`.
7. **`index.html` à jour** (`npm run check`).

## 7. Équilibrage : cibles actuelles (`npm run balance`)

| Mesure | Cible | Dernière valeur |
|---|---|---|
| Oracle historique / joueur passif (patrimoine 2025) | ≤ ×2,6 | ×2,28 |
| Passif PEA / repère Tracker sans frottements (2050) | 0,75 – 0,95 | 0,83 |
| Lecteur de fiches / acheteur naïf | ≥ ×1,15 | ×1,62 |
| Score du carriériste < score de l'équilibré | vrai | 437 < 694 |
| 10e centile du patrimoine d'un joueur passif | > 0 | 131 k€ |
| Score médian de chaque personnage / héritier | 0,75 – 1,33 | 0,93 – 1,16 |
| Objectifs visés : rp35 ≥ 80 %, famille ≥ 50 % (infirmier) et ≥ 25 % (héritier), fire 25 – 70 %, rentier ≥ 70 % | | 100 / 63 / 38 / 43 / 100 % |
| Sophie ≥ 70 %, Kévin ≤ 60 % | | 81 / 52 % |

Si tu modifies un paramètre de jeu, lance `npm run balance`, corrige les WARN et mets à jour ce tableau.

---

## 8. Conventions

**Textes de l'interface** :
- Français, tutoiement, phrases courtes et concrètes, vocabulaire du joueur : « argent qui dort », pas « liquidités non allouées ».
- Pas d'incise entre tirets cadratins, pas de formule creuse.
- Un bouton dit exactement ce qu'il fait, et le message qui suit le confirme (« Placer l'argent qui dort », puis « Placé : … »).
- Une erreur explique quoi faire (« Il te manque 3 200 €. Vends d'abord une ligne »).
- Écriture inclusive légère (« marié·e ») uniquement là où le joueur est désigné.

**Nombres** :
- Toujours `fmt` (euros arrondis, espace insécable, vrai signe moins « − »), `pct` (signe et virgule), `rate` (2 décimales).
- `font-variant-numeric: tabular-nums` dans les colonnes.
- Les rendements internes sont en fraction (0,05), affichés en %.

**Design** :
- Esthétique « salle des marchés / journal financier » : papier saumoné, encre aubergine, accent bleu canard.
- Polices : Bodoni Moda pour les titres, IBM Plex Sans pour le texte, IBM Plex Mono pour les chiffres.
- La palette des graphiques (`--c1` à `--c5`) a été validée pour le daltonisme. Ne la change pas sans revalider (5 couleurs au maximum, toujours avec une légende chiffrée).
- Le vert et le rouge (`--up`, `--down`) sont réservés aux gains et aux pertes.

**Code** :
- Une action utilisateur = un `data-act` traité dans `onClick`, puis un `render()`.
- Toute nouvelle mécanique monétaire passe par les fonctions d'ordre existantes, pour hériter du registre, de la fiscalité et des invariants.
- Un nouvel événement = une entrée dans `HIST`, `FUT` ou `LIFE`, avec un texte crédible, une décision obligatoire et des conséquences chiffrées affichées dans les choix.

---

## 9. Façon de travailler (à chaque session)

1. Relis la section concernée de ce fichier et le code correspondant **avant** de proposer quoi que ce soit.
2. Si la demande est ambiguë, coûteuse ou touche à l'équilibrage, pose une question courte à Flo. Sinon, fais-le.
3. Modifie **uniquement** `src/la-corbeille.html` (et les tests ou la doc si nécessaire).
4. `npm run build`, puis `npm test`. Si l'équilibrage est touché, `npm run balance`. Si l'interface est touchée, `npm run e2e`, puis **regarde les captures** desktop et mobile.
5. Si `S` change, écris la migration dans `boot()` et teste un rechargement.
6. Mets à jour `CHANGELOG.md` et, si une règle change, ce fichier (sections 5 et 7).
7. Fais un commit en français, au format « Ajoute … / Corrige … / Équilibre … », puis pousse sur `main`. GitHub Pages se met à jour tout seul en une à deux minutes.
8. Rappelle à Flo de **republier la version officielle sur Claude** : il ouvre une conversation sur claude.ai, joint `src/la-corbeille.html` ou colle le lien de l'artifact existant, et demande à Claude de mettre à jour cet artifact avec ce fichier. Le lien et les parties en cours sont conservés.
9. Termine par un résumé court : ce qui a changé, résultat des tests, ce que Flo doit vérifier en jouant.

**À ne pas faire** :
- introduire un framework, un bundler ou un backend ;
- éditer `index.html` ;
- casser une sauvegarde ;
- utiliser `alert` ou `confirm` ;
- mettre du hasard dans une fonction `view()` ;
- modifier `S.cash` sans passer par `ext()` ou une fonction d'ordre ;
- livrer sans avoir lancé les tests.

---

## 10. Feuille de route (par priorité)

1. **Classement entre amis** dans la version officielle, avec le stockage partagé des artifacts Claude (sans serveur). Chaque partie terminée enregistre le pseudo, le personnage, le score, le titre, les objectifs et la date. Classement global et par personnage. Sur GitHub Pages, afficher « le classement est sur la version officielle ».
2. **Partie du jour** : une graine commune dérivée de la date (et une graine partageable via le hash d'URL, par exemple `#graine-123456`) pour que tout le monde joue les mêmes marchés et les mêmes événements. Le classement du jour vient en complément.
3. **Mode Uchronie** : les crises historiques sont redistribuées à des dates aléatoires, pour supprimer l'avantage de qui connaît l'histoire (aujourd'hui ×2,3).
4. **Interface mobile** : onglets Une / Portefeuille / Immo / Historique au lieu du long défilement, plus un tutoriel au premier tour et un glossaire au survol (PER, TRI, PEA, taux d'effort).
5. **Confort** : annuler le dernier ordre du tour, et un graphique de patrimoine annoté avec les événements de vie et les krachs.
6. **Contenu** :
   - événements à conséquences différées : l'ami à qui on a prêté revient investisseur, Karim relance une boîte ;
   - chômage ou licenciement pendant une crise ;
   - SCPI, LMNP, donation aux enfants et succession en fin de partie ;
   - fiscalité du jeton numérique.
7. **Ambiance** : sons optionnels (cloche d'ouverture, krach), activés par un bouton et coupés par défaut.

Pour chaque chantier : proposer d'abord un mini-plan à Flo (règles chiffrées, impact sur l'équilibrage), puis construire, tester et mettre à jour ce fichier.
