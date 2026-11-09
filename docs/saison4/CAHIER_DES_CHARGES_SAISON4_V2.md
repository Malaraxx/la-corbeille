# La Corbeille · Saison 4 · Cahier des charges **v2 : le jeu d'entrepreneur**

> Version 2, rédigée le 9 novembre 2026 après le retour de Flo sur le prototype. **Elle remplace la v1** (`CAHIER_DES_CHARGES_SAISON4.md`) partout où les deux diffèrent. Tout ce que la v2 ne mentionne pas reste valable dans la v1 : direction artistique, enveloppes de placement, fiscalité, étude de dossier de crédit, mobile, récap en trois blocs.
> Le socle déjà livré (commit `702f3e2` : moteur, création, Accueil, Budget, récap, bilan) est **conservé et réorienté**, pas jeté.
> Les chiffres marqués **(à vérifier)** doivent être confirmés sur service-public.fr, l'URSSAF ou Bpifrance avant d'être codés, avec la source en commentaire.

---

## 0. Le changement de cap en 6 lignes

1. **La Corbeille devient un jeu de création et de gestion d'entreprise**, avec la vie perso et le patrimoine autour.
2. **Les études (2 à 5 ans) sont obligatoires et servent de tutoriel** : on y découvre le budget, l'épargne, la Bourse, les dilemmes.
3. **À la sortie des études, le joueur crée obligatoirement son entreprise.** Il n'y a plus de chemin « salarié à vie ».
4. **Chaque filière mène à son propre type d'entreprise**, qui peut grandir : du cabinet infirmier au groupe hospitalier, de l'artisan plombier à l'entreprise générale de bâtiment.
5. **La faillite n'est pas la fin** : on sauve sa boîte avec son épargne, ou on repart dans un autre domaine en gardant son âge et son histoire.
6. Réaliste et cohérent avant tout : **les parents ne paient pas**, les salaires et les charges sont crédibles, et on ne devient pas riche par hasard.

---

## 1. Interactions (change par rapport à la v1)

- **Un simple appui valide.** Le « maintenir pour valider » est supprimé partout.
- **Confirmation en deux temps uniquement pour les actions irréversibles** : une feuille « Tu es sûr·e ? » qui rappelle les conséquences chiffrées, puis « Confirmer ». Elle concerne :
  - vendre un bien immobilier ;
  - céder ou liquider sa société ;
  - licencier ;
  - déposer le bilan ;
  - investir plus de 50 % de son patrimoine d'un coup ;
  - signer un rachat d'entreprise ;
  - déménager.
- **Passer des années.** Le bouton « Passer 1 an » et un choix « Passer 2 / 3 / 5 ans » font tourner le jeu en automatique :
  - l'entreprise continue avec les réglages en cours ;
  - aucun placement, aucun dilemme ;
  - les crédits sont prélevés et le budget s'applique ;
  - **−5 d'humeur et −5 de couple par année passée** ;
  - un bilan unique résume toute la période.

  Impossible pendant les 2 premières années d'études (tutoriel) et quand un dossier urgent est ouvert (faillite, procès).

---

## 2. Les études : le tutoriel (2 à 5 ans, obligatoire)

### 2.1 Départ
- Janvier 2026, 20 ans, **France obligatoire**. Le joueur choisit **homme ou femme**, son **pseudo** et **sa ville** (Lille, Lyon, Paris, Bordeaux, Marseille, Toulouse, Nantes : loyers et marchés différents, reprendre `CITIES` et ajouter Toulouse et Nantes).
- Il choisit **sa filière** :

