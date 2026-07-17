/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    // Content images are user-supplied URLs or local uploads; skip the
    // optimizer so no remote-pattern config is needed.
    unoptimized: true,
  },
};

export default nextConfig;
