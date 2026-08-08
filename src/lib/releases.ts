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
