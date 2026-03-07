import type { BlueNode } from '@blue-labs/language';
import { toOfficialJson } from '@blue-labs/sdk-dsl';

export type BlueJsonDocument = Readonly<Record<string, unknown>>;

export interface DocumentBuilderLike {
  buildDocument(): BlueNode;
}

export type BootstrapDocumentInput =
  | BlueNode
  | BlueJsonDocument
  | DocumentBuilderLike
  | (() => BlueNode | BlueJsonDocument | DocumentBuilderLike);

export function normalizeDocumentInput(
  input: BootstrapDocumentInput,
): BlueJsonDocument {
  const resolved = typeof input === 'function' ? input() : input;
  if (isBuilderLike(resolved)) {
    return toOfficialJson(resolved.buildDocument());
  }
  if (isBlueNodeLike(resolved)) {
    return toOfficialJson(resolved as BlueNode);
  }
  if (isJsonObject(resolved)) {
    return structuredClone(resolved);
  }
  throw new Error(
    'Unsupported bootstrap document input. Expected BlueNode, plain object, builder-like input, or thunk.',
  );
}

function isBlueNodeLike(value: unknown): value is BlueNode {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as BlueNode).getBlueId === 'function' &&
    typeof (value as BlueNode).clone === 'function'
  );
}

function isBuilderLike(value: unknown): value is DocumentBuilderLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DocumentBuilderLike).buildDocument === 'function'
  );
}

function isJsonObject(value: unknown): value is BlueJsonDocument {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
