export interface WebhookRegistrationRecord {
  registrationId: string;
  webhookId: string;
  browserId: string;
  accountHash: string;
  myOsBaseUrl: string;
  callbackPath: string;
  createdAt: string;
  updatedAt: string;
}

export interface LiveSubscriptionRecord {
  browserId: string;
  accountHash: string;
  sessionIds: string[];
  threadIds: string[];
  heartbeatAt: string;
}

export interface LiveInvalidationEvent {
  type: "myos-epoch-advanced";
  sessionId: string;
  eventId: string | null;
  epoch: number | null;
  deliveryId: string;
  registrationId: string;
}
