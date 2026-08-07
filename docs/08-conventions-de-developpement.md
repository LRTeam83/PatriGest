# Conventions de dÃ©veloppement â€“ PatriGest

Version : 1.0

---

# 1. Objectif

Ce document dÃ©finit les rÃ¨gles techniques utilisÃ©es pour dÃ©velopper PatriGest.

Son objectif est de garantir :

- un code homogÃ¨ne ;
- une architecture claire ;
- une maintenance simplifiÃ©e ;
- une Ã©volution maÃ®trisÃ©e du projet.

Toutes les nouvelles fonctionnalitÃ©s devront respecter ces conventions.

---

# 2. Technologies

PatriGest est dÃ©veloppÃ© avec les technologies suivantes.

## Front-end

- Next.js
- React
- TypeScript
- Tailwind CSS

## Back-end

- Supabase
- PostgreSQL
- Supabase Authentication
- Supabase Storage

## DÃ©ploiement

- Vercel

---

# 3. Langue du projet

Le projet utilise deux langues.

## FranÃ§ais

UtilisÃ© pour :

- l'interface utilisateur ;
- les messages ;
- la documentation.

## Anglais

UtilisÃ© pour :

- le code ;
- les tables ;
- les colonnes ;
- les variables ;
- les fonctions.

---

# 4. Organisation du projet

Le projet est organisÃ© de la maniÃ¨re suivante.

```
src/
â”‚
â”œâ”€â”€ app/
â”œâ”€â”€ components/
â”œâ”€â”€ domains/
â”œâ”€â”€ lib/
â”œâ”€â”€ styles/
â”œâ”€â”€ types/
â””â”€â”€ utils/
```

Chaque dossier possÃ¨de une responsabilitÃ© clairement dÃ©finie.

---

# 5. Architecture par domaines

Toute la logique mÃ©tier est regroupÃ©e dans `domains`.

Exemple :

```
domains/

auth/

protected-persons/

financial-accounts/

transactions/

reports/

documents/
```

Chaque domaine contient uniquement les Ã©lÃ©ments qui lui appartiennent.

---

# 6. Composants

Les composants graphiques sont placÃ©s dans :

```
components/ui
```

Les composants de mise en page sont placÃ©s dans :

```
components/layout
```

Les composants mÃ©tiers restent dans leur domaine.

---

# 7. TypeScript

Le mode strict est obligatoire.

Le type `any` est interdit sauf justification exceptionnelle.

Les types doivent Ãªtre explicites.

---

# 8. Nommage

## Fichiers

Tous les fichiers utilisent le format :

```
kebab-case
```

Exemple :

```
create-transaction.ts

financial-account-card.tsx

protected-person-form.tsx
```

---

## Composants React

PascalCase.

Exemple :

```
ProtectedPersonForm
TransactionList
FinancialAccountCard
```

---

## Variables

camelCase.

Exemple :

```
protectedPerson

transactionDate

accountBalance
```

---

## Tables PostgreSQL

Toutes les tables utilisent :

```
snake_case
```

Exemple :

```
protected_persons

financial_accounts

management_periods
```

---

# 9. Base de donnÃ©es

Toutes les tables utilisent :

- UUID
- created_at
- updated_at

Les relations utilisent toujours :

```
xxx_id
```

Exemple :

```
protected_person_id

financial_account_id
```

---

# 10. Migrations

Toutes les modifications passent par une migration.

Convention :

```
YYYYMMDDHHMMSS_description.sql
```

Exemple :

```
20260809090000_create_transactions.sql
```

Une migration validÃ©e ne doit jamais Ãªtre modifiÃ©e.

---

# 11. Validation

Toutes les donnÃ©es provenant d'un formulaire sont validÃ©es avec Zod.

La validation cÃ´tÃ© navigateur amÃ©liore le confort de l'utilisateur.

La validation cÃ´tÃ© serveur reste obligatoire.

---

# 12. Server Actions

Les modifications de donnÃ©es utilisent les Server Actions de Next.js.

Chaque Server Action doit :

- vÃ©rifier l'utilisateur connectÃ© ;
- valider les donnÃ©es ;
- contrÃ´ler les autorisations ;
- appeler un service mÃ©tier.

---

# 13. Services mÃ©tier

Toute logique mÃ©tier est isolÃ©e dans un service.

Exemples :

- createProtectedPerson()
- updateTransaction()
- closeManagementPeriod()

Les composants React ne doivent pas contenir de logique mÃ©tier complexe.

---

# 14. SÃ©curitÃ©

Toutes les tables utilisent Row Level Security.

La sÃ©curitÃ© est assurÃ©e :

- par l'application ;
- par PostgreSQL.

Les deux niveaux sont complÃ©mentaires.

---

# 15. Formulaires

Tous les formulaires utilisent :

- le Design System ;
- les mÃªmes composants ;
- les mÃªmes validations.

Les erreurs sont affichÃ©es en franÃ§ais.

---

# 16. Responsive

Toutes les pages fonctionnent sur :

- ordinateur ;
- tablette ;
- tÃ©lÃ©phone.

Une fonctionnalitÃ© n'est pas terminÃ©e si elle n'est pas utilisable sur mobile.

---

# 17. AccessibilitÃ©

Les composants doivent respecter :

- navigation clavier ;
- contrastes suffisants ;
- focus visibles ;
- HTML sÃ©mantique.

---

# 18. Gestion des erreurs

Les erreurs techniques ne sont jamais affichÃ©es directement Ã  l'utilisateur.

Des messages simples sont utilisÃ©s.

Exemple :

```
Impossible d'enregistrer le dossier.

Veuillez rÃ©essayer.
```

---

# 19. Git

Le dÃ©veloppement est rÃ©alisÃ© sur la branche principale :

```
main
```

Les commits doivent Ãªtre :

- petits ;
- clairs ;
- descriptifs.

Exemples :

```
feat: add protected persons

fix: correct balance calculation

docs: update roadmap
```

---

# 20. ContrÃ´le qualitÃ©

Avant chaque commit important :

```
npm run lint

npm run typecheck

npm run build
```

Les trois commandes doivent rÃ©ussir.

---

# 21. Documentation

Toute Ã©volution importante du projet entraÃ®ne la mise Ã  jour de la documentation correspondante.

La documentation fait partie intÃ©grante du projet.

---

# 22. DÃ©veloppement

Une fonctionnalitÃ© suit toujours le cycle suivant.

1. Conception
2. DÃ©veloppement
3. Tests
4. Validation
5. Documentation
6. Commit Git

Une nouvelle fonctionnalitÃ© ne commence jamais tant que la prÃ©cÃ©dente n'est pas terminÃ©e.

---

# 23. Travail avec Codex

Avant toute demande importante Ã  Codex :

- fournir le contexte ;
- prÃ©ciser l'objectif ;
- indiquer les fichiers concernÃ©s ;
- rappeler les contraintes mÃ©tier.

Codex doit privilÃ©gier les modifications ciblÃ©es plutÃ´t que les rÃ©Ã©critures complÃ¨tes lorsqu'une fonctionnalitÃ© existe dÃ©jÃ .

---

# 24. Principe directeur

Le code doit rester simple Ã  comprendre.

La complexitÃ© doit Ãªtre portÃ©e par l'architecture et les services mÃ©tier, jamais par l'interface utilisateur.

Chaque dÃ©veloppeur intervenant sur PatriGest doit pouvoir comprendre rapidement l'organisation du projet en s'appuyant sur cette documentation.
