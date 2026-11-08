# Audit de La Corbeille (version 3.13, 8 novembre 2026)

Audit critique, domaine par domaine, fait sur le code, les tests et des mesures (20 à 60 parties simulées par mesure, deux graines d'équilibrage). Chaque point a une gravité : **bloquant**, **important**, **à surveiller**. Les points positifs sont dits brièvement ; l'essentiel est ce qui ne va pas.

## Le verdict en cinq lignes

1. Le jeu a un vrai socle : un monde inventé crédible, une fiscalité française réaliste, une histoire qui se souvient de tes choix, et des invariants d'argent vérifiés au centime.
2. Le principal risque n'est plus technique : c'est **l'empilement**. Treize versions en une journée : carrière, boîte, budget, juillet, loyers, versements, villes, statuts. Chaque ajout est propre, mais personne ne les a encore joués ensemble, et rien n'aide un nouveau joueur à les découvrir.
3. **La boîte est la plus grosse nouveauté et la moins éprouvée** : le budget annuel ne récompense pas encore un pilotage intelligent mieux qu'un budget par défaut (mesuré, voir plus bas).
4. Le fichier unique de 389 Ko atteint sa limite de maintenabilité ; les modifications passent par des remplacements de texte, ce qui devient fragile.
5. Priorité : faire jouer 3 ou 4 amis une partie complète **avant** d'ajouter quoi que ce soit.

---

## 1. Vision et positionnement

- **Bien** : la promesse est claire et originale (« ta vie et ton argent, 55 ans, dans un monde inventé »). Le refus de l'histoire réelle est le bon choix : connaître 2008 ne sert à rien.
- **Important : deux jeux en un.** Le salarié-investisseur et le dirigeant d'entreprise ne jouent plus au même jeu. Le premier gère un portefeuille ; le second gère un compte de résultat chaque janvier. Le score, les repères et Sophie ont été pensés pour le premier. Il faut décider si le dirigeant est un mode à part (avec son propre conseiller, ses propres succès) ou une option de vie parmi d'autres.
- **À surveiller : le public.** « Crédible pour un financier, amusant pour un non-financier » : la crédibilité progresse à chaque version, l'amusement pour un non-financier recule (plus d'écrans, plus de chiffres, plus de jargon : valorisation, élasticité, IFI, LMNP).

## 2. Jeu et rythme

