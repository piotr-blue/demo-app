import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type { OperationResponse } from '../generated/operation-types.js';

export class IntegrationsResource extends ResourceBase {
  readonly chatpgt = {
    get: (
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getChatPgtConnector'>> =>
      this.execute(
        'getChatPgtConnector',
        'GET',
        '/integrations/connectors/chatpgt',
        {
          requestOptions,
        },
      ),
    install: (
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'installChatPgtConnector'>> =>
      this.execute(
        'installChatPgtConnector',
        'POST',
        '/integrations/connectors/chatpgt/install',
        {
          requestOptions,
        },
      ),
  } as const;

  readonly chatgpt = {
    get: (
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getChatPgtConnector'>> =>
      this.chatpgt.get(requestOptions),
    install: (
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'installChatPgtConnector'>> =>
      this.chatpgt.install(requestOptions),
  } as const;
}
