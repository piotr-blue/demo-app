import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type {
  OperationRequest,
  OperationResponse,
} from '../generated/operation-types.js';

export interface ListApiKeysParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
}

export class ApiKeysResource extends ResourceBase {
  list(
    params?: ListApiKeysParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'listApiKeys'>> {
    return this.execute('listApiKeys', 'GET', '/api-keys', {
      query: params,
      requestOptions,
    });
  }

  create(
    payload: OperationRequest<'createApiKey'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'createApiKey'>> {
    return this.execute('createApiKey', 'POST', '/api-keys', {
      body: payload,
      requestOptions,
    });
  }

  del(
    id: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteApiKey'>> {
    return this.execute('deleteApiKey', 'DELETE', '/api-keys/{id}', {
      path: { id },
      requestOptions,
    });
  }

  delete(
    id: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteApiKey'>> {
    return this.del(id, requestOptions);
  }
}