- Mesuré : **36,6 fenêtres par partie** pour un salarié, une décision une année sur deux (53 %), environ 18 Unes et 19 moments de vie.
- **Important : le dirigeant ouvre en plus un prévisionnel chaque janvier**, soit jusqu'à 40 fenêtres de plus sur une vie. Les années calmes enchaînées gardent le budget de l'an dernier, ce qui limite la casse, mais un dirigeant actif verra deux fois plus de fenêtres qu'un salarié. Piste : n'ouvrir le prévisionnel d'office que la première année, en cas de découvert, de crise ou de changement d'équipe, et sinon un simple rappel dans l'onglet.
- **Important : la durée d'une partie.** 55 tours, avec juillet activé par défaut, cela fait 110 clics de passage d'année avant toute décision. Pour un ami qui découvre, c'est long. Le point de juillet devrait peut-être être désactivé par défaut et proposé après quelques années.
- **À surveiller : des fonctions cachées.** Loyers réglables, versements automatiques, déménagement (visible seulement en parcourant le catalogue d'une autre ville), cession de parts : rien ne les signale. Les « premiers pas » ne couvrent que les deux premières années et rien de ce qui a été ajouté depuis.

## 3. Réalisme financier et fiscal

- **Bien** : PEA (5 ans, plafond), assurance-vie (8 ans, abattement), Livret A, flat tax, plus-values immobilières avec abattements, IFI, PTZ, taux d'effort à 35 %, dossier de crédit : c'est sérieux.
- **Important : à vérifier avant de parler de « fiscalité française réaliste » à des financiers.** La hausse de la CSG sur les revenus du capital votée pour 2026 porterait la flat tax à 31,4 % (le jeu part de 30 %). Je n'ai pas pu le confirmer ici : un point à valider, puis à corriger dans `S.pol` si c'est le cas.
- **À surveiller : simplifications visibles pour un connaisseur.**
  - Pas de déficit foncier.
  - Pas d'amortissement en LMNP au réel (seulement le micro-BIC à 50 %).
  - Pas d'indexation des loyers sur l'IRL.
  - Pas de frais de garantie ni d'assurance emprunteur dans le crédit.
  - Une retraite égale à 60 % du dernier salaire pour tout le monde.
- **Important : les salaires de départ à 20 ans.** La fourchette « 4 500 à 6 000 € net par mois » à 20 ans, au sortir de l'école, n'existe pratiquement pas. Avec le départ à 20 ans, les fourchettes devraient être revues (ou décrites comme « ton salaire à 25 ans »).

## 4. L'entreprise

- **Bien** :
  - un compte de résultat lisible ;
  - un prévisionnel pur et identique au calcul réel à hypothèses égales (testé) ;
  - l'écart prévu-réalisé expliqué (cycle, coup dur, aléas) ;
  - une sécurité de trésorerie pour le fondateur ;
  - une calibration faite sur simulation, pas à l'intuition.
- **Important : le budget ne récompense pas encore l'intelligence.** Mesuré sur 60 parties par domaine, sur les mêmes mondes :
  - aucun budget fixe ne domine partout ;
  - le commercial paie dans l'e-commerce (+17 à +35 %) et dans le conseil (+14 %) ;
  - le commercial coûte dans la restauration et le BTP ;
  - un gestionnaire « prudent » (couper en crise, investir quand la trésorerie déborde) fait **jeu égal** avec le budget par défaut, au lieu des +15 à 30 % visés.

  Les leviers sont donc des arbitrages honnêtes, mais connaître son métier compte plus que réagir à la conjoncture. Pistes :
  - un vrai effet anticyclique (le commercial coûte moins cher et rapporte plus en crise, quand les concurrents coupent) ;
  - un coût de licenciement plus faible quand on a réduit à temps ;
  - un prévisionnel qui montre l'effet sur 3 ans et pas seulement sur l'année.
- **Important : simplifications juridiques.**
  - Pas de choix SAS / SARL ni de statut TNS : charges uniformes de 45 %.
  - Impôt sur les sociétés à 25 % sans le taux réduit de 15 % sur les premiers bénéfices.
  - Pas de caution personnelle sur le prêt bancaire.
  - Pas de chômage pour le fondateur qui ferme.
  - La retraite du fondateur est calculée sur son salaire de référence de salarié, alors qu'il cotisait sur une petite paie : c'est généreux, donc biaisé en faveur de l'entrepreneur.
- **À surveiller : l'équilibrage du dirigeant reste bruité** (sur deux graines) :
  - médiane entre ×1,08 et ×1,38 du salarié ;
  - 10 % les mieux lotis entre ×1,27 et ×1,70 ;
  - faillites entre 45 et 51 %.

  C'est dans la cible en moyenne, à la limite sur une graine.

## 5. Immobilier

- **Bien** : le dossier de crédit, désormais avec l'apport qui passe proposé en un clic ; le choix vendre ou louer l'ancienne résidence ; le déménagement de ville ; les loyers réglables avec un vrai arbitrage (le loyer du marché reste le meilleur pari, +20 % fait perdre 7 à 27 %, Paris encadré).
- **À surveiller : la banque ne regarde que le taux d'effort.** Avec 200 000 € en banque, une vraie banque accepte souvent une dérogation (les 20 % de dossiers hors norme). Le joueur doit aujourd'hui l'apprendre en jouant avec l'apport ; c'est mieux expliqué depuis la 3.12.1, mais pas modélisé.
- **À surveiller : le marché est national, modulé par ville.** Pas de crise immobilière locale ni de quartier (déjà dans la feuille de route).

## 6. Équilibrage

- Sur les deux graines, la plupart des cibles sont tenues :
  - passif contre ETF Monde : 0,92 ;
  - lecteur de fiches : ×1,17 à ×1,29 ;
  - objectifs famille, 55 ans, 2,5 millions dans leurs cibles ;
  - Sophie fiable à 80 % ;
  - Kévin à pile ou face.
- **Important : « l'élève de Sophie » ne bat toujours pas l'acheteur naïf au même profil** : ×1,06 à ×1,13 pour une cible de ×1,15, et ce depuis la 3.5. Ce n'est plus du bruit, c'est structurel. Les conseils de Sophie sont prudents par construction (ne jamais lire l'avenir), et un naïf à 80 % d'actions fait presque aussi bien sur 55 ans. Deux options honnêtes :
  - abaisser la cible à ×1,05 et l'assumer (Sophie protège surtout des erreurs) ;
  - lui donner un vrai avantage d'information (elle lit mieux les fiches).
- **Important : le profil ingénieure** gagnait ×1,32 à ×1,43 face à l'héritier depuis le départ à 20 ans (les promotions profitent plus aux hauts salaires sur 55 ans). La difficulté a été recalée (capacité d'épargne comptée × 90 au lieu de × 60) : l'ingénieure revient à ×1,20 – ×1,31, l'infirmier à ×1,10 – ×1,13, tous dans la cible.
- **À surveiller : rien n'est mesuré sur les nouveautés de la 3.13** (déménagement, loyers réglables, versements automatiques, statuts). Ils sont testés (pas d'argent créé ni perdu), pas équilibrés.

