export function getErrorMessage(error: unknown): string {
  return error instanceof Error ? error.message : 'UNKNOWN_ERROR'
}

export function getErrorDetails(error: unknown): { message: string; stack?: string } {
  if (error instanceof Error) {
    return {
      message: error.message,
      stack: error.stack,
    }
  }

  return {
    message: String(error),
  }
}
