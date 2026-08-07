# ModÃ¨le de donnÃ©es â€“ PatriGest

Version : 1.0

---

# 1. Objectif

Le modÃ¨le de donnÃ©es de PatriGest dÃ©finit la maniÃ¨re dont les informations sont organisÃ©es, stockÃ©es et reliÃ©es entre elles.

Son objectif est de garantir :

- une parfaite cohÃ©rence des donnÃ©es ;
- une excellente Ã©volutivitÃ© ;
- des performances Ã©levÃ©es ;
- une sÃ©curitÃ© maximale ;
- une simplicitÃ© d'utilisation.

Le modÃ¨le est conÃ§u pour rÃ©pondre aux besoins spÃ©cifiques de la gestion patrimoniale des personnes protÃ©gÃ©es.

Il constitue la base de toute l'application.

---

# 2. Principes gÃ©nÃ©raux

Le modÃ¨le de donnÃ©es repose sur quelques principes fondamentaux.

## Un utilisateur possÃ¨de plusieurs dossiers

Chaque utilisateur dispose de son propre espace privÃ©.

Il peut gÃ©rer une ou plusieurs personnes protÃ©gÃ©es.

Les dossiers sont totalement indÃ©pendants.

Exemple :

```
Utilisateur

â”œâ”€â”€ Mme Dupont
â”œâ”€â”€ M. Martin
â””â”€â”€ Mme Durand
```

---

## Un dossier reprÃ©sente une personne protÃ©gÃ©e

Le dossier constitue l'Ã©lÃ©ment principal de PatriGest.

Toutes les informations sont rattachÃ©es Ã  ce dossier.

Un dossier contient notamment :

- les informations personnelles ;
- la mesure de protection ;
- les comptes bancaires ;
- les placements ;
- les opÃ©rations ;
- les exercices de gestion ;
- les documents ;
- les rapports.

---

## Les donnÃ©es sont historisÃ©es

PatriGest privilÃ©gie toujours l'historique plutÃ´t que l'Ã©crasement des informations.

Exemple :

Une personne passe :

Curatelle renforcÃ©e

â†“

Tutelle

L'ancienne mesure est conservÃ©e.

---

## Les donnÃ©es ne sont pas supprimÃ©es

Lorsqu'un dossier possÃ¨de dÃ©jÃ  des opÃ©rations financiÃ¨res, il n'est normalement jamais supprimÃ©.

Il est archivÃ©.

Le mÃªme principe s'applique aux comptes bancaires.

Ils sont clÃ´turÃ©s.

---

# 3. Architecture mÃ©tier

L'organisation gÃ©nÃ©rale des donnÃ©es est la suivante.

```
Utilisateur
        â”‚
        â–¼
Dossiers
        â”‚
        â–¼
Personne protÃ©gÃ©e
        â”‚
        â”œâ”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”
        â–¼              â–¼
Mesure         Exercices de gestion
        â”‚              â”‚
        â””â”€â”€â”€â”€â”€â”€â”¬â”€â”€â”€â”€â”€â”€â”€â”˜
               â–¼
      Comptes et placements
               â”‚
               â–¼
          OpÃ©rations
               â”‚
      â”Œâ”€â”€â”€â”€â”€â”€â”€â”€â”´â”€â”€â”€â”€â”€â”€â”€â”€â”
      â–¼                 â–¼
 Rapprochements     Documents
               â”‚
               â–¼
            Rapports
```

Toute l'application est construite autour de cette architecture.

---

# 4. Les utilisateurs

L'authentification est assurÃ©e par Supabase Authentication.

PatriGest ne stocke jamais les mots de passe.

Chaque utilisateur possÃ¨de :

- une identitÃ© ;
- une adresse Ã©lectronique ;
- un profil.

Chaque utilisateur possÃ¨de un identifiant unique.

Toutes les donnÃ©es lui appartiennent.

---

# 5. Les dossiers

Le dossier constitue le cÅ“ur de PatriGest.

Il reprÃ©sente une personne protÃ©gÃ©e.