## 7. Histoire et ton

- **Bien** :
  - les cinq chapitres ;
  - les fils qui reviennent en citant l'année et le montant ;
  - jamais deux fois le même texte (testé) ;
  - la biographie de fin ;
  - les accords homme ou femme (testés, avec le point spécial « ‧ »).
- **Important : l'histoire est écrite pour un salarié.** Le dirigeant reçoit les mêmes scènes de bureau (« Au bureau, on parle à voix basse », le dîner des cadres est exclu mais pas toutes les scènes), et sa boîte n'a presque pas de vie narrative : pas d'associé, pas de premier client, pas de nuit blanche, pas de levée de fonds racontée. Le meilleur ami Karim fait de la start-up pendant que le joueur dirige la sienne, sans que l'histoire relie les deux.
- **À surveiller : genres restants.** « Ton conjoint » est toujours masculin dans les textes ; les prénoms mixtes (Sacha, Alix, Charlie…) restent en écriture inclusive.

## 8. Interface

- **Bien** : écran unique sans défilement de page sur ordinateur (vérifié à 1280 × 720 et 1280 × 600), style « journal » sobre, montants animés, annulation du dernier ordre, position de défilement conservée depuis la 3.12.1.
- **Important : cinq onglets sur téléphone.** À 390 px, « Patrimoine » est coupé et il faut faire défiler la barre d'onglets. Personne ne le devine. Piste : icônes et libellés courts, ou regrouper Carrière dans Profil sur mobile.
- **Important : la densité.** La fenêtre du prévisionnel, l'onglet Ma boîte (quatre blocs de décisions) et l'onglet Immobilier (catalogue, biens, loyers réglables, déménagement) font beaucoup de chiffres par écran. Sur mobile, le prévisionnel oblige à défiler pour voir le résultat de ses choix : on règle d'un côté et on voit l'effet ailleurs. Piste : afficher le résultat prévu en tête, collé aux leviers.
- **À surveiller : les fenêtres empilées** (chapitre, prévisionnel, décisions, juillet). L'ordre est réfléchi, mais une année de création d'entreprise peut enchaîner quatre fenêtres avant de voir son jeu.

## 9. Accessibilité

- **Bien** : focus visible et restauré après chaque rendu, `aria-pressed`, `role="status"`, Échap pour fermer, `prefers-reduced-motion` respecté, palette des graphiques validée pour le daltonisme.
- **Important : aucun test automatique d'accessibilité.** Pas d'axe ni de contraste mesuré sur les nouveaux écrans. Le rouge seul signale une année en perte dans le graphique de la boîte (la légende le dit, mais la couleur reste le seul signal visuel).
- **À surveiller : des boutons nombreux et petits** (leviers à 12-13 px, puces de loyer) sur téléphone : en dessous des 44 px recommandés pour le doigt.

## 10. Technique et qualité du code

