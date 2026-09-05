# Audit ergonomique et parcours utilisateur — PatriGest

**Statut :** audit en cours
**Version de référence :** v0.5.0
**Début de l'audit :** septembre 2026

> Ce document est vivant. Il doit être complété et éventuellement corrigé au fur et à mesure de l'audit avant de devenir une spécification d'implémentation.

## 1. Objectif général

PatriGest fonctionne actuellement sur le plan métier. Cet audit ne vise pas à réécrire les fonctionnalités existantes, mais à améliorer l'ergonomie, la compréhension du produit et l'enchaînement des tâches.

> PatriGest doit être pensé pour accompagner une tâche complète, et pas seulement comme une succession de formulaires.

Un nouvel utilisateur doit comprendre par quoi commencer, pourquoi une information est demandée, ce qui est indispensable immédiatement, ce qui peut être complété plus tard et quelle action suit logiquement un enregistrement. Toute évolution doit préserver les règles métier, les droits, la sécurité et les fonctionnalités déjà opérationnelles.

## 2. Parcours initial cible

Le parcours de mise en route retenu est progressif et non bloquant :

1. Création du dossier
2. Identité et coordonnées
3. Mesure de protection
4. Exercice de gestion
5. Comptes financiers
6. Patrimoine immobilier
7. Dettes et emprunts
8. Gestion courante et opérations

Il ne faut pas créer un assistant long et obligatoire. La page **Informations du dossier** doit devenir le point central de cette mise en route.

## 3. Première connexion — ONB-01

Un utilisateur accepté dans PatriGest mais ne possédant aucun dossier ne doit pas arriver dans un environnement simplement vide. L'interface doit lui expliquer qu'il faut commencer par créer le dossier de la personne protégée et proposer clairement **Créer mon premier dossier**.

Le parcours peut être résumé ainsi : Dossier → Mesure → Exercice → Comptes → Situation patrimoniale → Gestion.

Un utilisateur arrivé par invitation sur un dossier existant suit un autre parcours : il accède au dossier confié et ses possibilités dépendent de son rôle — propriétaire, gestionnaire ou lecture seule.

## 4. Création du dossier — ONB-02

Le formulaire **Nouveau dossier** est globalement conservé. Il comprend : prénom obligatoire, nom obligatoire, nom de naissance, date de naissance, adresse, complément, code postal et commune.

Prénom et nom suffisent pour créer rapidement le dossier. Le formulaire ne doit pas devenir un assistant long. Une indication telle que « Vous pourrez compléter ou modifier ces informations ultérieurement. » est à ajouter ou étudier.

Après création, le parcours revient vers **Informations du dossier**, qui oriente vers la prochaine étape. Le bouton **Annuler** doit avoir un retour cohérent avec le contexte d'arrivée.

## 5. Informations nécessaires au compte de gestion

PatriGest possède déjà une mécanique volontaire : le compteur **X informations à compléter** et les champs jaunes dans les formulaires. Elle identifie les informations nécessaires au futur compte de gestion et ne doit pas être supprimée.

Il faut en clarifier la signification, par exemple : « 7 informations à compléter pour le compte de gestion » puis, dans le formulaire : « Les champs surlignés sont des informations qui seront nécessaires pour compléter le compte de gestion. Vous pouvez les renseigner maintenant ou ultérieurement. »

Le principe à préserver est que **nécessaire maintenant** et **nécessaire avant le compte de gestion** sont deux notions différentes.

## 6. Informations du dossier — rôle central

**Informations du dossier** devient le point central de configuration et de préparation du dossier. Les cartes doivent suivre le parcours réel :

1. Identité
2. Mesure de protection
3. Exercice de gestion
4. Comptes financiers
5. Patrimoine immobilier
6. Dettes et emprunts

Une carte **Comptes financiers**, actuellement absente, doit être ajoutée lors d'une future implémentation. **Domicile et résidence** reste important, mais relève des informations de la personne plutôt que d'une étape principale équivalente à Exercice ou Comptes. **Patrimoine actuel** est un indicateur de synthèse, non une étape de création ; son emplacement devra être revu.

## 7. Identité — UX-05 / UX-06 / UX-07 / UX-08

Le formulaire détaillé est globalement conservé : prénom(s), nom d'usage, nom de naissance, date et lieu de naissance, domicile, coordonnées et résidence distincte. Le système des champs jaunes requis pour le compte de gestion est conservé.

Les champs facultatifs doivent être clarifiés lorsque pertinent : « Nom de naissance (si différent) », téléphone facultatif, e-mail facultatif, etc. La résidence distincte pourrait apparaître progressivement uniquement lorsqu'elle existe afin d'alléger le formulaire.

Restent à étudier, sans décision d'implémentation : le type de résidence et le nom d'un établissement — EHPAD, foyer ou établissement spécialisé notamment.

## 8. Mesure de protection — ONB-04 / ONB-05

Le formulaire actuel est globalement conservé : type de mesure, ouverture ou dernier renouvellement, date de décision, numéro RG, cabinet, juridiction, ville, personne en charge de la mesure et coordonnées de cette personne.

