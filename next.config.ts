import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "standalone",
  // Spark's small Kaniko builder can stall in Next's worker-based type-check
  // phase after compilation. Type safety is enforced separately by `npm run
  // typecheck`, which avoids duplicating that pass inside the image build.
  typescript: {
    ignoreBuildErrors: true,
  },
};

export default nextConfig;