| Filière | Diplôme (fictif mais réaliste) | Durée | Frais/an | Entreprise à la sortie |
|---|---|---|---|---|
| 💼 Commerce | Bachelor (3 ans) ou Grande École (5 ans) | 3 ou 5 | 8 000 à 12 000 € | Négoce, e-commerce, agence, franchise |
| ⚙️ Ingénieur | École d'ingénieurs | 5 | 2 500 à 3 000 € (publique) | Bureau d'études, puis industrie |
| 🩺 Santé | Infirmier·e (IFSI, 3 ans) ou kinésithérapeute (5 ans) | 3 ou 5 | 170 € ou 2 000 à 8 000 € (kiné) | Cabinet libéral → centre de santé → clinique → groupe hospitalier |
| 🏃 Sport | STAPS + BPJEPS (licence) | 3 | 180 € | Coaching → salle de sport → chaîne de salles |
| ⚖️ Droit | Master + école d'avocats (CAPA) | 5 | 180 € + ≈ 2 000 € (école d'avocats) | Cabinet d'avocat → associés → cabinet d'affaires |
| 💻 Informatique | BUT (3 ans) ou Master (5 ans) | 3 ou 5 | 180 € à 300 € | Freelance → startup logicielle |
| 🔧 Artisanat BTP (alternance) | CAP/BP plombier, électricien, menuisier, maçon… | 2 ou 3 | 0 € (apprenti·e payé·e) | Artisan → entreprise générale de bâtiment |

