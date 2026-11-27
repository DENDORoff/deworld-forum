import Link from "next/link";
import type { Metadata } from "next";

import { Logo } from "@/components/logo";
import { ForgotPasswordForm } from "@/components/auth/forgot-form";

export const metadata: Metadata = {
  title: "Восстановление пароля",
  description: "Запросите ссылку для сброса пароля DEWORLD — письмо придёт на email.",
  robots: { index: false, follow: false },
};

export default function ForgotPasswordPage() {
  return (
    <section className="mx-auto grid max-w-6xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-16">
      <div className="min-w-0 lg:col-span-5">
        <Logo />
        <h1 className="mt-6 font-display text-3xl leading-tight text-stone-900">
          Забыли пароль?
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-stone-600">
          Укажите почту, привязанную к аккаунту, — вышлем ссылку для сброса. Ссылка живёт 1 час.
          Если писем нет, проверьте «Спам» или войдите через соцсеть / Minecraft.
        </p>
        <p className="mt-8 text-sm text-stone-500">
          <Link href="/signin" className="font-semibold text-orange-700 hover:underline">
            ← Вернуться ко входу
          </Link>
        </p>
      </div>
      <div className="mt-8 min-w-0 lg:col-span-6 lg:col-start-7 lg:mt-0">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-lg shadow-orange-100/40 sm:p-8">
          <ForgotPasswordForm />
        </div>
      </div>
    </section>
  );
}
