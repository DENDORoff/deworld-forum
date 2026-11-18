import Link from "next/link";
import type { Metadata } from "next";
import { Suspense } from "react";
import { redirect } from "next/navigation";

import { getServerSession } from "@/lib/server-auth";
import { Logo } from "@/components/logo";
import { SignUpForm } from "@/components/auth/signup-form";
import { OAuthButtons } from "@/components/auth/oauth-buttons";

export const metadata: Metadata = {
  title: "Регистрация",
  description:
    "Создайте аккаунт DEWORLD за минуту: форум, чат, достижения и привязка Minecraft.",
  robots: { index: false, follow: false },
};

export default function SignUpPage() {
  return (
    <Suspense fallback={<AuthSkeleton />}>
      <SignUpContent />
    </Suspense>
  );
}

async function SignUpContent() {
  const session = await getServerSession();
  if (session?.user) redirect("/forum");

  return (
    <section className="mx-auto grid max-w-6xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-16">
      <div className="lg:col-span-5">
        <Logo />
        <h1 className="mt-6 font-display text-3xl leading-tight text-stone-900">
          Присоединяйтесь к DEWORLD
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-stone-600">
          Аккаунт открывает форум, общий чат, достижения и премиум-раздел. Никакого спама —
          только игровые новости и жизнь сообщества.
        </p>
        <ul className="mt-6 space-y-2 text-sm text-stone-600">
          <li>• Форум: темы, ответы, решения, рейтинг</li>
          <li>• Привязка Minecraft-ника и игровая статистика</li>
          <li>• Достижения на форуме и в игре</li>
          <li>• Премиум-подписка с закрытым разделом</li>
        </ul>
        <p className="mt-8 text-sm text-stone-500">
          Уже есть аккаунт?{" "}
          <Link href="/signin" className="font-semibold text-orange-700 hover:underline">
            Войдите
          </Link>
        </p>
      </div>

      <div className="mt-8 lg:col-span-6 lg:col-start-7 lg:mt-0">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-lg shadow-orange-100/40 sm:p-8">
          <SignUpForm />
          <div className="mt-6">
            <OAuthButtons callbackUrl="/forum" />
          </div>
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
        </div>
        <div className="lg:col-span-6 lg:col-start-7">
          <div className="skeleton h-96 w-full rounded-2xl" />
        </div>
      </div>
    </div>
  );
}
