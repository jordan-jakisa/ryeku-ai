export function logError(error: Error, context?: Record<string, unknown>) {
  // eslint-disable-next-line no-console
  console.error("[AppError]", error, context);
  // TODO: integrate with observability stack (e.g., Sentry, LogRocket)
}
