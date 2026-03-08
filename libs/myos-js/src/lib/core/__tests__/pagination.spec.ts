import { describe, expect, it } from 'vitest';
import { paginate } from '../pagination.js';

describe('paginate', () => {
  it('iterates through all pages using nextPageToken', async () => {
    const seenTokens: Array<string | undefined> = [];
    const iterator = paginate(async (params) => {
      seenTokens.push(params?.nextPageToken);
      if (!params?.nextPageToken) {
        return {
          items: ['a', 'b'],
          nextPageToken: 'next-1',
        };
      }
      return {
        items: ['c'],
      };
    });

    const allItems: string[] = [];
    for await (const item of iterator) {
      allItems.push(item);
    }

    expect(seenTokens).toEqual([undefined, 'next-1']);
    expect(allItems).toEqual(['a', 'b', 'c']);
  });
});
