import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { pathToFileURL } from "node:url";
import ts from "typescript";
import { DocStructure, toOfficialJson } from "@blue-labs/sdk-dsl";
import type { BlueNode } from "@blue-labs/language";

export interface CompiledDslArtifact {
  code: string;
  document: unknown;
  documentJson: Record<string, unknown>;
  structure: ReturnType<DocStructure["toSummaryJson"]>;
}

function isBlueNodeLike(value: unknown): value is BlueNode {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as BlueNode).clone === "function" &&
    typeof (value as BlueNode).getBlueId === "function"
  );
}

function compileToEsm(code: string): string {
  const transpiled = ts.transpileModule(code, {
    compilerOptions: {
      module: ts.ModuleKind.ESNext,
      target: ts.ScriptTarget.ES2022,
      esModuleInterop: true,
      moduleResolution: ts.ModuleResolutionKind.Bundler,
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

async function importFromTemporaryModule(jsSource: string): Promise<Record<string, unknown>> {
  const tempDir = await mkdtemp(path.join(os.tmpdir(), "blue-dsl-"));
  const filePath = path.join(tempDir, "generated.mjs");
  await writeFile(filePath, jsSource, "utf8");

  try {
    const imported = await import(
      /* webpackIgnore: true */
      pathToFileURL(filePath).href
    );
    return imported as Record<string, unknown>;
  } finally {
    await rm(tempDir, { recursive: true, force: true });
  }
}

export async function compileDslModule(code: string): Promise<CompiledDslArtifact> {
  const transpiled = compileToEsm(code);
  const imported = await importFromTemporaryModule(transpiled);

  if (typeof imported.buildDocument !== "function") {
    throw new Error("Generated module does not export buildDocument().");
  }

  const document = (imported.buildDocument as () => unknown)();
  if (!document || typeof document !== "object") {
    throw new Error("buildDocument() did not return an object.");
  }

  const documentJson = isBlueNodeLike(document)
    ? (toOfficialJson(document) as Record<string, unknown>)
    : (structuredClone(document) as Record<string, unknown>);

  const structureInput = document as Parameters<typeof DocStructure.from>[0];
  const structure = DocStructure.from(structureInput).toSummaryJson();

  return {
    code,
    document,
    documentJson,
    structure,
  };
}
