import { describe, expect, it } from 'vitest';
import { defaultBootstrapBinding } from './live-client.js';

describe('live-client helpers', () => {
  it('returns both bootstrap email and accountId when both are available', () => {
    expect(
      defaultBootstrapBinding({
        apiKey: 'test',
        baseUrl: 'https://api.dev.myos.blue',
        bootstrapEmail: 'user@example.com',
        accountId: 'acc-1',
      }),
    ).toEqual({
      email: 'user@example.com',
      accountId: 'acc-1',
    });
  });
});