- Mesuré : 3 800 lignes, 389 Ko, environ 440 fonctions, 83 actions `data-act`, 58 lignes de plus de 400 caractères (jusqu'à 946). Rendu d'un onglet : 0,9 ms en moyenne (3,4 ms au pire). Sauvegarde en fin de partie : 165 Ko (le stockage du navigateur en permet environ 5 000).
- **Important : la maintenabilité.** Un fichier unique, des lignes très longues, des fonctions qui mêlent calcul et texte. Chaque modification se fait par remplacement de chaîne exacte : ça marche parce que les tests sont bons, mais chaque session coûte plus cher que la précédente. La contrainte « un seul fichier » vient de l'artifact Claude ; elle n'empêche pas d'écrire la source en plusieurs fichiers et de les assembler au `build` (le `build` existe déjà).
- **Important : un état global qui a grossi.** `A0` et `YN` deviennent des variables globales posées au chargement d'une partie (pour garder les anciennes à 25 ans). C'est correct aujourd'hui, mais fragile si un jour deux parties coexistent (comparaison, classement, relecture).
- **À surveiller :** 19 modifications directes de `S.cash` (la règle dit de passer par `ext()` ou une fonction d'ordre ; celles qui restent sont justifiées par le registre, mais il faut les relire une par une) ; des textes en dur dans le moteur, ce qui rend toute traduction impossible.

## 11. Tests et fiabilité

- **Bien, et c'est la vraie force du projet** :
  - 31 tests rapides (dont 600 mondes en test complet) ;
  - l'identité de caisse au centime ;
  - le déterminisme ;
  - la pureté de l'affichage ;
  - un test bout en bout dans un vrai navigateur sur quatre tailles d'écran ;
  - un rapport d'équilibrage sur deux graines.
- **Important : pas d'intégration continue.** Les tests ne tournent que sur ce PC. Un GitHub Action qui lance `npm test` à chaque envoi coûterait dix minutes à mettre en place.
- **Important : les tests disent « ça ne casse pas », pas « c'est amusant ».** Aucun test ne mesure l'expérience : nombre de clics pour finir une année, temps de partie, fenêtres d'affilée. La seule mesure de rythme (fenêtres par partie) n'a pas de seuil d'alerte.
- **À surveiller : le rapport d'équilibrage est bruité** (100 parties par mesure) et plusieurs cibles basculent OK/WARN d'une graine à l'autre. Passer à 300 parties sur les mesures limites, ou à trois graines.

## 12. Produit, partage, données

- **Important : deux versions qui divergent.** GitHub Pages n'a pas de classement ; la version officielle sur Claude en a un, mais sur un compte personnel les amis ne peuvent qu'envoyer leur résultat au propriétaire. Pour un jeu entre amis, c'est la fonction sociale qui manque le plus.
- **À surveiller : aucune mesure d'usage.** Impossible de savoir où les joueurs abandonnent, ce qu'ils ne trouvent pas, combien de temps dure une partie.
- **À surveiller : l'avertissement « pas la vraie vie, pas un conseil »** est bien présent au départ et à la fin ; à garder en vue avec les fonctions d'entreprise, qui ressemblent de plus en plus à un outil de gestion.

## 13. Méthode de travail

- **Important : tout va très vite.** Treize versions en une journée, chacune testée, mais sans qu'un humain ait joué une partie complète de la 3.13. Les meilleurs retours (la page qui remonte, le crédit refusé, les dépenses à 900 €) sont venus de toi en jouant, pas des tests.
- **À surveiller : la documentation suit**, mais CLAUDE.md dépasse 450 lignes : il devient long à relire en début de session. Le découper (règles du jeu, architecture, équilibrage) aiderait.

---

## Les dix priorités, dans l'ordre

1. **Faire jouer une partie complète à 3 ou 4 amis** (un salarié, un dirigeant, un sur téléphone) et noter où ils bloquent. Ne rien ajouter avant.
2. **Alléger le dirigeant** : prévisionnel d'office la première année et en cas de difficulté seulement, résultat prévu affiché à côté des leviers.
3. **Rendre le pilotage payant** : un effet anticyclique du commercial et une vision sur 3 ans, pour que bien gérer batte le budget par défaut de 15 à 30 %.
4. **Revoir les salaires de départ** pour des jeunes de 20 ans (ou parler du « salaire à 25 ans »).
5. **Vérifier la flat tax 2026** (30 % ou 31,4 %) et corriger `S.pol` si besoin.
6. **Trancher la cible de Sophie** (×1,05 assumé, ou un vrai avantage).
7. **Mobile** : onglets lisibles à 390 px, boutons d'au moins 44 px.
8. **Faire découvrir les fonctions** : une ligne de « premiers pas » par nouveauté au moment où elle devient utile (premier bien loué : « tu peux régler son loyer » ; premier salaire confortable : « versements automatiques »).
9. **Mettre en place l'intégration continue** (GitHub Actions : `npm test` à chaque envoi).
10. **Découper la source** en fichiers assemblés au build, avant la prochaine grosse fonctionnalité.
