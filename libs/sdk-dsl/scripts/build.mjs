import { mkdir, readFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "esbuild";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const srcEntry = path.join(projectRoot, "src", "index.ts");
const outDir = path.join(projectRoot, "dist");
const outFile = path.join(outDir, "index.js");

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const dependencies = Object.keys(packageJson.dependencies ?? {});
const peerDependencies = Object.keys(packageJson.peerDependencies ?? {});

await mkdir(outDir, { recursive: true });

await build({
  entryPoints: [srcEntry],
  outfile: outFile,
  bundle: true,
  format: "esm",
  platform: "node",
  target: "node20",
  sourcemap: true,
  external: [...dependencies, ...peerDependencies],
});
