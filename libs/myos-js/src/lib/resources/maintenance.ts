import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type {
  OperationRequest,
  OperationResponse,
} from '../generated/operation-types.js';

export class MaintenanceResource extends ResourceBase {
  cleanupIdempotency(
    payload?: OperationRequest<'cleanupIdempotency'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'cleanupIdempotency'>> {
    return this.execute(
      'cleanupIdempotency',
      'POST',
      '/maintenance/idempotency/cleanup',
      {
        body: payload,
        requestOptions,
      },
    );
  }

  flushOutbox(
    payload?: OperationRequest<'flushOutbox'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'flushOutbox'>> {
    return this.execute(
      'flushOutbox',
      'POST',
      '/maintenance/idempotency/outbox',
      {
        body: payload,
        requestOptions,
      },
    );
  }

  createExpiredIdempotency(
    payload: OperationRequest<'createExpiredIdempotency'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'createExpiredIdempotency'>> {
    return this.execute(
      'createExpiredIdempotency',
      'POST',
      '/maintenance/test-data/expired-idempotency',
      {
        body: payload,
        requestOptions,
      },
    );
  }
}
