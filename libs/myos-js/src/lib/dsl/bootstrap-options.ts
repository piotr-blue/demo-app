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

export function buildBootstrapPayload(
  options: BootstrapPayloadOptions,
): Record<string, unknown> {
  const payload: Record<string, unknown> = {
    document: options.document,
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
