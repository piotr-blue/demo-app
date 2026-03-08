import { paginate, type PaginatedResult } from '../core/pagination.js';
import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type {
  OperationRequest,
  OperationResponse,
} from '../generated/operation-types.js';

export interface ListTimelinesParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly scope?: 'owned' | 'shared' | 'all';
  readonly filter?: 'owned' | 'shared' | 'all';
}

export interface CreateTimelineParams {
  readonly name: string;
}

export interface ListTimelineEntriesParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly from?: string;
  readonly to?: string;
  readonly order?: 'asc' | 'desc';
}

export type CreateTimelineEntryParams = OperationRequest<'createTimelineEntry'>;

export type CreateTimelinePermissionParams =
  OperationRequest<'createTimelinePermission'>;

export class TimelinesResource extends ResourceBase {
  readonly entries = {
    list: (
      timelineId: string,
      params?: ListTimelineEntriesParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getTimelineEntries'>> =>
      this.execute(
        'getTimelineEntries',
        'GET',
        '/timelines/{timeline}/entries',
        {
          path: { timeline: timelineId },
          query: params,
          requestOptions,
        },
      ),
    create: (
      timelineId: string,
      payload: CreateTimelineEntryParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'createTimelineEntry'>> =>
      this.execute(
        'createTimelineEntry',
        'POST',
        '/timelines/{timeline}/entries',
        {
          path: { timeline: timelineId },
          body: payload,
          requestOptions,
        },
      ),
    retrieve: (
      timelineId: string,
      entryId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getTimelineEntry'>> =>
      this.execute(
        'getTimelineEntry',
        'GET',
        '/timelines/{timeline}/entries/{entryId}',
        {
          path: { timeline: timelineId, entryId },
          requestOptions,
        },
      ),
    autoPaging: (
      timelineId: string,
      params?: ListTimelineEntriesParams,
      requestOptions?: RequestOptions,
    ): AsyncIterable<unknown> =>
      paginate(
        (nextParams) =>
          this.entries.list(
            timelineId,
            {
              ...params,
              nextPageToken: nextParams?.nextPageToken ?? params?.nextPageToken,
            },
            requestOptions,
          ) as Promise<PaginatedResult<unknown>>,
      ),
  } as const;

  readonly permissions = {
    list: (
      timelineId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listTimelinePermissions'>> =>
      this.execute(
        'listTimelinePermissions',
        'GET',
        '/timelines/{timeline}/permissions',
        {
          path: { timeline: timelineId },
          requestOptions,
        },
      ),
    create: (
      timelineId: string,
      payload: CreateTimelinePermissionParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'createTimelinePermission'>> =>
      this.execute(
        'createTimelinePermission',
        'POST',
        '/timelines/{timeline}/permissions',
        {
          path: { timeline: timelineId },
          body: payload,
          requestOptions,
        },
      ),
    retrieve: (
      timelineId: string,
      permissionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getTimelinePermission'>> =>
      this.execute(
        'getTimelinePermission',
        'GET',
        '/timelines/{timeline}/permissions/{permissionId}',
        {
          path: { timeline: timelineId, permissionId },
          requestOptions,
        },
      ),
    del: (
      timelineId: string,
      permissionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'deleteTimelinePermission'>> =>
      this.execute(
        'deleteTimelinePermission',
        'DELETE',
        '/timelines/{timeline}/permissions/{permissionId}',
        {
          path: { timeline: timelineId, permissionId },
          requestOptions,
        },
      ),
    delete: (
      timelineId: string,
      permissionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'deleteTimelinePermission'>> =>
      this.permissions.del(timelineId, permissionId, requestOptions),
  } as const;

  list(
    params?: ListTimelinesParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'listTimelines'>> {
    return this.execute('listTimelines', 'GET', '/timelines', {
      query: params,
      requestOptions,
    });
  }

  autoPaging(
    params?: ListTimelinesParams,
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

  create(
    payload: CreateTimelineParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'createTimeline'>> {
    return this.execute('createTimeline', 'POST', '/timelines', {
      body: payload,
      requestOptions,
    });
  }

  retrieve(
    timelineId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'getTimeline'>> {
    return this.execute('getTimeline', 'GET', '/timelines/{timeline}', {
      path: { timeline: timelineId },
      requestOptions,
    });
  }

  del(
    timelineId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteTimeline'>> {
    return this.execute('deleteTimeline', 'DELETE', '/timelines/{timeline}', {
      path: { timeline: timelineId },
      requestOptions,
    });
  }

  delete(
    timelineId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteTimeline'>> {
    return this.del(timelineId, requestOptions);
  }
}
