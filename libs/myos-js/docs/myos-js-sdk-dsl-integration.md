# myos-js + sdk-dsl integration

## Intent

`sdk-dsl` authors Blue documents.
`myos-js` bootstraps and operates those documents against MyOS APIs.

## Accepted bootstrap document forms

`client.documents.bootstrap(document, channelBindings, options?)` accepts:

1. `BlueNode` (e.g. `DocBuilder.doc().buildDocument()`)
2. Plain official Blue JSON object
3. Builder-like object with `buildDocument()`
4. Thunk returning one of the above

## Channel binding forms

Supported binding inputs:

```ts
{
  ownerChannel: { email: 'owner@example.com' },
  reviewerChannel: { accountId: 'acc_123' },
  auditorChannel: { timelineId: 'uuid', email: 'audit@example.com' },
}
```

Shorthand:

```ts
{ ownerChannel: 'owner@example.com' }
```

## Bootstrap options helper

```ts
await client.documents.bootstrap(document, bindings, {
  capabilities: {
    sessionInteraction: true,
  },
  initialMessages: {
    defaultMessage: 'You were invited to collaborate',
    perChannel: {
      ownerChannel: 'Owner-specific invite',
    },
  },
});
```

## End-to-end example (counter)

```ts
import { DocBuilder } from '@blue-labs/sdk-dsl';
import { MyOsClient } from '@blue-labs/myos-js';

const client = new MyOsClient({ apiKey: process.env.MYOS_API_KEY! });

const doc = DocBuilder.doc()
  .name('Counter')
  .field('/counter', 0)
  .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
  .operation('increment', 'ownerChannel', Number, 'Increment', (steps) =>
    steps.replaceExpression(
      'IncrementCounter',
      '/counter',
      "document('/counter') + event.message.request",
    ),
  )
  .buildDocument();

const bootstrap = await client.documents.bootstrap(doc, {
  ownerChannel: { email: process.env.MYOS_BOOTSTRAP_EMAIL! },
});

await client.documents.runOperation(bootstrap.sessionId, 'increment', 1);
```
