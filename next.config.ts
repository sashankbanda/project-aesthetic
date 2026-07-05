import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow opening the dev server from other devices on the LAN
  // (phone testing via http://192.168.x.x:3000). Dev-only setting —
  // production builds don't use this.
  allowedDevOrigins: ["192.168.0.108", "localhost"],
};

export default nextConfig;
