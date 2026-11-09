# La Corbeille · Saison 4 · Cahier des charges

> Document de référence pour Claude Code. Rédigé le 9 novembre 2026 à partir des sessions de design avec Flo.
> Prototype de référence : `docs/saison4/prototype-saison4.html` (jouable, à ouvrir dans un navigateur).
> **Règle d'or : le prototype montre l'esprit et la mise en page ; ce document fait foi pour les règles et les chiffres.** En cas de contradiction, ce document gagne. En cas de doute, demande à Flo.

---

## 0. Vision en 5 lignes

1. Une simulation de patrimoine **adulte et sobre** : on démarre à 20 ans en janvier 2026, on joue une année par tour jusqu'à la retraite.
2. **Un minimum de gestes** : toucher, glisser un curseur, maintenir pour valider. Jamais de formulaire.
3. **Chaque profil est un autre monde** : un apprenti, un salarié, une fonctionnaire, une cheffe d'entreprise n'ont pas le même écran Carrière ni les mêmes dilemmes.
4. **Tout est expliqué en clair** : chaque chiffre dit d'où il vient (« 784 € brut = 43 % du SMIC, 1re année »).
5. **Crédible pour un financier** (vraie fiscalité 2026, vrais ordres de grandeur) et **lisible pour un non-financier**.

---

## 1. Contraintes techniques

- **Nouveau fichier source** : `saison4/src/la-corbeille-s4.html`, construit vers `saison4/index.html` (GitHub Pages : `https://malaraxx.github.io/la-corbeille/saison4/`).
- **La version 3 reste intacte et jouable** à la racine. Ne touche pas à `src/la-corbeille.html` sauf pour ajouter un lien « Essayer la Saison 4 ».
- Mêmes règles que la v3 (voir `CLAUDE.md`, section 2) : un seul fichier autonome au format artifact Claude, pas de framework, Google Fonts uniquement, pas d'`alert`/`confirm`/`prompt`, `localStorage` dans un `try/catch`.
- **Moteur et interface séparés** dans le fichier (sections balisées `/* ===== MOTEUR : … ===== */` et `/* ===== UI : … ===== */`). Le moteur est testable dans `node:vm` sans DOM, comme en v3.
- **Hasard déterministe** : PRNG à graine (`mulberry32`), jamais `Math.random()` dans le moteur. Les vues sont pures.
- Clé de sauvegarde : `la-corbeille-s4`, avec un champ `v` et des migrations dès le premier changement de format.
- **Tests** : `saison4/tests/run.mjs` (moteur, invariants, équilibrage) et `saison4/tests/e2e.mjs` (Playwright : parties complètes mobile 390×844 et desktop 1440×900, captures).

---

## 2. Direction artistique

**Esprit** : appli bancaire premium qui raconte une vie. Sobre, moderne, adulte. On **alterne le sombre et le clair** : bandeaux bleu nuit (en-tête, Une, cartes « héros », bilan) et contenu sur fond clair.

| Token | Valeur | Usage |
|---|---|---|
| `--navy` | `#0B1E3B` | en-tête, cartes sombres, boutons principaux |
| `--navy2` / `--navy3` | `#13294B` / `#1D3A63` | surfaces sombres secondaires |
| `--bg` / `--card` / `--line` | `#F2F4F8` / `#FFFFFF` / `#DCE2EC` | fond clair, cartes, filets |
| `--ink` / `--muted` | `#0E1726` / `#5B6B82` | texte |
| `--red` | `#C8102E` | pertes, alertes, refus, bouton astuces « ! » |
| `--gold` | `#C9A227` | titres d'accent, niveau, action dorée (« Clôturer », « Commencer ») |
| `--green` | `#1F8A5B` | gains ; animation de **billets verts** 💵 |

