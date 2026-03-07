import { describe, expect, it } from 'vitest';
import type { MyOsClient } from '../../client.js';
import { createFetchMockController } from '../../../test-harness/mock-fetch.js';

interface MappingScenario {
  readonly operationId: string;
  readonly method: string;
  readonly path: string;
  readonly query?: Readonly<Record<string, string>>;
  readonly run: (client: MyOsClient) => Promise<unknown>;
}

const scenarios: readonly MappingScenario[] = [
  {
    operationId: 'listApiKeys',
    method: 'GET',
    path: '/api-keys',
    query: { itemsPerPage: '10', nextPageToken: 'next' },
    run: (client) =>
      client.apiKeys.list({ itemsPerPage: 10, nextPageToken: 'next' }),
  },
  {
    operationId: 'createApiKey',
    method: 'POST',
    path: '/api-keys',
    run: (client) => client.apiKeys.create({ name: 'SDK key' }),
  },
  {
    operationId: 'deleteApiKey',
    method: 'DELETE',
    path: '/api-keys/key-1',
    run: (client) => client.apiKeys.del('key-1'),
  },
  {
    operationId: 'listDocuments',
    method: 'GET',
    path: '/documents',
    query: { itemsPerPage: '5' },
    run: (client) => client.documents.list({ itemsPerPage: 5 }),
  },
  {
    operationId: 'createDocument',
    method: 'POST',
    path: '/documents',
    run: (client) => client.documents.create({ document: { name: 'Doc' } }),
  },
  {
    operationId: 'createDocumentBootstrap',
    method: 'POST',
    path: '/documents/bootstrap',
    run: (client) =>
      client.documents.bootstrap(
        { name: 'Bootstrap' },
        { ownerChannel: 'a@b.c' },
      ),
  },
  {
    operationId: 'getDocument',
    method: 'GET',
    path: '/documents/s1',
    run: (client) => client.documents.retrieve('s1'),
  },
  {
    operationId: 'updateDocument',
    method: 'PUT',
    path: '/documents/s1',
    run: (client) => client.documents.update('s1', { isPublic: true }),
  },
  {
    operationId: 'deleteDocument',
    method: 'DELETE',
    path: '/documents/s1',
    run: (client) => client.documents.del('s1'),
  },
  {
    operationId: 'listEpochs',
    method: 'GET',
    path: '/documents/s1/epochs',
    query: { itemsPerPage: '10' },
    run: (client) => client.documents.epochs.list('s1', { itemsPerPage: 10 }),
  },
  {
    operationId: 'getEpoch',
    method: 'GET',
    path: '/documents/s1/epochs/2',
    run: (client) => client.documents.epochs.retrieve('s1', 2),
  },
  {
    operationId: 'listFeedEntries',
    method: 'GET',
    path: '/documents/s1/feed-entries',
    query: { order: 'desc', limit: '20' },
    run: (client) =>
      client.documents.feedEntries.list('s1', { order: 'desc', limit: 20 }),
  },
  {
    operationId: 'listLinks',
    method: 'GET',
    path: '/documents/s1/links',
    query: { order: 'asc', anchor: 'Orders' },
    run: (client) =>
      client.documents.links.list('s1', { order: 'asc', anchor: 'Orders' }),
  },
  {
    operationId: 'listPendingActions',
    method: 'GET',
    path: '/documents/s1/pending-actions',
    query: { itemsPerPage: '10' },
    run: (client) =>
      client.documents.pendingActions.list('s1', { itemsPerPage: 10 }),
  },
  {
    operationId: 'resumeDocumentProcessing',
    method: 'POST',
    path: '/documents/s1/resume',
    run: (client) => client.documents.resume('s1'),
  },
  {
    operationId: 'stopDocumentProcessing',
    method: 'POST',
    path: '/documents/s1/stop',
    run: (client) => client.documents.stop('s1', { message: 'pause' }),
  },
  {
    operationId: 'runOperation',
    method: 'POST',
    path: '/documents/s1/increment',
    query: { pendingActionId: 'pa-1' },
    run: (client) =>
      client.documents.runOperation('s1', 'increment', 1, {
        pendingActionId: 'pa-1',
      }),
  },
  {
    operationId: 'listTimelines',
    method: 'GET',
    path: '/timelines',
    query: { itemsPerPage: '5' },
    run: (client) => client.timelines.list({ itemsPerPage: 5 }),
  },
  {
    operationId: 'createTimeline',
    method: 'POST',
    path: '/timelines',
    run: (client) => client.timelines.create({ name: 'My timeline' }),
  },
  {
    operationId: 'getTimeline',
    method: 'GET',
    path: '/timelines/t1',
    run: (client) => client.timelines.retrieve('t1'),
  },
  {
    operationId: 'deleteTimeline',
    method: 'DELETE',
    path: '/timelines/t1',
    run: (client) => client.timelines.del('t1'),
  },
  {
    operationId: 'getTimelineEntries',
    method: 'GET',
    path: '/timelines/t1/entries',
    query: { itemsPerPage: '5' },
    run: (client) => client.timelines.entries.list('t1', { itemsPerPage: 5 }),
  },
  {
    operationId: 'createTimelineEntry',
    method: 'POST',
    path: '/timelines/t1/entries',
    run: (client) =>
      client.timelines.entries.create('t1', { message: 'hello world' }),
  },
  {
    operationId: 'getTimelineEntry',
    method: 'GET',
    path: '/timelines/t1/entries/e1',
    run: (client) => client.timelines.entries.retrieve('t1', 'e1'),
  },
  {
    operationId: 'listTimelinePermissions',
    method: 'GET',
    path: '/timelines/t1/permissions',
    run: (client) => client.timelines.permissions.list('t1'),
  },
  {
    operationId: 'createTimelinePermission',
    method: 'POST',
    path: '/timelines/t1/permissions',
    run: (client) =>
      client.timelines.permissions.create('t1', {
        grantee: {
          type: 'account',
          id: 'acc-1',
        },
      }),
  },
  {
    operationId: 'getTimelinePermission',
    method: 'GET',
    path: '/timelines/t1/permissions/p1',
    run: (client) => client.timelines.permissions.retrieve('t1', 'p1'),
  },
  {
    operationId: 'deleteTimelinePermission',
    method: 'DELETE',
    path: '/timelines/t1/permissions/p1',
    run: (client) => client.timelines.permissions.del('t1', 'p1'),
  },
  {
    operationId: 'getMyDocuments',
    method: 'GET',
    path: '/me/documents',
    query: { pageSize: '10' },
    run: (client) => client.me.documents.list({ pageSize: 10 }),
  },
  {
    operationId: 'getInbox',
    method: 'GET',
    path: '/me/inbox',
    query: { q: 'invoice' },
    run: (client) => client.me.inbox.list({ q: 'invoice' }),
  },
  {
    operationId: 'listRecentlyUsedDocuments',
    method: 'GET',
    path: '/me/recently-used',
    query: { itemsPerPage: '10' },
    run: (client) => client.me.recentlyUsed.list({ itemsPerPage: 10 }),
  },
  {
    operationId: 'getSearchDocuments',
    method: 'GET',
    path: '/me/search/documents',
    query: { scope: 'global', limit: '5' },
    run: (client) =>
      client.me.search.documents({
        scope: 'global',
        limit: 5,
      }),
  },
  {
    operationId: 'getStarredDocuments',
    method: 'GET',
    path: '/me/starred',
    run: (client) => client.me.starred.list(),
  },
  {
    operationId: 'starDocument',
    method: 'PUT',
    path: '/me/starred/s1',
    run: (client) => client.me.starred.add('s1'),
  },
  {
    operationId: 'unstarDocument',
    method: 'DELETE',
    path: '/me/starred/s1',
    run: (client) => client.me.starred.remove('s1'),
  },
  {
    operationId: 'getUserData',
    method: 'GET',
    path: '/user',
    run: (client) => client.user.get(),
  },
  {
    operationId: 'updateUserData',
    method: 'POST',
    path: '/user',
    run: (client) =>
      client.user.update({
        name: 'Jane',
      }),
  },
  {
    operationId: 'requestPasswordReset',
    method: 'POST',
    path: '/user/password/reset/request',
    run: (client) =>
      client.user.password.requestReset({
        email: 'user@example.com',
      }),
  },
  {
    operationId: 'resetPassword',
    method: 'POST',
    path: '/user/password/reset',
    run: (client) =>
      client.user.password.reset({
        token: 'token',
        newPassword: 'newPassword123',
      }),
  },
  {
    operationId: 'getUiSettings',
    method: 'GET',
    path: '/user/settings/ui',
    run: (client) => client.user.uiSettings.get(),
  },
  {
    operationId: 'updateUiSettings',
    method: 'POST',
    path: '/user/settings/ui',
    run: (client) =>
      client.user.uiSettings.update({
        theme: 'dark',
      }),
  },
  {
    operationId: 'getUsersByIds',
    method: 'GET',
    path: '/users',
    query: { ids: 'u1,u2' },
    run: (client) => client.users.getByIds(['u1', 'u2']),
  },
  {
    operationId: 'listMyOSEvents',
    method: 'GET',
    path: '/myos-events',
    query: { itemsPerPage: '10' },
    run: (client) => client.myOsEvents.list({ itemsPerPage: 10 }),
  },
  {
    operationId: 'getMyOSEvents',
    method: 'GET',
    path: '/myos-events/event-1',
    run: (client) => client.myOsEvents.retrieve('event-1'),
  },
  {
    operationId: 'listWebhooks',
    method: 'GET',
    path: '/webhooks',
    query: { itemsPerPage: '5' },
    run: (client) => client.webhooks.list({ itemsPerPage: 5 }),
  },
  {
    operationId: 'createWebhook',
    method: 'POST',
    path: '/webhooks',
    run: (client) =>
      client.webhooks.create({
        type: 'HTTPS',
        settings: {
          url: 'https://example.com/hook',
        },
      }),
  },
  {
    operationId: 'getWebhook',
    method: 'GET',
    path: '/webhooks/w1',
    run: (client) => client.webhooks.retrieve('w1'),
  },
  {
    operationId: 'updateWebhook',
    method: 'POST',
    path: '/webhooks/w1',
    run: (client) =>
      client.webhooks.update('w1', {
        type: 'HTTPS',
        settings: {
          url: 'https://example.com/hook',
        },
      }),
  },
  {
    operationId: 'deleteWebhook',
    method: 'DELETE',
    path: '/webhooks/w1',
    run: (client) => client.webhooks.del('w1'),
  },
  {
    operationId: 'listWebhookDispatches',
    method: 'GET',
    path: '/webhooks/w1/dispatches',
    query: { itemsPerPage: '5' },
    run: (client) => client.webhooks.dispatches.list('w1', { itemsPerPage: 5 }),
  },
  {
    operationId: 'getWebhookDispatch',
    method: 'GET',
    path: '/webhooks/w1/dispatches/e1',
    run: (client) => client.webhooks.dispatches.retrieve('w1', 'e1'),
  },
  {
    operationId: 'listWebhookDispatchAttempts',
    method: 'GET',
    path: '/webhooks/w1/dispatches/e1/attempts',
    query: { itemsPerPage: '5' },
    run: (client) =>
      client.webhooks.dispatches.attempts.list('w1', 'e1', { itemsPerPage: 5 }),
  },
  {
    operationId: 'resendWebhook',
    method: 'POST',
    path: '/webhooks/w1/resend',
    run: (client) => client.webhooks.resend('w1'),
  },
  {
    operationId: 'getChatPgtConnector',
    method: 'GET',
    path: '/integrations/connectors/chatpgt',
    run: (client) => client.integrations.chatpgt.get(),
  },
  {
    operationId: 'installChatPgtConnector',
    method: 'POST',
    path: '/integrations/connectors/chatpgt/install',
    run: (client) => client.integrations.chatpgt.install(),
  },
  {
    operationId: 'cleanupIdempotency',
    method: 'POST',
    path: '/maintenance/idempotency/cleanup',
    run: (client) =>
      client.maintenance.cleanupIdempotency({
        batchSize: 10,
      }),
  },
  {
    operationId: 'flushOutbox',
    method: 'POST',
    path: '/maintenance/idempotency/outbox',
    run: (client) =>
      client.maintenance.flushOutbox({
        batchSize: 10,
      }),
  },
  {
    operationId: 'createExpiredIdempotency',
    method: 'POST',
    path: '/maintenance/test-data/expired-idempotency',
    run: (client) =>
      client.maintenance.createExpiredIdempotency({
        key: 'test-key',
      }),
  },
];

describe('operation mapping contract', () => {
  for (const scenario of scenarios) {
    it(`maps ${scenario.operationId}`, async () => {
      const controller = createFetchMockController();
      controller.setResponseFactory(
        () =>
          new Response(JSON.stringify({}), {
            status: 200,
            headers: {
              'Content-Type': 'application/json',
            },
          }),
      );

      await scenario.run(controller.client);

      expect(controller.requests).toHaveLength(1);
      const request = controller.requests[0];
      const url = new URL(request.url);

      expect(request.method).toBe(scenario.method);
      expect(url.pathname).toBe(scenario.path);
      if (scenario.query) {
        for (const [key, expectedValue] of Object.entries(scenario.query)) {
          expect(url.searchParams.get(key)).toBe(expectedValue);
        }
      }
    });
  }
});
