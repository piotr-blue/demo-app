# MyOS JS SDK operation matrix

_Generated from `openapi/api-schema-2.yaml`._

Total operations: **58**

| Tag | operationId | Method | Path | Response | Pagination | SDK method | Coverage |
|---|---|---|---|---|---|---|---|
| API Keys | `createApiKey` | POST | `/api-keys` | 200 #/components/schemas/ApiKey | - | `client.apiKeys.create` | contract + unit |
| API Keys | `deleteApiKey` | DELETE | `/api-keys/{id}` | 200 #/components/schemas/DeleteResult | - | `client.apiKeys.del` | contract + unit |
| API Keys | `listApiKeys` | GET | `/api-keys` | 200 #/components/schemas/ApiKeyListResponse | itemsPerPage + nextPageToken | `client.apiKeys.list` | contract + unit |
| Documents | `createDocument` | POST | `/documents` | 200 #/components/schemas/Document | - | `client.documents.create` | contract + unit |
| Documents | `createDocumentBootstrap` | POST | `/documents/bootstrap` | 200 #/components/schemas/BootstrapResponse | - | `client.documents.bootstrap` | contract + live |
| Documents | `deleteDocument` | DELETE | `/documents/{sessionId}` | 200 #/components/schemas/DeleteResult | - | `client.documents.del` | contract + unit |
| Documents | `getDocument` | GET | `/documents/{sessionId}` | 200 #/components/schemas/DocumentGetResponse | - | `client.documents.retrieve` | contract + live |
| Documents | `getEpoch` | GET | `/documents/{sessionId}/epochs/{epoch}` | 200 #/components/schemas/EpochSnapshot | - | `client.documents.epochs.retrieve` | contract + unit |
| Documents | `listDocuments` | GET | `/documents` | 200 #/components/schemas/DocumentSimpleListResponse | itemsPerPage + nextPageToken | `client.documents.list` | contract + unit |
| Documents | `listEpochs` | GET | `/documents/{sessionId}/epochs` | 200 #/components/schemas/EpochListResponse | itemsPerPage + nextPageToken | `client.documents.epochs.list` | contract + unit |
| Documents | `listFeedEntries` | GET | `/documents/{sessionId}/feed-entries` | 200 #/components/schemas/FeedEntryListResponse | limit + nextPageToken | `client.documents.feedEntries.list` | contract + unit |
| Documents | `listLinks` | GET | `/documents/{sessionId}/links` | 200 #/components/schemas/DocumentSimpleListResponse | itemsPerPage + nextPageToken | `client.documents.links.list` | contract + unit |
| Documents | `listPendingActions` | GET | `/documents/{sessionId}/pending-actions` | 200 #/components/schemas/PendingActionListResponse | - | `client.documents.pendingActions.list` | contract + unit |
| Documents | `resumeDocumentProcessing` | POST | `/documents/{sessionId}/resume` | 202 #/components/schemas/ResumeDocumentResponse | - | `client.documents.resume` | contract + live |
| Documents | `runOperation` | POST | `/documents/{sessionId}/{operation}` | 200 #/components/schemas/OperationRequestResponse | - | `client.documents.runOperation` | contract + live |
| Documents | `stopDocumentProcessing` | POST | `/documents/{sessionId}/stop` | 202 #/components/schemas/StopDocumentResponse | - | `client.documents.stop` | contract + live |
| Documents | `updateDocument` | PUT | `/documents/{sessionId}` | 200 #/components/schemas/Document | - | `client.documents.update` | contract + unit |
| Integrations | `getChatPgtConnector` | GET | `/integrations/connectors/chatpgt` | 200 #/components/schemas/ConnectorStatus | - | `client.integrations.chatpgt.get` | contract + unit |
| Integrations | `installChatPgtConnector` | POST | `/integrations/connectors/chatpgt/install` | 200 #/components/schemas/BootstrapResponse | - | `client.integrations.chatpgt.install` | contract + unit |
| Maintenance | `cleanupIdempotency` | POST | `/maintenance/idempotency/cleanup` | 200 #/components/schemas/CleanupIdempotencyResponse | - | `client.maintenance.cleanupIdempotency` | gated (system) |
| Maintenance | `createExpiredIdempotency` | POST | `/maintenance/test-data/expired-idempotency` | 200 #/components/schemas/CreateExpiredIdempotencyResponse | - | `client.maintenance.createExpiredIdempotency` | gated (system) |
| Maintenance | `flushOutbox` | POST | `/maintenance/idempotency/outbox` | 200 #/components/schemas/FlushOutboxResponse | - | `client.maintenance.flushOutbox` | gated (system) |
| Me | `getInbox` | GET | `/me/inbox` | 200 #/components/schemas/DocumentSimpleListResponse | pageSize + nextPageToken | `client.me.inbox.list` | contract + unit |
| Me | `getMyDocuments` | GET | `/me/documents` | 200 #/components/schemas/DocumentSimpleListResponse | pageSize + nextPageToken | `client.me.documents.list` | contract + live |
| Me | `getSearchDocuments` | GET | `/me/search/documents` | 200 #/components/schemas/DocumentSimpleListResponse | limit + cursor(nextPageToken) | `client.me.search.documents` | contract + unit |
| Me | `getStarredDocuments` | GET | `/me/starred` | 200 #/components/schemas/DocumentSimpleListResponse | pageSize + nextPageToken | `client.me.starred.list` | contract + unit |
| Me | `listRecentlyUsedDocuments` | GET | `/me/recently-used` | 200 #/components/schemas/DocumentSimpleListResponse | itemsPerPage + nextPageToken | `client.me.recentlyUsed.list` | contract + unit |
| Me | `starDocument` | PUT | `/me/starred/{sessionId}` | 200 #/components/schemas/StarResult | - | `client.me.starred.add` | contract + unit |
| Me | `unstarDocument` | DELETE | `/me/starred/{sessionId}` | 200 #/components/schemas/DeleteResult | - | `client.me.starred.remove` | contract + unit |
| Myos Events | `getMyOSEvents` | GET | `/myos-events/{event}` | 200 #/components/schemas/MyOsEventDetail | - | `client.myOsEvents.retrieve` | contract + unit |
| Myos Events | `listMyOSEvents` | GET | `/myos-events` | 200 #/components/schemas/MyOsEventListResponse | itemsPerPage + nextPageToken | `client.myOsEvents.list` | contract + live |
| Timelines | `createTimeline` | POST | `/timelines` | 200 #/components/schemas/Timeline | - | `client.timelines.create` | contract + live |
| Timelines | `createTimelineEntry` | POST | `/timelines/{timeline}/entries` | 200 #/components/schemas/TimelineEntryInfo | - | `client.timelines.entries.create` | contract + live |
| Timelines | `createTimelinePermission` | POST | `/timelines/{timeline}/permissions` | 200 #/components/schemas/TimelinePermission | - | `client.timelines.permissions.create` | contract + unit |
| Timelines | `deleteTimeline` | DELETE | `/timelines/{timeline}` | 200 #/components/schemas/DeleteResult | - | `client.timelines.del` | contract + unit |
| Timelines | `deleteTimelinePermission` | DELETE | `/timelines/{timeline}/permissions/{permissionId}` | 200 #/components/schemas/RevokeTimelinePermissionResponse | - | `client.timelines.permissions.del` | contract + unit |
| Timelines | `getTimeline` | GET | `/timelines/{timeline}` | 200 #/components/schemas/Timeline | - | `client.timelines.retrieve` | contract + live |
| Timelines | `getTimelineEntries` | GET | `/timelines/{timeline}/entries` | 200 #/components/schemas/TimelineEntryListResponse | itemsPerPage + nextPageToken | `client.timelines.entries.list` | contract + live |
| Timelines | `getTimelineEntry` | GET | `/timelines/{timeline}/entries/{entryId}` | 202 #/components/schemas/OperationRequestResponse | - | `client.timelines.entries.retrieve` | contract + unit |
| Timelines | `getTimelinePermission` | GET | `/timelines/{timeline}/permissions/{permissionId}` | 200 #/components/schemas/TimelinePermission | - | `client.timelines.permissions.retrieve` | contract + unit |
| Timelines | `listTimelinePermissions` | GET | `/timelines/{timeline}/permissions` | 200 #/components/schemas/TimelinePermissionListResponse | nextPageToken | `client.timelines.permissions.list` | contract + unit |
| Timelines | `listTimelines` | GET | `/timelines` | 200 #/components/schemas/TimelineListResponse | itemsPerPage + nextPageToken | `client.timelines.list` | contract + unit |
| User | `getUiSettings` | GET | `/user/settings/ui` | 200 #/components/schemas/UiSettings | - | `client.user.uiSettings.get` | contract + unit |
| User | `getUserData` | GET | `/user` | 200 #/components/schemas/UserData | - | `client.user.get` | contract + live |
| User | `requestPasswordReset` | POST | `/user/password/reset/request` | 200 #/components/schemas/PasswordResetRequestResponse | - | `client.user.password.requestReset` | contract + unit |
| User | `resetPassword` | POST | `/user/password/reset` | 200 #/components/schemas/SuccessResponse | - | `client.user.password.reset` | contract + unit |
| User | `updateUiSettings` | POST | `/user/settings/ui` | 200 #/components/schemas/UiSettings | - | `client.user.uiSettings.update` | contract + unit |
| User | `updateUserData` | POST | `/user` | 200 #/components/schemas/UserData | - | `client.user.update` | contract + unit |
| Users | `getUsersByIds` | GET | `/users` | 200 #/components/schemas/UserPublicProfileList | - | `client.users.getByIds` | contract + live |
| Webhooks | `createWebhook` | POST | `/webhooks` | 200 #/components/schemas/Webhook | - | `client.webhooks.create` | contract + live (webhook-gated) |
| Webhooks | `deleteWebhook` | DELETE | `/webhooks/{webhookId}` | 200 #/components/schemas/Webhook | - | `client.webhooks.del` | contract + live (webhook-gated) |
| Webhooks | `getWebhook` | GET | `/webhooks/{webhookId}` | 200 #/components/schemas/Webhook | - | `client.webhooks.retrieve` | contract + unit |
| Webhooks | `getWebhookDispatch` | GET | `/webhooks/{webhookId}/dispatches/{eventId}` | 200 #/components/schemas/WebhookDispatch | - | `client.webhooks.dispatches.retrieve` | contract + unit |
| Webhooks | `listWebhookDispatchAttempts` | GET | `/webhooks/{webhookId}/dispatches/{eventId}/attempts` | 200 #/components/schemas/WebhookDispatchAttemptListResponse | itemsPerPage + nextPageToken | `client.webhooks.dispatches.attempts.list` | contract + unit |
| Webhooks | `listWebhookDispatches` | GET | `/webhooks/{webhookId}/dispatches` | 200 #/components/schemas/WebhookDispatchListResponse | itemsPerPage + nextPageToken | `client.webhooks.dispatches.list` | contract + unit |
| Webhooks | `listWebhooks` | GET | `/webhooks` | 200 #/components/schemas/WebhookListResponse | itemsPerPage + nextPageToken | `client.webhooks.list` | contract + live (webhook-gated) |
| Webhooks | `resendWebhook` | POST | `/webhooks/{webhookId}/resend` | 200 #/components/schemas/Webhook | - | `client.webhooks.resend` | contract + unit |
| Webhooks | `updateWebhook` | POST | `/webhooks/{webhookId}` | 200 #/components/schemas/Webhook | - | `client.webhooks.update` | contract + live (webhook-gated) |