- Polices : **Archivo** (titres, largeur 85–88 %), **Public Sans** (texte), **IBM Plex Mono** (tous les montants). `font-variant-numeric: tabular-nums`.
- **Emojis natifs** comme icônes (ils s'affichent façon iPhone sur iPhone). Pas d'emoji ambigu : 💳 Compte, 📈 Placé, 🏛️ Patrimoine, 🐷 Livret A, 🇫🇷 PEA, 🌍 Compte-titres, 🛡️ Assurance vie.
- **Animations** : gain = billets 💵💶 qui volent + compteur qui défile ; perte = flèche rouge qui s'écrase + écran qui tremble ; validation = bouton qui se remplit pendant le maintien (≈ 0,5 s). Tout coupé si `prefers-reduced-motion`.
- Desktop (≥ 900 px) : menu latéral bleu nuit à gauche, contenu centré (max 960 px), feuilles en fenêtre centrée.

### 2.1 Mobile (exigence bloquante)
- Tout est jouable à **390×844** au pouce : cibles ≥ 44 px, barre d'onglets en bas, feuilles qui montent du bas, en-tête compact.
- **Aucun défilement horizontal**, aucun texte coupé, aucun bouton hors écran (les boutons « maintenir » des longues feuilles restent atteignables).
- Respect des zones sûres (`env(safe-area-inset-*)`).
- Le test e2e mobile joue une partie complète et échoue si un élément déborde de 390 px.

---

## 3. La boucle d'une année

1. **La Une** (carte sombre en haut de l'Accueil) : l'actualité de l'année en 2-3 phrases écrites (marchés, taux, emploi), plus **le dénouement des dossiers de l'an dernier**.
2. **La décision de l'année** (obligatoire) : un dilemme en **versus** (deux choix, effets en étiquettes) ou un **pari au curseur**. Le bouton « Clôturer » reste bloqué tant qu'elle n'est pas prise.
3. **Gestion libre** : placer, acheter, demander une augmentation, gérer sa société, faire du shopping.
4. **Clôturer l'année** → **récap avant validation** (voir §12), puis maintenir pour valider.
5. **Bilan animé** (§12), puis l'année suivante.

**En-tête permanent** : avatar, pseudo, âge, métier, niveau, bouton « Clôturer {année} » ; trois chiffres : 💳 Compte · 📈 Placé · 🏛️ Patrimoine ; **le reste du mois** (`+981 €/mois`) ; jauges Humeur et Couple (Couple masquée si célibataire).

**Onglets** : 🏠 Accueil · 💼 Carrière · 📈 Placer · 🏢 Immobilier · 🧾 Budget · 🛍️ Shopping · 👤 Profil (7 sur desktop ; sur mobile, Shopping et Profil peuvent passer dans un menu « Plus » si 7 icônes ne tiennent pas à 390 px).

---

## 4. Création du personnage (≈ 6 touchers)

1. **Qui es-tu ?** Homme ou femme (avatar), **pseudo** (champ + 🎲). Le pseudo remplace « La Corbeille » partout (budget, profil, classement).
2. **Ville** : Lille, Lyon, Paris, Bordeaux, Marseille (loyers et salaires différents, reprendre `CITIES` de la v3).
3. **Chemin à 20 ans** : 🎓 Études · 💼 Travailler tout de suite · 🚀 Créer sa boîte.
4. **Domaine** (6 par chemin, tableau ci-dessous).
5. **Financement** (études hors alternance, et boîte) : curseur.
6. **Logement** : chez les parents · colocation · studio.
7. **Récapitulatif** avec la fiche contrat complète, puis « Commencer ma vie ».

### 4.1 Données des domaines (reprendre celles du prototype et les enrichir)

**Études** (frais annuels, durée, salaire net à la sortie, employeur fictif) :

| Domaine | École (fictive) | Durée | Frais/an | Sortie |
|---|---|---|---|---|
| École de commerce | ESC Lille Métropole | 5 | 10 000 € | ≈ 2 600 € · Banque du Nord |
| École d'ingénieurs | École Centrale du Nord | 5 | 3 000 € | ≈ 2 700 € · Alstrom Industries |
| Soins infirmiers | IFSI de Lille | 3 | 170 € | ≈ 2 000 € · CHU (fonctionnaire) |
| Droit | Faculté de droit | 5 | 180 € | ≈ 2 300 € · Cabinet Vauban |
| Informatique | IUT, BUT Informatique | 3 | 180 € | ≈ 2 300 € · Pixelfab |
| Artisanat en alternance | CFA du Bâtiment, BP Menuisier | 2 | 0 € (payé) | ≈ 1 850 € · Menuiserie Duval & Fils |

**Financement des études** :
- Parents : 500 €/mois + frais payés ; en échange, dilemmes « famille » plus fréquents.
- Job étudiant : ≈ 650 €/mois ; **ne couvre pas** les grosses écoles (l'écran le dit).
- **Prêt étudiant garanti par l'État : jusqu'à 20 000 € sans caution**, débloqué mensuellement, remboursé sur 10 ans après le diplôme.
- Bourse CROUS (échelons, 10 mois) : 0 bis 1 454 € · 1 2 163 € · 2 3 071 € · 3 3 828 € · 4 4 587 € · 5 5 212 € · 6 5 506 € · 7 6 335 € par an. Échelon tiré selon le profil des parents (paramètre caché).
- APL si logement hors parents (≈ 110 à 150 €).

**Apprentissage 2026** (SMIC brut **1 823,03 €**) : salaire minimum en % du SMIC

| Âge | 1re année | 2e année | 3e année |
|---|---|---|---|
| 18 à 20 ans | 43 % | 51 % | 67 % |
| 21 à 25 ans | 53 % | 61 % | 78 % |
| 26 ans et + | 100 % | 100 % | 100 % |

Net ≈ brut sous 50 % du SMIC ; au-delà, cotisations sur la part qui dépasse (≈ 21 %).

**Travailler tout de suite** (CDI, salaire net, employeur fictif) : vente 1 480 € · restauration 1 450 € + pourboires · logistique 1 520 € · aide-soignant·e 1 600 € · agent immobilier 1 300 € + commissions (suivent le marché) · banque 1 650 € (prêt immo à taux réduit).

**Créer sa boîte** : e-commerce (mise 3 000 €, risque élevé) · food truck (25 000 €) · startup tech (5 000 €, tout ou rien, levée possible) · rénovation (15 000 €, solide) · agence de com (2 000 €, dépend du réseau) · coach sportif (1 000 €, petit mais sûr). Financement : épargne + **prêt d'honneur à 0 %** + love money des parents + prêt bancaire.

---

## 5. Les profils et leur espace Carrière

L'onglet 💼 **Carrière change complètement selon le profil**. On peut changer de profil en cours de partie (passerelles).

| Profil | Espace Carrière |
|---|---|
| 🎓 **Étudiant·e** | École, année, frais, financement, partiels (réussite selon les choix), stage d'été, date du diplôme, débouché |
| 🔧 **Apprenti·e** | Fiche contrat (employeur, rythme 3 sem./1 sem., % du SMIC brut et net, année), diplôme visé, proposition d'embauche à la sortie |
| 💼 **Salarié·e du privé** | **Fiche de paie** (brut, cotisations, net, impôt à la source) · **entretien annuel** (« Demander une augmentation » : chances affichées et expliquées : ancienneté, réputation, santé de l'entreprise, humeur ; une fois par an ; refus possible) · promotion · **PEE avec abondement** · intéressement · démission / rupture conventionnelle |
| 🏥 **Fonctionnaire** (infirmier·e au CHU…) | Grille d'échelons, avancement automatique tous les 2-3 ans, **pas de négociation**, emploi garanti, primes de nuit/garde en dilemmes |
| 💻 **Indépendant·e** (dev, coach, artisan) | Chiffre d'affaires, taux journalier, cotisations URSSAF (≈ 22-25 % en micro), clients (dilemmes), trous d'activité |
| 🚀 **Chef·fe d'entreprise** | Voir §8 (compte de résultat, trésorerie, **salaire ou dividendes**, embauches, valorisation, revente) |
| 📉 **Sans emploi** | Chômage (ARE ≈ 57 % du salaire de référence, durée limitée), recherche (dilemmes), reconversion |
| 🏖️ **Retraité·e** | Pension, rente des placements, transmission (fin de partie, voir §13) |

**Accessible à tous** : 🤝 **Participations** (§8.3) et la **réputation pro** (0 à 100, visible dans Carrière ; monte avec les formations, les pots de départ, le costume ; pèse sur augmentations, promotions, embauche).

**Passerelles** : salarié → boîte (rupture conventionnelle ; l'expérience du métier réduit le risque) ; boîte → salarié (revente) ; reprise d'études ; licenciement → chômage → retour à l'emploi.

---

## 6. Économie et budget

### 6.1 Inflation (bloquant : c'est le défaut n° 1 du prototype)
- Inflation annuelle ≈ 2 % (tirée autour de 2 %, chocs possibles). **Loyers, courses, transports, prix des biens et du Shopping sont indexés.** Les salaires suivent l'inflation + la carrière.
- Livret A **indexé** (1,5 % au 1er février 2026, puis il suit l'inflation et les taux ; plafond 22 950 €).

### 6.2 Onglet Budget (lisible en 5 secondes)
- **Une barre « Où vont tes 100 € »** en haut (logement, vie courante, crédits, impôts, épargne).
- Quatre blocs : **Revenus du travail** · **Revenus du patrimoine** (loyers nets, dividendes) · **Charges fixes** · **Crédits**. Chaque ligne dit d'où elle vient (petit texte gris).
- Bloc **« Investi cette année »**, mis à jour en direct à chaque placement, achat immo ou versement PEE.
- Le **reste du mois** est aussi dans l'en-tête permanent.
- **Pas de ligne « sorties »** : la vie sociale passe par les dilemmes (apéro ou pot de départ, anniversaire ou rendu…).
- Coût d'un enfant : **une seule ligne** (≈ 200 €/mois, indexée) ; pas de double comptage avec les courses.
- Impôt sur le revenu : barème progressif simplifié par part (couple marié/pacsé = 2 parts, + 0,5 par enfant), prélevé à la source.

---

## 7. Placements

### 7.1 Enveloppes (onglet Placer, bien séparées)

| Enveloppe | Supports | Fiscalité 2026 |
|---|---|---|
| 🐷 **Livret A** | — | Exonéré · 1,5 % (fév. 2026) · plafond 22 950 € |
| 🇫🇷 **PEA** (5-6 choix) | ETF CAC 40, ETF Monde éligible PEA, Maison Vendôme (luxe), Aéro Atlantique, Banque Rhodanienne, Sanoris (pharma) | Avant 5 ans : 31,4 % sur les gains. Après : **prélèvements sociaux 18,6 %** seulement. Plafond de versements 150 000 € |
| 🌍 **Compte-titres** (6-7 choix) | ETF Monde, S&P 500, Nasdaq 100, émergents, Neuronia (IA, tout ou rien), or, obligations d'État | **Flat tax 31,4 %** (12,8 % + PS 18,6 %) sur les plus-values et dividendes |
| 🛡️ **Assurance vie** (2-3 choix) | Fonds euros (capital garanti), UC ETF Monde, UC SCPI | Avant 8 ans : 30 % (PS 17,2 %). Après 8 ans : abattement 4 600 € (9 200 € en couple) puis 7,5 % + 17,2 % |
| 🏢 **PEE** (salariés) | Fonds de l'entreprise, fonds diversifié | Abondement de l'employeur (bonus), bloqué 5 ans, gains soumis aux PS |

- Chaque enveloppe s'**ouvre** à une date (compteur fiscal visible : « fiscalité allégée dans 3 ans »).
- La vente affiche **avant validation** : plus-value réalisée, impôt, net récupéré.
- Prix de revient suivi par ligne (`{v, b}`), comme en v3.

### 7.2 Risque visible
- Chaque support affiche son **indicateur de risque de 1 à 7** (comme le DIC officiel) : fonds euros 1, obligations 2, SCPI 3, ETF Monde 4, actions isolées 5-6, Neuronia 7.
- Et une **perte possible en euros** sur la mise choisie : « Une mauvaise année : −2 400 € ».

### 7.3 Curseurs de montant (retour de Flo : « ils commencent trop haut »)
- Curseur **progressif** (échelle non linéaire : fin au début, large à la fin) qui part de 0.
- **Boutons rapides** sous le curseur : 100 € · 500 € · 1 000 € · 10 % · 25 % · Max.
- Étiquette de prudence par rapport au patrimoine : Prudent / Mesuré / Concentré / Tout risquer.

### 7.4 Marchés
- Un facteur marché par an (moyenne ≈ 7 %, volatilité ≈ 15 %, krach ≈ 1 an sur 8) ; chaque support = rendement propre + bêta × marché + bruit (paramètres du prototype, `ASSETS`).
- Or et obligations amortissent les krachs. Les rendements de l'an dernier sont affichés sur chaque ligne.

---

## 8. Société, dividendes et participations

### 8.1 Espace « Ma société » (chef·fe d'entreprise)
- **Compte de résultat simplifié** de l'année : chiffre d'affaires, charges, salaires, résultat avant impôt, **impôt sur les sociétés** (15 % jusqu'à 42 500 € de bénéfice, 25 % au-delà), résultat net.
- **Trésorerie** et **valorisation** (multiple du résultat selon le secteur).
- **Ta rémunération : salaire ou dividendes ?** Curseur de répartition :
  - salaire : charges sociales ≈ 80 % du net en plus pour la société, ouvre des droits (retraite, chômage nul en SASU) ;
  - dividendes : versés sur le résultat net après IS, taxés à **31,4 %** (flat tax), pas de droits.
  - Afficher clairement ce qui arrive sur ton compte perso dans chaque cas.
- Décisions : embaucher, signer un contrat, investir, lever des fonds (tech), revendre.
- **Faillite** : la boîte ferme, on peut **rebondir** (chômage, nouvelle création plus tard avec l'expérience).

### 8.2 Salariés : voir une société de l'intérieur
- **PEE et intéressement** (§7.1), actionnariat salarié occasionnel en dilemme.

### 8.3 Participations (tous profils)
- Acheter des **parts dans la boîte d'un ami** (dilemme) ou en **financement participatif** : mise au curseur, dossier en cours sur 3-7 ans (rachat ×2 à ×10, ou perte totale), avec des nouvelles intermédiaires.

---

## 9. Immobilier

### 9.1 Deux sections bien séparées
- **Je possède** : chaque bien avec valeur estimée, capital restant dû, plus-value latente, mensualité, loyer (ou loyer économisé), **cash-flow mensuel**, depuis quand, bouton Vendre (frais d'agence 5 %, impôt sur la plus-value avec abattements par durée, résidence principale exonérée).
- **Je peux acquérir** : 7+ annonces (type, ville, m², prix, prix/m², **DPE**, loyer estimé, rendement brut, apport nécessaire, mensualité, cash-flow si loué), prix indexés.

### 9.2 Étude du dossier de crédit (à reprendre de la v3, en plus riche)
C'est un écran complet, avec du texte explicatif comme sur le site actuel :
- **Apport réglable** (boutons et curseur), du minimum (10 % + frais de notaire 7,5 %) jusqu'au comptant. Le dossier dit **d'où vient l'argent** : compte courant, puis Livret A, puis assurance vie (rachat partiel avec son impôt).
- **Durée** 15 / 20 / 25 ans, avec le taux de chaque durée, la mensualité et le **coût total** (capital, intérêts, **assurance emprunteur**, frais de garantie, total remboursé).
- **Usage** : résidence principale, location nue, location meublée (LMNP), chacun avec sa fiscalité.
- **PTZ** quand le joueur y a droit (premier achat de résidence principale, selon revenus).
- **Taux d'endettement en direct**, règle des 35 % expliquée, et **solutions proposées** quand ça bloque (« Avec 25 ans, ton taux tombe à 33 % », « Il te faut 8 000 € d'apport de plus »).
- **Réponse de la banque rédigée** (accord ou refus motivé), puis « Maintenir pour signer chez le notaire ».
- Le salarié de la banque a un taux réduit ; l'étudiant sans revenus est refusé.

---

## 10. Événements et dossiers en cours

### 10.1 Décisions
- Format **versus** (deux cartes, emoji, titre court, effets en étiquettes) ou **pari au curseur**.
- **Au moins 60 événements**, filtrés par profil, âge, situation, et jamais deux fois en 5 ans. Catégories : vie sociale, amour, famille, travail, études, entreprise, marchés, immobilier, tuiles, opportunités.
- La vie sociale remplace les dépenses de sorties (exemple de Flo : « apéro avec les potes ou pot de départ de ton chef »).
- **Couple cohérent avec le sexe du joueur, comme Flo l'a demandé** : partenaire du sexe opposé, demande en mariage, enfants. Les textes s'accordent au genre partout (`·e` résolu).

### 10.2 Dossiers en cours (retour de Flo : « il faut une suite aux dilemmes »)
- Toute décision au résultat incertain crée un **dossier** : `{titre, ouvert, échéance, enjeux, probabilités, étapes}`.
- Visible dans l'Accueil (« ⚖️ Mise en demeure de ton client · verdict en 2028 ») et dans le récap.
- Il se **dénoue dans la Une** de l'année d'échéance, parfois en plusieurs étapes (« Le client a fait appel… »), avec l'effet chiffré.
- Exemples : mise en demeure (7 chances sur 10, 1 à 2 ans), prêt à Karim, parts dans la startup du cousin, jeton numérique, procès prud'hommes, travaux d'un bien, dossier de PTZ.
- **Chaînes d'événements** : Karim revient avec sa boîte et propose des parts, les parents vieillissent (aide, EHPAD, héritage), un ex-collègue te recrute…

---

## 11. Vie perso et shopping

- **Humeur** (0-100) : sous 30, risque de burn-out (arrêt, coût) et de rupture ; au-dessus de 70, bonus aux entretiens. Elle compte dans le score final.
- **Couple** (0-100, s'use avec le temps, monte avec les choix) : rupture sous 15 (partage et frais si marié·e). Mariage via la bague du Shopping. Enfants (un seul coût, indexé).
- **Énergie : en pause** (retirée pour l'instant).
- **Centre commercial** (onglet Shopping) : rayons Mode, Maison, Tech, Voyages, Véhicules, Bien-être, chaque objet avec son effet (humeur, couple, réputation) et ses frais mensuels éventuels.
- **Casino** : roulette (18/37, la maison garde 2,7 %) et machine à sous (retour moyen 84 %), **probabilités affichées**, bilan casino de l'année visible.

---

## 12. Récap avant validation et bilan

### 12.1 Récap avant de clôturer (feuille)
Trois blocs **séparés, jamais mélangés** :
1. 💼 **Vie pro** : salaire (augmentation obtenue ?), ou résultat de la société et ta rémunération (salaire ou dividendes), ou études.
2. 🏛️ **Patrimoine** : compte, Livret A, PEA, CTO, AV, PEE, immobilier (valeur, crédit), dettes, **total** ; « investi cette année », « retiré », impôts payés sur les ventes.
3. ❤️ **Vie perso** : la décision de l'année, couple, enfants, achats, casino.
Puis **« D'ici le 31 décembre »** (revenus et dépenses sur 12 mois, épargne attendue) et les **dossiers en cours**. Bouton « Maintenir pour clôturer ».

### 12.2 Bilan animé
Grand chiffre de variation (billets verts ou flèche rouge), puis les mêmes trois blocs avec les variations réelles, les nouvelles (krach, diplôme, verdicts de dossiers), les succès, la montée de niveau.

---

## 13. Fin de partie, profil, astuces

- **Retraite** : âge légal **en paramètre** (64 ans par défaut). **Vérifie les règles en vigueur avant de coder** : la réforme a été suspendue fin 2025, puis l'âge a de nouveau été décalé en septembre 2026. Pension ≈ 50-60 % du dernier salaire (simplifié). Écran final : rang (🥉 à 👑), patrimoine, bien-être moyen, succès, record, **classement entre amis** (reprendre le classement de la v3).
- **Profil** : identité, niveau et XP (8 titres), répartition du patrimoine, courbe, meilleure et pire année, succès (silhouettes « ??? »), **journal façon terminal**, code secret (Konami au clavier, 7 touchers sur l'avatar).
- **Bulle rouge « ! »** sur chaque onglet : 2-3 conseils justes et contextuels (jamais de promesse de rendement ; l'or « protège en crise mais a fait moins bien que les actions sur le long terme »).

---

## 14. Équilibrage (cibles à mesurer avec `npm run balance:s4`)

| Mesure (500 parties par profil, joueur « raisonnable ») | Cible |
|---|---|
| Patrimoine médian à la retraite, salarié moyen, en euros de 2026 | 300 000 à 700 000 € |
| Écart entre profils (médiane) | aucun profil > 1,6 × un autre |
| Chef d'entreprise | médiane proche, variance forte, faillite 30 à 50 % sur la carrière |
| Joueur qui ne place rien | nettement plus pauvre (< 0,5 × le raisonnable) |
| Casino | espérance négative mesurée |
| Millionnaire (en euros de 2026) | 5 à 15 % des parties raisonnables |
| Aucun NaN, aucune valeur négative interdite, sauvegarde aller-retour identique | 100 % |

---

## 15. Plan de livraison (un commit et un résumé par étape)

1. **Socle** : structure `saison4/`, build, tests, moteur (état, budget avec inflation, marchés, année), création du personnage, en-tête, Accueil, Budget, récap et bilan. Mobile vérifié.
2. **Carrière et société** : espaces par profil (étudiant, apprenti, salarié avec fiche de paie et entretien, fonctionnaire, indépendant, chef d'entreprise avec salaire/dividendes, chômage), participations, PEE.
3. **Patrimoine** : Placer (enveloppes, risque 1-7, curseurs progressifs, fiscalité à la vente), Immobilier (deux sections, **étude de dossier de crédit complète**), Shopping et casino.
4. **Vie et finition** : 60+ événements, dossiers en cours et chaînes, retraite et fin de partie, profil, astuces, classement, équilibrage, passe mobile finale.

À chaque étape : `npm run build:s4 && npm run test:s4`, e2e mobile + desktop, **regarder les captures**, comparer au prototype, corriger, commit en français, push, résumé court pour Flo (ce qui marche, ce qu'il doit tester, les écarts restants).
