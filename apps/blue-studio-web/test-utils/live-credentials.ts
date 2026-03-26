import { existsSync, readFileSync } from "node:fs";

export interface ResolvedLiveCredentials {
  openAiApiKey: string;
  myOsApiKey: string;
  myOsAccountId: string;
  myOsBaseUrl: string;
}

export interface LiveCredentialsResolution {
  credentials: ResolvedLiveCredentials | null;
  missing: Array<"OPENAI_API_KEY" | "MYOS_API_KEY" | "MYOS_ACCOUNT_ID">;
  source: "env" | "file" | "none";
  filePath: string;
}

const DEFAULT_BASE_URL = "https://api.dev.myos.blue/";
const DEFAULT_FILE_PATH = "/opt/cursor/artifacts/live-credentials.json";

function readCredentialFile(path: string): Partial<ResolvedLiveCredentials> | null {
  if (!existsSync(path)) {
    return null;
  }
  try {
    const raw = readFileSync(path, "utf8");
    const parsed = JSON.parse(raw) as Record<string, unknown>;
    const openAiApiKey =
      typeof parsed.openAiApiKey === "string"
        ? parsed.openAiApiKey
        : typeof parsed.OPENAI_API_KEY === "string"
          ? parsed.OPENAI_API_KEY
          : undefined;
    const myOsApiKey =
      typeof parsed.myOsApiKey === "string"
        ? parsed.myOsApiKey
        : typeof parsed.MYOS_API_KEY === "string"
          ? parsed.MYOS_API_KEY
          : undefined;
    const myOsAccountId =
      typeof parsed.myOsAccountId === "string"
        ? parsed.myOsAccountId
        : typeof parsed.MYOS_ACCOUNT_ID === "string"
          ? parsed.MYOS_ACCOUNT_ID
          : undefined;
    const myOsBaseUrl =
      typeof parsed.myOsBaseUrl === "string"
        ? parsed.myOsBaseUrl
        : typeof parsed.MYOS_BASE_URL === "string"
          ? parsed.MYOS_BASE_URL
          : undefined;
    return {
      openAiApiKey,
      myOsApiKey,
      myOsAccountId,
      myOsBaseUrl,
    };
  } catch {
    return null;
  }
}

function trimOrEmpty(value: string | undefined): string {
  return typeof value === "string" ? value.trim() : "";
}

export function resolveLiveCredentials(): LiveCredentialsResolution {
  const filePath = trimOrEmpty(process.env.LIVE_PROOF_CREDENTIALS_FILE) || DEFAULT_FILE_PATH;
  const fromFile = readCredentialFile(filePath);

  const openAiApiKey = trimOrEmpty(process.env.OPENAI_API_KEY) || trimOrEmpty(fromFile?.openAiApiKey);
  const myOsApiKey = trimOrEmpty(process.env.MYOS_API_KEY) || trimOrEmpty(fromFile?.myOsApiKey);
  const myOsAccountId =
    trimOrEmpty(process.env.MYOS_ACCOUNT_ID) || trimOrEmpty(fromFile?.myOsAccountId);
  const myOsBaseUrl =
    trimOrEmpty(process.env.MYOS_BASE_URL) || trimOrEmpty(fromFile?.myOsBaseUrl) || DEFAULT_BASE_URL;

  const missing: Array<"OPENAI_API_KEY" | "MYOS_API_KEY" | "MYOS_ACCOUNT_ID"> = [];
  if (!openAiApiKey) {
    missing.push("OPENAI_API_KEY");
  }
  if (!myOsApiKey) {
    missing.push("MYOS_API_KEY");
  }
  if (!myOsAccountId) {
    missing.push("MYOS_ACCOUNT_ID");
  }

  if (missing.length > 0) {
    return {
      credentials: null,
      missing,
      source: "none",
      filePath,
    };
  }

  return {
    credentials: {
      openAiApiKey,
      myOsApiKey,
      myOsAccountId,
      myOsBaseUrl,
    },
    missing: [],
    source: fromFile ? "file" : "env",
    filePath,
  };
}
