import type { MetadataRoute } from "next";

import { prisma } from "@/lib/db";
import { absoluteUrl } from "@/lib/utils";

/** sitemap.xml: статика + разделы + последние публичные темы. */
export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: absoluteUrl("/"), changeFrequency: "daily", priority: 1.0 },
    { url: absoluteUrl("/forum"), changeFrequency: "hourly", priority: 0.9 },
    { url: absoluteUrl("/forum/rules"), changeFrequency: "monthly", priority: 0.4 },
    { url: absoluteUrl("/premium"), changeFrequency: "weekly", priority: 0.7 },
    { url: absoluteUrl("/legal/privacy"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/terms"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/cookies"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/refund"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/consent"), changeFrequency: "yearly", priority: 0.2 },
    { url: absoluteUrl("/legal/requisites"), changeFrequency: "yearly", priority: 0.2 },
  ];

  try {
    const [categories, topics] = await Promise.all([
      prisma.category.findMany({
        where: { premiumOnly: false },
        select: { slug: true },
      }),
      prisma.topic.findMany({
        where: { premiumOnly: false, category: { premiumOnly: false } },
        orderBy: { lastPostAt: "desc" },
        take: 500,
        select: { slug: true, updatedAt: true },
      }),
    ]);

    return [
      ...staticRoutes,
      ...categories.map((c): MetadataRoute.Sitemap[number] => ({
        url: absoluteUrl(`/forum/${c.slug}`),
        changeFrequency: "hourly",
        priority: 0.7,
      })),
      ...topics.map((t): MetadataRoute.Sitemap[number] => ({
        url: absoluteUrl(`/forum/topic/${t.slug}`),
        lastModified: t.updatedAt,
        changeFrequency: "weekly",
        priority: 0.6,
      })),
    ];
  } catch (error) {
    // БД недоступна — отдаём хотя бы статические маршруты
    console.error("[sitemap] db error", error);
    return staticRoutes;
  }
}
