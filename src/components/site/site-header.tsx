import Link from "next/link";

import type { NavigationItem, SiteSettings } from "@/types/content";

interface SiteHeaderProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
}

export function SiteHeader({ siteSettings, navigationItems }: SiteHeaderProps) {
  const configuredHeaderItems = navigationItems.filter(
    (item) => item.location === "header" && item.isVisible,
  );
  const headerItems =
    configuredHeaderItems.length > 0
      ? configuredHeaderItems
      : [
          { id: "home", href: "/", isExternal: false, label: "Home" },
          { id: "about", href: "/about", isExternal: false, label: "About" },
          { id: "blogs", href: "/blogs", isExternal: false, label: "Blogs" },
          { id: "academic", href: "/academic", isExternal: false, label: "Academic" },
          {
            id: "contact",
            href: "/contact",
            isExternal: false,
            label: "Contact",
          },
        ];

  return (
    <header className="sticky top-0 z-50 border-b border-white/5 bg-background/60 backdrop-blur-3xl transition-colors duration-500">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-6 py-5 lg:flex-row lg:items-center lg:justify-between">
        <Link href="/" className="group flex items-center gap-4">
          <span className="brand-mark" aria-hidden="true">
            <span className="brand-link brand-link-a" />
            <span className="brand-link brand-link-b" />
            <span className="brand-link brand-link-c" />
            <span className="brand-node brand-node-a" />
            <span className="brand-node brand-node-b" />
            <span className="brand-node brand-node-c" />
          </span>
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3">
              <p className="font-display text-xl font-semibold tracking-[-0.05em] transition group-hover:text-accent-strong">
                {siteSettings.siteName}
              </p>
              <span className="signal-pill hidden sm:inline-flex">AI systems</span>
            </div>
            <p className="max-w-xl text-sm leading-6 text-muted">
              {siteSettings.siteTagline}
            </p>
          </div>
        </Link>

        <div className="flex flex-col gap-3 lg:items-end">
          <nav className="flex flex-wrap items-center gap-2 rounded-[1.5rem] border border-white/10 bg-white/5 p-2 shadow-2xl backdrop-blur-md">
            {headerItems.map((item) => (
              <Link
                key={item.id}
                href={item.href}
                target={item.isExternal ? "_blank" : undefined}
                rel={item.isExternal ? "noreferrer" : undefined}
                className="rounded-full px-4 py-2.5 text-sm text-muted transition hover:bg-white/10 hover:text-foreground"
              >
                {item.label}
              </Link>
            ))}
          </nav>
          <p className="hidden font-mono text-[0.68rem] uppercase tracking-[0.28em] text-muted lg:block">
            Personal AI engineering platform
          </p>
        </div>
      </div>
    </header>
  );
}
