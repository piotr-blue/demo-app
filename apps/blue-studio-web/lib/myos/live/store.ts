import { Redis } from "@upstash/redis";
import type {
  LiveSubscriptionRecord,
  WebhookRegistrationRecord,
} from "@/lib/myos/live/types";

const DELIVERY_TTL_SECONDS = 60 * 60;

function browserAccountKey(browserId: string, accountHash: string): string {
  return `${browserId}:${accountHash}`;
}

interface LiveStore {
  getRegistrationById(
    registrationId: string
  ): Promise<WebhookRegistrationRecord | null>;
  getRegistrationByBrowserAccount(
    browserId: string,
    accountHash: string
  ): Promise<WebhookRegistrationRecord | null>;
  upsertRegistration(record: WebhookRegistrationRecord): Promise<void>;
  deleteRegistration(registrationId: string): Promise<void>;
  upsertSubscription(record: LiveSubscriptionRecord): Promise<void>;
  listSubscriptionsByAccount(accountHash: string): Promise<LiveSubscriptionRecord[]>;
  deleteSubscription(browserId: string, accountHash: string): Promise<void>;
  markDeliverySeen(deliveryId: string): Promise<boolean>;
}

class MemoryLiveStore implements LiveStore {
  private readonly registrations = new Map<string, WebhookRegistrationRecord>();

  private readonly registrationByBrowserAccount = new Map<string, string>();

  private readonly subscriptions = new Map<string, LiveSubscriptionRecord>();

  private readonly deliveries = new Map<string, number>();

  async getRegistrationById(registrationId: string) {
    return this.registrations.get(registrationId) ?? null;
  }

  async getRegistrationByBrowserAccount(browserId: string, accountHash: string) {
    const key = browserAccountKey(browserId, accountHash);
    const registrationId = this.registrationByBrowserAccount.get(key);
    if (!registrationId) {
      return null;
    }
    return this.registrations.get(registrationId) ?? null;
  }

  async upsertRegistration(record: WebhookRegistrationRecord) {
    this.registrations.set(record.registrationId, record);
    this.registrationByBrowserAccount.set(
      browserAccountKey(record.browserId, record.accountHash),
      record.registrationId
    );
  }

  async deleteRegistration(registrationId: string) {
    const existing = this.registrations.get(registrationId);
    if (existing) {
      this.registrationByBrowserAccount.delete(
        browserAccountKey(existing.browserId, existing.accountHash)
      );
      this.subscriptions.delete(
        browserAccountKey(existing.browserId, existing.accountHash)
      );
    }
    this.registrations.delete(registrationId);
  }

  async upsertSubscription(record: LiveSubscriptionRecord) {
    this.subscriptions.set(
      browserAccountKey(record.browserId, record.accountHash),
      record
    );
  }

  async listSubscriptionsByAccount(accountHash: string) {
    const now = Date.now();
    return [...this.subscriptions.values()].filter((record) => {
      const heartbeat = Date.parse(record.heartbeatAt);
      if (!Number.isFinite(heartbeat)) {
        return false;
      }
      return record.accountHash === accountHash && now - heartbeat < 10 * 60 * 1000;
    });
  }

  async deleteSubscription(browserId: string, accountHash: string) {
    this.subscriptions.delete(browserAccountKey(browserId, accountHash));
  }

  async markDeliverySeen(deliveryId: string) {
    const now = Date.now();
    for (const [key, expiresAt] of this.deliveries.entries()) {
      if (expiresAt <= now) {
        this.deliveries.delete(key);
      }
    }
    if (this.deliveries.has(deliveryId)) {
      return false;
    }
    this.deliveries.set(deliveryId, now + DELIVERY_TTL_SECONDS * 1000);
    return true;
  }
}

class UpstashLiveStore implements LiveStore {
  constructor(private readonly redis: Redis) {}

  private registrationKey(registrationId: string) {
    return `blue-studio:live:registration:${registrationId}`;
  }

  private registrationBrowserAccountKey(browserId: string, accountHash: string) {
    return `blue-studio:live:registrationByBrowser:${browserId}:${accountHash}`;
  }

  private subscriptionKey(browserId: string, accountHash: string) {
    return `blue-studio:live:subscription:${browserId}:${accountHash}`;
  }

  private accountSubscriptionsSet(accountHash: string) {
    return `blue-studio:live:subscriptionKeys:${accountHash}`;
  }

  private deliveryKey(deliveryId: string) {
    return `blue-studio:live:delivery:${deliveryId}`;
  }

  async getRegistrationById(registrationId: string) {
    const value = await this.redis.get<WebhookRegistrationRecord>(
      this.registrationKey(registrationId)
    );
    return value ?? null;
  }

  async getRegistrationByBrowserAccount(browserId: string, accountHash: string) {
    const registrationId = await this.redis.get<string>(
      this.registrationBrowserAccountKey(browserId, accountHash)
    );
    if (!registrationId) {
      return null;
    }
    return this.getRegistrationById(registrationId);
  }

  async upsertRegistration(record: WebhookRegistrationRecord) {
    await this.redis.set(this.registrationKey(record.registrationId), record);
    await this.redis.set(
      this.registrationBrowserAccountKey(record.browserId, record.accountHash),
      record.registrationId
    );
  }

  async deleteRegistration(registrationId: string) {
    const existing = await this.getRegistrationById(registrationId);
    if (!existing) {
      return;
    }
    await this.redis.del(this.registrationKey(registrationId));
    await this.redis.del(
      this.registrationBrowserAccountKey(existing.browserId, existing.accountHash)
    );
    await this.deleteSubscription(existing.browserId, existing.accountHash);
  }

  async upsertSubscription(record: LiveSubscriptionRecord) {
    const key = this.subscriptionKey(record.browserId, record.accountHash);
    await this.redis.set(key, record, { ex: 10 * 60 });
    await this.redis.sadd(this.accountSubscriptionsSet(record.accountHash), key);
  }

  async listSubscriptionsByAccount(accountHash: string) {
    const keys =
      (await this.redis.smembers<string[]>(this.accountSubscriptionsSet(accountHash))) ?? [];
    if (!Array.isArray(keys) || keys.length === 0) {
      return [];
    }
    const values = (await this.redis.mget<LiveSubscriptionRecord[]>(...keys)) ?? [];
    return (values.filter(Boolean) as LiveSubscriptionRecord[]).filter(
      (record) => record.accountHash === accountHash
    );
  }

  async deleteSubscription(browserId: string, accountHash: string) {
    const key = this.subscriptionKey(browserId, accountHash);
    await this.redis.del(key);
    await this.redis.srem(this.accountSubscriptionsSet(accountHash), key);
  }

  async markDeliverySeen(deliveryId: string) {
    const result = await this.redis.set(this.deliveryKey(deliveryId), "1", {
      ex: DELIVERY_TTL_SECONDS,
      nx: true,
    });
    return result === "OK";
  }
}

let storeSingleton: LiveStore | null = null;

export function getLiveStore(): LiveStore {
  if (storeSingleton) {
    return storeSingleton;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (url && token) {
    const redis = new Redis({ url, token });
    storeSingleton = new UpstashLiveStore(redis);
    return storeSingleton;
  }

  storeSingleton = new MemoryLiveStore();
  return storeSingleton;
}

export function __resetLiveStoreForTests() {
  storeSingleton = null;
}
