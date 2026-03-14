function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

function unwrapTemplateValue(value: unknown): unknown {
  let current = value;
  while (isRecord(current) && Object.prototype.hasOwnProperty.call(current, "value")) {
    current = current.value;
  }
  return current;
}

function readPathSegment(value: unknown, segment: string): { matched: boolean; value: unknown } {
  if (Array.isArray(value)) {
    const index = Number(segment);
    if (!Number.isInteger(index)) {
      return { matched: false, value: null };
    }
    return { matched: true, value: value[index] };
  }
  if (!isRecord(value) || !Object.prototype.hasOwnProperty.call(value, segment)) {
    return { matched: false, value: null };
  }
  return { matched: true, value: value[segment] };
}

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
    const direct = readPathSegment(current, segment);
    if (direct.matched) {
      current = direct.value;
      continue;
    }

    const unwrapped = unwrapTemplateValue(current);
    if (unwrapped !== current) {
      const unwrappedSegment = readPathSegment(unwrapped, segment);
      if (unwrappedSegment.matched) {
        current = unwrappedSegment.value;
        continue;
      }
    }

    return null;
  }
  const resolved = unwrapTemplateValue(current);
  return resolved ?? null;
}

export function formatMoney(value: unknown, currencyCode: string | null): string {
  const resolvedValue = unwrapTemplateValue(value);
  const number = typeof resolvedValue === "number" ? resolvedValue : Number(resolvedValue);
  if (!Number.isFinite(number)) {
    return String(resolvedValue ?? "");
  }

  const normalizedCurrency =
    typeof currencyCode === "string" && currencyCode.trim().length > 0
      ? currencyCode.trim().toUpperCase()
      : null;

  const fallbackFractionDigits = 2;
  let fractionDigits = fallbackFractionDigits;
  if (normalizedCurrency) {
    try {
      fractionDigits = new Intl.NumberFormat("en-US", {
        style: "currency",
        currency: normalizedCurrency,
      }).resolvedOptions().maximumFractionDigits ?? fallbackFractionDigits;
    } catch {
      fractionDigits = fallbackFractionDigits;
    }
  }

  const majorUnits = number / 10 ** fractionDigits;
  if (!normalizedCurrency) {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(majorUnits);
  }

  try {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: normalizedCurrency,
      currencyDisplay: "symbol",
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(majorUnits);
  } catch {
    return new Intl.NumberFormat("en-US", {
      maximumFractionDigits: fractionDigits,
      minimumFractionDigits: fractionDigits,
    }).format(majorUnits);
  }
}

export function pluralize(
  countValue: unknown,
  singular: unknown,
  plural: unknown
): string {
  const resolvedCountValue = unwrapTemplateValue(countValue);
  const count =
    typeof resolvedCountValue === "number" ? resolvedCountValue : Number(resolvedCountValue);
  const singularText = String(singular ?? "");
  const pluralText = String(plural ?? "");
  if (!Number.isFinite(count)) {
    return pluralText || singularText;
  }
  return Math.abs(count) === 1 ? singularText : pluralText;
}

export function stringifyTemplateValue(value: unknown): string {
  const resolvedValue = unwrapTemplateValue(value);
  if (typeof resolvedValue === "string") {
    return resolvedValue;
  }
  if (resolvedValue === null || resolvedValue === undefined) {
    return "";
  }
  if (typeof resolvedValue === "number" || typeof resolvedValue === "boolean") {
    return String(resolvedValue);
  }
  return JSON.stringify(resolvedValue);
}
