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

const nextConfig: NextConfig = {
  images: {
    remotePatterns,
  },
};

export default nextConfig;
