import path from "node:path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["live-tests/**/*.spec.ts"],
    testTimeout: 180_000,
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname),
    },
  },
});
