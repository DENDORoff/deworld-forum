# DEWORLD — форум и сайт проекта

> Всё ещё Minecraft, просто лучше.

Сайт-лендинг и форум Minecraft-проекта **DEWORLD** (de-world.net): лендинг с живым статусом
сервера, форум с разделами и темами, регистрация и вход (email, Google, GitHub, Discord, VK,
Minecraft по LimboAuth), 2FA, роли, премиум-подписка, админ-панель для редактирования контента,
юридические страницы и GDPR/152-ФЗ-инструменты (удаление аккаунта, экспорт, cookie-баннер).

## Стек

- **Next.js 16** (App Router, Cache Components / Partial Prerendering) + **React 19** + **TypeScript**
- **Tailwind CSS v4**, шрифты Rubik и Russo One (загружаются с нашего сервера)
- **Prisma 7** (драйвер-адаптер `@prisma/adapter-pg`, генератор `prisma-client`) + **PostgreSQL**
  - production: **[Neon](https://neon.tech)** (serverless Postgres)
  - локальная разработка: любой PostgreSQL (в проекте использовался PostgreSQL 17)
- **Auth.js (NextAuth v5)** — JWT-сессии, OAuth-провайдеры, Credentials + LimboAuth
- **Node 26**

## Что реализовано

**Лендинг (`/`)**
- Липкая шапка с навигацией и состоянием входа/премиума
- Hero с воксельной графикой DEWORLD и CTA
- Живой статус сервера по Server List Ping (MOTD, онлайн, версия, пинг) — `/api/server-status`, кэш 45 с
- Статистика сообщества (участники, темы, сообщения) из БД
- Карточка Discord-сервера (онлайн через виджет-API, прокси `/api/discord-widget`, кэш 5 мин)
- Карусель видео YouTube-канала (через RSS, без API-ключей — `/api/youtube`, кэш 30 мин)
- FAQ-аккордеон, анонс из админки, SEO (OG, JSON-LD, sitemap.xml, robots.txt, manifest)

**Форум (`/forum`)**
- Разделы, темы, ответы; slug'и из транслитерированного заголовка (`/forum/topic/sezon-3-…`)
- Закрепление/закрытие тем, лайки, «ответ» как решение обсуждения, счётчик просмотров
- Премиум-раздел «Премиум-клуб» (доступ по подписке), прем-темы
- Поиск по темам (`/forum/search`), пагинация, пустой-стейт, скелетоны вместо спинеров

**Аккаунты**
- Регистрация/вход по email+паролю (bcrypt), OAuth: Google / GitHub / Discord / VK (env-gated)
- Вход ником Minecraft по паролю LimboAuth (сверка по БД LimboAuth; опционально, `LIMBOAUTH_DATABASE_URL`)
- **2FA (TOTP)**: подключение по QR-коду, код запрашивается при входе
- Привязка любых провайдеров к одному аккаунту; привязка Minecraft-ника в настройках
- Роли: `USER` < `MODERATOR` < `ADMIN`; премиум-флаг `premiumUntil`

**Админка (`/admin`, MODERATOR/ADMIN)**
- Обзор статистики, аудит-лог действий
- Разделы форума: создание/изменение/удаление/порядок/премиум-флаг
- Темы: модерация (закрепить/закрыть/удалить)
- Пользователи: поиск, роли, выдача/отзыв премиума
- Настройки сайта без релиза: анонс, подпись цены и преимущества премиума (хранятся в БД, кэш 60 с)

**152-ФЗ**
- Согласие при регистрации, отдельная страница согласия, политика конфиденциальности,
  cookie-баннер без предпроставленных галочек, «право на удаление/копию данных» (мгновенное удаление аккаунта),
  страница реквизитов, возрастная планка 14+

## Быстрый старт (локально)

```bash
# 1. Зависимости
npm install          # postinstall сам сделает prisma generate

# 2. База данных (PostgreSQL 15+). Например, локально:
#    createdb deworld

# 3. Окружение
cp .env.example .env
# отредактируйте .env: DATABASE_URL, AUTH_SECRET (npx auth secret)

# 4. Схема + начальные данные
npx prisma migrate deploy
npx prisma db seed   # разделы, достижения, настройки, администратор
                     # (задайте ADMIN_EMAIL/ADMIN_PASSWORD или получите сгенерированный пароль в консоли)

# 5. Запуск
npm run dev          # http://localhost:3000
```

Проверка production-сборки:

```bash
npm run build
npm start
```

## Деплой на Vercel + Neon

1. Создайте проект на **Neon** → скопируйте connection string (понадобится `DATABASE_URL`
   с `?sslmode=require`).
2. Захостите репозиторий на GitHub (`deworld-forum`).
3. Import Project на **Vercel** → Framework Preset: Next.js.
4. **Environment Variables** (Production):
   - `DATABASE_URL` — строка Neon
   - `AUTH_SECRET` — сгенерируйте: `npx auth secret`
   - `AUTH_URL` — `https://de-world.net`
   - `NEXT_PUBLIC_SITE_URL` — `https://de-world.net`
   - Плюс OAuth-ключи по мере настройки (см. таблицу ниже)
5. В Neon выполните миграции один раз: `npx prisma migrate deploy` (с вашего компьютера или из CI,
   указав `DATABASE_URL` от Neon).
6. Deploy. `postinstall` на Vercel сам выполнит `prisma generate`.
7. Привяжите домен `de-world.net` в Vercel → DNS у вашего регистратора.
8. Обновите `AUTH_URL`/`NEXT_PUBLIC_SITE_URL` на финальный домен.

### Переменные окружения

| Переменная | Назначение | Обязательна |
|---|---|---|
| `DATABASE_URL` | PostgreSQL (Neon) | ✓ |
| `AUTH_SECRET` | подпись JWT/сессий | ✓ |
| `AUTH_URL` | базовый URL (OAuth callback) | ✓ в prod |
| `NEXT_PUBLIC_SITE_URL` | канонический URL (sitemap/OG) | recommended |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | вход через Google | опционально |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | вход через GitHub | опционально |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | вход через Discord (+sync профиля) | опционально |
| `AUTH_VK_ID` / `AUTH_VK_SECRET` | вход через ВКонтакте (oauth.vk.com) | опционально |
| `LIMBOAUTH_DATABASE_URL` | отдельный пул к БД LimboAuth (вход по нику/паролю) | опционально |
| `LIMBOAUTH_TABLE` / `..._USERNAME_COLUMN` / `..._PASSWORD_COLUMN` / `..._ID_COLUMN` | имена таблицы/колонок LimboAuth (по умолчанию `limboauth`, `name`, `password`, `id`) | опционально |
| `MINECRAFT_SERVER_HOST` / `MINECRAFT_SERVER_PORT` | виджет статуса сервера | по умолчанию mc.de-world.net:25565 |
| `NEXT_PUBLIC_DISCORD_INVITE` | ссылка-инвайт в Discord | ✓ (иначе показывается заглушка) |
| `NEXT_PUBLIC_DISCORD_GUILD_ID` | ID сервера для живого счётчика онлайна | опционально |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` | ID канала для карусели видео (RSS) | опционально |
| `RATE_LIMIT_ENABLED` | вкл/выкл лимиты запросов (`true`/`false`) | `true` |
| `ADMIN_EMAIL` | email администратора при `prisma db seed` | нет (default admin@de-world.net) |
| `ADMIN_PASSWORD` | пароль администратора при `prisma db seed` | нет (иначе сгенерируется и напечатается) |

OAuth-кнопка видна только для провайдера, у которого заполнены ключи (`AUTH_*_ID`).

### Локальная БД / чистый старт

```bash
# Полностью пересоздать схему
npx prisma migrate reset --force   # дроп + миграции + seed
```

> **Замечание:** Prisma 7 работает без Rust-движка (Query Compiler) и требует драйвер-адаптер
> (`@prisma/adapter-pg`) — уже настроено в `lib/db.ts` и `prisma.config.ts`.

## Архитектура и безопасность

- **Сессии**: JWT в httpOnly-cookie (`SameSite=Lax`, `Secure` в production), срок 30 дней.
- **Пароли**: bcrypt (12 раундов). Plaintext нигде не хранится и не логируется.
- **CSRF**: Server Actions в Next.js проверяют Origin; `form-action 'self'` в CSP.
- **XSS**: React экранирует весь пользовательский ввод; «маркдаун-лайт» рендерит текст,
  ссылки только в `rel="noopener noreferrer nofollow"`. HTML не интерпретируется.
- **SQL**: только Prisma с параметризованными запросами. Никакой склейки строк.
- **Proxy (бывший middleware)** — `proxy.ts`:
  - CSP без nonce: `default-src 'self'`, `script-src 'self' 'unsafe-inline'` (статические
    inline-скрипты Next.js), `frame-src` только YouTube/Discord;
  - `X-Frame-Options: DENY`, `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`;
  - оптимистичная защита `/admin` (роль MODERATOR/ADMIN) и `/settings` (авторизация);
  - полная проверка прав — в каждой Server Action (защита от прямого POST).
- **Rate limiting**: вход (5 попыток / 15 мин / IP+email), регистрация (5/час/IP), создание тем/постов,
  привязка Minecraft. In-memory; для нескольких инстансов замените на Redis (см. `lib/rate-limit.ts`).
- **Аудит**: все значимые действия пишутся в `AuditLog` (IP, user agent IP, цель) — `/admin/logs`.
- **Роли**: проверяются на сервере, прокидываются в JWT-claims (перечитываются из БД раз в 10 мин).
- **Уязвимости зависимостей**: `npm audit` — **0** найденных на момент сдачи.

> Жёсткий CSP с per-request nonce (без `unsafe-inline`) требует всех страниц динамическими;
> текущий компромисс — статический shell + стриминг (PPR). Если потребуется — включите nonce-вариант,
> см. `node_modules/next/dist/docs/01-app/02-guides/content-security-policy.md`.

## Закон РФ (152-ФЗ) — что сделано и что осталось сделать вручную

Сделано в коде:
- Согласие на обработку ПДн при регистрации (+ отдельная страница `/legal/consent`);
- Политика конфиденциальности, Условия, Cookie, Возврат средств, Реквизиты;
- Cookie-баннер по 152-ФЗ: необходимые всегда, аналитика/маркетинг — только с явного согласия;
- «Запросить удаление данных» и мгновенное самостоятельное удаление аккаунта (`/settings#danger`);
- «Запросить копию данных» (privacy@de-world.net);
- Шрифты и ассеты — с собственного домена (next/font self-hosting).

**Осталось на вас (обязательно перед публичным запуском):**
1. Заполнить **ИП/самозанятый реквизиты** в `app/legal/requisites/page.tsx` (ИНН, адрес, статус; оферта на оплату).
2. Подать **уведомление в РКН** (rkn.gov.ru) об обработке ПДн и указать номер реестровой записи в `/legal/requisites` и `/legal/privacy`.
3. Поскольку hosting/DB в США (Vercel + Neon), проверьте применимость ст. 12 152-ФЗ
   («трансграничная передача») и реестр стран, обеспечивающих адекватную защиту:
   для полной гарантии локализации баз первичных ПДн россиян рассмотрите российские
   хостинг/БД (решение за владельцем проекта).
4. Проверить текст документов (или показать юристу) — формулировки типовые, но реквизиты
   должны соответствовать вашему статусу.
5. Уведомление пользователей об изменениях политики — ведёте сами (дискорд/форум/email).

## Структура проекта

```
app/                    # маршруты (App Router)
  page.tsx              #   лендинг (PPR-shell + стриминг контента)
  forum/                #   форум: index, [category], topic/[slug], new, rules, search
  signin|signup/        #   аутентификация
  settings|profile/     #   аккаунт и публичные профили
  admin/                #   админ-панель (layout + разделы)
  legal/                #   6 юридических страниц
  api/                  #   server-status, discord-widget, youtube, auth
  sitemap.ts robots.ts manifest.ts
components/             # UI (серверные и клиентские компоненты)
lib/                    # db, actions (server), validations, settings, auth-хелперы, …
prisma/                 # schema.prisma, migrations, seed.ts (+ seed-demo.ts)
types/                  # расширение типов NextAuth
proxy.ts                # security-заголовки + защита /admin, /settings
```

## Плагин для Minecraft и Roadmap

**Отдельная задача (уже обсуждена):** Paper-плагин (Paper API, JDK 25 / Gradle JDK 22,
IntelliJ IDEA) для интеграции:
- Подключение к той же БД (общий `minecraftUsername`/`limboAuthId`);
- Отправка достижений в игру и на форум (LimboAuth для привязки);
- Синхронизация общего чата (форум ⇄ игра) через плагин + SSE/WebSocket или pull-модель;
- Выдача премиум-привилегий по `premiumUntil` из БД форума.

Порядок работ: плагин в отдельном репозитории, вебхуки (секретные токены) → форум проверяет подпись;
тяжёлая обработка — вне главного потока; конфигурация через config.yml; внешние библиотеки —
через секцию `libraries` в plugin.yml.

**Roadmap сайта** (схема БД уже готова):
- Вики-статьи с комментариями; Раздел «Ресурсы» с тегами, лайками, счётчиком загрузок;
- Тикеты поддержки (пользователь ⇄ модератор); Жалобы и их модерация;
- Достижения (каталог уже засеян) + авто-выдача по метрикам;
- Общий чат на форуме и в игре;
- Оплата премиума (ЮKassa/CloudPayments) с пересчётом цены на сервере и webhook-выдачей премиума;
- Email-восстановление пароля (после подключения SMTP/Resend: `RESEND_API_KEY`);
- Discord webhook-логи разных категорий в админке;
- Redis rate limiting; реальная CSP с nonce (если решим оплатить динамикой всех страниц).

## npm audit

На момент сдачи: **0 уязвимостей** (`npm audit`). После любых обновлений зависимостей повторите:

```bash
npm audit
npm audit fix
```

## Полезные команды

```bash
npm run dev            # разработка
npm run build          # production-сборка
npm start              # production-сервер
npm run lint           # ESLint
npm run db:migrate     # prisma migrate dev (разработка)
npm run db:deploy      # prisma migrate deploy (production/CI)
npm run db:seed        # начальные данные (идемпотентно)
npm run db:studio      # Prisma Studio
```

## Кредиты

Проект DEWORLD — автор [DENDOR](https://de-world.net). «Minecraft» — товарный знак Mojang Studios.
Код распространяется по лицензии владельца проекта; ассеты — собственность DEWORLD/DENDOR.
