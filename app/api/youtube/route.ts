/**
 * Свежие видео канала YouTube без ключа API: читаем публичный RSS-фид.
 * Кэш 30 минут. Источник настраивается NEXT_PUBLIC_YOUTUBE_CHANNEL_ID.
 */
import { NextResponse } from "next/server";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
}

let cached: { value: YouTubeVideo[]; expires: number } | null = null;
const TTL_MS = 30 * 60 * 1000;
const MAX_VIDEOS = 8;

function decodeXmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&apos;/g, "'")
    .replace(/&#(\d+);/g, (_, code: string) => String.fromCharCode(Number(code)))
    .replace(/&#x([0-9a-fA-F]+);/g, (_, hex: string) => String.fromCharCode(parseInt(hex, 16)));
}

function parseFeed(xml: string): YouTubeVideo[] {
  const videos: YouTubeVideo[] = [];
  const entries = xml.split("<entry>").slice(1);
  for (const entry of entries) {
    const videoId = entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1];
    const title = entry.match(/<title>([^<]+)<\/title>/)?.[1];
    const publishedAt = entry.match(/<published>([^<]+)<\/published>/)?.[1] ?? "";
    if (videoId && title) {
      videos.push({ videoId, title: decodeXmlEntities(title), publishedAt });
    }
    if (videos.length >= MAX_VIDEOS) break;
  }
  return videos;
}

export async function GET() {
  const channelId = process.env.NEXT_PUBLIC_YOUTUBE_CHANNEL_ID;
  if (!channelId) {
    return NextResponse.json({ configured: false, videos: [] as YouTubeVideo[] });
  }

  const now = Date.now();
  if (cached && cached.expires > now) {
    return NextResponse.json(
      { configured: true, videos: cached.value },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=1800" } },
    );
  }

  try {
    const res = await fetch(
      `https://www.youtube.com/feeds/videos.xml?channel_id=${encodeURIComponent(channelId)}`,
      { signal: AbortSignal.timeout(6000), headers: { "User-Agent": "deworld-forum/1.0" } },
    );
    if (!res.ok) {
      return NextResponse.json({ configured: true, videos: [], error: `HTTP ${res.status}` });
    }
    const xml = await res.text();
    const videos = parseFeed(xml);
    cached = { value: videos, expires: now + TTL_MS };
    return NextResponse.json(
      { configured: true, videos },
      { headers: { "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=1800" } },
    );
  } catch {
    return NextResponse.json({ configured: true, videos: [], error: "youtube_unreachable" });
  }
}
