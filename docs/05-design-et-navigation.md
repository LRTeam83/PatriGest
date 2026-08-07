# Design et navigation â€“ PatriGest

Version : 1.0

---

# 1. Objectif

Ce document dÃ©finit l'organisation gÃ©nÃ©rale de l'interface utilisateur de PatriGest.

Son objectif est de garantir une navigation simple, cohÃ©rente et rassurante.

Chaque nouvel Ã©cran devra respecter les rÃ¨gles dÃ©crites dans ce document.

---

# 2. Philosophie

PatriGest est destinÃ© Ã  des utilisateurs qui ne sont pas forcÃ©ment Ã  l'aise avec l'informatique.

L'interface doit Ãªtre :

- simple ;
- moderne ;
- colorÃ©e ;
- rassurante ;
- trÃ¨s lisible.

L'utilisateur doit toujours savoir :

- oÃ¹ il se trouve ;
- ce qu'il est en train de faire ;
- quelle est l'Ã©tape suivante.

---

# 3. Les trois espaces de l'application

PatriGest est composÃ© de trois espaces distincts.

## Site public

Accessible sans connexion.

Il prÃ©sente :

- PatriGest
- FonctionnalitÃ©s
- Captures d'Ã©cran
- Questions frÃ©quentes
- Contact
- Connexion
- CrÃ©er un compte

Cette partie est rÃ©fÃ©rencÃ©e sur les moteurs de recherche.

---

## Authentification

Accessible sans connexion.

Elle comprend :

- Connexion
- Inscription
- Confirmation d'adresse Ã©lectronique
- Mot de passe oubliÃ©
- Nouveau mot de passe

Ces pages ne possÃ¨dent pas de menu latÃ©ral.

---

## Application

Accessible uniquement aprÃ¨s authentification.

Elle comporte :

- un en-tÃªte ;
- un menu latÃ©ral ;
- une zone de travail.

---

# 4. Navigation principale

Le menu latÃ©ral contient uniquement les rubriques principales.

- Tableau de bord
- Dossiers
- Comptes et patrimoine
- OpÃ©rations
- Rapports
- ParamÃ¨tres

Le menu doit rester court.

Aucun sous-menu permanent.

---

# 5. Tableau de bord

AprÃ¨s la connexion, l'utilisateur arrive sur le tableau de bord.

Celui-ci affiche uniquement les informations essentielles.

Exemple :

- Nombre de dossiers
- Patrimoine total
- DerniÃ¨res opÃ©rations
- Dossiers rÃ©cemment modifiÃ©s
- Alertes Ã©ventuelles

Le tableau de bord ne doit jamais Ãªtre surchargÃ©.

---

# 6. Les dossiers

La liste des dossiers permet :

- la recherche ;
- le tri ;
- l'archivage ;
- la crÃ©ation d'un nouveau dossier.

Chaque ligne prÃ©sente notamment :

- Nom
- PrÃ©nom
- Mesure de protection
- Patrimoine
- DerniÃ¨re mise Ã  jour

---

# 7. Navigation dans un dossier

Lorsqu'un dossier est ouvert, une navigation secondaire apparaÃ®t.

Elle comprend :

- Informations gÃ©nÃ©rales
- Mesure de protection
- Comptes et patrimoine
- OpÃ©rations
- Rapports
- Historique

L'utilisateur reste toujours dans le mÃªme dossier jusqu'Ã  sa fermeture.

---

# 8. Les listes

Toutes les listes utilisent la mÃªme prÃ©sentation.

Ordre d'affichage :

- titre ;
- description ;
- actions ;
- recherche ;
- filtres ;
- tableau.

Cette organisation est identique dans toute l'application.

---

# 9. Les formulaires

Tous les formulaires utilisent la mÃªme structure.

- titre ;
- description ;
- sections ;
- bouton Enregistrer ;
- bouton Annuler.

Les formulaires longs sont dÃ©coupÃ©s en plusieurs sections.

---

# 10. Les tableaux

Tous les tableaux prÃ©sentent :

- recherche ;
- tri ;
- pagination ;
- actions.

Le comportement est identique dans toute l'application.

---

# 11. Les boÃ®tes de dialogue

Les fenÃªtres modales sont rÃ©servÃ©es aux actions rapides.

Exemples :

- confirmation de suppression ;
- confirmation de clÃ´ture ;
- information.

Les formulaires complexes utilisent toujours une page dÃ©diÃ©e.

---

# 12. Les messages

Les messages affichÃ©s Ã  l'utilisateur sont rÃ©digÃ©s en franÃ§ais clair.

Exemple :

"Le dossier a Ã©tÃ© enregistrÃ©."

et non :

"Update successful."

Les messages techniques ne sont jamais affichÃ©s.

---

# 13. Les pages vides

Lorsqu'une liste est vide, PatriGest guide l'utilisateur.

Exemple :

"Aucun dossier n'a encore Ã©tÃ© crÃ©Ã©."

Bouton :

CrÃ©er un dossier

Chaque Ã©cran vide doit expliquer la prochaine action.

---

# 14. Les suppressions

Toute suppression demande une confirmation.

Les donnÃ©es financiÃ¨res sont archivÃ©es ou clÃ´turÃ©es plutÃ´t que supprimÃ©es.

---

# 15. Responsive

PatriGest fonctionne sur :

- ordinateur ;
- tablette ;
- tÃ©lÃ©phone.

Toutes les fonctionnalitÃ©s restent accessibles.

Le menu latÃ©ral devient un menu repliable sur mobile.

---

# 16. AccessibilitÃ©

L'application respecte les bonnes pratiques d'accessibilitÃ©.

Notamment :

- navigation clavier ;
- contrastes suffisants ;
- focus visibles ;
- libellÃ©s explicites ;
- HTML sÃ©mantique.

---

# 17. Ergonomie

L'utilisateur ne doit jamais se demander :

"Que dois-je faire maintenant ?"

Chaque Ã©cran conduit naturellement au suivant.

Les actions principales sont toujours clairement visibles.

---

# 18. Parcours utilisateur

Le parcours principal est le suivant.

Connexion

â†“

Tableau de bord

â†“

Choix d'un dossier

â†“

Comptes

â†“

OpÃ©rations

â†“

Rapprochement bancaire

â†“

Rapports

â†“

Compte de gestion

Cette logique doit rester identique dans toute l'application.

---

# 19. Principes d'interface

Chaque Ã©cran doit respecter les rÃ¨gles suivantes.

- Une action principale.
- Peu de boutons.
- Peu de couleurs.
- Beaucoup d'espace.
- Peu de texte.
- Aucun jargon comptable.

L'utilisateur manipule uniquement des notions simples.

---

# 20. Conclusion

L'interface de PatriGest doit inspirer immÃ©diatement confiance.

Elle privilÃ©gie :

- la simplicitÃ© ;
- la lisibilitÃ© ;
- la cohÃ©rence ;
- la rapiditÃ©.

Chaque nouvel Ã©cran devra respecter les principes dÃ©finis dans ce document afin de conserver une expÃ©rience utilisateur homogÃ¨ne.
