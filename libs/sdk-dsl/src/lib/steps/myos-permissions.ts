import type { JsonObject } from '../core/types.js';

function cloneObject(value: JsonObject): JsonObject {
  return structuredClone(value);
}

export function normalizeMyOsPermissionObject(value: JsonObject): JsonObject {
  const cloned = cloneObject(value);
  const normalized: JsonObject = {};
  const hasWrite = Object.prototype.hasOwnProperty.call(cloned, 'write');
  const hasShare = Object.prototype.hasOwnProperty.call(cloned, 'share');

  for (const [key, entry] of Object.entries(cloned)) {
    if (key === 'write') {
      continue;
    }
    normalized[key] = entry;
  }

  if (!hasShare && hasWrite) {
    normalized.share = cloned.write;
  }

  return normalized;
}

export class MyOsPermissions {
  private readValue: boolean | undefined;
  private shareValue: boolean | undefined;
  private allOpsValue: boolean | undefined;
  private singleOpsValue: string[] = [];
  private singleOpsSet = false;

  static create(): MyOsPermissions {
    return new MyOsPermissions();
  }

  read(value: boolean): this {
    this.readValue = value;
    return this;
  }

  write(value: boolean): this {
    this.shareValue = value;
    return this;
  }

  allOps(value: boolean): this {
    this.allOpsValue = value;
    return this;
  }

  singleOps(...operations: string[]): this {
    this.singleOpsSet = true;
    this.singleOpsValue = operations
      .map((operation) => operation.trim())
      .filter((operation) => operation.length > 0);
    return this;
  }

  build(): JsonObject {
    const result: JsonObject = {};
    if (this.readValue !== undefined) {
      result.read = this.readValue;
    }
    if (this.shareValue !== undefined) {
      result.share = this.shareValue;
    }
    if (this.allOpsValue !== undefined) {
      result.allOps = this.allOpsValue;
    }
    if (this.singleOpsSet) {
      result.singleOps = [...this.singleOpsValue];
    }
    return result;
  }
}
