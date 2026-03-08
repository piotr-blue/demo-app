import { mkdir, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { OPERATION_CATALOG } from './operation-catalog.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const pathParameterSchema = { type: 'string' };

const operationSchemas = {
  listApiKeys: 'ApiKeyListResponse',
  createApiKey: 'ApiKey',
  deleteApiKey: 'DeleteResult',
  listDocuments: 'DocumentSimpleListResponse',
  createDocument: 'Document',
  createDocumentBootstrap: 'BootstrapResponse',
  getDocument: 'DocumentGetResponse',
  updateDocument: 'Document',
  deleteDocument: 'DeleteResult',
  listEpochs: 'EpochListResponse',
  getEpoch: 'EpochSnapshot',
  listFeedEntries: 'FeedEntryListResponse',
  listLinks: 'DocumentSimpleListResponse',
  listPendingActions: 'PendingActionListResponse',
  resumeDocumentProcessing: 'ResumeDocumentResponse',
  stopDocumentProcessing: 'StopDocumentResponse',
  runOperation: 'OperationRequestResponse',
  listTimelines: 'TimelineListResponse',
  createTimeline: 'Timeline',
  getTimeline: 'Timeline',
  deleteTimeline: 'DeleteResult',
  getTimelineEntries: 'TimelineEntryListResponse',
  createTimelineEntry: 'TimelineEntryInfo',
  getTimelineEntry: 'OperationRequestResponse',
  listTimelinePermissions: 'TimelinePermissionListResponse',
  createTimelinePermission: 'TimelinePermission',
  getTimelinePermission: 'TimelinePermission',
  deleteTimelinePermission: 'RevokeTimelinePermissionResponse',
  getMyDocuments: 'DocumentSimpleListResponse',
  getInbox: 'DocumentSimpleListResponse',
  listRecentlyUsedDocuments: 'DocumentSimpleListResponse',
  getSearchDocuments: 'DocumentSimpleListResponse',
  getStarredDocuments: 'DocumentSimpleListResponse',
  starDocument: 'StarResult',
  unstarDocument: 'DeleteResult',
  getUserData: 'UserData',
  updateUserData: 'UserData',
  requestPasswordReset: 'PasswordResetRequestResponse',
  resetPassword: 'SuccessResponse',
  getUiSettings: 'UiSettings',
  updateUiSettings: 'UiSettings',
  getUsersByIds: 'UserPublicProfileList',
  listMyOSEvents: 'MyOsEventListResponse',
  getMyOSEvents: 'MyOsEventDetail',
  listWebhooks: 'WebhookListResponse',
  createWebhook: 'Webhook',
  getWebhook: 'Webhook',
  updateWebhook: 'Webhook',
  deleteWebhook: 'Webhook',
  listWebhookDispatches: 'WebhookDispatchListResponse',
  getWebhookDispatch: 'WebhookDispatch',
  listWebhookDispatchAttempts: 'WebhookDispatchAttemptListResponse',
  resendWebhook: 'Webhook',
  getChatPgtConnector: 'ConnectorStatus',
  installChatPgtConnector: 'BootstrapResponse',
  cleanupIdempotency: 'CleanupIdempotencyResponse',
  flushOutbox: 'FlushOutboxResponse',
  createExpiredIdempotency: 'CreateExpiredIdempotencyResponse',
};

const schemas = {
  BlueJsonValue: {
    nullable: true,
    oneOf: [
      { type: 'object', additionalProperties: true },
      { type: 'array', items: {} },
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
    ],
  },
  DeleteResult: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      message: { type: 'string' },
    },
    required: ['success', 'message'],
  },
  SuccessResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
    required: ['success'],
  },
  StarResult: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
    },
    required: ['success'],
  },
  APIKey: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      key: { type: 'string' },
      name: { type: 'string' },
      created: { type: 'string', format: 'date-time' },
    },
    required: ['id', 'key', 'name', 'created'],
  },
  ApiKey: {
    $ref: '#/components/schemas/APIKey',
  },
  ApiKeyListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/APIKey' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  DocumentSimple: {
    type: 'object',
    additionalProperties: true,
    properties: {
      sessionId: { type: 'string' },
      documentId: { type: 'string' },
      processingStatus: { type: 'string' },
    },
  },
  DocumentSimpleListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/DocumentSimple' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  Document: {
    allOf: [
      { $ref: '#/components/schemas/DocumentSimple' },
      {
        type: 'object',
        properties: {
          document: { $ref: '#/components/schemas/BlueJsonValue' },
          processingPausedAt: { type: 'string', nullable: true },
          processingPausedReason: { type: 'string', nullable: true },
        },
      },
    ],
  },
  DocumentGetResponse: {
    allOf: [
      { $ref: '#/components/schemas/Document' },
      {
        type: 'object',
        properties: {
          allowedOperations: {
            type: 'array',
            items: { type: 'string' },
          },
        },
      },
    ],
  },
  BootstrapResponse: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      document: { $ref: '#/components/schemas/BlueJsonValue' },
    },
    required: ['sessionId'],
  },
  EpochSnapshot: {
    type: 'object',
    additionalProperties: true,
    properties: {
      sessionId: { type: 'string' },
      epoch: { type: 'integer' },
      document: { $ref: '#/components/schemas/BlueJsonValue' },
    },
  },
  EpochListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: {
          type: 'object',
          additionalProperties: true,
          properties: {
            epoch: { type: 'integer' },
            created: { type: 'string' },
            ref: { type: 'string' },
          },
        },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  FeedEntry: {
    type: 'object',
    additionalProperties: true,
    properties: {
      id: { type: 'string' },
      message: { $ref: '#/components/schemas/BlueJsonValue' },
      timestamp: { type: 'number' },
    },
  },
  FeedEntryListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/FeedEntry' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  PendingAction: {
    type: 'object',
    additionalProperties: true,
    properties: {
      pendingActionId: { type: 'string' },
      operation: {
        oneOf: [
          { type: 'string' },
          { $ref: '#/components/schemas/BlueJsonValue' },
        ],
      },
      event: { $ref: '#/components/schemas/BlueJsonValue' },
    },
  },
  PendingActionListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/PendingAction' },
      },
    },
    required: ['items'],
  },
  ResumeDocumentResponse: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      status: { type: 'string', enum: ['RUNNING'] },
    },
    required: ['sessionId', 'status'],
  },
  StopDocumentResponse: {
    type: 'object',
    properties: {
      sessionId: { type: 'string' },
      status: { type: 'string', enum: ['PAUSED'] },
    },
    required: ['sessionId', 'status'],
  },
  OperationRequestResponse: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      status: {
        type: 'string',
        enum: ['SUCCESS', 'PENDING', 'ERROR'],
      },
      uid: { type: 'string' },
    },
    required: ['id', 'status', 'uid'],
  },
  Timeline: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      created: { type: 'string' },
      accountId: { type: 'string' },
      shared: { type: 'boolean' },
    },
    required: ['id', 'name', 'created', 'accountId', 'shared'],
  },
  TimelineListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/Timeline' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  TimelineEntry: {
    type: 'object',
    additionalProperties: true,
    properties: {
      type: { type: 'string' },
      message: { $ref: '#/components/schemas/BlueJsonValue' },
      timestamp: { type: 'number' },
    },
  },
  TimelineEntryInfo: {
    type: 'object',
    properties: {
      blueId: { type: 'string' },
      entry: { $ref: '#/components/schemas/TimelineEntry' },
    },
    required: ['blueId', 'entry'],
  },
  TimelineEntryListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/TimelineEntryInfo' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  TimelinePermission: {
    type: 'object',
    additionalProperties: true,
    properties: {
      id: { type: 'string' },
      timelineId: { type: 'string' },
      created: { type: 'string', format: 'date-time' },
    },
  },
  TimelinePermissionListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/TimelinePermission' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  RevokeTimelinePermissionResponse: {
    type: 'object',
    properties: {
      revokedAt: { type: 'string' },
      lastEntryId: { type: 'string', nullable: true },
      revocationRef: { type: 'string' },
    },
    required: ['revokedAt', 'lastEntryId', 'revocationRef'],
  },
  UserData: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      email: { type: 'string' },
      avatarUrl: { type: 'string', nullable: true },
      timezone: { type: 'string' },
    },
    required: ['id', 'name', 'email', 'avatarUrl', 'timezone'],
  },
  UiSettings: {
    type: 'object',
    properties: {
      theme: {
        type: 'string',
        enum: ['system', 'light', 'dark'],
      },
      dockPosition: {
        type: 'string',
        enum: ['vertical', 'horizontal'],
      },
    },
    required: ['theme', 'dockPosition'],
  },
  UserPublicProfile: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      name: { type: 'string' },
      description: { type: 'string', nullable: true },
      avatarUrl: { type: 'string', nullable: true },
    },
    required: ['id', 'name', 'description', 'avatarUrl'],
  },
  UserPublicProfileList: {
    type: 'array',
    items: { $ref: '#/components/schemas/UserPublicProfile' },
  },
  PasswordResetRequestResponse: {
    type: 'object',
    properties: {
      success: { type: 'boolean' },
      token: { type: 'string' },
    },
    required: ['success'],
  },
  MyOsEventSimple: {
    type: 'object',
    properties: {
      id: { type: 'string' },
      uid: { type: 'string' },
      ref: { type: 'string' },
      created: { type: 'string' },
      type: { type: 'string' },
    },
    required: ['id', 'uid', 'ref', 'created', 'type'],
  },
  MyOsEventListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/MyOsEventSimple' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  MyOsEventDetail: {
    type: 'object',
    additionalProperties: true,
    properties: {
      id: { type: 'string' },
      uid: { type: 'string' },
      ref: { type: 'string' },
      created: { type: 'string' },
      type: { type: 'string' },
      object: { $ref: '#/components/schemas/BlueJsonValue' },
    },
  },
  Webhook: {
    type: 'object',
    additionalProperties: true,
    properties: {
      id: { type: 'string' },
      type: { type: 'string' },
      status: { type: 'string' },
      created: { type: 'string' },
      settings: {
        type: 'object',
        additionalProperties: true,
      },
    },
    required: ['id', 'type', 'status', 'created', 'settings'],
  },
  WebhookListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/Webhook' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  WebhookDispatch: {
    type: 'object',
    additionalProperties: true,
    properties: {
      webhookId: { type: 'string' },
      eventId: { type: 'string' },
      status: { type: 'string' },
      eventCreated: { type: 'string' },
      created: { type: 'string' },
      updated: { type: 'string' },
    },
  },
  WebhookDispatchListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/WebhookDispatch' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  WebhookDispatchAttempt: {
    type: 'object',
    properties: {
      responseCode: { type: 'string' },
      status: { type: 'string' },
      created: { type: 'string' },
    },
    required: ['responseCode', 'status', 'created'],
  },
  WebhookDispatchAttemptListResponse: {
    type: 'object',
    properties: {
      items: {
        type: 'array',
        items: { $ref: '#/components/schemas/WebhookDispatchAttempt' },
      },
      nextPageToken: { type: 'string' },
    },
    required: ['items'],
  },
  ConnectorStatus: {
    type: 'object',
    properties: {
      installed: { type: 'boolean' },
      sessionId: { type: 'string' },
    },
    required: ['installed'],
  },
  CleanupIdempotencyResponse: {
    type: 'object',
    properties: {
      totalScanned: { type: 'number' },
      totalDeleted: { type: 'number' },
      batchesProcessed: { type: 'number' },
      durationMs: { type: 'number' },
    },
    required: [
      'totalScanned',
      'totalDeleted',
      'batchesProcessed',
      'durationMs',
    ],
  },
  FlushOutboxResponse: {
    type: 'object',
    properties: {
      totalScanned: { type: 'number' },
      totalSent: { type: 'number' },
      totalFailed: { type: 'number' },
      batchesProcessed: { type: 'number' },
      durationMs: { type: 'number' },
    },
    required: [
      'totalScanned',
      'totalSent',
      'totalFailed',
      'batchesProcessed',
      'durationMs',
    ],
  },
  CreateExpiredIdempotencyResponse: {
    type: 'object',
    properties: {
      accountUid: { type: 'string' },
      scope: { type: 'string' },
      key: { type: 'string' },
      expiresAt: { type: 'string' },
      createdAt: { type: 'string' },
    },
    required: ['accountUid', 'scope', 'key', 'expiresAt', 'createdAt'],
  },
  GenericRequestBody: {
    oneOf: [
      { type: 'object', additionalProperties: true },
      { type: 'array', items: {} },
      { type: 'string' },
      { type: 'number' },
      { type: 'boolean' },
    ],
  },
};

