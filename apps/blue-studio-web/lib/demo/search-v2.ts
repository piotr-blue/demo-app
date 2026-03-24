import type { DemoAccountRecord, DemoSnapshot, DocumentRecord } from "@/lib/demo/types";
import {
  canViewerAccessDocument,
  getAccessibleDocumentsForAccount,
  getPublicAccounts,
  getPublicDocuments,
} from "@/lib/demo/selectors";

export type DemoSearchGroupKey =
  | "accounts"
  | "public-services"
  | "public-documents"
  | "my-documents";

export interface DemoSearchResult {
  id: string;
  type: "account" | "document" | "service";
  group: DemoSearchGroupKey;
  title: string;
  subtitle: string;
  status: string | null;
  href: string;
  icon: string;
  score: number;
}

export interface DemoSearchGroup {
  key: DemoSearchGroupKey;
  label: string;
  results: DemoSearchResult[];
}

function normalize(text: string): string {
  return text.toLowerCase().trim();
}

function scoreText(haystack: string, query: string): number {
  if (!query) {
    return 1;
  }
  const normalizedHaystack = normalize(haystack);
  if (normalizedHaystack === query) {
    return 120;
  }
  if (normalizedHaystack.startsWith(query)) {
    return 90;
  }
  if (normalizedHaystack.includes(query)) {
    return 60;
  }
  return 0;
}

function accountResult(account: DemoAccountRecord, query: string): DemoSearchResult | null {
  const haystack = [
    account.name,
    account.subtitle,
    account.description,
    account.searchKeywords.join(" "),
  ].join(" ");
  const score = scoreText(haystack, query);
  if (query && score === 0) {
    return null;
  }
  return {
    id: account.id,
    type: "account",
    group: "accounts",
    title: account.name,
    subtitle: account.subtitle,
    status: account.accountId,
    href: `/accounts/${encodeURIComponent(account.id)}`,
    icon: "account",
    score: score + 15,
  };
}

function documentResult(
  document: DocumentRecord,
  query: string,
  group: DemoSearchGroupKey
): DemoSearchResult | null {
  const haystack = [
    document.title,
    document.summary,
    document.owner,
    document.searchKeywords.join(" "),
    document.tags.join(" "),
  ].join(" ");
  const score = scoreText(haystack, query);
  if (query && score === 0) {
    return null;
  }
  return {
    id: document.id,
    type: document.isService ? "service" : "document",
    group,
    title: document.title,
    subtitle: document.summary,
    status: document.status,
    href: `/documents/${encodeURIComponent(document.id)}`,
    icon: document.isService ? "service" : "document",
    score: score + (group === "public-services" ? 18 : group === "accounts" ? 8 : 10),
  };
}

export function searchSnapshot(
  snapshot: DemoSnapshot,
  activeAccountId: string,
  queryRaw: string
): DemoSearchGroup[] {
  const query = normalize(queryRaw);

  const accountResults = getPublicAccounts(snapshot)
    .map((account) => accountResult(account, query))
    .filter((entry): entry is DemoSearchResult => !!entry)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  const publicDocs = getPublicDocuments(snapshot);
  const publicServiceResults = publicDocs
    .filter((document) => document.isService)
    .map((document) => documentResult(document, query, "public-services"))
    .filter((entry): entry is DemoSearchResult => !!entry)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  const publicDocumentResults = publicDocs
    .filter((document) => !document.isService && canViewerAccessDocument(snapshot, document.id, activeAccountId))
    .map((document) => documentResult(document, query, "public-documents"))
    .filter((entry): entry is DemoSearchResult => !!entry)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  const myDocumentResults = getAccessibleDocumentsForAccount(snapshot, activeAccountId)
    .filter((document) => !document.isPublic)
    .map((document) => documentResult(document, query, "my-documents"))
    .filter((entry): entry is DemoSearchResult => !!entry)
    .sort((left, right) => right.score - left.score || left.title.localeCompare(right.title));

  return [
    { key: "accounts", label: "Accounts", results: accountResults },
    { key: "public-services", label: "Public Services", results: publicServiceResults },
    { key: "public-documents", label: "Public Documents", results: publicDocumentResults },
    { key: "my-documents", label: "My Documents", results: myDocumentResults },
  ];
}