Il faudra expliquer ce qui est indispensable immédiatement ou complétable plus tard, expliciter **Ouverture ou dernier renouvellement**, vérifier le sens et le libellé exact de **Cabinet**, et éventuellement proposer **Je suis la personne en charge de la mesure** pour préremplir les informations depuis **Mon compte**.

L'utilisateur PatriGest ne doit jamais être confondu avec la personne juridiquement en charge de la mesure. Après la première mesure, retour vers **Informations du dossier** ; prochaine étape : exercice de gestion. Les exigences propres à chaque type de mesure devront être auditées si elles influencent le compte de gestion.

## 9. Exercices de gestion — ONB-06 / ONB-07 / ONB-08 / MET-03

L'utilisateur doit être aidé à choisir les dates du premier exercice, sans que PatriGest prenne une décision juridique à sa place. Sont à étudier : une suggestion de date de début issue de la mesure ou de la nomination et l'explication d'un premier exercice commencé en cours d'année.

Après création, retour vers **Informations du dossier** ; prochaine étape : **Comptes financiers**.

L'audit technique et métier doit encore couvrir le chevauchement, les exercices futurs, le nombre d'exercices ouverts, la clôture, une éventuelle réouverture et la définition exacte de l'« exercice courant ».

## 10. Comptes financiers — UX-11 / UX-14 / UX-15 / UX-16 / UX-17 / UX-18

La page **Comptes et patrimoine** devra être revue. La fonction bancaire quotidienne relève d'un domaine **Gestion financière** ; la liste des comptes pourrait devenir **Comptes financiers**.

Le formulaire de création reste globalement pertinent : type, intitulé, établissement, référence, solde initial, date du solde initial, date d'ouverture et notes. La convention de nommage doit éviter les doublons :

- Établissement : Crédit Agricole
- Intitulé : Compte courant principal
- Référence : 2302
- Affichage : Crédit Agricole — Compte courant principal · ••••2302

Pendant la configuration initiale, créer un compte ne doit pas ouvrir automatiquement sa fiche détaillée. Le retour souhaité est la liste des comptes financiers, avec **Ajouter un autre compte** et un retour vers **Informations du dossier** lorsque la création est terminée.

## 11. Règle métier du solde initial — MET-04 / MET-05

**Décision validée :** le solde initial correspond au solde immédiatement antérieur à la première opération que l'utilisateur souhaite saisir dans PatriGest.

Exemple : première opération au 01/01/2026, solde du relevé au 31/12/2025 de 2 000 €, donc solde initial PatriGest de 2 000 € daté du 31/12/2025. L'utilisateur saisit ensuite toutes les opérations à compter du 01/01/2026.

La date du jour proposée par défaut peut être trompeuse et doit être revue. Le formulaire doit expliquer cette convention. Avant implémentation, il faut vérifier la frontière exacte du calcul — opérations le jour du solde initial ou strictement postérieures — pour éviter double comptage et omission.

## 12. Fiche d'un compte

La fiche actuelle est globalement pertinente : solde calculé, informations, dernières opérations, relevés, modification et cycle de vie. L'état vide **Aucune opération** doit mieux orienter vers **Saisir des opérations**. Les actions exceptionnelles ou destructives, telles que clôturer ou supprimer le compte, pourraient devenir visuellement secondaires.

**NAV-13 — Priorité haute.** Depuis le détail d'un compte, le retour vers la liste des comptes doit être évident.

**NAV-14 — Priorité haute.** Le comportement des cartes et des liens doit être audité lorsqu'un compte est déjà sélectionné, afin d'éviter les changements de contexte implicites.

**NAV-15 — À étudier.** Un sélecteur contextuel de compte pourra être évalué ultérieurement, sans remettre en cause la convention générale : navigation gauche = domaine, navigation horizontale = sous-rubrique, boutons = actions et fil d'Ariane = localisation.

## 13. Opérations — deux usages distincts

Le formulaire complet **Ajouter une opération** est conservé pour une opération ponctuelle. Un second workflow sera créé à terme pour la saisie successive d'un relevé.

Les actions envisagées sont : **Ajouter une opération**, **Saisir un relevé** et **Effectuer un virement**. La saisie d'un relevé ne doit pas renvoyer à la liste après chaque ligne.

**UX-36 — Priorité très haute.** Il faut étudier la correction d'une opération créée avec le mauvais type, notamment Dépense ↔ Recette.

La conversion vers ou depuis un virement est plus complexe, car elle peut impliquer plusieurs mouvements liés. **MET-14 — Priorité très haute : audit spécifique requis avant toute évolution.**

## 14. Saisie en série / saisie d'un relevé — UX-21 à UX-25

Cette évolution est de priorité très haute. Elle doit permettre de saisir 20, 30 ou 40 opérations sans répéter liste → ajout → formulaire → enregistrement → liste.

Le compte est fixé par le contexte. Chaque ligne contient : type Recette/Dépense/Virement, date, libellé, catégorie, montant et accès immédiat au justificatif. Après validation, la ligne est enregistrée, une confirmation apparaît, la suivante est préparée et l'utilisateur reste sur le même écran.

