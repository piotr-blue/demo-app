import { describe, expect, it } from 'vitest';
import { buildBootstrapPayload } from './bootstrap-options.js';

describe('buildBootstrapPayload', () => {
  it('rewrites generic channel contracts for bootstrap payloads', () => {
    const document = {
      name: 'Counter',
      contracts: {
        ownerChannel: {
          type: 'Core/Channel',
          accountId: '{{CURRENT_ACCOUNT_ID}}',
        },
        reviewerChannel: {
          type: 'Conversation/Timeline Channel',
        },
      },
      nested: {
        channels: [{ type: 'Core/Channel' }, { type: 'MyOS/MyOS Timeline Channel' }],
      },
    };

    const payload = buildBootstrapPayload({
      document,
      channelBindings: {
        ownerChannel: 'owner@example.com',
      },
    });

    expect(payload.document).toEqual({
      name: 'Counter',
      contracts: {
        ownerChannel: {
          type: 'MyOS/MyOS Timeline Channel',
          accountId: '{{CURRENT_ACCOUNT_ID}}',
        },
        reviewerChannel: {
          type: 'Conversation/Timeline Channel',
        },
      },
      nested: {
        channels: [
          { type: 'MyOS/MyOS Timeline Channel' },
          { type: 'MyOS/MyOS Timeline Channel' },
        ],
      },
    });
    expect(document.contracts.ownerChannel.type).toBe('Core/Channel');
    expect(payload.channelBindings).toEqual({
      ownerChannel: {
        email: 'owner@example.com',
      },
    });
  });
});
