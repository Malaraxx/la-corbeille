# La Corbeille · Saison 4 : brief pour Claude Code

Ce fichier est lu au début de chaque session qui touche à `saison4/`. **La référence des règles et des chiffres est le cahier des charges v3** (`saison4/CAHIER_DES_CHARGES_SAISON4_V3.md`, 13 novembre 2026 : la gestion d'entreprise au trimestre). Il remplace la v2 (`docs/saison4/CAHIER_DES_CHARGES_SAISON4_V2.md`) partout où les deux diffèrent ; ce que la v3 ne dit pas reste valable dans la v2, puis dans la v1 (`docs/saison4/CAHIER_DES_CHARGES_SAISON4.md`). Le prototype (`docs/saison4/prototype-saison4.html`) montre l'esprit et la mise en page. En cas de contradiction, le cahier des charges gagne. Les chiffres marqués « à vérifier » sont vérifiés sur une source officielle ou professionnelle avant d'être codés, source en commentaire ; sinon une valeur prudente avec `TODO`. Pour tout le reste (Flo, ton, commits, publication), le `CLAUDE.md` de la racine s'applique.

La version 3 reste intacte et jouable à la racine (`src/la-corbeille.html`). On n'y touche pas, sauf le lien « Essayer la Saison 4 » de l'écran de départ.

---

## 1. Le jeu (étape A livrée le 14 novembre 2026)

Un jeu de gestion d'entreprise au trimestre, avec la vie perso et le patrimoine autour. **Janvier 2026, 22 ans** : sexe, pseudo, ville (`CITIES` : Lille, Lyon, Paris, Bordeaux, Marseille, Toulouse, Nantes), **profil de départ** (`STARTS`, §1.2), logement, **secteur** (seul le Commerce est ouvert), **produit** (vêtements, cosmétiques, café), puis le nom et le financement de la boîte. Format **Standard** : 20 ans, 80 trimestres, fin en décembre 2045 (`ST.endY`). Les formats Rapide et Carrière, le tutoriel d'un an et « Passer des années » arrivent à l'étape G.

**Boucle d'un trimestre** (§3.1) : tableau de bord (onglet 🏢 Entreprise : 6 chiffres clés, courbe sur 8 trimestres, alertes) → décisions préremplies (« Garder mes réglages » d'un appui, ou « Décider le T… » avec un prévisionnel en fourchette en direct) → résultat animé et « Pourquoi ? ». **Après le T4** : la décision de l'année (la Une), « Que fais-tu du résultat ? » (réinvestir, prime, dividende), le récap (vie pro, patrimoine, vie perso), puis le bilan animé de l'année.

Publié sur GitHub Pages : `https://malaraxx.github.io/la-corbeille/saison4/`. Un lien `#graine-123456` impose la graine (tests et parties à comparer).

---

## 2. Fichiers et commandes

```
saison4/CAHIER_DES_CHARGES_SAISON4_V3.md ← la référence
saison4/src/la-corbeille-s4.html  ← LA source (format artifact : commence par <title>, pas de squelette)
saison4/index.html                ← généré, ne jamais éditer
saison4/tools/build.mjs           ← ajoute le squelette (marqueur : <main class="app" id="app">)
saison4/tests/run.mjs             ← tests du moteur dans node:vm (sans DOM, Math.random interdit) ; --balance pour l'équilibrage
saison4/tests/balance.mjs         ← les 6 bots du §8 (makePlayer) et le rapport ; écrit saison4/tests/balance-s4.json
saison4/tests/e2e.mjs             ← partie Standard complète Playwright, mobile 390×844 et desktop 1440×900, captures
saison4/tests/peek.mjs            ← déroule une partie (node saison4/tests/peek.mjs premium/cosm/lyon 42)
docs/saison4/                     ← cahiers v1 et v2, prototype de Flo
```

| Commande | Rôle |
|---|---|
| `npm run build:s4` | régénère `saison4/index.html` |
| `npm run test:s4` | vérifie que l'index est à jour, puis les tests du moteur (≈ 5 s) |
| `npm run balance:s4` | 6 bots × 300 parties, Commerce, Standard (≈ 1 min) ; `-- --n=60` pour aller vite |
| `npm run e2e:s4` | partie Standard complète mobile et desktop (≈ 10 min) ; `node saison4/tests/e2e.mjs --years=2` pour un tour rapide |

