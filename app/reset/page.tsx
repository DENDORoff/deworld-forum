import Link from "next/link";
import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createHash } from "node:crypto";

import { Logo } from "@/components/logo";
import { ResetPasswordForm } from "@/components/auth/reset-form";
import { prisma } from "@/lib/db";

export const metadata: Metadata = {
  title: "Новый пароль",
  description: "Установите новый пароль для аккаунта DEWORLD.",
  robots: { index: false, follow: false },
};

export default function ResetPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  return (
    <Suspense fallback={<ResetSkeleton />}>
      <ResetContent searchParams={searchParams} />
    </Suspense>
  );
}

async function ResetContent({
  searchParams,
}: {
  searchParams: Promise<{ token?: string }>;
}) {
  const { token } = await searchParams;
  if (!token) notFound();

  const tokenHash = createHash("sha256").update(token).digest("hex");
  const entry = await prisma.verificationToken.findFirst({
    where: { token: tokenHash, expires: { gt: new Date() } },
    select: { identifier: true },
  });

  if (!entry) {
    return (
      <section className="mx-auto max-w-lg px-4 py-20 text-center sm:px-6">
        <Logo className="mx-auto w-fit" />
        <h1 className="mt-6 font-display text-2xl text-stone-900">Ссылка недействительна</h1>
        <p className="mt-2 text-stone-600">
          Она устарела или уже была использована. Запросите новую.
        </p>
        <Link
          href="/forgot"
          className="focus-ring mt-6 inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 font-semibold text-white hover:bg-orange-600"
        >
          Запросить сброс снова
        </Link>
      </section>
    );
  }

  return (
    <section className="mx-auto grid max-w-6xl gap-0 px-4 py-10 sm:px-6 lg:grid-cols-12 lg:py-16">
      <div className="lg:col-span-5">
        <Logo />
        <h1 className="mt-6 font-display text-3xl leading-tight text-stone-900">
          Новый пароль
        </h1>
        <p className="mt-3 max-w-md leading-relaxed text-stone-600">
          Придумайте крепкий пароль: не короче 8 символов, с буквами и цифрами. Лучше — уникальный,
          нигде больше не используемый.
        </p>
      </div>
      <div className="mt-8 lg:col-span-6 lg:col-start-7 lg:mt-0">
        <div className="rounded-2xl border border-orange-100 bg-white p-6 shadow-lg shadow-orange-100/40 sm:p-8">
          <ResetPasswordForm token={token} />
        </div>
      </div>
    </section>
  );
}

function ResetSkeleton() {
  return (
    <div className="mx-auto max-w-lg px-4 py-16 sm:px-6" aria-hidden>
      <div className="skeleton h-10 w-48" />
      <div className="skeleton mt-6 h-64 rounded-2xl" />
    </div>
  );
}
