import { BasicBlueTypes, DocBuilder } from '@blue-labs/sdk-dsl';

export function buildCounterStoryDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .section('counterSection', 'Counter Basics', 'Counter contracts and fields')
    .field('/counter', 0)
    .field('/name', name)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'increment',
      'ownerChannel',
      BasicBlueTypes.Integer,
      'Increment counter',
      (steps) =>
        steps.replaceExpression(
          'IncrementCounter',
          '/counter',
          "document('/counter') + event.message.request",
        ),
    )
    .endSection()
    .buildDocument();
}

export function buildCompositeSharedValueDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .section(
      'sharedValueSection',
      'Shared Value',
      'Composite channel operations for two participants',
    )
    .field('/dataValue', '')
    .channel('aliceChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('bobChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .compositeChannel('aliceOrBobChannel', 'aliceChannel', 'bobChannel')
    .operation(
      'setDataValue',
      'aliceOrBobChannel',
      BasicBlueTypes.Text,
      'Set shared data value from request payload',
      (steps) =>
        steps.replaceExpression(
          'ApplyValue',
          '/dataValue',
          'event.message.request',
        ),
    )
    .requestDescription('setDataValue', 'Updated shared value text payload')
    .endSection()
    .buildDocument();
}

export function buildDirectChangeDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/text', 'Initial')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .directChange('changeDocument', 'ownerChannel', 'Apply incoming changeset')
    .buildDocument();
}

export function buildNamedEventDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/shipment/status', 'pending')
    .field('/shipment/orderId', '')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .canEmit('ownerChannel')
    .onNamedEvent('onShipmentConfirmed', 'shipment-confirmed', (steps) =>
      steps.replaceValue(
        'ConfirmShipmentStatus',
        '/shipment/status',
        'confirmed',
      ),
    )
    .onTriggeredWithMatcher(
      'onShipmentConfirmedWithPayload',
      'Common/Named Event',
      {
        name: 'shipment-confirmed-with-payload',
      },
      (steps) =>
        steps
          .replaceValue(
            'ConfirmShipmentStatusFromPayload',
            '/shipment/status',
            'confirmed',
          )
          .replaceExpression(
            'SaveOrderIdFromPayload',
            '/shipment/orderId',
            'event.orderId',
          ),
    )
    .buildDocument();
}

export function buildDocChangeReactionDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/counter', 0)
    .field('/counterState', 'idle')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'increment',
      'ownerChannel',
      BasicBlueTypes.Integer,
      'Increment counter',
      (steps) =>
        steps.replaceExpression(
          'IncrementCounter',
          '/counter',
          "document('/counter') + event.message.request",
        ),
    )
    .onDocChange('whenCounterChanges', '/counter', (steps) =>
      steps.replaceValue('MarkCounterUpdated', '/counterState', 'updated'),
    )
    .buildDocument();
}

export function buildChannelEventSignalDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/shipmentConfirmed', false)
    .field('/shipmentSource', '')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('signalChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .onChannelEvent(
      'onShipmentSignal',
      'signalChannel',
      'Conversation/Timeline Entry',
      (steps) =>
        steps
          .replaceValue('SetShipmentConfirmed', '/shipmentConfirmed', true)
          .replaceExpression(
            'SetShipmentSource',
            '/shipmentSource',
            'event.message.name',
          ),
    )
    .buildDocument();
}

export function buildTriggeredMatcherDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/matched', false)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .canEmit('ownerChannel')
    .onTriggeredWithMatcher(
      'onCorrelation',
      'Conversation/Event',
      {
        name: 'correlated-event',
        correlationId: 'CID_1',
      },
      (steps) => steps.replaceValue('SetMatched', '/matched', true),
    )
    .buildDocument();
}
