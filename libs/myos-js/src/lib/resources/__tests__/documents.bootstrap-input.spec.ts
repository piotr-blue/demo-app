import { DocBuilder } from '@blue-labs/sdk-dsl';
import { describe, expect, it } from 'vitest';
import { createFetchMockController } from '../../../test-harness/mock-fetch.js';

describe('DocumentsResource bootstrap input handling', () => {
  it('rewrites default DocBuilder channels for bootstrap and normalizes bindings', async () => {
    const controller = createFetchMockController();
    const builder = DocBuilder.doc()
      .name('Counter')
      .field('/counter', 0)
      .channel('ownerChannel');

    await controller.client.documents.bootstrap(
      builder,
      {
        ownerChannel: 'owner@example.com',
      },
      {
        capabilities: {
          sessionInteraction: true,
        },
        initialMessages: {
          defaultMessage: 'hello',
          perChannel: {
            ownerChannel: 'owner hello',
          },
        },
      },
    );

    expect(controller.requests).toHaveLength(1);
    const request = controller.requests[0];
    expect(request.method).toBe('POST');
    expect(request.url).toBe('https://api.dev.myos.blue/documents/bootstrap');
    expect(request.bodyText).toBeDefined();
    const payload = JSON.parse(request.bodyText ?? '{}') as Record<
      string,
      unknown
    >;
    expect(payload.document).toBeTruthy();
    expect(payload.document).toMatchObject({
      contracts: {
        ownerChannel: {
          type: 'MyOS/MyOS Timeline Channel',
        },
      },
    });
    expect(payload.channelBindings).toEqual({
      ownerChannel: {
        email: 'owner@example.com',
      },
    });
    expect(payload.capabilities).toEqual({
      sessionInteraction: true,
    });
    expect(payload.initialMessages).toEqual({
      defaultMessage: 'hello',
      perChannel: { ownerChannel: 'owner hello' },
    });
  });

  it('rewrites generic channel contracts in plain object document input', async () => {
    const controller = createFetchMockController();
    const document = {
      name: 'Node Input',
      status: 'draft',
      contracts: {
        ownerChannel: { type: 'Core/Channel' },
        reviewerChannel: { type: 'Conversation/Timeline Channel' },
      },
    };

    await controller.client.documents.bootstrap(document, {
      ownerChannel: {
        email: 'owner@example.com',
      },
    });

    const payload = JSON.parse(
      controller.requests[0]?.bodyText ?? '{}',
    ) as Record<string, unknown>;
    expect(payload.document).toEqual({
      name: 'Node Input',
      status: 'draft',
      contracts: {
        ownerChannel: { type: 'MyOS/MyOS Timeline Channel' },
        reviewerChannel: { type: 'Conversation/Timeline Channel' },
      },
    });
    expect(payload.channelBindings).toEqual({
      ownerChannel: {
        email: 'owner@example.com',
      },
    });
  });
});
