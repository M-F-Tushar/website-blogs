import type { ReactNode } from "react";

import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteChromeData } from "@/lib/content/queries";

export default async function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { siteSettings, navigationItems } = await getSiteChromeData();

  return (
    <div className="min-h-screen">
      <SiteHeader siteSettings={siteSettings} navigationItems={navigationItems} />
      <main>{children}</main>
      <SiteFooter siteSettings={siteSettings} navigationItems={navigationItems} />
    </div>
  );
}
