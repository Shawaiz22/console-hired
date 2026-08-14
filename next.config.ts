import type { NextConfig } from "next";

// No `output: "standalone"` — that mode is for self-hosting and breaks Vercel's
// serverless build, which produces its own file-trace output.
const nextConfig: NextConfig = {};

export default nextConfig;
