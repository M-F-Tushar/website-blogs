import type { MetadataRoute } from "next";

import { getAppRuntimeStage } from "@/lib/supabase/env";
import { getSiteUrl } from "@/lib/utils";

export default function robots(): MetadataRoute.Robots {
  const siteUrl = getSiteUrl();
  const origin = new URL(siteUrl).origin;
  const isProduction = getAppRuntimeStage() === "production";

  if (!isProduction) {
    return {
      rules: {
        userAgent: "*",
        disallow: "/",
      },
    };
  }

  return {
    rules: {
      userAgent: "*",
      allow: "/",
      disallow: "/admin/",
    },
    sitemap: new URL("/sitemap.xml", siteUrl).toString(),
    host: origin,
  };
}
