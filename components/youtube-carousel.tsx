"use client";

import { useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, MonitorPlay, Play } from "lucide-react";

import { YOUTUBE_CHANNEL_URL } from "@/lib/constants";

interface YouTubeVideo {
  videoId: string;
  title: string;
  publishedAt: string;
}

/**
 * Карусель видео YouTube-канала: источник — публичный RSS (без ключей API),
 * проксируется через /api/youtube с кэшем на 30 минут.
 */
export function YouTubeCarousel() {
  const [videos, setVideos] = useState<YouTubeVideo[] | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/youtube")
      .then((res) => res.json() as Promise<{ configured: boolean; videos: YouTubeVideo[] }>)
      .then((json) => {
        if (!cancelled) setVideos(json.videos ?? []);
      })
      .catch(() => {
        if (!cancelled) setVideos([]);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  if (videos === null) {
    return (
      <div aria-hidden className="overflow-hidden rounded-2xl border border-orange-100">
        <div className="skeleton aspect-video w-full" />
        <div className="skeleton m-4 h-4 w-2/3" />
      </div>
    );
  }

  if (videos.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-orange-200 bg-orange-50/50 px-6 py-10 text-center">
        <MonitorPlay size={36} className="text-red-500" aria-hidden />
        <h3 className="mt-3 font-semibold text-stone-900">Новые роли на канале скоро</h3>
        <p className="mt-1 max-w-sm text-sm text-stone-600">
          Подпишитесь на YouTube-канал DEWORLD — там появляются гайды, ивенты и сборки.
        </p>
        <a
          href={YOUTUBE_CHANNEL_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-red-600 px-4 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-red-700"
        >
          <MonitorPlay size={16} aria-hidden /> Перейти на канал
        </a>
      </div>
    );
  }

  const current = videos[index];
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
                aria-current={i === index}
                aria-label={`Видео: ${video.title}`}
                className={`focus-ring group w-40 overflow-hidden rounded-xl border text-left transition-all ${
                  i === index
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