### 2.2 Se loger et se financer (tout est combinable, avec cohérence)
- **Logement** : chez ses parents (pas de loyer, **participation de 80 à 150 € par mois** aux courses, humeur qui baisse chaque année passée chez eux après 22 ans), colocation ou studio. On peut **quitter ses parents à tout moment** (bouton dans Profil : choix colocation ou studio, frais d'emménagement et caution).
- **Financement, cumulable** :
  - **job étudiant** : curseur d'heures par semaine de 0 à 20 h. Il rapporte (au SMIC horaire net), mais **plus d'heures, c'est moins de réussite aux examens** et moins d'humeur ;
  - **prêt étudiant garanti par l'État** : jusqu'à 20 000 €, remboursement différé jusqu'après les études ;
  - **bourse CROUS** selon l'échelon (tiré au départ selon les revenus des parents, affiché) ;
  - **APL** si le joueur loue ;
  - **alternance (BTP)** : salaire d'apprenti selon la grille officielle (déjà dans le moteur).
- **Les parents ne versent rien.** Exceptions rares et toujours sous forme d'événement :
  - un **dilemme d'entraide**, où les parents aident une fois, une seule année, si le joueur les a lui-même aidés avant ;
  - un **billet à Noël** (150 à 500 €), utilisable **seulement pour investir** : il arrive directement sur le Livret A ou le PEA ;
  - une **donation pour la première résidence principale**, rare (≈ 10 % des parties), de 10 000 à 40 000 €. Elle reste exonérée de droits, puisque l'abattement est de 100 000 € par parent et par enfant.
- **Réussite aux examens** (chaque fin d'année) : elle dépend des heures de job, de l'humeur et des choix des dilemmes (réviser ou sortir). Un échec fait redoubler un an (frais, loyer, et le prêt continue de courir). La **mention** obtenue débloque de meilleures offres de création à la sortie (§3).

### 2.3 Le tutoriel, une notion par année
Un mentor (Sophie, l'analyste, déjà présente dans la v3) présente une mécanique par an, avec une bulle courte :
1. **1re année** : le budget du mois, le Livret A, la décision de l'année.
2. **2e année** : ouvrir un PEA et faire un premier placement (risque de 1 à 7, curseur, boutons rapides).
3. **3e année** : les dossiers en cours (un dilemme dont le résultat tombe plus tard) et la fiscalité d'une vente.
4. **4e année** : l'immobilier (une simulation de dossier de crédit, sans pouvoir acheter tant qu'on est étudiant).
5. **Dernière année** : le **business plan**. Le joueur prépare sa création : apport, prêt d'honneur, statut juridique.

Le joueur peut couper les bulles du tutoriel (« Je connais »).

---

## 3. Créer son entreprise (obligatoire à la sortie des études)

### 3.1 Le choix : 2 ou 3 offres maximum
À la fin des études, un écran « Ton projet » propose **2 ou 3 projets concrets**, liés à la filière et à la mention. Chaque projet a :
- **une ville** : celle où il vit, plus une ou deux autres où le marché est meilleur, avec le déménagement inclus ;
- **un nom** modifiable (🎲 pour un nom au hasard) ;
- les chiffres clés : mise de départ, chiffre d'affaires de la 1re année, marge, risque, potentiel.

Exemple en santé : « Cabinet infirmier à Lille-Fives (reprise de patientèle, 25 000 €) » ou « Cabinet en création à Arras (5 000 €, patientèle à bâtir) ».

### 3.2 Statut juridique (choix simple, expliqué)
| Statut | Pour qui | Règles du jeu |
|---|---|---|
| **Micro-entreprise** | Démarrage, petite activité | Cotisations sur le chiffre d'affaires (≈ 21 à 25 % selon l'activité, **à vérifier**), plafonds de chiffre d'affaires (**à vérifier 2026**), pas de déduction des charges |
| **EURL / SASU** | Activité qui grandit | Impôt sur les sociétés 15 % jusqu'à 42 500 € puis 25 %. Rémunération en salaire ou en dividendes (§4.4). En SASU : pas de chômage |
| **SAS avec associés** | Levée de fonds, rachat | Le joueur peut être dilué. Pacte d'associés en dilemme |

Le passage de micro-entreprise à société est proposé quand le chiffre d'affaires approche du plafond.

### 3.3 Financer la création (jamais par les parents)
- son **épargne** (Livret A, PEA, avec la fiscalité d'un retrait) ;
- un **prêt d'honneur à 0 %** (Initiative France ou Réseau Entreprendre ; montants **à vérifier**, ordre de grandeur 5 000 à 50 000 €) ;
- un **prêt bancaire professionnel** sur 5 à 7 ans, souvent garanti en partie par Bpifrance, **avec caution personnelle du dirigeant** (voir §5) ;
- plus tard : des **investisseurs** (startup, rachat).

---

## 4. Gérer son entreprise : la boucle centrale

### 4.1 Le tableau de bord (onglet 🏢 Mon entreprise, remplace Carrière)
Toujours visible, en haut : **chiffre d'affaires**, **marge**, **résultat**, **trésorerie** (avec une jauge d'alerte en mois de charges), **équipe**, **valorisation**.

En dessous, en blocs simples :
- **Compte de résultat** de l'année en cours (projection) et de l'an dernier : CA, achats, salaires et charges, loyer, autres charges, amortissements, résultat avant impôt, impôt sur les sociétés, résultat net.
- **Trésorerie** : solde, délais de paiement clients, échéances de prêt, découvert autorisé.
- **Équipe** : salarié·es (poste, salaire brut, coût total pour l'entreprise ≈ 1,45 × le brut), moral.
- **Clients** : satisfaction, carnet de commandes, dépendance au plus gros client.

### 4.2 Les leviers, en quelques appuis par an
1. **Prix** : baisser, garder ou augmenter. Ça joue sur le volume, la marge et la satisfaction.
2. **Équipe** : embaucher (junior ou senior, coût affiché), licencier (indemnités, moral, confirmation en deux temps), former.
3. **Investir** : matériel, local, marketing, digital ou R&D, chacun avec son coût et son effet attendu.
4. **Financer** : prêt bancaire, levée de fonds, affacturage, trésorerie placée.
5. **Se rémunérer** (§4.4).
6. **Grandir** (§4.5) : nouveau site, rachat, franchise.
7. **Sortir** : céder ou transmettre la société (valorisation, impôt sur la plus-value de cession).

### 4.3 Le moteur, générique mais paramétré par secteur
Chaque année et pour chaque site :
- `CA = volume × prix`. Le volume dépend du marché local, de la conjoncture, du marketing, de la satisfaction, de la capacité de l'équipe et du hasard.
- `marge brute = CA × taux de marge du secteur`.
- Charges fixes : loyer, salaires chargés, assurances (**garantie décennale** pour le BTP, RCP pour la santé et le droit), comptable, logiciels.
- Résultat, impôt sur les sociétés, puis résultat net en trésorerie, moins les remboursements et la rémunération du dirigeant.
- **Capacité** : chaque salarié traite un volume maximum. Sans embauche, le CA plafonne.
- **Conjoncture** : chaque secteur a sa sensibilité aux krachs, aux taux d'intérêt (BTP, immobilier) et aux réformes (santé).

### 4.4 Salaire ou dividendes (décision chaque année, avec un curseur)
- **Salaire** du dirigeant (assimilé salarié en SASU, cotisations ≈ 75 à 80 % du net en plus pour la société ; travailleur non salarié en EURL, ≈ 45 %) : il ouvre des droits retraite et passe à l'impôt sur le revenu.
- **Dividendes** : versés sur le résultat net après impôt sur les sociétés, taxés à **31,4 %** (flat tax). En EURL, la part au-delà de 10 % du capital supporte des cotisations (**à vérifier**).
- **Mise en réserve** : l'argent reste dans la société, pour investir ou absorber un choc.
- L'écran montre, pour 10 000 € sortis de la société, **ce qui arrive vraiment sur le compte perso** selon chaque option.

### 4.5 Grandir : quatre paliers par secteur

| Secteur | Palier 1 | Palier 2 | Palier 3 | Palier 4 |
|---|---|---|---|---|
| 🩺 Santé | Cabinet libéral (seul·e) | Centre de santé, maison de santé (associés, remplaçants) | **Clinique** (rachat, autorisations de l'ARS en dilemme) | **Groupe hospitalier** (rachats de cliniques, centaines de salariés) |
| 🔧 BTP | Artisan (micro, apprenti) | Entreprise de 5 à 10 salariés | PME générale de bâtiment (marchés publics) | Groupe régional (rachats) |
| 💼 Commerce | Boutique ou e-commerce | 2 ou 3 points de vente | Réseau ou franchise | Enseigne nationale |
| ⚙️ Ingénieur | Bureau d'études | Atelier de production | Usine (gros investissement) | Sous-traitant de rang 1 des grands groupes |
| 🏃 Sport | Coach indépendant | Salle de sport | Chaîne de salles | Franchise nationale |
| ⚖️ Droit | Avocat·e en collaboration libérale | Cabinet en propre | Associés | Cabinet d'affaires |
| 💻 Informatique | Freelance (taux journalier) | Startup logicielle (levée d'amorçage) | Série A, croissance | Rachat ou introduction en Bourse… ou mort |

Chaque palier change le tableau de bord (plus de lignes, plus d'équipe), les dilemmes et les risques. Passer un palier demande des **conditions** (trésorerie, résultat, équipe, financement), affichées comme des objectifs.

**Rachats** : chaque année, 0 à 2 cibles peuvent être proposées (« Clinique Saint-Roch à vendre : 4,2 M€, résultat 380 000 € »). Le joueur négocie le prix (curseur), le financement (dette, apport, investisseurs) et confirme en deux temps.

---

## 5. Difficultés, faillite et rebond

- **Alertes de trésorerie** : sous 2 mois de charges, une bannière rouge s'affiche avec des solutions (affacturage, report d'échéances, prêt de trésorerie, baisse de rémunération, apport personnel).
- **Quand la trésorerie ne suffit plus**, une **décision obligatoire** (confirmation en deux temps) propose deux choix :
  1. **Sauver ta boîte** : vendre tes placements et ton épargne pour remettre de l'argent (apport en compte courant d'associé). Le jeu montre la fiscalité de chaque vente et le montant nécessaire. Si ça ne suffit pas, retour à cette même décision.
  2. **Déposer le bilan** : redressement judiciaire (plan sur plusieurs années, dossier en cours) ou liquidation.
- **Après une liquidation** :
  - le patrimoine personnel est protégé, **sauf les cautions personnelles** signées sur les prêts : la banque les réclame ;
  - un dirigeant de SASU n'a pas droit au chômage. **Allocation des travailleurs indépendants** possible si les conditions sont remplies (**à vérifier**) ;
  - **le joueur repart dans un autre domaine** : choix de 2 ou 3 nouveaux projets, **même âge, même chronologie, même vie perso**. L'expérience de la faillite réduit certains risques et coûte de l'humeur et du couple.
- **Il n'y a jamais de dette sans limite.** Au-delà d'un plafond, c'est le **surendettement** : la banque refuse, des ventes forcées ont lieu, puis un dossier de surendettement sur 7 ans (déjà signalé comme bug à corriger).

---

## 6. Vie perso et patrimoine (compléments à la v1)

- **Déménagement** (bouton dans Profil et proposé dans Mon entreprise) : frais, nouveau loyer, impact sur la société (fermeture ou transfert, ouverture d'un site dans la nouvelle ville), humeur et couple. Confirmation en deux temps.
- **Immobilier** :
  - **apport modifiable** à tout moment dans l'étude de dossier ;
  - **résidence principale ou locatif** au choix ;
  - **taxe foncière comptée chaque année** dans le budget et dans le bilan (environ un mois de loyer théorique du bien, indexé, variable selon la ville).
- **Revenus réalistes** : le moteur actuel indexe les dépenses sur l'inflation, c'est à garder. Le joueur ne doit **jamais devenir riche par la seule rémunération** : le patrimoine important vient de la **valeur de l'entreprise** (cession), de l'**investissement** et de l'**immobilier**. Cibles au §8.
- **Dilemmes qui évoluent avec la vie** :
  - au moins **80 dilemmes**, étiquetés par **phase** (études, création, croissance, maturité, transmission), **secteur**, **situation familiale** et **âge** ;
  - jamais deux fois le même en 5 ans ;
  - des chaînes sur plusieurs années.
- **Startup du pote** (et toutes les participations) : le résultat tombe **2 à 3 ans plus tard**, avec une nouvelle intermédiaire entre-temps (« Ton pote a signé un premier gros client »).
- Le **couple** et les **enfants** suivent les règles de la v1 : partenaire du sexe opposé, demande en mariage avec la bague, un seul coût par enfant.

---

## 7. Fin de partie

- **Retraite à 64 ans** (déjà vérifié dans le moteur : génération 2006). Avant, une décision **« Que faire de ta société ? »** :
  - **la céder** : prix fonction du résultat et du secteur, impôt sur la plus-value de cession, avec abattement de départ à la retraite (**à vérifier**) ;
  - **la transmettre à tes enfants**, avec le pacte Dutreil (**à vérifier**) ;
  - **la garder** et te verser des dividendes.
- **Score** : patrimoine en euros de 2026 (la valeur de l'entreprise comprise), multiplié par le bien-être moyen. Rang de 🥉 à 👑, record, classement entre amis.

---

## 8. Équilibrage (cibles à mesurer)

| Mesure (500 parties par filière, joueur « raisonnable ») | Cible |
|---|---|
| Patrimoine médian à 64 ans, en euros de 2026 | 400 000 à 900 000 € |
| Écart entre filières (médiane) | aucune > 1,6 × une autre |
| Faillite au moins une fois dans la carrière | 25 à 45 % des parties |
| Joueur qui se verse tout en salaire sans rien placer | < 0,5 × le raisonnable |
| Atteindre le palier 4 | 3 à 10 % des parties |
| Patrimoine minimum (pire partie) | jamais sous −50 000 € réels |
| Millionnaire en euros de 2026 | 10 à 20 % |

---

## 9. Plan de livraison pour Claude Code

0. **Corrections** (rapport du 9 novembre au matin) : dette sans limite, faillite incohérente, onglet Carrière vide pour le demandeur d'emploi, déficit étudiant, agent immobilier, `balance.mjs` manquant, messages qui recouvrent le pseudo.
1. **Interactions** : appui simple, confirmation en deux temps, « Passer des années », règles sur les parents, taxe foncière, quitter ses parents.
2. **Études et tutoriel** : 7 filières, financement combinable, examens, redoublement, mention, mentor.
3. **Création et moteur d'entreprise** : offres, statuts, financement, tableau de bord, leviers, salaire ou dividendes, alertes, faillite et rebond.
4. **Croissance** : 4 paliers par secteur (santé jusqu'au groupe hospitalier en priorité), rachats, levées, cession.
5. **Vie et patrimoine** : déménagement, 80 dilemmes par phase, dossiers à 2-3 ans, fin de partie, équilibrage, passe mobile finale.

À chaque étape : tests du moteur, parties complètes, e2e mobile et desktop, captures relues, commit, push, résumé court pour Flo.

---

## 10. Décisions par défaut (Flo peut les changer)

- **Une seule entreprise à la fois** comme activité principale. On peut en racheter d'autres (rachats = sites ou filiales) et prendre des participations ; après une cession, on peut en recréer une.
- **Pas de retour au salariat** après les études, sauf deux exceptions : le job étudiant, et un **CDD de transition** (1 à 2 ans maximum) après une faillite, le temps de rebondir.
- **Les enveloppes et la Bourse restent** pour placer l'argent sorti de la société.
- **La holding personnelle** (réinvestir les dividendes sans impôt immédiat) se débloque au palier 3. C'est le levier des vrais entrepreneurs, et il est réaliste.
