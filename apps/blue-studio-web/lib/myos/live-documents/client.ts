import { MyOsClient } from "@blue-labs/myos-js";

export interface LiveRouteCredentials {
  openAiApiKey: string;
  myOsApiKey: string;
  myOsAccountId: string;
  myOsBaseUrl: string;
}

export function createLiveMyOsClient(credentials: LiveRouteCredentials): MyOsClient {
  return new MyOsClient({
    apiKey: credentials.myOsApiKey.trim(),
    baseUrl: credentials.myOsBaseUrl.trim(),
    timeoutMs: 45_000,
    maxRetries: 2,
  });
}
