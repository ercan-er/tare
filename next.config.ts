import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    remotePatterns: [{ protocol: "https", hostname: "images.unsplash.com" }],
  },
  // firebase-admin Node API'leri kullanır, edge runtime'a paketlenmesin.
  serverExternalPackages: ["firebase-admin", "@libsql/client"],
  transpilePackages: ["three", "@react-three/fiber", "@react-three/drei"],
};

export default nextConfig;
