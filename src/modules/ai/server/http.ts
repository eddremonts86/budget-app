export function createJsonResponse(payload: unknown, status = 200): Response {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })
}

export function createJsonErrorResponse(
  error: string,
  status: number,
  extra?: Record<string, unknown>,
): Response {
  return createJsonResponse(
    {
      error,
      ...extra,
    },
    status,
  )
}
