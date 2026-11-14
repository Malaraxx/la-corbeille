# La Corbeille · Saison 4 · Cahier des charges **v3 : la gestion d'entreprise**

> Version 3, rédigée le 13 novembre 2026 après les retours de Flo (« je veux une gestion d'entreprise », « pas de plafond comme la photo »).
> **Elle remplace la v2** (`CAHIER_DES_CHARGES_SAISON4_V2.md`) partout où les deux diffèrent. Ce que la v3 ne mentionne pas reste valable dans la v2, puis dans la v1 :
> - interactions (v2 §1) ;
> - faillite et rebond (v2 §5) ;
> - vie perso et patrimoine (v2 §6) ;
> - fin de partie (v2 §7) ;
> - direction artistique, enveloppes, fiscalité, étude de dossier de crédit et mobile (v1).
>
> Le socle déjà livré et l'étape 0 (commit `7d4d247`) sont **conservés**.
> Les chiffres marqués **(à vérifier)** doivent être confirmés sur une source officielle ou professionnelle avant d'être codés, avec la source en commentaire. Ne jamais inventer un taux.

---

## 0. Le changement de cap en 7 lignes

1. **Le cœur du jeu, c'est gérer sa boîte.** La vie perso et le patrimoine tournent autour, à l'année.
2. **L'entreprise se joue au trimestre** : 4 tours de décisions par an, puis une clôture annuelle (vie perso, placements, dilemmes, récap).
3. **Plus aucun chiffre fixé d'avance** : ni croissance, ni marge, ni valorisation par « palier ». Le moteur **calcule** tout à partir des décisions et du marché.
4. **Pas de plafond**, mais des **rendements décroissants** et une **complexité qui monte** : un marché local finit par saturer, plus de salariés demande des cadres, plus de chiffre d'affaires immobilise plus de trésorerie.
5. **4 secteurs, profonds et très différents** :
   - 🛍️ Marque et commerce, le stratège ;
   - 🍽️ Restauration, l'accessible ;
   - 🏗️ BTP, le tendu ;
   - 💻 Logiciel SaaS, le risqué.
6. **Les études disparaissent**, sauf un **tutoriel court** (§2).
7. **Chaque résultat est expliqué** : un écran « Pourquoi ? » décompose ce qui a fait monter ou baisser les ventes, la marge et la trésorerie. C'est ce qui rend la gestion lisible et le jeu juste.

---

## 1. La partie

### 1.1 Durée : 3 formats au choix à la création
| Format | Période | Trimestres joués | Durée visée |
|---|---|---|---|
| ⚡ Rapide | 10 ans | 40 | ≈ 30 min |
| 🎯 Standard (défaut) | 20 ans | 80 | ≈ 1 h, en plusieurs sessions |
| 🏛️ Carrière | jusqu'à 64 ans | ≈ 160 | longue, avec cession ou transmission à la fin |

- **Sauvegarde automatique** à chaque trimestre.
- « Passer des années » (v2 §1) reste disponible : −5 d'humeur et −5 de couple par an. La boîte tourne alors avec les derniers réglages et le **pilote automatique** (§4.5).

### 1.2 Départ
- **Janvier 2026, 22 ans, France.** On choisit : homme ou femme, pseudo, ville (`CITIES` actuel, plus Toulouse et Nantes), secteur, puis le nom de l'entreprise.
- **Un profil de départ** remplace la filière d'études. C'est un petit bonus, jamais un plafond :
  - **École de commerce** : +10 % d'efficacité marketing la première année, prêt étudiant de 15 000 € à rembourser ;
  - **Alternance ou apprentissage** : pas de dette, compétence technique (+ qualité en BTP et en restauration) ;
  - **École d'ingénieurs ou informatique** : coût de développement −15 % en SaaS ;
  - **Autodidacte** : rien en plus, 3 000 € d'épargne en plus.
- **Apport de départ réaliste** : épargne (2 000 à 8 000 €), prêt d'honneur (0 %, à vérifier : Initiative France ou Réseau Entreprendre), prêt bancaire (via l'étude de dossier de la v1), love money d'amis (**jamais les parents**, v2).

