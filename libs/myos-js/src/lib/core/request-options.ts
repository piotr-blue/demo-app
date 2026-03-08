export interface RequestOptions {
  readonly headers?: Readonly<Record<string, string>>;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly blueContext?: string | Readonly<Record<string, string>>;
  readonly signal?: AbortSignal;
}

export type BlueContextHeaderValue = string;

export function toBlueContextHeaderValue(
  blueContext: RequestOptions['blueContext'],
): BlueContextHeaderValue | undefined {
  if (!blueContext) {
    return undefined;
  }
  if (typeof blueContext === 'string') {
    return blueContext;
  }
  return JSON.stringify(blueContext);
}