La date précédente peut être conservée ; la catégorie reste disponible ; le commentaire peut être secondaire ou masqué par défaut. L'écran affiche les opérations de la session et permet une utilisation efficace au clavier.

## 15. Justificatifs pendant la saisie — UX-25 / UX-35 / MET-11

Le justificatif doit pouvoir être ajouté immédiatement après chaque opération afin d'éviter de revenir ensuite sur des dizaines de lignes : opération enregistrée, référence attribuée, **Ajouter le justificatif**, puis **Saisir la suivante**.

Le justificatif n'est pas nécessairement obligatoire pour continuer. Le mécanisme existant d'attribution automatique de référence est conservé.

**Principe métier validé — MET-11, priorité très haute :** une opération, une référence de pièce et un document sont trois notions distinctes. Une opération peut posséder une référence sans fichier joint.

**UX-35 — Priorité haute.** La référence automatique doit être présentée comme une information, non comme un champ de saisie modifiable.

## 16. Recette / Dépense / Virement

Les trois concepts métier existants sont conservés. Recette et Dépense peuvent utiliser une saisie rapide avec date, libellé, catégorie et montant. Virement conserve son traitement spécifique, avec compte source et compte destination ; un virement interne ne doit pas devenir une simple dépense ou recette si cela compromet la cohérence métier.

Il reste à étudier le virement vers un compte absent de PatriGest. L'anomalie **Libellé facultatif \*** du formulaire Virement doit être vérifiée pour déterminer si le champ est réellement obligatoire ou facultatif.

## 17. Rapprochement bancaire futur — MET-06

Le rapprochement complet n'entre pas dans le premier chantier de saisie rapide, mais l'architecture doit le permettre. À terme, la saisie d'un relevé pourra afficher le solde de départ, les mouvements, le solde calculé, le solde du relevé et l'écart, par exemple : solde calculé 2 277,50 €, solde du relevé 2 277,50 €, écart 0,00 €, relevé équilibré.

**MET-17 — Priorité très haute, audit métier et technique requis.** La règle actuelle, qui choisit le relevé dont la date de fin est la plus récente tout en restant antérieure ou égale à la fin du compte de gestion, doit être auditée. Il ne faut pas imposer une règle universelle exigeant une date exacte au 31 décembre. Pour certains placements, notamment les assurances-vie, un document relatif à la fin d'année peut être reçu plusieurs mois plus tard et porter une date ou une période particulière. Il faudra distinguer date du document, date de situation ou de valorisation, période couverte et type de produit financier.

**MET-18 — À étudier.** Déterminer si le fichier PDF doit être présent pour qu'un relevé soit considéré comme disponible. Actuellement, une ligne de relevé suffit même si son `storage_path` est absent.

## 18. Patrimoine immobilier — MET-07 / ONB-10

**0 bien** ne distingue pas une absence réelle d'une situation jamais renseignée. Trois états sont nécessaires : **Non renseigné**, **Aucun bien immobilier**, **Un ou plusieurs biens enregistrés**.

Lors de la configuration, l'utilisateur doit pouvoir ajouter un bien ou confirmer explicitement **Aucun bien immobilier**. Cette confirmation doit être mémorisée.

## 19. Dettes et emprunts — MET-08

La même distinction s'applique : **Non renseigné**, **Aucune dette ni emprunt**, **Une ou plusieurs dettes enregistrées**. L'absence de lignes ne suffit pas à conclure **Aucune dette active** si la situation n'a jamais été confirmée.

## 20. Tableau de bord du dossier — NAV-05 / UX-26 à UX-28 / MET-09

Le tableau de bord du dossier sert au pilotage quotidien et ne doit pas devenir un assistant permanent de création. Il conserve globalement patrimoine financier, comptes actifs, compte de gestion, dernières opérations, à faire, immobilier et dettes.

Les états **Non renseigné / Aucun / Renseigné** doivent être propagés à l'immobilier et aux dettes. Le bloc **À faire** constitue une base pour des actions contextuelles, mais une échéance n'est pas automatiquement une action. Une action rapide vers la saisie des opérations est à prévoir.

**UX-37 — Priorité très haute.** Lorsqu'un compte de gestion existe déjà pour un exercice, éviter d'afficher simultanément une action générique **Échéance de l'exercice** et **Compte de gestion XXXX en préparation** si ce dernier constitue déjà la prochaine action pertinente.

**UX-38 — Priorité haute.** Un exercice historique ne doit pas être appelé automatiquement **Exercice en cours**. L'état temporel et l'état du travail dans PatriGest sont deux notions différentes.

## 21. Tableau de bord principal — NAV-11 / UX-29 à UX-33

Le tableau de bord principal, distinct de celui d'un dossier, conserve son rôle de vision transversale. Ses indicateurs actuels sont : dossiers actifs, comptes de gestion à préparer et actions à traiter.

- **Dossiers actifs** doit mener à `/dossiers`, non à `/dossiers/gestion`.
- **Comptes de gestion à préparer** doit mener aux comptes concernés lorsque le nombre est positif ; à zéro, la carte peut rester informative.
- **Actions à traiter** doit rendre accessibles les actions lorsque le nombre est positif.

