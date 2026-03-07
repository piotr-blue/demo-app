import { paginate, type PaginatedResult } from '../core/pagination.js';
import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type {
  OperationRequest,
  OperationResponse,
} from '../generated/operation-types.js';

export interface ListWebhooksParams {
  readonly itemsPerPage?: number;
  readonly nextPageToken?: string;
}

export class WebhooksResource extends ResourceBase {
  readonly dispatches = {
    list: (
      webhookId: string,
      params?: ListWebhooksParams,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'listWebhookDispatches'>> =>
      this.execute(
        'listWebhookDispatches',
        'GET',
        '/webhooks/{webhookId}/dispatches',
        {
          path: { webhookId },
          query: params,
          requestOptions,
        },
      ),
    retrieve: (
      webhookId: string,
      eventId: string,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getWebhookDispatch'>> =>
      this.execute(
        'getWebhookDispatch',
        'GET',
        '/webhooks/{webhookId}/dispatches/{eventId}',
        {
          path: { webhookId, eventId },
          requestOptions,
        },
      ),
    attempts: {
      list: (
        webhookId: string,
        eventId: string,
        params?: ListWebhooksParams,
        requestOptions?: RequestOptions,
      ): Promise<OperationResponse<'listWebhookDispatchAttempts'>> =>
        this.execute(
          'listWebhookDispatchAttempts',
          'GET',
          '/webhooks/{webhookId}/dispatches/{eventId}/attempts',
          {
            path: { webhookId, eventId },
            query: params,
            requestOptions,
          },
        ),
    },
  } as const;

  list(
    params?: ListWebhooksParams,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'listWebhooks'>> {
    return this.execute('listWebhooks', 'GET', '/webhooks', {
      query: params,
      requestOptions,
    });
  }

  autoPaging(
    params?: ListWebhooksParams,
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
    payload: OperationRequest<'createWebhook'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'createWebhook'>> {
    return this.execute('createWebhook', 'POST', '/webhooks', {
      body: payload,
      requestOptions,
    });
  }

  retrieve(
    webhookId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'getWebhook'>> {
    return this.execute('getWebhook', 'GET', '/webhooks/{webhookId}', {
      path: { webhookId },
      requestOptions,
    });
  }

  update(
    webhookId: string,
    payload: OperationRequest<'updateWebhook'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'updateWebhook'>> {
    return this.execute('updateWebhook', 'POST', '/webhooks/{webhookId}', {
      path: { webhookId },
      body: payload,
      requestOptions,
    });
  }

  del(
    webhookId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteWebhook'>> {
    return this.execute('deleteWebhook', 'DELETE', '/webhooks/{webhookId}', {
      path: { webhookId },
      requestOptions,
    });
  }

  delete(
    webhookId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'deleteWebhook'>> {
    return this.del(webhookId, requestOptions);
  }

  resend(
    webhookId: string,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'resendWebhook'>> {
    return this.execute(
      'resendWebhook',
      'POST',
      '/webhooks/{webhookId}/resend',
      {
        path: { webhookId },
        requestOptions,
      },
    );
  }
}
