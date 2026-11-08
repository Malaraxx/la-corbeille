# La Corbeille : brief pour Claude Code

Ce fichier est lu au début de chaque session. Il décrit le jeu, son architecture, ses règles chiffrées, ce qui ne doit jamais casser et la façon de travailler. **Lis-le en entier avant toute modification**, puis relis la section concernée avant de toucher au code.

Le propriétaire du projet est Flo (GitHub : `Malaraxx`), un professionnel du risque de crédit, à l'aise avec la finance mais qui ne code pas lui-même : il pilote via Claude. Réponds-lui en français, de façon directe et concise, et dis-lui franchement quand une idée est mauvaise. **Vérifie tout avant de lui montrer un résultat.**

---

## 1. Le jeu en une page

La Corbeille est un simulateur de gestion de patrimoine **au tour par tour**, en français, du 1er janvier 2026 (le joueur a 20 ans et sort d'école de commerce) au 31 décembre 2081 (75 ans). Les parties d'avant la 3.13 gardent leurs 25 ans et leur fin en 2076 (`S.a0`).

- **Aucune histoire réelle.** Chaque partie génère **son propre monde** : cycles économiques, krachs, bulles, élections, vagues d'innovation. Tout obéit à des règles économiques réelles (les crises naissent des excès, la banque centrale réagit à l'inflation, une Bourse chère rapporte moins ensuite), mais rien n'est écrit d'avance. Connaître l'histoire ne donne aucun avantage.
- **Un tour = une année.** Tout tient sur **un seul écran, sans défilement de la page** : une barre d'argent toujours visible (compte courant, Livret A, placements, immobilier, patrimoine), la navigation avec le bouton de fin d'année, puis **cinq onglets** en cartes : **Profil** (l'année, les décisions obligatoires, les conseils de Sophie, le foyer, le budget du mois), **Portefeuille** (liquidités et où investir), **Immobilier** (logement, catalogue par ville, dossier de crédit), **Carrière** ou **Ma boîte** (salaire, création d'entreprise, tableau de bord de ta boîte), **Patrimoine** (le résumé).
- Les décisions obligatoires s'ouvrent **en fenêtre au début de l'année, une à la fois**, et bloquent tout le reste tant qu'elles ne sont pas prises. Environ deux années sur trois, **une Une** impose une **décision obligatoire** (krach, présidentielle, bulle, valeur en chute, lancement d'un fonds thématique, produit douteux…). Il y a parfois en plus **un dilemme de vie perso**, lui aussi obligatoire. Les années sans aucune décision passent d'affilée dans l'animation, puis une fenêtre les résume (interrupteur « Passer les années calmes », activé par défaut).
- Au départ, le joueur **crée son profil** : ville (Lille, Lyon, Paris, Bordeaux, Marseille), fourchette de salaire **ou ses propres chiffres** (« Mes chiffres » : salaires, loyer et taille du logement, dépenses courantes, voiture, autre crédit), épargne de départ, célibataire ou en couple, deux objectifs. Puis il choisit son logement (louer, rester chez ses parents, colocation ou acheter, selon ses moyens, avec l'avis de Sophie). Rien n'est placé à sa place.
- Le **budget est réel** : loyer ou mensualités, voiture, enfants, imprévus. Ce qui reste est épargné. Les achats « se faire du bien » (sorties, vacances, cadeau…) font monter l'humeur et le couple contre de l'argent. On passe à l'année suivante, l'**animation** fait défiler l'année, puis vient le **bilan**.
- **Une histoire en cinq chapitres** (« Les débuts », « Bâtir », « Le milieu de la vie », « Préparer la suite », « Transmettre »), avec des personnages récurrents (Karim, ton meilleur ami, Kévin, Sophie, tes parents, ton conjoint, tes enfants) et des fils narratifs : chaque choix important revient des années plus tard en citant l'année et le montant.
- **Fin de partie** : un titre (« Légende de la Corbeille »…), un score, une biographie en cinq paragraphes (un par chapitre), ce que sont devenus les tiens, les meilleurs et pires coups, les succès, le récap de chaque investissement avec son TRI, et le journal des décisions. Un bouton permet de copier son résultat pour défier ses amis.

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
5. **Mobile d'abord, un seul écran** : tout doit fonctionner à 390 px de large, sans défilement horizontal de la page. Sur ordinateur (1280 × 720), la page ne défile jamais : chaque carte (`.card`) défile seule si besoin ; sur téléphone, seule la scène (`.stage`) défile. `npm run e2e` le vérifie. Les tableaux larges défilent dans leur propre conteneur, ou passent en fiches sur mobile (voir `table.inv`).
6. **Accessibilité** : focus visible, `aria-pressed` sur les boutons à bascule, `role="status"` pour les notifications, respect de `prefers-reduced-motion` (l'animation des années est alors sautée).

---

## 3. Arborescence du dépôt

```
src/la-corbeille.html   ← LA source. Tout se modifie ici.
index.html              ← généré par « npm run build » (GitHub Pages). Ne pas éditer.
tools/build.mjs         ← ajoute le squelette HTML + balises de partage (Open Graph).
tools/monde.mjs         ← raconte un monde généré, année par année (pour juger sa crédibilité).
tests/run.mjs           ← tests sans dépendance (moteur chargé dans un bac à sable vm).
tests/e2e.mjs           ← partie complète dans Chromium via Playwright (optionnel).
CLAUDE.md               ← ce fichier.
README.md, CHANGELOG.md, PROMPT_DEMARRAGE.md
```

Commandes :

| Commande | Rôle | Durée |
|---|---|---|
| `npm run build` | régénère `index.html` | instantané |
| `npm test` | vérifie que `index.html` est à jour + tests rapides | ≈ 45 s |
| `npm run test:full` | mêmes tests sur 600 mondes et 480 parties | ≈ 4 min |
| `npm run balance` | rapport d'équilibrage (OK / WARN) | ≈ 4 min |
| `npm run e2e` | partie complète desktop clair + mobile sombre, captures dans `tests/screenshots/` | ≈ 1 min |
| `npm run monde -- --seed=42` | affiche un monde généré, année par année | instantané |
| `node tests/run.mjs --seed=42` | rejoue exactement la même série de parties | |

`npm run e2e` exige une installation unique, sans l'enregistrer dans `package.json` : `npm i --no-save playwright@1.49.1 && npx playwright install chromium`. N'ajoute pas Playwright aux dépendances commitées sans l'accord de Flo.

---

## 4. Architecture du fichier source

Le script est découpé en sections balisées par `/* ===== NOM ===== */`. Dans l'ordre :

| Section | Contenu clé |
|---|---|
| **Données du monde** | `Y0` (2026), `A0`/`YN` (âge de départ et dernière année de la partie en cours, posés par `setA0` dans `newGame` et `boot`), `AY(a)` (l'année de tes « a » ans : toute règle d'âge s'écrit avec, jamais `Y0+n`), `SALAIRES`, `EPARGNES`, `PARTNERS`, `PRESETS`, `coefOf`, `prof()`, `STOCKS`, `THEMES` (`th1`-`th3`), `EQUITY`, `SP` (paramètres des actions), `DIVY`, `META`, `ORDER`, `ENVS`, `PX0`, `BIENS` (immobilier par ville, `k` = loc/bur/rp), `GOALS`, `ADV`, `ACH`, `PHASES` et `TRANS` (cycle économique), `W0` (France fin 2025), `THEME_POOL` et `TR` (vagues d'innovation), `PARTIS`, `PRENOMS`, `NOMS`, `PORTRAITS`, `PROG` (programmes), `STARTUPS`, `JETONS` |
| **Outils** | `S` (état global), formats `fmt` `fmtPx` `pct` `rate` `pc0` `f1`, `rnd`/`gauss` (PRNG mulberry32, graine dans `S.rng`), `nm`, `P()` (partenaire), `age(y)` |
| **Fiscalité** | tout vient de `S.pol` : `psRate()` (compte-titres, PEA, parts de société), `psFRate()` (assurance-vie, foncier, plus-values immobilières), `ctoRate()` (= `ir` + `ps`), `avRate()` (= `ir` + `psF`), `ctoRateLbl`, `peaCap`, `livretCap`, `envYears` |
| **État** | `makeThemes`, `themeStage(T,y)` (étape d'une vague à une date, fonction pure), `newGame(arch, goals)`, accesseurs (`net`, `envTotal`, `hv`, `ev`…), `epargneYear`, `mood`, `unlock`, `ext`, registre `lg*` + `irr` (`lgProp` alimente aussi `S.yearProp` pour le repère), `mvRec` (ordres passés en janvier), `propNet`, `benchRef` (repères ETF Monde et Livret A, immobilier compris) |
| **Ordres** | `buyIn`, `sellIn`, `livIn`/`livOut`, `wdCalc`/`withdraw`, `raiseCash` (ventes forcées), `spend` |
| **Immobilier** | `annuity`, `loanAnn`/`loanLeft`/`payLoan` (prêt principal + PTZ), `effort`, `ptzOk(type, use)`, `propQuote(type, n, use)`, `bestDur`, `buyProp(type, mode, n, use)` (use : 'rp' pour y vivre, 'loc' pour louer), `pvImmoTax`, `propSaleCalc`, `sellProp`, `canReneg`/`reneg`, et pour se loger : `cityRP`, `canRent`, `bestRental`, `bestBuy`, `moveTo`, `buyHome` |
| **Chocs** | `shock(map)` (clés `loc`/`bur`/`rp` pour l'immobilier), `setPending(y,k,%)`, `sellEverywhere`, `ctoLatent`, `purgeCto` |
| **Répartition** | `alloc`, `eqShare`, `placeIdle(p)`, `rebalance(p)` (passent par l'ETF Monde), `dry(fn)` |
| **Fiches analyste** | `peekR(k,y)` (rendement de l'année déjà tiré), `fwdScore(a)` ∈ [−1, 1], `makeFiche(a,s)` (fiche spéciale pour les fonds thématiques) |
| **Monde** | `drawPhase(w, exo)`, `crisisRisk(w)`, `isElection(y)`, `makeElection()`, **`genYear(y)`** : tire la phase, la macro, les chocs, l'élection et les rendements de tous les actifs pour l'année |
| **Événements** | `EVT[id]` : `{forced?, w(y,f), make(y,f), view(p), act?, fiche?, crash?}`, `progText`/`applyProg`, `pickEvent(y,f)` |
| **Vie perso** | `LIFE[id]` : `{view, act, can?}` + `retireOpts`. `act` peut renvoyer `{err}` (choix refusé, la question reste posée). Ids : burnout, rupture, weekend, panique, licenciement, diner, promo, vacances, mariage, enfant, sport, ami, rencontre, logement, panne, fire, retraite |
| **Carnet** | `headline(y)`, `makeNotes(y, head, imp)`, `kidLine`, `imprevu(y)`, `conseils()`, `rappels()`, `ACHATS`/`achatState`/`acheter`, et le départ : `homeOptions`, `recoHome`, `un`, `sophieHome`, `onbHome`, `onbNext` |
| **Histoire** | `CHAPS`/`chapOf`, distribution (`storyInit`, `storyTraits`), versions de texte (`vers`, `V`, `deja`, `NV`/`NVL`), fils (`openTh`, `endTh`, `dueThread`), moments racontés sans fenêtre (`NOTES`, `playNotes`, `chapFill`), moments de vie en fenêtre (`STORY`, ajoutés à `LIFE` avec `story:true`), `chapSnap`/`chapLine`, `biography`, `threadEnds`, `closeStory`, `elecStake`, héritage (`inherit`, `placeGift`), frais de famille (`careCost`, `studCost`, `famCost`), `kidThreads`, `storyMigrate` |
| **Carrière et entreprise** | `DOMS` (domaines), `HITS`, `STARTUPN`, `bizOn`/`bizBoss`/`bizWork`/`bizStake`, `baseSal` (salaire de référence), `raiseSal`, `PAYS`/`payOf`/`bizPay`, `bizCreate`, `bizJoin`, `bizOffer`, `bizEnd`, `bizSell`, `bizRetire`, `bizLeave`, `bizHire`, `canRaise`/`raiseAmt`/`bizRaise`, `divAmt`/`bizDiv`, `bizYear` (l'année de la boîte, appelée dans `simulateYear`) ; interface `boiteTab`, `careerView`, `bizChart` |
| **Tours** | `pickLife(crash)` (fils échus d'abord, puis dilemmes pondérés par chapitre `CHW`), `storyYear`, `startTurn(y)` (année, salaire, événement, fiche, conseillers, vie perso, imprévu, notes de la page), `answerEvent`, `answerLife`, `turnReady` |
| **Simulation** | `whyText` (explication du bilan), `movesGain` (ce que les ordres de janvier ont rapporté face à « ne rien toucher »), `simulateYear(y)` (le cœur : rendements, impôts, loyers, épargne/retraite, élection, ventes forcées, puis repères, humeur, succès), `endTurn`, `nextBilan`, `finalScore` |
| **Sauvegarde** | `KEY='la-corbeille-v3'`, `save`/`load`/`wipe`, `migrate()` (complète une partie 3.0 ou 3.1 : logement, ville, enfants, page), `legacyGame()` et `dropLegacy()` (clôture des parties de la version 2) |
| **Interface** | `U` (état d'interface non sauvegardé : `view` onglet, `city` et `dossier` de l'onglet Immobilier, `dur`, `setup` du profil, `fresh` décisions dont le résultat attend « Continuer », `prevMoney` pour l'animation des montants, `toast`, `fx` animations d'entrée au prochain rendu, `quiet` années calmes à résumer, `animList` années de l'animation, `broken` sauvegarde illisible), dessins (`figure(kind, humeur)`, `ICONS`/`icon`, `KICK` type d'événement → icône, `donut`), `moneyBar`/`moneyVals`/`animateCounters`, `navBar`, `decisionModal`/`decisionOrder`/`currentDecision`/`eventDecision`, années calmes (`autoPass`, `quietModal`, `autoBtn`), `profilTab`/`foyerList`/`budgetTable`/`adviceBtn`, `portefeuilleTab`, `immoTab`/`dossierHtml`, `patrimoineTab`, `onbView`, `figure` (petits dessins), `ficheHtml`, `advHtml`, `book`/`bookRow`/`envHead`, `spark`, `invData`/`invTable`/`invBody`, `turnView`, `chart`, `bilanView`, `animHtml`/`runAnim` (une liste d'années : le bilan ou les années calmes, `U.animList`), `endView`/`epilogue`/`coups`/`shareText`, `introView` (création du profil), `warnBox`/`WARN_TXT` (avertissement : jeu inventé, règles simplifiées, pas un conseil en investissement ; sur l'écran de départ et en fin de partie), `rulesModal` (règles du jeu, `U.rules`, ouverte par `data-act="rules"`, fermée par « Fermer » ou Échap, au-dessus de toute autre fenêtre), `brokenView`/`stash` (sauvegarde illisible), `render` (puis `restoreFocus` : le focus revient sur le même bouton ou va dans la fenêtre ouverte ; `markMore` : une zone coupée affiche un dégradé et ▾) |
| **Événements DOM** | délégation unique : `onClick` lit `data-act` (et `data-key`, `data-env`…), `onInput` pour les champs. `boot()` charge la sauvegarde ou résume l'ancienne |

**Rendu** : `render()` reconstruit tout le HTML via `innerHTML` à chaque action. Les vues sont des fonctions pures de `S` et `U`. Ne garde aucun état dans le DOM, sauf la valeur en cours de saisie des champs (mise à jour en direct dans `onInput`, sans re-rendu).

**Déroulé d'une année** : `startTurn(y)` appelle `genYear(y)` (tout est tiré, mais caché), choisit l'événement selon l'état du monde, rédige les notes de l'année à partir de `S.w` (l'état connu fin y-1), puis le joueur décide. `endTurn` → `simulateYear(y)` applique les rendements tirés et fait de l'année le passé connu (`S.wPrev = S.w ; S.w = mac`).

### Modèle de données `S` (sauvegardé)

```
v:3, rng, phase:'turn'|'bilan'|'end', year, month, clk:{t,y}   // horloge du registre
arch ('perso' ou clé de PRESETS), p{city,sal,cap,couple} (profil), coef (difficulté), goals[2], start (capital initial), ach{id:année}, achNew[], advRec{conseiller:{n,ok}}, flair
cash (compte courant), liv (Livret A)
acc.cto.hold{id:{v,b}}                       // v = valeur, b = prix de revient
acc.pea / acc.av : {hold, cash, vers (versements nets), open (année)}
px{id}, ph{id:[prix fin d'année…]} (courbes), pxPrev, lastR
w{phase,g,infl,rate,r10,spread,credit,livret,euros,u,cg,oil,fx,pe,debt,gH,gB,rg}   // état connu (fin d'année précédente)
wPrev (l'année d'avant), fut{année:{y,phase,exo,cause,d,shock,elec,r,mac}} (années tirées)
pol{ir,ps,psF,peaCap,livCap,ageLegal,deficit,irLoyer,spreadAdj,pres{name,party,desc,since}}
th[3]{k,n,f,start,ok,dr,da,db}, drift{mkt, actions, b_ville}
page{head{t,c},notes[{i,t}],imp{t,c,note}|null,spent}, shockEur (perte ou gain du choc de janvier)
props[{uid,type (clé de BIENS),buyYear,cost,loan:{p,r,n,ann,z:{p,ann}|null}|null,rentMult,vacantUntil,noRent,mode,flows[]}]
idx{bien:{price,rent}}
city ('lille'|'lyon'|'paris'), home{type (clé de BIENS, 'parents', 'coloc' ou 'perso'), own, since}, cust{sal,salP,partner,rent,rooms,dep,car,debt,debtN}|absent (profil sur mesure, p.custom = true), onb (étape de l'accueil ou null), onbAns[], onbHome, buyHist{achat:[années]}
lossCarry, flags{rpYear,twoRent,struct,souvY,startup,lastPand,fireAsked,pretAmi,panicSold,lowMood,faillite…}, pending{année:{actif:%}}, jeton{name,alive,born}, avAb
revenu, tauxEp, defl (indice des prix), bench{liv,trk} (placements des repères, sans l'immobilier), benchV:2, yearExt, yearProp, yearRuin, extTot, moves[{e,id,a,tax}] (ordres de janvier), autoPass, half (0/1 : juillet joué), h1{y,r,sv,cash,net0}|null, julyOn
biz{uid,dom,name,born,role:'own'|'emp'|'act',share,ca,staff,tre,debt,debt0,inv,pay,payV,hist[{y,ca,g,ops,pay,tax,res,tre,staff,val}],raises,lastRaise,alive,red,val,divY,hired,prime,burn}|absent, salRef (salaire de référence tant que la boîte te paie), bizCh[] (chapitres où une boîte a été créée), bizPast[{name,dom,born,end,txt,role}]
hist[{x,net,liv,trk}], bilans[], event{id,p,answered,result,fiche?,adv?}|null, life{id,v,answered,result,name?}|null, nextY
usedFut[], usedLife[], uid, log[{y,t,r}], turnShock, lock, well{sum,n}, profile
lg{lines{clé:{env,id,label,first,lastSell,flows[{t,y,a}]}}, env{pea[],av[]}, props[]}
me{humeur,relation,partner,first,exes[],marie,enfants,kids[{n,born}],ruptures,burnouts,retireYear,gap,besoin,pension,early,pension62,ruined,chomY,raise,car,newCar,petits}
story{seed, cast{ami{n,g}, mere{n,born,die,dead}, pere{…}, estate (euros de 2026)}, th{id:{k,open,due,d,note,end,endT,beats}} (fils), hist{clé:[années]} (textes vus), chap (cartes vues), beats[{y,ch,t}] (moments racontés), snap[5] (état au début de chaque chapitre), dest[], met[], pres (présidentielles en fenêtre), given (donné aux enfants, euros de 2026), care{until,amt,n}, stud[{n,until,amt}], traits{prénom:{eco,voy}}, adv[{w,y,a,buy,ok}], kev, kevJ, kevRuined, uid}
```

**Tout nouveau champ de `S` exige une migration dans `boot()`.** Exemple : une partie d'avant la 3.5 n'a pas `benchV` ; ses repères sont recalés sur ses placements du moment. Les amis de Flo ont des parties en cours dans leur navigateur : on ne casse jamais une sauvegarde, et on ne change pas `KEY` sans migrer. Seule exception, décidée par Flo le 7 novembre 2026 : le passage à la version 3 (monde inventé) clôt les parties de la version 2 en affichant leur patrimoine, faute de pouvoir les convertir.

---

## 5. Règles du jeu (valeurs de référence)

### Départ à 20 ans, genre, statut
- **20 ans, diplômé·e d'école de commerce** le 1er janvier 2026. « Tu es » : une femme ou un homme (`S.me.g`), « À la sortie de l'école » : salarié·e ou ta boîte. Seul·e avec un profil type, tu vis chez tes parents 2 ou 3 ans (`S.flags.parentsUntil`, pas de fenêtre de logement au départ), puis le dilemme « logement » te fait partir. En couple ou avec tes propres chiffres, la fenêtre « Ton logement » reste.
- **Chapitres par âge** (`chapOf`) : jusqu'à 34 ans, 35-44, 45-54, 55-64, 65-75. Objectifs, retraite (proposée à 62 ans), indépendance (43-61 ans), mariage, enfants, donation, parents : tout est ancré sur l'âge via `AY()`.
- **Accords** : un texte qui désigne le joueur s'écrit avec le point spécial « ‧ » (U+2027) : « seul‧e », « fatigué‧e ». `render()` et `shareText()` passent tout par `gTxt(html, S.me.g)` : « seule », « seul », ou « seul·e » pour une partie sans genre. Le conjoint et les enfants s'accordent selon leur prénom (`ge(n)`, listes `FEM`/`MASC`, prénom mixte = inclusif). Les titres de fin et le statut sont écrits en entier (`gw(m,f,x)`) parce qu'ils partent dans le classement.
- **Statut** (`S.me.rank`, `statusName`, `RANKN`) : chargé·e d'affaires (0) → manager (1, 30 % de chances par an dès 25 ans, +8 %) → directeur·rice (2) → directeur·rice général·e (3) par le dilemme « promo » (+25 %, réservé aux managers et plus). Une partie d'avant la 3.13 compte comme manager. Sinon : « Fondateur·rice de … », « Salarié·e chez … » (start-up), « En recherche d'emploi », « Retraité·e ». Affiché dans le foyer et l'onglet Carrière.

### Profil (`SALAIRES`, `EPARGNES`, `CITIES`, choisis au départ)
| Fourchette (net/mois) | Salaire retenu | Part épargnée | Carrière avant / après 45 ans |
|---|---|---|---|
| 1 500 à 2 000 € | 1 750 € | 10 % | +1 % / +0,4 % par an |
| 2 000 à 2 600 € | 2 300 € | 13 % | +1,3 % / +0,5 % |
| 2 600 à 3 400 € | 3 000 € | 16 % | +1,6 % / +0,6 % |
| 3 400 à 4 500 € | 3 900 € | 20 % | +2 % / +0,7 % |
| 4 500 à 6 000 € | 5 200 € | 24 % | +2,4 % / +0,8 % |

**Deux modes de profil** : « Profil type » (fourchette de salaire et épargne de départ à choisir) ou « Mes propres chiffres ». **Profil sur mesure** (`S.cust`, bouton « Mes propres chiffres », épargne de départ `cap` saisie aussi, `custDefaults`, `custErr`, `custLeft`) : montants mensuels en euros de 2026. Les valeurs proposées redonnent l'épargne de la fourchette choisie. Saisie refusée si un montant est négatif, si le salaire est sous 500 €, si un autre crédit n'a pas de durée (1 à 30 ans), si les dépenses courantes sont sous le minimum vital de tes propres chiffres (300 € seul, 450 € à deux ; `CUSTMIN`, pas le plancher de 900 € des profils types) ou si les charges dépassent les revenus. Dans le jeu :
- l'épargne de base devient revenus du foyer − dépenses courantes (`custDep` : indexées sur l'inflation, au moins 300 € seul, 450 € à deux, + 450 € si un nouveau conjoint arrive), le moral jouant sur ce qui reste (`custSave`) ;
- le conjoint de départ gagne ce qui a été saisi (`pRatio`), un nouveau conjoint 60 % de ton salaire ;
- le logement de départ est `S.home.type = 'perso'` : ton loyer, indexé comme le T2 de ta ville (`persoRent`), et sa taille (`ROOMS` : studio 1, T2 2, T3 4, T4 5, maison 6 personnes). L'accueil le propose en premier (« Rester dans ton … actuel ») et le présélectionne ;
- la voiture coûte ce qui a été saisi, suivant le prix de l'essence (0 = pas de voiture ; une voiture neuve achetée ensuite coûte le prix standard) ;
- l'autre crédit (`debtCost`) sort chaque année jusqu'à son terme et compte dans le taux d'effort de la banque ;
- la progression de carrière est celle de la fourchette la plus proche (`nearSal`) ; la difficulté suit la formule ci-dessous avec ces chiffres (`startSave` = 12 × ce qui reste chaque mois).

Épargne de départ (`EPARGNES`) : presque rien (5 000 €), quelques économies (25 000 €), un héritage (120 000 €). En couple, le conjoint (prénom tiré dans `PARTNERS`) gagne 60 % de ton salaire. Humeur de départ 65, couple 60.

La difficulté (`coefOf`) égalise les scores : potentiel = épargne de départ + 100 000 € (l'héritage attendu des parents, le même pour tous) + 90 × ce que le profil peut mettre de côté par an au départ (`startSave`, même calcul que le jeu, compté à 60 % en couple : vie de famille plus chère et risque de divorce) ; coefficient = (891 000 / potentiel)^1,15, borné entre 0,2 et 5. Référence ×1 : 3 000 €/mois, 25 000 €, célibataire. De « Facile » (< 0,75) à « Très difficile » (≥ 2,4). Contrôle : `npm run balance` (rapport entre 0,75 et 1,33 pour les profils tout faits `PRESETS`).

### Objectifs de vie (`GOALS`, 2 au choix, bonus additifs)
rp35 : résidence principale achetée au plus tard à 35 ans (+20 %) · fire : plus de travail au plus tard à 55 ans et jamais ruiné (+40 %) · million : ≥ 2,5 M€ en euros de 2026 à 75 ans (+40 %) · famille : finir en couple avec au moins 2 enfants (+30 %) · serein : aucune vente panique, aucun burn-out, jamais une humeur sous 40 en fin d'année (+10 %) · rentier : deux biens locatifs en même temps (+25 %). Chaque objectif a une fonction `st(fin)` qui renvoie 1 (atteint), 0 (en cours) ou −1 (raté).

### Score
`score = (patrimoine net en k€ de 2026 + ce que tu as donné à tes enfants de ton vivant, en k€ de 2026) × (0,4 + 1,2 × bien-être/100) × (1 + Σ bonus des objectifs atteints) × coefficient du profil` (`realNet`, décision de Flo du 8 novembre 2026 : sans cela, donner ferait perdre des points). L'objectif « Transmettre 2,5 millions » compte aussi les donations.

Le bien-être moyen est calculé chaque année : 0,6 × humeur + 0,4 × couple (30 si célibataire). Le titre combine le niveau financier et le niveau de vie (bien-être ≥ 62 / ≥ 48), selon une grille 3×3 dans `finalScore`.

**Repères** (`S.bench`, `benchRef`) : « ta vie et ton immobilier à l'identique, mais tous tes placements financiers sur l'ETF Monde » (et la même chose sur le Livret A). Chaque repère part du capital initial et reçoit chaque année les mêmes flux que toi : flux externes (`ext`) et flux immobiliers du registre (`lgProp` : apports, mensualités, loyers, ventes, y compris forcées). Il croît au rendement de l'ETF Monde (ou du Livret A) tant qu'il est positif ; négatif, il ne rapporte rien. Il n'est pas bloqué à zéro, sauf à la retraite (pas de dette, comme le joueur) ; ce que la ruine efface pour le joueur (`yearRuin`) ne lui est pas transmis. On compare `net()` au meilleur des deux repères plus la valeur nette actuelle de ton immobilier. L'écart se mesure par rapport aux placements du repère (`S.bench`), pas au patrimoine total, puisque l'immobilier est identique des deux côtés : ≥ +5 % = niveau 2, ≥ −25 % = niveau 1. Un joueur qui n'a jamais rien placé, ou qui a été ruiné, est au niveau 0.

### Le monde (`genYear`)
- **Point de départ commun** (`W0`, France fin 2025) : croissance 0,9 %, inflation 1 %, taux BCE 2 %, OAT 10 ans 3,4 %, crédit 3,2 %, PER 16, dette publique 116 % du PIB, euro à 1,16 $, baril à 65 $. La première année est toujours calme (expansion, pas d'événement).
- **Cycle** : cinq phases (`PHASES`) : expansion, surchauffe, récession, crise, reprise. Transitions (`TRANS`) modulées par l'état du monde :
  - crise : +2,5 points par point d'endettement privé (`cg`) au-delà de 3, +4 points si PER > 22 ;
  - récession : +15 points si la courbe des taux est inversée (OAT 10 ans < taux BCE), +25 points en cas de choc pétrolier.
- **Chocs extérieurs** par an : pandémie 1,2 % (pas deux en 15 ans, déclenche une crise), choc énergétique 3,5 %, guerre 2 %.
- **Macro** : inflation qui revient vers 2 % (+0,9 en surchauffe, +2,5 en choc énergétique) ; taux BCE suivant une règle de Taylor lissée (`2 + 1,5 × (inflation − 2) + 0,5 × (croissance − 1,3)`, divisé par 2,5 en crise) ; OAT 10 ans = 0,5 × BCE + 1 + prime de terme (selon la phase) + écart France-Allemagne (0,3 + 0,015 par point de dette au-delà de 100 %, plus l'effet des élections) ; crédit immobilier qui suit l'OAT avec retard ; Livret A = (inflation + taux BCE) / 2, arrondi au dixième, plancher 0,5 % ; dette publique qui suit le déficit et la croissance nominale (au-delà de 130 %, les marchés imposent la rigueur).
- **Actions** : rendement de marché par phase (`m`, `ms`), corrigé par la valorisation (−0,04 × ln(PER/16)) et une dérive propre à la partie. Tracker Paris 40 = marché + 0,6 %. ETF Monde = marché + 1 %, converti en euros (le dollar monte en crise). Chaque action : `d + 1,5 % + β × (marché − 8 %) + bruit + dérive de la partie`, plus sa sensibilité propre (pétrole, taux, pandémie, taxe carbone, élection). Krach : choc de −25 à −45 % au début de l'année (Une), puis le reste de l'année rebondit en moyenne.
- **Valorisation** : le PER évolue avec les prix et les bénéfices (croissance des bénéfices selon la phase).
- **Immobilier** : tendance nationale = 0,7 × inflation + 1,2 % − 1,8 × hausse des taux de crédit + effet de la phase, multipliée par la sensibilité de chaque ville (`beta`). Loyers indexés sur l'inflation, plafonnés à 3,5 %/an (Paris : encadrement, −0,3 %/an).
- **Vagues d'innovation** (`THEME_POOL`) : 3 par partie (débuts tirés en 2026-2032, 2038-2048 et 2052-2064). Étapes : rumeur (1-2 ans, pas de fonds) → lancement du fonds à 100 € → adoption → si réussite (50 %) bulle puis krach puis maturité, sinon échec puis fonds zombie. Rendements par étape dans `TR`.
- **Cibles statistiques** (test « Monde généré ») : Bourse de Paris 3,5-7,5 %/an, ETF Monde 4,5-8,5 %/an, volatilité 14-25 %, inflation moyenne 1,5-3 % avec au moins un épisode au-delà de 5 %, 2 à 6 crises par partie, 6 à 22 % d'années de récession.

### Issues imposées (`setPending`) et produits spéciaux
La « valeur en chute » (`geant`) et la « bulle » (`bulle`) arrivent **au plus deux fois chacune** par partie, avec trois versions du texte (`p.v`).
- géant en chute (−40 % d'un coup) : +60 % (55 %) ou −50 % sur le reste de l'année ;
- bulle sur une action (+60 %) : −45 % (50 %) ou +30 % ;
- banque après une crise (−35 %) : +70 % (70 %) ou −45 % ;
- Méridia, pays fictif en crise de dette : −60 % (60 %) ou +40 %, remboursé ou effacé en fin d'année ;
- start-up de Karim (une fois, bloquée 4 ans) : ×12 (10 %), +50 % (30 %) ou perte totale ;
- Fonds Rendement Sérénité (proposé en fin de boom du crédit, bloqué 3 ans) : +5 %/an, −12 % en récession, −45 % et gel en cas de crise.
- **Jetons numériques** : risque de disparition de 5 % par an les 2 premières années, puis 15 %. Hausse annuelle = e^(−0,35 + N(0 ; 1)) − 1, plafonnée à ×20 : espérance proche de zéro, médiane négative, quelques gagnants spectaculaires.

### Politique (`PROG`, `applyProg`)
Une présidentielle tous les cinq ans (2027, 2032… 2072), entre deux candidats fictifs de partis différents. Le sondage du favori suit N(50 ; 4), sa probabilité de victoire est logistique. Chaque parti vise des niveaux précis, appliqués dès le 1er janvier suivant :

| Parti | Flat tax compte-titres / assurance-vie | Plafond PEA | Livret A | Retraite | Loyers | Déficit | Réaction des marchés |
|---|---|---|---|---|---|---|---|
| Alliance libérale | 28,6 % / 27,2 % | 300 000 € | — | 66 ans | 25 % | −1,5 pt | Bourse +5 %, banques +8 %, écart de taux −0,2 |
| Les Modérés | 31,4 % / 30 % | 200 000 € | — | 64 ou 65 ans | — | −0,5 pt | +2 %, +3 %, −0,1 |
| Union populaire | 37,6 % / 36,2 % (PS 19,6 % / 18,2 %) | — | 30 600 € | 62 ans | 35 % | +1,5 pt | −6 %, −12 %, +0,4 |
| Écologie solidaire | 33,6 % / 32,2 % | — | 30 600 € | 63 ans | — | +1 pt | −2 %, −3 %, +0,2, taxe carbone (pétrole −15 %, aéro −8 %) |
| Rassemblement des territoires | — | — | 30 600 € | 62 ans | — | +2 pts | −10 %, −18 %, +0,9 |

Un programme sauvegardé avant la 3.14 (un seul taux `ps`) est converti par `applyProg` : `psF` = ce taux, `ps` = ce taux + 1,4 point. Les plafonds du PEA et du Livret A ne baissent jamais. La Une d'une présidentielle propose de purger les plus-values du compte-titres au taux actuel si l'un des candidats veut relever la flat tax.

### Fiscalité française (règles de départ, modifiables par les élections)
- **Prélèvements sociaux (depuis 2026, hausse de la CSG à 10,6 %)** : 18,6 % pour le compte-titres, le PEA et les parts de ta boîte (`ps`) ; 17,2 % pour l'assurance-vie, les revenus fonciers et les plus-values immobilières (`psF`). **Flat tax** : 12,8 % + PS = 31,4 % au compte-titres, 30 % pour l'assurance-vie. Une partie d'avant la 3.14 est migrée dans `boot()` (`psF` = ancien `ps`, `ps` + 1,4 point).
- **Compte-titres** : plus-values et dividendes (rendement `DIVY`, taxés chaque année) à la flat tax de 31,4 % ; moins-values reportables. Dividendes, vente et cession de parts de ta boîte aussi. L'ETF Monde et les fonds thématiques capitalisent.
- **PEA** : actions européennes, Tracker et ETF Monde. Plafond 150 000 €. Avant 5 ans, tout retrait clôture le PEA et les gains sont taxés à la flat tax (31,4 %). Après 5 ans, seuls les PS (18,6 %). Vendre une ligne garde l'argent dans l'enveloppe.
- **Assurance-vie** : fonds euros (PS prélevés chaque année sur les intérêts), ETF Monde, Tracker, OAT et fonds thématiques. Avant 8 ans, gains taxés à 30 % (12,8 % + 17,2 %). Après 8 ans, abattement de 4 600 € (9 200 € en couple marié) puis 7,5 % + 17,2 %. Les PS du fonds euros sont à 17,2 %.
- **Livret A** : exonéré, plafond 22 950 €.
- **Immobilier locatif** : revenus (loyer − charges − intérêts) taxés à 30 % + 17,2 % (SCPI au compte-titres aussi). Plus-value à 19 % + 17,2 %, avec abattements pour durée de détention (exonération d'impôt à 22 ans, de PS à 30 ans). La résidence principale est exonérée.

### Immobilier (`BIENS`, prix de janvier 2026)
| Bien | Prix | Loyer | Rendement brut (locatif) ou capacité (RP) | Vacance | Sensibilité |
|---|---|---|---|---|---|
| T2 à Lille | 160 000 € | 667 €/mois | 5 % | 12 %/an | ×1 |
| T3 à Lyon | 280 000 € | 1 100 €/mois | 4,7 % | 9 % | ×1,1 |
| Studio à Paris | 300 000 € | 1 000 €/mois (encadré) | 4 % | 4 % | ×1,3 |
| Bureaux à Euralille | 600 000 € | 3 750 €/mois | 7,5 % | 20 % | ×1,2 |
| Maison à Lille (RP) | 300 000 € | 1 200 €/mois | 5 places | | ×1 |
| Studio à Lille (RP) | 110 000 € | 550 €/mois | 1 place | | ×1 |
| T2 à Lille (RP) | 160 000 € | 780 €/mois | 2 places | | ×1 |
| Studio, T2, maison à Lyon (RP) | 140 000 / 220 000 / 420 000 € | 620 / 900 / 1 500 €/mois | 1 / 2 / 5 | | ×1,1 |
| Studio, deux-pièces, appartement familial à Paris (RP) | 300 000 / 450 000 / 620 000 € | 1 000 / 1 500 / 2 300 €/mois | 1 / 2 / 4 | | ×1,3 |

- **Achat** : apport standard de 20 % + 7,5 % de frais de notaire (10 % + frais avec un PTZ), **réglable dans le dossier** (`propQuote(type,n,use,ap)`, `U.dossier.ap`) : frais seuls, 10, 30, 50 % ou tout le disponible (jusqu'à 90 %) ; sous 10 % d'apport, +0,25 point de taux ; crédit sur 15, 20 ou 25 ans au taux de l'année (−0,15 point sur 15 ans, +0,2 point sur 25 ans ; `bestDur` choisit la plus courte qui passe). Taux d'effort ≤ 35 %, calculé sur les revenus du foyer (salaire × 1,6 en couple) + 70 % des loyers. Pas de crédit à la retraite. Une seule résidence principale ; elle coûte 15 % de son loyer de marché en charges et taxe foncière.
- **PTZ** (`ptzOk`) : premier achat de résidence principale, revenus du foyer ≤ 60 000 € (en euros de 2026) ; 20 % du prix à 0 %, remboursé sur la même durée (`loan.z`), sans indemnité en cas de vente.
- **Louer** (`canRent`) : revenus du foyer d'au moins 3 fois le loyer ; chez les parents avant 30 ans ; colocation pour un célibataire. Déménager coûte 1 500 € (`moveCost`). Vendre sa résidence principale fait redevenir locataire (`bestRental`).
- **Villes** (`CITIES`) : le salaire est choisi au départ, la ville fixe le coût de la vie. Lille et Lyon (voiture utile), Paris (carrière +0,5 point par an avant 45 ans, pas de voiture, logement très cher). Un bien s'achète **pour y vivre** (`use:'rp'`, dans sa ville) ou **pour le louer** (`use:'loc'`, n'importe où) ; les bureaux se louent seulement. Bureaux dans chaque ville : Euralille (600 000 €, 7,5 % brut), Lyon Part-Dieu (500 000 €, 7 %), Paris (900 000 €, 6 %).
- **Changer de résidence principale** : dans le dossier d'un logement de sa ville, quand on est déjà propriétaire, « Le vendre » (`buyHome`, la vente nette s'ajoute à l'apport) ou « Le mettre en location » (`buyHomeKeep`, `oldHome('louer')` : l'ancienne devient un bien locatif avec son crédit, compté par la banque avec 70 % de son loyer). Le dossier simule les deux sur une copie (`dry`). L'événement « logement » propose aussi « Acheter et louer l'actuel ».
- **Revente** : 5 % de frais, indemnité de remboursement anticipé de 3 %. Renégociation du crédit possible si les taux baissent d'au moins 0,7 point (frais : 1 % du capital restant).

### Épargne, carrière, retraite
- **Épargne de base** (`epargneYear`) = revenus du foyer (salaire, + 60 % pour le conjoint) × (taux d'épargne de la fourchette + 6 points en couple, 8 si marié) × humeur (× 0,7 sous 30, × 1,05 au-dessus de 70). Elle suppose un T2 loué et une voiture en province. Plancher : les dépenses courantes (hors logement, voiture, enfants) ne descendent jamais sous 900 € par mois seul, 1 350 € à deux (`depMin`).
- **Enfants** (`kidsCost`) : 300 € par mois chacun, allocations déduites, jusqu'à 22 ans. Ligne à part dans le budget.
- **Budget réel de l'année** (`yearlySave`) : épargne de base + loyer de référence (`refRent` : T2 à Lille, plus la moitié de l'écart avec le T2 de ta ville) + voiture de référence (sauf à Paris) − vrai coût du logement (`housingOut` : loyer, ou mensualités + 15 % de charges, ou 0 chez les parents, colocation 450 / 520 / 800 € par mois à Lille / Lyon / Paris) − vraie voiture (`carCost` : 1 800 € + essence selon le baril) − enfants. Un propriétaire ne paie **jamais** de loyer : seulement ses mensualités et ses charges (la valeur locative, débitée côté vie et recréditée côté bien pour le TRI, s'annule et n'est pas affichée). Un retraité puise son besoin (`besoinYear`, qui anticipe le premier départ et l'arrivée de la pension). Tout le budget de l'année est calculé avec les prix de janvier.
- **Invariant** : ce que le jeu annonce (« Ce que tu mets de côté ») est exactement ce qui arrive sur le compte (test « Budget : ce qui est annoncé est ce qui arrive »).
- **Coussin de sécurité** (`coussin`) = (compte courant + Livret A) / dépenses mensuelles du foyer. Sous 3 mois : humeur −4 dans l'année.
- **Frais des placements** (`FEES`) : ETF Monde 0,2 %, Tracker et OAT 0,3 %, or 0,4 %, fonds thématiques 0,8 % par an, plus 0,6 % sur l'assurance-vie (hors fonds euros). Les actions en direct n'en ont pas.
- **Inconfort** : chez les parents (humeur −3, couple −8 par an), logement trop petit (humeur −3, couple −5), pas de voiture hors Paris (humeur −1).
- **Salaire** : augmenté chaque 1er janvier de 80 % de l'inflation de l'année écoulée, plus la progression de carrière de la fourchette (avant et après 45 ans, +0,5 point à Paris), plus le climat de l'emploi (surchauffe +1,2 point, expansion +0,4, récession −1,2, crise −2,5), jamais en dessous de 0 (gel). Une promotion donne +25 %, le dîner d'affaires +8 %.
- **Licenciement** : en crise (15 %) ou en récession (7 %), au plus une fois tous les 5 ans, sauf pour la fondatrice. Pas d'épargne cette année-là, indemnité de 50 % du salaire (ou 25 % avec une reconversion qui augmente le salaire de 10 %).
- **Retraite** : proposée à partir de 2063 (62 ans). L'âge légal (`S.pol.ageLegal`, 64 ans au départ) dépend des élections. Prélèvement de 30 % du dernier salaire avant l'âge légal, 24 % jusqu'à 2 ans après, 18 % ensuite ; la pension vaut 60 % du salaire.
- **Indépendance financière** (`fire`) : proposée entre 2044 et 2062 si les placements financiers valent au moins 30 × (50 % des revenus du foyer). Le prélèvement est alors de 50 % du salaire, divisé par deux à l'âge légal.
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
  - krach en couple → week-end (70 % des cas), qui bloque le portefeuille pour l'année ;
  - célibataire → rencontre (25 % par an, 45 % après une année de sorties).
- **Famille** : chaque année, une chance propre de demande en mariage (40 %, en couple depuis assez longtemps) et d'enfant (45 %, marié·e, moins de 2 enfants, jusqu'à 42 ans), pour que les fils de l'histoire ne la fassent pas disparaître.
- **Autres dilemmes** : tirés dans environ 18 % des années restantes, au plus 2 fois chacun (5 pour les enfants, 1 pour le prêt à l'ami et la donation), avec un poids par chapitre (`CHW`) : carrière, rencontre et logement au début ; mariage et enfants ensuite ; scooter des ados (`ados`) et crise de couple (`criseCouple`, thérapie à 1 200 €) au milieu ; donation (`donation`, 50 000 ou 100 000 € par enfant de plus de 25 ans) à la fin. Un fil arrivé à échéance passe avant eux. Plafonds par partie : week-end pendant un krach 2, panne 2, voyage 2 (jamais deux fois la même destination, `DEST` selon le caractère du conjoint), rencontre jamais deux fois avec la même personne.

### Monde du jour (`S.wseed`, `S.wr`, `withWorld`, `daySeed`)
Le monde (`genYear`, `makeThemes`, dérives `S.drift`) tire son hasard dans un flux à part, `S.wr`, issu de la graine du monde `S.wseed` (six chiffres) ; la vie et les événements utilisent `S.rng`. Deux parties avec la même graine vivent donc les mêmes cycles, krachs, élections et innovations, quels que soient les choix (test « Monde du jour »). Au départ : « Au hasard », « Monde du jour » (graine tirée de la date, `S.daily`) ou « Monde n° X » (lien `#graine-123456`). Le résultat partagé contient la graine et le lien. Une partie d'avant la 3.8 n'a pas de `S.wr` : elle garde un seul flux.

### Nouveaux placements et immobilier (3.9)
- **SCPI** (`scpi`, compte-titres et assurance-vie) : 8 % de frais d'entrée (la position vaut 92 % de la mise), 1 % de frais par an, rendement = 4,5 % de loyers + 60 % de la tendance des bureaux, −5 % en crise ; au compte-titres, les loyers sont imposés comme des revenus fonciers (impôt sur les loyers + prélèvements sociaux). Comptée dans l'immobilier de la répartition. Moyenne mesurée : 5,3 % par an avant frais.
- **Obligations d'entreprise** (`corp`, compte-titres et assurance-vie) : OAT à 10 ans + 1,3 point (+1 en récession, +2 en crise), sensibilité aux taux de 4,5, défauts −3,5 % en récession et −11 % en crise. Moyenne mesurée : 4,3 % (OAT : 4,0 %).
- **Location meublée (LMNP)** : choix « Vide / Meublé » dans le dossier d'un bien à louer (hors bureaux). Mobilier 5 000 € indexés à l'achat, loyer +15 %, charges 27 % du loyer, la moitié seulement des loyers imposée (micro-BIC) au lieu de loyers − charges − intérêts. `p.meuble`.
- **IFI** (`ifiTax`) : immobilier net (résidence principale abattue de 30 %, crédits déduits) au-delà de 1,3 M€ indexés ; barème 0,5 % / 0,7 % / 1 % / 1,25 % / 1,5 % dès 800 000 € ; prélevé au bilan (`b.flows.ifi`).
- **DPE** (`dpe`, au plus 2 par partie) : un bien loué devient passoire thermique. Travaux (8 % du prix, loyer +5 %), vente en l'état (−10 %) ou attente (pas de loyer l'an prochain).
- **Villes** : Bordeaux (studio 150 000 €, T2 230 000 €, maison 400 000 €, bureaux Euratlantique 450 000 € à 7 %, sensibilité ×1,15) et Marseille (100 000 / 160 000 / 350 000 €, bureaux Euroméditerranée 400 000 € à 7,5 %, ×1,05).

### Classement entre amis (version officielle, capacités `db` et `user`)
- Collection `scores` : un document par joueur, `scores/<id>` (pseudo, meilleur `score`, `title`, `prof`, `seed`, `at`, et `dayDate`/`dayScore`/`dayTitle` pour le monde du jour). Règles : `{path:"scores",read:"view",write:"admin"}`, `{path:"scores/{self}",read:"view",write:"interact"}`.
- Sur un compte personnel, les amis qui ouvrent le lien public lisent seulement : ils copient leur résultat et l'envoient au propriétaire, qui le colle dans « Ajouter le résultat d'un ami » (documents `scores/a-…`). Toute personne invitée en Contributeur inscrit elle-même son score en fin de partie.
- `lbInit` (au démarrage et à l'ouverture), `lbTable` (onglets Général et Monde du jour), `lbBlock` (fin de partie), `lbModal` (bouton de l'écran de départ). Sans `window.claude.use` (GitHub Pages), un lien renvoie vers la version officielle.
- À la republication sur Claude, déclarer `capabilities: {db:{rules:[…]},user:{}}`.

### Sons
Coupés par défaut, bouton haut-parleur dans la barre du haut. Synthétisés (WebAudio, aucun fichier) : cloche à chaque nouvelle année, grondement à l'ouverture d'un krach, carillon pour un succès. Réglage rangé dans la partie (`S.sound`), pas dans le navigateur.

### Point de juillet (`halfYear`, `h1Split`, `julyModal`)
- Le bouton « Passer à juillet → » remplace « Passer à … » tant que le semestre n'est pas joué (`S.half`), sauf si `S.julyOn === false` (case « Faire le point chaque juillet », dans la fenêtre et au bilan).
- `halfYear()` applique à chaque actif la part de son rendement de l'année vécue au premier semestre : `h1Split(k,y,r)` = √(1+r) × e^(±vol) − 1, fixé par un hachage de la graine du monde, de l'année et de l'actif (aucun tirage, vol 2 % pour OAT et obligations d'entreprise, 4 % or et SCPI, 8 % actions et fonds). Il verse la moitié de `yearlySave()` (`ext`) et garde dans `S.h1` les valeurs de janvier, les rendements du semestre, l'épargne versée et le patrimoine de départ.
- `simulateYear` applique ensuite le reste : (1+r)/(1+r₁) − 1 par actif, le gain de l'année se mesure depuis la valeur de janvier, l'épargne déjà versée est retirée du versement de décembre. Une année jouée avec ou sans juillet finit au centime près au même endroit si l'on ne touche à rien (test « Point de juillet »).
- `julyModal()` : budget du semestre (moitié de chaque poste annuel), placements depuis janvier (4 plus grosses lignes), « Voir mon portefeuille » ou « Continuer ». L'annulation d'ordre est effacée au passage en juillet. `startTurn` remet `S.half = 0` et `S.h1 = null`. Champs nouveaux sans migration : absents, ils valent « pas encore juillet » et « point activé ».

### Carrière et entreprise (`S.biz`, onglet Carrière / Ma boîte)
- **Au départ** : « Ton métier » : salarié·e, ou ta boîte dans l'un des cinq domaines (créée en janvier 2026, avant le choix du logement). **En cours de partie** : onglet Carrière, une création par chapitre, pas après 60 ans ni à la retraite.
- **Domaines** (`DOMS`, euros de 2026) :

| Domaine | Apport | CA de départ | Croissance | Coûts variables | Coûts fixes | CA par personne | Salarié | Coup dur | Valorisation |
|---|---|---|---|---|---|---|---|---|---|
| Logiciel | 10 000 € | 40 000 € | +45 % | 10 % | 12 000 € | 120 000 € | 70 000 € | 10 %/an (−35 %) | 3,5 × CA |
| E-commerce | 15 000 € | 150 000 € | +27 % | 65 % | 15 000 € | 300 000 € | 45 000 € | 10 % (−30 %) | 1 × CA |
| Restauration | 60 000 € | 250 000 € (2 salariés) | +5 % | 28 % | 40 000 € | 110 000 € | 38 000 € | 6 % (−18 %) | 0,8 × CA |
| Conseil | 5 000 € | 90 000 € | +12 % | 10 % | 8 000 € | 160 000 € | 75 000 € | 5 % (−25 %) | 1 × CA |
| Artisanat et BTP | 20 000 € | 200 000 € (1 salarié) | +7 % | 36 % | 15 000 € | 130 000 € | 45 000 € | 5 % (−18 %) | 0,6 × CA |

- **Apport** : au moins un tiers de l'apport du domaine vient de toi (compte puis Livret A), la banque prête le reste, remboursé par la boîte en 5 ans au taux du crédit + 2 points. L'apport passe par le registre (`lgFlow('biz','boiteN')`), comme les dividendes et la vente : la part du joueur (`share × val`) compte dans `net()` et dans « Placements ».
- **L'année** (`bizYear`, au 31 décembre, hasard de vie `rnd()`) : croissance = base × max(0,12 ; 1 − âge/14) + cycle (expansion +3 pts, surchauffe +5, récession −8, crise −20, reprise +3, × sensibilité : logiciel 0,8, e-commerce 1,2, restaurant et BTP 1,1, conseil 0,9) + bruit + 6 pts l'année d'une embauche, moins un coup dur éventuel (risque ×2 en crise, ×1,4 en récession, ×0,6 après 5 ans) ; inflation en plus. Au-delà de la capacité (CA par personne × effectif toi compris), la croissance ne compte qu'à 15 %. Le CA ne perd jamais plus de 70 % en un an. Coûts : variables + fixes (+10 % par salarié) + salariés + ton salaire × 1,45 + intérêts. Impôt sur les sociétés 25 %. Valorisation = multiple × CA (la moitié si perte et croissance ≤ 20 %) + trésorerie − dette.
- **Dépôt de bilan** : trésorerie négative deux ans de suite, ou trou de plus d'un quart du CA. La part ne vaut plus rien ; le fondateur retrouve un poste à 90 % de son salaire de référence (humeur −15).
- **Décisions** (onglet Ma boîte) : ton salaire (`PAYS` : rien, le minimum 1 400 €/mois indexé, ton ancien salaire, +30 % ; `S.revenu` = ce que verse la boîte, le conjoint et la retraite se calculent sur `S.salRef` via `baseSal()`), embaucher (il faut six mois de salaire en trésorerie) ou licencier (trois mois de salaire), lever des fonds (logiciel et e-commerce : 25 % de la valorisation contre 20 % du capital, 15 % de croissance minimum, tous les 3 ans au plus, pas en crise), dividende (`divAmt` : bénéfice de l'an dernier ou un quart des réserves, au plus la moitié de la trésorerie, flat tax), vendre (90 % de la valorisation, plus-value à la flat tax) ou fermer (part de la trésorerie nette). Vendre ou fermer ramène au salaire de référence.
- **Sécurités** : si ton compte passe dans le rouge, ta boîte te verse d'abord une prime prise sur sa trésorerie (× 1,45), puis tes parts sont cédées en urgence (−30 %) avant l'immobilier (`raiseCash`). À la retraite (ou à l'indépendance financière), la boîte est cédée (`bizRetire`). Le dirigeant n'est jamais licencié et ne reçoit ni promotion ni dîner d'affaires ; l'indépendance financière se mesure sur le salaire de référence.
- **Start-up** (`startupJob`, dilemme de 27 à 50 ans, une fois par partie, sans boîte) : salaire −20 %, 0,25 % du capital par an jusqu'à 1 % ; boîte de logiciel de 1,5 M€ de CA, 12 salariés, 2 M€ de trésorerie, 35 % du CA en dépenses de croissance pendant 8 ans. « Revenir à un poste classique » garde les actions (rôle `act`) ; elles se revendent avec 30 % de décote, l'argent arrive par `ext()`.
- **Budget de l'année** (`B.bud`, `BUD0`, `bizCalc`, `bizForecast`, `budgetModal`, `setBud`, `julyBiz`, `bizBilan`) : le dirigeant voit le prévisionnel en fenêtre en janvier la première année, puis seulement quand la boîte va mal (`budDue`, `bizBad` : perte l'an dernier, trésorerie négative, ou perte ou trésorerie négative prévues ; validé par `B.budY`) ; sinon le budget de l'an dernier continue, et « Mon budget » ou juillet le rouvrent toujours et règle : commercial et marketing (0 à 20 % du CA ; croissance + 0,55 × √part × `mkS` × max(0,3 ; 1 − âge/20), comparé à 5 %), produit ou investissement (0 à 15 % ; capital K = 0,8 K + part, 0,25 à l'équilibre : capacité × 1 + 0,6 (K − 0,25) bornée 0,8-1,3, coûts directs × 1 − 0,5 (K − 0,25) bornés 0,75-1,15, valorisation du logiciel et de l'e-commerce × 1 + 0,6 (K − 0,25) bornée 0,8-1,2), prix (−5 à +10 % ; CA × (1 + prix)^(1 − `el`), élasticité : restaurant 3, e-commerce 2,5, BTP 2, logiciel 1,2, conseil 0,8), son salaire et l'équipe. Le budget par défaut (5 %, 5 %, marché) redonne exactement le modèle d'avant (les coûts variables `v` incluent 10 % de commercial et produit). `bizCalc` est pur : le prévisionnel suppose l'économie de l'an dernier, sans aléa ni coup dur ; le réalisé prend l'économie de l'année, un aléa et un éventuel coup dur. Au bilan, « prévu et réalisé » ligne à ligne, et l'écart de CA décomposé (cycle, coup dur, aléas). En juillet, la moitié du CA de l'année (économie réelle) contre le prévu. Calibrage (60 parties par domaine, mêmes mondes) : aucun budget fixe ne domine partout ; le commercial paie dans l'e-commerce (+17 à +35 %) et le conseil (+14 %), pas dans la restauration ni le BTP (−6 à −9 %, plus de faillites) ; sans commercial, −10 à −31 % et beaucoup plus de faillites. Le risque de coup dur baisse avec l'âge de la boîte (×0,6 après 5 ans, ×0,35 après 10).
- **Ouvrir son capital** (`bizSellPart(f)`) : céder 10 % ou 25 % de ses parts à 85 % de la valorisation, plus-value au prorata de l'apport, tant qu'on garde au moins 30 %. **Plan social** (`bizPlan`) : la moitié de l'équipe part (trois mois de salaire chacun, humeur −6).
- **Offre de rachat** (Une `rachat`, poids 4, 3 fois au plus, après deux bilans et 20 000 € de valorisation) : un repreneur propose 110 à 150 % de la valeur de ta part ; tout vendre, céder un quart à ce prix, ou refuser. Le nom et le montant sont figés à l'ouverture (`p.name`, `p.v`).
- **Succès** : « Patron », revendre la boîte qu'on a créée plus d'un million d'euros de 2026.

### Loyer de chaque bien loué (`p.rl`, `RLV`, `vacP`, `vacMo`, `rentExp`, `setRent`, `rentBox`)
- Dans « Tes biens », chaque bien loué a son niveau de loyer : −10 %, marché, +10 %, +20 % (Paris : loyers encadrés, pas de hausse). Probabilité de vacance × (1 + 8 × hausse)² (bureaux : 3), ou × (1 + 6 × baisse) ; durée de vacance × (1 + 5 × hausse) (bureaux : 1), divisée par deux si on baisse. Le loyer du marché reste le meilleur pari en moyenne : +10 % fait à peu près jeu égal avec plus de risque, +20 % fait perdre de 7 à 27 % (test « Loyers réglables »). La banque compte toujours le loyer du marché.

### Versements automatiques (`S.plans{clé:{e,id,a}}`, `runPlans`)
- Bouton « Chaque année » dans un ordre : le montant saisi est investi chaque 1er janvier (dès l'année suivante), depuis le compte courant, dans la limite de ce qui s'y trouve (rien sous 100 €) et du plafond du Livret A. Une note de l'année le rappelle. « Arrêter » dans le même ordre. Le reste se gère à la main.

### Changer de ville (`moveCity`, `cityMoveBox`)
- Dans « Acheter ou louer », le catalogue d'une autre ville propose « Déménager à … » (deux clics). Ta résidence principale est vendue ou mise en location (`oldHome`), tu loues le logement le moins cher assez grand de la nouvelle ville (`bestRental`), 3 000 € de déménagement (indexés), voiture revendue 2 000 € si tu pars à Paris, humeur −2 (couple −2). Une fois par an (`S.flags.cityY`). Le salaire suit ; la carrière prend le bonus de la ville. Ensuite, le dossier d'un logement de la nouvelle ville permet d'y acheter ta résidence.

### Confort
- **Annuler le dernier ordre** : l'état d'avant chaque ordre du tour (achat, vente, retrait, placement, rééquilibrage, achat ou vente immobilière, déménagement, renégociation, achat plaisir) est gardé dans `U.undoS` ; le bouton « ↶ Annuler … » de la navigation le restaure. Effacé à la fin de l'année.
- **Premiers pas** (`TUTO`, `tutoCard`) : pendant les deux premières années, une liste qui se coche toute seule remplace la carte des objectifs (budget, onglet Portefeuille, Livret A ou enveloppe ouverte, onglet Immobilier, année suivante). « Masquer » pose `S.tutoDone`.
- **Saisie rapide** : boutons +500, +1 000, +5 000 et « Effacer » dans le carnet d'ordres et les fenêtres d'investissement. « Le maximum » (`maxFor`) respecte les plafonds du Livret A et du PEA.
- **Défilement gardé** : `render()` remet chaque zone (`.card`, `.stage`, `.dm-body`, `.dmodal`, `.tbl-wrap`) et la fenêtre à leur position tant que l'écran ne change pas (`U.scKey`).
- **Dossier refusé** pour le taux d'effort : le plus petit apport (par pas de 5 %) et la durée qui passent sont proposés (`dos-fix`).
- **Repères d'une valeur** (`reperes(id)`) : cours, variation sur 1 et 5 ans, dividende, comportement face au marché, secteur ; dans la fiche analyste (ouverte d'office) et à l'ouverture d'un ordre.
- **Glossaire** (`GLOSS`, `gl(terme)`) : mots soulignés en pointillé, définition au survol ou au toucher (fiche analyste, dossier de crédit, conseils, rendement) et liste complète dans les règles.
- **Graphique annoté** : bandes rouges pour les années de krach, losanges pour les présidentielles (avec le nom de l'élu·e au survol).

### Histoire (`S.story`)
- **Chapitres** : 2026, 2036, 2046, 2056, 2066. Le début de chaque chapitre ouvre une carte de titre (`chapModal`, une fois, avant les décisions ; elle arrête l'enchaînement des années calmes) avec une phrase tirée de l'état réel (`chapSnap`, `chapLine`). Chaque chapitre compte au moins deux moments racontés : sinon, ses deux dernières années ajoutent des scènes de la vie des tiens (`chapFill`).
- **Distribution** (`storyInit`) : un meilleur ami (prénom et genre tirés), deux parents (prénoms, nés vers 1966-1972 ; le premier s'éteint entre 78 et 86 ans, le second entre 84 et 93 ans, au plus tard en 2073), un patrimoine des parents tiré entre 80 000 et 200 000 € de 2026, un caractère pour chaque conjoint (économe ou dépensier, casanier ou voyageur : il colore les textes ; les vacances d'un dépensier coûtent 40 % de plus).
- **Fils** (`S.story.th`) : un choix ouvre un fil qui revient des années plus tard. Une fenêtre au plus par an (`STORY`), les nouvelles sans choix passent en note (`NOTES`). Chaque fil a une fin : à la dernière année, `closeStory` conclut ceux qui restent ouverts.
  - Karim : la start-up (forcée au plus tard vers 2034) → rachat ou faillite qui rappelle ton choix (`karimFin`) → nouvelle boîte, investir 10 000 € ou le rejoindre (+15 % de salaire) ou non (`karim2`) → issue (`karim3`, `karimNews`).
  - Meilleur ami : une seule demande de prêt (10 000 €) → remboursé avec 10 % et du champagne (60 %), ou brouille puis réconciliation possible où il rend la moitié (`amiRetour`, `amiPaix`) ; un refus revient en nouvelle (`amiRefus`).
  - Kévin : ses conseils sont mémorisés (`S.story.adv`) ; le premier krach après 2030 le ruine (il te demande 2 000 €) ; le premier jeton revient 4 à 7 ans plus tard (fortune ou ruine).
  - Parents : une chute (8 000 € de travaux, `parents`), le premier décès (note), la maison de retraite du survivant (600 € par mois jusqu'au décès, l'accueillir, ou vendre sa maison : héritage réduit de 35 %), puis l'héritage (`heritage`) : abattement de 100 000 € indexé, 20 % au-delà, placé au choix. L'ancien « oncle sans enfants » ne sort plus.
  - Enfants : études à 18 ans (loyer étudiant de 450 € par mois pendant 4 ans, ou job étudiant), premier appartement vers 27 ans (donation de 0, 20 000 ou 50 000 €, rappelant les études), mariage et petits-enfants (notes).
  - Profil sur mesure : la fin de l'autre crédit devient un moment raconté (`creditFin`).
- **Krachs** : une note sur un collègue licencié, le stage annulé d'un enfant de 18 à 22 ans, Kévin ruiné.
- **Textes** : jamais deux fois le même texte de fenêtre dans une partie. Les événements récurrents ont 3 versions ou plus (`V`, choisies selon le nombre d'occurrences) ; au-delà, la fenêtre rappelle les années déjà vécues (`deja`, filet appliqué à tous les `EVT` et `LIFE`).
- **Rythme** : environ 37 fenêtres par partie (52 en 3.6). Les Unes non forcées laissent une année calme avec un poids de 25 face aux événements possibles (`pickEvent`).
- **Présidentielle** : par défaut une note dans l'année et une ligne au journal. Elle devient une fenêtre seulement si l'écart entre les deux programmes pèse chez toi au moins 1 000 € (indexés) ou 1 % du patrimoine (`elecStake` : flat tax sur les plus-values latentes, prélèvements sociaux sur les gains du PEA et de l'assurance-vie, impôt sur 5 ans de loyers, une année de retraite après 50 ans, Livret A plein), et 3 fois par partie au plus. La fenêtre affiche ce montant.
- **Biographie** (`biography`) : un paragraphe par chapitre, à partir de `snap` et des moments racontés (`beats`) ; puis « Ce que sont devenus les tiens » (`threadEnds`).
- **Logement** (`logement`) : forcé à 30 ans chez les parents, ou quand le logement est trop petit depuis un an (au plus tous les 2 ans) ; tiré aussi quand le couple locataire rêve d'acheter. Choix : louer plus grand (`bestRental`), acheter (`bestBuy`, en vendant l'actuel si besoin), rester.
- **Panne de voiture** (`panne`) : réparer (1 200 €) ou vendre (+2 000 €, plus de frais de voiture, humeur et couple −3 hors Paris).

### L'année (onglet Profil)
- **Gros titre** (`headline`) : le fait marquant (krach, choc, phase du cycle, présidentielle, inflation, Bourse chère, crédit), repris dans les notes (« Au journal : … »), jamais le même deux ans de suite.
- **Conseils de Sophie** (`conseils()`, au plus 3) : ils ne lisent jamais le futur, seulement l'état connu et le portefeuille. Krach (ne pas vendre au plus bas), coussin sous 3 mois, argent qui dort (et ce que l'inflation lui coûte), logement trop petit, voyants à l'orange (`crisisRisk` ≥ 10 % avec plus de 65 % d'actions : chiffrage d'une chute de 35 %), Bourse bradée (PER < 12, moins de 55 ans : « je passerais à 100 % d'actions », bouton `k:'prof'`, `p:1`) puis Bourse revenue à un prix normal (PER > 16 avec un profil au-delà de 85 % : retour à 80 %) : c'est son vrai avantage, la lecture des prix ; renégociation possible, PEA pas encore ouvert, OAT quand la BCE monte ses taux, crédit bon marché pour la résidence principale, ligne qui pèse plus de 25 %, fonds thématique en bulle, inflation qui ronge l'épargne garantie. Également : argent qui dort depuis longtemps (à partir de 32 ans, moins de 20 % d'actions et plus de 2 ans de dépenses sur le compte : le risque d'être à court d'argent à la retraite), profil selon l'horizon (avant 50 ans, viser 80 % d'actions ; à partir de 55 ans, réduire à 50 %), et une action isolée gardée plus d'un an à rebasculer sur l'ETF Monde. Chaque conseil a un lien vers le bon onglet (`act:'view'` ou `'tip-tab'`), jamais un achat automatique. Le bouton peut porter `k:'prof'` (profil conseillé `p`) ou `k:'sell'` (`e`, `id`) pour le joueur-type des tests.
- **Notes de l'année** (`makeNotes`, au plus 6, à la première personne, ton tendre) : le gros titre au journal, l'augmentation ou le gel du salaire et le surcoût des courses, un enfant (phrase selon son âge), le couple ou la vie de célibataire, le logement (trop petit, chez les parents, mensualité restante, loyer), l'imprévu, la fatigue si l'humeur est basse.
- **Pense-bête** (`rappels()`) : prêt à un ami, revente de la start-up, produit bloqué, 5 ans du PEA, 8 ans de l'assurance-vie, âge de la retraite.
- **Se faire du bien** (`ACHATS`, `achatState`, `acheter`) : restos et sorties, week-end à deux (en couple, baby-sitting en plus avec des enfants), vacances (1 500 € par personne du foyer), sport, cadeau (en couple), sortie en famille (avec enfants), voiture neuve (peu utile à Paris : effet × 0,4). Une fois par an chacun, payé tout de suite (compte courant puis Livret A), prix en euros de 2026 indexés. L'effet sur l'humeur et le couple est divisé par 1 + le nombre de fois où l'achat a été fait les deux années précédentes. Des sorties en célibataire font passer la chance de rencontre de 25 à 45 % l'année suivante.
- **Bilan** : `whyText` cite les deux plus gros contributeurs de l'année avec leur cause, ce qui a été mis de côté (ou puisé), et ce que le choc de janvier avait déjà coûté. Une ligne chiffre **ce que tes choix de placement ont rapporté** (`movesGain`) : chaque euro déplacé en janvier aurait suivi la ligne d'où il venait (croissance réelle de la ligne sur l'année, frais compris ; le compte courant ne rapporte rien), moins les impôts payés pour vendre.
- **Années calmes** (`autoPass`) : après le bilan, si l'année suivante n'a ni événement ni dilemme, elle est jouée tout de suite, et ainsi de suite jusqu'à la prochaine décision. L'animation fait défiler ces années, puis `quietModal` les résume (économie, variation du patrimoine, une note). `S.autoPass === false` coupe ce passage automatique.
- **Candidats** : prénom et portrait accordés au genre, jamais deux finalistes du même nom.

### Les onglets
- **Barre d'argent** (`moneyBar`, toujours visible en haut) : date et âge, compte courant, Livret A, placements, immobilier net, patrimoine net. Les montants défilent jusqu'à leur nouvelle valeur et un « +X € » / « −X € » flotte sur ceux qui ont changé.
- **Navigation** (`navBar`) : les cinq onglets et le bouton « Passer à … », désactivé tant qu'une décision reste à prendre.
- **Décisions** (`decisionModal`) : fenêtre bloquante à l'ouverture de l'année, une décision à la fois (vie perso d'abord si elle conditionne le reste : week-end, burn-out, panique, retraite, indépendance, licenciement, logement), puis le résultat et « Décision suivante » / « Voir mon année ».
- **Profil** (`profilTab`, 6 cartes) : le foyer (`foyerList`, visages, jauges d'humeur et de couple), l'année (notes avec icône, décisions déjà prises), les conseils de Sophie avec un lien vers le bon onglet et les rappels, le budget du mois (`budgetTable` : revenus, dépenses courantes, logement, voiture, enfants, ce qui reste, jauge d'épargne de sécurité), « Se faire du bien » en tuiles, les objectifs.
- **Portefeuille** (`portefeuilleTab`) : liquidités (compte courant, Livret A, liquidités des enveloppes), carnet d'ordres par enveloppe, outil de répartition (facultatif).
- **Immobilier** (`immoTab`, `dossierHtml`) : ton logement, tes biens (vendre, renégocier), puis le catalogue par ville (studio, T2, maison, bureaux). Chaque bien ouvre un **dossier de crédit** en fenêtre (Fermer ou Échap) : pour y vivre ou pour le louer (bureaux : louer seulement), durée, apport, montant emprunté, PTZ, taux, mensualité, charges, loyer attendu et impôt pour un bien loué, taux d'effort, ce qui restera chaque mois, et la réponse de la banque avec sa raison. On n'achète pour y vivre que dans sa ville.
- **Patrimoine** (`patrimoineTab`) : bilan chiffré (liquidités, placements par enveloppe, immobilier moins crédits), répartition, courbe depuis 2026, détail et TRI de chaque investissement.
### Départ (`S.onb` = 1 tant que le logement n'est pas choisi)
L'écran de départ (`introView`) crée le profil : ville, fourchette de salaire, épargne de départ, célibataire ou en couple, deux objectifs. Un encadré résume le point de départ (revenus du foyer, loyer, épargne possible par mois, difficulté).
Puis une seule fenêtre, **Ton logement** (`homeOptions`, `recoHome`, `sophieHome`, `onbHome`, `onbNext`) : parents (avant 30 ans), colocation (célibataire), louer ou acheter chaque logement de la ville. Une option impossible ou qui mettrait le budget dans le rouge reste visible avec sa raison. Sophie conseille l'achat le moins cher assez grand si le taux d'effort est ≤ 33 %, s'il reste au moins 3 mois de dépenses après l'apport et 150 € par mois ; sinon la location adaptée la moins chère ; sinon les parents ou la colocation. **Rien n'est jamais placé à la place du joueur** : ni Livret A, ni portefeuille.

Les parties lancées sans accueil (tests) commencent locataires du logement le moins cher assez grand dans leur ville (`bestRental`).

### Conseillers (`ADV`)
Sur les événements où l'on peut investir, deux conseillers donnent leur avis si |`fwdScore`| ≥ 0,15. Pour chacun, `a` = probabilité de dire « achète » quand c'est une bonne affaire, `b` = la même probabilité quand c'est une mauvaise :

| Conseiller | a | b | Fiabilité mesurée |
|---|---|---|---|
| Gérard (le banquier) | 0,55 | 0,45 | ≈ 54 %, et il pousse toujours le Fonds Rendement Sérénité |
| Kévin (le collègue) | 0,9 | 0,75 | ≈ 57 % |
| Mamie Odette | 0,15 | 0,05 | ≈ 63 % |
| Sophie (l'analyste) | 0,8 | 0,2 | ≈ 78 % |

Régler `a` et `b` ne change presque rien au patrimoine (mesuré en 3.14 : même une Sophie à 0,95 / 0,05 présente à chaque Une laisse son élève à ×1,06 face à l'acheteur naïf) : les Unes où l'on peut investir sont rares et l'élève n'y met que 10 % de son patrimoine. L'avantage de Sophie passe par ses conseils de profil (voir « Conseils de Sophie »). Mamie Odette garde 0,15 / 0,05 : elle a souvent raison quand ne rien faire est le bon choix.

Le verdict « bien vu / raté » est donné au bilan, et l'historique de chacun est affiché dans la Une.

### Fiches analyste
Chaque indicateur est « sain » avec une probabilité de 0,5 + 0,4 × `fwdScore`, bornée entre 0,08 et 0,92. Les indicateurs : dette nette/EBITDA, couverture des intérêts, PER, croissance (ou CET1 et créances douteuses pour la banque ; clients qui renouvellent, croissance des ventes, trésorerie et valorisation/ventes pour un fonds thématique), plus un consensus des analystes **volontairement non informatif**. Un joueur qui lit les fiches doit faire au moins 1,15 fois mieux qu'un acheteur naïf de paniques.

### Succès (`ACH`, 16)
diamant (≥ 80 % d'actions et ≥ 100 000 € investis à la fin d'une année de krach) · panique (investir ≥ 10 % du patrimoine pendant un krach) · sommet (vendre une bulle juste avant qu'elle éclate) · couteau (acheter une chute qui continue, mise ≥ 5 000 €) · flair (3 achats à contre-courant réussis) · visionnaire (tripler une mise ≥ 2 000 € sur un fonds thématique) · lune (jeton ×10) · rekt (perdre ≥ 10 000 € sur un jeton) · angel (start-up rachetée) · proprio (résidence principale achetée avant 30 ans) · empire (3 biens) · million (1 M€ de 2026 avant 50 ans) · libre (plus de travail avant 60 ans) · fidele (marié·e à son premier amour, sans rupture) · patient (PEA de 20 ans valant plus d'un million d'euros de 2026) · patron (revendre sa boîte plus d'un million d'euros de 2026). Aucun succès ne doit être obtenu par plus de 60 % des joueurs aléatoires.

---

## 6. Invariants : ce qui ne doit jamais casser

`npm test` les vérifie tous. S'il échoue, tu n'as pas fini.

1. **Identité de caisse** : `cash = capital initial + Σ flux externes (ext) + Σ flux du registre`, au centime, dans toutes les parties sans divorce. Conséquence : tout mouvement d'argent hors investissement (épargne, dépenses de vie, étude, héritage, retraite) passe par `ext()`. Tout mouvement d'investissement passe par `buyIn`, `sellIn`, `livIn`, `livOut`, `withdraw` ou `lgProp`. Ne modifie jamais `S.cash` directement pour de l'argent qui entre ou sort.
2. **Le rééquilibrage ne crée ni ne détruit d'argent** : `net() + impôt` est inchangé. `dry()` ne modifie pas l'état, et l'aperçu donne le même résultat que l'exécution.
3. **Aucune valeur non finie (NaN, Infinity)** et **aucune position négative** dans `S`. Le plafond du PEA est respecté.
4. **Pas de fausse faillite** : une faillite n'est déclarée que s'il ne reste rien à vendre.
5. **Déterminisme** : à graine égale, la partie est identique. Le jeu tire tout son hasard de `rnd()`. Les fonctions `view()`, les onglets, les conseils et tout l'affichage doivent être **purs** : jamais de `rnd()` dedans (le test vérifie que `S.rng` ne bouge pas pendant un rendu). Le hasard va dans `genYear`, `make()`, `act()`, `makeNotes`, `imprevu` ou au moment du tirage, dans `startTurn`.
5 bis. **L'histoire tient ses promesses** : aucun texte de fenêtre identique deux fois dans une partie, au plus 3 présidentielles en fenêtre, chaque fil ouvert reçoit une suite ou une fin, au moins deux moments racontés par chapitre atteint. Tout argent d'un fil passe par `ext()`, `spend()` ou les fonctions d'ordre.
6. **Le monde reste réaliste** : les statistiques de 150 mondes (600 en test complet) restent dans les cibles de la section 5.
7. **Sauvegardes compatibles** : un aller-retour JSON en cours de partie redonne le même état. Une partie de la version 2 est résumée et close proprement.
8. **`index.html` à jour** (`npm run check`).

## 7. Équilibrage : cibles actuelles (`npm run balance`)

**Mondes appariés (depuis la 3.14)** : la partie n° i de chaque stratégie rejoue la même graine (`RR = mulberry(seed × 7919 + i)` dans `run` et dans la boucle des entrepreneurs). Les rapports mesurent donc l'effet des choix, pas la chance du tirage ; avant, deux échantillons de 100 parties indépendants donnaient environ ±10 % de bruit. Un test qui remplace `ctx.Math.random` doit remettre la valeur qu'il a trouvée (voir « Déterminisme »), sinon l'appariement saute pour tout le rapport.

| Mesure | Cible | Dernière valeur (graines 11 et 4242, version 3.14, mondes appariés) |
|---|---|---|
| Passif PEA / repère ETF Monde sans frais | 0,85 – 1 | 0,92 – 0,91 |
| Élève de Sophie (suit ses conseils et ses avis sur les événements) / passif à 60 % d'actions | ≥ ×1,0 | ×1,24 – ×1,22 |
| Élève de Sophie / acheteur naïf de paniques **au même profil** (80 % d'actions) | ≥ ×1,15 (décision de Flo du 8 novembre 2026) | ×1,17 – ×1,19 (graine 7 : ×1,16 ; médiane des rapports partie par partie : ×1,13) |
| Lecteur de fiches / acheteur naïf | ≥ ×1,15 | ×1,15 – ×1,30 (**WARN** à l'arrondi sur la graine 11 ; partie par partie : ×1,21 – ×1,25) |
| Entrepreneur (boîte créée au départ, un domaine sur cinq, budget par défaut) / salarié passif, médiane | 0,75 – 1,33 | ×1,10 – ×1,11 |
| Entrepreneur / salarié passif, 90e centile | ≥ ×1,3 | ×2,19 – ×2,13 |
| Entrepreneurs dont la boîte a fait faillite | 15 – 50 % | 47 – 48 % |
| Score du carriériste < score de l'équilibré | vrai | vrai sur les deux graines |
| 10e centile du patrimoine d'un joueur passif | > 0 | ≈ 860 – 1 060 k€ |
| Score médian de chaque profil tout fait / héritier | 0,75 – 1,33 | 0,92 – 1,13 (difficulté recalée en 3.13 : épargne × 90, constante 891 000) |
| Objectifs visés : rp35 ≥ 80 %, famille ≥ 40 % (infirmier) et ≥ 25 % (héritier), fire 25 – 70 %, 2,5 millions 15 – 60 % | | 100 / 54 / 45 / 44-51 / 49-53 % |
| Sophie ≥ 70 %, Kévin ≤ 60 % | | 78-80 % / 58-61 % (Kévin se mesure sur des joueurs aléatoires, non appariés : 61 % sur la graine 4242 est du bruit) |

Si tu modifies un paramètre de jeu, lance `npm run balance` avec deux graines différentes, corrige les WARN et mets à jour ce tableau.

---

## 8. Conventions

**Textes de l'interface** :
- Français, tutoiement, phrases courtes et concrètes, vocabulaire du joueur : « argent qui dort », pas « liquidités non allouées ».
- Pas d'incise entre tirets cadratins, pas de formule creuse.
- Un bouton dit exactement ce qu'il fait, et le message qui suit le confirme (« Placer l'argent qui dort », puis « Placé : … »).
- Une erreur explique quoi faire (« Il te manque 3 200 €. Vends d'abord une ligne »).
- Accords selon le genre du joueur (voir « Départ à 20 ans, genre, statut ») ; écriture inclusive légère (« président·e », « licencié·e ») seulement pour une personne dont on ignore le genre.
- **Tout est fictif** : entreprises, pays (Méridia), partis, candidats, start-up, jetons. Jamais de vrai nom de personnalité, de parti ou de société.

**Nombres** :
- Toujours `fmt` (euros arrondis, espace insécable, vrai signe moins « − »), `pct` (signe et virgule), `rate` (2 décimales), `f1` (une décimale).
- `font-variant-numeric: tabular-nums` dans les colonnes.
- Les rendements internes sont en fraction (0,05), affichés en %. Les taux macro (`S.w`) sont en points (2,5 = 2,5 %).

**Design** :
- Esthétique « journal financier » sobre : papier saumoné, encre aubergine, accent bleu canard. Pas de décor gratuit (pas de papier ligné, de post-it penchés ni d'émoji) : des cartes alignées (`.card`), des tableaux lisibles, quatre onglets (`.vtabs`). Les fenêtres de décision ont un filet coloré en haut (orange : marché, rose : vie perso). Petits dessins SVG au trait (`figure` avec la bouche selon l'humeur, `icon`), aucune autre police. Écran unique : barre d'argent sombre (`.hud`), navigation (`.navbar`), scène (`.stage`) en grilles de cartes (`.g-profil`, `.g-porte`, `.g-immo`, `.g-patri`, `.g-bilan`), fenêtres (`.overlay` + `.dmodal`) pour les décisions, le logement de départ et le dossier de crédit. Style « journal » depuis la 3.10 : angles presque droits (2-3 px), rubriques à filet d'encre en tête, sélections à l'encre (fond `--ink`), aucune ombre décorative, aucune animation à rebond ni rotation, seulement des fondus courts. Animations d'entrée seulement sous `.fx` (posée par `render()` quand `U.fx`), pour ne pas tout rejouer à chaque clic, et toujours dans `prefers-reduced-motion: no-preference`.
- Polices : Bodoni Moda pour les titres, IBM Plex Sans pour le texte, IBM Plex Mono pour les chiffres.
- La palette des graphiques (`--c1` à `--c5`) a été validée pour le daltonisme. Ne la change pas sans revalider (5 couleurs au maximum, toujours avec une légende chiffrée).
- Le vert et le rouge (`--up`, `--down`) sont réservés aux gains et aux pertes ; `--warn` signale ce qui inquiète (coussin trop mince, état « fatigué », raison d'un refus).

**Code** :
- Une action utilisateur = un `data-act` traité dans `onClick`, puis un `render()`.
- Toute nouvelle mécanique monétaire passe par les fonctions d'ordre existantes, pour hériter du registre, de la fiscalité et des invariants.
- Un nouvel événement = une entrée dans `EVT` (avec un poids `w(y,f)` qui dépend de l'état du monde) ou dans `LIFE`, avec un texte crédible, une décision obligatoire et des conséquences chiffrées affichées dans les choix.
- Un nouveau mécanisme macro va dans `genYear` et doit garder le test « Monde généré » au vert : vérifie le résultat avec `npm run monde` sur plusieurs graines.

---

## 9. Façon de travailler (à chaque session)

1. Relis la section concernée de ce fichier et le code correspondant **avant** de proposer quoi que ce soit.
2. Si la demande est ambiguë, coûteuse ou touche à l'équilibrage, pose une question courte à Flo. Sinon, fais-le.
3. Modifie **uniquement** `src/la-corbeille.html` (et les tests, les outils ou la doc si nécessaire).
4. `npm run build`, puis `npm test`. Si l'équilibrage est touché, `npm run balance`. Si le monde est touché, `npm run monde` sur quelques graines. Si l'interface est touchée, `npm run e2e`, puis **regarde les captures** desktop et mobile.
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
- mettre du hasard dans une fonction d'affichage ;
- modifier `S.cash` sans passer par `ext()` ou une fonction d'ordre ;
- réintroduire des dates ou des noms historiques réels ;
- livrer sans avoir lancé les tests.

---

## 10. Feuille de route (par priorité)

Fait en 3.7-3.12 : carrière et entreprise, point de juillet, style journal ; histoire en chapitres et fils narratifs, années calmes enchaînées, classement entre amis (version officielle), monde du jour et graine partageable, premiers pas et glossaire, annulation du dernier ordre, graphique annoté, SCPI, LMNP, obligations d'entreprise, IFI, Bordeaux et Marseille, DPE, sons.

1. **Classement ouvert à tous** : aujourd'hui, sur un compte personnel, les amis qui arrivent par le lien public ne peuvent qu'envoyer leur résultat au propriétaire. Passer par une organisation (plan Team) ou inviter chaque ami en Contributeur leur permettrait d'inscrire leur score eux-mêmes.
2. **Contenu** : donation-partage et succession détaillée en fin de partie, fiscalité propre au jeton numérique, crise immobilière locale dans une ville.
3. **Rythme** : passage optionnel de deux années à la fois pour les joueurs pressés (attention : le budget est annuel).
4. **Mobile** : vérifier la saisie « Mes chiffres » et la fenêtre du classement sur petits téléphones.

Pour chaque chantier : proposer d'abord un mini-plan à Flo (règles chiffrées, impact sur l'équilibrage), puis construire, tester et mettre à jour ce fichier.
