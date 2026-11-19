import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";
import { limboAuthEnabled } from "@/lib/limboauth";
import { Logo } from "@/components/logo";
import { SignInForm } from "@/components/auth/signin-form";
import { MinecraftSignInForm } from "@/components/auth/minecraft-signin-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { SignInTabs } from "@/components/auth/signin-tabs";

export const metadata: Metadata = {
  title: "Вход",
  description: "Войдите в аккаунт DEWORLD — email, соцсети или ник Minecraft.",
  robots: { index: false, follow: false },
};

function safeCallback(raw: string | undefined): string {
  if (raw && raw.startsWith("/") && !raw.startsWith("//")) return raw.slice(0, 256);
  return "/forum";
}

export default function SignInPage({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <SignInContent searchParams={searchParams} />
    </Suspense>
  );
}

async function SignInContent({
  searchParams,
}: {
  searchParams: Promise<{ callbackUrl?: string }>;
}) {
  const session = await getServerSession();
  const { callbackUrl: rawCallback } = await searchParams;
  const callbackUrl = safeCallback(rawCallback);

  if (session?.user) redirect(callbackUrl);

  const minecraftEnabled = limboAuthEnabled();

  return (
    <section className="mx-auto grid max-w-6xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-16">
      {/* Левая колонка — контекст и доверие */}
      <div className="lg:col-span-5">
        <Logo />
        <h1 className="mt-6 font-display text-3xl leading-tight text-stone-900">
          С возвращением в DEWORLD
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-stone-600">
          Войдите, чтобы писать на форуме, получать достижения и привязать Minecraft-ник.
          Данные используем строго по{" "}
          <Link href="/legal/privacy" className="font-semibold text-orange-800 hover:underline">
            политике конфиденциальности
          </Link>
          .
        </p>
        <ul className="mt-6 space-y-2 text-sm text-stone-600">
          <li>• Пароли храните только в виде хэша (bcrypt)</li>
          <li>• Сессии — в httpOnly cookie, CSRF-защита встроена</li>
          <li>• Подключайте 2FA в настройках профиля</li>
        </ul>
        <p className="mt-8 text-sm text-stone-500">
          Нет аккаунта?{" "}
          <Link href="/signup" className="font-semibold text-orange-700 hover:underline">
            Зарегистрируйтесь за минуту
          </Link>
        </p>
      </div>

      {/* Правая колонка — форма */}
      <div className="mt-8 lg:col-span-6 lg:col-start-7 lg:mt-0">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-lg shadow-orange-100/40 sm:p-8">
          <SignInTabs
            minecraftEnabled={minecraftEnabled}
            emailForm={<SignInForm callbackUrl={callbackUrl} />}
            minecraftForm={<MinecraftSignInForm callbackUrl={callbackUrl} />}
          />
          <div className="mt-6">
            <OAuthButtons callbackUrl={callbackUrl} />
          </div>
          <p className="mt-6 text-center text-xs text-stone-500">
            <Link href="/forgot" className="font-semibold text-orange-700 hover:underline">
              Забыли пароль? Восстановите по почте
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

function AuthSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-16 sm:px-6" aria-hidden>
      <div className="grid gap-8 lg:grid-cols-12">
        <div className="lg:col-span-5">
          <div className="skeleton h-10 w-40" />
          <div className="skeleton mt-6 h-12 w-4/5" />
          <div className="skeleton mt-2 h-12 w-3/5" />
          <div className="skeleton mt-4 h-5 w-full" />
          <div className="skeleton mt-2 h-5 w-2/3" />
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="skeleton h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
