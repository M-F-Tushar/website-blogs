import { getPublishedPosts, getSiteSettings } from "@/lib/content/queries";
import { absoluteUrl } from "@/lib/utils";

export const revalidate = 300;

function escapeXml(value: string) {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

export async function GET() {
  const [settings, posts] = await Promise.all([
    getSiteSettings(),
    getPublishedPosts({ limit: 50 }),
  ]);

  const items = posts
    .map((post) => {
      const url = absoluteUrl(`/blogs/${post.slug}`);

      return [
        "    <item>",
        `      <title>${escapeXml(post.title)}</title>`,
        `      <link>${escapeXml(url)}</link>`,
        `      <guid isPermaLink="true">${escapeXml(url)}</guid>`,
        post.excerpt ? `      <description>${escapeXml(post.excerpt)}</description>` : null,
        post.publishedAt
          ? `      <pubDate>${new Date(post.publishedAt).toUTCString()}</pubDate>`
          : null,
        "    </item>",
      ]
        .filter(Boolean)
        .join("\n");
    })
    .join("\n");

  const xml = [
    '<?xml version="1.0" encoding="UTF-8"?>',
    '<rss version="2.0" xmlns:atom="http://www.w3.org/2005/Atom">',
    "  <channel>",
    `    <title>${escapeXml(settings.siteName)}</title>`,
    `    <link>${escapeXml(absoluteUrl("/blogs"))}</link>`,
    `    <atom:link href="${escapeXml(absoluteUrl("/feed.xml"))}" rel="self" type="application/rss+xml" />`,
    `    <description>${escapeXml(settings.siteDescription)}</description>`,
    "    <language>en</language>",
    items,
    "  </channel>",
    "</rss>",
  ].join("\n");

  return new Response(xml, {
    headers: {
      "Content-Type": "application/rss+xml; charset=utf-8",
    },
  });
}