Il ne faut pas créer une page Actions avant d'avoir fiabilisé le moteur. Un chiffre de tableau de bord doit être clairement informatif ou donner accès à ce qu'il représente.

**UX-39 — Priorité haute.** L'indicateur **Comptes de gestion à préparer** doit être audité : un résultat nul a été observé alors que plusieurs rapports étaient encore en préparation. Il faut déterminer s'il compte les rapports à créer, ceux nécessitant du travail ou autre chose, puis adapter son libellé ou son calcul. Lorsqu'un indicateur est actionnable, il doit conduire directement aux éléments concernés.

## 22. Moteur d'actions — MET-10

Le tableau de bord de septembre 2026 affiche encore, dans **À faire prochainement**, des échéances de 2023, 2024 et 2025. Une échéance passée n'est pas nécessairement une action pertinente.

Il faudra distinguer **À régulariser**, **En cours**, **À venir** et, lorsque pertinent, **Historique / aucune action**. Un exercice ancien dont le compte de gestion est terminé ou approuvé ne devrait probablement plus générer une action actuelle.

> Une date n'est pas une tâche. Une date peut déclencher une tâche lorsqu'elle devient pertinente.

Le compteur **Actions à traiter** doit compter uniquement les actions réellement utiles.

**UX-29 — Priorité très haute.** Le moteur doit être contextuel : la prochaine action dépend de l'état réel du dossier, de l'exercice et du compte de gestion, non de la seule date.

**UX-30 — Priorité haute.** La date qualifie temporellement l'action, mais ne détermine pas à elle seule sa pertinence.

**MET-10 — Décision affinée, priorité très haute.** Une date passée ne fait pas disparaître une action si le travail métier reste réellement incomplet. Les comptes de gestion 2023, 2024 et 2025 encore en préparation dans une reconstruction rétrospective doivent rester visibles et actionnables. À l'inverse, un compte 2026 approuvé ne devrait pas continuer à produire une simple échéance d'exercice sans travail pertinent.

## 23. Architecture de navigation — NAV-01 à NAV-10

Décision structurante : menu gauche = grands domaines ; navigation horizontale = rubriques d'un domaine ; boutons = actions ; fil d'Ariane = position actuelle. Le fil d'Ariane est conservé.

### Navigation cible

**Principal**

- Tableau de bord
- Dossiers

L'entrée redondante **Gérer les dossiers** est à supprimer à terme. `/dossiers` devient le point d'entrée unique pour la liste et la création.

**Dossier en cours**

- Tableau de bord
- Informations du dossier
- Gestion financière
- Compte de gestion
- Accès au dossier

**Exercices de gestion** n'a pas nécessairement à rester dans le menu permanent ; il reste accessible depuis Informations du dossier et le compte de gestion. **Comptes et patrimoine** doit évoluer vers **Gestion financière**, avec une sous-navigation envisagée : Comptes, Opérations, Relevés.

Dans **Opérations**, **Ajouter une opération** reste destiné à une opération ponctuelle. Dans **Relevés**, **Ajouter un relevé** correspond à l'archivage simple ; un futur accès devra permettre la saisie et le contrôle à partir d'un relevé existant ou nouveau. Aucune route précise n'est arrêtée à ce stade.

Immobilier et Dettes restent liés à la situation et aux informations du dossier, ainsi qu'à son tableau de bord, plutôt qu'à la navigation bancaire quotidienne. Les droits owner, manager et read_only doivent être strictement respectés.

## 24. Dossiers / Gérer les dossiers — NAV-09 / ONB-11

Les pages `/dossiers` et `/dossiers/gestion` étant très proches, une seule entrée **Dossiers** est conservée. `/dossiers` doit lister les dossiers accessibles, afficher le rôle, permettre leur ouverture et proposer la création lorsqu'elle est autorisée.

Dans l'état vide, un utilisateur autorisé voit **Créer mon premier dossier**. Celui qui ne peut pas créer et attend un accès reçoit une explication indiquant qu'aucun dossier n'est accessible. Les liens **Gérer les dossiers** ailleurs dans l'interface devront être audités et probablement devenir **Voir tous les dossiers**.

## 25. Paramètres et navigation basse

Sont conservés pour l'instant : Catégories, Mon compte, Historique des versions et Déconnexion. La place exacte de Catégories reste à auditer ; cette zone ne doit pas être modifiée avant l'audit de son fonctionnement réel.

## 26. Priorités déjà identifiées

### Très haute

- Informations du dossier comme parcours central
- Carte Comptes financiers
- Simplification du menu dossier
- Gestion financière
- Saisie en série des opérations
- Justificatif immédiat pendant la saisie
- Règle du solde initial
- États Non renseigné / Aucun / Renseigné
- Fiabilisation du moteur d'actions

### Haute

- Accompagnement de la première connexion
- Enchaînements après création
- Aide à la création d'un exercice
- Création successive de comptes
- États vides orientés vers l'action
- Actions rapides
- Navigation contextuelle
- Clarification des informations nécessaires au compte de gestion

