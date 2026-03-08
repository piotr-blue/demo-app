import { MyOsClient } from '../lib/client.js';

export interface RecordedRequest {
  readonly url: string;
  readonly method: string;
  readonly headers: Headers;
  readonly bodyText?: string;
}

export interface FetchMockController {
  readonly requests: RecordedRequest[];
  readonly client: MyOsClient;
  setResponseFactory(
    factory: (request: Request) => Response | Promise<Response>,
  ): void;
}

export function createFetchMockController(): FetchMockController {
  const requests: RecordedRequest[] = [];
  let responseFactory: (
    request: Request,
  ) => Response | Promise<Response> = () =>
    new Response(JSON.stringify({}), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
      },
    });

  const fetchMock: typeof globalThis.fetch = async (
    input: Parameters<typeof globalThis.fetch>[0],
    init?: Parameters<typeof globalThis.fetch>[1],
  ) => {
    const request = new Request(input, init);
    const bodyText = init?.body ? String(init.body) : undefined;
    requests.push({
      url: request.url,
      method: request.method,
      headers: request.headers,
      bodyText,
    });
    return await responseFactory(request);
  };

  return {
    requests,
    client: new MyOsClient({
      apiKey: 'test-api-key',
      baseUrl: 'https://api.dev.myos.blue',
      fetch: fetchMock,
    }),
    setResponseFactory(factory) {
      responseFactory = factory;
    },
  };
}
