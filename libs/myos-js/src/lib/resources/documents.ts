import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import {
  buildBootstrapPayload,
  type BootstrapOptions,
  type ChannelBindingsInput,
} from '../dsl/bootstrap-options.js';
import {
  normalizeDocumentInput,
  type BootstrapDocumentInput,
} from '../dsl/document-input.js';
import type {
  OperationRequest,
  OperationResponse,
} from '../generated/operation-types.js';
import { paginate, type PaginatedResult } from '../core/pagination.js';

export interface ListDocumentsParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly isAgent?: boolean;
  readonly documentId?: string;
  readonly ids?: readonly string[];
}

export interface ListEpochsParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly from?: string;
  readonly to?: string;
}

export interface ListFeedEntriesParams {
  readonly nextPageToken?: string;
  readonly order?: 'asc' | 'desc';
  readonly limit?: number;
}

export interface ListLinksParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
  readonly order?: 'asc' | 'desc';
  readonly anchor?: string;
}

export interface ListPendingActionsParams {
  readonly itemsPerPage?: number;
}

export interface StopDocumentProcessingParams {
  readonly message?: string;
  readonly context?: Readonly<Record<string, unknown>>;
}

export interface RunOperationParams {
  readonly pendingActionId?: string;
  readonly eventId?: string;
}

export class DocumentsResource extends ResourceBase {
  readonly epochs = {
    list: (
      sessionId: string,
      params?: ListEpochsParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listEpochs'>> =>
      this.execute('listEpochs', 'GET', '/documents/{sessionId}/epochs', {
        path: { sessionId },
        query: params,
        requestOptions,
      }),
    retrieve: (
      sessionId: string,
      epoch: number | string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getEpoch'>> =>
      this.execute('getEpoch', 'GET', '/documents/{sessionId}/epochs/{epoch}', {
        path: { sessionId, epoch },
        requestOptions,
      }),
  } as const;

  readonly feedEntries = {
    list: (
      sessionId: string,
      params?: ListFeedEntriesParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listFeedEntries'>> =>
      this.execute(
        'listFeedEntries',
        'GET',
        '/documents/{sessionId}/feed-entries',
        {
          path: { sessionId },
          query: params,
          requestOptions,
        },
      ),
  } as const;

  readonly links = {
    list: (
      sessionId: string,
      params?: ListLinksParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listLinks'>> =>
      this.execute('listLinks', 'GET', '/documents/{sessionId}/links', {
        path: { sessionId },
        query: params,
        requestOptions,
      }),
  } as const;

  readonly pendingActions = {
    list: (
      sessionId: string,
      params?: ListPendingActionsParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listPendingActions'>> =>
      this.execute(
        'listPendingActions',
        'GET',
        '/documents/{sessionId}/pending-actions',
        {
          path: { sessionId },
          query: params,
          requestOptions,
        },
      ),
  } as const;

  list(
    params?: ListDocumentsParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'listDocuments'>> {
    return this.execute('listDocuments', 'GET', '/documents', {
      query: {
        ...params,
        ids: params?.ids,
      },
      requestOptions,
    });
  }

  async *listAutoPaging(
    params?: ListDocumentsParams,
    requestOptions?: RequestOptions,
  ): AsyncIterable<unknown> {
    const iterator = paginate(
      (nextParams) =>
        this.list(
          {
            ...params,
            nextPageToken: nextParams?.nextPageToken ?? params?.nextPageToken,
          },
          requestOptions,
        ) as Promise<PaginatedResult<unknown>>,
    );
    for await (const item of iterator) {
      yield item;
    }
  }

  create(
    payload: OperationRequest<'createDocument'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'createDocument'>> {
    return this.execute('createDocument', 'POST', '/documents', {
      body: payload,
      requestOptions,
    });
  }

  bootstrap(
    document: BootstrapDocumentInput,
    channelBindings: ChannelBindingsInput,
    options?: BootstrapOptions,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'createDocumentBootstrap'>> {
    return this.execute(
      'createDocumentBootstrap',
      'POST',
      '/documents/bootstrap',
      {
        body: buildBootstrapPayload({
          document: normalizeDocumentInput(document),
          channelBindings,
          capabilities: options?.capabilities,
          initialMessages: options?.initialMessages,
        }),
        requestOptions,
      },
    );
  }

  retrieve(
    sessionId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'getDocument'>> {
    return this.execute('getDocument', 'GET', '/documents/{sessionId}', {
      path: { sessionId },
      requestOptions,
    });
  }

  update(
    sessionId: string,
    payload: OperationRequest<'updateDocument'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'updateDocument'>> {
    return this.execute('updateDocument', 'PUT', '/documents/{sessionId}', {
      path: { sessionId },
      body: payload,
      requestOptions,
    });
  }

  del(
    sessionId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteDocument'>> {
    return this.execute('deleteDocument', 'DELETE', '/documents/{sessionId}', {
      path: { sessionId },
      requestOptions,
    });
  }

  delete(
    sessionId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteDocument'>> {
    return this.del(sessionId, requestOptions);
  }

  resume(
    sessionId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'resumeDocumentProcessing'>> {
    return this.execute(
      'resumeDocumentProcessing',
      'POST',
      '/documents/{sessionId}/resume',
      {
        path: { sessionId },
        requestOptions,
      },
    );
  }

  stop(
    sessionId: string,
    payload?: StopDocumentProcessingParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'stopDocumentProcessing'>> {
    return this.execute(
      'stopDocumentProcessing',
      'POST',
      '/documents/{sessionId}/stop',
      {
        path: { sessionId },
        body: payload,
        requestOptions,
      },
    );
  }

  runOperation(
    sessionId: string,
    operation: string,
    request?: OperationRequest<'runOperation'>,
    params?: RunOperationParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'runOperation'>> {
    return this.execute(
      'runOperation',
      'POST',
      '/documents/{sessionId}/{operation}',
      {
        path: { sessionId, operation },
        query: params,
        body: request,
        requestOptions,
      },
    );
  }

  callOperation(
    sessionId: string,
    operation: string,
    request?: OperationRequest<'runOperation'>,
    params?: RunOperationParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'runOperation'>> {
    return this.runOperation(
      sessionId,
      operation,
      request,
      params,
      requestOptions,
    );
  }
}
