import Link from "next/link";

import type { NavigationItem, SiteSettings } from "@/types/content";

interface SiteHeaderProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
}

export function SiteHeader({ siteSettings, navigationItems }: SiteHeaderProps) {
  const headerItems = navigationItems.filter((item) => item.location === "header");

  return (
    <header className="sticky top-0 z-40 border-b border-white/30 bg-background/80 backdrop-blur-xl">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-5 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="group flex items-start gap-3">
          <span className="mt-1 inline-flex h-3 w-3 rounded-full bg-accent shadow-[0_0_24px_rgba(15,148,167,0.55)]" />
          <div>
            <p className="font-display text-xl font-semibold tracking-[-0.04em]">
              {siteSettings.siteName}
            </p>
            <p className="mt-1 text-sm text-muted">{siteSettings.siteTagline}</p>
          </div>
        </Link>

        <nav className="flex flex-wrap items-center gap-2 text-sm text-muted">
          {headerItems.map((item) => (
            <Link
              key={item.id}
              href={item.href}
              target={item.isExternal ? "_blank" : undefined}
              rel={item.isExternal ? "noreferrer" : undefined}
              className="rounded-full border border-transparent px-4 py-2 transition hover:border-border-strong hover:bg-white/40 hover:text-foreground"
            >
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
