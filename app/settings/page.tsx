import Link from "next/link";
import { Suspense } from "react";
import type { Metadata } from "next";
import { redirect } from "next/navigation";
import { KeyRound, ShieldCheck, Sword, UserRound, Trash2, UserCog } from "lucide-react";
import QRCode from "qrcode";

import { getServerSession } from "@/lib/server-auth";
import { prisma } from "@/lib/db";
import { limboAuthEnabled } from "@/lib/limboauth";
import { totpKeyUri } from "@/lib/totp";
import { ProfileForm, UsernameForm, PasswordForm } from "@/components/settings/profile-form";
import { TotpSection } from "@/components/settings/totp-section";
import { MinecraftSection } from "@/components/settings/minecraft-section";
import { DangerZone } from "@/components/settings/danger-zone";

export const metadata: Metadata = {
  title: "Настройки аккаунта",
  description: "Профиль, пароль, двухфакторная аутентификация, привязка Minecraft и удаление аккаунта.",
  robots: { index: false, follow: false },
};

const SECTIONS = [
  { id: "profile", label: "Профиль", icon: UserRound },
  { id: "login", label: "Логин и пароль", icon: KeyRound },
  { id: "security", label: "Двухфакторная аутентификация", icon: ShieldCheck },
  { id: "minecraft", label: "Minecraft-аккаунт", icon: Sword },
  { id: "danger", label: "Опасная зона", icon: Trash2 },
] as const;

export default function SettingsPage() {
  return (
    <Suspense fallback={<SettingsSkeleton />}>
      <SettingsContent />
    </Suspense>
  );
}

async function SettingsContent() {
  const session = await getServerSession();
  if (!session?.user?.id) redirect("/signin?callbackUrl=/settings");

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: {
      name: true,
      username: true,
      image: true,
      email: true,
      totpEnabled: true,
      totpSecret: true,
      minecraftUsername: true,
      createdAt: true,
    },
  });
  if (!user) redirect("/api/auth/signout");

  // QR-код показываем только на шаге подтверждения (секрет есть, 2FA ещё не включена)
  let qrDataUrl: string | null = null;
  let manualSecret: string | null = null;
  if (!user.totpEnabled && user.totpSecret) {
    const account = user.email ?? user.username ?? session.user.id;
    manualSecret = user.totpSecret;
    qrDataUrl = await QRCode.toDataURL(totpKeyUri(user.totpSecret, account), {
      margin: 1,
      width: 180,
    });
  }

  return (
    <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
      <p className="flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.2em] text-orange-600">
        <UserCog size={14} aria-hidden /> Аккаунт
      </p>
      <h1 className="mt-2 font-display text-2xl text-stone-900 sm:text-3xl">
        Настройки профиля
      </h1>

      <div className="mt-8 grid gap-10 lg:grid-cols-12">
        {/* Якорная навигация */}
        <nav aria-label="Разделы настроек" className="lg:col-span-3">
          <ul className="flex gap-2 overflow-x-auto pb-1 lg:sticky lg:top-20 lg:flex-col lg:overflow-visible">
            {SECTIONS.map((section) => (
              <li key={section.id} className="shrink-0">
                <a
                  href={`#${section.id}`}
                  className="focus-ring flex items-center gap-2 whitespace-nowrap rounded-xl px-4 py-2.5 text-sm font-medium text-stone-600 transition-colors hover:bg-orange-50 hover:text-orange-900"
                >
                  <section.icon size={16} aria-hidden />
                  {section.label}
                </a>
              </li>
            ))}
          </ul>
          <Link
            href={user.username ? `/profile/${user.username}` : "/profile"}
            className="focus-ring mt-4 hidden rounded-xl border border-orange-100 bg-orange-50/50 px-4 py-3 text-sm font-semibold text-orange-900 transition-colors hover:bg-orange-50 lg:block"
          >
            Открыть мой профиль →
          </Link>
        </nav>

        {/* Секции */}
        <div className="space-y-8 lg:col-span-9">
          <section id="profile" aria-labelledby="profile-heading" className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 id="profile-heading" className="font-display text-lg text-stone-900">
              Профиль
            </h2>
            <div className="mt-4">
              <ProfileForm defaultName={user.name ?? ""} defaultImage={user.image ?? ""} />
            </div>
          </section>

          <section id="login" aria-labelledby="login-heading" className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 id="login-heading" className="font-display text-lg text-stone-900">
              Логин и пароль
            </h2>
            <div className="mt-4 space-y-8">
              <UsernameForm defaultUsername={user.username ?? ""} />
              <div className="border-t border-stone-100 pt-6">
                <PasswordForm />
              </div>
            </div>
          </section>

          <section id="security" aria-labelledby="security-heading" className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 id="security-heading" className="font-display text-lg text-stone-900">
              Двухфакторная аутентификация
            </h2>
            <div className="mt-4">
              <TotpSection totpEnabled={user.totpEnabled} qrDataUrl={qrDataUrl} manualSecret={manualSecret} />
            </div>
          </section>

          <section id="minecraft" aria-labelledby="minecraft-heading" className="scroll-mt-24 rounded-2xl border border-orange-100 bg-white p-6 shadow-sm">
            <h2 id="minecraft-heading" className="font-display text-lg text-stone-900">
              Minecraft-аккаунт
            </h2>
            <div className="mt-4">
              <MinecraftSection enabled={limboAuthEnabled()} minecraftUsername={user.minecraftUsername} />
            </div>
          </section>

          <section id="danger" aria-labelledby="danger-heading" className="scroll-mt-24 rounded-2xl border border-red-200 bg-red-50/40 p-6">
            <h2 id="danger-heading" className="font-display text-lg text-red-900">
              Опасная зона
            </h2>
            <div className="mt-4">
              <DangerZone />
            </div>
          </section>
        </div>
      </div>
    </section>
  );
}

function SettingsSkeleton() {
  return (
    <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6" aria-hidden>
      <div className="skeleton h-8 w-56" />
      <div className="mt-6 grid gap-6 lg:grid-cols-12">
        <div className="skeleton h-48 lg:col-span-3" />
        <div className="space-y-4 lg:col-span-9">
          <div className="skeleton h-44" />
          <div className="skeleton h-64" />
          <div className="skeleton h-44" />
        </div>
      </div>
    </div>
  );
}
