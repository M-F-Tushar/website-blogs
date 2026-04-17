import Link from "next/link";
import { Github, Linkedin, Mail } from "lucide-react";

import { NewsletterSignup } from "@/components/site/newsletter-signup";
import type { NavigationItem, PostSummary, SiteSettings } from "@/types/content";
import { formatDisplayDate } from "@/lib/utils";

interface SiteFooterProps {
  siteSettings: SiteSettings;
  navigationItems: NavigationItem[];
  recentPosts: PostSummary[];
}

function normalizeNavLabel(item: Pick<NavigationItem, "href" | "label">) {
  if (item.href === "/blogs" && item.label.trim().toLowerCase() === "blogs") {
    return "Blog";
  }

  return item.label;
}

export function SiteFooter({
  siteSettings,
  navigationItems,
  recentPosts,
}: SiteFooterProps) {
  const footerItems = navigationItems.filter(
    (item) => item.location === "footer" && item.isVisible,
  );
  const headerItems = navigationItems.filter(
    (item) => item.location === "header" && item.isVisible,
  );
  const navItems =
    footerItems.length > 0
      ? footerItems
      : headerItems.length > 0
        ? headerItems
        : [
            { id: "home", href: "/", isExternal: false, label: "Home" },
            { id: "about", href: "/about", isExternal: false, label: "About" },
            { id: "blogs", href: "/blogs", isExternal: false, label: "Blog" },
            {
              id: "recommendations",
              href: "/recommendations",
              isExternal: false,
              label: "Recommendations",
            },
            { id: "contact", href: "/contact", isExternal: false, label: "Contact" },
          ];

  return (
    <footer className="border-t border-white/6 bg-[rgba(6,10,22,0.96)] text-white">
      <div className="mx-auto max-w-7xl px-6 py-14">
        <div className="grid gap-10 lg:grid-cols-[1.15fr_0.75fr_0.95fr_1fr]">
          <div>
            <h2 className="font-display text-[2rem] font-semibold tracking-[-0.05em]">
              {siteSettings.siteName}
            </h2>
            <p className="mt-4 max-w-sm text-[0.96rem] leading-7 text-slate-400">
              {siteSettings.footerBlurb}
            </p>
            <div className="mt-6 flex items-center gap-3">
              {siteSettings.githubUrl ? (
                <a
                  href={siteSettings.githubUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="site-icon-button"
                  aria-label="GitHub"
                >
                  <Github className="h-4 w-4" />
                </a>
              ) : null}
              {siteSettings.linkedinUrl ? (
                <a
                  href={siteSettings.linkedinUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="site-icon-button"
                  aria-label="LinkedIn"
                >
                  <Linkedin className="h-4 w-4" />
                </a>
              ) : null}
              <a
                href={`mailto:${siteSettings.contactEmail}`}
                className="site-icon-button"
                aria-label="Email"
              >
                <Mail className="h-4 w-4" />
              </a>
            </div>
          </div>

          <div>
            <p className="footer-column-title">Explore</p>
            <div className="mt-5 flex flex-col gap-3.5 text-[0.96rem] text-slate-300">
              {navItems.map((item) => (
                <Link
                  key={item.id}
                  href={item.href}
                  target={item.isExternal ? "_blank" : undefined}
                  rel={item.isExternal ? "noreferrer" : undefined}
                  className="transition hover:text-white"
                >
                  {normalizeNavLabel(item)}
                </Link>
              ))}
            </div>
          </div>

          <div>
            <p className="footer-column-title">Latest Posts</p>
            <div className="mt-5 space-y-4">
              {recentPosts.map((post) => (
                <div key={post.id}>
                  <Link
                    href={`/blogs/${post.slug}`}
                    className="font-display text-[1.28rem] leading-[1.2] tracking-[-0.04em] text-white transition hover:text-sky-300"
                  >
                    {post.title}
                  </Link>
                  <p className="mt-1 text-sm text-slate-500">
                    {formatDisplayDate(post.publishedAt)}
                  </p>
                </div>
              ))}
            </div>
          </div>

          <div>
            <p className="footer-column-title">Stay Connected</p>
            <p className="mt-5 text-[0.96rem] leading-7 text-slate-400">
              The newsletter is not live yet, so these are the real ways to follow the work.
            </p>
            <NewsletterSignup
              compact
              className="mt-5"
              contactEmail={siteSettings.contactEmail}
            />
          </div>
        </div>

        <div className="mt-12 flex flex-col gap-4 border-t border-white/6 pt-6 text-sm text-slate-500 md:flex-row md:items-center md:justify-between">
          <p>
            © 2026 {siteSettings.siteName}. Built for a durable public record of growth.
          </p>
          <div className="flex items-center gap-5">
            <Link href="/sitemap.xml" className="transition hover:text-slate-300">
              Sitemap
            </Link>
            <a href="#top" className="transition hover:text-slate-300">
              Back to Top
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
