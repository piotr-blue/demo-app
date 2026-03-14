export interface ChannelBinding {
  readonly email?: string;
  readonly accountId?: string;
  readonly timelineId?: string;
}

export type ChannelBindingInput = ChannelBinding | string;
export type ChannelBindingsInput = Readonly<
  Record<string, ChannelBindingInput>
>;

export interface BootstrapInitialMessages {
  readonly defaultMessage?: string;
  readonly perChannel?: Readonly<Record<string, string>>;
}

export interface BootstrapOptions {
  readonly capabilities?: Readonly<Record<string, boolean>>;
  readonly initialMessages?: BootstrapInitialMessages;
}

export interface BootstrapPayloadOptions extends BootstrapOptions {
  readonly document: Readonly<Record<string, unknown>>;
  readonly channelBindings: ChannelBindingsInput;
}

const GENERIC_CHANNEL_TYPE = 'Core/Channel';
const MYOS_TIMELINE_CHANNEL_TYPE = 'MyOS/MyOS Timeline Channel';

export function buildBootstrapPayload(
  options: BootstrapPayloadOptions,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    // Temporary MyOS workaround: bootstrap currently rejects generic channel contracts.
    document: normalizeBootstrapDocument(options.document),
    channelBindings: normalizeChannelBindings(options.channelBindings),
  };

  if (options.capabilities && Object.keys(options.capabilities).length > 0) {
    payload.capabilities = { ...options.capabilities };
  }
  if (options.initialMessages) {
    payload.initialMessages = normalizeInitialMessages(options.initialMessages);
  }
  return payload;
}

export function normalizeChannelBindings(
  channelBindings: ChannelBindingsInput,
): Record<string, ChannelBinding> {
  return Object.fromEntries(
    Object.entries(channelBindings).map(([channel, binding]) => {
      if (typeof binding === 'string') {
        return [channel, { email: binding }];
      }
      return [channel, { ...binding }];
    }),
  );
}

function normalizeBootstrapDocument(value: unknown): unknown {
  if (Array.isArray(value)) {
    return value.map((entry) => normalizeBootstrapDocument(entry));
  }
  if (!value || typeof value !== 'object') {
    return value;
  }

  const normalized = Object.fromEntries(
    Object.entries(value as Record<string, unknown>).map(([key, entry]) => [
      key,
      normalizeBootstrapDocument(entry),
    ]),
  );

  if (normalized.type === GENERIC_CHANNEL_TYPE) {
    normalized.type = MYOS_TIMELINE_CHANNEL_TYPE;
  }

  return normalized;
}

function normalizeInitialMessages(
  initialMessages: BootstrapInitialMessages,
): Record<string, unknown> {
  const normalized: Record<string, unknown> = {};
  if (initialMessages.defaultMessage) {
    normalized.defaultMessage = initialMessages.defaultMessage;
  }
  if (
    initialMessages.perChannel &&
    Object.keys(initialMessages.perChannel).length > 0
  ) {
    normalized.perChannel = { ...initialMessages.perChannel };
  }
  return normalized;
}
