export interface LiveEnv {
  readonly apiKey?: string;
  readonly baseUrl: string;
  readonly bootstrapEmail?: string;
  readonly accountId?: string;
  readonly systemApiKey?: string;
  readonly webhookTestUrl?: string;
  readonly dashboardUrl?: string;
}

export interface LiveGate {
  readonly enabled: boolean;
  readonly reason?: string;
  readonly env: LiveEnv;
}

const REQUIRED_FOR_CORE_LIVE = [
  'MYOS_API_KEY',
  'MYOS_BOOTSTRAP_EMAIL',
] as const;
const REQUIRED_FOR_ACCOUNT_LIVE = ['MYOS_API_KEY', 'MYOS_ACCOUNT_ID'] as const;

export function readLiveEnv(): LiveEnv {
  return {
    apiKey: process.env.MYOS_API_KEY,
    baseUrl: process.env.MYOS_BASE_URL ?? 'https://api.dev.myos.blue',
    bootstrapEmail: process.env.MYOS_BOOTSTRAP_EMAIL,
    accountId: process.env.MYOS_ACCOUNT_ID,
    systemApiKey: process.env.MYOS_SYSTEM_API_KEY,
    webhookTestUrl: process.env.MYOS_WEBHOOK_TEST_URL,
    dashboardUrl: process.env.MYOS_DASHBOARD_URL,
  };
}

export function getCoreLiveGate(): LiveGate {
  return evaluateLiveGate(REQUIRED_FOR_CORE_LIVE);
}

export function getCoreOrAccountLiveGate(): LiveGate {
  const env = readLiveEnv();
  if (!env.apiKey) {
    return {
      enabled: false,
      reason: 'missing required env: MYOS_API_KEY',
      env,
    };
  }
  if (!env.bootstrapEmail && !env.accountId) {
    return {
      enabled: false,
      reason:
        'missing required env: provide MYOS_BOOTSTRAP_EMAIL or MYOS_ACCOUNT_ID',
      env,
    };
  }
  return {
    enabled: true,
    env,
  };
}

export function getAccountCoreLiveGate(): LiveGate {
  return evaluateLiveGate(REQUIRED_FOR_ACCOUNT_LIVE);
}

export function getSystemLiveGate(): LiveGate {
  return evaluateLiveGate([...REQUIRED_FOR_CORE_LIVE, 'MYOS_SYSTEM_API_KEY']);
}

export function getWebhookLiveGate(): LiveGate {
  return evaluateLiveGate([...REQUIRED_FOR_CORE_LIVE, 'MYOS_WEBHOOK_TEST_URL']);
}

export function evaluateLiveGate(requiredEnv: readonly string[]): LiveGate {
  const env = readLiveEnv();
  const missing = requiredEnv.filter((name) => {
    const value = process.env[name];
    return !value;
  });
  if (missing.length > 0) {
    return {
      enabled: false,
      reason: `missing required env: ${missing.join(', ')}`,
      env,
    };
  }
  return {
    enabled: true,
    env,
  };
}