Playwright s'installe sans l'enregistrer : `npm i --no-save playwright@1.49.1 && npx playwright install chromium`.

---

## 3. Architecture du fichier source

Un seul `<script>`, en deux parties :
- **`/* ===== MOTEUR : … ===== */`** : outils, hasard, paramètres officiels, données du monde, **secteurs** (`SECTORS`, `ROLES`), placements, état, patrimoine, fiscalité, budget perso, création, **entreprise** (outils, création, trimestre, « Pourquoi ? », décisions et prévisionnel, actions, trimestre complet, clôture annuelle, valorisation), économie, carrière hors entreprise, vie perso, clôture de l'année, Une, événements, dossiers, succès, sauvegarde, conseils. Aucune référence au DOM.
- **`/* ===== UI : … ===== */`** dans `if (typeof document!=='undefined'&&document.getElementById('app')) (function(){ … })();` : effets, création (`FLOW`), hub (`VIEWS.home`, `VIEWS.biz`, `VIEWS.dec`, `VIEWS.budget`, `VIEWS.inv`, `VIEWS.profil`), résultat du trimestre (`showQuarter`), clôture (`annual`, `affectSheet`, `preRecap`, `showBilan`, `endGame`), conseils « ! ».

**Hasard** : `rnd()` (mulberry32) lit et écrit `ST.rs`. `Math.random` est interdit dans le moteur (le bac à sable des tests lève une erreur). Le cœur du trimestre, `runQuarter(B, d, X)`, ne tire rien : les aléas (bruit de demande par zone, retard de livraison, conjoncture, accueil du produit) arrivent dans `X`, tirés par `playQuarter`. Le prévisionnel rejoue `runQuarter` sur une copie de `BIZ`, sans aléa.

**Vues pures** (testé à chaque trimestre) : `forecast()`, `bizValue()`, `payNeeded()`, `affectPreview()`, `budget()`, `net()`, `tipsFor()`, `yearNews()`, `where100()`.

**Argent** : tout mouvement perso passe par `cash(montant, catégorie)` (invariant `ST.cash = Σ ST.flow`) ; tout mouvement de la société par **`bizCash(montant, catégorie)`** (invariant `BIZ.cash = Σ BIZ.flow`). Les deux sont strictement séparés : seuls le salaire (dans le budget perso), la prime, les dividendes, l'apport (capital, compte courant d'associé) et son remboursement passent de l'un à l'autre. Montants en euros courants ; `ST.cpi` indice des prix (1 en 2026) ; `real(x)` en euros de 2026.

### État `ST` (sauvegardé sous `la-corbeille-s4`, `v` = 3)

| Champ | Contenu |
|---|---|
| `seed`, `rs` | graine et état du hasard |
| `sexe`, `pseudo`, `city`, `start`, `home`, `fmt`, `endY` | identité, ville, profil de départ (`STARTS`), logement, format, dernière année |
| `year`, `q`, `age`, `cpi`, `eco`, `ecoY` | date (q = 1 à 4, 5 = les quatre trimestres sont joués, clôture à faire), économie connue (an dernier) et économie de l'année tirée en janvier (cachée) |
| `prof` | `chef`, `chomage`, `salarie` (CDD de transition), `retraite` (format Carrière) |
| `cash`, `livret`, `env`, `debts`, `doss` | perso : compte, Livret A, enveloppes (pas encore d'interface), dettes (`stu`, `honneur`, `conso`), dossiers |
| `biz` | **BIZ**, ou `null` (voir ci-dessous) ; `bizPast` = boîtes passées (faillites) |
| `job`, `cho`, `surend` | CDD, chômage, plan de surendettement |
| `hum`, `couple`, `partner`, `pInc`, `married`, `kids`, `rep` | vie perso |
| `ev`, `evDone`, `evY`, `une`, `yr`, `flags` | décision de l'année, la Une, compteurs de l'année (`div`, `prime`…) |
| `xp`, `ach`, `hist`, `log`, `humH`, `over`, `lastQ` | niveau, succès, patrimoine par année, journal, fin de partie, dernier trimestre |

**BIZ** (`ST.biz`) : `sector`, `name`, `prod`, `pos` (entrée, milieu, premium), `cash`, `flow`, `share`, `capIn`, `cca` (compte courant d'associé), `zones{ville,region:{open,N}}` (N = notoriété), `lots[{n,uc,q,age,dep}]` (stock, au plus ancien d'abord), `pipe[{n,uc,q,at}]` (commandes en route), `payables[{a,at}]` (fournisseurs), `bank{left,rate,pmt}`, `team{emp,com,man,cad}`, `pay` (salaire net mensuel), `dec` (réglages du dernier trimestre), `hist[]` (par trimestre : `ca`, `mb`, `ebe`, `res`, `cash`, `D`, `sold`, `dir`, `N`, `util`), `years[]` (comptes annuels), `amort[]`, `lossCarry` (déficits reportables), `ran` (report à nouveau), `fit` (accueil du produit, caché) et `fitEst` (ce que le prévisionnel en a appris), `red` (trimestre de tolérance au-delà du découvert), `affY` (année dont le résultat est affecté), `last` (résumé du dernier trimestre et son « Pourquoi ? »).

**Migrations** : `migrate()`. Les parties v1 et v2 (études, moteur annuel) ne se convertissent pas : `restore` renvoie `{legacy:true}`, l'écran titre explique et efface (la Saison 4 n'a jamais été publiée en version officielle).