### Moyenne / à étudier

- Actions destructives moins visibles
- Préremplissage de la personne en charge de la mesure
- Type de résidence et établissement
- Rapprochement bancaire complet
- Autres améliorations issues de la suite de l'audit

Cet ordre **n'est pas encore le plan d'implémentation définitif**.

## 27. Audit 16 — Relevés bancaires

### Fonctionnement observé

La page **Relevés bancaires** d'un compte affiche une liste comprenant la date du relevé, sa période, son solde, son document et les actions **Voir**, **Télécharger**, **Modifier** et **Supprimer**. Sur le compte audité, la liste contient 33 relevés. Un exemple réel observé présente les informations suivantes :

- Date du relevé : 10/01/2026
- Période : 11/12/2025 → 10/01/2026
- Solde du relevé : 7 112,31 €

L'action **Voir** affiche actuellement le PDF du relevé. Le formulaire **Ajouter un relevé** contient : date de début facultative, date de fin, solde final facultatif, note facultative et fichier PDF.

Le fonctionnement actuel correspond principalement à un archivage structuré du relevé bancaire et de son PDF. L'interface actuelle n'expose pas de liaison fonctionnelle visible entre un relevé et les opérations de sa période. Cela ne permet pas d'affirmer qu'une telle liaison est techniquement inexistante en base ; ce point exige un audit du code et du modèle.

### REL-01 — Conserver la notion existante de relevé bancaire

**Priorité : Très haute**

PatriGest possède déjà une notion de relevé bancaire comprenant une période, un solde final, une note et un PDF. La future saisie successive des opérations ne doit pas créer inutilement une seconde notion concurrente. Le modèle et les fonctionnalités existants doivent être réutilisés autant que possible.

### REL-02 — Étudier l'intégration Relevé ↔ opérations ↔ rapprochement

**Priorité : Très haute**

Le futur workflow de saisie successive doit être conçu en tenant compte des relevés existants. L'objectif cible à étudier est :

Relevé bancaire → période → document PDF → opérations de la période → solde calculé → solde indiqué sur le relevé → écart → état de rapprochement.

Ce workflow ne doit pas être implémenté avant l'audit technique du modèle existant.

### REL-03 — Conserver l'archivage simple des relevés

**Priorité : Haute**

L'utilisateur doit continuer à pouvoir enregistrer un relevé et son PDF sans devoir immédiatement effectuer une saisie complète ou un rapprochement. **Ajouter un relevé** doit rester une action simple d'archivage documentaire et ne pas devenir un processus lourd obligatoire.

### REL-04 — Workflow futur Relevé + opérations

**Priorité : Très haute**

À terme, un workflow doit permettre de saisir successivement les opérations dans le contexte d'un relevé bancaire. Exemple conceptuel :

- Compte : SG CC - 2802 - PL
- Période : 11/12/2025 → 10/01/2026
- Solde final du relevé : 7 112,31 €

La saisie successive comprend date, libellé, catégorie, Dépense/Recette, montant et justificatif. Après chaque ligne, PatriGest enregistre l'opération, permet l'ajout immédiat de son justificatif, prépare immédiatement la ligne suivante et ne retourne pas au journal des opérations. Les opérations saisies pendant la session doivent être affichées si possible.

Cette décision complète UX-21 à UX-25.

### REL-05 — Ne jamais supposer une période mensuelle civile

**Priorité : Très haute**

Un relevé bancaire ne couvre pas nécessairement le premier au dernier jour d'un mois. L'exemple réel **11/12/2025 → 10/01/2026** le confirme : la banque détermine la période. PatriGest doit conserver des dates de début et de fin explicites et ne pas imposer automatiquement un mois civil.

### REL-06 — Exploiter le solde final pour le contrôle

**Priorité : Très haute**

Le solde final déjà enregistré doit pouvoir servir ultérieurement au contrôle des opérations :

Solde de départ + mouvements de la période = solde calculé.

Ce solde calculé est ensuite comparé au solde final indiqué sur le relevé afin d'afficher l'écart. Exemple : solde calculé 7 112,31 €, solde du relevé 7 112,31 €, écart 0,00 €. Cette décision complète MET-06 sur le rapprochement bancaire.

### REL-07 — Prévoir un état de rapprochement

**Priorité : Haute**

À terme, un relevé pourrait avoir un état distinguant, par exemple, **non rapproché**, **à contrôler** et **rapproché**. Les états exacts et leur modèle de données ne sont pas validés. Aucun schéma ni migration ne doit être défini à ce stade. L'objectif ergonomique est uniquement de permettre à l'utilisateur de savoir si le relevé a été contrôlé par rapport aux opérations.

### REL-08 — Réutiliser un relevé déjà archivé

**Priorité : Haute**

Un relevé déjà enregistré dans PatriGest ne doit pas être recréé pour commencer sa saisie ou son rapprochement. Le futur workflow doit pouvoir partir d'un relevé existant.

### Distinction entre Ajouter un relevé et Saisir un relevé

**Ajouter un relevé** sert à archiver le relevé bancaire : période, solde final, note et PDF. Cette action doit rester simple.