---

## 2. Le tutoriel : 1 an, obligatoire à la première partie

- Il couvre **la dernière année d'études, en stage dans une PME du secteur choisi**, découpée en 4 trimestres guidés par **Sophie, la mentore**.
  - **T1 : le budget perso.** Loyer, courses, reste à vivre.
  - **T2 : lire un compte de résultat.** Sophie montre celui de la PME du stage : CA, marge, charges, résultat.
  - **T3 : la trésorerie.** Pourquoi une boîte rentable peut mourir faute de cash : délais clients, stocks.
  - **T4 : préparer sa création.** Statut juridique (v2 §3.2), financement, business plan simplifié avec un prévisionnel que le jeu comparera plus tard au réel.
- **Passable** dès la deuxième partie (« Je connais, je crée directement »).
- Le joueur touche une gratification de stage réaliste (**à vérifier**, minimum légal : 15 % du plafond horaire de la Sécurité sociale) et met de côté pour son apport.

---

## 3. La boucle trimestrielle

### 3.1 Un trimestre en 3 écrans
1. **Le tableau de bord**, onglet 🏢 Entreprise :
   - 6 chiffres clés : CA du trimestre, marge brute, résultat, **trésorerie**, **mois de trésorerie restants**, note client ou notoriété ;
   - une courbe sur 8 trimestres ;
   - les alertes : rupture, impayé, trésorerie basse, concurrent agressif.
2. **Les décisions** :
   - les curseurs et les choix **préremplis avec les réglages du trimestre précédent** ;
   - un bouton « **Garder mes réglages** » : un seul appui, et le trimestre part ;
   - un **prévisionnel en direct** sous les curseurs (« CA estimé 41 000 à 48 000 € ») : une fourchette, jamais une valeur exacte, car la demande a une part d'aléa.
3. **Le résultat**, animé :
   - billets verts ou flèche rouge, comme la v1 ;
   - puis le bouton **« Pourquoi ? »**, la cascade expliquée en français, par exemple :
     - « Ton prix est 12 % au-dessus du marché : −15 % de demande » ;
     - « Ta campagne Instagram a fait +8 % de notoriété » ;
     - « Rupture de stock en mars : 2 300 € de ventes perdues » ;
     - « Un client a payé avec 45 jours de retard : −6 000 € de trésorerie ce trimestre, rattrapé au suivant ».

### 3.2 Les événements
- **0 à 1 événement d'entreprise par trimestre**, présentés en dilemmes versus comme la v1 : un client veut une remise contre un volume, un salarié clé démissionne, un fournisseur augmente ses prix, un contrôle URSSAF, un article de presse.
- Ils suivent les mêmes règles que les dilemmes de la v2 : étiquetés par secteur et par taille, jamais deux fois le même en 5 ans, en chaînes sur plusieurs trimestres.