Un utilisateur peut crÃ©er autant de dossiers que nÃ©cessaire.

Chaque dossier est totalement indÃ©pendant des autres.

Un dossier peut Ãªtre :

- actif ;
- archivÃ©.

---

## Contenu d'un dossier

Un dossier regroupe toutes les informations concernant la personne protÃ©gÃ©e.

Il contient notamment :

- identitÃ© ;
- coordonnÃ©es ;
- mesure de protection ;
- patrimoine ;
- opÃ©rations financiÃ¨res ;
- documents ;
- rapports.

Toutes les autres donnÃ©es de PatriGest sont rattachÃ©es Ã  un dossier.

---

# 6. La personne protÃ©gÃ©e

Chaque dossier correspond Ã  une personne protÃ©gÃ©e.

Les informations enregistrÃ©es concernent notamment :

- nom ;
- prÃ©nom ;
- nom de naissance ;
- date de naissance ;
- lieu de naissance ;
- adresse ;
- tÃ©lÃ©phone ;
- adresse Ã©lectronique ;
- observations.

Ces informations servent notamment Ã  produire les rapports et le compte de gestion.

---

# 7. Les mesures de protection

Une personne peut connaÃ®tre plusieurs mesures de protection au cours de sa vie.

PatriGest conserve l'historique.

Chaque mesure possÃ¨de :

- un type ;
- une date de dÃ©but ;
- une date de fin Ã©ventuelle ;
- une date de dÃ©cision ;
- les rÃ©fÃ©rences utiles.

---

## Types de mesures

PatriGest gÃ¨re :

### Mesures judiciaires

- Sauvegarde de justice
- Curatelle simple
- Curatelle renforcÃ©e
- Tutelle

### Mesures non judiciaires

- Mandat de protection future
- Habilitation familiale

Une seule mesure est active Ã  un instant donnÃ©.

Les anciennes mesures restent conservÃ©es.

---

# 8. Les exercices de gestion

Les opÃ©rations sont regroupÃ©es par exercice.

Un exercice correspond gÃ©nÃ©ralement Ã  une annÃ©e de gestion.

Exemple :

01 janvier 2027

â†“

31 dÃ©cembre 2027

Chaque exercice possÃ¨de :

- une date de dÃ©but ;
- une date de fin ;
- un statut.

Deux statuts sont prÃ©vus :

- Ouvert
- ClÃ´turÃ©

Lorsqu'un exercice est clÃ´turÃ©, les donnÃ©es deviennent protÃ©gÃ©es contre les modifications accidentelles.

Les rapports sont toujours produits Ã  partir d'un exercice de gestion.

---

# 9. Le patrimoine

Le patrimoine reprÃ©sente l'ensemble des biens financiers gÃ©rÃ©s dans un dossier.

PatriGest distingue les supports financiers des opÃ©rations qui y sont rÃ©alisÃ©es.

Cette sÃ©paration permet de conserver une architecture simple et Ã©volutive.

Le patrimoine peut comprendre :

- un ou plusieurs comptes courants ;
- un ou plusieurs livrets d'Ã©pargne ;
- une ou plusieurs assurances-vie ;
- des comptes Ã  terme ;
- d'autres placements.

Chaque Ã©lÃ©ment du patrimoine est indÃ©pendant.

---

# 10. Les Comptes et patrimoine

Tous les supports financiers sont gÃ©rÃ©s de maniÃ¨re identique.

Un compte financier possÃ¨de notamment :

- un Ã©tablissement financier ;
- un type ;
- un intitulÃ© ;
- une rÃ©fÃ©rence ;
- une date d'ouverture ;
- une date de clÃ´ture Ã©ventuelle ;
- un solde initial ;
- une date de solde initial ;
- un statut.

Cette approche Ã©vite de multiplier les types de comptes dans la base de donnÃ©es.

---

## Types de comptes

PatriGest prend en charge les supports suivants.

### Comptes bancaires

- Compte courant

### Comptes d'Ã©pargne

