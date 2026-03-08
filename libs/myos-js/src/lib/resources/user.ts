import { ResourceBase } from '../core/resource.js';
import type { RequestOptions } from '../core/request-options.js';
import type {
  OperationRequest,
  OperationResponse,
} from '../generated/operation-types.js';

export class UserResource extends ResourceBase {
  readonly password = {
    requestReset: (
      payload: OperationRequest<'requestPasswordReset'>,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'requestPasswordReset'>> =>
      this.execute(
        'requestPasswordReset',
        'POST',
        '/user/password/reset/request',
        {
          body: payload,
          requestOptions,
        },
      ),
    reset: (
      payload: OperationRequest<'resetPassword'>,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'resetPassword'>> =>
      this.execute('resetPassword', 'POST', '/user/password/reset', {
        body: payload,
        requestOptions,
      }),
  } as const;

  readonly uiSettings = {
    get: (
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'getUiSettings'>> =>
      this.execute('getUiSettings', 'GET', '/user/settings/ui', {
        requestOptions,
      }),
    update: (
      payload: OperationRequest<'updateUiSettings'>,
      requestOptions?: RequestOptions,
    ): Promise<OperationResponse<'updateUiSettings'>> =>
      this.execute('updateUiSettings', 'POST', '/user/settings/ui', {
        body: payload,
        requestOptions,
      }),
  } as const;

  get(
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'getUserData'>> {
    return this.execute('getUserData', 'GET', '/user', { requestOptions });
  }

  update(
    payload: OperationRequest<'updateUserData'>,
    requestOptions?: RequestOptions,
  ): Promise<OperationResponse<'updateUserData'>> {
    return this.execute('updateUserData', 'POST', '/user', {
      body: payload,
      requestOptions,
    });
  }
}
