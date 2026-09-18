import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@circle-fin/x402-batching", "@x402/core", "@x402/evm"],
};

export default nextConfig;
