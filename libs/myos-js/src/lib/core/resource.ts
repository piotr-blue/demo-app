import type { OperationId, OperationResponse } from '../generated/index.js';
import type { MyOsHttpClient } from './http-client.js';
import type { RequestOptions } from './request-options.js';
import { expandPath, type PathParams, type QueryParams } from './serialize.js';

type Method = 'GET' | 'POST' | 'PUT' | 'DELETE';

export abstract class ResourceBase {
  protected readonly httpClient: MyOsHttpClient;

  constructor(httpClient: MyOsHttpClient) {
    this.httpClient = httpClient;
  }

  protected async execute<TOperation extends OperationId>(
    operationId: TOperation,
    method: Method,
    pathTemplate: string,
    options?: {
      readonly path?: PathParams;
      readonly query?: unknown;
      readonly body?: unknown;
      readonly requestOptions?: RequestOptions;
    },
  ): Promise<OperationResponse<TOperation>> {
    const response = await this.httpClient.request<
      OperationResponse<TOperation>
    >({
      method,
      path: expandPath(pathTemplate, options?.path),
      query: options?.query as QueryParams | undefined,
      body: options?.body,
      requestOptions: options?.requestOptions,
    });
    return response.data;
  }
}
