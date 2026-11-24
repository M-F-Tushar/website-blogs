import type { NextConfig } from "next";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
type RemotePattern = NonNullable<
  NonNullable<NextConfig["images"]>["remotePatterns"]
>[number];

const remotePatterns = (() => {
  if (!supabaseUrl) {
    return [];
  }

  try {
    const url = new URL(supabaseUrl);

    return [
      {
        protocol: url.protocol === "http:" ? "http" : "https",
        hostname: url.hostname,
        pathname: "/storage/v1/object/public/**",
      },
    ] satisfies RemotePattern[];
  } catch {
    return [];
  }
})() as RemotePattern[];

const supabaseOrigin = (() => {
  if (!supabaseUrl) {
    return null;
  }

  try {
    return new URL(supabaseUrl).origin;
  } catch {
    return null;
  }
})();

const isDev = process.env.NODE_ENV === "development";

const contentSecurityPolicy = [
  "default-src 'self'",
  // Next.js emits framework hydration/bootstrap scripts without a request nonce.
  `script-src 'self' 'unsafe-inline'${isDev ? " 'unsafe-eval'" : ""} https://challenges.cloudflare.com`,
  "style-src 'self' 'unsafe-inline'",
  `img-src 'self' data: blob:${supabaseOrigin ? ` ${supabaseOrigin}` : ""}`,
  "font-src 'self' data:",
  `connect-src 'self' https://challenges.cloudflare.com${supabaseOrigin ? ` ${supabaseOrigin}` : ""}${isDev ? " ws:" : ""}`,
  "frame-src https://challenges.cloudflare.com",
  "worker-src 'self' blob:",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'self'",
  "frame-ancestors 'none'",
].join("; ");

const securityHeaders = [
  { key: "Content-Security-Policy", value: contentSecurityPolicy },
  { key: "X-Frame-Options", value: "DENY" },
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  { key: "Permissions-Policy", value: "camera=(), microphone=(), geolocation=()" },
  ...(process.env.NODE_ENV === "production"
    ? [
        {
          key: "Strict-Transport-Security",
          value: "max-age=63072000; includeSubDomains",
        },
      ]
    : []),
];

const adminHeaders = [
  { key: "X-Robots-Tag", value: "noindex, nofollow, noarchive" },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
      {
        source: "/admin/:path*",
        headers: adminHeaders,
      },
    ];
  },
  experimental: {
    cpus: 1,
    webpackMemoryOptimizations: true,
    serverActions: {
      bodySizeLimit: "10mb",
      allowedOrigins: ["*.app.github.dev", "*.githubpreview.dev", "localhost:3000"],
    },
  },
  images: {
    remotePatterns,
    formats: ["image/avif", "image/webp"],
    minimumCacheTTL: 31_536_000,
  },
};

export default nextConfig;
