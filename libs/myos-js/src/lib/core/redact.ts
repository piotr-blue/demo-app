const REDACTED = '[REDACTED]';
const SENSITIVE_HEADERS = new Set([
  'authorization',
  'x-api-key',
  'proxy-authorization',
]);

export function redactHeaders(
  headers: Readonly<Record<string, string>> | undefined,
): Record<string, string> {
  if (!headers) {
    return {};
  }
  return Object.fromEntries(
    Object.entries(headers).map(([name, value]) => {
      if (SENSITIVE_HEADERS.has(name.toLowerCase())) {
        return [name, REDACTED];
      }
      return [name, value];
    }),
  );
}

export function redactText(value: string): string {
  if (!value) {
    return value;
  }
  return value.replace(/Bearer\s+[A-Za-z0-9._-]+/gu, `Bearer ${REDACTED}`);
}
