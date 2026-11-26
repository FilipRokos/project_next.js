import type { NextConfig } from "next";

const nextConfig: NextConfig = {
    outputFileTracingIncludes: {
        "/api/receipts/segment": [
            "./node_modules/@img/sharp-linux-x64/**/*",
            "./node_modules/@img/sharp-libvips-linux-x64/**/*",
        ],
    },
    images: {
        remotePatterns: [
            { protocol: 'https', hostname: 'drive.google.com' },
            { protocol: 'https', hostname: 'lh3.googleusercontent.com' },
        ],
    },};

export default nextConfig;
