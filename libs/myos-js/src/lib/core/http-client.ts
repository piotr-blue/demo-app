import { MyOsError, type MyOsErrorInit, mapErrorByStatus } from './errors.js';
import { redactHeaders } from './redact.js';
import type { RequestOptions } from './request-options.js';
import { toBlueContextHeaderValue } from './request-options.js';
import { joinUrl, serializeQuery, type QueryParams } from './serialize.js';

const DEFAULT_BASE_URL = 'https://api.dev.myos.blue';
const DEFAULT_TIMEOUT_MS = 30_000;
const DEFAULT_MAX_RETRIES = 3;
const BASE_RETRY_DELAY_MS = 250;

export interface MyOsHttpClientOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly fetch?: typeof globalThis.fetch;
  readonly userAgent?: string;
  readonly defaultRequestOptions?: RequestOptions;
}

export interface HttpRequestOptions<TBody = unknown> {
  readonly method: 'GET' | 'POST' | 'PUT' | 'DELETE';
  readonly path: string;
  readonly query?: QueryParams;
  readonly body?: TBody;
  readonly requestOptions?: RequestOptions;
}

export interface HttpResponseEnvelope<TData> {
  readonly data: TData;
  readonly status: number;
  readonly headers: Headers;
  readonly blueContext: string | null;
}

function delay(ms: number): Promise<void> {
  return new Promise((resolve) => {
    setTimeout(resolve, ms);
  });
}

function computeJitteredDelayMs(attempt: number): number {
  const expDelay = BASE_RETRY_DELAY_MS * 2 ** attempt;
  const jitterFactor = 0.75 + Math.random() * 0.5;
  return Math.floor(expDelay * jitterFactor);
}

function shouldRetryStatus(status: number): boolean {
  return status === 429 || status >= 500;
}

export class MyOsHttpClient {
  readonly options: Required<
    Pick<
      MyOsHttpClientOptions,
      'apiKey' | 'baseUrl' | 'timeoutMs' | 'maxRetries'
    >
  > &
    Pick<MyOsHttpClientOptions, 'fetch' | 'userAgent'> & {
      readonly defaultRequestOptions?: RequestOptions;
    };

  private readonly fetchImpl: typeof globalThis.fetch;

  constructor(options: MyOsHttpClientOptions) {
    if (!options.apiKey?.trim()) {
      throw new MyOsError({ message: 'apiKey is required' });
    }
    this.fetchImpl = options.fetch ?? globalThis.fetch;
    if (!this.fetchImpl) {
      throw new MyOsError({
        message:
          'No fetch implementation available. Provide options.fetch in this runtime.',
      });
    }
    this.options = {
      apiKey: options.apiKey.trim(),
      baseUrl: options.baseUrl?.trim() || DEFAULT_BASE_URL,
      timeoutMs: options.timeoutMs ?? DEFAULT_TIMEOUT_MS,
      maxRetries: Math.max(0, options.maxRetries ?? DEFAULT_MAX_RETRIES),
      fetch: options.fetch,
      userAgent: options.userAgent ?? '@blue-labs/myos-js/0.1.0',
      defaultRequestOptions: options.defaultRequestOptions,
    };
  }

  async request<TResponse = unknown, TBody = unknown>(
    options: HttpRequestOptions<TBody>,
  ): Promise<HttpResponseEnvelope<TResponse>> {
    const mergedRequestOptions = mergeRequestOptions(
      this.options.defaultRequestOptions,
      options.requestOptions,
    );
    const timeoutMs = mergedRequestOptions?.timeoutMs ?? this.options.timeoutMs;
    const maxRetries =
      mergedRequestOptions?.maxRetries ?? this.options.maxRetries;
    let attempt = 0;
    while (true) {
      const controller = new AbortController();
      const timeoutHandle = setTimeout(() => controller.abort(), timeoutMs);
      const signal = combineAbortSignals(
        controller.signal,
        mergedRequestOptions?.signal,
      );

      const url = `${joinUrl(this.options.baseUrl, options.path)}${serializeQuery(
        options.query,
      )}`;
      const headers: Record<string, string> = {
        Authorization: this.options.apiKey,
        Accept: 'application/json',
        ...(this.options.userAgent
          ? { 'User-Agent': this.options.userAgent }
          : {}),
        ...(mergedRequestOptions?.headers ?? {}),
      };
      const blueContextHeader = toBlueContextHeaderValue(
        mergedRequestOptions?.blueContext,
      );
      if (blueContextHeader) {
        headers['Blue-Context'] = blueContextHeader;
      }

      if (options.body !== undefined) {
        headers['Content-Type'] = headers['Content-Type'] ?? 'application/json';
      }

      try {
        const response = await this.fetchImpl(url, {
          method: options.method,
          headers,
          body:
            options.body === undefined
              ? undefined
              : JSON.stringify(options.body),
          signal,
        });
        clearTimeout(timeoutHandle);
        const blueContext = response.headers.get('Blue-Context');
        if (response.status >= 200 && response.status < 300) {
          const text = await response.text();
          const data = text
            ? (JSON.parse(text) as TResponse)
            : (undefined as TResponse);
          return {
            data,
            status: response.status,
            headers: response.headers,
            blueContext,
          };
        }

        const errorBodyText = await response.text();
        const errorBody = errorBodyText
          ? tryParseJson(errorBodyText)
          : undefined;
        if (attempt < maxRetries && shouldRetryStatus(response.status)) {
          await delay(computeJitteredDelayMs(attempt));
          attempt += 1;
          continue;
        }
        throw mapErrorByStatus({
          message: buildHttpErrorMessage({
            method: options.method,
            path: options.path,
            status: response.status,
            responseBody: errorBody,
          }),
          statusCode: response.status,
          responseBody: errorBody,
          blueContext,
        });
      } catch (error) {
        clearTimeout(timeoutHandle);
        if (attempt < maxRetries && isRetryableError(error)) {
          await delay(computeJitteredDelayMs(attempt));
          attempt += 1;
          continue;
        }
        if (error instanceof MyOsError) {
          throw error;
        }
        const init: MyOsErrorInit = {
          message: 'MyOS HTTP request failed',
          cause: error,
          responseBody: {
            redactedHeaders: redactHeaders(headers),
          },
        };
        throw new MyOsError(init);
      }
    }
  }
}

