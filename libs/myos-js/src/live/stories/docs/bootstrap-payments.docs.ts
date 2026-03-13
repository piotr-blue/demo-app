import {
  DocBuilder,
  PayNotes,
  fromChannel,
  type JsonObject,
} from '@blue-labs/sdk-dsl';

export function buildVoucherChildDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/voucher/status', 'active')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation('redeem', 'ownerChannel', 'Redeem voucher', (steps) =>
      steps.replaceValue('RedeemVoucher', '/voucher/status', 'redeemed'),
    )
    .buildJson();
}

export function buildParentVoucherOrchestratorDocument(name: string) {
  const childTemplate = buildVoucherChildDocument(`${name} Child Voucher`);
  const requestId = 'REQ_CHILD_VOUCHER_BOOTSTRAP';
  return DocBuilder.doc()
    .name(name)
    .type('MyOS/Agent')
    .sessionInteraction()
    .section(
      'orchestrationSection',
      'Voucher Orchestration',
      'Parent document that bootstraps child voucher sessions',
    )
    .field('/childSessionId', '')
    .field('/childStatus', 'pending')
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .myOsAdmin('myOsAdminChannel')
    .operation(
      'issueVoucher',
      'ownerChannel',
      'Issue voucher child document',
      (steps) =>
        steps
          .myOs('myOsAdminChannel')
          .bootstrapDocument(
            'BootstrapChildVoucher',
            childTemplate,
            {
              ownerChannel: fromChannel('ownerChannel'),
            },
            'ownerChannel',
            (payload) => {
              payload.put('requestId', requestId);
            },
          ),
    )
    .onTriggeredWithMatcher(
      'onTargetSessionStarted',
      'MyOS/Target Document Session Started',
      {
        inResponseTo: {
          requestId,
        },
      },
      (steps) =>
        steps
          .replaceExpression(
            'StoreChildSessionId',
            '/childSessionId',
            'event.initiatorSessionIds[0]',
          )
          .replaceValue('MarkChildReady', '/childStatus', 'ready'),
    )
    .endSection()
    .buildDocument();
}

export function buildShipmentEscrowPayNoteDocument(name: string) {
  return PayNotes.payNote(name)
    .channel('payerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('payeeChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('guarantorChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .currency('USD')
    .amountMinor(10000)
    .capture()
    .lockOnInit()
    .unlockOnOperation(
      'confirmShipment',
      'shipmentCompanyChannel',
      'Shipment company confirms delivery.',
    )
    .requestOnOperation(
      'requestCapture',
      'guarantorChannel',
      'Guarantor requests capture.',
    )
    .done()
    .section(
      'paymentSection',
      'Payment Controls',
      'Capture lock/unlock/request paynote workflows',
    )
    .field('/shipment/status', 'pending')
    .field('/capture/status', 'locked')
    .channel('shipmentCompanyChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .onEvent(
      'onCaptureUnlockRequested',
      'PayNote/Card Transaction Capture Unlock Requested',
      (steps) =>
        steps
          .replaceValue(
            'MarkShipmentConfirmed',
            '/shipment/status',
            'confirmed',
          )
          .replaceValue('MarkCaptureUnlocked', '/capture/status', 'unlocked'),
    )
    .onEvent('onCaptureRequested', 'PayNote/Capture Funds Requested', (steps) =>
      steps.replaceValue(
        'MarkCaptureRequested',
        '/capture/status',
        'requested',
      ),
    )
    .endSection()
    .buildDocument();
}

export function buildPaymentEmissionDocument(name: string) {
  return DocBuilder.doc()
    .name(name)
    .field('/payment/requested', false)
    .channel('ownerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('payeeChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'issuePayoutAch',
      'ownerChannel',
      'Issue payout via ACH',
      (steps) =>
        steps
          .replaceValue('MarkPaymentRequestedAch', '/payment/requested', true)
          .triggerPayment(
            'TriggerAchPayment',
            'PayNote/Reserve Funds Requested',
            (payload) =>
              payload
                .processor('payment-processor')
                .from('ownerChannel')
                .to('payeeChannel')
                .currency('USD')
                .amountMinor(1200)
                .reason('ACH payout')
                .viaAch()
                .put('routingNumber', '111000025')
                .put('accountNumber', '000123456789')
                .put('accountType', 'checking')
                .done(),
          ),
    )
    .operation(
      'issuePayoutCreditLine',
      'ownerChannel',
      'Issue payout via credit line',
      (steps) =>
        steps
          .replaceValue(
            'MarkPaymentRequestedCreditLine',
            '/payment/requested',
            true,
          )
          .triggerPayment(
            'TriggerCreditLinePayment',
            'PayNote/Reserve Funds Requested',
            (payload) =>
              payload
                .processor('payment-processor')
                .from('ownerChannel')
                .to('payeeChannel')
                .currency('USD')
                .amountMinor(2200)
                .reason('Credit line payout')
                .viaCreditLine()
                .put('creditLineId', 'CL-100')
                .put('merchantAccountId', 'MA-200')
                .put('cardholderAccountId', 'CA-300')
                .done(),
          ),
    )
    .operation(
      'issuePayoutLedger',
      'ownerChannel',
      'Issue payout via ledger transfer',
      (steps) =>
        steps
          .replaceValue(
            'MarkPaymentRequestedLedger',
            '/payment/requested',
            true,
          )
          .triggerPayment(
            'TriggerLedgerPayment',
            'PayNote/Reserve Funds Requested',
            (payload) =>
              payload
                .processor('payment-processor')
                .from('ownerChannel')
                .to('payeeChannel')
                .currency('USD')
                .amountMinor(3200)
                .reason('Ledger payout')
                .viaLedger()
                .put('ledgerAccountFrom', 'ops-main')
                .put('ledgerAccountTo', 'payee-settlement')
                .put('memo', 'Story15 ledger transfer')
                .done(),
          ),
    )
    .buildDocument();
}

export function buildBackwardPaymentVoucherDocument(
  name: string,
  attachedPayNote: JsonObject,
) {
  return DocBuilder.doc()
    .name(name)
    .channel('payerChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('payeeChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .channel('guarantorChannel', { type: 'MyOS/MyOS Timeline Channel' })
    .operation(
      'issueVoucher',
      'guarantorChannel',
      'Issue backward payment voucher',
      (steps) =>
        steps.requestBackwardPayment('RequestBackwardVoucher', (payload) =>
          payload
            .processor('guarantorChannel')
            .from('payeeChannel')
            .to('payerChannel')
            .currency('USD')
            .amountMinor(1500)
            .reason('Voucher reimbursement request')
            .attachPayNote(attachedPayNote)
            .viaCreditLine()
            .put('creditLineId', 'CL-777')
            .put('merchantAccountId', 'MA-888')
            .put('cardholderAccountId', 'CA-999')
            .done(),
        ),
    )
    .buildDocument();
}
