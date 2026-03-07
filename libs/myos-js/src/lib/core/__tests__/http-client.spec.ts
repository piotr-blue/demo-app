import { describe, expect, it } from 'vitest';
import { MyOsHttpClient } from '../http-client.js';
import {
  MyOsNotFoundError,
  MyOsRateLimitError,
  MyOsValidationError,
} from '../errors.js';

describe('MyOsHttpClient', () => {
  it('injects authorization and blue-context headers and captures response context', async () => {
    let capturedRequest: Request | undefined;
    const client = new MyOsHttpClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.dev.myos.blue',
      fetch: async (input, init) => {
        capturedRequest = new Request(input, init);
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: {
            'Content-Type': 'application/json',
            'Blue-Context': '{"Blue Repository":"abc"}',
          },
        });
      },
    });

    const response = await client.request<{ ok: boolean }>({
      method: 'GET',
      path: '/user',
      requestOptions: {
        blueContext: { 'Blue Repository': 'abc' },
      },
    });

    expect(response.data).toEqual({ ok: true });
    expect(response.blueContext).toBe('{"Blue Repository":"abc"}');
    expect(capturedRequest?.headers.get('Authorization')).toBe('test-api-key');
    expect(capturedRequest?.headers.get('Blue-Context')).toBe(
      '{"Blue Repository":"abc"}',
    );
  });

  it('retries transient 429 responses and then succeeds', async () => {
    let attempt = 0;
    const client = new MyOsHttpClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.dev.myos.blue',
      maxRetries: 2,
      fetch: async () => {
        attempt += 1;
        if (attempt === 1) {
          return new Response(JSON.stringify({ error: 'rate_limited' }), {
            status: 429,
            headers: { 'Content-Type': 'application/json' },
          });
        }
        return new Response(JSON.stringify({ success: true }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        });
      },
    });

    const response = await client.request<{ success: boolean }>({
      method: 'GET',
      path: '/timelines',
    });

    expect(attempt).toBe(2);
    expect(response.data.success).toBe(true);
  });

  it('maps status code classes to structured errors', async () => {
    const notFoundClient = new MyOsHttpClient({
      apiKey: 'test-api-key',
      fetch: async () =>
        new Response(JSON.stringify({ message: 'missing' }), {
          status: 404,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    await expect(
      notFoundClient.request({
        method: 'GET',
        path: '/documents/missing',
      }),
    ).rejects.toBeInstanceOf(MyOsNotFoundError);

    const rateLimitClient = new MyOsHttpClient({
      apiKey: 'test-api-key',
      maxRetries: 0,
      fetch: async () =>
        new Response(JSON.stringify({ message: 'slow down' }), {
          status: 429,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    await expect(
      rateLimitClient.request({
        method: 'GET',
        path: '/documents',
      }),
    ).rejects.toBeInstanceOf(MyOsRateLimitError);

    const validationClient = new MyOsHttpClient({
      apiKey: 'test-api-key',
      maxRetries: 0,
      fetch: async () =>
        new Response(JSON.stringify({ message: 'invalid' }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }),
    });
    await expect(
      validationClient.request({
        method: 'POST',
        path: '/documents',
        body: {},
      }),
    ).rejects.toBeInstanceOf(MyOsValidationError);
  });
});
