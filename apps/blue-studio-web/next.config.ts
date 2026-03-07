import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  transpilePackages: ["@blue-labs/sdk-dsl", "@blue-labs/myos-js"],
};

export default nextConfig;
