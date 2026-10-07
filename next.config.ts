import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Media uploads are capped at 8 MB per file (checked again in the action);
    // the extra headroom covers multipart overhead.
    serverActions: { bodySizeLimit: "9mb" },
  },
};

export default nextConfig;