- Livret A
- LDDS
- CSL
- LEP
- PEL
- Compte Ã  terme

### Placements

- Assurance-vie
- Autre placement

L'architecture permettra d'ajouter de nouveaux types sans modifier la structure gÃ©nÃ©rale.

---

# 11. Les Ã©tablissements financiers

Chaque compte est rattachÃ© Ã  un Ã©tablissement.

Exemples :

- CrÃ©dit Agricole
- SociÃ©tÃ© GÃ©nÃ©rale
- CrÃ©dit Mutuel
- Banque Postale
- Caisse d'Ã‰pargne

Le nom de l'Ã©tablissement est conservÃ© afin d'amÃ©liorer les rapports.

---

# 12. Les opÃ©rations

Les opÃ©rations reprÃ©sentent toutes les Ã©critures figurant sur les relevÃ©s bancaires.

Chaque opÃ©ration appartient obligatoirement Ã  un compte.

Une opÃ©ration possÃ¨de notamment :

- une date d'opÃ©ration ;
- une date de valeur (facultative) ;
- un libellÃ© ;
- un montant ;
- un type ;
- une catÃ©gorie ;
- une rÃ©fÃ©rence de justificatif ;
- un commentaire.

Toutes les opÃ©rations sont conservÃ©es.

Aucune opÃ©ration n'est supprimÃ©e automatiquement.

---

# 13. Les types d'opÃ©rations

PatriGest distingue quatre types d'opÃ©rations.

## Recette

EntrÃ©e d'argent.

Exemples :

- retraite ;
- pension ;
- CAF ;
- remboursement ;
- intÃ©rÃªts.

---

## DÃ©pense

Sortie d'argent.

Exemples :

- loyer ;
- EHPAD ;
- assurance ;
- pharmacie ;
- alimentation.

---

## Virement interne

DÃ©placement d'argent entre deux comptes appartenant Ã  la mÃªme personne protÃ©gÃ©e.

Ce mouvement n'est jamais considÃ©rÃ© comme une recette ou une dÃ©pense.

---

## Ajustement

OpÃ©ration exceptionnelle permettant de corriger une situation particuliÃ¨re.

Son utilisation doit rester exceptionnelle.

---

# 14. Les catÃ©gories

Les catÃ©gories permettent de classer les opÃ©rations.

PatriGest fournit des catÃ©gories par dÃ©faut.

L'utilisateur peut crÃ©er ses propres catÃ©gories.

---

## CatÃ©gories de recettes

Exemples :

- Retraite
- Pension
- CAF
- APL
- IntÃ©rÃªts
- Revenus locatifs
- Remboursements
- Divers

---

## CatÃ©gories de dÃ©penses

Exemples :

- Alimentation
- SantÃ©
- Logement
- Assurance
- TÃ©lÃ©phone
- Loisirs
- Transport
- ImpÃ´ts
- Banque
- Divers

Les catÃ©gories servent exclusivement Ã  produire les rapports et les statistiques.

---

# 15. Les organismes

PatriGest mÃ©morise progressivement les organismes rencontrÃ©s.

Exemples :

- CARSAT
- AGIRC-ARRCO
- CAF
- MSA
- EDF
- Engie
- Veolia
- TrÃ©sor Public
- EHPAD

Chaque organisme peut Ãªtre associÃ© Ã  une catÃ©gorie par dÃ©faut.

Lors de la saisie d'une nouvelle opÃ©ration, PatriGest peut proposer automatiquement cette catÃ©gorie.

L'utilisateur reste toujours libre de la modifier.

---

# 16. Les virements internes

Les virements internes constituent une opÃ©ration particuliÃ¨re.

Ils relient deux comptes appartenant au mÃªme dossier.

Un virement gÃ©nÃ¨re automatiquement :

- une sortie sur le compte d'origine ;
- une entrÃ©e sur le compte de destination.

Ces deux opÃ©rations restent liÃ©es.

Il est impossible de supprimer une seule moitiÃ© d'un virement.

