import { PayNotes, isRepositoryTypeAliasAvailable } from '@blue-labs/sdk-dsl';
import {
  CaptureFundsRequestedSchema,
  CardTransactionCaptureLockRequestedSchema,
  CardTransactionCaptureUnlockRequestedSchema,
  ReserveFundsRequestedSchema,
} from '@blue-repository/types/packages/paynote/schemas';
import { expect } from 'vitest';
import { describeLive, itLive } from '../../test-harness/live-mode.js';
import { getCoreOrAccountLiveGate } from '../../test-harness/live-env.js';
import {
  bootstrapDslDocument,
  createLiveClient,
  createUniqueName,
  defaultBootstrapBinding,
  extractField,
  latestEpochNumber,
  retrieveDocument,
  waitForAllowedOperation,
  waitForFieldValue,
  waitForLatestEmittedEvent,
  waitForLatestEmittedEventBySchema,
  waitForPredicate,
} from '../helpers/index.js';
import {
  buildBackwardPaymentVoucherDocument,
  buildParentVoucherOrchestratorDocument,
  buildPaymentEmissionDocument,
  buildShipmentEscrowPayNoteDocument,
} from './docs/bootstrap-payments.docs.js';

const gate = getCoreOrAccountLiveGate();
const STORY_13_LIVE_BLOCKED = process.env.MYOS_ENABLE_STORY_13 !== 'true';

