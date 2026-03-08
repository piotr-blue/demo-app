import { MyOsHttpClient } from './core/http-client.js';
import type {
  HttpRequestOptions,
  HttpResponseEnvelope,
} from './core/http-client.js';
import type { RequestOptions } from './core/request-options.js';
import {
  ApiKeysResource,
  DocumentsResource,
  IntegrationsResource,
  MaintenanceResource,
  MeResource,
  MyOsEventsResource,
  TimelinesResource,
  UserResource,
  UsersResource,
  WebhooksResource,
} from './resources/index.js';

export interface MyOsClientOptions {
  readonly apiKey: string;
  readonly baseUrl?: string;
  readonly timeoutMs?: number;
  readonly maxRetries?: number;
  readonly fetch?: typeof globalThis.fetch;
  readonly defaultRequestOptions?: RequestOptions;
}

export class MyOsClient {
  readonly httpClient: MyOsHttpClient;
  readonly documents: DocumentsResource;
  readonly timelines: TimelinesResource;
  readonly webhooks: WebhooksResource;
  readonly me: MeResource;
  readonly apiKeys: ApiKeysResource;
  readonly user: UserResource;
  readonly users: UsersResource;
  readonly myOsEvents: MyOsEventsResource;
  readonly integrations: IntegrationsResource;
  readonly maintenance: MaintenanceResource;

  constructor(options: MyOsClientOptions) {
    this.httpClient = new MyOsHttpClient(options);
    this.documents = new DocumentsResource(this.httpClient);
    this.timelines = new TimelinesResource(this.httpClient);
    this.webhooks = new WebhooksResource(this.httpClient);
    this.me = new MeResource(this.httpClient);
    this.apiKeys = new ApiKeysResource(this.httpClient);
    this.user = new UserResource(this.httpClient);
    this.users = new UsersResource(this.httpClient);
    this.myOsEvents = new MyOsEventsResource(this.httpClient);
    this.integrations = new IntegrationsResource(this.httpClient);
    this.maintenance = new MaintenanceResource(this.httpClient);
  }

  request<TResponse = unknown, TBody = unknown>(
    options: HttpRequestOptions<TBody>,
  ): Promise<HttpResponseEnvelope<TResponse>> {
    return this.httpClient.request<TResponse, TBody>(options);
  }

  withRequestOptions(options: RequestOptions): MyOsClient {
    return new MyOsClient({
      apiKey: this.httpClient.options.apiKey,
      baseUrl: this.httpClient.options.baseUrl,
      timeoutMs: options.timeoutMs ?? this.httpClient.options.timeoutMs,
      maxRetries: options.maxRetries ?? this.httpClient.options.maxRetries,
      fetch: this.httpClient.options.fetch,
      defaultRequestOptions: {
        ...(this.httpClient.options.defaultRequestOptions ?? {}),
        ...options,
        headers: {
          ...(this.httpClient.options.defaultRequestOptions?.headers ?? {}),
          ...(options.headers ?? {}),
        },
      },
    });
  }
}

export const MyOs = MyOsClient;
