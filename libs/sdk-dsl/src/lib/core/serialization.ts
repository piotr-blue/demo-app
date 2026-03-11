import { Blue, type BlueNode } from '@blue-labs/language';
import { repository } from '@blue-repository/types';
import type { JsonObject } from './types.js';

export const sdkBlue = new Blue({
  repositories: [repository],
});

export interface DocumentBuilderLike {
  buildDocument(): BlueNode;
}

export function fromJsonDocument(document: JsonObject): BlueNode {
  return sdkBlue.jsonValueToNode(document);
}

export function toOfficialJson(input: BlueNode | DocumentBuilderLike): JsonObject {
  const inlineTypesNode = sdkBlue.restoreInlineTypes(resolveNode(input));
  return sdkBlue.nodeToJson(inlineTypesNode, 'simple') as JsonObject;
}

export function toOfficialYaml(input: BlueNode | DocumentBuilderLike): string {
  const inlineTypesNode = sdkBlue.restoreInlineTypes(resolveNode(input));
  return sdkBlue.nodeToYaml(inlineTypesNode, 'simple');
}

export function ensureExpression(value: string): string {
  const trimmed = value.trim();
  if (trimmed.startsWith('${') && trimmed.endsWith('}')) {
    return trimmed;
  }
  return `\${${trimmed}}`;
}

function resolveNode(input: BlueNode | DocumentBuilderLike): BlueNode {
  return isBuilderLike(input) ? input.buildDocument() : input;
}

function isBuilderLike(
  value: BlueNode | DocumentBuilderLike,
): value is DocumentBuilderLike {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as DocumentBuilderLike).buildDocument === 'function'
  );
}
