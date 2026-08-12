import { APP_NAME, APP_VERSION } from "@/lib/app";

export type AppRelease = {
  version: string;
  date: string;
  title: string;
  summary: string;
  changes: readonly string[];
};

export const APP_RELEASES: readonly AppRelease[] = [
  {
    version: "0.3.3",
    date: "2026-08-12",
    title: "Justificatifs et gestion des placements",
    summary: `${APP_NAME} permet désormais de numéroter automatiquement les justificatifs de dépenses, de joindre des pièces privées aux opérations et de mieux distinguer les mouvements liés aux placements.`,
    changes: [
      "Saisie des opérations indépendante des exercices",
      "Création rétroactive des exercices",
      "Verrouillage des opérations lorsqu’un exercice est clôturé",
      "Réouverture contrôlée des exercices",
      "Interdiction du chevauchement des exercices",
      "Numérotation automatique des dépenses au format YYYY-NNNN, indépendante par dossier et par année",
      "Référence du justificatif figée après attribution",
      "Ajout de justificatifs PDF, JPEG et PNG dans un stockage privé",
      "Nom automatique des fichiers, par exemple : 2026-0042 - Pharmacie du Centre.pdf",
      "Consultation, téléchargement et remplacement des justificatifs selon les droits owner, manager et read_only",
      "Consultation en lecture seule des opérations ouvertes ou clôturées",
      "Assurances-vie et autres placements exclus des recettes et dépenses ordinaires",
      "Virements vers les placements identifiés comme Versement sur placement",
      "Virements depuis les placements identifiés comme Rachat de placement",
      "Valeur patrimoniale des placements conservée selon leur dernière valorisation",
      "Neutralité patrimoniale des virements internes avec placements",
      "Correction de la création de plusieurs dossiers par un même utilisateur",
    ],
  },
  {
    version: "0.3.2",
    date: "2026-08-10",
    title: "Accès multi-utilisateur et administration",
    summary: `${APP_NAME} permet désormais de gérer les demandes d’accès, les comptes utilisateurs et le partage sécurisé d’un dossier avec des collaborateurs en gestion ou en lecture seule.`,
    changes: [
      "Demande publique d’ouverture de compte",
      "Validation des demandes par le super administrateur",
      "Tableau de bord d’administration dédié",
      "Séparation stricte entre administrateur de plateforme et utilisateur métier",
      "Inscription uniquement après validation ou invitation",
      "Liens d’inscription sécurisés, expirables et régénérables",
      "Gestion des utilisateurs",
      "Invitation d’un collaborateur sur un dossier précis",
      "Rôles Gestionnaire et Lecture seule",
      "Gestion des accès au dossier et retrait immédiat d’un collaborateur",
      "Isolation complète des dossiers entre utilisateurs",
      "Protection RLS adaptée au multi-utilisateur",
      "Accès partagé aux comptes, opérations, valorisations et exercices selon le rôle",
      "Protection des données financières contre l’accès de l’administrateur de plateforme",
    ],
  },
  {
    version: "0.3.1",
    date: "2026-08-09",
    title: "Navigation et ergonomie",
    summary: `${APP_NAME} propose une navigation privée repensée et une interface plus compacte, cohérente et responsive sur l’ensemble des pages métier.`,
    changes: [
      "Nouvelle sidebar de navigation sur desktop et tiroir adapté au mobile",
      "Navigation contextuelle du dossier en cours",
      "Accès direct à Comptes et patrimoine",
      'Ajout de "Gérer les dossiers" pour consulter la liste et créer d’autres dossiers',
      "Réorganisation du dossier : Comptes et patrimoine, Opérations, Exercices de gestion et Informations du dossier",
      "Fil d’Ariane harmonisé et compacté",
      "Densification générale de l’interface privée et harmonisation des titres",
      "Cartes et formulaires plus compacts sur desktop et mobile",
      "Harmonisation des pages Comptes, Opérations, Catégories, Exercices, Informations du dossier et Historique des versions",
      "Journal des opérations, filtres et soldes actuels densifiés",
      `Réouverture contrôlée d’un exercice clôturé avec un dialogue ${APP_NAME}`,
      "Amélioration responsive générale",
    ],
  },
  {
    version: "0.3.0",
    date: "2026-08-09",
    title: "Opérations financières",
    summary: `${APP_NAME} permet désormais de saisir et suivre les recettes, dépenses et virements internes, avec calcul automatique des soldes et contrôle des exercices de gestion.`,
    changes: [
      "Saisie des recettes et dépenses",
      "Virements internes entre comptes",
      "Calcul automatique des soldes",
      "Journal des opérations avec filtres",
      "Catégories système et personnalisées",
      "Catégories utilisables en recettes, dépenses ou les deux",
      "Archivage et réactivation des catégories personnelles",
      "Gestion des exercices de gestion",
      "Verrouillage des opérations sur exercices clôturés",
      "Affichage du patrimoine actuel et des soldes sur la page Opérations",
      "Dernières opérations réelles sur le tableau de bord",
      "Tableau de bord compact et responsive",
      "Fil d’Ariane sur les principales pages métier",
    ],
  },
  {
    version: "0.2.0",
    date: "2026-08-08",
    title: "Comptes et patrimoine",
    summary: `${APP_NAME} permet désormais de gérer les comptes bancaires, les livrets et les placements d'une personne protégée.`,
    changes: [
      "Création et modification des comptes financiers",
      "Gestion des comptes courants et livrets",
      "Gestion des assurances-vie et autres placements",
      "Valorisation des placements",
      "Calcul automatique du patrimoine actif",
      "Clôture et réouverture des comptes",
      'Navigation dédiée "Comptes et patrimoine"',
      "Contrôles de sécurité par dossier",
      `Amélioration des confirmations avec les dialogues ${APP_NAME}`,
    ],
  },
  {
    version: "0.1.0",
    date: "2026-08-07",
    title: `Première version de ${APP_NAME}`,
    summary: `Les fondations de ${APP_NAME} sont en place.`,
    changes: [
      "Page d’accueil publique",
      "Inscription et connexion sécurisées",
      "Gestion des mots de passe",
      "Création des dossiers de personnes protégées",
      "Gestion des mesures de protection",
      "Gestion des exercices de gestion",
      "Tableau de bord privé",
      "Versionnement de l’application",
    ],
  },
];

export const LATEST_RELEASE = APP_RELEASES[0];

if (LATEST_RELEASE.version !== APP_VERSION) {
  throw new Error(
    `La version la plus récente (${LATEST_RELEASE.version}) doit correspondre à APP_VERSION (${APP_VERSION}).`,
  );
}
