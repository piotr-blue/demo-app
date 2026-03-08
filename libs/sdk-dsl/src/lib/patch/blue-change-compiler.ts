import { BlueNode } from '@blue-labs/language';
import { removePointer, setPointer } from '../core/pointers.js';
import { toOfficialJson } from '../core/serialization.js';
import type { JsonObject, JsonValue } from '../core/types.js';
import {
  DocStructure,
  type DocContractEntry,
} from '../structure/doc-structure.js';
import { diffJsonDocuments, type JsonPatchOperation } from './diff.js';

export interface BlueContractChange {
  readonly op: 'add' | 'replace' | 'remove';
  readonly contractKey: string;
  readonly sectionKey: string;
  readonly before?: JsonObject;
  readonly after?: JsonObject;
  readonly beforeFingerprint?: string;
  readonly afterFingerprint?: string;
}

export interface BlueSectionChangeGroup {
  readonly sectionKey: string;
  readonly contractKeys: readonly string[];
  readonly changes: readonly BlueContractChange[];
}

export interface BlueChangePlan {
  readonly rootChanges: readonly JsonPatchOperation[];
  readonly contractChanges: readonly BlueContractChange[];
  readonly sectionChanges: readonly BlueSectionChangeGroup[];
  readonly patchOperations: readonly JsonPatchOperation[];
}

type ExistingDocument = BlueNode | JsonObject;

function toJsonDocument(document: ExistingDocument): JsonObject {
  if (document instanceof BlueNode) {
    return toOfficialJson(document);
  }
  return structuredClone(document);
}

function asJsonObject(value: JsonValue | undefined): JsonObject | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) {
    return null;
  }
  return value as JsonObject;
}

function sortedKeys(object: JsonObject): string[] {
  return Object.keys(object).sort((left, right) => left.localeCompare(right));
}

function stableStringify(value: JsonValue): string {
  if (Array.isArray(value)) {
    return `[${value.map((entry) => stableStringify(entry as JsonValue)).join(',')}]`;
  }
  if (!value || typeof value !== 'object') {
    return JSON.stringify(value);
  }
  const object = value as JsonObject;
  return `{${sortedKeys(object)
    .map(
      (key) =>
        `${JSON.stringify(key)}:${stableStringify(object[key] as JsonValue)}`,
    )
    .join(',')}}`;
}

function removeRootKey(document: JsonObject, key: string): JsonObject {
  const copy = structuredClone(document);
  delete copy[key];
  return copy;
}

function inferSectionBucket(contract: DocContractEntry): string {
  const key = contract.key.toLowerCase();
  const typeAlias = (contract.type ?? '').toLowerCase();
  if (contract.kind === 'channel') {
    return 'participants';
  }
  if (key.includes('ai') || typeAlias.includes('/ai') || key.includes('llm')) {
    return 'ai';
  }
  if (typeAlias.startsWith('paynote/')) {
    return 'paynote';
  }
  if (
    key.includes('payment') ||
    key.includes('reserve') ||
    key.includes('release') ||
    key.includes('capture') ||
    key.includes('voucher')
  ) {
    return 'payments';
  }
  if (
    contract.kind === 'operation' ||
    contract.kind === 'operationImpl' ||
    contract.kind === 'workflow' ||
    contract.kind === 'policy'
  ) {
    return 'logic';
  }
  return 'misc';
}

function contractsByKey(
  contracts: readonly DocContractEntry[],
): Record<string, DocContractEntry> {
  const indexed: Record<string, DocContractEntry> = {};
  for (const contract of contracts) {
    indexed[contract.key] = contract;
  }
  return indexed;
}

function resolveSectionKey(
  contractKey: string,
  beforeContract: DocContractEntry | undefined,
  afterContract: DocContractEntry | undefined,
): string {
  const afterSections = afterContract?.sectionKeys ?? [];
  if (afterSections.length > 0) {
    return [...afterSections].sort((left, right) =>
      left.localeCompare(right),
    )[0] as string;
  }
  const beforeSections = beforeContract?.sectionKeys ?? [];
  if (beforeSections.length > 0) {
    return [...beforeSections].sort((left, right) =>
      left.localeCompare(right),
    )[0] as string;
  }
  if (afterContract) {
    return inferSectionBucket(afterContract);
  }
  if (beforeContract) {
    return inferSectionBucket(beforeContract);
  }
  return contractKey.toLowerCase().includes('channel')
    ? 'participants'
    : 'misc';
}

export function compileRootChanges(
  beforeDocument: ExistingDocument,
  afterDocument: ExistingDocument,
): JsonPatchOperation[] {
  const beforeJson = toJsonDocument(beforeDocument);
  const afterJson = toJsonDocument(afterDocument);
  const beforeComparable = removeRootKey(
    removeRootKey(beforeJson, 'contracts'),
    'policies',
  );
  const afterComparable = removeRootKey(
    removeRootKey(afterJson, 'contracts'),
    'policies',
  );
  return diffJsonDocuments(beforeComparable, afterComparable);
}

