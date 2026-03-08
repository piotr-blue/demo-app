import { existsSync, readFileSync } from "node:fs";
import { mkdtemp, rm, writeFile } from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";
import ts from "typescript";
import { DocStructure, toOfficialJson } from "@blue-labs/sdk-dsl";
import type { BlueNode } from "@blue-labs/language";

export interface CompiledDslArtifact {
  code: string;
  document: unknown;
  documentJson: Record<string, unknown>;
  structure: ReturnType<DocStructure["toSummaryJson"]>;
}

function escapeRegex(input: string): string {
  return input.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function collectSearchRoots(): string[] {
  const roots: string[] = [];
  const add = (value: string | undefined) => {
    if (!value) {
      return;
    }
    if (!roots.includes(value)) {
      roots.push(value);
    }
  };

  add(process.cwd());
  add(process.env.INIT_CWD);
  add(process.env.PWD);

  try {
    add(path.dirname(fileURLToPath(import.meta.url)));
  } catch {
    // ignore; import.meta.url may be unavailable in some transpilation contexts
  }

  return roots;
}

function findPackageDirFrom(startDir: string, specifier: string): string | null {
  const segments = specifier.split("/");
  let currentDir = startDir;

  while (true) {
    const candidate = path.join(currentDir, "node_modules", ...segments);
    if (existsSync(candidate)) {
      return candidate;
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) {
      return null;
    }
    currentDir = parent;
  }
}

function findWorkspacePackageDirFrom(startDir: string, specifier: string): string | null {
  const maybeName = specifier.split("/").at(-1);
  if (!maybeName) {
    return null;
  }

  let currentDir = startDir;
  while (true) {
    const candidate = path.join(currentDir, "libs", maybeName);
    const packageJsonPath = path.join(candidate, "package.json");
    if (existsSync(packageJsonPath)) {
      try {
        const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as { name?: string };
        if (packageJson.name === specifier) {
          return candidate;
        }
      } catch {
        // ignore malformed package json
      }
    }

    const parent = path.dirname(currentDir);
    if (parent === currentDir) {
      return null;
    }
    currentDir = parent;
  }
}

function findPackageDir(specifier: string): string | null {
  for (const root of collectSearchRoots()) {
    const fromNodeModules = findPackageDirFrom(root, specifier);
    if (fromNodeModules) {
      return fromNodeModules;
    }

    const fromWorkspace = findWorkspacePackageDirFrom(root, specifier);
    if (fromWorkspace) {
      return fromWorkspace;
    }
  }

  return null;
}

function readPackageEntry(packageDir: string): string {
  const packageJsonPath = path.join(packageDir, "package.json");

  if (!existsSync(packageJsonPath)) {
    const fallback = path.join(packageDir, "dist", "index.js");
    if (existsSync(fallback)) {
      return fallback;
    }
    throw new Error(`Missing package.json in ${packageDir}`);
  }

  const packageJson = JSON.parse(readFileSync(packageJsonPath, "utf8")) as {
    exports?: Record<string, unknown> | string;
    module?: string;
    main?: string;
  };

  const candidates: string[] = [];
  const rootExport =
    typeof packageJson.exports === "object" && packageJson.exports !== null
      ? (packageJson.exports as Record<string, unknown>)["."]
      : undefined;

  if (typeof rootExport === "string") {
    candidates.push(rootExport);
  } else if (typeof rootExport === "object" && rootExport !== null) {
    const exportMap = rootExport as Record<string, unknown>;
    if (typeof exportMap.import === "string") {
      candidates.push(exportMap.import);
    }
    if (typeof exportMap.default === "string") {
      candidates.push(exportMap.default);
    }
  }

  if (typeof packageJson.module === "string") {
    candidates.push(packageJson.module);
  }
  if (typeof packageJson.main === "string") {
    candidates.push(packageJson.main);
  }
  candidates.push("./dist/index.js");

  for (const candidate of candidates) {
    const normalized = candidate.startsWith("./") ? candidate.slice(2) : candidate;
    const resolved = path.join(packageDir, normalized);
    if (existsSync(resolved)) {
      return resolved;
    }
  }

  throw new Error(`Unable to locate runtime entrypoint for package at ${packageDir}`);
}

function resolvePackageUrl(specifier: string): string {
  const packageDir = findPackageDir(specifier);
  if (!packageDir) {
    throw new Error(
      `Unable to resolve '${specifier}' while compiling generated DSL. Ensure local package builds are available.`
    );
  }

  const entryFile = readPackageEntry(packageDir);
  return pathToFileURL(entryFile).href;
}

function rewriteImportSpecifier(source: string, specifier: string, resolved: string): string {
  const escaped = escapeRegex(specifier);

  return source
    .replace(
      new RegExp(`(\\bfrom\\s*)(["'])${escaped}\\2`, "g"),
      (_full, prefix, quote) => `${prefix}${quote}${resolved}${quote}`
    )
    .replace(
      new RegExp(`(\\bimport\\s*\\(\\s*)(["'])${escaped}\\2(\\s*\\))`, "g"),
      (_full, prefix, quote, suffix) => `${prefix}${quote}${resolved}${quote}${suffix}`
    );
}

function rewriteRuntimeImports(source: string): string {
  const sdkDslUrl = resolvePackageUrl("@blue-labs/sdk-dsl");
  return rewriteImportSpecifier(source, "@blue-labs/sdk-dsl", sdkDslUrl);
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
    candidate = toOfficialJson(document);
    return normalizeToPlainJsonObject(candidate);
  }

  try {
    candidate = toOfficialJson(document as BlueNode);
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
  await writeFile(filePath, rewriteRuntimeImports(jsSource), "utf8");

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

  const documentJson = toSerializableDocumentJson(document);

  const structureInput = documentJson as Parameters<typeof DocStructure.from>[0];
  const structure = DocStructure.from(structureInput).toSummaryJson();

  return {
    code,
    document,
    documentJson,
    structure,
  };
}
