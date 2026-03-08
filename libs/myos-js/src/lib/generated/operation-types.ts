import type { operations } from './schema-types.js';

export type OperationId = keyof operations;

type JsonRequestBody<T extends OperationId> =
  operations[T]['requestBody'] extends {
    readonly content: { readonly 'application/json': infer TBody };
  }
    ? TBody
    : never;

type JsonResponseBody<T extends OperationId> =
  operations[T]['responses'][keyof operations[T]['responses']] extends {
    readonly content: { readonly 'application/json': infer TBody };
  }
    ? TBody
    : unknown;

export type OperationRequest<T extends OperationId> = JsonRequestBody<T>;
export type OperationResponse<T extends OperationId> = JsonResponseBody<T>;