**Saisir un relevé** sert à travailler à partir d'un relevé pour saisir successivement ses opérations et, à terme, vérifier leur cohérence avec le solde bancaire. Cette fonction n'existe pas encore sous cette forme et reste à concevoir.

Le vocabulaire définitif reste à valider. **Saisir un relevé** est actuellement préféré pour l'utilisateur à un terme plus technique comme **Rapprocher**, sans constituer une décision définitive.

### Justificatifs pendant la saisie

Conformément à UX-25, après chaque opération enregistrée pendant la future saisie successive, la référence du justificatif est attribuée selon le mécanisme existant. L'utilisateur doit pouvoir joindre immédiatement le justificatif ou passer à l'opération suivante lorsqu'il n'est pas disponible, afin d'éviter de reprendre individuellement plusieurs dizaines d'opérations.

### UX-34 — Densité des actions dans la liste des relevés

**Priorité : Basse**

La liste affiche actuellement **Voir / Télécharger / Modifier / Supprimer** pour chaque relevé. Avec plusieurs dizaines de relevés, cet affichage devient dense. Il faudra étudier le maintien de **Voir** comme action principale, des actions secondaires moins envahissantes et éventuellement un menu d'actions. Aucune décision définitive d'interface n'est prise à ce stade.

### Audit technique requis avant implémentation

Avant toute implémentation de la saisie ou du rapprochement, l'audit du code et du modèle existants doit déterminer :

- les tables utilisées pour les relevés ;
- le stockage des dates de période ;
- le stockage du solde final ;
- le stockage ou la référence du PDF ;
- la relation éventuelle avec les comptes ;
- la relation éventuelle avec les opérations ;
- les règles RLS ;
- les droits owner, manager et read_only ;
- le comportement de suppression d'un relevé ;
- les éventuelles contraintes de période ;
- la logique actuelle de calcul des soldes.

Aucune migration ne doit être proposée avant cet audit technique.

## 28. Audit 17 — Documents et justificatifs

### Principes métier

**MET-11 — Validé, priorité très haute.** Une opération, une référence de pièce et un document sont trois notions distinctes. Une opération peut recevoir une référence de pièce même si aucun fichier n'est joint. La présence d'un justificatif ne doit pas devenir une obligation générale pour toutes les recettes et dépenses.

Le besoin dépend du contexte : facture ou ticket pour une dépense, justificatif possible mais moins fréquent pour une recette, facture annuelle ou échéancier couvrant plusieurs paiements, ou document difficilement accessible pour certains abonnements.

**UX-25 — Priorité très haute.** Pendant une future saisie en série, après l'enregistrement et l'attribution de la référence, l'utilisateur doit pouvoir joindre un justificatif ou continuer sans justificatif.

**UX-35 — Priorité haute.** La référence automatique de pièce doit être affichée comme une information non modifiable.

### Décisions documentaires

- **DOC-01 — Très haute :** le justificatif reste facultatif selon le contexte.
- **DOC-02 — Très haute, à étudier :** permettre à un même document d'être relié à plusieurs opérations.
- **DOC-03 — Très haute :** ne pas dupliquer physiquement un PDF unique couvrant plusieurs paiements récurrents.
- **DOC-04 — Haute :** les justificatifs peuvent concerner les dépenses comme les recettes.
- **DOC-05 — Haute :** prévoir les factures et échéanciers couvrant plusieurs débits.
- **DOC-06 — Très haute :** créer à terme une vue **Documents** au niveau du dossier.
- **DOC-07 — Très haute :** prévoir recherche et filtres par référence, nom, date, type, compte, catégorie et autres critères utiles.
- **DOC-08 — Très haute :** distinguer fonctionnellement documents comptables et documents généraux sans créer deux stockages indépendants.
- **DOC-09 — Haute :** conserver les relevés dans Gestion financière tout en les rendant retrouvables depuis Documents.
- **DOC-10 — Très haute, à étudier :** permettre une relation plusieurs opérations ↔ plusieurs documents.
- **DOC-11 — Très haute :** gérer aussi les documents sans opération — jugement, ordonnance, mandat, notaire, immobilier, correspondance, documents du juge, procès-verbaux, etc.

La vue ne doit pas charger immédiatement des centaines ou milliers de documents dans une liste unique. L'entrée doit commencer par de grandes familles — Relevés bancaires, Justificatifs, Documents administratifs — puis proposer recherche et filtrage. Il ne faut pas concevoir à ce stade une GED complexe avec une arborescence profonde.

**NAV-16 — Priorité très haute.** Documents doit devenir à terme un domaine important du dossier.

### Correction, suppression et permanence des références

**UX-36 — Priorité très haute.** Étudier la correction d'une opération créée avec le mauvais type, notamment Dépense ↔ Recette.

**MET-12 — Priorité très haute, audit requis.** Auditer la permanence et la séquence des références de pièces. La suppression d'une opération peut actuellement laisser un trou ; les anciennes références ne doivent pas être renumérotées automatiquement.

