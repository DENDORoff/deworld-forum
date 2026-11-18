import Link from "next/link";
import Image from "next/image";
import {
  ArrowRight,
  Check,
  ChevronRight,
  Crown,
  Home,
  Megaphone,
  MessagesSquare,
  Shield,
  Sparkles,
  Sword,
  Users,
  Wrench,
} from "lucide-react";

import { prisma } from "@/lib/db";
import { getSetting, getSettingJson } from "@/lib/settings";
import { MINECRAFT_HOST, DISCORD_INVITE } from "@/lib/constants";
import { CopyIpButton } from "@/components/copy-ip-button";
import { ServerStatusCard } from "@/components/server-status";
import { DiscordCard } from "@/components/discord-card";
import { YouTubeCarousel } from "@/components/youtube-carousel";
import { FaqAccordion } from "@/components/faq-accordion";
import { timeAgo, plural } from "@/lib/utils";

export async function LandingContent() {
  const [
    members,
    topicCount,
    postCount,
    latestTopics,
    announcement,
    premiumPerks,
    premiumPriceLabel,
  ] = await Promise.all([
    prisma.user.count(),
    prisma.topic.count(),
    prisma.post.count(),
    prisma.topic.findMany({
      orderBy: { lastPostAt: "desc" },
      take: 4,
      select: {
        slug: true,
        title: true,
        replyCount: true,
        lastPostAt: true,
        category: { select: { name: true, slug: true } },
        author: { select: { name: true, username: true } },
      },
    }),
    getSetting("site_announcement"),
    getSettingJson<string[]>("premium_perks", []),
    getSetting("premium_price_label"),
  ]);

  return (
    <>
      {/* ── Анонс из админки ─────────────────────────────────────────── */}
      {announcement && (
        <div className="border-b border-amber-200 bg-gradient-to-r from-amber-100 via-orange-100 to-amber-100">
          <div className="mx-auto flex max-w-6xl items-center gap-3 px-4 py-2 text-sm text-amber-900 sm:px-6">
            <Megaphone size={16} className="shrink-0 text-orange-600" aria-hidden />
            <p className="min-w-0 truncate" title={announcement}>
              {announcement}
            </p>
            <Link
              href="/forum/news"
              className="ml-auto shrink-0 font-semibold underline underline-offset-2 hover:text-orange-800"
            >
              Новости
            </Link>
          </div>
        </div>
      )}

      {/* ── Hero ─────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-b from-orange-50/80 via-white to-white">
        <div className="dot-grid pointer-events-none absolute inset-0 opacity-60" aria-hidden />
        <div className="relative mx-auto grid max-w-6xl items-center gap-10 px-4 py-14 sm:px-6 lg:grid-cols-12 lg:py-20">
          <div className="lg:col-span-6">
            <p className="inline-flex items-center gap-2 rounded-full border border-orange-200 bg-white/80 px-3.5 py-1.5 text-xs font-semibold uppercase tracking-wider text-orange-700 shadow-sm">
              <Sparkles size={13} aria-hidden /> Сообщество Minecraft
            </p>
            <h1 className="mt-5 font-display text-4xl leading-[1.08] text-stone-900 sm:text-5xl xl:text-6xl">
              Всё ещё Minecraft,{" "}
              <span className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 bg-clip-text text-transparent">
                просто лучше.
              </span>
            </h1>
            <p className="mt-5 max-w-lg text-lg leading-relaxed text-stone-600">
              DEWORLD — выживание с характером: события, экономика сообщества и
              общий дом для творчества. Заходите на{" "}
              <span className="font-semibold text-stone-800">{MINECRAFT_HOST}</span> —
              регистрация займёт минуту.
            </p>
            <div className="mt-7 flex flex-wrap items-center gap-3">
              <a
                href="#server"
                className="focus-ring inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3.5 text-base font-semibold text-white shadow-md shadow-orange-500/30 transition-all hover:bg-orange-600 hover:shadow-lg hover:shadow-orange-500/40"
              >
                Начать играть
                <ArrowRight size={18} aria-hidden />
              </a>
              <Link
                href="/forum"
                className="focus-ring inline-flex items-center gap-2 rounded-xl border border-stone-200 bg-white px-6 py-3.5 text-base font-semibold text-stone-800 transition-colors hover:border-orange-300 hover:text-orange-800"
              >
                Форум
                <ChevronRight size={18} aria-hidden />
              </Link>
            </div>
            <p className="mt-4 text-sm text-stone-500">
              {plural(members, "участник", "участника", "участников")} ·{" "}
              {plural(topicCount, "тема", "темы", "тем")} на форуме · бесплатно
            </p>
          </div>

          <div className="lg:col-span-6">
            <div className="relative mx-auto max-w-md lg:max-w-none">
              <div
                aria-hidden
                className="absolute -inset-4 -z-10 rounded-[2.5rem] bg-gradient-to-tr from-orange-200/60 via-amber-100/40 to-transparent blur-2xl"
              />
              <Image
                src="/brand/hero-voxel.jpg"
                alt="Воксельный персонаж DEWORLD на фоне острова и облаков"
                width={1556}
                height={1556}
                priority
                className="aspect-square w-full rounded-3xl object-cover shadow-2xl shadow-orange-900/20 ring-1 ring-orange-200/60"
              />
              <div className="absolute bottom-4 left-4 inline-flex items-center gap-2 rounded-xl bg-black/70 px-4 py-2 text-sm font-semibold text-amber-300 ring-1 ring-white/20 backdrop-blur">
                <span className="relative flex h-2.5 w-2.5">
                  <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                  <span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-400" />
                </span>
                {MINECRAFT_HOST}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── Сервер + Discord ─────────────────────────────────────────── */}
      <section
        id="server"
        aria-labelledby="server-heading"
        className="bg-[#201405] py-16 sm:py-20"
      >
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-400/90">
                Сервер
              </p>
              <h2
                id="server-heading"
                className="mt-2 font-display text-2xl text-amber-50 sm:text-3xl"
              >
                Что в эфире прямо сейчас
              </h2>
            </div>
            <CopyIpButton ip={MINECRAFT_HOST} dark />
          </div>

          <div className="mt-8 grid gap-6 lg:grid-cols-12">
            <div className="lg:col-span-7">
              <ServerStatusCard />
              <dl className="mt-6 grid grid-cols-3 gap-4 text-center">
                {[
                  { value: members, label: "участников" },
                  { value: topicCount, label: "тем на форуме" },
                  { value: postCount, label: "сообщений" },
                ].map((stat) => (
                  <div
                    key={stat.label}
                    className="rounded-2xl bg-white/5 py-4 ring-1 ring-white/5"
                  >
                    <dt className="order-2 mt-1 text-[11px] uppercase tracking-wide text-orange-100/55">
                      {stat.label}
                    </dt>
                    <dd className="font-display text-2xl text-amber-100">{stat.value}</dd>
                  </div>
                ))}
              </dl>
            </div>
            <div className="lg:col-span-5">
              <DiscordCard />
            </div>
          </div>
        </div>
      </section>

      {/* ── Что внутри ───────────────────────────────────────────────── */}
      <section aria-labelledby="features-heading" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
            Что внутри
          </p>
          <h2
            id="features-heading"
            className="mt-2 max-w-2xl font-display text-2xl text-stone-900 sm:text-3xl"
          >
            Сервер, где хочется оставаться
          </h2>

          <div className="mt-10 grid gap-x-8 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {[
              {
                icon: Home,
                title: "Твой дом — по правилам",
                text: "Приваты от гриферов: строй спокойно, районы и города — под защитой команды и плагинов.",
              },
              {
                icon: Sword,
                title: "События и турниры",
                text: "Регулярные ивенты и конкурсы с призами и упоминанием в новостях на форуме.",
              },
              {
                icon: Users,
                title: "Живое сообщество",
                text: "Форум, Discord и общие сборки: находи тиммейтов, делись постройками и опытом.",
              },
              {
                icon: Shield,
                title: "Честная игра",
                text: "Активная модерация, античит и понятные правила — игры без грязи и «серых зон».",
              },
              {
                icon: Wrench,
                title: "Собственный контент",
                text: "Моды, шейдеры и сборки нашего сообщества — публикуйте и обсуждайте в разделе «Ресурсы».",
              },
              {
                icon: Crown,
                title: "Премиум для своих",
                text: "Подписка поддерживает проект: расширяет лимиты и открывает закрытый раздел.",
              },
            ].map((feature) => (
              <div key={feature.title} className="flex gap-4">
                <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-100 text-orange-600">
                  <feature.icon size={22} aria-hidden />
                </span>
                <span>
                  <h3 className="font-semibold text-stone-900">{feature.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-stone-600">{feature.text}</p>
                </span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Премиум-подписка ─────────────────────────────────────────── */}
      <section
        aria-labelledby="premium-heading"
        className="border-y border-orange-100 bg-[#FFF7EC] py-16 sm:py-20"
      >
        <div className="mx-auto grid max-w-6xl items-center gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-7">
            <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-amber-700">
              <Crown size={14} aria-hidden /> Премиум
            </p>
            <h2
              id="premium-heading"
              className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl"
            >
              Поддержи проект — получи больше
            </h2>
            <ul className="mt-6 space-y-3">
              {(premiumPerks.length > 0
                ? premiumPerks
                : [
                    "Увеличенные лимиты в игре и на форуме",
                    "Значок и звание Премиум",
                    "Скрытый раздел «Премиум-клуб» на форуме",
                    "Приоритетная поддержка по тикетам",
                  ]
              ).map((perk) => (
                <li key={perk} className="flex items-start gap-3 text-stone-800">
                  <Check size={18} className="mt-0.5 shrink-0 text-emerald-600" aria-hidden />
                  <span className="leading-snug">{perk}</span>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-sm font-medium text-amber-800">
              {premiumPriceLabel ?? "Стоимость и условия уточняйте на странице Премиум."}
            </p>
            <p className="mt-1 text-xs text-stone-500">
              Возврат в течение 7 дней, если подписка не использована. Подробнее — в{" "}
              <Link
                href="/legal/refund"
                className="underline underline-offset-2 hover:text-orange-700"
              >
                политике возврата
              </Link>
              .
            </p>
          </div>
          <div className="lg:col-span-5">
            <div className="rounded-2xl border border-amber-200/80 bg-gradient-to-br from-amber-100 via-orange-100 to-amber-50 p-7 text-center shadow-sm">
              <Crown size={44} className="mx-auto text-amber-500" strokeWidth={1.5} aria-hidden />
              <p className="mt-4 font-display text-xl text-stone-900">Премиум DEWORLD</p>
              <p className="mt-2 text-sm text-stone-600">
                Один план, честные условия и прямая поддержка сервера: железо, моды и призы
                для ивентов.
              </p>
              <Link
                href="/premium"
                className="focus-ring mt-5 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-stone-900 px-5 py-3 font-semibold text-amber-300 transition-colors hover:bg-stone-800"
              >
                Оформить подписку
                <ArrowRight size={17} aria-hidden />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── Видео ────────────────────────────────────────────────────── */}
      <section aria-labelledby="media-heading" className="py-16 sm:py-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                Медиа
              </p>
              <h2
                id="media-heading"
                className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl"
              >
                Видео с канала
              </h2>
            </div>
          </div>
          <div className="mt-8">
            <YouTubeCarousel />
          </div>
        </div>
      </section>

      {/* ── Свежие обсуждения ────────────────────────────────────────── */}
      <section aria-labelledby="discussions-heading" className="pb-16 sm:pb-24">
        <div className="mx-auto max-w-6xl px-4 sm:px-6">
          <div className="flex items-end justify-between gap-4">
            <div>
              <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
                <MessagesSquare size={14} aria-hidden /> Форум
              </p>
              <h2
                id="discussions-heading"
                className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl"
              >
                Свежие обсуждения
              </h2>
            </div>
            <Link
              href="/forum"
              className="focus-ring inline-flex shrink-0 items-center gap-1.5 text-sm font-semibold text-orange-700 hover:text-orange-800"
            >
              Весь форум
              <ArrowRight size={16} aria-hidden />
            </Link>
          </div>

          {latestTopics.length > 0 ? (
            <ul className="mt-6 divide-y divide-stone-100 border-y border-stone-100">
              {latestTopics.map((topic) => (
                <li key={topic.slug}>
                  <Link
                    href={`/forum/topic/${topic.slug}`}
                    className="focus-ring flex items-center gap-4 py-4 transition-colors hover:bg-orange-50/50"
                  >
                    <span className="hidden shrink-0 rounded-lg bg-orange-50 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-orange-800 sm:inline-block">
                      {topic.category.name}
                    </span>
                    <span className="min-w-0 flex-1 truncate font-medium text-stone-900">
                      {topic.title}
                    </span>
                    <span className="shrink-0 text-xs text-stone-500">
                      {plural(topic.replyCount, "ответ", "ответа", "ответов")} ·{" "}
                      {timeAgo(topic.lastPostAt)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          ) : (
            <div className="mt-6 rounded-2xl border border-dashed border-orange-200 bg-orange-50/40 p-8 text-center">
              <p className="font-semibold text-stone-800">Обсуждений пока нет</p>
              <p className="mt-1 text-sm text-stone-600">
                Станьте первым — создайте тему на форуме.
              </p>
              <Link
                href="/signup"
                className="focus-ring mt-4 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-5 py-2.5 text-sm font-semibold text-white hover:bg-orange-600"
              >
                Создать аккаунт
                <ArrowRight size={16} aria-hidden />
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────────────────── */}
      <section aria-labelledby="faq-heading" className="pb-16 sm:pb-24">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 sm:px-6 lg:grid-cols-12">
          <div className="lg:col-span-4">
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
              Частые вопросы
            </p>
            <h2
              id="faq-heading"
              className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl"
            >
              Коротко о главном
            </h2>
            <p className="mt-3 text-sm leading-relaxed text-stone-600">
              Не нашли ответ? Загляните в{" "}
              <Link href="/forum/support" className="font-semibold text-orange-700 hover:underline">
                раздел «Поддержка»
              </Link>{" "}
              на форуме или напишите в{" "}
              <a
                href={DISCORD_INVITE}
                className="font-semibold text-orange-700 hover:underline"
              >
                Discord
              </a>
              .
            </p>
          </div>
          <div className="lg:col-span-8">
            <FaqAccordion />
          </div>
        </div>
      </section>

      {/* ── Финальный CTA ────────────────────────────────────────────── */}
      <section className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 py-14 text-center">
        <div className="dot-grid-dark pointer-events-none absolute inset-0" aria-hidden />
        <div className="relative mx-auto max-w-3xl px-4">
          <h2 className="font-display text-3xl leading-tight text-white sm:text-4xl">
            Готов зайти?
          </h2>
          <p className="mt-3 text-lg text-orange-50">
            Введи <span className="font-bold text-white">{MINECRAFT_HOST}</span> в «Сетевая
            игра» — и мы уже ждём в мире DEWORLD.
          </p>
          <div className="mt-6 flex flex-wrap items-center justify-center gap-3">
            <CopyIpButton ip={MINECRAFT_HOST} dark />
            <Link
              href="/signup"
              className="focus-ring inline-flex items-center gap-2 rounded-xl bg-white px-6 py-3 font-semibold text-orange-700 shadow transition-colors hover:bg-orange-50"
            >
              Создать аккаунт
              <ArrowRight size={17} aria-hidden />
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
