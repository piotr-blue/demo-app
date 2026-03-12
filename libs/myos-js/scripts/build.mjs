import { access, mkdir, readFile, writeFile } from "node:fs/promises";
import { spawn } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { build } from "vite";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, "..");
const packageJsonPath = path.join(projectRoot, "package.json");
const distPackageJsonPath = path.join(projectRoot, "dist", "package.json");
const sdkDslDistIndex = path.resolve(projectRoot, "../sdk-dsl/dist/index.d.ts");

await ensureSdkDslBuild();

await build({
  configFile: path.join(projectRoot, "vite.config.ts"),
});

const packageJson = JSON.parse(await readFile(packageJsonPath, "utf8"));
const distPackageJson = createDistPackageJson(packageJson);

await mkdir(path.dirname(distPackageJsonPath), { recursive: true });
await writeFile(
  distPackageJsonPath,
  `${JSON.stringify(distPackageJson, null, 2)}\n`,
);

async function ensureSdkDslBuild() {
  try {
    await access(sdkDslDistIndex);
  } catch {
    await runSdkDslBuild();
  }
}

function runSdkDslBuild() {
  return new Promise((resolve, reject) => {
    const child = spawn(
      process.platform === "win32" ? "npm.cmd" : "npm",
      ["run", "build", "-w", "@blue-labs/sdk-dsl"],
      {
        cwd: path.resolve(projectRoot, "..", ".."),
        stdio: "inherit",
      },
    );

    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
        return;
      }

      reject(
        new Error(
          `Failed to build @blue-labs/sdk-dsl prerequisite (exit code ${code ?? "unknown"}).`,
        ),
      );
    });
    child.on("error", reject);
  });
}

function createDistPackageJson(packageJson) {
  const distPackageJson = {
    ...packageJson,
    main: rewriteDistEntry(packageJson.main),
    module: rewriteDistEntry(packageJson.module),
    types: rewriteDistEntry(packageJson.types),
    exports: rewriteDistEntry(packageJson.exports),
  };

  delete distPackageJson.files;
  delete distPackageJson.scripts;
  delete distPackageJson.devDependencies;

  return distPackageJson;
}

function rewriteDistEntry(value) {
  if (typeof value === "string") {
    return value.startsWith("./dist/")
      ? `./${value.slice("./dist/".length)}`
      : value;
  }

  if (Array.isArray(value)) {
    return value.map(rewriteDistEntry);
  }

  if (value && typeof value === "object") {
    return Object.fromEntries(
      Object.entries(value).map(([key, entryValue]) => [
        key,
        rewriteDistEntry(entryValue),
      ]),
    );
  }

  return value;
}
