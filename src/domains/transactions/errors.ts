export const CLOSED_PERIOD_ERROR = "CLOSED_PERIOD";

export function isClosedPeriodError(error: unknown) {
  if (!(error instanceof Error)) return false;
  const message = error.message.toLocaleLowerCase("fr-FR");
  return message === CLOSED_PERIOD_ERROR.toLocaleLowerCase("fr-FR") || message.includes("exercice clôturé");
}
