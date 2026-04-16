import path from "path";

/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@workspace/auth", "@workspace/ui"],
  devIndicators: false,
  typescript: {
    ignoreBuildErrors: true,
  },
  outputFileTracingIncludes: {
    "/*": ["./registry/**/*", "./styles/**/*"],
  },
  turbopack: {
    root: path.resolve(import.meta.dirname, "../.."),
  },
};

export default nextConfig;
