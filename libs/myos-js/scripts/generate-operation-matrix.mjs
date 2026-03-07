import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import yaml from 'js-yaml';
import { OPERATION_CATALOG } from './operation-catalog.mjs';
import './generate-openapi-snapshot.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');

const schemaPath = path.join(projectRoot, 'openapi', 'api-schema-2.yaml');
const docsMatrixPath = path.join(projectRoot, 'docs', 'operation-matrix.md');
const rootMatrixPath = path.join(projectRoot, 'operation-matrix.md');

const schemaRaw = await readFile(schemaPath, 'utf-8');
const schema = yaml.load(schemaRaw);
const rows = [];
const liveCoveredOperations = new Set([
  'getUserData',
  'getUsersByIds',
  'createDocumentBootstrap',
  'getDocument',
  'runOperation',
  'createTimeline',
  'getTimeline',
  'createTimelineEntry',
  'getTimelineEntries',
  'getMyDocuments',
  'listMyOSEvents',
  'stopDocumentProcessing',
  'resumeDocumentProcessing',
]);
const webhookGatedOperations = new Set([
  'createWebhook',
  'updateWebhook',
  'deleteWebhook',
  'listWebhooks',
]);

for (const [apiPath, pathDef] of Object.entries(schema.paths)) {
  for (const [method, operation] of Object.entries(pathDef)) {
    if (!operation.operationId) {
      continue;
    }
    const catalogItem = OPERATION_CATALOG.find(
      (item) => item.operationId === operation.operationId,
    );
    const responseStatus =
      catalogItem?.responseStatus ??
      Number.parseInt(Object.keys(operation.responses ?? {})[0] ?? '200', 10);
    const responseSchemaRef =
      operation.responses?.[String(responseStatus)]?.content?.[
        'application/json'
      ]?.schema?.$ref;
    rows.push({
      tag: operation.tags?.[0] ?? 'Uncategorized',
      operationId: operation.operationId,
      method: method.toUpperCase(),
      path: apiPath,
      responseStatus,
      responseSchemaRef: responseSchemaRef ?? 'inline',
      pagination: catalogItem?.pagination ?? '-',
      sdkMethod: catalogItem?.sdkMethod ?? '-',
      coverage: catalogItem?.systemGated
        ? 'gated (system)'
        : webhookGatedOperations.has(operation.operationId)
          ? 'contract + live (webhook-gated)'
          : liveCoveredOperations.has(operation.operationId)
            ? 'contract + live'
            : 'contract + unit',
    });
  }
}

rows.sort((left, right) =>
  left.tag === right.tag
    ? left.operationId.localeCompare(right.operationId)
    : left.tag.localeCompare(right.tag),
);

const markdownLines = [
  '# MyOS JS SDK operation matrix',
  '',
  '_Generated from `openapi/api-schema-2.yaml`._',
  '',
  `Total operations: **${rows.length}**`,
  '',
  '| Tag | operationId | Method | Path | Response | Pagination | SDK method | Coverage |',
  '|---|---|---|---|---|---|---|---|',
  ...rows.map(
    (row) =>
      `| ${row.tag} | \`${row.operationId}\` | ${row.method} | \`${row.path}\` | ${row.responseStatus} ${row.responseSchemaRef} | ${row.pagination} | \`${row.sdkMethod}\` | ${row.coverage} |`,
  ),
  '',
];

await writeFile(docsMatrixPath, `${markdownLines.join('\n')}\n`, 'utf-8');

const summaryByTag = groupBy(rows, (row) => row.tag);
const summaryLines = [
  '# myos-js operation matrix',
  '',
  'Canonical machine-readable matrix:',
  '',
  '- [`docs/operation-matrix.md`](./docs/operation-matrix.md)',
  '',
  `Total operations: **${rows.length}**`,
  '',
  '| Tag | Operations |',
  '|---|---:|',
  ...Object.entries(summaryByTag)
    .sort(([left], [right]) => left.localeCompare(right))
    .map(([tag, entries]) => `| ${tag} | ${entries.length} |`),
  '',
];

await writeFile(rootMatrixPath, `${summaryLines.join('\n')}\n`, 'utf-8');

console.log(`Wrote operation matrix: ${docsMatrixPath}`);
console.log(`Wrote operation summary: ${rootMatrixPath}`);

function groupBy(items, keyFn) {
  const grouped = {};
  for (const item of items) {
    const key = keyFn(item);
    grouped[key] = grouped[key] ?? [];
    grouped[key].push(item);
  }
  return grouped;
}
