import type { ReactNode } from "react";

import { BackToTopButton } from "@/components/site/back-to-top-button";
import { NebulaBackground } from "@/components/site/nebula-background";
import { SiteFooter } from "@/components/site/site-footer";
import { SiteHeader } from "@/components/site/site-header";
import { getSiteChromeData } from "@/lib/content/queries";

export default async function PublicLayout({
  children,
}: Readonly<{ children: ReactNode }>) {
  const { siteSettings, navigationItems, recentPosts } = await getSiteChromeData();

  return (
    <div id="top" className="theme-blogsite relative min-h-screen overflow-x-clip">
      <NebulaBackground />
      <SiteHeader siteSettings={siteSettings} navigationItems={navigationItems} />
      <main className="relative z-10">{children}</main>
      <SiteFooter
        siteSettings={siteSettings}
        navigationItems={navigationItems}
        recentPosts={recentPosts}
      />
      <BackToTopButton />
    </div>
  );
}