---

## 4. Chiffres officiels (sources en commentaire dans le code)

| Paramètre | Valeur | Source |
|---|---|---|
| Âge légal de départ | 64 ans (`RETIRE_AGE`, format Carrière) | service-public.fr F14043, vérifiée le 14 août 2026 |
| Barème de l'impôt 2026 | 0 / 11 / 30 / 41 / 45 %, plafond 1 807 € par demi-part | service-public.fr F1419, vérifiée le 15 avril 2026 |
| Impôt sur les sociétés | 15 % jusqu'à 42 500 € (PME), 25 % au-delà ; déficits reportés | entreprendre.service-public.gouv.fr A16250 (art. 219 du CGI), vérifiée le 14 novembre 2026 |
| Prêt d'honneur | 0 %, sans garantie, à la personne ; moyenne 10 000 € ; 2 à 5 ans → jeu : 10 000 € au plus, 5 ans | Bpifrance Création « Prêt d'honneur » (pid530), Initiative France, vérifiés le 14 novembre 2026 |
| Délais de paiement entre professionnels | 60 jours au plus (ou 45 jours fin de mois) ; fournisseurs du jeu : 0, 30, 45 jours | Code de commerce L441-10, Banque de France fiche 601, Bpifrance Création, vérifiés le 14 novembre 2026 |
| SMIC brut 2026 | 1 823,03 € | cahier des charges v1 |
| Prélèvements sociaux, flat tax | 18,6 % / 17,2 % ; PFU 31,4 % (dividendes, plus-values) | décision de Flo du 8 novembre 2026 |

