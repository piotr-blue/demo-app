const SECRET_PATTERNS: RegExp[] = [
  /sk-[A-Za-z0-9_-]{10,}/g,
  /Bearer\s+[A-Za-z0-9._-]+/gi,
];

export function redactSecrets(value: string): string {
  let redacted = value;
  for (const pattern of SECRET_PATTERNS) {
    redacted = redacted.replace(pattern, "[REDACTED]");
  }
  return redacted;
}

export function safeErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return redactSecrets(error.message);
  }
  return "Unexpected error";
}
