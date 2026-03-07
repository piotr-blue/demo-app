export interface MyOsErrorInit {
  readonly message: string;
  readonly statusCode?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly responseBody?: unknown;
  readonly blueContext?: string | null;
  readonly cause?: unknown;
}

export class MyOsError extends Error {
  readonly statusCode?: number;
  readonly code?: string;
  readonly requestId?: string;
  readonly responseBody?: unknown;
  readonly blueContext?: string | null;

  constructor(init: MyOsErrorInit) {
    super(init.message, init.cause ? { cause: init.cause } : undefined);
    this.name = 'MyOsError';
    this.statusCode = init.statusCode;
    this.code = init.code;
    this.requestId = init.requestId;
    this.responseBody = init.responseBody;
    this.blueContext = init.blueContext ?? null;
  }
}

export class MyOsAuthError extends MyOsError {
  constructor(init: MyOsErrorInit) {
    super(init);
    this.name = 'MyOsAuthError';
  }
}

export class MyOsValidationError extends MyOsError {
  constructor(init: MyOsErrorInit) {
    super(init);
    this.name = 'MyOsValidationError';
  }
}

export class MyOsRateLimitError extends MyOsError {
  constructor(init: MyOsErrorInit) {
    super(init);
    this.name = 'MyOsRateLimitError';
  }
}

export class MyOsNotFoundError extends MyOsError {
  constructor(init: MyOsErrorInit) {
    super(init);
    this.name = 'MyOsNotFoundError';
  }
}

export class MyOsServerError extends MyOsError {
  constructor(init: MyOsErrorInit) {
    super(init);
    this.name = 'MyOsServerError';
  }
}

export function mapErrorByStatus(init: MyOsErrorInit): MyOsError {
  const statusCode = init.statusCode;
  if (statusCode === 401 || statusCode === 403) {
    return new MyOsAuthError(init);
  }
  if (statusCode === 400 || statusCode === 422) {
    return new MyOsValidationError(init);
  }
  if (statusCode === 404) {
    return new MyOsNotFoundError(init);
  }
  if (statusCode === 429) {
    return new MyOsRateLimitError(init);
  }
  if (statusCode !== undefined && statusCode >= 500) {
    return new MyOsServerError(init);
  }
  return new MyOsError(init);
}