**Valeurs prudentes avec `TODO`** (aucune source officielle trouvée, à vérifier avant d'être affinées) : coût employeur des rôles (`ROLES` : employé·e 1 970 €/mois, ≈ SMIC avec la réduction générale dégressive 2026 d'après des simulateurs privés ; commercial·e 3 300 €, chef·fe d'équipe 4 300 €, directeur·rice des opérations 7 200 €) ; coût du président de SAS = 1,8 × le net (`DIR_COST`) ; découvert professionnel à 9 % (`OD_RATE`) ; assurance, expert-comptable, logiciels 700 €/mois ; multiple de base du commerce 4 × l'EBE retraité ; droits de douane à l'import d'Asie (non comptés). Prêt bancaire de création 5,5 % sur 5 ans et prêt étudiant 2,5 % sur 10 ans : valeurs du jeu depuis la v2, remplacées à l'étape F.

---

## 5. Règles du moteur (valeurs de référence, toutes dans `SECTORS.commerce`)

- **Demande** (§4.1, `runQuarter`) : par zone ouverte, `Marché × Saison (0,9 / 0,95 / 0,85 / 1,3) × Conjoncture^cy × Part`, `Part = A / (A + Concurrence)`, `A = (prix/marché)^−ε × (qualité/attendue)^α × (1 + N) × adéquation × effet commercial × accueil du produit`. Positionnements (`pos`) : entrée (ε 2,8, prix ×0,72, volumes ×1,35, profite des crises : cy −0,5), milieu (ε 1,9), premium (ε 1,4, prix ×1,63, volumes ×0,3, très sensible à la conjoncture : cy 2,2). Taille du segment premium par produit (`pv` : cosmétiques ×1,7, café ×0,6). Zones (`zones`) : Ville (concurrence 11, livraison 8 % du prix), Région (×4, concurrence 22, livraison 12 %, ouverture 15 000 € amortis sur 8 trimestres). Bruit de demande 14 % par zone et par trimestre ; **accueil du produit** caché tiré à la création (écart-type 35 % en log), appris par le prévisionnel (`fitEst`, moitié de l'écart chaque trimestre). Conjoncture (`conjOf`) : la Bourse de l'année (krach 0,86, repli 0,94, sinon 0,97 à 1,05).
- **Ventes** (§4.2) : `min(demande, capacité, stock)` ; ruptures et saturation chiffrées. Retours = 2 % + 30 % × manque de qualité (25 % au plus). Démarque 2,5 % du stock par trimestre, réduite par le temps de gestion. **Soldes** en T1 et T3 (−20, −30, −50 %) : le stock en trop part à prix cassé (le premium y perd de la notoriété).
- **Fournisseurs** (§5.1, `sup`) : France (coût ×1,2, qualité 1,12, minimum 150, payé à 30 jours), Europe (×1, minimum 400, 45 jours, retard 8 % : la moitié glisse au trimestre suivant), Asie (×0,68, qualité 0,8, minimum 1 500, payé à la commande, livré au trimestre suivant, retard 15 %). Minimums × `hk` du produit. **Commande de lancement** livrée avant l'ouverture. Invendu de plus de 4 trimestres décoté de moitié.
- **Notoriété** (§4.3) : `N ← N × 0,85 + 1,2 × √(promo / marché en €) + 0,4 × part × qualité − pénalités de rupture et d'attente`, bornée à 4 ; +10 % d'efficacité la première année pour l'école de commerce ; changer de positionnement coûte 30 % de notoriété.
- **Capacité et équipe** (§4.5) : dirigeant 5 000 unités × part de temps sur la production ; employé·e 3 000 (× `hk` : café 1, cosmétiques 0,55, vêtements 0,3). Au-delà de 8 personnes par chef·fe d'équipe, −5 % d'efficacité par personne en trop ; au-delà de 25 sans directeur·rice, −3 % par personne. Recruter : 1 mois de salaire ; se séparer : 2 mois. Temps du dirigeant (commercial, production, gestion).
- **Charges** : local (loyer d'un T2 de la ville, +15 % par salarié), 700 €/mois de frais, équipe, toi (net × 1,8), promotion, intérêts (prêt, découvert). EBE et résultat au trimestre, IS à la clôture annuelle.
- **Trésorerie** (§4.4) : BFR = stock (en route compris) − fournisseurs (clients comptant). Découvert autorisé 15 % du CA des 4 derniers trimestres (5 000 € au moins), agios 9 %. Au-delà : **apport automatique en compte courant** si c'est moins de la moitié de ton argent disponible ; sinon un trimestre de tolérance (`red`), puis **faillite** (cessation de paiements, liquidation, compte courant perdu ; immédiate au-delà du double du découvert). Après une faillite : chômage sans ARE (président·e de SAS), CDD de transition possible, relance dès 1 000 € d'apport (compte + prêt d'honneur).
- **Prévisionnel** (§3.1, `forecast`) : trois simulations sur une copie (bruit 0,86 / 1 / 1,15, conjoncture connue, accueil appris) → fourchette de CA, de résultat et de trésorerie ; si le stock ou l'équipe plafonnent les ventes, « au plus … ». Mesuré : le réel tombe dans la fourchette (±15 %) dans au moins 60 % des trimestres.
- **« Garder mes réglages »** (`keepDec`) : les réglages du trimestre dernier, avec la commande au réassort suggéré (`suggestOrder` : demande passée désaisonnalisée jusqu'à la livraison suivante, +5 %, moins le stock et ce qui arrive). **Pilote automatique** (`autoDec`) : pareil, embauche ou se sépare d'un·e employé·e quand la capacité sature ou tourne à vide deux trimestres, ouvre la zone suivante seulement avec 5 fois son coût et 6 mois de charges en trésorerie.
- **Clôture annuelle** (§3.3, `affectPreview`, `bizAffect`) : prime (charge de la société, coût = net × 1,8, impôt sur le revenu au taux marginal), IS sur le résultat moins les déficits reportés, dividende ≤ report à nouveau et trésorerie (PFU 31,4 %), compte courant rendu au-delà de 3 mois de charges. Puis `closeYear` : marchés, dettes perso, chômage et CDD, dossiers, vie perso, découvert perso (`cover`), nouvelle année.
- **Valorisation** (§4.7, `bizValue`) : `EBE retraité (4 derniers trimestres, ta rémunération remplacée par celle d'un·e dirigeant·e salarié·e à 54 000 €/an) × multiple + trésorerie − dettes` ; multiple = 4 × croissance du CA sur 3 ans (1 + 2 × (g − 5 %), 0,6 à 2) × récurrence 0,95 × marge (1 + 3 × (marge − 8 %), 0,6 à 1,6) × dépendance au dirigeant (0,75 seul, 0,85 avec une équipe, 1 avec un·e chef·fe d'équipe, 1,1 avec une direction) × concentration des clients 1 × conjoncture. Sans EBE retraité positif : actif net (trésorerie + stock au coût − dettes). **Dans le patrimoine** (`bizVal`), ta part compte nette de la flat tax latente sur la plus-value au-delà de ton apport, plus ton compte courant.
- **Perso** : budget du mois (`budget()`) payé chaque trimestre (× 3) ; salaire nécessaire affiché (`payNeeded`) ; découvert perso : Livret A, ventes forcées, crédit plafonné à 6 mois de revenus, surendettement (7 ans à 0 %).

---

## 6. Invariants (testés par `npm run test:s4`)

1. `ST.cash = Σ ST.flow` et `BIZ.cash = Σ BIZ.flow` au centime, à chaque trimestre de chaque partie.
2. Aucune valeur non finie ; stock, commandes, fournisseurs, prêt, compte courant, dettes, Livret A jamais négatifs ; notoriété entre 0 et 4 ; jauges entre 0 et 100.
3. Les vues ne modifient pas l'état et ne tirent aucun hasard ; même graine, même partie ; une partie rechargée continue à l'identique.
4. Aucun `Math.random` dans le moteur ; aucun reste des études, des anciens secteurs ni de croissance, marge ou valorisation fixées d'avance.
5. Chaque ville × parcours × produit démarre avec un stock, un budget fini, un salaire qui couvre le budget perso et une décision ; chaque partie Standard fait exactement 80 trimestres et finit fin 2045.
6. La trésorerie ne dépasse jamais le double du découvert autorisé à la fin d'un trimestre ; le patrimoine ne passe jamais sous −50 000 € réels.
7. Une faillite dit toujours sa raison (« cessation de paiements », découvert) et un rebond reste possible.
8. Le prévisionnel est une fourchette (ou un plafond annoncé) ; « Pourquoi ? » explique ventes, marge et trésorerie à chaque trimestre, sans texte illisible.
9. Sur mobile (390×844) et desktop : rien ne déborde, aucune cible de moins de 40 px, aucun « NaN » affiché, partie Standard complète jusqu'à l'écran de fin (`e2e.mjs`).

---

## 7. Équilibrage (cahier des charges v3, §8)

`npm run balance:s4` : six bots (`BOTS` dans `balance.mjs`), 300 parties chacun, Commerce, Standard, mondes appariés (même graine pour la partie n° i de chaque bot, même produit : café, cosmétiques, vêtements à tour de rôle). Résultat dans `saison4/tests/balance-s4.json`.

Bots : **raisonnable** (milieu de gamme, prix du marché, promo 2,5 % du CA, stock au réassort +10 %, embauche quand la capacité sature, ouvre la région après 6 trimestres bénéficiaires, 40 % du résultat en dividendes), **agressif** (prix −8 %, promo 5,5 %, prêt bancaire maximal, région dès le 5e trimestre, emprunte), **premium** (premium, fournisseur français, prix +8 %), **radin** (entrée de gamme, Asie, aucune promo, tout en dividendes), **auto** (pilote automatique seul), **idiot** (réglages au hasard). Tous apportent en compte courant quand la trésorerie dépasse 70 % du découvert, sauf auto et idiot.

Résultats du 14 novembre 2026 (graine 11, 300 parties par bot, euros de 2026) :

| Bot | Médiane | 10e centile | 95e centile | Meilleure | Faillite ≥ 1 | Boîte vivante à la fin |
|---|---|---|---|---|---|---|
| raisonnable | 391 k€ | −2 k€ | 1,87 M€ | 3,09 M€ | 40 % | 85 % |
| agressif | 3 k€ | −5 k€ | 346 k€ | 594 k€ | 75 % | 59 % |
| premium | 439 k€ | −5 k€ | 2,12 M€ | 3,65 M€ | 44 % | 71 % |
| radin | 0 k€ | −7 k€ | 108 k€ | 227 k€ | 85 % | 41 % |
| auto | 220 k€ | −3 k€ | 1,52 M€ | 2,83 M€ | 46 % | 82 % |
| idiot | −3 k€ | −7 k€ | 3 k€ | 9 k€ | 99 % | 4 % |

| Mesure | Cible | Valeur |
|---|---|---|
| Médiane raisonnable / idiot | ≥ ×3 | idiot ≤ 0 : OK |
| Aucun bot ne domine partout | le meilleur change | premium (par conjoncture) ; raisonnable / premium / auto selon le produit (café / cosmétiques / vêtements) : OK |
| auto / raisonnable | ×0,5 à ×0,8 | ×0,56 : OK |
| Écart entre secteurs | ≤ ×1,5 | un seul secteur (étape A) |
| Faillite au moins une fois (raisonnable) | 20 à 40 % | 40 % : OK, à la limite |
| Faillite (agressif) | 50 à 75 % | 75 % : OK, à la limite |
| Patrimoine médian (raisonnable) | 250 à 700 k€ | 391 k€ : OK |
| Top 5 % SaaS | ≥ ×5 la médiane | SaaS à l'étape E |
| Pire moment | ≥ −50 k€ | −36 k€ : OK |
| Meilleure partie sur 1 800 | > 10 M€ sans NaN | 3,65 M€ sans NaN : **WARN**. Avec la Ville et la Région seulement, le marché plafonne le CA autour de 1 à 1,5 M€ par an ; les zones France, Europe et International (étape B) doivent ouvrir ce plafond. |

Leçons du calibrage : sans « accueil du produit » caché, aucun bot raisonnable ne faisait faillite ; une livraison entièrement en retard tuait une boîte saine en un trimestre (d'où la moitié qui glisse) ; avec la promo à 0,55 au lieu de 1,2, dépenser en promotion ne rapportait rien ; compter la boîte brute favorisait ceux qui ne versent jamais de dividendes (d'où la flat tax latente).

---

## 8. Avancement (plan du §9 de la v3)

| Étape | Contenu | État |
|---|---|---|
| Socle et étape 0 (v2) | build, tests, budget perso, dettes plafonnées, surendettement | fait (`7d4d247`), gardé |
| **A. Moteur trimestriel** | `BIZ` et `bizCash`, demande, ventes, marge, notoriété, trésorerie et BFR, équipe et complexité, valorisation calculée ; Commerce (produits, fournisseurs, stock, ruptures, soldes ; Ville et Région) ; tableau de bord, décisions et prévisionnel, résultat et « Pourquoi ? », clôture annuelle ; départ à 22 ans avec le profil du §1.2 ; 6 bots | **fait (14 novembre 2026)** |
| B. Stratégie commerciale complète | zones France, Europe, International (douane, TVA, transport), canaux (site, boutique, marketplaces, revendeurs), promotion par canal, concurrence qui réagit (entrant annoncé, guerre des prix), lancements de produits | à faire |
| C. Restauration | §5.2 | à faire |
| D. BTP | §5.3 | à faire |
| E. SaaS | §5.4 | à faire |
| F. Finance d'entreprise | étude de dossier, caution, prêt garanti, affacturage, rachats, holding, cession, rebond vers un autre secteur | à faire |
| G. Tutoriel, formats, clôture complète | tutoriel d'un an avec Sophie, formats Rapide et Carrière, « Passer des années », placements et immobilier dans la clôture, événements d'entreprise au trimestre, équilibrage final, passe mobile | à faire |
