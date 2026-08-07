# SÃ©curitÃ© et droits â€“ PatriGest

Version : 1.0

---

# 1. Objectif

PatriGest gÃ¨re des donnÃ©es personnelles, patrimoniales et financiÃ¨res particuliÃ¨rement sensibles.

La sÃ©curitÃ© constitue donc un Ã©lÃ©ment fondamental de l'application.

Elle doit garantir :

- la confidentialitÃ© des donnÃ©es ;
- leur intÃ©gritÃ© ;
- leur disponibilitÃ© ;
- leur traÃ§abilitÃ©.

---

# 2. Principes

La sÃ©curitÃ© de PatriGest repose sur cinq principes.

## ConfidentialitÃ©

Chaque utilisateur accÃ¨de uniquement Ã  ses propres donnÃ©es.

---

## IntÃ©gritÃ©

Les donnÃ©es ne peuvent pas Ãªtre modifiÃ©es de maniÃ¨re incohÃ©rente.

Les contrÃ´les sont rÃ©alisÃ©s Ã  la fois par l'application et par la base de donnÃ©es.

---

## TraÃ§abilitÃ©

Les crÃ©ations et modifications importantes sont historisÃ©es.

---

## DisponibilitÃ©

Les donnÃ©es doivent rester accessibles de maniÃ¨re fiable.

---

## SimplicitÃ©

La sÃ©curitÃ© ne doit jamais compliquer l'utilisation du logiciel.

---

# 3. Authentification

PatriGest utilise exclusivement Supabase Authentication.

Les fonctionnalitÃ©s disponibles sont :

- crÃ©ation de compte ;
- confirmation d'adresse Ã©lectronique ;
- connexion ;
- dÃ©connexion ;
- mot de passe oubliÃ© ;
- changement de mot de passe.

PatriGest ne stocke jamais les mots de passe.

---

# 4. Isolation des utilisateurs

Chaque utilisateur possÃ¨de un espace totalement indÃ©pendant.

Toutes les donnÃ©es sont rattachÃ©es Ã  son compte.

Un utilisateur ne peut jamais :

- consulter les dossiers d'un autre utilisateur ;
- modifier les donnÃ©es d'un autre utilisateur ;
- gÃ©nÃ©rer un rapport concernant un autre utilisateur.

---

# 5. SÃ©curitÃ© des donnÃ©es

Toutes les tables mÃ©tier utilisent les politiques de sÃ©curitÃ© PostgreSQL (Row Level Security).

La sÃ©curitÃ© est assurÃ©e directement par la base de donnÃ©es.

MÃªme en cas d'erreur dans l'application, les accÃ¨s non autorisÃ©s sont refusÃ©s.

---

# 6. AccÃ¨s aux dossiers

Chaque dossier appartient Ã  un seul utilisateur.

Le propriÃ©taire peut :

- crÃ©er ;
- consulter ;
- modifier ;
- archiver.

Le partage de dossiers ne fait pas partie de la version 1.

---

# 7. Archivage

Les donnÃ©es financiÃ¨res ne doivent pas Ãªtre supprimÃ©es.

Les principes sont les suivants.

## Dossier sans donnÃ©es

Suppression possible.

---

## Dossier contenant des opÃ©rations

Archivage.

---

## Compte possÃ©dant des opÃ©rations

ClÃ´ture.

---

## Exercice terminÃ©

ClÃ´ture.

Les donnÃ©es restent disponibles pour consultation.

---

# 8. Exercices de gestion

Un exercice clÃ´turÃ© devient protÃ©gÃ©.

Les opÃ©rations ne peuvent plus Ãªtre modifiÃ©es accidentellement.

Une rÃ©ouverture reste possible si une correction est rÃ©ellement nÃ©cessaire.

---

# 9. OpÃ©rations financiÃ¨res

Chaque opÃ©ration appartient obligatoirement :

- Ã  un compte ;
- Ã  un dossier.

Une opÃ©ration ne peut jamais Ãªtre partagÃ©e entre plusieurs comptes.

---

# 10. Virements internes

Les virements internes sont crÃ©Ã©s automatiquement.

Ils gÃ©nÃ¨rent :

- une sortie ;
- une entrÃ©e.

Les deux opÃ©rations restent liÃ©es.

La suppression d'une seule partie du virement est impossible.

---

# 11. Calcul des soldes

Les soldes sont calculÃ©s automatiquement.

Ils ne sont jamais modifiÃ©s directement.

Cette rÃ¨gle garantit la cohÃ©rence permanente des comptes.

---

# 12. Rapprochement bancaire

Le rapprochement bancaire permet de vÃ©rifier la cohÃ©rence entre :

- le relevÃ© bancaire ;
- les opÃ©rations enregistrÃ©es.

Chaque rapprochement conserve :

- la date du relevÃ© ;
- le solde bancaire ;
- le solde calculÃ© ;
- l'Ã©ventuel Ã©cart.

---

# 13. Documents

Dans la version 1, PatriGest mÃ©morise uniquement :

- une rÃ©fÃ©rence de justificatif ;
- un commentaire.

Le stockage des documents numÃ©riques sera ajoutÃ© ultÃ©rieurement.

---

# 14. Sauvegarde

Les donnÃ©es sont enregistrÃ©es dÃ¨s leur validation.

L'utilisateur valide explicitement les modifications importantes Ã  l'aide d'un bouton **Enregistrer**.

---

# 15. Communications

Toutes les communications utilisent HTTPS.

Les Ã©changes entre le navigateur et les serveurs sont chiffrÃ©s.

---

# 16. Protection des donnÃ©es personnelles

PatriGest applique les principes du RGPD.

Les donnÃ©es collectÃ©es sont limitÃ©es aux besoins du logiciel.

Les utilisateurs restent propriÃ©taires de leurs informations.

---

# 17. Sauvegardes techniques

La stratÃ©gie de sauvegarde dÃ©pend de l'environnement d'hÃ©bergement retenu.

PatriGest est conÃ§u pour fonctionner avec des sauvegardes rÃ©guliÃ¨res et des procÃ©dures de restauration fiables.

---

# 18. Ã‰volutions prÃ©vues

Les versions futures permettront notamment :

- le partage sÃ©curisÃ© d'un dossier ;
- les accÃ¨s en lecture seule ;
- plusieurs gestionnaires ;
- un historique dÃ©taillÃ© des modifications ;
- la signature Ã©lectronique.

---

# 19. Principes de sÃ©curitÃ©

PatriGest applique toujours les rÃ¨gles suivantes.

- Une personne protÃ©gÃ©e appartient Ã  un seul dossier.
- Un dossier appartient Ã  un seul utilisateur.
- Une opÃ©ration appartient Ã  un seul compte.
- Un compte appartient Ã  un seul dossier.
- Un virement interne concerne uniquement deux comptes du mÃªme dossier.
- Un utilisateur ne peut jamais consulter les donnÃ©es d'un autre utilisateur.

---

# 20. Conclusion

La sÃ©curitÃ© de PatriGest repose sur deux niveaux complÃ©mentaires.

Le premier niveau est assurÃ© par l'application.

Le second niveau est assurÃ© directement par PostgreSQL grÃ¢ce aux politiques Row Level Security.

MÃªme en cas d'erreur de dÃ©veloppement, les donnÃ©es d'un utilisateur restent inaccessibles aux autres utilisateurs.

La confidentialitÃ© constitue un principe fondamental de PatriGest.
