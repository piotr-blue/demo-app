import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@blue-labs/sdk-dsl", "@blue-labs/myos-js"],
  outputFileTracingIncludes: {
    "/api/**": ["./lib/prompts/*.md"],
  },
  webpack: (config) => {
    config.resolve = config.resolve ?? {};
    config.resolve.extensionAlias = {
      ...(config.resolve.extensionAlias ?? {}),
      ".js": [".ts", ".tsx", ".js"],
      ".mjs": [".mts", ".mjs"],
      ".cjs": [".cts", ".cjs"],
    };
    return config;
  },
};

export default nextConfig;
