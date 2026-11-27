"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MonitorPlay, Play } from "lucide-react";

import { YOUTUBE_CHANNEL_URL } from "@/lib/constants";

interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
  url?: string;
}

interface YouTubeResponse {
  configured: boolean;
  videos?: YouTubeVideo[];
  channelUrl?: string | null;
  error?: string;
}

const VIDEO_ID = /^[A-Za-z0-9_-]{11}$/;
// Никогда не ведём на главную YouTube: только на конкретный канал.
const FALLBACK_CHANNEL_URL = YOUTUBE_CHANNEL_URL.startsWith(
  "https://www.youtube.com/channel/",
)
  ? YOUTUBE_CHANNEL_URL
  : null;

function videoUrl(video: YouTubeVideo): string | null {
  if (!VIDEO_ID.test(video.videoId)) return null;
  return video.url ?? `https://www.youtube.com/watch?v=${video.videoId}`;
}

function ChannelLink({ href, label = "Перейти на канал" }: { href: string; label?: string }) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
    >
      <MonitorPlay size={16} aria-hidden /> {label}
    </a>
  );
}

function EmptyState({
  title,
  description,
  channelUrl,
  onRetry,
}: {
  title: string;
  description: string;
  channelUrl: string | null;
  onRetry?: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-10 text-center">
      <MonitorPlay size={36} className="text-red-500" aria-hidden />
      <h3 className="mt-3 font-semibold text-stone-900">{title}</h3>
      <p className="mt-1 max-w-sm text-sm text-stone-600">{description}</p>
      {channelUrl ? <ChannelLink href={channelUrl} /> : null}
      {onRetry ? (
        <button
          type="button"
          onClick={onRetry}
          className="focus-ring mt-3 rounded-xl px-4 py-2 text-sm font-medium text-stone-600 hover:bg-stone-100"
        >
          Повторить
        </button>
      ) : null}
    </div>
  );
}

/**
 * Карусель видео YouTube-канала: источник — публичный RSS (без ключей API),
 * проксируется через /api/youtube с кэшем на 30 минут.
 */
export function YouTubeCarousel() {
  const [data, setData] = useState<YouTubeResponse | null>(null);
  const [index, setIndex] = useState(0);
  const [attempt, setAttempt] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/youtube", { cache: "no-store" })
      .then((res) => {
        if (!res.ok) throw new Error("youtube request failed");
        return res.json() as Promise<YouTubeResponse>;
      })
      .then((json) => {
        if (!cancelled) setData(json);
      })
      .catch(() => {
        if (!cancelled) setData(null);
      });
    return () => {
      cancelled = true;
    };
  }, [attempt]);

  if (data === null) {
    return (
      <div aria-hidden className="overflow-hidden rounded-2xl border border-orange-100">
        <div className="skeleton aspect-video w-full" />
        <div className="skeleton m-4 h-4 w-2/3" />
      </div>
    );
  }

  const channelUrl = data.channelUrl ?? FALLBACK_CHANNEL_URL;
  const videos = (data.videos ?? []).filter((video) => videoUrl(video) !== null);

  if (!data.configured) {
    return (
      <EmptyState
        title="Канал не настроен"
        description="ID YouTube-канала или плейлиста не задан. Укажите NEXT_PUBLIC_YOUTUBE_CHANNEL_ID (или NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID) в окружении сайта."
        channelUrl={channelUrl}
      />
    );
  }

  if (videos.length === 0) {
    const unavailable = Boolean(data.error);
    return (
      <EmptyState
        title={unavailable ? "Видео временно недоступны" : "Новые роли на канале скоро"}
        description={
          unavailable
            ? "Не удалось прочитать ленту YouTube. Попробуйте ещё раз или загляните на канал напрямую."
            : "Подпишитесь на YouTube-канал DEWORLD — там появляются гайды, ивенты и сборки."
        }
        channelUrl={channelUrl}
        onRetry={unavailable ? () => setAttempt((value) => value + 1) : undefined}
      />
    );
  }

  const current = videos[index % videos.length];
  const currentUrl = videoUrl(current)!;
  const prev = () => setIndex((i) => (i - 1 + videos.length) % videos.length);
  const next = () => setIndex((i) => (i + 1) % videos.length);

  return (
    <div>
      <div className="overflow-hidden rounded-2xl border border-orange-100 bg-black shadow-sm">
        <iframe
          key={current.videoId}
          src={`https://www.youtube-nocookie.com/embed/${current.videoId}?rel=0`}
          title={current.title}
          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
          allowFullScreen
          loading="lazy"
          className="aspect-video w-full"
        />
      </div>

      <div className="mt-2 flex items-start justify-between gap-3">
        <p className="line-clamp-2 text-sm font-medium text-stone-800">{current.title}</p>
        <a
          href={currentUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring shrink-0 rounded-lg bg-red-600 px-3 py-1.5 text-xs font-semibold text-white transition-colors hover:bg-red-700"
        >
          Смотреть на YouTube
        </a>
      </div>

      <div className="mt-3 flex items-center gap-3">
        <button
          type="button"
          onClick={prev}
          aria-label="Предыдущее видео"
          className="focus-ring shrink-0 rounded-xl border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-50"
        >
          <ChevronLeft size={18} />
        </button>

        <ol className="flex flex-1 gap-3 overflow-x-auto pb-1" aria-label="Список видео">
          {videos.map((video, i) => (
            <li key={video.videoId} className="shrink-0">
              <button
                type="button"
                onClick={() => setIndex(i)}
                aria-current={i === index % videos.length}
                aria-label={`Видео: ${video.title}`}
                className={`focus-ring group w-40 overflow-hidden rounded-xl border text-left transition-all ${
                  i === index % videos.length
                    ? "border-orange-400 ring-2 ring-orange-200"
                    : "border-stone-200 hover:border-orange-300"
                }`}
              >
                <span className="relative block aspect-video w-40 overflow-hidden bg-stone-100">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={`https://i.ytimg.com/vi/${video.videoId}/mqdefault.jpg`}
                    alt=""
                    loading="lazy"
                    className="h-full w-full object-cover"
                  />
                  <span className="absolute inset-0 flex items-center justify-center bg-black/20 opacity-0 transition-opacity group-hover:opacity-100">
                    <Play size={22} className="text-white drop-shadow" fill="currentColor" aria-hidden />
                  </span>
                </span>
                <span className="line-clamp-2 block p-2 text-[11px] font-medium leading-snug text-stone-700">
                  {video.title}
                </span>
              </button>
            </li>
          ))}
        </ol>

        <button
          type="button"
          onClick={next}
          aria-label="Следующее видео"
          className="focus-ring shrink-0 rounded-xl border border-stone-200 p-2 text-stone-600 transition-colors hover:bg-stone-50"
        >
          <ChevronRight size={18} />
        </button>
      </div>
    </div>
  );
}