describeLive('myos-js live stories: bootstrap + payments', gate, () => {
  itLive(
    'story-13 parent document bootstraps child voucher document',
    gate,
    async () => {
      if (STORY_13_LIVE_BLOCKED) {
        // Runtime blocker documented in libs/myos-js/issues.md:
        // MyOS Admin does not support Conversation/Document Bootstrap Requested
        return;
      }

      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);
      const parent = await bootstrapDslDocument(
        client,
        buildParentVoucherOrchestratorDocument(
          createUniqueName('Story13 Parent Orchestrator'),
        ),
        {
          ownerChannel: binding,
          myOsAdminChannel: { accountId: '0' },
        },
      );

      await waitForAllowedOperation(client, parent.sessionId, 'issueVoucher');
      await client.documents.runOperation(parent.sessionId, 'issueVoucher');

      await waitForFieldValue(
        client,
        parent.sessionId,
        '/childStatus',
        'ready',
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      const parentUpdated = await waitForPredicate(
        client,
        parent.sessionId,
        (latest) => {
          const childSessionId = extractField(latest, '/childSessionId');
          return (
            typeof childSessionId === 'string' && childSessionId.length > 0
          );
        },
        {
          timeoutMs: 120_000,
          intervalMs: 2_000,
        },
      );
      const childSessionId = extractField(
        parentUpdated,
        '/childSessionId',
      ) as string;

      const childRetrieved = await retrieveDocument(client, childSessionId);
      expect(extractField(childRetrieved, '/voucher/status')).toBe('active');
      await waitForAllowedOperation(client, childSessionId, 'redeem');
      await client.documents.runOperation(childSessionId, 'redeem');
      await waitForFieldValue(
        client,
        childSessionId,
        '/voucher/status',
        'redeemed',
        {
          timeoutMs: 40_000,
        },
      );

      // Story 18 structure assertion: section metadata survives roundtrip.
      expect(
        extractField(parentUpdated, '/contracts/orchestrationSection'),
      ).toBeTruthy();
      expect(
        extractField(
          parentUpdated,
          '/contracts/orchestrationSection/relatedContracts',
        ),
      ).toBeTruthy();
    },
    300_000,
  );

  itLive(
    'story-14 paynote shipment escrow lock/unlock/request flow',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);
      const payNote = await bootstrapDslDocument(
        client,
        buildShipmentEscrowPayNoteDocument(
          createUniqueName('Story14 Shipment Escrow PayNote'),
        ),
        {
          payerChannel: binding,
          payeeChannel: binding,
          guarantorChannel: binding,
          shipmentCompanyChannel: binding,
        },
      );
      const payNoteRetrieved = await retrieveDocument(
        client,
        payNote.sessionId,
      );
      // Story 18 section metadata check for paynote flow.
      expect(
        extractField(payNoteRetrieved, '/contracts/paymentSection'),
      ).toBeTruthy();
      expect(
        extractField(
          payNoteRetrieved,
          '/contracts/paymentSection/relatedContracts',
        ),
      ).toBeTruthy();

      await waitForLatestEmittedEventBySchema(
        client,
        payNote.sessionId,
        CardTransactionCaptureLockRequestedSchema,
        {
          timeoutMs: 90_000,
          intervalMs: 2_000,
        },
      );

      const beforeConfirmShipmentEpoch = await latestEpochNumber(
        client,
        payNote.sessionId,
      );
      await waitForAllowedOperation(
        client,
        payNote.sessionId,
        'confirmShipment',
      );
      await client.documents.runOperation(payNote.sessionId, 'confirmShipment');
      await waitForLatestEmittedEventBySchema(
        client,
        payNote.sessionId,
        CardTransactionCaptureUnlockRequestedSchema,
        {
          afterEpoch: beforeConfirmShipmentEpoch,
          timeoutMs: 90_000,
          intervalMs: 2_000,
        },
      );
      await waitForFieldValue(
        client,
        payNote.sessionId,
        '/shipment/status',
        'confirmed',
        {
          timeoutMs: 90_000,
        },
      );

      const beforeRequestCaptureEpoch = await latestEpochNumber(
        client,
        payNote.sessionId,
      );
      await waitForAllowedOperation(
        client,
        payNote.sessionId,
        'requestCapture',
      );
      await client.documents.runOperation(payNote.sessionId, 'requestCapture');
      await waitForLatestEmittedEventBySchema(
        client,
        payNote.sessionId,
        CaptureFundsRequestedSchema,
        {
          afterEpoch: beforeRequestCaptureEpoch,
          timeoutMs: 90_000,
          intervalMs: 2_000,
        },
      );
    },
    300_000,
  );

  itLive(
    'story-15 payment request emission supports ACH, credit line, and ledger rails',
    gate,
    async () => {
      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);
      const paymentDoc = await bootstrapDslDocument(
        client,
        buildPaymentEmissionDocument(
          createUniqueName('Story15 Payment Emission'),
        ),
        {
          ownerChannel: binding,
          payeeChannel: binding,
        },
      );

      const runAndAssertPaymentEmission = async (
        operation:
          | 'issuePayoutAch'
          | 'issuePayoutCreditLine'
          | 'issuePayoutLedger',
        predicate: (event: Record<string, unknown>) => boolean,
      ) => {
        const beforeEpoch = await latestEpochNumber(
          client,
          paymentDoc.sessionId,
        );
        await waitForAllowedOperation(client, paymentDoc.sessionId, operation);
        await client.documents.runOperation(paymentDoc.sessionId, operation);
        const { event } = await waitForLatestEmittedEventBySchema(
          client,
          paymentDoc.sessionId,
          ReserveFundsRequestedSchema,
          {
            afterEpoch: beforeEpoch,
            timeoutMs: 90_000,
            intervalMs: 2_000,
            predicate,
          },
        );
        return event;
      };

      const achEvent = await runAndAssertPaymentEmission(
        'issuePayoutAch',
        (event) => event.routingNumber === '111000025',
      );
      expect(achEvent.routingNumber).toBe('111000025');
      await waitForFieldValue(
        client,
        paymentDoc.sessionId,
        '/payment/requested',
        true,
        {
          timeoutMs: 45_000,
        },
      );
      const creditLineEvent = await runAndAssertPaymentEmission(
        'issuePayoutCreditLine',
        (event) => event.creditLineId === 'CL-100',
      );
      expect(creditLineEvent.creditLineId).toBe('CL-100');
      const ledgerEvent = await runAndAssertPaymentEmission(
        'issuePayoutLedger',
        (event) => event.ledgerAccountTo === 'payee-settlement',
      );
      expect(ledgerEvent.ledgerAccountTo).toBe('payee-settlement');
    },
    240_000,
  );

  itLive(
    'story-16 backward payment / voucher request (runtime-gated)',
    gate,
    async () => {
      if (
        !isRepositoryTypeAliasAvailable('PayNote/Backward Payment Requested')
      ) {
        // Runtime/types blocker tracked in libs/myos-js/issues.md (story is skipped).
        return;
      }

      const client = createLiveClient({}, gate.env);
      const binding = defaultBootstrapBinding(gate.env);
      const childVoucherPayNote = PayNotes.payNote(
        createUniqueName('Story16 Attached Child Voucher'),
      )
        .currency('USD')
        .amountMinor(1500)
        .buildJson();

      const voucherDoc = await bootstrapDslDocument(
        client,
        buildBackwardPaymentVoucherDocument(
          createUniqueName('Story16 Backward Payment Voucher'),
          childVoucherPayNote,
        ),
        {
          payerChannel: binding,
          payeeChannel: binding,
          guarantorChannel: binding,
        },
      );

      await waitForAllowedOperation(
        client,
        voucherDoc.sessionId,
        'issueVoucher',
      );
      const beforeIssueVoucherEpoch = await latestEpochNumber(
        client,
        voucherDoc.sessionId,
      );
      await client.documents.runOperation(voucherDoc.sessionId, 'issueVoucher');
      await waitForLatestEmittedEvent(
        client,
        voucherDoc.sessionId,
        (events) =>
          events.some(
            (event) =>
              (event as Record<string, unknown>).type ===
              'PayNote/Backward Payment Requested',
          ),
        {
          afterEpoch: beforeIssueVoucherEpoch,
          timeoutMs: 90_000,
          intervalMs: 2_000,
        },
      );
    },
    180_000,
  );
});