### 3.3 La clôture annuelle (après le T4)
1. **Les comptes annuels** : compte de résultat et bilan simplifiés, IS (15 % jusqu'à 42 500 €, 25 % au-delà).
2. **La décision « Que fais-tu du résultat ? »** :
   - réinvestir ;
   - verser un **dividende** (PFU 31,4 %) ;
   - se verser une **prime ou un salaire plus élevé** (charges sociales selon le statut).
   Un curseur montre en direct ce qui arrive dans ta poche et ce qui reste dans la boîte.
3. **La vie perso** (comme aujourd'hui) : budget, placements (PEA, CTO, AV), immobilier, dilemmes de vie, récap en blocs séparés **perso** et **pro**.

---

## 4. Le moteur générique (commun aux 4 secteurs)

Tout passe par `rnd()` : aucun `Math.random` dans le moteur. Tout mouvement d'argent passe par `cash()` côté perso et par un **nouveau `bizCash(montant, catégorie)`** côté entreprise, avec l'invariant `BIZ.cash = Σ BIZ.flow`. La trésorerie de la société et l'argent perso sont **strictement séparés** : seuls le salaire, les dividendes, l'apport en compte courant et la caution personnelle font passer de l'argent de l'un à l'autre.

### 4.1 La demande
Pour chaque **zone** ouverte *z* et chaque **offre** *o* (produit, menu, type de chantier, plan d'abonnement) :

```
Demande(z,o) = Marché(z,o) × Saison(trimestre) × Conjoncture
             × PartDeMarché(z,o)
PartDeMarché = Attractivité / (Attractivité + Concurrence(z))
Attractivité = (Prix / PrixMarché)^(−ε) × Qualité^α × (1 + Notoriété(z)) × Adéquation(positionnement, zone)
```

- `ε` : l'**élasticité au prix**, propre au secteur et au positionnement. Le premium est peu sensible au prix, l'entrée de gamme très sensible.
- `Marché(z,o)` est fini : c'est la source des **rendements décroissants**. Une fois une zone captée, la croissance doit venir d'une **nouvelle zone**, d'une **nouvelle offre** ou d'un **rachat**.
- `Concurrence(z)` **réagit** :
  - si ta marge est forte et ta part grandit, un nouvel entrant arrive (événement annoncé un trimestre à l'avance) ;
  - si tu casses les prix, les concurrents suivent partiellement, ce qui peut déclencher une guerre des prix.
- `Conjoncture` : un cycle économique lent (bon, normal, crise), partagé avec la Bourse du jeu pour garder la cohérence.

### 4.2 Les ventes, la marge et le résultat
```
Ventes      = min(Demande, Capacité, Stock disponible)
CA          = Σ Ventes × Prix (moins remises et commissions des canaux)
CoûtsVar    = Σ Ventes × (CoûtUnitaire + Transport(z) + Douane(z))
MargeBrute  = CA − CoûtsVar
ChargesFixes= loyers + salaires chargés + assurances + logiciels + comptable + amortissements
EBE         = MargeBrute − ChargesFixes − Marketing
Résultat    = EBE − intérêts − IS
```
- **Demande > capacité** : des ventes perdues (affichées) et une baisse de la satisfaction (attente, délais).
- **Capacité >> demande** : des charges fixes qui tournent à vide (affiché aussi : « ton équipe est occupée à 54 % »).

### 4.3 La notoriété et la qualité (des « stocks » qui se construisent)
```
Notoriété(t+1) = Notoriété(t) × (1 − 0,15) + k × √(BudgetPromo(z) / Marché(z))
Qualité        = f(coût unitaire choisi, compétences de l'équipe, R&D ou formation, incidents)
```
- **Racine carrée** : doubler la promo ne double pas l'effet. Il n'y a pas de stratégie « tout en promo » gagnante.
- La notoriété **s'use** de 15 % par trimestre sans entretien.
- **Les canaux de promotion** n'ont pas le même effet selon le secteur et la cible :
  - réseaux sociaux : rapides, s'usent vite ;
  - influence : pic de court terme ;
  - salons professionnels : B2B, lents mais durables ;
  - référencement : lent, très durable ;
  - prospection commerciale : B2B, demande un salarié ;
  - presse locale.

### 4.4 La trésorerie (le cœur de la tension)
- **Délais clients** : comptant (particuliers, restaurant), 30 à 60 jours (B2B), retards possibles. Le délai légal est de **60 jours maximum** (à vérifier, loi LME).
- **Délais fournisseurs** : 0 à 60 jours selon la négociation et l'ancienneté.
- **Stocks** : l'argent dort dans les cartons. Un invendu au-delà de 4 trimestres est décoté.
- **BFR affiché en clair** : « Ton activité immobilise 38 000 € : 22 000 € de stocks + 31 000 € de clients − 15 000 € de fournisseurs ».
- **Outils de financement de l'entreprise** (chacun avec un vrai coût et une vraie condition) :
  - découvert autorisé ;
  - prêt bancaire professionnel : étude de dossier comme la v1 (bilan, EBE, endettement), **caution personnelle** souvent demandée ;
  - prêt garanti, avec une part prise en charge par Bpifrance (**à vérifier**) ;
  - affacturage : cash immédiat contre 1 à 3 % des factures (**à vérifier**) ;
  - apport en **compte courant d'associé** (argent perso) ;
  - **levée de fonds** (surtout en SaaS, §5.4) : dilution calculée, pas de prix fixe ;
  - crédit-bail sur les machines, les véhicules et le matériel.

### 4.5 L'équipe et la complexité
- **Les embauches se font par rôle**, avec des **salaires réalistes chargés** (à vérifier à partir des grilles et des conventions) : employé·e, technicien·ne, commercial·e, chef·fe d'équipe, cadre (DAF, directeur·rice des opérations, CTO…).
- **La complexité** : au-delà de ≈ 8 personnes sans manager, puis de ≈ 25 sans cadre de direction, la productivité baisse et les erreurs augmentent. Grandir **impose** de structurer, ce qui coûte cher. C'est le frein naturel qui remplace les plafonds.
- **Le temps du dirigeant** : un curseur répartit le temps entre **commercial**, **production** et **gestion**. Avec le temps, il faut déléguer.
- **Le pilote automatique** (utilisé quand on passe des années) : il garde les prix, réajuste les stocks sur la demande passée et ne prend aucun risque. Il est **moins bon** qu'un joueur actif : c'est voulu.

### 4.6 La stratégie commerciale (demande de Flo, commune à tous)
Le joueur règle, au trimestre :
1. **Le positionnement** : entrée de gamme, milieu de gamme ou premium. Changer est possible mais coûte de la notoriété, car on brouille son image.
2. **Le coût unitaire** : le fournisseur ou la qualité des matières. Moins cher veut dire moins de qualité et plus de retours ou de réclamations.
3. **Le prix de vente** : un curseur avec le prix du marché en repère, et la marge unitaire affichée en direct.
4. **Les zones de vente** : Ville → Région → France → Europe → International (selon le secteur). Chaque zone a :
   - une **taille de marché** ;
   - un **prix de marché** ;
   - une **concurrence** ;
   - un **coût de transport ou de déplacement** ;
   - un **coût d'entrée** unique (dépôt, commercial local, traduction, normes) ;
   - des **droits de douane** éventuels.
   Une zone peut **mieux payer** (prix de marché plus élevé) et coûter plus cher à servir : c'est ce que voulait Flo.
5. **Le budget de promotion**, réparti par zone et par canal.
6. **Les canaux de vente** (commerce et SaaS), chacun avec ses commissions et ses marges :
   - en direct : boutique, site ;
   - marketplaces : commission ;
   - revendeurs : ils prennent une marge, mais ouvrent du volume.

### 4.7 La valorisation (calculée, jamais fixée)
```
Valeur = EBE retraité × Multiple + Trésorerie nette − Dette
Multiple = Base(secteur) × f(croissance sur 3 ans) × f(récurrence du CA) × f(marge)
         × f(dépendance au dirigeant) × f(concentration clients) × Conjoncture
```
- La **base** par secteur est un repère de marché, pas un plafond (**à vérifier**, transactions de PME françaises).
- Le détail du multiple est affiché : « ×1,3 car ta croissance est forte, ×0,8 car tu fais 60 % du CA avec un seul client ».
- Pour le SaaS, on utilise un **multiple de l'ARR** en fonction de la croissance et du churn (§5.4).
- La valorisation sert pour la cession, une levée de fonds, une entrée au capital d'un associé et le score final.

---

## 5. Les 4 secteurs

Chaque secteur a **ses paramètres** (élasticité, saisonnalité, délais clients, coûts) et **une mécanique bien à lui**.

### 5.1 🛍️ Marque et commerce (« le stratège »)
- **Le produit de départ** : 2 ou 3 idées proposées (vêtements, cosmétiques, accessoires, lunettes, café, objets de déco…), puis des **lancements de nouveaux produits** au fil du jeu.
- **Les fournisseurs** : France, Europe ou Asie. Chacun a :
  - un coût unitaire ;
  - un **minimum de commande** ;
  - un **délai de livraison** : 1 trimestre pour l'Asie, la commande se décide donc à l'avance ;
  - une qualité ;
  - un risque de retard.
- **La mécanique propre, le stock** : on commande avant de connaître la demande.
  - Trop commander, c'est de la trésorerie qui dort et des soldes forcés.
  - Pas assez, c'est une rupture : ventes perdues et image abîmée.
- **Les canaux** : site e-commerce, boutique (un bail, donc un loyer), marketplaces (commission, **à vérifier**), revendeurs et grossistes (on leur vend environ 50 % sous le prix public).
- **Les zones** : Ville, Région, France, Europe (TVA et logistique), International (douane). Les transports se paient par unité et par zone.
- **La saisonnalité** : forte au T4 (fêtes) et en soldes.
- **Grandir** : gamme élargie, boutiques en propre, export, rachat d'une marque concurrente, licence.

### 5.2 🍽️ Restauration (« l'accessible »)
- **Le concept** : snack, bistrot ou bistronomique. Il fixe le ticket moyen de marché, le nombre de couverts et la qualité attendue.
- **L'emplacement**, la décision clé : passage, centre-ville ou quartier. Un **loyer élevé avec un fort passage** s'oppose à un **loyer faible avec peu de passage**. On reprend un fonds de commerce ou on part de zéro.
- **La mécanique propre, la capacité et les avis** :
  - `Couverts max = places × rotations × jours d'ouverture` ;
  - un service saturé fait baisser la note ;
  - la **note client** (sur 5) vient de la qualité, du service et de l'attente, et pilote la demande avec du retard.
- **Les leviers** :
  - les prix de la carte ;
  - le **coût matière** (en % du prix, **à vérifier**, repère du métier : 25 à 35 %) ;
  - les jours et les horaires d'ouverture ;
  - l'équipe : cuisine et salle ;
  - la terrasse (saison) ;
  - la livraison par plateforme (commission, **à vérifier**) ;
  - les événements.
- **La saisonnalité** : terrasse l'été, et des creux selon la ville (vacances).
- **Grandir** : 2e restaurant (le chef-gérant devient indispensable), petite chaîne, **franchise** (droit d'entrée et redevance en % du CA, **à vérifier**), cuisine centrale.

### 5.3 🏗️ BTP (« le tendu »)
- **Le métier de départ** : plombier-chauffagiste, électricien, menuisier ou maçon. On élargit ensuite à la rénovation tous corps d'état, puis à l'entreprise générale.
- **La mécanique propre, les appels d'offres** : chaque trimestre, 3 à 6 chantiers sont proposés, chacun avec :
  - un client : particulier, copropriété, PME ou **marché public** ;
  - un montant estimé et une durée ;
  - des **aléas cachés** : le coût réel varie autour de l'estimation.

  Le joueur fixe **son prix**. La probabilité de gagner dépend de l'écart avec les concurrents et de sa réputation. **Trop cher, on perd le chantier ; trop bas, on le gagne à perte.**
- **Le chantier** dure plusieurs trimestres :
  - il est facturé par **situations de travaux** (avancement), avec un acompte possible ;
  - une **retenue de garantie de 5 %** est libérée un an après (**à vérifier**) ;
  - en marché public, le client paie lentement mais sûrement ; en privé, il y a un risque d'impayé.
- **Les aléas** : intempéries, retard de livraison des matériaux, malfaçon (reprise à tes frais), **pénalités de retard**, flambée du prix des matériaux.
- **Les leviers** :
  - les équipes : la capacité, c'est des heures ;
  - la sous-traitance : plus de capacité, moins de marge ;
  - les achats de matériaux : stock ou à la commande ;
  - le matériel : achat ou crédit-bail ;
  - l'**assurance décennale** (obligatoire, coût annuel) ;
  - les qualifications, comme le label RGE, qui ouvrent les chantiers aidés (**à vérifier**).
- **Grandir** : plus d'équipes, un conducteur de travaux, puis l'entreprise générale (on coordonne des sous-traitants) et le rachat d'un artisan qui part en retraite.

### 5.4 💻 Logiciel SaaS (« le risqué »)
- **Le produit** : 2 ou 3 idées (logiciel de gestion pour restaurants, outil RH pour PME, application pour artisans… des clins d'œil aux autres secteurs).
- **La mécanique propre, l'abonnement** :
  - `MRR = abonnés × prix mensuel` ;
  - chaque trimestre, de nouveaux abonnés arrivent selon le marketing, les commerciaux et la qualité ;
  - le **churn** (désabonnements) dépend de la qualité du produit, du support et du prix ;
  - un churn de 3 % par mois, c'est un tiers des clients perdus par an.
- **Le cash brûlé** :
  - les premiers trimestres sont en perte, c'est normal ;
  - la **runway** (le nombre de mois avant d'être à sec) est affichée en permanence ;
  - à zéro, c'est la faillite, ou une levée en catastrophe à un prix bas.
- **Les leviers** :
  - les plans et les prix : mensuel ou annuel (l'annuel rapporte du cash tout de suite) ;
  - le budget R&D : des développeurs, qui font monter la qualité et ouvrent des fonctionnalités ;
  - la **dette technique** : aller vite la fait monter, puis provoque des pannes qui augmentent le churn ;
  - le marketing et le coût d'acquisition (CAC) ;
  - l'équipe commerciale (B2B) ;
  - le support.
- **Les levées de fonds** : love money, business angels, seed, série A, série B.
  - La valorisation est **calculée** à partir de l'ARR, de la croissance et du churn.
  - Le joueur choisit le montant ; la **dilution** est affichée. Sous 50 %, il perd le contrôle : risque d'être remplacé comme dirigeant (événement).
  - Le jeu affiche la **règle des 40** (croissance + marge ≥ 40 %) comme repère pédagogique.
- **La fin possible** : rachat par un grand groupe (une offre arrive si l'ARR et la croissance sont bons) ou rentabilité et dividendes.
- **L'équilibrage voulu** : c'est le secteur à **la plus forte dispersion**. Beaucoup d'échecs, quelques très grosses réussites. Il est conseillé en « mode difficile » dans l'écran de choix.

---

## 6. La pédagogie intégrée

- **L'écran « Pourquoi ? »** (§3.1) à chaque trimestre : il est obligatoire, c'est la colonne vertébrale du jeu.
- **La bulle rouge « ! » de conseils** de la v1, rattachée à la situation, avec des conseils exacts et nuancés :
  - « Ton BFR grossit plus vite que ton CA : regarde tes délais clients » ;
  - « Une marge à 8 % en restauration, c'est fragile au moindre imprévu ».
- **Le prévisionnel du tutoriel comparé au réel** après 1 an : « Tu avais prévu 120 000 € de CA, tu as fait 84 000 € ».
- **Un glossaire** accessible d'un appui sur chaque terme : EBE, BFR, MRR, churn, situation de travaux…

---

## 7. Ce qui est supprimé ou modifié par rapport à la v2

- **Supprimé** :
  - les 7 filières d'études de 2 à 5 ans, les examens, le redoublement et les mentions ;
  - les secteurs santé, droit, sport et ingénieur ;
  - le **tableau des 4 paliers par secteur** avec une croissance, une marge et une valorisation fixes (v2 §4.5) ;
  - toute table de ce type.
- **Modifié** :
  - l'entreprise passe au trimestre ;
  - la valorisation est calculée (§4.7) ;
  - les rachats deviennent des **cibles générées** avec de vrais comptes, dont le prix est négocié et le financement choisi.
- **Gardé** :
  - faillite et rebond (v2 §5) : le rebond propose un **autre des 4 secteurs**, au même âge et dans la même chronologie ;
  - la holding, débloquée quand la société dépasse un **seuil de résultat** (et non plus un « palier ») ;
  - la cession et la transmission en fin de carrière ;
  - la startup du pote, dont le résultat tombe 2 à 3 ans plus tard ;
  - la vie perso, l'immobilier et l'étude de dossier.

---

## 8. Équilibrage : les cibles à mesurer avec des **bots de stratégie**

`balance:s4` doit faire jouer **des bots aux comportements différents**, 300 parties par secteur et par bot, au format Standard sur 20 ans :

| Bot | Comportement |
|---|---|
| `raisonnable` | prix proche du marché, promo modérée, stock ajusté, réinvestit 60 % |
| `agressif` | casse les prix, promo forte, s'endette pour grandir vite |
| `premium` | prix haut, qualité haute, petit volume |
| `radin` | aucune promo, coûts au minimum, tout en dividendes |
| `auto` | pilote automatique seul |
| `idiot` | réglages aléatoires (le plancher) |

| Mesure | Cible |
|---|---|
| Médiane `raisonnable` / médiane `idiot` | ≥ 3 × (**la gestion doit compter**) |
| Aucun bot simple ne domine partout | le meilleur bot change selon le secteur ou la conjoncture |
| `auto` / `raisonnable` | 0,5 à 0,8 × |
| Écart de médiane entre secteurs (`raisonnable`) | ≤ 1,5 × |
| Faillite au moins une fois (`raisonnable`) | 20 à 40 % ; SaaS 40 à 60 % |
| Faillite (`agressif`) | 50 à 75 % |
| Patrimoine médian à la fin, en euros de 2026 (`raisonnable`, Standard) | 250 000 à 700 000 € |
| Top 5 % SaaS | ≥ 5 × la médiane SaaS (forte dispersion voulue) |
| Pire partie | jamais sous −50 000 € réels (plafond de surendettement) |
| Pas de plafond | la meilleure partie sur 1 800 dépasse 10 M€ sans bug ni NaN |

`balance:s4` produit un tableau lisible et un fichier JSON. **Aucun réglage de paramètre n'est validé sans ce tableau.**

---

## 9. Plan de livraison pour Claude Code

On garde la règle actuelle : une étape = tests du moteur, parties complètes, e2e mobile et desktop, captures relues, commit, push, résumé court pour Flo.

- **A. Le moteur trimestriel générique.**
  - Trimestres, `BIZ` séparé du perso, `bizCash()`, demande (§4.1), ventes et marge (§4.2), notoriété (§4.3), trésorerie et BFR (§4.4), équipe et complexité (§4.5), valorisation (§4.7).
  - Les écrans : tableau de bord, décisions, résultat et « Pourquoi ? ».
  - Le premier secteur branché : **Commerce**.
  - Les bots de `balance:s4`.
- **B. La stratégie commerciale complète** (§4.6) : zones, transport, douane, canaux, promotion par canal, concurrence qui réagit.
- **C. Restauration** (§5.2).
- **D. BTP** (§5.3) : appels d'offres et chantiers sur plusieurs trimestres.
- **E. SaaS** (§5.4) : MRR, churn, runway, levées, dilution.
- **F. La finance d'entreprise** :
  - prêts pro avec étude de dossier, caution personnelle, affacturage, compte courant ;
  - rachats de cibles générées, holding, cession ;
  - branchement sur faillite et rebond (v2 §5).
- **G. Tutoriel, formats de partie, profil de départ, 3 formats de durée, clôture annuelle reliée à la vie perso.** Puis l'équilibrage final et la passe mobile.

---

## 10. Décisions par défaut (Flo peut les changer)

- **Une seule entreprise principale** à la fois. Les rachats deviennent des filiales ou des sites.
- **Format Standard sur 20 ans** par défaut.
- **Le tutoriel est obligatoire** à la première partie seulement.
- **Pas de retour au salariat**, sauf le CDD de transition après une faillite (v2 §10).
- **Le prévisionnel affiche une fourchette, jamais un chiffre exact** : le joueur ne doit pas pouvoir « résoudre » le jeu.
- **Tous les paramètres de secteur** (élasticités, coûts, délais, multiples) vivent dans **un seul objet `SECTORS`**, commenté, avec la source pour chaque chiffre réel. On ajoute un secteur plus tard en ajoutant une entrée et sa mécanique propre.
