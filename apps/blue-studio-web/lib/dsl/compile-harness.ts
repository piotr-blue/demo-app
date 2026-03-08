import ts from "typescript";
import * as sdkDsl from "@blue-labs/sdk-dsl";
import type { BlueNode } from "@blue-labs/language";

export interface CompiledDslArtifact {
  code: string;
  document: unknown;
  documentJson: Record<string, unknown>;
  structure: ReturnType<ReturnType<typeof sdkDsl.DocStructure.from>["toSummaryJson"]>;
}

function isBlueNodeLike(value: unknown): value is BlueNode {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as BlueNode).clone === "function" &&
    typeof (value as BlueNode).getBlueId === "function"
  );
}

function normalizeToPlainJsonObject(input: unknown): Record<string, unknown> {
  const json = JSON.stringify(input, (_key, value) => {
    if (typeof value === "function") {
      return undefined;
    }
    if (typeof value === "bigint") {
      return value.toString();
    }
    return value;
  });

  if (!json) {
    throw new Error("buildDocument() produced no serializable output.");
  }

  const parsed = JSON.parse(json) as unknown;
  if (!parsed || typeof parsed !== "object" || Array.isArray(parsed)) {
    throw new Error("buildDocument() must return a serializable object.");
  }
  return parsed as Record<string, unknown>;
}

function toSerializableDocumentJson(document: unknown): Record<string, unknown> {
  let candidate: unknown = document;

  if (isBlueNodeLike(document)) {
    candidate = sdkDsl.toOfficialJson(document);
    return normalizeToPlainJsonObject(candidate);
  }

  try {
    candidate = sdkDsl.toOfficialJson(document as BlueNode);
    return normalizeToPlainJsonObject(candidate);
  } catch {
    // continue to generic normalization
  }

  try {
    return normalizeToPlainJsonObject(candidate);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown serialization error";
    throw new Error(`buildDocument() returned a non-serializable value: ${message}`);
  }
}

function compileToCommonJs(code: string): string {
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.CommonJS,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Node10,
    },
    reportDiagnostics: true,
  });

  if (transpiled.diagnostics?.length) {
    const errors = transpiled.diagnostics
      .map((diagnostic) => ts.flattenDiagnosticMessageText(diagnostic.messageText, "\n"))
      .join("\n");
    if (errors.trim().length > 0) {
      throw new Error(`TypeScript transpile error: ${errors}`);
    }
  }

  return transpiled.outputText;
}

function requireForGeneratedDsl(specifier: string): unknown {
  if (specifier === "@blue-labs/sdk-dsl") {
    return sdkDsl;
  }
  throw new Error(
    `Unsupported import '${specifier}' in generated DSL. Only '@blue-labs/sdk-dsl' is available during compile.`
  );
}

function executeCompiledModule(jsSource: string): Record<string, unknown> {
  const moduleRef = { exports: {} as Record<string, unknown> };
  const execute = new Function(
    "exports",
    "require",
    "module",
    jsSource
  ) as (
    exports: Record<string, unknown>,
    require: (specifier: string) => unknown,
    module: { exports: Record<string, unknown> }
  ) => void;
  execute(moduleRef.exports, requireForGeneratedDsl, moduleRef);
  return moduleRef.exports;
}

export async function compileDslModule(code: string): Promise<CompiledDslArtifact> {
  const transpiled = compileToCommonJs(code);
  const imported = executeCompiledModule(transpiled);

  if (typeof imported.buildDocument !== "function") {
    throw new Error("Generated module does not export buildDocument().");
  }

  const document = (imported.buildDocument as () => unknown)();
  if (!document || typeof document !== "object") {
    throw new Error("buildDocument() did not return an object.");
  }

  const documentJson = toSerializableDocumentJson(document);

  const structureInput = documentJson as Parameters<typeof sdkDsl.DocStructure.from>[0];
  const structure = sdkDsl.DocStructure.from(structureInput).toSummaryJson();

  return {
    code,
    document,
    documentJson,
    structure,
  };
}