---

# 17. Les rapprochements bancaires

Le rapprochement bancaire permet de vÃ©rifier que toutes les opÃ©rations d'un relevÃ© ont Ã©tÃ© correctement saisies.

Pour chaque relevÃ©, PatriGest mÃ©morise :

- la date du relevÃ© ;
- le solde indiquÃ© par la banque ;
- le solde calculÃ© par PatriGest ;
- l'Ã©cart Ã©ventuel ;
- la date de validation.

Lorsque l'Ã©cart est nul, le relevÃ© est considÃ©rÃ© comme vÃ©rifiÃ©.

Cette fonctionnalitÃ© apporte une garantie supplÃ©mentaire sur la fiabilitÃ© des donnÃ©es.

---

# 18. Les assurances-vie

Les assurances-vie sont considÃ©rÃ©es comme des placements.

Les versements et retraits sont enregistrÃ©s comme des opÃ©rations classiques.

En revanche, la valorisation du contrat est suivie sÃ©parÃ©ment.

Cette distinction permet de diffÃ©rencier :

- les mouvements financiers ;
- l'Ã©volution de la valeur du placement.

---

# 19. Les valorisations

Certains placements Ã©voluent sans opÃ©ration bancaire.

C'est notamment le cas des assurances-vie.

PatriGest permet d'enregistrer des valorisations successives.

Exemple :

01/01/2027

Valeur :

32 500 â‚¬

31/12/2027

Valeur :

34 180 â‚¬

Cette Ã©volution est utilisÃ©e dans les rapports patrimoniaux.

Elle n'est jamais comptabilisÃ©e comme une recette bancaire.

---

# 20. Calcul des soldes

Le solde d'un compte est toujours calculÃ© automatiquement.

Il rÃ©sulte de :

- son solde initial ;
- l'ensemble des opÃ©rations enregistrÃ©es.

L'utilisateur ne modifie jamais directement un solde.

Cette rÃ¨gle garantit la cohÃ©rence de l'ensemble des comptes.

---

# 21. Les documents

Chaque dossier peut contenir des documents.

Dans la version 1 de PatriGest, les documents sont limitÃ©s Ã  une rÃ©fÃ©rence de piÃ¨ce justificative et Ã  un commentaire associÃ© Ã  une opÃ©ration.

Une version ultÃ©rieure permettra d'associer directement des fichiers :

- PDF
- Image
- RelevÃ© bancaire
- Facture
- Courrier
- DÃ©cision de justice

Les documents resteront toujours rattachÃ©s au dossier de la personne protÃ©gÃ©e.

---

# 22. Les rapports

Les rapports sont gÃ©nÃ©rÃ©s automatiquement Ã  partir des donnÃ©es enregistrÃ©es.

Aucune donnÃ©e spÃ©cifique n'est saisie pour produire un rapport.

Les principaux rapports sont :

- Journal des opÃ©rations
- Situation des comptes
- Situation patrimoniale
- Recettes
- DÃ©penses
- Mouvements internes
- Ã‰volution du patrimoine
- Compte de gestion

Tous les rapports utilisent les mÃªmes donnÃ©es de rÃ©fÃ©rence.

---

# 23. Relations entre les donnÃ©es

L'organisation gÃ©nÃ©rale des donnÃ©es est la suivante.

```

Utilisateur
â”‚
â””â”€â”€ Dossiers
â”‚
â”œâ”€â”€ Personne protÃ©gÃ©e
â”‚
â”œâ”€â”€ Mesures de protection
â”‚
â”œâ”€â”€ Exercices de gestion
â”‚
â”œâ”€â”€ Comptes et patrimoine
â”‚ â”‚
â”‚ â”œâ”€â”€ OpÃ©rations
â”‚ â”‚
â”‚ â”œâ”€â”€ Rapprochements bancaires
â”‚ â”‚
â”‚ â””â”€â”€ Valorisations
â”‚
â”œâ”€â”€ Documents
â”‚
â””â”€â”€ Rapports
...