interface HttpErrorMessageArgs {
  readonly method: HttpRequestOptions['method'];
  readonly path: string;
  readonly status: number;
  readonly responseBody: unknown;
}

function buildHttpErrorMessage(args: HttpErrorMessageArgs): string {
  const parts = [
    `MyOS API ${args.method} ${args.path} failed with status ${args.status}`,
  ];
  const summary = summarizeErrorBody(args.responseBody);
  if (summary) {
    parts.push(summary);
  }
  const payload = serializeForMessage(args.responseBody);
  if (payload) {
    parts.push(`responseBody=${payload}`);
  }
  return parts.join(' | ');
}

function summarizeErrorBody(responseBody: unknown): string | undefined {
  if (!responseBody) {
    return undefined;
  }
  if (typeof responseBody === 'string') {
    const normalized = responseBody.trim();
    return normalized.length > 0 ? normalized : undefined;
  }
  if (typeof responseBody !== 'object' || Array.isArray(responseBody)) {
    return undefined;
  }

  const body = responseBody as Record<string, unknown>;
  const type = readStringValue(body.type);
  const reason = readStringValue(body.reason);
  const message = readStringValue(body.message);
  const error = readStringValue(body.error);
  const fragments = [
    type ? `type=${type}` : undefined,
    reason ? `reason=${reason}` : undefined,
    message ? `message=${message}` : undefined,
    error ? `error=${error}` : undefined,
  ].filter((value): value is string => Boolean(value));

  return fragments.length > 0 ? fragments.join(' | ') : undefined;
}

function readStringValue(value: unknown): string | undefined {
  return typeof value === 'string' && value.trim().length > 0
    ? value.trim()
    : undefined;
}

function serializeForMessage(value: unknown): string | undefined {
  if (value === undefined) {
    return undefined;
  }
  try {
    const serialized = JSON.stringify(value);
    if (!serialized) {
      return undefined;
    }
    return serialized.length > 2_000
      ? `${serialized.slice(0, 2_000)}...`
      : serialized;
  } catch {
    return String(value);
  }
}

function tryParseJson(input: string): unknown {
  try {
    return JSON.parse(input) as unknown;
  } catch {
    return input;
  }
}

function isRetryableError(error: unknown): boolean {
  if (!error) {
    return false;
  }
  if (error instanceof Error && error.name === 'AbortError') {
    return true;
  }
  if (error instanceof TypeError) {
    return true;
  }
  return false;
}

function combineAbortSignals(
  timeoutSignal: AbortSignal,
  requestSignal: AbortSignal | undefined,
): AbortSignal {
  if (!requestSignal) {
    return timeoutSignal;
  }
  if (typeof AbortSignal.any === 'function') {
    return AbortSignal.any([timeoutSignal, requestSignal]);
  }
  const controller = new AbortController();
  const abort = () => controller.abort();
  timeoutSignal.addEventListener('abort', abort, { once: true });
  requestSignal.addEventListener('abort', abort, { once: true });
  return controller.signal;
}

function mergeRequestOptions(
  defaultOptions: RequestOptions | undefined,
  requestOptions: RequestOptions | undefined,
): RequestOptions | undefined {
  if (!defaultOptions) {
    return requestOptions;
  }
  if (!requestOptions) {
    return defaultOptions;
  }
  return {
    ...defaultOptions,
    ...requestOptions,
    headers: {
      ...(defaultOptions.headers ?? {}),
      ...(requestOptions.headers ?? {}),
    },
  };
}