const operationsByPath = new Map();

for (const operation of OPERATION_CATALOG) {
  const pathDefinition = operationsByPath.get(operation.path) ?? {};
  const pathParams = extractPathParameters(operation.path);
  const schemaName = operationSchemas[operation.operationId] ?? 'BlueJsonValue';
  pathDefinition[operation.method] = {
    operationId: operation.operationId,
    tags: [operation.tag],
    summary: operation.operationId,
    security: [{ LambdaAuthorizerToken: [] }],
    parameters: pathParams,
    ...(operation.method === 'post' || operation.method === 'put'
      ? {
          requestBody: {
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/GenericRequestBody' },
              },
            },
          },
        }
      : {}),
    responses: {
      [String(operation.responseStatus ?? 200)]: {
        description: 'Successful request',
        content: {
          'application/json': {
            schema: { $ref: `#/components/schemas/${schemaName}` },
          },
        },
      },
    },
  };
  operationsByPath.set(operation.path, pathDefinition);
}

const openapiSpec = {
  openapi: '3.0.1',
  info: {
    title: 'Timeline.blue API',
    version: '2025-06-25',
  },
  servers: [
    {
      description: 'dev',
      url: 'https://api.dev.myos.blue/',
    },
  ],
  paths: Object.fromEntries(operationsByPath.entries()),
  components: {
    securitySchemes: {
      LambdaAuthorizerToken: {
        type: 'apiKey',
        name: 'Authorization',
        in: 'header',
      },
    },
    schemas,
  },
};

const outputDir = path.join(projectRoot, 'openapi');
const outputPath = path.join(outputDir, 'api-schema-2.yaml');
await mkdir(outputDir, { recursive: true });
const dumped = yaml.dump(openapiSpec, { noRefs: false });
const normalized = dumped.replace(/^openapi:\s+3\.0\.1$/mu, "openapi: '3.0.1'");
await writeFile(outputPath, normalized, 'utf-8');
console.log(`Wrote OpenAPI snapshot: ${outputPath}`);

function extractPathParameters(pathValue) {
  const matches = pathValue.matchAll(/\{([^}]+)\}/gu);
  return [...matches].map((match) => ({
    in: 'path',
    name: match[1],
    required: true,
    schema: pathParameterSchema,
  }));
}
