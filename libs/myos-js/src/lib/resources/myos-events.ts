import { paginate, type PaginatedResult } from '../core/pagination.js';
import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type { OperationResponse } from '../generated/operation-types.js';

export interface ListMyOsEventsParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly ref?: string;
  readonly type?:
    | 'TIMELINE_ENTRY_CREATED'
    | 'TIMELINE_CREATED'
    | 'DOCUMENT_EPOCH_ADVANCED'
    | 'DOCUMENT_CREATED'
    | 'DOCUMENT_UPDATED'
    | 'DOCUMENT_REMOVED'
    | 'TIMELINE_REMOVED'
    | 'DOCUMENT_PROCESSING_ERROR'
    | 'DOCUMENT_PROCESSING_PAUSED'
    | 'DOCUMENT_PROCESSING_RESUMED';
  readonly from?: string;
  readonly to?: string;
}

export class MyOsEventsResource extends ResourceBase {
  list(
    params?: ListMyOsEventsParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'listMyOSEvents'>> {
    return this.execute('listMyOSEvents', 'GET', '/myos-events', {
      query: params,
      requestOptions,
    });
  }

  autoPaging(
    params?: ListMyOsEventsParams,
    requestOptions?: RequestOptions,
  ): AsyncIterable<unknown> {
    return paginate(
      (nextParams) =>
        this.list(
          {
            ...params,
            nextPageToken: nextParams?.nextPageToken ?? params?.nextPageToken,
          },
          requestOptions,
        ) as Promise<PaginatedResult<unknown>>,
    );
  }

  retrieve(
    eventId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'getMyOSEvents'>> {
    return this.execute('getMyOSEvents', 'GET', '/myos-events/{event}', {
      path: { event: eventId },
      requestOptions,
    });
  }
}
