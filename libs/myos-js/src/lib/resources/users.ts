import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type { OperationResponse } from '../generated/operation-types.js';

export class UsersResource extends ResourceBase {
  getByIds(
    ids: readonly string[],
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'getUsersByIds'>> {
    return this.execute('getUsersByIds', 'GET', '/users', {
      query: { ids },
      requestOptions,
    });
  }
}
