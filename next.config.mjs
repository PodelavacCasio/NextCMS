/** @type {import('next').NextConfig} */
const nextConfig = {
  // Minimal self-contained server bundle for the Docker image
  output: "standalone",
  images: {
    // Content images are user-supplied URLs or local uploads; skip the
    // optimizer so no remote-pattern config is needed.
    unoptimized: true,
  },
};

export default nextConfig;
