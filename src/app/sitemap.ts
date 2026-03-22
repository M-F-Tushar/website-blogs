import type { MetadataRoute } from "next";

import {
  getAcademicPageData,
  getAboutPageData,
  getBlogsPageData,
  getContactPageData,
  getHomePageData,
  getPublishedAcademicEntries,
  getPublishedPosts,
  getPublishedRecommendations,
  getRecommendationsPageData,
} from "@/lib/content/queries";
import { getSiteUrl } from "@/lib/utils";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const siteUrl = getSiteUrl();
  const [home, about, blogs, academic, contact, recommendations, posts, entries, items] =
    await Promise.all([
      getHomePageData(),
      getAboutPageData(),
      getBlogsPageData(),
      getAcademicPageData(),
      getContactPageData(),
      getRecommendationsPageData(),
      getPublishedPosts(),
      getPublishedAcademicEntries(),
      getPublishedRecommendations(),
    ]);

  const topLevelPages = [
    home.page?.slug,
    about.page?.slug,
    blogs.page?.slug,
    academic.page?.slug,
    recommendations.page?.slug,
    contact.page?.slug,
  ].filter((path): path is string => Boolean(path));

  const uniqueTopLevelPages = Array.from(new Set(topLevelPages));

  return [
    ...uniqueTopLevelPages.map((path) => {
      const changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"] =
        path === "/" ? "weekly" : "monthly";

      return {
        url: new URL(path, siteUrl).toString(),
        changeFrequency,
        priority: path === "/" ? 1 : 0.8,
      };
    }),
    ...posts.map((post) => ({
      url: new URL(`/blogs/${post.slug}`, siteUrl).toString(),
      lastModified: post.publishedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...entries.map((entry) => ({
      url: new URL(`/academic/${entry.slug}`, siteUrl).toString(),
      lastModified: entry.completedAt ?? entry.startedAt ?? undefined,
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...items.map((item) => ({
      url: new URL(`/recommendations/${item.slug}`, siteUrl).toString(),
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
