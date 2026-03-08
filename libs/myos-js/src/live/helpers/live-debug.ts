import type { JsonValue } from '@blue-labs/sdk-dsl';

export function readString(value: unknown): string | undefined {
  return typeof value === 'string' && value.length > 0 ? value : undefined;
}

export function readNumber(value: unknown): number | undefined {
  return typeof value === 'number' && Number.isFinite(value)
    ? value
    : undefined;
}

export function readBoolean(value: unknown): boolean | undefined {
  return typeof value === 'boolean' ? value : undefined;
}

export function readArray(value: unknown): unknown[] {
  return Array.isArray(value) ? value : [];
}

export function readRecord(
  value: unknown,
): Record<string, unknown> | undefined {
  return typeof value === 'object' && value !== null && !Array.isArray(value)
    ? (value as Record<string, unknown>)
    : undefined;
}

export function unwrapDocumentValue(value: unknown): unknown {
  const record = readRecord(value);
  if (record && Object.prototype.hasOwnProperty.call(record, 'value')) {
    return record.value;
  }
  return value;
}

export function compactJson(value: unknown): string {
  try {
    return JSON.stringify(value);
  } catch {
    return String(value);
  }
}

export function cloneJsonValue<T extends JsonValue>(value: T): T {
  return structuredClone(value);
}
