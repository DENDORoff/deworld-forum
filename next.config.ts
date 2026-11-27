import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  // Security-заголовки для API-маршрутов (страницы закрыты CSP через proxy.ts).
  // Cache-Control не трогаем — у каждого API свой режим кэширования.
  async headers() {
    return [
      {
        source: "/api/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
        ],
      },
    ];
  },
};

export default nextConfig;