**MET-13 — Priorité très haute, à étudier.** Une annulation logique pourrait être préférable à une suppression physique lorsqu'une référence a déjà pu être utilisée, par exemple `2026-0008 — ANNULÉE`. Cette piste n'est ni implémentée ni définitivement validée.

**MET-14 — Priorité très haute, audit spécifique requis.** Une conversion vers ou depuis un virement peut impliquer des mouvements liés et ne doit pas être traitée comme une simple correction de type.

## 29. Audit 18 — Compte de gestion

### Cycle métier confirmé

Le cycle technique existant doit être conservé sans simplification :

`draft / En préparation → ready / Prêt → generated / Projet généré → finalized / Finalisé → transmitted / Transmis → approved / Approuvé` ou `difficulty / Difficulté signalée`.

### Parcours et présentation

- **CG-01 — Très haute :** mieux articuler Exercice de gestion → Compte de gestion.
- **CG-02 — Haute, à étudier :** remplacer éventuellement le formulaire permanent Début/Fin/Année de la liste par l'action **Préparer un compte de gestion**, ouvrant une interface dédiée légère.
- **CG-03 — Très haute :** réutiliser les exercices existants pour éviter de ressaisir période et année lorsqu'ils fournissent déjà ces données, sans supprimer les cas particuliers avant audit métier.
- **CG-04 — À étudier, non validé :** une navigation horizontale interne a été envisagée, mais n'est pas retenue à ce stade. La priorité est l'amélioration de la page longue existante.
- **CG-05 — Haute :** conserver les cartes de complétude cliquables et mieux conduire vers l'élément réellement problématique.

Principe validé : **une rubrique complète se résume ; une rubrique incomplète explique ce qu'il reste à faire.**

### Comptes et placements retenus

**CG-06 — Priorité haute.** Lorsqu'un compte est inclus automatiquement par la règle existante, afficher une ligne ou carte compacte avec **Inclus automatiquement** et un lien discret **Modifier**, sans validation humaine supplémentaire. Lorsqu'une décision ou exception est nécessaire, conserver une présentation développée et demander explicitement le choix. Le moteur automatique, les exceptions manuelles et leurs justifications doivent être préservés.

### Complétude et passage à l'état prêt

**CG-08 — Priorité très haute.** Chaque problème calculé doit être visible dans sa rubrique, par exemple :

- Situation de fin indisponible — SG CC - 7306 - FL
- Relevé manquant — Tarneaud Senior - 1358
- 11 opérations sans classement officiel

Une mise en évidence sobre mais nette, telle qu'un fond ou une bordure orange légère, peut signaler les éléments nécessitant une intervention. Il ne faut pas créer un nouveau moteur : PatriGest calcule déjà une grande partie de ces messages.

**CG-09 — Priorité très haute.** Le mécanisme actuel **Marquer comme prêt** possède déjà une confirmation, un recalcul serveur de complétude et un blocage des rapports incomplets. Il doit être conservé. Seul un libellé plus explicite, tel que **Finaliser la préparation**, est à étudier.

### PDF PROJET existant

Le PDF PROJET existe déjà et ne doit pas être réimplémenté avec un second moteur. Il utilise le même moteur que le PDF final, avec modes `draft` et `final`, filigrane **PROJET**, mention **DOCUMENT DE TRAVAIL — NON FINALISÉ**, snapshot versionné, stockage privé et fichier projet dédié.

Aujourd'hui, il n'est générable qu'après `draft → ready` et seulement si le compte est complet. Il ne peut donc pas servir de document de travail pendant la préparation.

**CG-10 — Priorité très haute, à étudier.** Rendre le moteur PDF PROJET existant accessible pendant `draft`, sans changer le statut et sans contourner les protections de finalisation. Le document doit rester clairement identifié comme projet.

**CG-11 — Priorité très haute, à étudier.** Rendre les éléments manquants immédiatement visibles dans la page et, si pertinent après audit métier et technique, dans le PDF PROJET. Un encadré synthétique en tête et/ou une mise en évidence orange locale sont des pistes conceptuelles ; la mise en page n'est pas figée.

## 30. Audit 19 — Catégories et classement officiel

### Modèle confirmé

PatriGest distingue correctement la catégorie personnelle de travail et le poste officiel terminal. Les catégories personnelles appartiennent à l'utilisateur et peuvent être utilisées dans plusieurs dossiers.

Le référentiel contient exactement 18 postes officiels de recettes et 38 postes officiels de dépenses, soit 56 postes, selon la structure logique : Section → Rubrique/groupe → Poste officiel terminal.

Dans l'exemple Dépenses → Les dépenses de la vie courante → Alimentation/Habillement/etc. → Autre (précisez), **Les dépenses de la vie courante** n'est pas une ligne comptable sélectionnable : elle ne possède ni UUID ni code officiel et sert uniquement de groupe. Il ne faut pas décider de la transformer en poste comptable.

La vérification du modèle officiel annexé à l'arrêté du 4 juillet 2024 confirme que cette appellation est une rubrique regroupant des postes et que **Autre (précisez)** est un poste prévu par le modèle.

### Décisions

