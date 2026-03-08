import { paginate, type PaginatedResult } from '../core/pagination.js';
import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type { OperationResponse } from '../generated/operation-types.js';

export interface MeDocumentsListParams {
  readonly sessionType?:
    | 'onlyAgents'
    | 'excludeAgents'
    | 'onlyInstalledAgents'
    | 'all';
  readonly accessType?: 'owned' | 'shared' | 'public' | 'all';
  readonly documentId?: string;
  readonly nextPageToken?: string;
  readonly pageSize?: number;
}

export interface InboxListParams {
  readonly q?: string;
  readonly kv?: string;
  readonly geoLat?: number;
  readonly geoLon?: number;
  readonly geoRadiusKm?: number;
  readonly nextPageToken?: string;
  readonly pageSize?: number;
}

export interface RecentlyUsedListParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly sessionType?:
    | 'onlyAgents'
    | 'excludeAgents'
    | 'onlyInstalledAgents'
    | 'all';
  readonly accessType?: 'owned' | 'shared' | 'public' | 'all';
}

export interface SearchDocumentsParams {
  readonly scope: 'inbox' | 'public' | 'linked' | 'global';
  readonly q?: string;
  readonly cursor?: string;
  readonly nextPageToken?: string;
  readonly limit?: number;
  readonly mainDocumentId?: string;
  readonly mainSessionId?: string;
  readonly anchor?: string;
  readonly kv?: string;
  readonly geoLat?: number;
  readonly geoLon?: number;
  readonly geoRadiusKm?: number;
}

export class MeResource extends ResourceBase {
  readonly documents = {
    list: (
      params?: MeDocumentsListParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getMyDocuments'>> =>
      this.execute('getMyDocuments', 'GET', '/me/documents', {
        query: params,
        requestOptions,
      }),
    autoPaging: (
      params?: MeDocumentsListParams,
      requestOptions?: RequestOptions,
    ): AsyncIterable<unknown> =>
      paginate(
        (nextParams) =>
          this.documents.list(
            {
              ...params,
              nextPageToken: nextParams?.nextPageToken ?? params?.nextPageToken,
            },
            requestOptions,
          ) as Promise<PaginatedResult<unknown>>,
      ),
  } as const;

  readonly inbox = {
    list: (
      params?: InboxListParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getInbox'>> =>
      this.execute('getInbox', 'GET', '/me/inbox', {
        query: params,
        requestOptions,
      }),
    autoPaging: (
      params?: InboxListParams,
      requestOptions?: RequestOptions,
    ): AsyncIterable<unknown> =>
      paginate(
        (nextParams) =>
          this.inbox.list(
            {
              ...params,
              nextPageToken: nextParams?.nextPageToken ?? params?.nextPageToken,
            },
            requestOptions,
          ) as Promise<PaginatedResult<unknown>>,
      ),
  } as const;

  readonly recentlyUsed = {
    list: (
      params?: RecentlyUsedListParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listRecentlyUsedDocuments'>> =>
      this.execute('listRecentlyUsedDocuments', 'GET', '/me/recently-used', {
        query: params,
        requestOptions,
      }),
  } as const;

  readonly search = {
    documents: (
      params: SearchDocumentsParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getSearchDocuments'>> =>
      this.execute('getSearchDocuments', 'GET', '/me/search/documents', {
        query: {
          ...params,
          cursor: params.cursor ?? params.nextPageToken,
        },
        requestOptions,
      }),
  } as const;

  readonly starred = {
    list: (
      params?: MeDocumentsListParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getStarredDocuments'>> =>
      this.execute('getStarredDocuments', 'GET', '/me/starred', {
        query: params,
        requestOptions,
      }),
    add: (
      sessionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'starDocument'>> =>
      this.execute('starDocument', 'PUT', '/me/starred/{sessionId}', {
        path: { sessionId },
        requestOptions,
      }),
    remove: (
      sessionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'unstarDocument'>> =>
      this.execute('unstarDocument', 'DELETE', '/me/starred/{sessionId}', {
        path: { sessionId },
        requestOptions,
      }),
    star: (
      sessionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'starDocument'>> =>
      this.starred.add(sessionId, requestOptions),
    unstar: (
      sessionId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'unstarDocument'>> =>
      this.starred.remove(sessionId, requestOptions),
  } as const;
}
