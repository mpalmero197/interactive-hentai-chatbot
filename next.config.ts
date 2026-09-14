import type { NextConfig } from "next";

const staticExport = process.env.STATIC_EXPORT === "1";

const nextConfig: NextConfig = {
  transpilePackages: ["pixi.js"],
  ...(staticExport
    ? {
        output: "export",
        basePath: process.env.BASE_PATH || "",
        assetPrefix: process.env.BASE_PATH || "",
        images: { unoptimized: true },
      }
    : {}),
};

export default nextConfig;
