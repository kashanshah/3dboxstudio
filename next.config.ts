import type { NextConfig } from "next";

const shareTokenPattern = "[0-9A-Za-z]{10,24}";

const nextConfig: NextConfig = {
  reactStrictMode: true,
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
  async redirects() {
    return [
      {
        source: "/studio",
        has: [{ type: "query", key: "share", value: `(?<shareId>${shareTokenPattern})` }],
        destination: "/studio/:shareId",
        permanent: true,
      },
      {
        source: "/studio",
        has: [{ type: "query", key: "preview", value: `(?<previewToken>${shareTokenPattern})` }],
        destination: "/preview/:previewToken",
        permanent: true,
      },
    ];
  },
};

export default nextConfig;