export function compileContractChanges(
  beforeDocument: ExistingDocument,
  afterDocument: ExistingDocument,
): BlueContractChange[] {
  const beforeJson = toJsonDocument(beforeDocument);
  const afterJson = toJsonDocument(afterDocument);
  const beforeContractsRoot =
    asJsonObject(beforeJson.contracts as JsonValue) ?? {};
  const afterContractsRoot =
    asJsonObject(afterJson.contracts as JsonValue) ?? {};
  const contractKeys = [
    ...new Set([
      ...sortedKeys(beforeContractsRoot),
      ...sortedKeys(afterContractsRoot),
    ]),
  ].sort((left, right) => left.localeCompare(right));

  const beforeStructure = DocStructure.from(beforeJson);
  const afterStructure = DocStructure.from(afterJson);
  const beforeContracts = contractsByKey(beforeStructure.contracts);
  const afterContracts = contractsByKey(afterStructure.contracts);

  const changes: BlueContractChange[] = [];
  for (const contractKey of contractKeys) {
    const beforeContractRaw = asJsonObject(
      beforeContractsRoot[contractKey] as JsonValue,
    );
    const afterContractRaw = asJsonObject(
      afterContractsRoot[contractKey] as JsonValue,
    );
    const beforeContract = beforeContracts[contractKey];
    const afterContract = afterContracts[contractKey];
    const sectionKey = resolveSectionKey(
      contractKey,
      beforeContract,
      afterContract,
    );

    if (!beforeContractRaw && afterContractRaw) {
      changes.push({
        op: 'add',
        contractKey,
        sectionKey,
        after: structuredClone(afterContractRaw),
        afterFingerprint: afterContract?.fingerprint,
      });
      continue;
    }
    if (beforeContractRaw && !afterContractRaw) {
      changes.push({
        op: 'remove',
        contractKey,
        sectionKey,
        before: structuredClone(beforeContractRaw),
        beforeFingerprint: beforeContract?.fingerprint,
      });
      continue;
    }
    if (!beforeContractRaw || !afterContractRaw) {
      continue;
    }

    if (
      stableStringify(beforeContractRaw) === stableStringify(afterContractRaw)
    ) {
      continue;
    }
    changes.push({
      op: 'replace',
      contractKey,
      sectionKey,
      before: structuredClone(beforeContractRaw),
      after: structuredClone(afterContractRaw),
      beforeFingerprint: beforeContract?.fingerprint,
      afterFingerprint: afterContract?.fingerprint,
    });
  }
  return changes.sort((left, right) => {
    if (left.sectionKey !== right.sectionKey) {
      return left.sectionKey.localeCompare(right.sectionKey);
    }
    if (left.contractKey !== right.contractKey) {
      return left.contractKey.localeCompare(right.contractKey);
    }
    const opOrder = { remove: 1, add: 2, replace: 3 } as const;
    return opOrder[left.op] - opOrder[right.op];
  });
}

function compileSectionGroups(
  contractChanges: readonly BlueContractChange[],
): BlueSectionChangeGroup[] {
  const grouped: Record<string, BlueContractChange[]> = {};
  for (const change of contractChanges) {
    if (!grouped[change.sectionKey]) {
      grouped[change.sectionKey] = [];
    }
    grouped[change.sectionKey]?.push(change);
  }
  return Object.keys(grouped)
    .sort((left, right) => left.localeCompare(right))
    .map((sectionKey) => {
      const changes = (grouped[sectionKey] ?? []).sort((left, right) => {
        const byContractKey = left.contractKey.localeCompare(right.contractKey);
        if (byContractKey !== 0) {
          return byContractKey;
        }
        const opOrder = { remove: 1, add: 2, replace: 3 } as const;
        return opOrder[left.op] - opOrder[right.op];
      });
      return {
        sectionKey,
        contractKeys: [
          ...new Set(changes.map((change) => change.contractKey)),
        ].sort((left, right) => left.localeCompare(right)),
        changes,
      };
    });
}

function compilePatchOperations(
  beforeDocument: ExistingDocument,
  rootChanges: readonly JsonPatchOperation[],
  contractChanges: readonly BlueContractChange[],
): JsonPatchOperation[] {
  const beforeJson = toJsonDocument(beforeDocument);
  const hasContractsRoot = Boolean(
    asJsonObject(beforeJson.contracts as JsonValue),
  );

  const operations: JsonPatchOperation[] = [...rootChanges];
  const contractAddsOrReplaces = contractChanges.filter(
    (change) => change.op === 'add' || change.op === 'replace',
  );
  if (!hasContractsRoot && contractAddsOrReplaces.length > 0) {
    operations.push({
      op: 'add',
      path: '/contracts',
      val: {},
    });
  }

  const sortedRemovals = contractChanges
    .filter((change) => change.op === 'remove')
    .sort((left, right) => left.contractKey.localeCompare(right.contractKey));
  for (const change of sortedRemovals) {
    operations.push({
      op: 'remove',
      path: `/contracts/${change.contractKey}`,
    });
  }

  const sortedAddsOrReplaces = contractChanges
    .filter((change) => change.op !== 'remove')
    .sort((left, right) => left.contractKey.localeCompare(right.contractKey));
  for (const change of sortedAddsOrReplaces) {
    const path = `/contracts/${change.contractKey}`;
    operations.push({
      op: change.op,
      path,
      val: structuredClone(change.after ?? {}),
    });
  }
  return operations;
}

export function applyBlueChangePlan(
  beforeDocument: ExistingDocument,
  plan: BlueChangePlan,
): JsonObject {
  const next = toJsonDocument(beforeDocument);
  for (const operation of plan.patchOperations) {
    if (operation.op === 'remove') {
      removePointer(next, operation.path);
      continue;
    }
    setPointer(next, operation.path, structuredClone(operation.val));
  }
  return next;
}

export class BlueChangeCompiler {
  static compile(
    beforeDocument: ExistingDocument,
    afterDocument: ExistingDocument,
  ): BlueChangePlan {
    const rootChanges = compileRootChanges(beforeDocument, afterDocument);
    const contractChanges = compileContractChanges(
      beforeDocument,
      afterDocument,
    );
    const sectionChanges = compileSectionGroups(contractChanges);
    const patchOperations = compilePatchOperations(
      beforeDocument,
      rootChanges,
      contractChanges,
    );
    return {
      rootChanges,
      contractChanges,
      sectionChanges,
      patchOperations,
    };
  }
}
