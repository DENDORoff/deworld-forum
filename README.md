# DEWORLD — форум и сайт проекта

> Всё ещё Minecraft, просто лучше.

Сайт-лендинг и форум Minecraft-проекта **DEWORLD** (de-world.net): лендинг с живым статусом
сервера, форум с разделами и темами, регистрация и вход (email, Google, GitHub, Discord, VK,
Minecraft по LimboAuth), 2FA, роли, премиум-подписка, админ-панель для редактирования контента,
юридические страницы и GDPR/152-ФЗ-инструменты (удаление аккаунта, экспорт, cookie-баннер).

## Стек

- **Next.js 16** (App Router, Cache Components / Partial Prerendering) + **React 19** + **TypeScript**
- **Tailwind CSS v4** (`@tailwindcss/postcss` в `postcss.config.mjs` — обязателен и для webpack-сборки, и для Turbopack), шрифты Rubik и Russo One (загружаются с нашего сервера)
- **Prisma 7** (драйвер-адаптер `@prisma/adapter-pg`, генератор `prisma-client`) + **PostgreSQL**
  - production: **[Neon](https://neon.tech)** (serverless Postgres)
  - локальная разработка: любой PostgreSQL (в проекте использовался PostgreSQL 17)
- **Auth.js (NextAuth v5)** — JWT-сессии, OAuth-провайдеры, Credentials + LimboAuth
- **Node 26**

> ⚠️ Production-сборка — через **webpack** (`next build --webpack`): у Turbopack отдельный
> технический баг (`generate_source_map was canceled`) на нашей сборке. Dev-сервер
> (`next dev`) работает на Turbopack по-прежнему.

## Что реализовано

**Лендинг (`/`)**
- Липкая шапка с навигацией и состоянием входа/премиума
- Hero с воксельной графикой DEWORLD и CTA
- Живой статус сервера по Server List Ping (MOTD, онлайн, версия, пинг) — `/api/server-status`, кэш 45 с
- Статистика сообщества (участники, темы, сообщения) из БД
- **Живая статистика**: текущий онлайн, пользователи онлайн, уникальные посетители суток (включая неавторизованных), всего посетителей и список никнеймов (лимит 12). Данные приходят с `/api/presence`, обновляются heartbeat раз в минуту; анонимный `dw_vid` ставится только после согласия на аналитические Cookie
- Карточка Discord-сервера с официальным Server Widget (iframe `discord.com/widget`, тема light/dark); ID из env или из публичного invite-эндпоинта через `/api/discord-widget`, кэш 6 ч; без ID — аккуратный fallback с CTA
- Карусель видео YouTube-канала (через RSS, без API-ключей — `/api/youtube`, кэш 30 мин)
- FAQ-аккордеон, анонс из админки, SEO (OG, JSON-LD, sitemap.xml, robots.txt, manifest)

**Форум (`/forum`)**
- Разделы, темы, ответы; slug'и из транслитерированного заголовка (`/forum/topic/sezon-3-…`)
- Закрепление/закрытие тем, лайки, «ответ» как решение обсуждения, счётчик просмотров
- Премиум-раздел «Премиум-клуб» (доступ по подписке), прем-темы
- Поиск по темам (`/forum/search`), пагинация, пустой-стейт, скелетоны вместо спинеров
- Система жалоб: кнопка «Пожаловаться» под темами/ответами, модерация в `/admin/reports`

**Аккаунты**
- Регистрация/вход по email+паролю (bcrypt), OAuth: Google / GitHub / Discord / VK (env-gated)
- Вход ником Minecraft по паролю LimboAuth (сверка по БД LimboAuth; опционально, `LIMBOAUTH_DATABASE_URL`)
- **2FA (TOTP)**: подключение по QR-коду, код запрашивается при входе
- Привязка соцсетей в `/settings`: кнопки «Привязать/Отвязать», статус и защита от отвязки последнего способа входа. Привязка возможна только из авторизованной сессии по подписанному намерению; email провайдера никогда не связывает аккаунты автоматически. Привязка Minecraft-ника — в отдельном разделе настроек
- Аватар по скину: после привязки ника аватар автоматически становится головой скина
  ([mc-heads.net](https://mc-heads.net), без API-ключей); если задано своё изображение — оно сохраняется.
  Кнопка «Обновить аватар по скину» обновляет голову после смены скина; при недоступности картинки
  показываются инициалы. Отвязка ника удаляет только скин-аватар.
- Восстановление пароля по email-токену (1 час, письма только при настроенном SMTP)
- **Тема оформления** в `/settings`: системная / светлая / тёмная. Палитры разделены на уровне CSS-токенов Tailwind; выбор хранится в localStorage и применяется до первой отрисовки
- Роли: `USER` < `MODERATOR` < `ADMIN`; премиум-флаг `premiumUntil`
- **Cloudflare Turnstile** на регистрации/входе/восстановлении (тестовые ключи в коде; для production задайте `NEXT_PUBLIC_TURNSTILE_SITE_KEY` + `TURNSTILE_SECRET_KEY`)

**Уведомления**
- Внутренние: колокольчик в шапке (счётчик, последние события), страница `/notifications`,
  авто-уведомление автору темы об ответе, о решении его ответа, упоминание `@ник`
- Email (при настроенном SMTP): ответ в вашей теме, «ответ принят», упоминание
- Дублирование важных событий в Discord/Telegram-ботов (см. ниже)

**Админка (`/admin`, MODERATOR/ADMIN)**
- Обзор статистики, аудит-лог действий
- Разделы форума: создание/изменение/удаление/порядок/премиум-флаг
- Темы: модерация (закрепить/закрыть/удалить)
- Пользователи: поиск, роли, выдача/отзыв премиума
- **Жалобы**: просмотр, «в работу → решено/отклонено»
- **Контент сайта без релиза**: навигация в шапке, колонки и слоган футера, реквизиты оператора (152-ФЗ)
- **Боты для логов**: Discord (текстовые и форум-каналы) и Telegram (группы с топиками),
  редактируемые шаблоны сообщений с плейсхолдерами (`{user}`, `{target}`, `{target_url}`, `{site}`, `{date}`, `{user_url}`),
  живое превью в админке, тестовая отправка
- Настройки сайта: анонс, подпись цены и преимущества премиума

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

Сделано (подробности в PR просит): репозиторий **github.com/DENDORoff/deworld-forum**, проект Vercel `deworld-forum` (production URL: https://deworld-forum.vercel.app), Neon-проект `deworld-forum` (eu-central-1, branch `production`). Production-ветка `master`.

Что сделано:
1. Neon: проект создан в регионе Europe Central 1 (Frankfurt), `neon init`, `neon env pull` → `DATABASE_URL`/`DATABASE_URL_UNPOOLED`.
2. Применены миграции (`20261119000000_init`, `20261119194649_notifications`, `20261127211828_visitor_stats`), выполнен seed (разделы, достижения, настройки, администратор).
3. Vercel: проект `deworld-forum`, env-переменные залиты через CLI, production задеплоен, алиас `deworld-forum.vercel.app`. Production открыт публично; превью-деплои закрыты Vercel Authentication.
4. **Домен `de-world.net` добавлен в проект, но ждёт DNS**: на DNS-провайдере пропишите записи (ниже) и дождитесь верификации — Vercel сам выпустит SSL.
5. ⚠️ **Инициализация БД**: для production БД сид выполнен. Продовый пароль администратора — `bYaayt3JunNC`, **смените его сразу** в `/settings` → «Логин и пароль».

### DNS для de-world.net

| Тип | Имя | Значение |
|---|---|---|
| A | `@` | `76.76.21.21` |
| CNAME | `www` | `cname.vercel-dns.com` |
| TXT | `_vercel` | `vc-domain-verify=de-world.net,995817e57fe329e8c4f9` |
| TXT | `_vercel` | `vc-domain-verify=www.de-world.net,4133388169c6844887eb` |

После верификации и выпуска SSL всё заработает на `de-world.net`.

### Как деплоить дальше

```bash
# Токен Vercel CLI: npx vercel login (или заведите VERCEL_TOKEN)
git push                              # код на GitHub (repo уже привязан к Vercel через Git Integration)
npx vercel deploy --prod --yes --token <token>
```

После добавления домена и привязки репозитория к проекту в Vercel каждый push в `master` будет деплоиться автоматически.

### Переменные окружения

| Переменная | Назначение | Обязательна |
|---|---|---|
| `DATABASE_URL` | PostgreSQL (Neon pooled) | ✓ |
| `DATABASE_URL_UNPOOLED` | PostgreSQL (Neon, direct — для миграций) | опционально |
| `AUTH_SECRET` | подпись JWT/сессий | ✓ |
| `AUTH_URL` | базовый URL (OAuth callback) | ✓ в prod |
| `NEXT_PUBLIC_SITE_URL` | канонический URL (sitemap/OG) | recommended |
| `AUTH_GOOGLE_ID` / `AUTH_GOOGLE_SECRET` | вход через Google | опционально |
| `AUTH_GITHUB_ID` / `AUTH_GITHUB_SECRET` | вход через GitHub | опционально |
| `AUTH_DISCORD_ID` / `AUTH_DISCORD_SECRET` | вход через Discord (+sync профиля) | опционально |
| `AUTH_VK_ID` / `AUTH_VK_SECRET` | вход через ВКонтакте (oauth.vk.com) | опционально |
| `LIMBOAUTH_DATABASE_URL` | отдельный пул к БД LimboAuth (вход по нику/паролю) | опционально |
| `LIMBOAUTH_TABLE` / `..._USERNAME_COLUMN` / `..._PASSWORD_COLUMN` / `..._ID_COLUMN` | имена таблицы/колонок LimboAuth (по умолчанию `limboauth`, `name`, `password`, `id`) | опционально |
| `MINECRAFT_HOST` / `MINECRAFT_PORT` (или `MINECRAFT_SERVER_HOST` / `MINECRAFT_SERVER_PORT`) | виджет статуса; поддерживается формат `host:port` | по умолчанию `mc.de-world.net:30077` (порт из SRV; 25565 не работает) |
| `NEXT_PUBLIC_DISCORD_INVITE` | ссылка-инвайт в Discord (используется для CTA и для получения ID) | ✓ (иначе показывается заглушка) |
| `NEXT_PUBLIC_DISCORD_GUILD_ID` | цифровой ID сервера для официального виджета `discord.com/widget` | опционально (иначе ID берётся из инвайта) |
| `NEXT_PUBLIC_DISCORD_WIDGET_THEME` | тема виджета: `light` или `dark` | нет (по умолчанию `light`) |
| `NEXT_PUBLIC_YOUTUBE_CHANNEL_ID` / `NEXT_PUBLIC_YOUTUBE_PLAYLIST_ID` (или без `NEXT_PUBLIC_`) | RSS-лента для карусели видео (достаточно одного ID) | по умолчанию канал DENDOR/DEWORLD `@deworld_ru` (`UCnPHpCrXyRREynAUPcYnqqA`) |
| `RATE_LIMIT_ENABLED` | вкл/выкл лимиты запросов (`true`/`false`) | `true` |
| `ADMIN_EMAIL` | email администратора при `prisma db seed` | нет (default admin@de-world.net) |
| `ADMIN_PASSWORD` | пароль администратора при `prisma db seed` | нет (иначе сгенерируется и напечатается) |

> Пингер учитывает SRV `_minecraft._tcp.<host>`: у `mc.de-world.net` он указывает на порт
> `30077`, поэтому старое значение `25565` больше не показывает сервер оффлайн. YouTube-карусель
> по умолчанию читает RSS канала `@deworld_ru` (DENDOR); если лента недоступна или канал не задан,
> ссылка ведёт на конкретный канал, а не на главную YouTube.

OAuth-кнопки (вход и привязка в настройках) видны только для провайдеров, у которых заполнены ключи (`AUTH_*_ID`). Для каждого сервиса зарегистрируйте callback `https://<домен>/api/auth/callback/<провайдер>`. Привязка соцсети к существующему аккаунту идёт через авторизованную сессию и подписанное httpOnly-намерение; отвязка блокируется, если не остаётся пароля, Minecraft-ника или другого OAuth-аккаунта. Токены провайдеров и секреты в UI/логи не выводятся.

> Для Discord-виджета задайте `NEXT_PUBLIC_DISCORD_GUILD_ID` **или** валидную
> `NEXT_PUBLIC_DISCORD_INVITE` (тогда ID сервера определится через публичный API приглашения).
> В настройках Discord включите «Виджет сервера» (Server Widget) — иначе iframe покажет ошибку.
> Если ID получить не удалось, карточка показывает fallback с кнопкой «Присоединиться».

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
