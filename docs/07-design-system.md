# Design System â€“ PatriGest

Version : 1.0

---

# 1. Objectif

Le Design System dÃ©finit les rÃ¨gles graphiques de PatriGest.

Son objectif est de garantir :

- une interface homogÃ¨ne ;
- une excellente lisibilitÃ© ;
- une maintenance simplifiÃ©e ;
- une expÃ©rience utilisateur cohÃ©rente.

Aucun Ã©cran ne doit dÃ©finir son propre style graphique.

Toutes les pages utilisent les composants du Design System.

---

# 2. Philosophie

PatriGest est une application de gestion patrimoniale.

L'interface doit inspirer immÃ©diatement :

- confiance ;
- simplicitÃ© ;
- sÃ©rÃ©nitÃ© ;
- professionnalisme.

Le design doit rester sobre.

Les informations sont plus importantes que les effets graphiques.

---

# 3. Style gÃ©nÃ©ral

Le style graphique est inspirÃ© des applications web modernes.

RÃ©fÃ©rences :

- Notion
- Stripe Dashboard
- GitHub
- Vercel
- Applications bancaires modernes

L'objectif est d'obtenir une interface claire et intemporelle.

---

# 4. Palette de couleurs

## Couleur principale

Bleu

```
#2563EB
```

Utilisation :

- boutons principaux ;
- liens ;
- Ã©lÃ©ments actifs ;
- navigation.

---

## Couleur de validation

Vert

```
#16A34A
```

Utilisation :

- validation ;
- succÃ¨s ;
- recettes.

---

## Couleur d'information

Bleu clair

```
#0EA5E9
```

Utilisation :

- informations ;
- aide ;
- patrimoine.

---

## Couleur d'avertissement

Orange

```
#EA580C
```

Utilisation :

- avertissements ;
- rapprochements avec Ã©cart ;
- informations importantes.

---

## Couleur d'erreur

Rouge

```
#DC2626
```

Utilisation :

- suppression ;
- erreurs ;
- danger.

---

## Couleurs neutres

Fond gÃ©nÃ©ral

```
#F8FAFC
```

Cartes

```
#FFFFFF
```

Texte principal

```
#0F172A
```

Texte secondaire

```
#64748B
```

Bordures

```
#E2E8F0
```

---

# 5. Typographie

Police officielle :

**Geist**

Police de secours :

- Inter
- Arial
- Sans-serif

---

## Tailles

Titre principal

32 px

---

Titre de page

24 px

---

Titre de section

20 px

---

Sous-titre

18 px

---

Texte normal

14 px

---

Petit texte

12 px

---

# 6. Espacements

Entre deux sections :

32 px

Entre deux cartes :

24 px

Entre deux champs :

16 px

Padding intÃ©rieur des cartes :

24 px

Padding des formulaires :

24 px

---

# 7. Cartes

Toutes les cartes utilisent :

Fond blanc

Coins :

16 px

Padding :

24 px

Bordure lÃ©gÃ¨re

Ombre discrÃ¨te

Toutes les cartes possÃ¨dent exactement le mÃªme style.

---

# 8. Boutons

Hauteur :

40 px

Coins :

12 px

Police :

14 px

Gras.

---

## Bouton principal

Bleu

CrÃ©er

Enregistrer

Valider

---

## Bouton secondaire

Gris

Retour

Annuler

Fermer

---

## Bouton succÃ¨s

Vert

Confirmer

---

## Bouton danger

Rouge

Supprimer

---

## Bouton discret

Transparent.

UtilisÃ© pour les actions secondaires.

---

# 9. Champs

Tous les champs utilisent :

Hauteur :

40 px

Coins :

12 px

MÃªme style.

MÃªme police.

MÃªme comportement.

---

# 10. Formulaires

Structure identique.

Titre

Description

Sections

Champs

Actions

Les boutons sont toujours placÃ©s Ã  la fin.

---

# 11. Tableaux

Tous les tableaux possÃ¨dent :

Recherche

Tri

Pagination

Actions

Hauteur de ligne :

44 px

MÃªme style sur toute l'application.

---

# 12. Badges

Vert

Actif

Bleu

Information

Orange

Avertissement

Rouge

Erreur

Gris

ArchivÃ©

---

# 13. Messages

SuccÃ¨s

Vert

Information

Bleu

Avertissement

Orange

Erreur

Rouge

Les messages sont toujours rÃ©digÃ©s en franÃ§ais.

---

# 14. BoÃ®tes de dialogue

Les fenÃªtres modales servent uniquement :

- aux confirmations ;
- aux informations ;
- aux actions rapides.

Les formulaires complexes utilisent une page dÃ©diÃ©e.

---

# 15. IcÃ´nes

BibliothÃ¨que officielle :

Lucide React

Taille :

18 px

Une icÃ´ne complÃ¨te toujours un texte.

Elle ne remplace jamais un libellÃ©.

---

# 16. Responsive

Desktop

â‰¥ 1280 px

Tablette

768 Ã  1279 px

TÃ©lÃ©phone

< 768 px

Toutes les fonctionnalitÃ©s restent accessibles sur tous les Ã©crans.

---

# 17. AccessibilitÃ©

Le Design System respecte :

- navigation clavier ;
- contraste Ã©levÃ© ;
- focus visibles ;
- libellÃ©s explicites ;
- HTML sÃ©mantique.

---

# 18. Composants communs

Tous les Ã©crans utilisent exclusivement les composants communs.

Principaux composants :

- AppShell
- AppSidebar
- AppHeader
- AppPageHeader
- AppCard
- AppButton
- AppInput
- AppTextarea
- AppSelect
- AppCheckbox
- AppDatePicker
- AppTable
- AppBadge
- AppAlert
- AppDialog
- AppConfirmDialog
- AppEmptyState
- AppSearchBar
- AppPagination
- AppLoading

Aucun Ã©cran ne redÃ©finit son propre style.

---

# 19. Ã‰volutions

Le mode sombre n'est pas prÃ©vu pour la version 1.

Le Design System devra nÃ©anmoins permettre son ajout ultÃ©rieur sans remise en cause de l'architecture graphique.

---

# 20. Principe fondamental

Toute Ã©volution graphique doit Ãªtre rÃ©alisÃ©e dans les composants communs.

Une modification du Design System doit automatiquement Ãªtre appliquÃ©e Ã  toute l'application.

Le Design System constitue la rÃ©fÃ©rence graphique unique de PatriGest.