- **CAT-01 — Très haute :** conserver et mieux expliquer catégorie de travail ≠ classement officiel.
- **CAT-02 — Très haute :** préserver la nomenclature officielle terminale et son ordre.
- **CAT-03 — Très haute :** ne plus traiter **Autre (précisez)** comme un fourre-tout opaque.
- **CAT-04 — Très haute, à concevoir :** gérer réellement la précision associée à un poste **Autre (précisez)**.
- **CAT-05 — Très haute :** depuis le compte de gestion, rendre accessibles les opérations sans classement officiel.
- **CAT-06 — Haute :** lever l'ambiguïté du formulaire, où **Rubrique officielle** désigne actuellement un poste terminal.

PatriGest possède 13 postes **Autre (précisez)** mais aucun champ de précision. Pour une catégorie **Abonnements** rattachée à Dépenses → Les dépenses de la vie courante → Autre (précisez), le nom de la catégorie peut éventuellement être proposé comme précision, sans être repris automatiquement dans tous les cas. Une catégorie **Divers** ne constituerait pas nécessairement une précision utile.

La possibilité d'afficher un total officiel puis sa composition — par exemple Abonnements, Produits divers et Services divers — reste conceptuelle. Sa présentation PDF et sa portée réglementaire ne sont pas validées.

Le moteur conserve actuellement seulement le nombre d'opérations non classées, pas leurs identifiants. L'objectif futur **11 opérations sans classement officiel → Voir et classer les 11 opérations** exige donc un audit préalable.

Une présentation plus claire du formulaire pourrait distinguer Rubrique, Poste et, uniquement pour **Autre**, Précision. Cette présentation n'est pas une spécification d'implémentation.

### Reclassement historique — MET-19

**Priorité très haute, audit métier et technique requis.** Une opération conserve seulement `category_id`, et le mapping officiel est résolu dynamiquement depuis la catégorie. Modifier `official_category_id` reclasse donc les anciennes opérations dans les calculs futurs. Comme une catégorie peut être utilisée dans plusieurs dossiers, l'impact peut couvrir plusieurs dossiers, exercices et comptes de gestion encore calculés depuis les données vivantes.

Il n'existe actuellement ni date d'effet, ni historique de mapping, ni mapping propre à l'opération, ni analyse préalable du nombre d'opérations touchées. Les snapshots et PDF déjà générés restent protégés. Toutefois, le PDF final étant recalculé lors de la finalisation, une modification entre le PDF PROJET et la finalisation peut produire une différence. Aucune solution technique définitive n'est retenue à ce stade.

## 31. Principes transversaux consolidés

- Nécessaire maintenant ≠ nécessaire avant le compte de gestion.
- L'application calcule ou propose lorsque la règle est sûre ; l'utilisateur décide lorsque le cas exige un choix métier.
- Une rubrique complète se résume ; une rubrique incomplète explique ce qu'il reste à faire.
- Une action dépend de l'état métier, pas seulement de la date.
- Ne pas dupliquer une information ou une action lorsqu'une action plus pertinente existe déjà.
- Opération, référence de pièce et document sont trois notions distinctes.
- Préserver les snapshots et les documents historiques.
- Améliorer et réutiliser l'existant avant de créer de nouveaux mécanismes.

## 32. Audit restant

À ce stade, l'audit ne doit pas être considéré comme terminé. Restent à examiner :

1. Relevés bancaires — **AUDIT FONCTIONNEL INITIAL TERMINÉ** ; un audit technique du modèle des relevés est nécessaire avant implémentation
2. Justificatifs et documents — **AUDIT FONCTIONNEL INITIAL TERMINÉ** ; audits métier et technique nécessaires avant évolution du modèle documentaire
3. Compte de gestion — **AUDIT FONCTIONNEL ET TECHNIQUE INITIAL TERMINÉ** ; décisions CG marquées à étudier à approfondir avant implémentation
4. Catégories — **AUDIT TECHNIQUE INITIAL TERMINÉ** ; décisions métier requises sur la précision et le reclassement historique
5. Navigation et retours sur les autres écrans
6. États vides, erreurs et confirmations
7. Comportement selon les rôles propriétaire, gestionnaire et lecture seule
8. Responsive et mobile si nécessaire
9. Synthèse finale
10. Découpage en lots d'implémentation
11. Stratégie de version future après validation de l'audit

L'audit reste **EN COURS**. Les éléments marqués **À ÉTUDIER** ou **AUDIT TECHNIQUE/MÉTIER REQUIS** ne constituent pas des spécifications validées. Aucun démarrage de l'implémentation n'est décidé dans ce document.

## 33. Règles pour la suite

- Ne pas implémenter une décision simplement parce qu'elle figure dans ce document.
- Terminer l'audit avant de lancer la refonte globale.
- Isoler éventuellement certaines améliorations indépendantes après validation explicite.
- Conserver les règles métier existantes.
- Conserver la sécurité et les RLS.
- Ne pas modifier les modèles métier sans audit préalable.
- Vérifier les redirections et les retours après chaque action.
- Tester chaque évolution avec les rôles existants.
- Maintenir lint, TypeScript, build et `git diff --check` au vert lors des futures implémentations.
