/**
 * Свежие видео YouTube-канала без ключа API: читаем публичный RSS-фид.
 * Поддерживаются channel_id и playlist_id (у DENDOR/DEWORLD оба известны).
 * Кэш 30 минут.
 */
import { connection, NextResponse } from "next/server";

import {
  YOUTUBE_CHANNEL_ID,
  YOUTUBE_CHANNEL_ID_OVERRIDE,
  YOUTUBE_CHANNEL_URL,
  YOUTUBE_PLAYLIST_ID,
  YOUTUBE_PLAYLIST_ID_OVERRIDE,
} from "@/lib/constants";

export interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  /** Прямая ссылка на конкретное видео — не на главную YouTube. */
  url: string;
}

interface FeedSource {
  kind: "channel" | "playlist";
  id: string;
  url: string;
}

interface YouTubeResponse {
  configured: boolean;
  source: FeedSource["kind"] | null;
  channelId: string | null;
  channelUrl: string | null;
  videos: YouTubeVideo[];
  error?: string;
}

let cached: { url: string; value: YouTubeResponse; expires: number } | null = null;
const TTL_MS = 30 * 60 * 1000;
const MAX_VIDEOS = 8;
const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
const CHANNEL_ID = /^UC[A-Za-z0-9_-]{22}$/;
const CACHE_HEADERS = {
  "Cache-Control": "public, s-maxage=1800, stale-while-revalidate=1800",
};

const NAMED_ENTITIES: Record<string, string> = {
  amp: "&",
  lt: "<",
  gt: ">",
  quot: '"',
  apos: "'",
  nbsp: "\u00a0",
  hellip: "…",
  mdash: "—",
  ndash: "–",
  laquo: "«",
  raquo: "»",
};

function decodeXmlEntities(text: string): string {
  return text
    .replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1")
    .replace(/&(#x[0-9a-fA-F]+|#\d+|[a-z]+);/gi, (_match, entity: string) => {
      if (entity.startsWith("#")) {
        const hex = entity.startsWith("#x");
        const code = Number.parseInt(entity.slice(hex ? 2 : 1), hex ? 16 : 10);
        return Number.isInteger(code) && code >= 0 && code <= 0x10ffff
          ? String.fromCodePoint(code)
          : "";
      }
      return NAMED_ENTITIES[entity.toLowerCase()] ?? `&${entity};`;
    });
}

function parseFeed(xml: string): YouTubeVideo[] {
  const entries = xml.match(/<entry\b[^>]*>[\s\S]*?<\/entry>/g) ?? [];
  const videos: YouTubeVideo[] = [];
  const seen = new Set<string>();

  for (const entry of entries) {
    const videoId =
      entry.match(/<yt:videoId>([\w-]{11})<\/yt:videoId>/)?.[1] ??
      entry.match(/<id>yt:video:([\w-]{11})<\/id>/)?.[1];
    if (!videoId || !VIDEO_ID.test(videoId) || seen.has(videoId)) continue;

    const rawTitle = entry.match(/<title(?:\s[^>]*)?>([\s\S]*?)<\/title>/)?.[1] ?? "";
    const publishedAt =
      entry.match(/<published>([^<]+)<\/published>/)?.[1] ??
      entry.match(/<updated>([^<]+)<\/updated>/)?.[1] ??
      "";
    const title = decodeXmlEntities(rawTitle).trim();
    if (!title) continue;

    seen.add(videoId);
    videos.push({
      videoId,
      title,
      publishedAt,
      url: `https://www.youtube.com/watch?v=${videoId}`,
    });
    if (videos.length >= MAX_VIDEOS) break;
  }

  return videos.sort((a, b) => b.publishedAt.localeCompare(a.publishedAt));
}

function feedSources(): FeedSource[] {
  const sources: FeedSource[] = [];
  const add = (kind: FeedSource["kind"], id: string | undefined) => {
    if (!id || !/^[\w-]+$/.test(id)) return;
    const url = `https://www.youtube.com/feeds/videos.xml?${kind}_id=${encodeURIComponent(id)}`;
    if (!sources.some((source) => source.url === url)) sources.push({ kind, id, url });
  };

  // Явно заданные значения имеют приоритет; пустые env → проверенные значения по умолчанию.
  add("playlist", YOUTUBE_PLAYLIST_ID_OVERRIDE);
  add("channel", YOUTUBE_CHANNEL_ID_OVERRIDE);
  add("channel", YOUTUBE_CHANNEL_ID);
  add("playlist", YOUTUBE_PLAYLIST_ID);
  return sources;
}

export async function GET() {
  // Явно читаем RSS на запрос (Next 16 Cache Components).
  await connection();

  const sources = feedSources();
  if (sources.length === 0) {
    return NextResponse.json({
      configured: false,
      source: null,
      channelId: null,
      channelUrl: null,
      videos: [],
    } satisfies YouTubeResponse);
  }

  const now = Date.now();
  if (cached && cached.expires > now) {
    return NextResponse.json(cached.value, { headers: CACHE_HEADERS });
  }

  let lastError = "feed_unavailable";
  for (const source of sources) {
    try {
      const res = await fetch(source.url, {
        // Кэшируем сами: ответ API не должен застревать в кэше Next.js.
        cache: "no-store",
        signal: AbortSignal.timeout(7000),
        headers: { "User-Agent": "deworld-forum/1.0" },
      });
      if (!res.ok) {
        lastError = `http_${res.status}`;
        continue;
      }

      const xml = await res.text();
      const videos = parseFeed(xml);
      if (videos.length === 0) {
        lastError = "empty_feed";
        continue;
      }

      const feedChannelId = xml.match(/<yt:channelId>([\w-]+)<\/yt:channelId>/)?.[1];
      const channelId =
        feedChannelId && CHANNEL_ID.test(feedChannelId)
          ? feedChannelId
          : YOUTUBE_CHANNEL_ID || null;
      const value: YouTubeResponse = {
        configured: true,
        source: source.kind,
        channelId,
        channelUrl: channelId ? `https://www.youtube.com/channel/${channelId}` : null,
        videos,
      };
      cached = { url: source.url, value, expires: now + TTL_MS };
      return NextResponse.json(value, { headers: CACHE_HEADERS });
    } catch {
      lastError = "youtube_unreachable";
    }
  }

  return NextResponse.json({
    configured: true,
    source: null,
    channelId: null,
    channelUrl: YOUTUBE_CHANNEL_URL,
    videos: [],
    error: lastError,
  } satisfies YouTubeResponse);
}
