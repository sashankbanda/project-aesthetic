import type { NextConfig } from "next";
import path from "node:path";

const nextConfig: NextConfig = {
  // Pin the workspace root — Turbopack occasionally mis-infers it on
  // Windows paths with spaces, killing the dev server mid-session.
  turbopack: {
    root: path.join(__dirname),
  },
  // Allow opening the dev server from other devices on the LAN
  // (phone testing via http://192.168.x.x:3000). Dev-only setting —
  // production builds don't use this.
  allowedDevOrigins: ["192.168.0.108", "localhost"],
};

export default nextConfig;
