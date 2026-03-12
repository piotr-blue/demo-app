import {
  MyOsPermissions,
  StepsBuilder,
  toOfficialJson,
} from '../index.js';

describe('StepsBuilder demo-app compatibility helpers', () => {
  it('MyOsPermissions uses share(...) and preserves explicit empty singleOps', () => {
    expect(
      MyOsPermissions.create()
        .read(true)
        .share(false)
        .allOps(true)
        .singleOps(' increment ', '', undefined, 'decrement')
        .build(),
    ).toEqual({
      read: true,
      share: false,
      allOps: true,
      singleOps: ['increment', 'decrement'],
    });

    expect(
      MyOsPermissions.create().singleOps('one').singleOps().build(),
    ).toEqual({
      singleOps: [],
    });
  });

  it('requestSingleDocPermission accepts MyOsPermissions compatibility output', () => {
    const [step] = new StepsBuilder()
      .myOs()
      .requestSingleDocPermission(
        'ownerChannel',
        'REQ_1',
        'SESSION_1',
        MyOsPermissions.create()
          .read(true)
          .share(true)
          .singleOps('sync')
          .build(),
      )
      .build();

    expect(toOfficialJson(step!)).toMatchObject({
      type: 'Conversation/Trigger Event',
      event: {
        type: 'MyOS/Single Document Permission Grant Requested',
        onBehalfOf: 'ownerChannel',
        requestId: 'REQ_1',
        targetSessionId: 'SESSION_1',
        permissions: {
          read: true,
          share: true,
          singleOps: ['sync'],
        },
      },
    });
  });

  it('subscribeToSessionWithMatchers preserves matcher-array compatibility', () => {
    const built = new StepsBuilder()
      .myOs()
      .subscribeToSessionWithMatchers(
        'SESSION_1',
        'SUB_1',
        [
          'Conversation/Response',
          {
            type: 'Common/Named Event',
            name: 'assistant-approved',
          },
        ],
      )
      .build()
      .map((step) => toOfficialJson(step));

    expect(built[0]).toMatchObject({
      event: {
        type: 'MyOS/Subscribe to Session Requested',
        targetSessionId: 'SESSION_1',
        subscription: {
          id: 'SUB_1',
          events: [
            {
              type: 'Conversation/Response',
            },
            {
              type: 'Common/Named Event',
              name: 'assistant-approved',
            },
          ],
        },
      },
    });
  });
});
