function makeId(prefix: string): string {
  const entropy =
    typeof crypto !== "undefined" && typeof crypto.randomUUID === "function"
      ? crypto.randomUUID()
      : `${Math.random().toString(36).slice(2, 10)}${Math.random().toString(36).slice(2, 10)}`;
  return `${prefix}_${Date.now()}_${entropy.slice(0, 12)}`;
}

export function createScopeId(): string {
  return makeId("scope");
}

export function createThreadId(): string {
  return makeId("thread");
}

export function createDocumentId(): string {
  return makeId("doc");
}

export function createActivityId(): string {
  return makeId("act");
}

export function createAttentionId(): string {
  return makeId("attn");
}

export function createMessageId(): string {
  return makeId("msg");
}

export function createAssistantConversationId(): string {
  return makeId("aconv");
}

export function createAssistantExchangeId(): string {
  return makeId("aex");
}

export function createAssistantExchangeMessageId(): string {
  return makeId("aemsg");
}

export function createAssistantPlaybookId(): string {
  return makeId("aplay");
}
