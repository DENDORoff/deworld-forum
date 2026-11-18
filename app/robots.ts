import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  const siteUrl =
    process.env.NEXT_PUBLIC_SITE_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000";

  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/admin", "/settings", "/profile", "/api", "/signin", "/signup"],
      },
    ],
    sitemap: `${siteUrl}/sitemap.xml`,
    host: siteUrl,
  };
}
