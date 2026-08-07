# Cahier des charges â€“ PatriGest

Version : 1.0

---

# 1. Objet du projet

PatriGest est une application web permettant de gÃ©rer le patrimoine financier d'une personne protÃ©gÃ©e.

L'objectif est de fournir un outil simple permettant :

- de suivre les comptes bancaires ;
- de gÃ©rer les placements ;
- de saisir les opÃ©rations figurant sur les relevÃ©s bancaires ;
- de produire automatiquement les Ã©tats de gestion.

PatriGest ne remplace pas un logiciel de comptabilitÃ© gÃ©nÃ©rale.

Il est spÃ©cifiquement conÃ§u pour la gestion des personnes protÃ©gÃ©es.

---

# 2. Objectifs

L'application doit permettre :

- une prise en main rapide ;
- une gestion fiable des opÃ©rations ;
- une parfaite confidentialitÃ© des donnÃ©es ;
- la gÃ©nÃ©ration automatique des rapports ;
- un accÃ¨s depuis n'importe quel ordinateur.

---

# 3. Utilisateurs

Chaque utilisateur possÃ¨de un compte personnel.

Chaque utilisateur gÃ¨re uniquement ses propres dossiers.

Les donnÃ©es sont totalement isolÃ©es des autres utilisateurs.

---

# 4. Authentification

L'application doit proposer :

- crÃ©ation de compte ;
- confirmation par email ;
- connexion ;
- dÃ©connexion ;
- mot de passe oubliÃ© ;
- changement de mot de passe.

L'authentification est assurÃ©e par Supabase Authentication.

---

# 5. Tableau de bord

AprÃ¨s connexion, l'utilisateur accÃ¨de Ã  son tableau de bord.

Celui-ci prÃ©sente notamment :

- nombre de dossiers ;
- patrimoine total ;
- derniÃ¨res opÃ©rations ;
- alertes Ã©ventuelles ;
- accÃ¨s rapide aux dossiers.

---

# 6. Gestion des dossiers

Chaque dossier reprÃ©sente une personne protÃ©gÃ©e.

Un utilisateur peut crÃ©er autant de dossiers que nÃ©cessaire.

Chaque dossier possÃ¨de notamment :

- identitÃ© ;
- coordonnÃ©es ;
- mesure de protection ;
- patrimoine ;
- opÃ©rations ;
- rapports.

---

# 7. Mesures de protection

PatriGest gÃ¨re les mesures suivantes.

## Mesures judiciaires

- Sauvegarde de justice
- Curatelle simple
- Curatelle renforcÃ©e
- Tutelle

## Mesures non judiciaires

- Mandat de protection future
- Habilitation familiale

L'historique des mesures est conservÃ©.

---

# 8. Comptes et patrimoine

Chaque dossier peut contenir plusieurs supports financiers.

Exemples :

- Compte courant
- Livret A
- LDDS
- CSL
- LEP
- PEL
- Assurance-vie
- Compte Ã  terme
- Autre placement

Chaque support possÃ¨de :

- un Ã©tablissement ;
- un intitulÃ© ;
- un solde initial ;
- un historique des opÃ©rations.

---

# 9. Journal des opÃ©rations

Les opÃ©rations sont saisies manuellement Ã  partir des relevÃ©s bancaires.

Chaque opÃ©ration comporte notamment :

- date ;
- libellÃ© ;
- montant ;
- type d'opÃ©ration ;
- catÃ©gorie ;
- commentaire ;
- rÃ©fÃ©rence de justificatif.

---

# 10. CatÃ©gories

PatriGest fournit des catÃ©gories par dÃ©faut.

L'utilisateur peut crÃ©er ses propres catÃ©gories.

Les catÃ©gories servent aux rapports et aux statistiques.

---

# 11. Virements internes

Les mouvements entre deux comptes appartenant Ã  la mÃªme personne protÃ©gÃ©e sont considÃ©rÃ©s comme des virements internes.

Ils ne constituent jamais :

- une recette ;
- une dÃ©pense.

Ils sont suivis sÃ©parÃ©ment.

---

# 12. Rapprochement bancaire

PatriGest permet de vÃ©rifier qu'un relevÃ© bancaire correspond exactement aux opÃ©rations enregistrÃ©es.

Le logiciel compare :

- le solde du relevÃ© bancaire ;
- le solde calculÃ©.

En cas d'Ã©cart, un avertissement est affichÃ©.

---

# 13. Exercices de gestion

Les opÃ©rations sont regroupÃ©es par exercice.

Un exercice possÃ¨de :

- une date de dÃ©but ;
- une date de fin ;
- un statut.

Une fois clÃ´turÃ©, un exercice devient protÃ©gÃ© contre les modifications accidentelles.

---

# 14. Rapports

PatriGest produit notamment :

- journal des opÃ©rations ;
- situation des comptes ;
- recettes ;
- dÃ©penses ;
- mouvements internes ;
- Ã©volution du patrimoine ;
- compte de gestion.

---

# 15. Export PDF

Tous les rapports peuvent Ãªtre exportÃ©s au format PDF.

Les documents sont conÃ§us pour Ãªtre imprimÃ©s.

---

# 16. SÃ©curitÃ©

Les utilisateurs n'accÃ¨dent qu'Ã  leurs propres donnÃ©es.

Toutes les tables sont protÃ©gÃ©es par les politiques de sÃ©curitÃ© PostgreSQL (Row Level Security).

---

# 17. Philosophie de dÃ©veloppement

PatriGest doit toujours rester :

- simple ;
- rapide ;
- fiable ;
- sÃ©curisÃ© ;
- agrÃ©able Ã  utiliser.

Chaque nouvelle fonctionnalitÃ© devra respecter ces principes.

---

# 18. Ã‰volutions prÃ©vues

L'architecture permettra ultÃ©rieurement d'ajouter :

- dÃ©pÃ´t des justificatifs PDF ;
- import de relevÃ©s bancaires ;
- reconnaissance automatique des opÃ©rations ;
- partage sÃ©curisÃ© d'un dossier ;
- historique complet des modifications ;
- application mobile.

Ces fonctionnalitÃ©s ne font pas partie de la version 1.

---

# 19. Objectif final

CrÃ©er une application de rÃ©fÃ©rence pour la gestion patrimoniale des personnes protÃ©gÃ©es.

L'utilisateur doit pouvoir gÃ©rer sereinement ses dossiers sans connaissances comptables particuliÃ¨res.

PatriGest doit privilÃ©gier la simplicitÃ© d'utilisation, la fiabilitÃ© des calculs et la sÃ©curitÃ© des donnÃ©es.
