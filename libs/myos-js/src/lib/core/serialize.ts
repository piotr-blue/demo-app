type QueryValue =
  | string
  | number
  | boolean
  | null
  | undefined
  | ReadonlyArray<string | number | boolean | null | undefined>;

export type QueryParams = Readonly<Record<string, QueryValue>>;
export type PathParams = Readonly<Record<string, string | number>>;

export function joinUrl(baseUrl: string, path: string): string {
  const normalizedBase = baseUrl.endsWith('/') ? baseUrl.slice(0, -1) : baseUrl;
  const normalizedPath = path.startsWith('/') ? path : `/${path}`;
  return `${normalizedBase}${normalizedPath}`;
}

export function expandPath(template: string, params?: PathParams): string {
  if (!params) {
    return template;
  }
  return template.replace(/\{([^}]+)\}/gu, (_, key: string) => {
    const value = params[key];
    if (value === undefined || value === null) {
      throw new Error(`Missing required path parameter: ${key}`);
    }
    return encodeURIComponent(String(value));
  });
}

export function serializeQuery(params?: QueryParams): string {
  if (!params) {
    return '';
  }
  const search = new URLSearchParams();
  for (const [key, rawValue] of Object.entries(params)) {
    if (rawValue === undefined || rawValue === null) {
      continue;
    }
    if (Array.isArray(rawValue)) {
      const filtered = rawValue.filter(
        (value): value is string | number | boolean =>
          value !== null && value !== undefined,
      );
      if (filtered.length === 0) {
        continue;
      }
      search.set(key, filtered.join(','));
      continue;
    }
    search.set(key, String(rawValue));
  }
  const result = search.toString();
  return result.length > 0 ? `?${result}` : '';
}
