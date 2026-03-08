export function docLookup(document: unknown, path: string): unknown {
  if (!path.startsWith("/")) {
    return null;
  }
  const segments = path
    .split("/")
    .slice(1)
    .filter((segment) => segment.length > 0);

  let current: unknown = document;
  for (const segment of segments) {
    if (Array.isArray(current)) {
      const index = Number(segment);
      if (!Number.isInteger(index)) {
        return null;
      }
      current = current[index];
      continue;
    }
    if (typeof current !== "object" || current === null) {
      return null;
    }
    current = (current as Record<string, unknown>)[segment];
  }
  return current ?? null;
}

export function formatMoney(value: unknown, currencyCode: string | null): string {
  const number = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(number)) {
    return String(value ?? "");
  }
  if (!currencyCode) {
    return String(number);
  }
  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currencyCode,
      currencyDisplay: "symbol",
      maximumFractionDigits: 2,
      minimumFractionDigits: 0,
    }).format(number);
  } catch {
    return String(number);
  }
}

export function pluralize(
  countValue: unknown,
  singular: unknown,
  plural: unknown
): string {
  const count = typeof countValue === "number" ? countValue : Number(countValue);
  const singularText = String(singular ?? "");
  const pluralText = String(plural ?? "");
  if (!Number.isFinite(count)) {
    return pluralText || singularText;
  }
  return Math.abs(count) === 1 ? singularText : pluralText;
}

export function stringifyTemplateValue(value: unknown): string {
  if (typeof value === "string") {
    return value;
  }
  if (value === null || value === undefined) {
    return "";
  }
  if (typeof value === "number" || typeof value === "boolean") {
    return String(value);
  }
  return JSON.stringify(value);
}

